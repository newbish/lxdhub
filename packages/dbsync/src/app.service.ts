import { DatabaseService, SyncRun } from '@lxdhub/db';
import {
  Injectable,
  Logger,
  Inject,
  OnApplicationShutdown
} from '@nestjs/common';

import { AliasService } from './alias';
import { ArchitectureService } from './architecture';
import { ImageService } from './image';
import { ImageAvailabilityService } from './image-availability';
import { OperatingSystemService } from './operating-system';
import { OsArchService } from './os-arch';
import { RemoteService } from './remote';
import { SyncRunService } from './sync-run';
import { LXDHubDbSyncSettings } from './dbsync-settings.interface';
import { SETTINGS } from './app.tokens';

@Injectable()
/**
 * The app services orchastrates the database synchronizer
 */
export class AppService implements OnApplicationShutdown {
  private logger: Logger;
  private syncRun?: SyncRun;

  /**
   * Initializes the app service
   */
  constructor(
    private readonly remoteService: RemoteService,
    private readonly operatingSystemService: OperatingSystemService,
    private readonly architectureService: ArchitectureService,
    private readonly imageService: ImageService,
    private readonly aliasService: AliasService,
    private readonly osArchService: OsArchService,
    private readonly imageAvailabilityService: ImageAvailabilityService,
    private readonly databaseService: DatabaseService,
    private readonly syncRunService: SyncRunService,
    @Inject(SETTINGS) private readonly settings: LXDHubDbSyncSettings
  ) {
    this.logger = new Logger('Database Synchronizer');
  }

  private async run() {
    if (this.settings.force) {
      this.syncRunService.resetAllSyncStates();
    } else {
      const currentlyRunningSyncs = await this.syncRunService.getCurrentlyRunningSyncs();

      if (currentlyRunningSyncs.length) {
        const logMessage =
          `There are currently ${
            currentlyRunningSyncs.length
          } other synchronization tasks running.\n` +
          currentlyRunningSyncs
            .map(sync => `- Sync #${sync.id} started at ${sync.started}`)
            .join('\n') +
          `You can enforce this database synchronization run by adding the "FORCE=true" environment variable.`;
        this.logger.error(logMessage);
        throw new Error(logMessage);
      }
    }

    await this.syncRunService.startSyncRun(this.syncRun.id);

    this.logger.log(`==> Started synchronization #${this.syncRun.id}`);

    // Run the synchronizers
    await this.remoteService.synchronize();
    await this.imageService.synchronize();
    await this.operatingSystemService.synchronize();
    await this.architectureService.synchronize();
    await this.aliasService.synchronize();
    await this.osArchService.synchronize();
    await this.imageAvailabilityService.synchronize();
  }

  /**
   * Start the database synchronizer.
   */
  async synchronize() {
    this.syncRun = await this.syncRunService.createSyncRun();
    this.logger.log(
      `==> Starting database synchronization #${this.syncRun.id}`
    );

    /**
     * If we don't handle rejected promises, then tye sync run will
     * crash the node process. We need to fail the sync run
     * otherwise the next syncrun won't start.
     */
    process.on('unhandledRejection', async (reason, promise) => {
      const error = `Unhandled Rejection at: ${promise}, reason: ${reason}`;
      this.logger.error(error);
      // fail the syncrun
      await this.syncRunService.failSyncRun(
        this.syncRun.id,
        error
      );
    });

    try {
      await this.run();
      await this.syncRunService.finishSyncRun(this.syncRun.id);
    } catch (ex) {
      await this.syncRunService.failSyncRun(
        this.syncRun.id,
        ex ? (ex as Error).message : ''
      );
    }

    // Closes the database connection
    this.logger.log(
      `==> Finished database synchronization #${this.syncRun.id}`
    );
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.error(`Database sync shutting down ${signal}`);
    try {
      await this.databaseService.connection.connect();
      await this.syncRunService.failSyncRun(
        this.syncRun.id,
        `Database synchronization shutdown ${signal}`
      );
      await this.databaseService.closeConnection();
    } catch (ex) {
      this.logger.error(
        `Failed gracefully shutting down dbsync: ${ex.message}`
      );
    }
    process.exit(1);
  }
}
