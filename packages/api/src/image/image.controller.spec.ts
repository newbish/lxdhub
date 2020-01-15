import { Test } from '@nestjs/testing';

import {
  ImageDetailDto,
  ImageListItemDto,
  CloneImageResponseDto
} from './dtos';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { LXDHubAPISettings } from '../main';
import { PaginationResponseDto, ResponseDto } from '../common';

class ImageServiceMock {
  async findByRemote() {}
  async findOne() {}
  async cloneImage() {}
}

class LXDHubAPISettingsMock { }
/**
 * Test cases for the image controller
 */
describe('ImageController', () => {
  let imageController: ImageController;
  let imageService: ImageService;
  let apiSettings: LXDHubAPISettings;

  beforeEach(async () => {
    // Mock Image Module
    const module = await Test.createTestingModule({
      controllers: [ImageController],
      providers: [
        {
          provide: 'ImageService',
          useClass: ImageServiceMock
        },
        {
          provide: 'LXDHubAPISettings',
          useClass: LXDHubAPISettingsMock
        },
      ]
    }).compile();

    // Get the imageController and imageService in the Testing Module Context
    imageController = module.get<ImageController>(ImageController);
    imageService = module.get<ImageService>(ImageService);
    apiSettings = module.get<LXDHubAPISettings>(LXDHubAPISettings);
  });

  describe('findByRemote', () => {
    /**
     * Request images per remote
     */
    it('should return ImageListItems by remote', async () => {
      const result: ImageListItemDto[] = [
        {
          fingerprint: 'fingerprint1',
          description: 'desc1',
          uploadedAt: new Date(),
          id: 1,
          _links: {
            detail: 'http://localhost:3000/api/v1/image/fingerprint1'
          }
        },
        {
          fingerprint: 'fingerprint2',
          description: 'desc2',
          uploadedAt: new Date(),
          id: 2,
          _links: {
            detail: 'http://localhost:3000/api/v1/image/fingerprint2'
          }
        }
      ];

      const response = new PaginationResponseDto(result, result.length, {
        limit: 20,
        offset: 0
      });

      jest
        .spyOn(imageService, 'findByRemote')
        .mockImplementation(() => Promise.resolve(response));
      expect(
        await imageController.findByRemote({
          limit: 20,
          offset: 0,
          remote: 'Test'
        })
      ).toBe(response);
    });
  });

  describe('findOne', () => {
    it('should return ImageDetail', async () => {
      const result = {
        fingerprint: 'fingerprint1',
        description: 'desc1',
        uploadedAt: new Date(),
        id: 1,
        aliases: [{ description: '', name: '' }],
        architecture: { humanName: '', processorName: '' },
        autoUpdate: true,
        expiresAt: new Date(),
        label: '',
        lastUsedAt: new Date(),
        operatingSystem: { distribution: '', release: '', version: '' },
        serial: '',
        createdAt: new Date(),
        public: true,
        remotes: [
          { available: true, cloneable: false, id: 1, name: 'remote1' }
        ],
        cloneable: false
      };
      const response = new ResponseDto(result as ImageDetailDto);

      jest
        .spyOn(imageService, 'findOne')
        .mockImplementation(() => Promise.resolve(response));

      expect(await imageController.findOne('fingerprint1')).toBe(response);
    });
  });

  describe('clone', () => {
    it('should clone an image', async () => {
      const result = new ResponseDto({ uuid: 'test' } as CloneImageResponseDto);

      jest
        .spyOn(imageService, 'cloneImage')
        .mockImplementation(() => Promise.resolve(result));

      expect(
        await imageController.clone(1, {
          sourceRemoteId: 1,
          destinationRemoteId: 2
        })
      ).toBe(result);
      expect(imageService.cloneImage).toHaveBeenCalledWith(1, {
        sourceRemoteId: 1,
        destinationRemoteId: 2
      });
    });
  });
});
