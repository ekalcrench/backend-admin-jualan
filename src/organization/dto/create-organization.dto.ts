import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Azmi Company' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Jl. Pegangsangan Timur No. 12' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '08976573345' })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}
