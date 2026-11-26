import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';
import {
  OrganizationUserRole,
  OrganizationUserStatus,
} from '../../../prisma/generated/prisma/enums.js';

export class GetOrganizationUserByPagesDto extends DefaultGetByPagesDto {
  @ApiPropertyOptional({ enum: OrganizationUserStatus })
  @IsEnum(OrganizationUserStatus)
  @IsOptional()
  status?: OrganizationUserStatus;

  @ApiPropertyOptional({ enum: OrganizationUserRole })
  @IsEnum(OrganizationUserRole)
  @IsOptional()
  role?: OrganizationUserRole;
}
