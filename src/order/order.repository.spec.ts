import { jest } from '@jest/globals';
import {
  CostingStatus,
  InventoryPolicy,
  InventoryTransactionType,
  OrderStatus,
  ProductStockManagement,
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
  trackInventory: Boolean(inventory),
  inventoryPolicy: InventoryPolicy.STRICT,
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
      costingStatus: CostingStatus.UNKNOWN,
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
      $queryRaw: jest.fn().mockResolvedValue([]),
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: firstLotId,
            inventoryItemId,
            remainingQuantity: new Prisma.Decimal(40),
            unitCost: new Prisma.Decimal(2),
          },
          {
            id: secondLotId,
            inventoryItemId,
            remainingQuantity: new Prisma.Decimal(100),
            unitCost: new Prisma.Decimal(3),
          },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
      inventoryItem: {
        findMany: jest.fn().mockResolvedValue([{ id: inventoryItemId }]),
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'order-item-id',
            productId,
            quantity: 2,
            manualStockDeducted: false,
            product: {
              name: 'Soto Padang Ayam',
              stock: 5,
              stockManagement: ProductStockManagement.MANUAL,
            },
          },
        ]),
        update: jest.fn(),
      },
      product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      inventoryTransaction: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
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
          stockManagement: ProductStockManagement.MANUAL,
          stock: 5,
          inventoryPolicy: InventoryPolicy.STRICT,
          productIngredients: [
            { inventoryItemId, quantity: new Prisma.Decimal(15) },
          ],
          modifierSnapshots: [
            buildModifierSnapshot(optionId, 'Ayam Suwir', 2500, 0, {
              inventoryItemId,
              inventoryQuantity: 30,
            }),
            {
              ...buildModifierSnapshot(
                secondOptionId,
                'Daging Kering',
                5000,
                1,
                {
                  inventoryItemId,
                  inventoryQuantity: 15,
                },
              ),
              trackInventory: false,
            },
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
    expect(createArgs.data.items.create[0].manualStockDeducted).toBe(true);
    expect(
      createArgs.data.items.create[0].modifiers.create.map(
        (modifier: { optionName: string }) => modifier.optionName,
      ),
    ).toEqual(['Ayam Suwir', 'Daging Kering']);
    expect(result.totalAmount.toNumber()).toBe(55000);
    expect(result.items[0].modifiers).toHaveLength(2);
    expect(createArgs.data.items.create[0].unitCost.toNumber()).toBe(140);
    expect(createArgs.data.items.create[0].costingStatus).toBe(
      CostingStatus.CALCULATED,
    );
    expect(transaction.inventoryLot.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: firstLotId, remainingQuantity: new Prisma.Decimal(40) },
        data: { remainingQuantity: new Prisma.Decimal(0) },
      }),
    );
    expect(transaction.inventoryLot.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: secondLotId, remainingQuantity: new Prisma.Decimal(100) },
        data: { remainingQuantity: new Prisma.Decimal(80) },
      }),
    );
    const inventoryTransactions =
      transaction.inventoryTransaction.createMany.mock.calls[0][0].data;
    expect(inventoryTransactions).toHaveLength(2);
    expect(inventoryTransactions[0].quantity.toString()).toBe('40');
    expect(inventoryTransactions[1].quantity.toString()).toBe('20');
    expect(transaction.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: productId,
          stock: { gte: 2 },
        }),
        data: { stock: { decrement: 2 } },
      }),
    );
  });

  it('marks a cost unknown when an untracked recipe has no costed lots', async () => {
    const transaction = {
      inventoryItem: {
        findMany: jest.fn().mockResolvedValue([{ id: inventoryItemId }]),
      },
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'order-item-id',
            productId,
            quantity: 1,
            manualStockDeducted: false,
            product: {
              name: 'No-cost-lot product',
              stock: null,
              stockManagement: ProductStockManagement.UNTRACKED,
            },
          },
        ]),
        update: jest.fn(),
      },
      product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      inventoryTransaction: { createMany: jest.fn() },
      takeawayOrder: {
        create: jest.fn().mockResolvedValue({ id: referenceId }),
      },
      order: {
        create: jest.fn().mockResolvedValue(buildCreatedOrder()),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
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
    const ordering = {
      resolveOrderItems: jest.fn().mockResolvedValue([
        {
          productId,
          productName: 'No-cost-lot product',
          sellingPrice: new Prisma.Decimal(100),
          stockManagement: ProductStockManagement.UNTRACKED,
          stock: null,
          inventoryPolicy: InventoryPolicy.STRICT,
          productIngredients: [
            { inventoryItemId, quantity: new Prisma.Decimal(1) },
          ],
          modifierSnapshots: [],
          modifierTotal: new Prisma.Decimal(0),
        },
      ]),
    };
    const repository = new OrderRepository(
      prisma as unknown as PrismaService,
      ordering as unknown as ProductModifierOrderingService,
    );

    await repository.create(
      organizationId,
      'INV-UNKNOWN',
      'cashier-id',
      undefined,
      OrderType.TAKEAWAY,
      { takeawayOrder: { name: 'Budi' } },
      [{ productId, quantity: 1 }],
    );

    const itemData =
      transaction.order.create.mock.calls[0][0].data.items.create[0];
    expect(itemData.unitCost.toNumber()).toBe(0);
    expect(itemData.costingStatus).toBe(CostingStatus.UNKNOWN);
    expect(transaction.inventoryLot.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventoryTransaction.createMany).not.toHaveBeenCalled();
  });

  it('propagates failures from the database transaction', async () => {
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([]),
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
          stockManagement: ProductStockManagement.UNTRACKED,
          stock: null,
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
  const normalizedOrderItems = orderItems.map((item) => {
    const product = item.product as Record<string, unknown> | undefined;
    const modifiers = item.modifiers as Array<Record<string, unknown>>;
    return {
      ...item,
      id: item.id ?? 'order-item-id',
      productId: item.productId ?? productId,
      manualStockDeducted: item.manualStockDeducted ?? false,
      product: {
        stockManagement: ProductStockManagement.UNTRACKED,
        stock: null,
        name: 'Soto Padang Ayam',
        inventoryPolicy: InventoryPolicy.STRICT,
        ...product,
      },
      modifiers: (modifiers ?? []).map((modifier) => ({
        trackInventory: Boolean(modifier.inventoryItemId),
        inventoryPolicy: InventoryPolicy.STRICT,
        ...modifier,
      })),
    };
  });
  const normalizedLots = lots.map((lot) => ({
    quantity: new Prisma.Decimal(100),
    purchaseItemId: 'purchase-item-id',
    preparationOutputId: null,
    ...lot,
  }));
  const transaction = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    order: {
      updateMany: jest.fn().mockResolvedValue({ count: updateCount }),
      findFirstOrThrow: jest.fn().mockResolvedValue(buildPaidOrder()),
      findFirst: jest.fn().mockResolvedValue({ id: 'order-id' }),
      update: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn().mockResolvedValue(normalizedOrderItems),
      update: jest.fn(),
    },
    product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    inventoryItem: { findMany: jest.fn().mockResolvedValue(inventoryItems) },
    inventoryLot: {
      findMany: jest.fn().mockResolvedValue(normalizedLots),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({ id: firstLotId }),
    },
    inventoryTransaction: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
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
            stockManagement: ProductStockManagement.INVENTORY,
            inventoryPolicy: InventoryPolicy.STRICT,
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
    expect(lotUpdates[0][0].data.remainingQuantity.toString()).toBe('0');
    expect(lotUpdates[1][0].where.id).toBe(secondLotId);
    expect(lotUpdates[1][0].data.remainingQuantity.toString()).toBe('20');

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

  it('rejects an order whose manual product stock is below the requested quantity', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      orderItems: [
        {
          quantity: 2,
          product: {
            name: 'Soto Padang Ayam',
            stockManagement: ProductStockManagement.MANUAL,
            stock: 1,
            inventoryPolicy: InventoryPolicy.ALLOW_NEGATIVE,
            productIngredients: [],
          },
        },
      ],
    });
    transaction.product.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.markPaid('order-id', organizationId),
    ).rejects.toMatchObject({ name: 'InsufficientManualProductStockError' });

    expect(transaction.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          stockManagement: ProductStockManagement.MANUAL,
          stock: { gte: 2 },
        }),
      }),
    );
    expect(transaction.cashTransaction.create).not.toHaveBeenCalled();
  });

  it('assigns ALLOW_NEGATIVE shortages to the oldest FIFO lot', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      orderItems: [
        {
          quantity: 1,
          product: { productIngredients: [] },
          modifiers: [
            {
              inventoryItemId,
              inventoryQuantity: new Prisma.Decimal(10),
              trackInventory: true,
              inventoryPolicy: InventoryPolicy.ALLOW_NEGATIVE,
            },
          ],
        },
      ],
      inventoryItems: [{ id: inventoryItemId, name: 'Coffee' }],
      lots: [
        {
          id: firstLotId,
          inventoryItemId,
          remainingQuantity: new Prisma.Decimal(5),
          unitCost: new Prisma.Decimal(4),
        },
      ],
    });

    await repository.markPaid('order-id', organizationId);

    expect(transaction.inventoryLot.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: firstLotId, remainingQuantity: new Prisma.Decimal(5) },
        data: { remainingQuantity: new Prisma.Decimal(-5) },
      }),
    );
    const saleTransactions =
      transaction.inventoryTransaction.createMany.mock.calls[0][0].data;
    expect(saleTransactions).toHaveLength(1);
    expect(saleTransactions[0].inventoryLotId).toBe(firstLotId);
    expect(saleTransactions[0].quantity.toString()).toBe('10');
  });

  it('checks strict demand separately before allowing another source to go negative', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      orderItems: [
        {
          quantity: 1,
          product: { productIngredients: [] },
          modifiers: [
            {
              inventoryItemId,
              inventoryQuantity: new Prisma.Decimal(8),
              trackInventory: true,
              inventoryPolicy: InventoryPolicy.STRICT,
            },
            {
              inventoryItemId,
              inventoryQuantity: new Prisma.Decimal(8),
              trackInventory: true,
              inventoryPolicy: InventoryPolicy.ALLOW_NEGATIVE,
            },
          ],
        },
      ],
      inventoryItems: [{ id: inventoryItemId, name: 'Coffee' }],
      lots: [
        {
          id: firstLotId,
          inventoryItemId,
          remainingQuantity: new Prisma.Decimal(10),
          unitCost: new Prisma.Decimal(4),
        },
      ],
    });

    await repository.markPaid('order-id', organizationId);

    expect(transaction.inventoryLot.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: firstLotId, remainingQuantity: new Prisma.Decimal(10) },
        data: { remainingQuantity: new Prisma.Decimal(-6) },
      }),
    );
  });

  it('creates an auditable shortage lot when ALLOW_NEGATIVE has no FIFO lots', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      orderItems: [
        {
          quantity: 1,
          product: { productIngredients: [] },
          modifiers: [
            {
              inventoryItemId,
              inventoryQuantity: new Prisma.Decimal(10),
              trackInventory: true,
              inventoryPolicy: InventoryPolicy.ALLOW_NEGATIVE,
            },
          ],
        },
      ],
      inventoryItems: [{ id: inventoryItemId, name: 'Coffee' }],
    });

    await repository.markPaid('order-id', organizationId);

    expect(transaction.inventoryLot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inventoryItemId,
          quantity: new Prisma.Decimal(0),
          remainingQuantity: new Prisma.Decimal(-10),
          unitCost: new Prisma.Decimal(0),
        }),
      }),
    );
    const saleTransactions =
      transaction.inventoryTransaction.createMany.mock.calls[0][0].data;
    expect(saleTransactions[0].inventoryLotId).toBe(firstLotId);
    expect(saleTransactions[0].unitCost.toString()).toBe('0');
  });

  it('does not deduct again when the finalization request is repeated', async () => {
    const { repository, transaction } = createMarkPaidRepository({
      updateCount: 0,
    });
    transaction.order.findFirst.mockResolvedValue({
      id: 'order-id',
      status: OrderStatus.PAID,
      inventoryDeducted: true,
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

describe('OrderRepository manual product stock', () => {
  it('restores manual product stock when an unpaid order is deleted', async () => {
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      order: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'order-id',
          status: OrderStatus.UNPAID,
          type: OrderType.TAKEAWAY,
          referenceId,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirstOrThrow: jest
          .fn()
          .mockResolvedValue({ inventoryDeducted: false }),
        delete: jest.fn(),
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            productId,
            quantity: 2,
            manualStockDeducted: true,
          },
        ]),
        deleteMany: jest.fn(),
      },
      product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      takeawayOrder: { deleteMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const repository = new OrderRepository(
      prisma as unknown as PrismaService,
      {} as ProductModifierOrderingService,
    );

    await expect(repository.delete('order-id', organizationId)).resolves.toBe(
      'deleted',
    );

    expect(transaction.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: productId, organizationId, stock: { not: null } },
        data: { stock: { increment: 2 } },
      }),
    );
    expect(transaction.orderItem.deleteMany).toHaveBeenCalled();
  });

  it('restores previous manual stock and deducts the updated quantity on unpaid edits', async () => {
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      order: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'order-id',
          status: OrderStatus.UNPAID,
          type: OrderType.TAKEAWAY,
          referenceId,
          inventoryDeducted: true,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
        findFirstOrThrow: jest.fn().mockResolvedValue(buildCreatedOrder()),
      },
      orderItem: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'order-item-id',
              productId,
              quantity: 2,
              manualStockDeducted: true,
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'order-item-id',
              productId,
              quantity: 2,
              modifiers: [],
            },
          ])
          .mockResolvedValueOnce([
            {
              quantity: 3,
              unitPrice: new Prisma.Decimal(20000),
              modifiers: [],
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'order-item-id',
              quantity: 3,
              product: {
                stockManagement: ProductStockManagement.MANUAL,
                inventoryPolicy: InventoryPolicy.STRICT,
                productIngredients: [],
              },
              modifiers: [],
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'order-item-id',
              productId,
              quantity: 3,
              manualStockDeducted: false,
              product: {
                name: 'Soto Padang Ayam',
                stockManagement: ProductStockManagement.MANUAL,
                stock: 5,
              },
            },
          ]),
        update: jest.fn(),
      },
      orderItemModifier: { deleteMany: jest.fn() },
      product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      inventoryTransaction: { findMany: jest.fn().mockResolvedValue([]) },
      inventoryItem: { findMany: jest.fn().mockResolvedValue([]) },
      inventoryLot: { findMany: jest.fn().mockResolvedValue([]) },
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
    const ordering = {
      resolveOrderItems: jest.fn().mockResolvedValue([
        {
          productId,
          productName: 'Soto Padang Ayam',
          sellingPrice: new Prisma.Decimal(20000),
          stockManagement: ProductStockManagement.MANUAL,
          stock: 5,
          inventoryPolicy: InventoryPolicy.STRICT,
          productIngredients: [],
          modifierTotal: new Prisma.Decimal(0),
        },
      ]),
    };
    const repository = new OrderRepository(
      prisma as unknown as PrismaService,
      ordering as unknown as ProductModifierOrderingService,
    );

    await repository.update('order-id', organizationId, {}, [
      { id: 'order-item-id', quantity: 3, itemData: {} },
    ]);

    expect(transaction.product.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: productId, organizationId, stock: { not: null } },
        data: { stock: { increment: 2 } },
      }),
    );
    expect(transaction.product.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          id: productId,
          stockManagement: ProductStockManagement.MANUAL,
          stock: { gte: 3 },
        }),
        data: { stock: { decrement: 3 } },
      }),
    );
  });
});
