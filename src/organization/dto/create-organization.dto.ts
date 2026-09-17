import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import {
  addressExample,
  emailExample,
  organizationNameExample,
  phoneExample,
} from '../../common/constants/api-value-example.constants.js';

export class CreateOrganizationDto {
  @ApiProperty({ example: organizationNameExample })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: addressExample })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: emailExample })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: phoneExample })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}
