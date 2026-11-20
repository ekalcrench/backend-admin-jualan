import { ApiProperty } from '@nestjs/swagger';
import { SocialMediaPlatform } from '../../../prisma/generated/prisma/client.js';
import { usernameExample } from '../../common/constants/api-value-example.constants.js';

export class OrganizationSocialMediaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: SocialMediaPlatform })
  platform!: SocialMediaPlatform;

  @ApiProperty({ maxLength: 30, example: usernameExample })
  username!: string;

  @ApiProperty({ minimum: 0 })
  sortOrder!: number;
}
