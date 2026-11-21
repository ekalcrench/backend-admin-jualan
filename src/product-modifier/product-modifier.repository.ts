import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  productModifierGroupDetailInclude,
  productModifierGroupListInclude,
  productModifierOptionOrderBy,
} from './constants/response-include.constants.js';
import { sortMap } from './constants/sort-map.constants.js';
import type { FindByPagesParams } from './types/find-by-pages-params.types.js';
import type { ProductModifierAssignmentsRecord } from './types/product-modifier-record.types.js';

@Injectable()
export class ProductModifierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId, isActive } = data;
    const skip = (page - 1) * size;
    const where: Prisma.ProductModifierGroupWhereInput = {
      organizationId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.productModifierGroup.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['sortOrder'],
        include: productModifierGroupListInclude,
      }),
      this.prisma.productModifierGroup.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string, organizationId: string) {
    return this.prisma.productModifierGroup.findFirst({
      where: { id, organizationId },
      include: productModifierGroupDetailInclude,
    });
  }

  findGroupSummary(id: string, organizationId: string) {
    return this.prisma.productModifierGroup.findFirst({
      where: { id, organizationId },
      select: { id: true, name: true, isActive: true },
    });
  }

  createGroup(data: Prisma.ProductModifierGroupUncheckedCreateInput) {
    return this.prisma.productModifierGroup.create({
      data,
      include: productModifierGroupDetailInclude,
    });
  }

  updateGroup(
    id: string,
    data: Prisma.ProductModifierGroupUncheckedUpdateInput,
  ) {
    return this.prisma.productModifierGroup.update({
      where: { id },
      data,
      include: productModifierGroupDetailInclude,
    });
  }

  setGroupActive(id: string, isActive: boolean) {
    return this.prisma.productModifierGroup.update({
      where: { id },
      data: { isActive },
      include: productModifierGroupDetailInclude,
    });
  }

  deleteGroup(id: string, organizationId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const group = await transaction.productModifierGroup.findFirst({
        where: { id, organizationId },
        select: {
          id: true,
          _count: { select: { productMappings: true } },
        },
      });

      if (!group) {
        return 'not-found' as const;
      }

      // Keep assignments intact when the group is still in use. The group and its
      // options become unavailable to new orders, and can be restored by activating it.
      if (group._count.productMappings > 0) {
        await transaction.productModifierGroup.update({
          where: { id },
          data: { isActive: false },
        });
        return 'deactivated' as const;
      }

      await transaction.productModifierGroup.delete({ where: { id } });
      return 'deleted' as const;
    });
  }

  createOption(data: Prisma.ProductModifierOptionUncheckedCreateInput) {
    return this.prisma.productModifierOption.create({ data });
  }

  findOptionById(id: string, organizationId: string) {
    return this.prisma.productModifierOption.findFirst({
      where: {
        id,
        modifierGroup: { is: { organizationId } },
      },
      include: {
        modifierGroup: {
          select: {
            id: true,
            organizationId: true,
            isActive: true,
          },
        },
      },
    });
  }

  updateOption(
    id: string,
    data: Prisma.ProductModifierOptionUncheckedUpdateInput,
  ) {
    return this.prisma.productModifierOption.update({
      where: { id },
      data,
    });
  }

  deleteOption(id: string) {
    return this.prisma.productModifierOption.delete({ where: { id } });
  }

  setOptionActive(id: string, isActive: boolean) {
    return this.prisma.productModifierOption.update({
      where: { id },
      data: { isActive },
    });
  }

  reorderOptions(groupId: string, organizationId: string, optionIds: string[]) {
    return this.prisma.$transaction(async (transaction) => {
      const group = await transaction.productModifierGroup.findFirst({
        where: { id: groupId, organizationId },
        select: { id: true },
      });
      if (!group) {
        return 'group-not-found' as const;
      }
      if (new Set(optionIds).size !== optionIds.length) {
        return 'option-set-mismatch' as const;
      }

      const options = await transaction.productModifierOption.findMany({
        where: { modifierGroupId: groupId },
        select: { id: true },
      });
      if (
        options.length !== optionIds.length ||
        optionIds.some(
          (optionId) => !options.some((option) => option.id === optionId),
        )
      ) {
        return 'option-set-mismatch' as const;
      }

      for (const [sortOrder, optionId] of optionIds.entries()) {
        await transaction.productModifierOption.update({
          where: { id: optionId },
          data: { sortOrder },
        });
      }

      return transaction.productModifierOption.findMany({
        where: { modifierGroupId: groupId },
        orderBy: productModifierOptionOrderBy,
      });
    });
  }

  findProductAssignments(
    productId: string,
    organizationId: string,
    activeOnly: boolean,
  ) {
    return this.prisma.product.findFirst({
      where: { id: productId, organizationId },
      include: {
        modifierGroupMappings: {
          where: activeOnly
            ? { modifierGroup: { is: { isActive: true } } }
            : undefined,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            modifierGroup: {
              include: {
                options: {
                  where: activeOnly ? { isActive: true } : undefined,
                  orderBy: productModifierOptionOrderBy,
                },
              },
            },
          },
        },
      },
    }) as Promise<ProductModifierAssignmentsRecord | null>;
  }

  replaceProductModifierGroups(
    productId: string,
    organizationId: string,
    modifierGroupIds: string[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      if (new Set(modifierGroupIds).size !== modifierGroupIds.length) {
        return 'duplicate-modifier-groups' as const;
      }

      const product = await transaction.product.findFirst({
        where: { id: productId, organizationId },
        select: { id: true },
      });
      if (!product) {
        return 'product-not-found' as const;
      }

      if (modifierGroupIds.length) {
        const groups = await transaction.productModifierGroup.findMany({
          where: { organizationId, id: { in: modifierGroupIds } },
          select: { id: true },
        });
        if (groups.length !== modifierGroupIds.length) {
          return 'modifier-group-not-found' as const;
        }
      }

      await transaction.productModifierGroupMapping.deleteMany({
        where: {
          productId,
          ...(modifierGroupIds.length && {
            modifierGroupId: { notIn: modifierGroupIds },
          }),
        },
      });

      for (const [sortOrder, modifierGroupId] of modifierGroupIds.entries()) {
        await transaction.productModifierGroupMapping.upsert({
          where: {
            productId_modifierGroupId: { productId, modifierGroupId },
          },
          create: { productId, modifierGroupId, sortOrder },
          update: { sortOrder },
        });
      }

      return 'updated' as const;
    });
  }

  removeProductModifierGroup(
    productId: string,
    organizationId: string,
    modifierGroupId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findFirst({
        where: { id: productId, organizationId },
        select: { id: true },
      });
      if (!product) {
        return 'product-not-found' as const;
      }

      const result = await transaction.productModifierGroupMapping.deleteMany({
        where: {
          productId,
          modifierGroupId,
          modifierGroup: { is: { organizationId } },
        },
      });
      if (result.count === 0) {
        return 'mapping-not-found' as const;
      }

      return 'deleted' as const;
    });
  }

  reorderProductModifierGroups(
    productId: string,
    organizationId: string,
    modifierGroupIds: string[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      if (new Set(modifierGroupIds).size !== modifierGroupIds.length) {
        return 'mapping-set-mismatch' as const;
      }

      const product = await transaction.product.findFirst({
        where: { id: productId, organizationId },
        select: { id: true },
      });
      if (!product) {
        return 'product-not-found' as const;
      }

      const mappings = await transaction.productModifierGroupMapping.findMany({
        where: { productId },
        select: { modifierGroupId: true },
      });
      const mappedGroupIds = mappings.map((mapping) => mapping.modifierGroupId);
      if (
        mappedGroupIds.length !== modifierGroupIds.length ||
        modifierGroupIds.some(
          (modifierGroupId) => !mappedGroupIds.includes(modifierGroupId),
        )
      ) {
        return 'mapping-set-mismatch' as const;
      }

      for (const [sortOrder, modifierGroupId] of modifierGroupIds.entries()) {
        await transaction.productModifierGroupMapping.update({
          where: {
            productId_modifierGroupId: { productId, modifierGroupId },
          },
          data: { sortOrder },
        });
      }

      return 'reordered' as const;
    });
  }
}
