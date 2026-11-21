import { Prisma } from '../../../prisma/generated/prisma/client.js';

export type OrderModifierSelectionInput = {
  productId: string;
  /**
   * `null` means "preserve the existing snapshot" during an order edit.
   * An array (including an empty array) means "resolve and validate this selection".
   */
  modifierOptionIds: string[] | null;
};

export type OrderItemModifierSnapshotInput = {
  modifierGroupId: string;
  modifierOptionId: string;
  groupName: string;
  optionName: string;
  unitPrice: Prisma.Decimal;
  inventoryItemId: string | null;
  inventoryQuantity: Prisma.Decimal | null;
  sortOrder: number;
};

export type ResolvedOrderModifierItem = {
  productId: string;
  productName: string;
  sellingPrice: Prisma.Decimal;
  productIngredients: Array<{
    inventoryItemId: string;
    quantity: Prisma.Decimal;
  }>;
  modifierSnapshots?: OrderItemModifierSnapshotInput[];
  modifierTotal: Prisma.Decimal;
};
