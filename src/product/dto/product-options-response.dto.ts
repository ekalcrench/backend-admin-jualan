import { ApiProperty } from '@nestjs/swagger';

export class ProductOptionsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({ example: 12500 })
  sellingPrice!: number;
}
