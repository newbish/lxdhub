import { Inject, NotFoundException } from '@nestjs/common';
import { Image } from '@lxdhub/db';

import { CloneImageDto, CloneImageResponseDto, ImageDetailDto, ImageListItemDto } from '.';
import { PaginationOptionsDto, PaginationResponseDto, ResponseDto } from '../common';
import { ImageAvailabilityService } from '../image-availability/image-availability.service';
import { LXDService } from '../lxd/lxd.service';
import { SearchDictionary, SearchService } from '../search';
import { ImageDetailFactory, ImageListItemFactory } from './factories';
import { ImageRepository } from './image.repository';
import { ImageSearchLiteral } from './interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { RemoteService } from '../remote';
import { Connection } from 'typeorm';

/**
 * Interface between the Database and API for
 * Image operations.
 */
export class ImageService {
    /**
     * Initialized the Image Service.
     * @param imageRepository The database interface for image operations
     * @param imageListItemFactory The api-image-interface
     * @param imageDetaiLFactory The api-image-detail-interface
     */
    constructor(
        private readonly imageRepository: ImageRepository,
        private readonly imageListItemFactory: ImageListItemFactory,
        private readonly imageDetailFactory: ImageDetailFactory,
        private readonly searchService: SearchService,
        private readonly remoteService: RemoteService,
        @Inject('ImageSearchDictionary')
        private readonly imageSearchDictionary: SearchDictionary[],
        @Inject('LXDService')
        private readonly lxdService: LXDService,
    ) { }

    /**
     * Returns images, limited by the given pagination options, filtered
     * by the query parameter and transforms the database images into data-transfer-objects
     * @param remoteName The name of the remote
     * @param query The The query-string which filters the image. Search for image os name or arch Name
     * @param pagination The options to paginate through the request data
     */
    async findByRemote(remoteName: string, pagination: PaginationOptionsDto, query?: string)
        : Promise<PaginationResponseDto<ImageListItemDto[]>> {

        const search: ImageSearchLiteral = query ?
            this.searchService.getLiteral(query, this.imageSearchDictionary, 'desc') :
            {};

        const remote = await this.remoteService.findByName(remoteName);
        const [images, total] = await this.imageRepository.findByRemote(remote.id, pagination, search);

        // Return the custom pagination response, so the
        // data is wrapped around with metadata
        return new PaginationResponseDto<ImageListItemDto[]>(
            this.imageListItemFactory.entitiesToDto(images),
            total,
            pagination);
    }

    /**
     * Finds one image and returns detailed image information
     * in a DTO.
     * @param fingerprint The fingerprint of the image
     * @throws {Error} Will throw an error if the image is not found
     */
    async findOne(fingerprint: string): Promise<ResponseDto<ImageDetailDto>> {
        // Fetch the image from the database
        const image = await this.imageRepository.findOneByFingerprint(fingerprint);

        // Map the data around a response and map the
        // database data to DTOs
        return new ResponseDto<ImageDetailDto>(
            this.imageDetailFactory.entityToDto(image)
        );
    }

    /**
     * Clones an image to a specific remote
     * @param imageId The id of the image, which should get cloned
     * @param cloneImageDto The dto, which contains the remote information
     */
    async cloneImage(imageId: number, cloneImageDto: CloneImageDto)
        : Promise<ResponseDto<CloneImageResponseDto>> {
        // Get image from database
        const image = await this.imageRepository.findOneItem(imageId);
        if (!image) throw new NotFoundException('Image not found');

        const sourceRemote = await this.remoteService.findById(cloneImageDto.sourceRemoteId);
        if (!sourceRemote) throw new NotFoundException('Source Remote not found');

        const destinationRemote = await this.remoteService.findById(cloneImageDto.destinationRemoteId);
        if (!destinationRemote) throw new NotFoundException('Destination Remote not found');

        const uuid = await this.lxdService.cloneImage(
            image,
            sourceRemote,
            destinationRemote);

        return new ResponseDto<CloneImageResponseDto>({ uuid });
    }

    /**
     * Clones an image to a specific remote
     * @param imageId The id of the image, which should get cloned
     * @param cloneImageDto The dto, which contains the remote information
     */
    async importImage(image: any, remote: string, aliases: string[]) {
        if (!image) throw new NotFoundException('Image not found');
        const fingerprint = await this.lxdService.importImage(image, remote);
        await this.lxdService.addImageAlias(remote, fingerprint, aliases);
    }
}
