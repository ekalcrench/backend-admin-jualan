import { jest } from '@jest/globals';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { ProductModifierOrderingService } from './product-modifier-ordering.service.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const otherOrganizationId = '99999999-9999-4999-8999-999999999999';
const productId = '22222222-2222-4222-8222-222222222222';
const extraGroupId = '33333333-3333-4333-8333-333333333333';
const donenessGroupId = '44444444-4444-4444-8444-444444444444';
const ayamSuwirId = '55555555-5555-4555-8555-555555555555';
const dagingKeringId = '66666666-6666-4666-8666-666666666666';
const normalId = '77777777-7777-4777-8777-777777777777';
const keringId = '88888888-8888-4888-8888-888888888888';
const inactiveOptionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otherOrgOptionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const inventoryItemId = '99999999-9999-4999-8999-999999999999';

const option = (
  id: string,
  name: string,
  price: number,
  sortOrder: number,
  inventory?: { inventoryItemId: string; inventoryQuantity: number },
) => ({
  id,
  name,
  price: new Prisma.Decimal(price),
  inventoryItemId: inventory?.inventoryItemId ?? null,
  inventoryQuantity:
    inventory?.inventoryQuantity !== undefined
      ? new Prisma.Decimal(inventory.inventoryQuantity)
      : null,
  sortOrder,
});

const group = (
  id: string,
  name: string,
  options: ReturnType<typeof option>[],
  overrides: Partial<{
    isRequired: boolean;
    minSelection: number;
    maxSelection: number;
    isMultiple: boolean;
    organizationId: string;
  }> = {},
) => ({
  id,
  organizationId: overrides.organizationId ?? organizationId,
  name,
  isRequired: overrides.isRequired ?? false,
  minSelection: overrides.minSelection ?? 0,
  maxSelection: overrides.maxSelection ?? Math.max(1, options.length),
  isMultiple: overrides.isMultiple ?? false,
  options,
});

const buildProduct = () => ({
  id: productId,
  organizationId,
  name: 'Soto Padang Ayam',
  sellingPrice: new Prisma.Decimal(20000),
  isActive: true,
  productIngredients: [],
  modifierGroupMappings: [
    {
      modifierGroup: group(
        extraGroupId,
        'Extra Isian',
        [
          option(ayamSuwirId, 'Ayam Suwir', 2500, 0, {
            inventoryItemId,
            inventoryQuantity: 30,
          }),
          option(dagingKeringId, 'Daging Kering', 5000, 1),
        ],
        { minSelection: 0, maxSelection: 3, isMultiple: true },
      ),
    },
    {
      modifierGroup: group(
        donenessGroupId,
        'Tingkat Kematangan',
        [option(keringId, 'Kering', 0, 0), option(normalId, 'Normal', 0, 1)],
        {
          isRequired: true,
          minSelection: 1,
          maxSelection: 1,
          isMultiple: false,
        },
      ),
    },
  ],
});

const createTransaction = () => {
  const findMany = jest.fn();
  const transaction = {
    product: { findMany },
  } as unknown as Prisma.TransactionClient;

  return { findMany, transaction };
};

