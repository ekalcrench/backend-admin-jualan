import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import {
  addressExample,
  emailExample,
  logoUrlExample,
  organizationNameExample,
  phoneExample,
} from '../../common/constants/api-value-example.constants.js';

export class OrganizationResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: organizationNameExample })
  name!: string;

  @ApiProperty({ example: addressExample })
  address!: string;

  @ApiProperty({ example: emailExample })
  email!: string;

  @ApiProperty({ example: phoneExample })
  phone!: string;

  @ApiProperty({ example: logoUrlExample })
  logoUrl!: string;
}
