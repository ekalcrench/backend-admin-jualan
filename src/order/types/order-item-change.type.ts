import { Prisma } from '../../../prisma/generated/prisma/client.js';

export type OrderItemChange = {
  id?: string;
  productId?: string;
  quantity?: number;
  modifierOptionIds?: string[];
  itemData: Prisma.OrderItemUpdateInput;
  createData?: Prisma.OrderItemCreateWithoutOrderInput;
};
