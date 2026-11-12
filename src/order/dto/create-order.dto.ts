import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto.js';
import { OrderType } from '../../../prisma/generated/prisma/enums.js';
import { CreateDineInOrderDto } from './create-dine-in-order.dto.js';
import { CreateTakeawayOrderDto } from './create-takeaway-order.dto.js';
import { CreateDeliveryOrderDto } from './create-delivery-order.dto.js';

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType, default: OrderType.DELIVERY })
  @IsEnum(OrderType)
  type!: OrderType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderNumber!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ type: CreateDeliveryOrderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDeliveryOrderDto)
  deliveryOrder?: CreateDeliveryOrderDto;

  @ApiPropertyOptional({ type: CreateTakeawayOrderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTakeawayOrderDto)
  takeawayOrder?: CreateTakeawayOrderDto;

  @ApiPropertyOptional({ type: CreateDineInOrderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDineInOrderDto)
  dineInOrder?: CreateDineInOrderDto;

  @ApiProperty({ type: [CreateOrderItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems!: CreateOrderItemDto[];
}
