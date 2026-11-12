/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import type { Prisma } from '../../../prisma/generated/prisma/client.js';
import type { DineInOrderWithTable } from './dine-in-order-with-table.types.js';
import type { OrderQueryRecord } from './order-query-record.types.js';

export type OrderWithDetails = OrderQueryRecord & {
  deliveryOrder: Prisma.DeliveryOrderGetPayload<{}> | null;
  takeawayOrder: Prisma.TakeawayOrderGetPayload<{}> | null;
  dineInOrder: DineInOrderWithTable | null;
};
