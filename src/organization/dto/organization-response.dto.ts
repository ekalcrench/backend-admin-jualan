import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';

export class OrganizationResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Azmi Company' })
  name!: string;

  @ApiProperty({ example: 'Jl. Pegangsangan Timur No. 12' })
  address!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: '08976573345' })
  phone!: string;

  @ApiProperty({
    example:
      '/uploads/organizations/396e51c9-efa4-4278-b7f6-ebcaa8063cad/ChatGPT Image Jul 16, 2026, 08_30_05 PM.png',
  })
  logoUrl!: string;
}
