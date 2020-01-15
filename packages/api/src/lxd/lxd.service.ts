import { Agent, AgentOptions } from 'https';
import { Image, Remote } from '@lxdhub/db';
import {
  Injectable,
  Inject,
  InternalServerErrorException,
  ConflictException
} from '@nestjs/common';
import Axios, { AxiosInstance } from 'axios';

import { LXDHubAPISettings } from '..';
import { SourceImageFactory } from './factories';
import { LogService } from '../log';
import { AxiosToken } from '../third-party';

@Injectable()
export class LXDService {
  private logger: LogService;
  constructor(
    @Inject(AxiosToken)
    private readonly axios: typeof Axios,
    private sourceImageFactory: SourceImageFactory,
    @Inject('LXDHubAPISettings')
    private settings: LXDHubAPISettings
  ) {
    this.logger = new LogService(this.constructor.name);
  }

  private getAxiosHttpsInstance(): AxiosInstance {
    const options: AgentOptions = {
      rejectUnauthorized: false
    };

    if (this.settings.lxd) {
      if (this.settings.lxd.key) {
        options.key = this.settings.lxd.key;
      }
      if (this.settings.lxd.cert) {
        options.cert = this.settings.lxd.cert;
      }
    }

    return this.axios.create({
      httpsAgent: new Agent(options)
    });
  }

  /**
   * Requests a new image on the given remote
   * @param url The url to which the image should be request
   * @param sourceImageDto The image
   */
  private async requestNewImage(url: string, sourceImageDto) {
    const axios = this.getAxiosHttpsInstance();
    return (await axios.post(url, sourceImageDto)).data;
  }

  /**
   * Waits for the given operation to end
   * @param url The operation url
   */
  private async waitForOperation(url) {
    const axios = this.getAxiosHttpsInstance();
    return (await axios.get(url)).data;
  }

  /**
   * Clones the image from the given sourceRemote to the given destinationRemote
   * @param image The image to be cloned
   * @param sourceRemote The source remote, from which the images comes from
   * @param destinationRemote The destination Remote
   */
  async cloneImage(
    image: Image,
    sourceRemote: Remote,
    destinationRemote: Remote
  ): Promise<string> {
    const sourceImageDto = this.sourceImageFactory.entityToDto(
      image,
      sourceRemote,
      destinationRemote
    );
    const url = destinationRemote.serverUrl;

    // Start operation
    try {
      const operation = await this.requestNewImage(
        `${url}/1.0/images`,
        sourceImageDto
      );
      // The operation uuid
      return operation.metadata.id;
    } catch (err) {
      if (err && err.error_code === 403) {
        throw new InternalServerErrorException(
          'Server certificate is not valid. Contact a server administrator'
        );
      }
      if (err && err.error_code === 500) {
        throw new InternalServerErrorException(
          'The destination LXD remote is not reachable'
        );
      }
      throw err;
    }
  }

  /**
   * Waits for the clone operation and returns the result
   * @param destinationRemote The destination remote
   * @param operation The operation UUID from the LXD server
   */
  async wait(remote: string, operation: string) {
    return await this.waitForOperation(
      `${remote}/1.0/operations/${operation}/wait`
    );
  }

  /**
   * Adds an image to a any given remote
   * @param image The image binary data
   * @param remote The remote to add the image to (format: https://localhost:8334)
   */
  async importImage(remote: string, image: any) {
    const axios = this.getAxiosHttpsInstance();
    const { data: { operation } } = (await axios.post(`${remote}/1.0/images`, image.buffer, {
      headers: {
        'X-LXD-Public': '1',
      },
      maxContentLength: Infinity
    }));

    const result = (await axios.get(`${remote}/${operation}/wait`)).data;
    if (
      result &&
      result.metadata &&
      result.metadata.status &&
      result.metadata.status === 'Failure'
    ) {
      if (
        result.metadata.err &&
        result.metadata.err.includes('fingerprint already exists')
      ) {
        // image already exists
        throw new ConflictException(
          result.metadata.err
        );
      }
      throw new InternalServerErrorException(result.metadata.err);
    }

    return result.metadata.metadata.fingerprint;
  }

  /**
   * Tags an image with some aliases
   * @param remote The remote to add the aliases to (format: https://localhost:8334)
   * @param fingerprint The SHA-fingerprint of the image to add the alias to
   * @param aliases The aliases to add
   * @param force Wether to overwrite already existing aliases
   */
  async addImageAlias(remote: string, fingerprint: string, aliases: string[], force = false) {
    const axios = this.getAxiosHttpsInstance();

    const existingAliases = (await axios.get(`${remote}/1.0/images/aliases`)).data.metadata;
    const [newAliases, conflictingAliases] = [[], []];

    for (const alias of aliases) {
      const exists = existingAliases.some((existingAlias) =>
        existingAlias.endsWith(alias)
      );
      if (exists) {
        conflictingAliases.push(alias);
      } else {
        newAliases.push(alias);
      }
    }

    if (conflictingAliases.length) {
      if (!force) {
        throw new ConflictException(
          `Aliases ${conflictingAliases.join(',')} already exist`
        );
      } else {
        // overwrite aliases
        await Promise.all(conflictingAliases.map((alias: string) => axios.put(
          `${remote}/1.0/images/aliases/${alias}`,
          {
            description: `Alias ${alias} for ${fingerprint}`,
            target: fingerprint,
          }
        )));
      }
    }

    // add new aliases
    await Promise.all(newAliases.map((alias: string) => axios.post(
      `${remote}/1.0/images/aliases`,
      {
        description: `Alias ${alias} for ${fingerprint}`,
        target: fingerprint,
        name: alias
      }
    )));
  }
}
