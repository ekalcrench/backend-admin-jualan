import { Decimal } from '@prisma/client/runtime/index-browser';

export type ProductOptionsRecord = {
  id: string;
  name: string;
  sellingPrice: Decimal;
};
