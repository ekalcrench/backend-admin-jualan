import { Decimal } from '@prisma/client/runtime/index-browser';

export type ProductOptionsRecord = {
  id: string;
  name: string;
  sellingPrice: Decimal;
  isActive: boolean;
  productIngredients: Array<{
    inventoryItemId: string;
    quantity: Decimal;
  }>;
};
