import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const sortMap: Record<
  string,
  Prisma.ProductOrderByWithRelationInput
> = {
  createdAt: { createdAt: 'asc' },
  '-createdAt': { createdAt: 'desc' },
  name: { name: 'asc' },
  '-name': { name: 'desc' },
  sellingPrice: { sellingPrice: 'asc' },
  '-sellingPrice': { sellingPrice: 'desc' },
};
