import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';

export class OrganizationResponseDto extends BaseResponseDto {
  @ApiProperty()
  name!: string;
}
