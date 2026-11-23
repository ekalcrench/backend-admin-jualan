import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { OrganizationUserRole } from '../../prisma/generated/prisma/enums.js';
import type { UserRequestHeader } from '../common/types/user-request-header.types.js';
import { ProductModifierRepository } from './product-modifier.repository.js';
import { ProductModifierService } from './product-modifier.service.js';
import type {
  ProductModifierAssignmentsRecord,
  ProductModifierGroupDetailRecord,
  ProductModifierGroupListRecord,
  ProductModifierOptionRecord,
} from './types/product-modifier-record.types.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const groupId = '33333333-3333-4333-8333-333333333333';
const optionId = '44444444-4444-4444-8444-444444444444';
const inventoryItemId = '99999999-9999-4999-8999-999999999999';
const productId = '55555555-5555-4555-8555-555555555555';
const secondProductId = '66666666-6666-4666-8666-666666666666';
const mappingId = '77777777-7777-4777-8777-777777777777';
const createdAt = new Date('2026-11-21T00:00:00.000Z');
const updatedAt = new Date('2026-11-21T00:00:00.000Z');

const user = {
  sub: 'user-id',
  name: 'Owner',
  roles: [],
  organizationId,
  organization_roles: [OrganizationUserRole.OWNER],
  jwt_id: 'jwt-id',
} satisfies UserRequestHeader;

const buildOption = (
  overrides: Partial<ProductModifierOptionRecord> = {},
): ProductModifierOptionRecord => ({
  id: optionId,
  modifierGroupId: groupId,
  name: 'Ayam Suwir',
  description: null,
  price: new Prisma.Decimal(2500),
  inventoryItemId: null,
  inventoryQuantity: null,
  inventoryItem: null,
  isActive: true,
  sortOrder: 0,
  createdAt,
  updatedAt,
  ...overrides,
});

const buildGroupDetail = (
  overrides: Partial<ProductModifierGroupDetailRecord> = {},
): ProductModifierGroupDetailRecord => ({
  id: groupId,
  organizationId,
  name: 'Extra Isian',
  description: null,
  isRequired: false,
  minSelection: 0,
  maxSelection: 1,
  isMultiple: false,
  isActive: true,
  sortOrder: 0,
  createdAt,
  updatedAt,
  options: [buildOption()],
  productMappings: [
    {
      id: mappingId,
      productId,
      modifierGroupId: groupId,
      sortOrder: 0,
      createdAt,
      updatedAt,
      product: {
        id: productId,
        name: 'Soto Padang Ayam',
        sellingPrice: new Prisma.Decimal(25000),
      },
    },
  ],
  _count: { options: 1, productMappings: 1 },
  ...overrides,
});

const buildGroupList = (
  overrides: Partial<ProductModifierGroupListRecord> = {},
): ProductModifierGroupListRecord => ({
  id: groupId,
  organizationId,
  name: 'Extra Isian',
  description: null,
  isRequired: false,
  minSelection: 0,
  maxSelection: 1,
  isMultiple: false,
  isActive: true,
  sortOrder: 0,
  createdAt,
  updatedAt,
  _count: { options: 1, productMappings: 1 },
  ...overrides,
});

const buildAssignments = (
  product = {
    id: productId,
    name: 'Soto Padang Ayam',
    sellingPrice: new Prisma.Decimal(25000),
  },
  optionOverrides: Partial<ProductModifierOptionRecord> = {},
): ProductModifierAssignmentsRecord => ({
  id: product.id,
  organizationId,
  name: product.name,
  sellingPrice: product.sellingPrice,
  createdAt,
  updatedAt,
  modifierGroupMappings: [
    {
      id: mappingId,
      productId: product.id,
      modifierGroupId: groupId,
      sortOrder: 0,
      createdAt,
      updatedAt,
      modifierGroup: {
        id: groupId,
        organizationId,
        name: 'Extra Isian',
        description: null,
        isRequired: false,
        minSelection: 0,
        maxSelection: 1,
        isMultiple: false,
        isActive: true,
        sortOrder: 0,
        createdAt,
        updatedAt,
        options: [buildOption(optionOverrides)],
      },
    },
  ],
});

type MockRepository = {
  [Key in keyof ProductModifierRepository]: ReturnType<typeof jest.fn>;
};

