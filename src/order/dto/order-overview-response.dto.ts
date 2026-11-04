import { ApiProperty } from '@nestjs/swagger';

export class OrderOverviewResponseDto {
  @ApiProperty({ minimum: 0 })
  totalAmount!: number;

  @ApiProperty({ minimum: 0 })
  totalQuantity!: number;

  @ApiProperty()
  totalGrossProfit!: number;

  @ApiProperty({ minimum: 0 })
  prevTotalAmount!: number;

  @ApiProperty({ minimum: 0 })
  prevTotalQuantity!: number;

  @ApiProperty()
  prevTotalGrossProfit!: number;
}
