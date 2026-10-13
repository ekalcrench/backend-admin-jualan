import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateProductIngredientDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  inventoryItemId!: string;

  @ApiProperty({ minimum: 0.01, example: 100 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity!: number;
}
