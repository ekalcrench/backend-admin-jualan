import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { OrganizationUserRole } from '../../common/enums/organization-user-role.enum.js';
import { OrganizationUserStatus } from '../../common/enums/organization-user-status.enum.js';

export class OrganizationUserResponseDto extends IntersectionType(
  BaseResponseDto,
) {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ enum: OrganizationUserRole })
  role!: OrganizationUserRole;

  @ApiProperty({ format: 'date-time' })
  approvedAt!: Date;

  @ApiProperty({ format: 'uuid' })
  approvedById!: string;

  @ApiProperty({ enum: OrganizationUserStatus })
  status!: OrganizationUserStatus;

  @ApiProperty({ format: 'uuid' })
  updatedById!: string;
}
