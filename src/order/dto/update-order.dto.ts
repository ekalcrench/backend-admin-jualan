import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateOrderDto } from './create-order.dto.js';
import { UpdateOrderItemDto } from './update-order-item.dto.js';

export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ['orderItems'] as const),
) {
  @ApiPropertyOptional({ type: [UpdateOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  orderItems?: UpdateOrderItemDto[];

  @ApiPropertyOptional({ type: [String], format: 'uuid', uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  deletedOrderItemIds?: string[];
}
