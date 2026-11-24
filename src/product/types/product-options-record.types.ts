import { Decimal } from '@prisma/client/runtime/index-browser';
import {
  InventoryPolicy,
  ProductStockManagement,
} from '../../../prisma/generated/prisma/enums.js';

export type ProductOptionsRecord = {
  id: string;
  name: string;
  sellingPrice: Decimal;
  isActive: boolean;
  stockManagement: ProductStockManagement;
  stock: number | null;
  inventoryPolicy: InventoryPolicy;
  productIngredients: Array<{
    inventoryItemId: string;
    quantity: Decimal;
  }>;
};
