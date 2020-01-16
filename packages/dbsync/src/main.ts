import { Interfaces } from '@lxdhub/common';
import { INestApplication, INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AppService } from './app.service';
import { LXDHubDbSyncSettings } from './dbsync-settings.interface';
import { DatabaseService } from '@lxdhub/db';

/**
 * Represents the LXDHub Database synchronization script.
 * It synchronizes the database with the given remotes.
 */
export class LXDHubDbSync implements Interfaces.ILXDHubService {
  private app: INestApplicationContext;
  private appService: AppService;
  private databaseService: DatabaseService;

  /**
   * Initializes the database synchronization script
   * @param settings The database synchronisation settings
   */
  constructor(private settings: LXDHubDbSyncSettings) {}

  /**
   * Bootstraps the NestJS application
   * and requests the app service
   */
  private async bootstrap() {
    this.app = await NestFactory.createApplicationContext(
      AppModule.forRoot(this.settings)
    );
    this.app.enableShutdownHooks();
    this.databaseService = this.app.get(DatabaseService);
    this.appService = this.app.get(AppService);
  }

  /**
   * Runs the database synchronization task
   */
  async run() {
    await this.bootstrap();
    await this.appService.synchronize();
    await this.databaseService.closeConnection();
  }
}
