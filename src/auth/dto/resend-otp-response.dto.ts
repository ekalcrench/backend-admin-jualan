import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../user/dto/user-response.dto.js';

export class ResendOtpResponseDto {
  @ApiProperty({ type: UserResponseDto, description: 'User profile' })
  user!: UserResponseDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'New OTP valid resend time',
  })
  otpValidResendTime!: string;
}
