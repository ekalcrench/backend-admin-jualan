import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { PreparationResponseDto } from './preparation-response.dto.js';

export class GetPreparationByPagesResponseDto {
  @ApiProperty({ type: [PreparationResponseDto] })
  items!: PreparationResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
