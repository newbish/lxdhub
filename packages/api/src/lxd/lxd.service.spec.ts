import { Image, Remote } from '@lxdhub/db';
import { Test } from '@nestjs/testing';

import { LXDHubAPISettings } from '..';
import { SourceImageFactory } from './factories';
import { LXDService } from './lxd.service';
import { AxiosToken } from '../third-party';
import Axios from 'axios';
import { Agent } from 'https';

class SourceImageFactoryMock {
  entityToDto() {}
}

class AxiosRequestMock {
  get() {}
  post() {}
}
class AxiosMock {
  create() {
    return new AxiosRequestMock();
  }
}

const keyBuffer = new Buffer('key');
const certBuffer = new Buffer('cert');

const settings: LXDHubAPISettings = {
  lxd: {
    key: keyBuffer,
    cert: certBuffer
  },
  database: {
    database: '',
    host: '',
    password: '',
    port: 3000,
    username: ''
  }
} as LXDHubAPISettings;

/**
 * Test cases for the remote service
 */
describe('LXDService', () => {
  let lxdService: LXDService;
  let sourceImageFactory: SourceImageFactory;
  let axios: typeof Axios;

  beforeEach(async done => {
    // Mock Remote Module
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: 'LXDHubAPISettings',
          useFactory: () => settings
        },
        LXDService,
        {
          provide: 'SourceImageFactory',
          useClass: SourceImageFactoryMock
        },
        {
          provide: AxiosToken,
          useClass: AxiosMock
        }
      ]
    }).compile();

    // Get the lxdService in the Testing Module Context
    lxdService = module.get<LXDService>(LXDService);
    sourceImageFactory = module.get<SourceImageFactory>(SourceImageFactory);
    axios = module.get<typeof Axios>(AxiosToken);
    done();
  });
  let image: Image;
  let remote1: Remote;
  let remote2: Remote;
  let sourceImageMock;
  beforeEach(() => {
    image = new Image();
    remote1 = new Remote();
    remote2 = new Remote();
    remote2.serverUrl = 'https://destination.com';
    sourceImageMock = {};
  });

  describe('cloneImage', () => {
    it('should correctly call the sourceimage factory ', async () => {
      const axiosRequest = new AxiosRequestMock();
      jest
        .spyOn(sourceImageFactory, 'entityToDto')
        .mockImplementation(() => sourceImageMock);
      jest.spyOn(axios, 'create').mockImplementation(() => axiosRequest as any);
      jest
        .spyOn(axiosRequest, 'post')
        .mockImplementation(() =>
          Promise.resolve({ data: { metadata: { id: '/1' } } })
        );

      await lxdService.cloneImage(image, remote1, remote2);
      expect(axiosRequest.post).toHaveBeenCalledWith(
        'https://destination.com/1.0/images', sourceImageMock,
      );
      expect(sourceImageFactory.entityToDto).toHaveBeenCalledWith(
        image,
        remote1,
        remote2
      );
    });
  });

  describe('wait', () => {
    it('should correctly create requests ', async () => {
      const axiosRequest = new AxiosRequestMock();
      jest.spyOn(axios, 'create').mockImplementation(() => axiosRequest as any);
      jest
        .spyOn(axiosRequest, 'post')
        .mockImplementation(() =>
          Promise.resolve({ data: { metadata: { id: '/1' } } })
        );
      jest
        .spyOn(axiosRequest, 'get')
        .mockImplementation(() => Promise.resolve({}));

      await lxdService.wait(
        'https://destination.com',
        '1'
      );
      expect(axiosRequest.get).toHaveBeenCalledWith(
        'https://destination.com/1.0/operations/1/wait'
      );
    });
  });
});
