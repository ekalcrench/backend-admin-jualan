import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { ProductResponseDto } from './product-response.dto.js';

export class ProductGetByPagesResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  items!: ProductResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
