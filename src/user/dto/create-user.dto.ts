import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import {
  emailExample,
  passwordExample,
  personNameExample,
} from '../../common/constants/api-value-example.constants.js';

export class CreateUserDto {
  @ApiProperty({ example: emailExample })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: passwordExample })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: personNameExample })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
