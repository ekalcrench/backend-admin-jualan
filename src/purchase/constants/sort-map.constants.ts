import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const sortMap: Record<string, Prisma.PurchaseOrderByWithRelationInput> =
  {
    purchasedAt: { purchasedAt: 'asc' },
    '-purchasedAt': { purchasedAt: 'desc' },
    createdAt: { createdAt: 'asc' },
    '-createdAt': { createdAt: 'desc' },
    supplierName: { supplierName: 'asc' },
    '-supplierName': { supplierName: 'desc' },
  };
