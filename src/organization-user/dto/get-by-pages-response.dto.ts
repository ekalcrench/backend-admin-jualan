import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { OrganizationUserResponseDto } from './organization-user-response.dto.js';

export class OrganizationUserGetByPagesResponseDto {
  @ApiProperty({ type: [OrganizationUserResponseDto] })
  items!: OrganizationUserResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
