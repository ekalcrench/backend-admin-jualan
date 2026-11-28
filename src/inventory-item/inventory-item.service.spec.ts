import { jest } from '@jest/globals';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { OrganizationUserRole } from '../../prisma/generated/prisma/enums.js';
import type { UserRequestHeader } from '../common/types/user-request-header.types.js';
import { InventoryItemRepository } from './inventory-item.repository.js';
import { InventoryItemService } from './inventory-item.service.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const itemWithLotsId = '22222222-2222-4222-8222-222222222222';
const itemWithoutLotsId = '33333333-3333-4333-8333-333333333333';

const user = {
  sub: 'user-id',
  name: 'Owner',
  roles: [],
  organizationId,
  organization_roles: [OrganizationUserRole.OWNER],
  jwt_id: 'jwt-id',
} satisfies UserRequestHeader;

type MockRepository = {
  [Key in keyof InventoryItemRepository]: ReturnType<typeof jest.fn>;
};

const createRepository = (): MockRepository => ({
  findByPages: jest.fn(),
  findById: jest.fn(),
  findByIds: jest.fn(),
  findOptions: jest.fn(),
  findRemainingStockByInventoryItemIds: jest.fn(),
  getAssets: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('InventoryItemService options', () => {
  let repository: MockRepository;
  let service: InventoryItemService;

  beforeEach(() => {
    repository = createRepository();
    service = new InventoryItemService(
      repository as unknown as InventoryItemRepository,
    );
  });

  it('keeps the existing options response unchanged', async () => {
    const items = [{ id: itemWithLotsId, name: 'Rice', unit: 'GRAM' }];
    repository.findOptions.mockResolvedValue(items);

    await expect(service.findOptions(user)).resolves.toEqual(items);
    expect(
      repository.findRemainingStockByInventoryItemIds,
    ).not.toHaveBeenCalled();
  });

  it('returns stock aggregated from inventory lots and zero when no lots exist', async () => {
    repository.findOptions.mockResolvedValue([
      { id: itemWithLotsId, name: 'Rice', unit: 'GRAM' },
      { id: itemWithoutLotsId, name: 'Salt', unit: 'GRAM' },
    ]);
    repository.findRemainingStockByInventoryItemIds.mockResolvedValue([
      {
        inventoryItemId: itemWithLotsId,
        _sum: { remainingQuantity: new Prisma.Decimal(12.5) },
      },
    ]);

    await expect(service.findOptionsWithStock(user)).resolves.toEqual([
      { id: itemWithLotsId, name: 'Rice', unit: 'GRAM', stock: 12.5 },
      { id: itemWithoutLotsId, name: 'Salt', unit: 'GRAM', stock: 0 },
    ]);
    expect(
      repository.findRemainingStockByInventoryItemIds,
    ).toHaveBeenCalledWith([itemWithLotsId, itemWithoutLotsId]);
  });
});
