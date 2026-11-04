import { ApiProperty } from '@nestjs/swagger';

export class OrderOverviewItemsResponseDto {
  @ApiProperty({ minimum: 0 })
  mostSellItemsAmount!: number;

  @ApiProperty()
  mostSellItemsName!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  mostSellItemsLatestSold!: string;

  @ApiProperty({ minimum: 0 })
  leastSellItemsAmount!: number;

  @ApiProperty()
  leastSellItemsName!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  leastSellItemsLatestSold!: string;
}
