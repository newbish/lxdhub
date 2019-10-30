import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Interfaces as API } from '@lxdhub/common';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';

import { APP_SETTINGS, AppSettings } from '../../../settings';

/**
 * Interface to the LXDHub API forapp-settingapp-settings.service
 * Remote operations.
 */
@Injectable()
export class RemoteService {
  /**
   * Initializes the Remote Service and fetches the needed data
   * @param http The HTTP Client
   * @param logger The logger instance from NGXLogger
   * @param appSettingsSerivce The Service for the application settings
   */
  constructor(
    private http: HttpClient,
    private logger: NGXLogger,
    @Inject(APP_SETTINGS) private config: AppSettings) { }

  /**
   * Fetches all remotes
   */
  findAll()
    : Observable<API.ResponseDto<API.RemoteDto[]>> {
    this.logger.debug(`Request all remotes`);
    // Fetch the remotes
    return this.http
      .get<API.ResponseDto<API.RemoteDto[]>>(`${this.config.apiUrl}api/v1/remote`);
  }
}
