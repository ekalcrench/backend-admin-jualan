import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import {
  emailExample,
  passwordExample,
  personNameExample,
} from '../../common/constants/api-value-example.constants.js';
import { OrganizationUserRole } from '../../common/enums/organization-user-role.enum.js';
import { OrganizationUserStatus } from '../../common/enums/organization-user-status.enum.js';

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
