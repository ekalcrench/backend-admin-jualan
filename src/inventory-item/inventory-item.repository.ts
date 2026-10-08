import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';

const itemWithLots = {
  lots: {
    orderBy: { receivedAt: 'asc' },
    select: {
      remainingQuantity: true,
      unitCost: true,
    },
  },
} satisfies Prisma.InventoryItemInclude;

@Injectable()
export class InventoryItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId } = data;
    const skip = (page - 1) * size;
    const where: Prisma.InventoryItemWhereInput = {
      organizationId,
      isActive: true,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-createdAt'],
        include: itemWithLots,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string, organizationId: string) {
    return this.prisma.inventoryItem.findFirst({
      where: { id, organizationId, isActive: true },
      include: itemWithLots,
    });
  }

  findOptions(organizationId: string, search?: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(search && {
          name: { contains: search, mode: 'insensitive' },
        }),
      },
      select: {
        id: true,
        name: true,
        unit: true,
      },
    });
  }

  create(data: Prisma.InventoryItemCreateInput) {
    return this.prisma.inventoryItem.create({ data, include: itemWithLots });
  }

  update(id: string, data: Prisma.InventoryItemUpdateInput) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data,
      include: itemWithLots,
    });
  }

  async delete(id: string) {
    return this.prisma.inventoryItem.delete({ where: { id } }).catch(() =>
      this.prisma.inventoryItem.update({
        where: { id },
        data: { isActive: false },
      }),
    );
  }
}
