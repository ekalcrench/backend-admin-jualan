import { ApiPropertyOptional } from '@nestjs/swagger';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { IsOptional } from 'class-validator';
import { UserStatus } from '../../../prisma/generated/prisma/enums.js';

export class GetByPagesDto extends DefaultGetByPagesDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  status?: UserStatus;
}
