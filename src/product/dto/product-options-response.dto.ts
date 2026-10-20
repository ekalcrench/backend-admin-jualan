import { ApiProperty } from '@nestjs/swagger';

export class ProductOptionsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({ example: 12500 })
  sellingPrice!: number;

  @ApiProperty({
    example: 7,
    minimum: 0,
    description: 'Maximum whole products that can be made with current stock',
  })
  stock!: number;
}
