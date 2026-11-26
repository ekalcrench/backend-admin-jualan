import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { PurchaseResponseDto } from './purchase-response.dto.js';

export class GetPurchaseByPagesResponseDto {
  @ApiProperty({ type: [PurchaseResponseDto] })
  items!: PurchaseResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
