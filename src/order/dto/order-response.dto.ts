import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import {
  OrderStatus,
  OrderType,
} from '../../../prisma/generated/prisma/client.js';
import { DeliveryOrderResponseDto } from './delivery-order-response.dto.js';
import { DineInOrderResponseDto } from './dine-in-order-response.dto.js';
import { OrderItemResponseDto } from './order-item-response.dto.js';
import { TakeawayOrderResponseDto } from './takeaway-order-response.dto.js';
import { uuidExample } from '../../common/constants/api-value-example.constants.js';

export class OrderResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid', nullable: true, example: uuidExample })
  cashierId!: string | null;

  @ApiProperty({ nullable: true })
  cashierName!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true, example: uuidExample })
  customerId!: string | null;

  @ApiProperty({ enum: OrderType })
  type!: OrderType;

  @ApiProperty({ format: 'uuid' })
  referenceId!: string;

  @ApiProperty()
  orderNumber!: string;

  @ApiProperty({ minimum: 0 })
  totalAmount!: number;

  @ApiProperty({ minimum: 0 })
  totalQuantity!: number;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ type: DeliveryOrderResponseDto, nullable: true })
  deliveryOrder!: DeliveryOrderResponseDto | null;

  @ApiProperty({ type: TakeawayOrderResponseDto, nullable: true })
  takeawayOrder!: TakeawayOrderResponseDto | null;

  @ApiProperty({ type: DineInOrderResponseDto, nullable: true })
  dineInOrder!: DineInOrderResponseDto | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  orderItems!: OrderItemResponseDto[];
}
