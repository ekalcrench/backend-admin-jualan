import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import {
  emailExample,
  pinExample,
} from '../../common/constants/api-value-example.constants.js';

export class VerifyEmailDto {
  @ApiProperty({ example: emailExample })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: pinExample })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;
}
