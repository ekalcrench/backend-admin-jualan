import { Prisma } from '../../../prisma/generated/prisma/client.js';

export type OrderItemChange = {
  id?: string;
  productId?: string;
  itemData: Prisma.OrderItemUpdateInput;
  createData?: Prisma.OrderItemCreateWithoutOrderInput;
};
