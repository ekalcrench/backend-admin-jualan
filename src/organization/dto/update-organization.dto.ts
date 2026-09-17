import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto.js';
import { logoUrlExample } from '../../common/constants/api-value-example.constants.js';
import { IsString, IsOptional } from 'class-validator';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiProperty({ example: logoUrlExample })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}
