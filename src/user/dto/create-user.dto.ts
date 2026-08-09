import { ApiProperty } from '@nestjs/swagger';
import { BaseRequestDto } from '../../common/dto/base-request.dto.js';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto extends BaseRequestDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}
