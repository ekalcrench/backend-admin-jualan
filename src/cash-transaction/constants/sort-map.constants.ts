import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const sortMap: Record<
  string,
  Prisma.CashTransactionOrderByWithRelationInput
> = {
  transactionAt: { transactionAt: 'asc' },
  '-transactionAt': { transactionAt: 'desc' },
  amount: { amount: 'asc' },
  '-amount': { amount: 'desc' },
  createdAt: { createdAt: 'asc' },
  '-createdAt': { createdAt: 'desc' },
};
