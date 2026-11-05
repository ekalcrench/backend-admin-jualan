import { ApiProperty } from '@nestjs/swagger';

export class ProductOverviewResponseDto {
  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({
    example: 1,
    minimum: 0,
    description: 'Maximum whole products that can be made with current stock',
  })
  stock!: number;
}
