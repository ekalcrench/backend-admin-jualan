import { ApiPropertyOptional } from '@nestjs/swagger';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';
import {
  UserRole,
  UserStatus,
} from '../../../prisma/generated/prisma/enums.js';
import { IsEnum, IsOptional } from 'class-validator';

export class GetUserByPagesDto extends DefaultGetByPagesDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
