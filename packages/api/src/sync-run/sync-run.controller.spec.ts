import { Test } from '@nestjs/testing';

import { SyncRunController } from './sync-run.controller';
import { SyncRunService } from './sync-run.service';
import { PaginationOptionsDto } from '../common';

const syncRunService = {
  paginate: jest.fn()
};

describe('SyncRunController', () => {
  let controller: SyncRunController;
  let service: SyncRunService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SyncRunController],
      providers: [
        {
          provide: SyncRunService,
          useValue: syncRunService
        }
      ]
    }).compile();
    controller = module.get<SyncRunController>(SyncRunController);
    service = module.get<SyncRunService>(SyncRunService);
  });

  it('should correctly call SyncRunService', async () => {
    const paginationOptions: PaginationOptionsDto = {
      limit: 20,
      offset: 20
    };
    await controller.findAll(paginationOptions);
    expect(service.paginate).toHaveBeenCalledWith(paginationOptions);
  });
});
