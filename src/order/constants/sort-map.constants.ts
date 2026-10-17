import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const sortMap: Record<string, Prisma.OrderOrderByWithRelationInput> = {
  orderNumber: { orderNumber: 'asc' },
  '-orderNumber': { orderNumber: 'desc' },
  totalAmount: { totalAmount: 'asc' },
  '-totalAmount': { totalAmount: 'desc' },
  createdAt: { createdAt: 'asc' },
  '-createdAt': { createdAt: 'desc' },
};
