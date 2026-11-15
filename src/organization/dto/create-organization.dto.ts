import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  addressExample,
  emailExample,
  organizationNameExample,
  phoneExample,
} from '../../common/constants/api-value-example.constants.js';
import { MAX_LOGO_BASE64_SIZE } from '../../common/constants/organization.constants.js';
import { CreateOrganizationSocialMediaDto } from './create-organization-social-media.dto.js';

export class CreateOrganizationDto {
  @ApiProperty({ example: organizationNameExample })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  username?: string;

  @ApiProperty({ example: addressExample })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: emailExample })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: phoneExample })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    maxLength: MAX_LOGO_BASE64_SIZE,
    description: 'Base64-encoded logo, up to 2 MiB.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_LOGO_BASE64_SIZE)
  logoBase64!: string;

  @ApiPropertyOptional({ type: [CreateOrganizationSocialMediaDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique(
    (socialMedia: CreateOrganizationSocialMediaDto) => socialMedia.platform,
  )
  @ValidateNested({ each: true })
  @Type(() => CreateOrganizationSocialMediaDto)
  socialMedias?: CreateOrganizationSocialMediaDto[];
}
