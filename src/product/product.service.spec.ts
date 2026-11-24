import { jest } from '@jest/globals';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import {
  InventoryPolicy,
  OrganizationUserRole,
  ProductStockManagement,
} from '../../prisma/generated/prisma/enums.js';
import type { UserRequestHeader } from '../common/types/user-request-header.types.js';
import { ProductRepository } from './product.repository.js';
import { ProductService } from './product.service.js';
import type { ProductRecord } from './types/product-record.types.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const inventoryItemId = '33333333-3333-4333-8333-333333333333';
const createdAt = new Date('2026-11-21T00:00:00.000Z');

const user = {
  sub: 'user-id',
  name: 'Owner',
  roles: [],
  organizationId,
  organization_roles: [OrganizationUserRole.OWNER],
  jwt_id: 'jwt-id',
} satisfies UserRequestHeader;

const buildProduct = (
  isActive = true,
  name = 'Soto Padang Ayam',
): ProductRecord => ({
  id: productId,
  organizationId,
  name,
  sellingPrice: new Prisma.Decimal(20000),
  isActive,
  stockManagement: ProductStockManagement.UNTRACKED,
  stock: null,
  inventoryPolicy: InventoryPolicy.STRICT,
  createdAt,
  updatedAt: createdAt,
  productIngredients: [],
});

type MockRepository = {
  [Key in keyof ProductRepository]: ReturnType<typeof jest.fn>;
};

const createRepository = (): MockRepository => ({
  findByPages: jest.fn(),
  findOptions: jest.fn(),
  findOverview: jest.fn(),
  findById: jest.fn(),
  findInventoryItemsByIds: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findRemainingStockByInventoryItemIds: jest.fn(),
});

describe('ProductService isActive integration', () => {
  let repository: MockRepository;
  let service: ProductService;

  beforeEach(() => {
    repository = createRepository();
    repository.findRemainingStockByInventoryItemIds.mockResolvedValue([]);
    service = new ProductService(repository as unknown as ProductRepository);
  });

  it('defaults new products to active', async () => {
    repository.findInventoryItemsByIds.mockResolvedValue([
      { id: inventoryItemId },
    ]);
    repository.create.mockResolvedValue(buildProduct(true));

    const result = await service.create(
      {
        name: 'Soto Padang Ayam',
        sellingPrice: 20000,
        productIngredients: [{ inventoryItemId, quantity: 100 }],
      },
      user,
    );

    expect(repository.create).toHaveBeenCalledWith(
      organizationId,
      {
        name: 'Soto Padang Ayam',
        sellingPrice: 20000,
        isActive: true,
        stockManagement: ProductStockManagement.UNTRACKED,
        stock: null,
        inventoryPolicy: undefined,
      },
      [{ inventoryItemId, quantity: 100 }],
    );
    expect(result.isActive).toBe(true);
    expect(result.stock).toBeNull();
    expect(result.stockManagement).toBe(ProductStockManagement.UNTRACKED);
  });

  it('requires an initial stock value for manual stock management', async () => {
    await expect(
      service.create(
        {
          name: 'Soto Padang Ayam',
          sellingPrice: 20000,
          stockManagement: ProductStockManagement.MANUAL,
        },
        user,
      ),
    ).rejects.toThrow('A non-negative stock value is required');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('persists and returns user-managed product stock', async () => {
    repository.create.mockResolvedValue({
      ...buildProduct(),
      stockManagement: ProductStockManagement.MANUAL,
      stock: 5,
    });

    const result = await service.create(
      {
        name: 'Soto Padang Ayam',
        sellingPrice: 20000,
        stockManagement: ProductStockManagement.MANUAL,
        stock: 5,
      },
      user,
    );

    expect(repository.create).toHaveBeenCalledWith(
      organizationId,
      expect.objectContaining({
        stockManagement: ProductStockManagement.MANUAL,
        stock: 5,
      }),
      [],
    );
    expect(result.stock).toBe(5);
  });

  it.each([
    ProductStockManagement.UNTRACKED,
    ProductStockManagement.INVENTORY,
  ])('clears manual stock when switching to %s', async (stockManagement) => {
    repository.findById.mockResolvedValue({
      ...buildProduct(),
      stockManagement: ProductStockManagement.MANUAL,
      stock: 5,
    });
    repository.update.mockResolvedValue({
      ...buildProduct(),
      stockManagement,
      stock: null,
    });

    await service.update(productId, { stockManagement }, user);

    expect(repository.update).toHaveBeenCalledWith(
      productId,
      { stockManagement, stock: null },
      [],
      undefined,
    );
  });

  it('creates an inactive product when requested', async () => {
    repository.findInventoryItemsByIds.mockResolvedValue([
      { id: inventoryItemId },
    ]);
    repository.create.mockResolvedValue(buildProduct(false));

    const result = await service.create(
      {
        name: 'Soto Padang Ayam',
        sellingPrice: 20000,
        isActive: false,
        productIngredients: [{ inventoryItemId, quantity: 100 }],
      },
      user,
    );

    expect(repository.create).toHaveBeenCalledWith(
      organizationId,
      expect.objectContaining({ isActive: false }),
      expect.any(Array),
    );
    expect(result.isActive).toBe(false);
  });

  it('updates only the active status without touching ingredients', async () => {
    repository.findById.mockResolvedValue(buildProduct(true));
    repository.update.mockResolvedValue(buildProduct(false));

    const result = await service.update(productId, { isActive: false }, user);

    expect(repository.update).toHaveBeenCalledWith(
      productId,
      { isActive: false },
      [],
      undefined,
    );
    expect(result.isActive).toBe(false);
  });

  it('returns inactive products for management reads', async () => {
    repository.findById.mockResolvedValue(buildProduct(false));

    const result = await service.findById(productId, user);

    expect(result.isActive).toBe(false);
  });
});
