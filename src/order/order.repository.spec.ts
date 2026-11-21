import { jest } from '@jest/globals';
import {
  OrderStatus,
  Prisma,
} from '../../prisma/generated/prisma/client.js';
import { OrderType } from '../../prisma/generated/prisma/enums.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ProductModifierOrderingService } from '../product-modifier/product-modifier-ordering.service.js';
import { OrderRepository } from './order.repository.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const groupId = '33333333-3333-4333-8333-333333333333';
const optionId = '44444444-4444-4444-8444-444444444444';
const secondOptionId = '55555555-5555-4555-8555-555555555555';
const referenceId = '66666666-6666-4666-8666-666666666666';
const createdAt = new Date('2026-11-21T00:00:00.000Z');

const buildModifierSnapshot = (
  optionIdValue: string,
  optionName: string,
  unitPrice: number,
  sortOrder: number,
) => ({
  modifierGroupId: groupId,
  modifierOptionId: optionIdValue,
  groupName: 'Extra Isian',
  optionName,
  unitPrice: new Prisma.Decimal(unitPrice),
  sortOrder,
});

const buildCreatedOrder = () => ({
  id: 'order-id',
  organizationId,
  cashierId: 'cashier-id',
  customerId: null,
  orderNumber: 'INV-001',
  totalAmount: new Prisma.Decimal(55000),
  totalQuantity: 2,
  status: OrderStatus.UNPAID,
  type: OrderType.TAKEAWAY,
  referenceId,
  createdAt,
  updatedAt: createdAt,
  cashier: { name: 'Kasir' },
  items: [
    {
      id: 'order-item-id',
      orderId: 'order-id',
      productId,
      quantity: 2,
      unitPrice: new Prisma.Decimal(20000),
      unitCost: new Prisma.Decimal(0),
      product: { id: productId, name: 'Soto Padang Ayam' },
      modifiers: [
        {
          id: 'modifier-one-id',
          orderItemId: 'order-item-id',
          ...buildModifierSnapshot(optionId, 'Ayam Suwir', 2500, 0),
          createdAt,
        },
        {
          id: 'modifier-two-id',
          orderItemId: 'order-item-id',
          ...buildModifierSnapshot(secondOptionId, 'Daging Kering', 5000, 1),
          createdAt,
        },
      ],
    },
  ],
});

describe('OrderRepository modifier snapshots', () => {
  it('creates order items with snapshots and Decimal totals from resolved modifiers', async () => {
    const transaction = {
      inventoryLot: { findMany: jest.fn().mockResolvedValue([]) },
      takeawayOrder: {
        create: jest.fn().mockResolvedValue({ id: referenceId }),
      },
      order: {
        create: jest.fn().mockResolvedValue(buildCreatedOrder()),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
      takeawayOrder: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: referenceId,
            name: 'Budi',
            phone: null,
            pickUpTime: createdAt,
            createdAt,
            updatedAt: createdAt,
          },
        ]),
      },
      deliveryOrder: { findMany: jest.fn() },
      dineInOrder: { findMany: jest.fn() },
    };
    const ordering = {
      resolveOrderItems: jest.fn().mockResolvedValue([
        {
          productId,
          productName: 'Soto Padang Ayam',
          sellingPrice: new Prisma.Decimal(20000),
          productIngredients: [],
          modifierSnapshots: [
            buildModifierSnapshot(optionId, 'Ayam Suwir', 2500, 0),
            buildModifierSnapshot(secondOptionId, 'Daging Kering', 5000, 1),
          ],
          modifierTotal: new Prisma.Decimal(7500),
        },
      ]),
    };
    const repository = new OrderRepository(
      prisma as unknown as PrismaService,
      ordering as unknown as ProductModifierOrderingService,
    );

    const result = await repository.create(
      organizationId,
      'INV-001',
      'cashier-id',
      undefined,
      OrderType.TAKEAWAY,
      { takeawayOrder: { name: 'Budi' } },
      [
        {
          productId,
          quantity: 2,
          modifierOptionIds: [optionId, secondOptionId],
        },
      ],
    );

    expect(ordering.resolveOrderItems).toHaveBeenCalledWith(
      transaction,
      organizationId,
      [{ productId, modifierOptionIds: [optionId, secondOptionId] }],
    );
    const createArgs = transaction.order.create.mock.calls[0][0];
    expect(createArgs.data.totalAmount.toNumber()).toBe(55000);
    expect(createArgs.data.totalQuantity).toBe(2);
    expect(createArgs.data.items.create[0].unitPrice.toNumber()).toBe(20000);
    expect(
      createArgs.data.items.create[0].modifiers.create.map(
        (modifier: { optionName: string }) => modifier.optionName,
      ),
    ).toEqual(['Ayam Suwir', 'Daging Kering']);
    expect(result.totalAmount.toNumber()).toBe(55000);
    expect(result.items[0].modifiers).toHaveLength(2);
  });

  it('propagates failures from the database transaction', async () => {
    const transaction = {
      inventoryLot: { findMany: jest.fn().mockResolvedValue([]) },
      takeawayOrder: {
        create: jest.fn().mockResolvedValue({ id: referenceId }),
      },
      order: {
        create: jest.fn().mockRejectedValue(new Error('transaction failed')),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
      takeawayOrder: { findMany: jest.fn() },
      deliveryOrder: { findMany: jest.fn() },
      dineInOrder: { findMany: jest.fn() },
    };
    const ordering = {
      resolveOrderItems: jest.fn().mockResolvedValue([
        {
          productId,
          productName: 'Soto Padang Ayam',
          sellingPrice: new Prisma.Decimal(20000),
          productIngredients: [],
          modifierSnapshots: [],
          modifierTotal: new Prisma.Decimal(0),
        },
      ]),
    };
    const repository = new OrderRepository(
      prisma as unknown as PrismaService,
      ordering as unknown as ProductModifierOrderingService,
    );

    await expect(
      repository.create(
        organizationId,
        'INV-001',
        'cashier-id',
        undefined,
        OrderType.TAKEAWAY,
        { takeawayOrder: { name: 'Budi' } },
        [{ productId, quantity: 1 }],
      ),
    ).rejects.toThrow('transaction failed');
  });
});
