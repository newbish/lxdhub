import { Injectable, Inject } from '@angular/core';
import { Socket } from 'ng-socket-io';

import { APP_SETTINGS, AppSettings } from '../../../settings';

@Injectable()
export class ImageSocket extends Socket {
    constructor(
        @Inject(APP_SETTINGS) private config: AppSettings
    ) {
        super({ url: `${config.apiUrl}image` });
    }

    getCloneStatus(destinationRemoteId: number, operation: string, imageId: number): any {
        this.emit('clone-status', { destinationRemoteId, operation, imageId });
        return this.fromEvent('clone-status');
    }
}
