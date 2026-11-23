import { jest } from '@jest/globals';
import {
  InventoryTransactionType,
  OrderStatus,
  Prisma,
} from '../../prisma/generated/prisma/client.js';
import { OrderType } from '../../prisma/generated/prisma/enums.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ProductModifierOrderingService } from '../product-modifier/product-modifier-ordering.service.js';
import {
  InsufficientOrderInventoryError,
  OrderInventoryReferenceError,
  OrderRepository,
} from './order.repository.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const groupId = '33333333-3333-4333-8333-333333333333';
const optionId = '44444444-4444-4444-8444-444444444444';
const secondOptionId = '55555555-5555-4555-8555-555555555555';
const referenceId = '66666666-6666-4666-8666-666666666666';
const inventoryItemId = '99999999-9999-4999-8999-999999999999';
const secondInventoryItemId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const firstLotId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const secondLotId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const createdAt = new Date('2026-11-21T00:00:00.000Z');

const buildModifierSnapshot = (
  optionIdValue: string,
  optionName: string,
  unitPrice: number,
  sortOrder: number,
  inventory?: { inventoryItemId: string; inventoryQuantity: number },
) => ({
  modifierGroupId: groupId,
  modifierOptionId: optionIdValue,
  groupName: 'Extra Isian',
  optionName,
  unitPrice: new Prisma.Decimal(unitPrice),
  inventoryItemId: inventory?.inventoryItemId ?? null,
  inventoryQuantity:
    inventory?.inventoryQuantity !== undefined
      ? new Prisma.Decimal(inventory.inventoryQuantity)
      : null,
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
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      inventoryItem: { findMany: jest.fn() },
      inventoryTransaction: { createMany: jest.fn() },
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
            buildModifierSnapshot(optionId, 'Ayam Suwir', 2500, 0, {
              inventoryItemId,
              inventoryQuantity: 30,
            }),
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
    // Unpaid orders snapshot modifier inventory but must not consume it yet.
    expect(transaction.inventoryLot.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventoryTransaction.createMany).not.toHaveBeenCalled();
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

const buildPaidOrder = () => ({
  ...buildCreatedOrder(),
  status: OrderStatus.PAID,
});

type MarkPaidOptions = {
  updateCount?: number;
  orderItems?: Array<Record<string, unknown>>;
  inventoryItems?: Array<{ id: string; name: string }>;
  lots?: Array<{
    id: string;
    inventoryItemId: string;
    remainingQuantity: Prisma.Decimal;
    unitCost: Prisma.Decimal;
  }>;
};

const createMarkPaidRepository = ({
  updateCount = 1,
  orderItems = [],
  inventoryItems = [],
  lots = [],
}: MarkPaidOptions = {}) => {
  const transaction = {
    order: {
      updateMany: jest.fn().mockResolvedValue({ count: updateCount }),
      findFirstOrThrow: jest.fn().mockResolvedValue(buildPaidOrder()),
      findFirst: jest.fn().mockResolvedValue({ id: 'order-id' }),
    },
    orderItem: { findMany: jest.fn().mockResolvedValue(orderItems) },
    inventoryItem: { findMany: jest.fn().mockResolvedValue(inventoryItems) },
    inventoryLot: {
      findMany: jest.fn().mockResolvedValue(lots),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    inventoryTransaction: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    cashTransaction: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    $transaction: jest.fn(
      (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
    takeawayOrder: { findMany: jest.fn().mockResolvedValue([]) },
    deliveryOrder: { findMany: jest.fn().mockResolvedValue([]) },
    dineInOrder: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const repository = new OrderRepository(
    prisma as unknown as PrismaService,
    {} as ProductModifierOrderingService,
  );

  return { repository, prisma, transaction };
};

describe('OrderRepository modifier inventory consumption', () => {
  it('aggregates recipe and modifier consumption by inventory item and deducts FIFO lots using the order quantity', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      orderItems: [
        {
          quantity: 3,
          product: {
            productIngredients: [
              { inventoryItemId, quantity: new Prisma.Decimal(10) },
            ],
          },
          modifiers: [
            {
              inventoryItemId,
              inventoryQuantity: new Prisma.Decimal(30),
            },
            {
              inventoryItemId,
              inventoryQuantity: new Prisma.Decimal(20),
            },
            { inventoryItemId: null, inventoryQuantity: null },
          ],
        },
      ],
      inventoryItems: [{ id: inventoryItemId, name: 'Ayam Suwir' }],
      lots: [
        {
          id: firstLotId,
          inventoryItemId,
          remainingQuantity: new Prisma.Decimal(100),
          unitCost: new Prisma.Decimal(2),
        },
        {
          id: secondLotId,
          inventoryItemId,
          remainingQuantity: new Prisma.Decimal(100),
          unitCost: new Prisma.Decimal(3),
        },
      ],
    });

    const result = await repository.markPaid('order-id', organizationId);

    expect(typeof result).not.toBe('string');
    const lotUpdates = transaction.inventoryLot.updateMany.mock.calls;
    expect(lotUpdates).toHaveLength(2);
    expect(lotUpdates[0][0].where.id).toBe(firstLotId);
    expect(lotUpdates[0][0].data.remainingQuantity.decrement.toString()).toBe(
      '100',
    );
    expect(lotUpdates[1][0].where.id).toBe(secondLotId);
    expect(lotUpdates[1][0].data.remainingQuantity.decrement.toString()).toBe(
      '80',
    );

    const transactionData =
      transaction.inventoryTransaction.createMany.mock.calls[0][0].data;
    expect(transactionData).toHaveLength(2);
    expect(transactionData[0]).toMatchObject({
      organizationId,
      inventoryItemId,
      inventoryLotId: firstLotId,
      type: InventoryTransactionType.SALE,
      referenceId: 'order-id',
    });
    expect(transactionData[0].quantity.toString()).toBe('100');
    expect(transactionData[1].quantity.toString()).toBe('80');
    expect(transaction.cashTransaction.create).toHaveBeenCalledTimes(1);
  });

  it('fails finalization without writing lots or transactions when stock is insufficient', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      orderItems: [
        {
          quantity: 2,
          product: { productIngredients: [] },
          modifiers: [
            {
              inventoryItemId,
              inventoryQuantity: new Prisma.Decimal(30),
            },
          ],
        },
      ],
      inventoryItems: [{ id: inventoryItemId, name: 'Kuah Soto' }],
      lots: [
        {
          id: firstLotId,
          inventoryItemId,
          remainingQuantity: new Prisma.Decimal(50),
          unitCost: new Prisma.Decimal(1),
        },
      ],
    });

    await expect(
      repository.markPaid('order-id', organizationId),
    ).rejects.toBeInstanceOf(InsufficientOrderInventoryError);

    expect(transaction.inventoryLot.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventoryTransaction.createMany).not.toHaveBeenCalled();
    expect(transaction.cashTransaction.create).not.toHaveBeenCalled();
  });

  it('does not deduct again when the finalization request is repeated', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      updateCount: 0,
    });

    const result = await repository.markPaid('order-id', organizationId);

    expect(result).toBe('already-paid');
    expect(transaction.orderItem.findMany).not.toHaveBeenCalled();
    expect(transaction.inventoryLot.findMany).not.toHaveBeenCalled();
    expect(transaction.inventoryLot.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventoryTransaction.createMany).not.toHaveBeenCalled();
    expect(transaction.cashTransaction.create).not.toHaveBeenCalled();
  });

  it('rejects a snapshot whose inventory item no longer belongs to the organization', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      orderItems: [
        {
          quantity: 1,
          product: { productIngredients: [] },
          modifiers: [
            {
              inventoryItemId,
              inventoryQuantity: new Prisma.Decimal(30),
            },
          ],
        },
      ],
      inventoryItems: [],
    });

    await expect(
      repository.markPaid('order-id', organizationId),
    ).rejects.toBeInstanceOf(OrderInventoryReferenceError);
    expect(transaction.inventoryLot.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventoryTransaction.createMany).not.toHaveBeenCalled();
  });

  it('consumes only the preparation output item referenced by the modifier', async () => {
    const outputItemId = secondInventoryItemId;
    const { repository, transaction } = createMarkPaidRepository({
      orderItems: [
        {
          quantity: 1,
          product: { productIngredients: [] },
          modifiers: [
            {
              inventoryItemId: outputItemId,
              inventoryQuantity: new Prisma.Decimal(250),
            },
          ],
        },
      ],
      inventoryItems: [{ id: outputItemId, name: 'Kuah Soto' }],
      lots: [
        {
          id: secondLotId,
          inventoryItemId: outputItemId,
          remainingQuantity: new Prisma.Decimal(1000),
          unitCost: new Prisma.Decimal(5),
        },
      ],
    });

    await repository.markPaid('order-id', organizationId);

    expect(transaction.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId, id: { in: [outputItemId] } },
      }),
    );
    const transactionData =
      transaction.inventoryTransaction.createMany.mock.calls[0][0].data;
    expect(transactionData).toHaveLength(1);
    expect(transactionData[0].inventoryItemId).toBe(outputItemId);
    expect(transactionData[0].quantity.toString()).toBe('250');
  });

  it('does not touch inventory for modifiers without inventory integration', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      orderItems: [
        {
          quantity: 5,
          product: { productIngredients: [] },
          modifiers: [{ inventoryItemId: null, inventoryQuantity: null }],
        },
      ],
    });

    await repository.markPaid('order-id', organizationId);

    expect(transaction.inventoryItem.findMany).not.toHaveBeenCalled();
    expect(transaction.inventoryLot.findMany).not.toHaveBeenCalled();
    expect(transaction.inventoryLot.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventoryTransaction.createMany).not.toHaveBeenCalled();
    expect(transaction.cashTransaction.create).toHaveBeenCalledTimes(1);
  });
});
