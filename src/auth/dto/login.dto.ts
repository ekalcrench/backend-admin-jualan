import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import {
  emailExample,
  passwordExample,
} from '../../common/constants/api-value-example.constants.js';

export class LoginDto {
  @ApiProperty({ example: emailExample })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: passwordExample })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
