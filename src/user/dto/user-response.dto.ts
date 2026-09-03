import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { UserRole } from '../../common/enum/user-role.enum.js';
import { UserStatus } from '../../common/enum/user-status.enum.js';

export class UserResponseDto extends IntersectionType(BaseResponseDto) {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  emailVerifiedAt!: UserStatus;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ enum: UserRole })
  role!: UserStatus;
}
