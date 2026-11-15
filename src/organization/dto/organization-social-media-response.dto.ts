import { ApiProperty } from '@nestjs/swagger';
import { SocialMediaPlatform } from '../../../prisma/generated/prisma/client.js';

export class OrganizationSocialMediaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: SocialMediaPlatform })
  platform!: SocialMediaPlatform;

  @ApiProperty({ maxLength: 30 })
  username!: string;

  @ApiProperty({ minimum: 0 })
  sortOrder!: number;
}
