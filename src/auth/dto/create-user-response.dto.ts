import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { CreateUserDto } from './create-user.dto.js';
import { UserStatus } from '../../common/enum/user-status.enum.js';

export class CreateUserResponseDto extends IntersectionType(
  BaseResponseDto,
  CreateUserDto,
) {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;
}
