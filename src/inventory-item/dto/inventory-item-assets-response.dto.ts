import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemAssetsResponseDto {
  @ApiProperty({
    description: 'Total value of remaining inventory stock',
    type: Number,
  })
  totalAssets!: number;
}
