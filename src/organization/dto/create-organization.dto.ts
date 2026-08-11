import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Azmi Company' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
