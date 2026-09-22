import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';
import { IsOptional } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  role?: UserRole;
}
