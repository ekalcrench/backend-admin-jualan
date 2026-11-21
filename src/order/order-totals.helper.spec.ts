import { Prisma } from '../../prisma/generated/prisma/client.js';
import {
  calculateOrderTotals,
  sumModifierPrices,
} from './order-totals.helper.js';

const decimal = (value: number) => new Prisma.Decimal(value);

describe('order totals helper', () => {
  it('keeps a modifier-free item at its base price', () => {
    const totals = calculateOrderTotals([
      { unitPrice: decimal(20000), quantity: 2, modifiers: [] },
    ]);

    expect(totals.totalAmount.toNumber()).toBe(40000);
    expect(totals.totalQuantity).toBe(2);
  });

  it('adds every modifier snapshot before multiplying by quantity', () => {
    const totals = calculateOrderTotals([
      {
        unitPrice: decimal(20000),
        quantity: 2,
        modifiers: [
          { unitPrice: decimal(2500) },
          { unitPrice: decimal(5000) },
        ],
      },
    ]);

    expect(totals.totalAmount.toNumber()).toBe(55000);
    expect(totals.totalQuantity).toBe(2);
  });

  it('supports zero-priced modifiers', () => {
    const totals = calculateOrderTotals([
      {
        unitPrice: decimal(20000),
        quantity: 1,
        modifiers: [{ unitPrice: decimal(0) }],
      },
    ]);

    expect(totals.totalAmount.toNumber()).toBe(20000);
  });

  it('sums multiple items and only counts product quantity', () => {
    const totals = calculateOrderTotals([
      {
        unitPrice: decimal(20000),
        quantity: 2,
        modifiers: [{ unitPrice: decimal(2500) }, { unitPrice: decimal(5000) }],
      },
      {
        unitPrice: decimal(15000),
        quantity: 3,
        modifiers: [{ unitPrice: decimal(1000) }],
      },
    ]);

    expect(totals.totalAmount.toNumber()).toBe(103000);
    expect(totals.totalQuantity).toBe(5);
  });

  it('sums modifier snapshots with Decimal arithmetic', () => {
    const total = sumModifierPrices([
      { unitPrice: decimal(2500.25) },
      { unitPrice: decimal(5000.5) },
    ]);

    expect(total.toNumber()).toBe(7500.75);
  });
});
