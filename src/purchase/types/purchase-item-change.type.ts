import { Prisma } from '../../../prisma/generated/prisma/client.js';

export type PurchaseItemChange = {
  id?: string;
  inventoryLotId?: string;
  purchaseItemData: Prisma.PurchaseItemUncheckedUpdateManyInput;
  inventoryLotData: Prisma.InventoryLotUncheckedUpdateManyInput;
  createData?: Prisma.PurchaseItemCreateWithoutPurchaseInput;
};
