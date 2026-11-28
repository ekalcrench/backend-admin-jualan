import { jest } from '@jest/globals';
import {
  Prisma,
  PreparationStatus,
} from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationRepository } from './preparation.repository.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const preparationId = '22222222-2222-4222-8222-222222222222';
const outputInventoryItemId = '33333333-3333-4333-8333-333333333333';
const ingredientInventoryItemId = '44444444-4444-4444-8444-444444444444';
const preparationItemId = '55555555-5555-4555-8555-555555555555';
const preparedAt = new Date('2026-11-28T00:00:00.000Z');

const createRepository = (transaction: object) => {
  const prisma = {
    $transaction: (callback: (transaction: never) => Promise<unknown>) =>
      callback(transaction as never),
  } as unknown as PrismaService;

  return new PreparationRepository(prisma);
};

const buildDraft = (quantity: number) => ({
  id: preparationId,
  status: PreparationStatus.DRAFT,
  outputInventoryItemId,
  outputQuantity: new Prisma.Decimal(100),
  preparedAt,
  expiredAt: null,
  outputLot: null,
  items: [
    {
      id: preparationItemId,
      inventoryItemId: ingredientInventoryItemId,
      quantity: new Prisma.Decimal(quantity),
      unitCost: new Prisma.Decimal(0),
      totalCost: new Prisma.Decimal(0),
    },
  ],
});

describe('PreparationRepository draft stock handling', () => {
  it('creates a draft cost estimate without reserving ingredient stock', async () => {
    const transaction = {
      preparation: {
        create: jest.fn().mockResolvedValue({ id: preparationId }),
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: preparationId }),
      },
      preparationItem: {
        create: jest.fn().mockResolvedValue({}),
      },
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '66666666-6666-4666-8666-666666666666',
            inventoryItemId: ingredientInventoryItemId,
            remainingQuantity: new Prisma.Decimal(5),
            unitCost: new Prisma.Decimal(2.5),
          },
        ]),
        updateMany: jest.fn(),
      },
      inventoryTransaction: {
        createMany: jest.fn(),
      },
    };
    const repository = createRepository(transaction);

    await repository.create(
      organizationId,
      {
        name: 'Test preparation',
        preparedAt,
        outputInventoryItemId,
        outputQuantity: new Prisma.Decimal(100),
      },
      [{ inventoryItemId: ingredientInventoryItemId, quantity: 1000 }],
    );

    expect(transaction.inventoryLot.findMany).toHaveBeenCalledTimes(1);
    expect(transaction.inventoryLot.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventoryTransaction.createMany).not.toHaveBeenCalled();
    expect(transaction.preparationItem.create).toHaveBeenCalledTimes(1);
    const preparationData =
      transaction.preparation.create.mock.calls[0]?.[0].data;
    expect(preparationData.outputTotalCost.toNumber()).toBe(2500);
    expect(preparationData.outputUnitCost.toNumber()).toBe(25);
  });

  it('updates draft ingredients without reserving ingredient stock', async () => {
    const transaction = {
      preparation: {
        findFirst: jest.fn().mockResolvedValue(buildDraft(10)),
        update: jest.fn().mockResolvedValue({}),
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: preparationId }),
      },
      preparationItem: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
      },
      inventoryTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn(),
      },
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    const repository = createRepository(transaction);

    await repository.update(preparationId, organizationId, {}, [
      { id: preparationItemId, quantity: 1000 },
    ]);

    expect(transaction.inventoryLot.update).not.toHaveBeenCalled();
    expect(transaction.inventoryLot.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventoryTransaction.createMany).not.toHaveBeenCalled();
    expect(transaction.preparationItem.create).toHaveBeenCalledTimes(1);
  });

  it('checks ingredient stock when completing a draft', async () => {
    const transaction = {
      preparation: {
        findFirst: jest.fn().mockResolvedValue(buildDraft(10)),
        update: jest.fn(),
        findFirstOrThrow: jest.fn(),
      },
      inventoryTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '66666666-6666-4666-8666-666666666666',
            inventoryItemId: ingredientInventoryItemId,
            remainingQuantity: new Prisma.Decimal(5),
            unitCost: new Prisma.Decimal(1),
          },
        ]),
      },
    };
    const repository = createRepository(transaction);

    await expect(
      repository.complete(preparationId, organizationId),
    ).resolves.toBe('insufficient-stock');
    expect(transaction.inventoryLot.findMany).toHaveBeenCalledTimes(1);
    expect(transaction.preparation.update).not.toHaveBeenCalled();
  });
});
