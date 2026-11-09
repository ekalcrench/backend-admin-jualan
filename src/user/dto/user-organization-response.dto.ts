import { ApiProperty } from '@nestjs/swagger';
import { MAX_LOGO_BASE64_SIZE } from '../../common/constants/organization.constants.js';

export class UserOrganizationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['MEMBER', 'ADMIN', 'OWNER'] })
  role!: string;

  @ApiProperty({
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'],
  })
  status!: string;

  @ApiProperty({ maxLength: MAX_LOGO_BASE64_SIZE, nullable: true })
  logoBase64!: string | null;
}
