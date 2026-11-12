import { ApiProperty } from '@nestjs/swagger';
import { personNameExample } from '../../common/constants/api-value-example.constants.js';
import { TableStatus } from '../../../prisma/generated/prisma/enums.js';

export class DineInOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tableId!: string;

  @ApiProperty({ nullable: true, example: personNameExample })
  name!: string | null;

  @ApiProperty({ minimum: 1 })
  guestCount!: number;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tableNumber: { type: 'string' },
      name: { type: 'string', nullable: true },
      capacity: { type: 'integer' },
      status: { type: 'string', enum: Object.values(TableStatus) },
    },
  })
  table!: {
    id: string;
    tableNumber: string;
    name: string | null;
    capacity: number;
    status: TableStatus;
  };
}
