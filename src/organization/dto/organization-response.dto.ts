import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import {
  addressExample,
  emailExample,
  organizationNameExample,
  phoneExample,
} from '../../common/constants/api-value-example.constants.js';
import { MAX_LOGO_BASE64_SIZE } from '../../common/constants/organization.constants.js';
import { OrganizationSocialMediaResponseDto } from './organization-social-media-response.dto.js';

export class OrganizationResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: organizationNameExample })
  name!: string;

  @ApiPropertyOptional({ maxLength: 30, nullable: true })
  username!: string | null;

  @ApiProperty({ example: addressExample })
  address!: string;

  @ApiProperty({ example: emailExample })
  email!: string;

  @ApiProperty({ example: phoneExample })
  phone!: string;

  @ApiProperty({ maxLength: MAX_LOGO_BASE64_SIZE, nullable: true })
  logoBase64!: string | null;

  @ApiProperty({ type: [OrganizationSocialMediaResponseDto] })
  socialMedias!: OrganizationSocialMediaResponseDto[];
}
