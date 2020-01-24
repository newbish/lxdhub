import { Test } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';

import { SyncRun } from '@lxdhub/db';

import { SyncRunService } from './sync-run.service';
import { SyncRunRepository } from './sync-run.repository';
import { PaginationOptionsDto, PaginationResponseDto } from '../common';
import { SyncRunListResponseFactory } from './factories';

const syncRuns = [{ id: 1 }, { id: 2 }];

const syncRunRepositoryMock = {
  paginate: jest.fn(() => [syncRuns, 2])
};

const syncRunFactoryMock = {
  entitiesToDto: jest.fn(() => syncRuns)
};

describe('SyncRunService', () => {
  let service: SyncRunService;
  let repository: SyncRunRepository;
  let factory: SyncRunListResponseFactory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SyncRunService,
        {
          provide: SyncRunListResponseFactory,
          useValue: syncRunFactoryMock
        },
        {
          provide: SyncRunRepository,
          useValue: syncRunRepositoryMock
        }
      ]
    }).compile();

    service = module.get(SyncRunService);
    repository = module.get(SyncRunRepository);
    factory = module.get(SyncRunListResponseFactory);
  });

  it('should call the SyncRunRepository correctly', async () => {
    const paginationOptions: PaginationOptionsDto = {
      limit: 20,
      offset: 20
    };

    const result = await service.paginate(paginationOptions);
    expect(factory.entitiesToDto).toHaveBeenCalledWith(syncRuns);
    expect(repository.paginate).toHaveBeenCalledWith(paginationOptions);
    expect(result).toEqual({
      limit: 20,
      offset: 20,
      results: syncRuns,
      total: 2
    });
  });
});
