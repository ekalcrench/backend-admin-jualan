import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  addressExample,
  emailExample,
  organizationNameExample,
  phoneExample,
} from '../../common/constants/api-value-example.constants.js';
import { MAX_LOGO_BASE64_SIZE } from '../../common/constants/organization.constants.js';

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

  @ApiProperty({
    maxLength: MAX_LOGO_BASE64_SIZE,
    description: 'Base64-encoded logo, up to 2 MiB.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_LOGO_BASE64_SIZE)
  logoBase64!: string;
}
