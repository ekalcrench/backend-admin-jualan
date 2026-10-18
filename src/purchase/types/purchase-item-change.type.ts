import { Prisma } from '../../../prisma/generated/prisma/client.js';

export type PurchaseItemChange = {
  id?: string;
  purchaseItemData: Prisma.PurchaseItemUncheckedUpdateManyInput;
  createData?: Prisma.PurchaseItemCreateWithoutPurchaseInput;
};
