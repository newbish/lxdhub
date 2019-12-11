import { Controller, Query, ValidationPipe, Get, Inject } from '@nestjs/common';
import { PaginationOptionsDto } from '../common';
import { SyncRunService } from './sync-run.service';
import { SyncRunListResponseDto } from './dtos';
import { ApiResponse } from '@nestjs/swagger';

@Controller('/api/v1/sync-run')
export class SyncRunController {
  constructor(
    @Inject('SyncRunService')
    private readonly syncRunService: SyncRunService) {}

  @Get('/')
  @ApiResponse({ status: 200, description: 'The sync runs have been successfully request' })
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    paginate: PaginationOptionsDto
  ): Promise<SyncRunListResponseDto> {
    return await this.syncRunService.paginate(paginate);
  }
}
