import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateOrderItemDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf(
    (item: UpdateOrderItemDto) => !item.id || item.productId !== undefined,
  )
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ minimum: 1, example: 2 })
  @ValidateIf(
    (item: UpdateOrderItemDto) => !item.id || item.quantity !== undefined,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    uniqueItems: true,
    description:
      'Replacement modifier selection. Omit to preserve the existing snapshot when the product is unchanged.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  modifierOptionIds?: string[];
}
