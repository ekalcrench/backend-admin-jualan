import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../user/dto/user-response.dto.js';

export class LoginResponseDto {
  @ApiProperty({ type: UserResponseDto, description: 'User profile' })
  user!: UserResponseDto;

  @ApiProperty({ type: String, description: 'JWT access token' })
  accessToken!: string;
}
