import 'rxjs/add/observable/from';
import 'rxjs/add/operator/map';

import { CloneStatusDto, ImageDetailDto } from './';
import { ResponseDto } from '../common';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';

import { ImageAvailabilityService } from '../image-availability/image-availability.service';
import { LogService } from '../log/log.service';
import { LXDService } from '../lxd/lxd.service';
import { ImageRepository } from './image.repository';
import { ImageService } from './image.service';
import { RemoteService } from '../remote';

/**
 * Gateway for image related websocket messages
 */
@WebSocketGateway({ namespace: 'image'})
export class ImageGateway {
    logger: LogService;

    /**
     * Initializes the component
     * @param lxdService The LXDService
     * @param remoteRepository The Remote Repository
     */
    constructor(
        private lxdService: LXDService,
        private remoteService: RemoteService,
        private imageService: ImageService,
        private imageAvailabilityService: ImageAvailabilityService,
        private imageRepository: ImageRepository
    ) {
        this.logger = new LogService(this.constructor.name);
    }

    /**
     * Returns the clone status
     * @param data The data sent from the user
     */
    @SubscribeMessage('clone-status')
    public async getCloneStatus(_, data: CloneStatusDto): Promise<WsResponse<ResponseDto<ImageDetailDto>>> {
        this.logger.debug(`Getting clone status from remote #${data.destinationRemoteId} of image id #${data.imageId}`);
        let destinationRemote;
        // Get remote
        try {
            destinationRemote = await this.remoteService.findById(data.destinationRemoteId);
        } catch (err) {
            this.logger.error(err.message);
            throw new NotFoundException(`Could not find the remote with id #${data.destinationRemoteId}`);
        }

        // Wait until cloning is done
        this.logger.info(`Waiting for clone status for remote#${destinationRemote.id} ${destinationRemote.name}:`);
        try {
            const response = await this.lxdService.wait(destinationRemote.serverUrl, data.operation);
        } catch (err) {
            this.logger.error(err.message);
            throw new InternalServerErrorException('Failed requesting image clone status');
        }
        this.logger.debug(`Received clone status for remote#${destinationRemote.id} ${destinationRemote.name}:`);

        // Get the given image
        const image = await this.imageRepository.findOne({ id: data.imageId });

        // Create the image availability
        await this.imageAvailabilityService.getOrCreate(image, destinationRemote, true);

        // Return image detail
        const imageDetail = await this.imageService.findOne(image.fingerprint);

        return { data: imageDetail, event: 'clone-status' };
    }
}
