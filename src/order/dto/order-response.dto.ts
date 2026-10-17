import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';

export class OrderItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ minimum: 1 })
  quantity!: number;

  @ApiProperty({ minimum: 0 })
  unitPrice!: number;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
    },
  })
  product!: { id: string; name: string };
}

export class OrderResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty()
  orderNumber!: string;

  @ApiProperty({ minimum: 0 })
  totalAmount!: number;

  @ApiProperty({ type: [OrderItemResponseDto] })
  orderItems!: OrderItemResponseDto[];
}
