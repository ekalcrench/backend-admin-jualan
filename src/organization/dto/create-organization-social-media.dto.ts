import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SocialMediaPlatform } from '../../../prisma/generated/prisma/client.js';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOrganizationSocialMediaDto {
  @ApiProperty({ enum: SocialMediaPlatform })
  @IsEnum(SocialMediaPlatform)
  platform!: SocialMediaPlatform;

  @ApiProperty({ maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  username!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
