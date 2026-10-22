import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { CashTransactionResponseDto } from './cash-transaction-response.dto.js';

export class CashTransactionGetByPagesResponseDto {
  @ApiProperty({ type: [CashTransactionResponseDto] })
  items!: CashTransactionResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
