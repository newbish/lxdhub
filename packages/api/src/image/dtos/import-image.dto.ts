import { Type } from 'class-transformer';
import { IsDefined, IsArray, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

/**
 * Data object for the image import
 * parameter parsing
 */
export class ImportImageDto {
    @IsArray()
    @IsDefined()
    @ArrayMinSize(1)
    @Type(() => String)
    @ApiModelProperty()
    /**
     * The aliases
     */
    aliases: string[];

    @IsString()
    @IsDefined()
    @Type(() => String)
    @ApiModelProperty()
    /**
     * The name of the remote
     */
    remote: string;
}
