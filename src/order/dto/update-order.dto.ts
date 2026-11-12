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
import { UpdateDeliveryOrderDto } from './update-delivery-order.dto.js';
import { UpdateDineInOrderDto } from './update-dine-in-order.dto.js';
import { UpdateTakeawayOrderDto } from './update-takeaway-order.dto.js';

export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, [
    'orderItems',
    'deliveryOrder',
    'takeawayOrder',
    'dineInOrder',
  ] as const),
) {
  @ApiPropertyOptional({ type: UpdateDeliveryOrderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDeliveryOrderDto)
  deliveryOrder?: UpdateDeliveryOrderDto;

  @ApiPropertyOptional({ type: UpdateTakeawayOrderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateTakeawayOrderDto)
  takeawayOrder?: UpdateTakeawayOrderDto;

  @ApiPropertyOptional({ type: UpdateDineInOrderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDineInOrderDto)
  dineInOrder?: UpdateDineInOrderDto;

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
