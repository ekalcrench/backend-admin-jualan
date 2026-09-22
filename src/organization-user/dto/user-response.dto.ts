import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import {
  emailExample,
  personNameExample,
} from '../../common/constants/api-value-example.constants.js';

export class UserResponseDto extends IntersectionType(BaseResponseDto) {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: emailExample })
  email!: string;

  @ApiProperty({ example: personNameExample })
  name!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  emailVerifiedAt!: UserStatus;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ enum: UserRole })
  role!: UserStatus;
}
