import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import {
  OrganizationUserRole,
  OrganizationUserStatus,
} from '../../../prisma/generated/prisma/enums.js';

export class OrganizationUserResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: OrganizationUserRole })
  role!: OrganizationUserRole;

  @ApiProperty({ enum: OrganizationUserStatus })
  status!: OrganizationUserStatus;

  @ApiProperty({ format: 'date-time', nullable: true })
  approvedAt!: Date | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  approvedById!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  updatedById!: string | null;
}
