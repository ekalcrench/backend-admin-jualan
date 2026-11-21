import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { ProductModifierGroupResponseDto } from './product-modifier-group-response.dto.js';

export class ProductModifierGroupGetByPagesResponseDto {
  @ApiProperty({ type: [ProductModifierGroupResponseDto] })
  items!: ProductModifierGroupResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
