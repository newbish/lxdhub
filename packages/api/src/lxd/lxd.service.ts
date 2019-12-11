import { Agent, AgentOptions } from 'https';
import { Image, Remote } from '@lxdhub/db';
import {
  Injectable,
  Inject,
  InternalServerErrorException
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

    if (this.settings.lxd && this.settings.lxd.key) {
      options.key = this.settings.lxd.key;
    }

    if (this.settings.lxd && this.settings.lxd.cert) {
      options.cert = this.settings.lxd.cert;
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

  async importImage(image: any, remote: string) {
    const axios = this.getAxiosHttpsInstance();

    try {
      const data = (await axios.post(`${remote}/1.0/images`, image.buffer, {
        headers: {
          'X-LXD-Public': '1',
        },
        maxContentLength: Infinity
      })).data;

        // wait for the import operation to finish
      return (await axios.get(`${remote}/${data.operation}`)).data;
    } catch (err) {
      console.log(err.stack);
      throw err;
    }
  }

  async addImageAlias(fingerprint: string, aliases: string[]) {

  }
}
