import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { UserStatus } from '../../common/enum/user-status.enum.js';
import { UserRole } from '../../common/enum/user-role.enum.js';

export class CreateUserResponseDto extends IntersectionType(BaseResponseDto) {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  emailVerifiedAt!: UserStatus;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ enum: UserRole })
  role!: UserStatus;
}
