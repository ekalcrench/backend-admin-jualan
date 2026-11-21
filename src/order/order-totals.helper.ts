import { Prisma } from '../../prisma/generated/prisma/client.js';

export function sumModifierPrices(
  modifiers: Array<{ unitPrice: Prisma.Decimal }>,
): Prisma.Decimal {
  return modifiers.reduce(
    (total, modifier) => total.plus(modifier.unitPrice),
    new Prisma.Decimal(0),
  );
}

/**
 * Authoritative order totals. `unitPrice` is the base product price and
 * `modifiers` are the immutable snapshot prices for that order item.
 */
export function calculateOrderTotals(
  items: Array<{
    unitPrice: Prisma.Decimal;
    quantity: number;
    modifiers: Array<{ unitPrice: Prisma.Decimal }>;
  }>,
): { totalAmount: Prisma.Decimal; totalQuantity: number } {
  return items.reduce(
    (totals, item) => ({
      totalAmount: totals.totalAmount.plus(
        item.unitPrice
          .plus(sumModifierPrices(item.modifiers))
          .mul(item.quantity),
      ),
      totalQuantity: totals.totalQuantity + item.quantity,
    }),
    {
      totalAmount: new Prisma.Decimal(0),
      totalQuantity: 0,
    },
  );
}