describe('ProductModifierOrderingService', () => {
  let service: ProductModifierOrderingService;

  beforeEach(() => {
    service = new ProductModifierOrderingService();
  });

  it('returns no snapshots for a product without modifier groups', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([
      {
        ...buildProduct(),
        productIngredients: [],
        modifierGroupMappings: [],
      },
    ]);

    const result = await service.resolveOrderItems(
      transaction,
      organizationId,
      [{ productId, modifierOptionIds: [] }],
    );

    expect(result[0].modifierSnapshots).toEqual([]);
    expect(result[0].modifierTotal.toNumber()).toBe(0);
    expect(result[0].sellingPrice.toNumber()).toBe(20000);
  });

  it('resolves multiple groups and calculates the modifier total in Decimal', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([buildProduct()]);

    const result = await service.resolveOrderItems(
      transaction,
      organizationId,
      [
        {
          productId,
          modifierOptionIds: [ayamSuwirId, keringId],
        },
      ],
    );

    expect(result[0].modifierTotal.toNumber()).toBe(2500);
    expect(result[0].modifierSnapshots).toHaveLength(2);
    expect(result[0].modifierSnapshots?.map((item) => item.optionName)).toEqual(
      ['Ayam Suwir', 'Kering'],
    );
    expect(result[0].modifierSnapshots?.[0]).toMatchObject({
      modifierGroupId: extraGroupId,
      modifierOptionId: ayamSuwirId,
      groupName: 'Extra Isian',
      optionName: 'Ayam Suwir',
      sortOrder: 0,
    });
  });

  it('snapshots the configured inventory item and quantity for each selected option', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([buildProduct()]);

    const result = await service.resolveOrderItems(
      transaction,
      organizationId,
      [
        {
          productId,
          modifierOptionIds: [ayamSuwirId, dagingKeringId, normalId],
        },
      ],
    );

    expect(result[0].modifierSnapshots?.[0]).toMatchObject({
      optionName: 'Ayam Suwir',
      inventoryItemId,
      inventoryQuantity: new Prisma.Decimal(30),
    });
    expect(result[0].modifierSnapshots?.[1]).toMatchObject({
      optionName: 'Daging Kering',
      inventoryItemId: null,
      inventoryQuantity: null,
    });
  });

  it('accepts zero-priced required options', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([buildProduct()]);

    const result = await service.resolveOrderItems(
      transaction,
      organizationId,
      [{ productId, modifierOptionIds: [normalId] }],
    );

    expect(result[0].modifierTotal.toNumber()).toBe(0);
    expect(result[0].modifierSnapshots?.[0].unitPrice.toNumber()).toBe(0);
  });

  it('rejects a missing required selection', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([buildProduct()]);

    await expect(
      service.resolveOrderItems(transaction, organizationId, [
        { productId, modifierOptionIds: [] },
      ]),
    ).rejects.toMatchObject({ code: 'selection-min' });
  });

  it('rejects selections above maxSelection', async () => {
    const { findMany, transaction } = createTransaction();
    const product = buildProduct();
    product.modifierGroupMappings[0].modifierGroup.maxSelection = 1;
    findMany.mockResolvedValue([product]);

    await expect(
      service.resolveOrderItems(transaction, organizationId, [
        {
          productId,
          modifierOptionIds: [ayamSuwirId, dagingKeringId, normalId],
        },
      ]),
    ).rejects.toMatchObject({ code: 'selection-max' });
  });

  it('rejects duplicate modifier option ids', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([buildProduct()]);

    await expect(
      service.resolveOrderItems(transaction, organizationId, [
        {
          productId,
          modifierOptionIds: [ayamSuwirId, ayamSuwirId, normalId],
        },
      ]),
    ).rejects.toMatchObject({ code: 'duplicate-modifier-option' });
  });

  it('rejects an option that is not part of the product active groups', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([buildProduct()]);

    await expect(
      service.resolveOrderItems(transaction, organizationId, [
        {
          productId,
          modifierOptionIds: [inactiveOptionId, normalId],
        },
      ]),
    ).rejects.toMatchObject({ code: 'modifier-option-invalid' });
  });

  it('rejects an option from another organization because it is not in the product mappings', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([buildProduct()]);

    await expect(
      service.resolveOrderItems(transaction, organizationId, [
        {
          productId,
          modifierOptionIds: [otherOrgOptionId, normalId],
        },
      ]),
    ).rejects.toMatchObject({ code: 'modifier-option-invalid' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId, id: { in: [productId] } },
      }),
    );
  });

  it('rejects products outside the organization', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([]);

    await expect(
      service.resolveOrderItems(transaction, otherOrganizationId, [
        { productId, modifierOptionIds: [] },
      ]),
    ).rejects.toMatchObject({ code: 'product-not-found' });
  });

  it('rejects inactive products even when they have valid modifier mappings', async () => {
    const { findMany, transaction } = createTransaction();
    const product = buildProduct();
    product.isActive = false;
    findMany.mockResolvedValue([product]);

    await expect(
      service.resolveOrderItems(transaction, organizationId, [
        { productId, modifierOptionIds: [normalId] },
      ]),
    ).rejects.toMatchObject({ code: 'product-inactive' });
  });

  it('preserves existing snapshots when id list is null', async () => {
    const { findMany, transaction } = createTransaction();
    findMany.mockResolvedValue([buildProduct()]);

    const result = await service.resolveOrderItems(
      transaction,
      organizationId,
      [{ productId, modifierOptionIds: null }],
    );

    expect(result[0].modifierSnapshots).toBeUndefined();
    expect(result[0].modifierTotal.toNumber()).toBe(0);
    expect(result[0].sellingPrice.toNumber()).toBe(20000);
  });
});
