import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { emailExample } from '../../common/constants/api-value-example.constants.js';

export class CreateEmailVerificationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: emailExample })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
