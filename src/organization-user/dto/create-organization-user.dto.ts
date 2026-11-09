import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { OrganizationUserStatus } from '../../common/enums/organization-user-status.enum.js';
import { OrganizationUserRole } from '../../../prisma/generated/prisma/enums.js';

export class CreateOrganizationUserDto {
  @ApiProperty({ format: 'uuid' })
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: OrganizationUserRole })
  @IsString()
  @IsNotEmpty()
  role!: OrganizationUserRole;

  @ApiProperty({ enum: OrganizationUserStatus })
  @IsString()
  @IsNotEmpty()
  status!: OrganizationUserStatus;
}
