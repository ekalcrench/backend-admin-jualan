import { ApiProperty } from '@nestjs/swagger';

export class ProductOverviewResponseDto {
  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({
    example: 1,
    description: 'Remaining manual or inventory-derived product stock',
  })
  stock!: number;
}