const createMockRepository = (): MockRepository => ({
  findByPages: jest.fn(),
  findById: jest.fn(),
  findGroupSummary: jest.fn(),
  createGroup: jest.fn(),
  updateGroup: jest.fn(),
  setGroupActive: jest.fn(),
  deleteGroup: jest.fn(),
  createOption: jest.fn(),
  findOptionById: jest.fn(),
  findActiveInventoryItem: jest.fn(),
  updateOption: jest.fn(),
  deleteOption: jest.fn(),
  setOptionActive: jest.fn(),
  reorderOptions: jest.fn(),
  findProductAssignments: jest.fn(),
  replaceProductModifierGroups: jest.fn(),
  removeProductModifierGroup: jest.fn(),
  reorderProductModifierGroups: jest.fn(),
});

describe('ProductModifierService', () => {
  let repository: MockRepository;
  let service: ProductModifierService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new ProductModifierService(
      repository as unknown as ProductModifierRepository,
    );
  });

  describe('modifier groups', () => {
    it('maps a paginated group list with its option and assignment counts', async () => {
      repository.findByPages.mockResolvedValue({
        items: [buildGroupList()],
        total: 11,
      });

      const result = await service.findByPages(
        { page: 1, size: 10, sortBy: 'sortOrder' },
        user,
      );

      expect(result.items[0].optionsCount).toBe(1);
      expect(result.items[0].assignedProductsCount).toBe(1);
      expect(result.pagination).toEqual({
        page: 1,
        size: 10,
        total: 11,
        totalPages: 2,
      });
    });

    it('creates a group with the documented defaults', async () => {
      repository.createGroup.mockResolvedValue(buildGroupDetail());

      const result = await service.create({ name: ' Extra Isian ' }, user);

      expect(repository.createGroup).toHaveBeenCalledWith({
        organizationId,
        name: 'Extra Isian',
        description: null,
        isRequired: false,
        minSelection: 0,
        maxSelection: 1,
        isMultiple: false,
        isActive: true,
        sortOrder: 0,
      });
      expect(result.id).toBe(groupId);
      expect(result.options).toHaveLength(1);
      expect(result.products).toHaveLength(1);
    });

    it('rejects a required group whose minSelection is zero', async () => {
      await expect(
        service.create({ name: 'Extra Isian', isRequired: true }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.createGroup).not.toHaveBeenCalled();
    });

    it('rejects whitespace-only names even if DTO validation is bypassed', async () => {
      await expect(
        service.create({ name: '   ' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.createGroup).not.toHaveBeenCalled();
    });

    it('rejects maxSelection below minSelection', async () => {
      await expect(
        service.create(
          { name: 'Extra Isian', minSelection: 2, maxSelection: 1 },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects more than one selection when isMultiple is false', async () => {
      await expect(
        service.create({ name: 'Extra Isian', maxSelection: 2 }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects negative selection limits even if DTO validation is bypassed', async () => {
      await expect(
        service.create({ name: 'Extra Isian', minSelection: -1 }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('merges partial updates with existing selection rules before validating', async () => {
      repository.findById.mockResolvedValue(buildGroupDetail());

      await expect(
        service.update(groupId, { isRequired: true }, user),
      ).rejects.toBeInstanceOf(BadRequestException);

      repository.updateGroup.mockResolvedValue(
        buildGroupDetail({ isRequired: true, minSelection: 1 }),
      );
      const result = await service.update(
        groupId,
        { isRequired: true, minSelection: 1 },
        user,
      );

      expect(repository.updateGroup).toHaveBeenCalledWith(groupId, {
        isRequired: true,
        minSelection: 1,
      });
      expect(result.isRequired).toBe(true);
      expect(result.minSelection).toBe(1);
    });

    it('returns 404 for a group outside the organization', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(groupId, user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.findById).toHaveBeenCalledWith(groupId, organizationId);
    });

    it('maps duplicate group names to 409', async () => {
      repository.createGroup.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '7.9.1',
          meta: { target: ['organization_id', 'name'] },
        }),
      );

      await expect(
        service.create({ name: 'Extra Isian' }, user),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('deactivates instead of deleting a group that is assigned to products', async () => {
      repository.deleteGroup.mockResolvedValue('deactivated');

      await expect(service.delete(groupId, user)).resolves.toBe(true);
      expect(repository.deleteGroup).toHaveBeenCalledWith(
        groupId,
        organizationId,
      );
    });

    it('deletes an unassigned group', async () => {
      repository.deleteGroup.mockResolvedValue('deleted');

      await expect(service.delete(groupId, user)).resolves.toBe(true);
    });

    it('returns 404 when deleting a missing group', async () => {
      repository.deleteGroup.mockResolvedValue('not-found');

      await expect(service.delete(groupId, user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('checks organization ownership before changing active status', async () => {
      repository.findGroupSummary.mockResolvedValue(null);

      await expect(
        service.setActive(groupId, { isActive: false }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.setGroupActive).not.toHaveBeenCalled();
    });

    it('rejects every operation when the JWT has no organization context', async () => {
      const userWithoutOrganization: UserRequestHeader = {
        ...user,
        organizationId: undefined,
      };

      await expect(
        service.findByPages(
          { page: 1, size: 10, sortBy: 'sortOrder' },
          userWithoutOrganization,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('modifier options', () => {
    it('rejects a negative price before writing', async () => {
      repository.findGroupSummary.mockResolvedValue({ id: groupId });

      await expect(
        service.createOption(groupId, { name: 'Ayam', price: -1 }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.createOption).not.toHaveBeenCalled();
    });

    it('creates an option linked to an active inventory item', async () => {
      repository.findGroupSummary.mockResolvedValue({ id: groupId });
      repository.findActiveInventoryItem.mockResolvedValue({
        id: inventoryItemId,
        name: 'Ayam Suwir',
        unit: 'GRAM',
      });
      repository.createOption.mockResolvedValue(
        buildOption({
          inventoryItemId,
          inventoryQuantity: new Prisma.Decimal(30),
          inventoryItem: {
            id: inventoryItemId,
            name: 'Ayam Suwir',
            unit: 'GRAM',
          },
        }),
      );

      const result = await service.createOption(
        groupId,
        {
          name: 'Ayam Suwir',
          price: 2500,
          inventoryItemId,
          inventoryQuantity: 30,
        },
        user,
      );

      expect(repository.findActiveInventoryItem).toHaveBeenCalledWith(
        inventoryItemId,
        organizationId,
      );
      expect(repository.createOption).toHaveBeenCalledWith(
        expect.objectContaining({
          modifierGroupId: groupId,
          inventoryItemId,
          inventoryQuantity: 30,
        }),
      );
      expect(result.inventoryQuantity).toBe(30);
      expect(result.inventoryItem).toEqual({
        id: inventoryItemId,
        name: 'Ayam Suwir',
        unit: 'GRAM',
      });
    });

    it('creates an option without inventory integration', async () => {
      repository.findGroupSummary.mockResolvedValue({ id: groupId });
      repository.createOption.mockResolvedValue(buildOption());

      const result = await service.createOption(
        groupId,
        { name: 'Ayam Suwir' },
        user,
      );

      expect(repository.findActiveInventoryItem).not.toHaveBeenCalled();
      expect(repository.createOption).toHaveBeenCalledWith(
        expect.objectContaining({
          inventoryItemId: null,
          inventoryQuantity: null,
        }),
      );
      expect(result.inventoryItem).toBeNull();
      expect(result.inventoryQuantity).toBeNull();
    });

    it('rejects an inventory item from another organization or an inactive item', async () => {
      repository.findGroupSummary.mockResolvedValue({ id: groupId });
      repository.findActiveInventoryItem.mockResolvedValue(null);

      await expect(
        service.createOption(
          groupId,
          { name: 'Ayam Suwir', inventoryItemId, inventoryQuantity: 30 },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.createOption).not.toHaveBeenCalled();
    });

    it.each([0, -1, -0.5])(
      'rejects a non-positive inventory quantity (%s)',
      async (inventoryQuantity) => {
        repository.findGroupSummary.mockResolvedValue({ id: groupId });

        await expect(
          service.createOption(
            groupId,
            { name: 'Ayam Suwir', inventoryItemId, inventoryQuantity },
            user,
          ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repository.createOption).not.toHaveBeenCalled();
      },
    );

    it('rejects an inventory item without a quantity', async () => {
      repository.findGroupSummary.mockResolvedValue({ id: groupId });

      await expect(
        service.createOption(
          groupId,
          { name: 'Ayam Suwir', inventoryItemId },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.findActiveInventoryItem).not.toHaveBeenCalled();
      expect(repository.createOption).not.toHaveBeenCalled();
    });

    it('rejects a quantity without an inventory item', async () => {
      repository.findGroupSummary.mockResolvedValue({ id: groupId });

      await expect(
        service.createOption(
          groupId,
          { name: 'Ayam Suwir', inventoryQuantity: 30 },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.createOption).not.toHaveBeenCalled();
    });

    it('rejects clearing the inventory item while keeping a quantity', async () => {
      repository.findOptionById.mockResolvedValue(
        buildOption({
          inventoryItemId,
          inventoryQuantity: new Prisma.Decimal(30),
        }),
      );

      await expect(
        service.updateOption(
          optionId,
          { inventoryItemId: null, inventoryQuantity: 30 },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.updateOption).not.toHaveBeenCalled();
    });

    it('updates inventory configuration using the current option quantity', async () => {
      repository.findOptionById.mockResolvedValue(buildOption());
      repository.findActiveInventoryItem.mockResolvedValue({
        id: inventoryItemId,
        name: 'Ayam Suwir',
        unit: 'GRAM',
      });
      repository.updateOption.mockResolvedValue(
        buildOption({
          inventoryItemId,
          inventoryQuantity: new Prisma.Decimal(30),
          inventoryItem: {
            id: inventoryItemId,
            name: 'Ayam Suwir',
            unit: 'GRAM',
          },
        }),
      );

      await service.updateOption(
        optionId,
        { inventoryItemId, inventoryQuantity: 30 },
        user,
      );

      expect(repository.findActiveInventoryItem).toHaveBeenCalledWith(
        inventoryItemId,
        organizationId,
      );
      expect(repository.updateOption).toHaveBeenCalledWith(
        optionId,
        expect.objectContaining({
          inventoryItemId,
          inventoryQuantity: 30,
        }),
      );
    });

    it('rejects changing to an inventory item from another organization', async () => {
      repository.findOptionById.mockResolvedValue(buildOption());
      repository.findActiveInventoryItem.mockResolvedValue(null);

      await expect(
        service.updateOption(
          optionId,
          { inventoryItemId, inventoryQuantity: 30 },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.updateOption).not.toHaveBeenCalled();
    });

    it('clears both inventory fields when the item is removed', async () => {
      repository.findOptionById.mockResolvedValue(
        buildOption({
          inventoryItemId,
          inventoryQuantity: new Prisma.Decimal(30),
        }),
      );
      repository.updateOption.mockResolvedValue(buildOption());

      await service.updateOption(optionId, { inventoryItemId: null }, user);

      expect(repository.findActiveInventoryItem).not.toHaveBeenCalled();
      expect(repository.updateOption).toHaveBeenCalledWith(
        optionId,
        expect.objectContaining({
          inventoryItemId: null,
          inventoryQuantity: null,
        }),
      );
    });

    it('updates only the quantity for the already assigned inventory item', async () => {
      repository.findOptionById.mockResolvedValue(
        buildOption({
          inventoryItemId,
          inventoryQuantity: new Prisma.Decimal(30),
        }),
      );
      repository.updateOption.mockResolvedValue(
        buildOption({
          inventoryItemId,
          inventoryQuantity: new Prisma.Decimal(45),
        }),
      );

      await service.updateOption(optionId, { inventoryQuantity: 45 }, user);

      expect(repository.findActiveInventoryItem).not.toHaveBeenCalled();
      expect(repository.updateOption).toHaveBeenCalledWith(
        optionId,
        expect.objectContaining({
          inventoryItemId,
          inventoryQuantity: 45,
        }),
      );
    });

    it('rejects creating an option under a group from another organization', async () => {
      repository.findGroupSummary.mockResolvedValue(null);

      await expect(
        service.createOption(groupId, { name: 'Ayam' }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findGroupSummary).toHaveBeenCalledWith(
        groupId,
        organizationId,
      );
    });

    it('rejects updating an option outside the organization', async () => {
      repository.findOptionById.mockResolvedValue(null);

      await expect(
        service.updateOption(optionId, { price: 1000 }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findOptionById).toHaveBeenCalledWith(
        optionId,
        organizationId,
      );
    });

    it('rejects a negative price on update', async () => {
      repository.findOptionById.mockResolvedValue({});

      await expect(
        service.updateOption(optionId, { price: -100 }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.updateOption).not.toHaveBeenCalled();
    });

    it('maps duplicate option names to 409', async () => {
      repository.findGroupSummary.mockResolvedValue({ id: groupId });
      repository.createOption.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '7.9.1',
          meta: { target: ['modifier_group_id', 'name'] },
        }),
      );

      await expect(
        service.createOption(groupId, { name: 'Ayam Suwir' }, user),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an incomplete reorder list', async () => {
      repository.reorderOptions.mockResolvedValue('option-set-mismatch');

      await expect(
        service.reorderOptions(groupId, { optionIds: [optionId] }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns 404 when reordering options of a missing group', async () => {
      repository.reorderOptions.mockResolvedValue('group-not-found');

      await expect(
        service.reorderOptions(groupId, { optionIds: [] }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns reordered options', async () => {
      repository.reorderOptions.mockResolvedValue([
        buildOption({ sortOrder: 0 }),
        buildOption({ id: 'another', name: 'Daging', sortOrder: 1 }),
      ]);

      const result = await service.reorderOptions(
        groupId,
        { optionIds: [optionId, '88888888-8888-4888-8888-888888888888'] },
        user,
      );

      expect(result.map((option) => option.sortOrder)).toEqual([0, 1]);
    });

    it('checks organization ownership before deleting an option', async () => {
      repository.findOptionById.mockResolvedValue(null);

      await expect(service.deleteOption(optionId, user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.deleteOption).not.toHaveBeenCalled();
    });
  });

  describe('product assignments', () => {
    it('returns 404 when the product is outside the organization', async () => {
      repository.findProductAssignments.mockResolvedValue(null);

      await expect(
        service.findProductModifierGroups(productId, {}, user),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findProductAssignments).toHaveBeenCalledWith(
        productId,
        organizationId,
        false,
      );
    });

    it('passes activeOnly through so customers cannot see inactive groups or options', async () => {
      repository.findProductAssignments.mockResolvedValue(buildAssignments());

      await service.findProductModifierGroups(
        productId,
        { activeOnly: true },
        user,
      );

      expect(repository.findProductAssignments).toHaveBeenCalledWith(
        productId,
        organizationId,
        true,
      );
    });

    it('rejects duplicate ids in the assignment payload', async () => {
      await expect(
        service.replaceProductModifierGroups(
          productId,
          { modifierGroupIds: [groupId, groupId] },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.replaceProductModifierGroups).not.toHaveBeenCalled();
    });

    it('rejects assigning a group owned by another organization', async () => {
      repository.replaceProductModifierGroups.mockResolvedValue(
        'modifier-group-not-found',
      );

      await expect(
        service.replaceProductModifierGroups(
          productId,
          { modifierGroupIds: [groupId] },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns 404 when assigning to a product outside the organization', async () => {
      repository.replaceProductModifierGroups.mockResolvedValue(
        'product-not-found',
      );

      await expect(
        service.replaceProductModifierGroups(
          productId,
          { modifierGroupIds: [] },
          user,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('assigns the same reusable group to multiple products independently', async () => {
      repository.replaceProductModifierGroups.mockResolvedValue('updated');
      repository.findProductAssignments
        .mockResolvedValueOnce(buildAssignments())
        .mockResolvedValueOnce(
          buildAssignments({
            id: secondProductId,
            name: 'Soto Padang Daging',
            sellingPrice: new Prisma.Decimal(30000),
          }),
        );

      await service.replaceProductModifierGroups(
        productId,
        { modifierGroupIds: [groupId] },
        user,
      );
      await service.replaceProductModifierGroups(
        secondProductId,
        { modifierGroupIds: [groupId] },
        user,
      );

      expect(repository.replaceProductModifierGroups).toHaveBeenNthCalledWith(
        1,
        productId,
        organizationId,
        [groupId],
      );
      expect(repository.replaceProductModifierGroups).toHaveBeenNthCalledWith(
        2,
        secondProductId,
        organizationId,
        [groupId],
      );
    });

    it('rejects reordering ids that do not match the product assignments', async () => {
      repository.reorderProductModifierGroups.mockResolvedValue(
        'mapping-set-mismatch',
      );

      await expect(
        service.reorderProductModifierGroups(
          productId,
          { modifierGroupIds: [groupId] },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns 404 when removing an assignment from a missing product', async () => {
      repository.removeProductModifierGroup.mockResolvedValue(
        'product-not-found',
      );

      await expect(
        service.removeProductModifierGroup(productId, groupId, user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns 404 when the group is not assigned to the product', async () => {
      repository.removeProductModifierGroup.mockResolvedValue(
        'mapping-not-found',
      );

      await expect(
        service.removeProductModifierGroup(productId, groupId, user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the ordered product groups after reordering', async () => {
      repository.reorderProductModifierGroups.mockResolvedValue('reordered');
      repository.findProductAssignments.mockResolvedValue(buildAssignments());

      const result = await service.reorderProductModifierGroups(
        productId,
        { modifierGroupIds: [groupId] },
        user,
      );

      expect(result.product.id).toBe(productId);
      expect(result.modifierGroups[0].mappingId).toBe(mappingId);
      expect(result.modifierGroups[0].options[0].price).toBe(2500);
    });
  });
});
