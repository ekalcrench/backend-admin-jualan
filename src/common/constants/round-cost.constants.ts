import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const roundCost = (amount: Prisma.Decimal, decimalPlaces: number) =>
  amount.toDecimalPlaces(decimalPlaces, Prisma.Decimal.ROUND_HALF_UP);
