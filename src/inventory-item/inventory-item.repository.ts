import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { itemWithLots } from './constants/response-include.constants.js';
import { inventoryItemAggregateSort } from './constants/aggregator-sort.constants.js';

@Injectable()
export class InventoryItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId } = data;
    const skip = (page - 1) * size;
    const aggregateSort = this.getAggregateSort(sortBy);
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

    if (aggregateSort) {
      return this.findByPagesWithAggregateSort({
        size,
        skip,
        search,
        organizationId,
        where,
        aggregateSort,
      });
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['name'],
        include: itemWithLots,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { items, total };
  }

  private async findByPagesWithAggregateSort({
    size,
    skip,
    search,
    organizationId,
    where,
    aggregateSort,
  }: {
    size: number;
    skip: number;
    search?: string;
    organizationId: string;
    where: Prisma.InventoryItemWhereInput;
    aggregateSort: {
      expression: Prisma.Sql;
      direction: 'ASC' | 'DESC';
    };
  }) {
    return this.prisma.$transaction(async (tx) => {
      const orderedItems = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT item.id
          FROM inventory_items AS item
          LEFT JOIN inventory_lots AS lot
            ON lot.inventory_item_id = item.id
          WHERE item.organization_id = CAST(${organizationId} AS uuid)
            AND item.is_active = true
            ${
              search
                ? Prisma.sql`AND POSITION(LOWER(${search}) IN LOWER(item.name)) > 0`
                : Prisma.empty
            }
          GROUP BY item.id
          ORDER BY ${aggregateSort.expression} ${Prisma.raw(aggregateSort.direction)}, item.id ASC
          LIMIT ${size}
          OFFSET ${skip}
        `,
      );
      const total = await tx.inventoryItem.count({ where });
      const ids = orderedItems.map(({ id }) => id);
      const items = ids.length
        ? await tx.inventoryItem.findMany({
            where: { ...where, id: { in: ids } },
            include: itemWithLots,
          })
        : [];
      const itemsById = new Map(items.map((item) => [item.id, item]));

      return {
        items: ids.flatMap((id) => {
          const item = itemsById.get(id);
          return item ? [item] : [];
        }),
        total,
      };
    });
  }

  private getAggregateSort(sortBy: string) {
    const descending = sortBy.startsWith('-');
    const field = descending ? sortBy.slice(1) : sortBy;

    switch (field) {
      case 'totalStock':
        return {
          expression: inventoryItemAggregateSort.totalStock,
          direction: descending ? 'DESC' : 'ASC',
        } as const;
      case 'averageCost':
        return {
          expression: inventoryItemAggregateSort.averageCost,
          direction: descending ? 'DESC' : 'ASC',
        } as const;
      case 'totalCost':
        return {
          expression: inventoryItemAggregateSort.totalCost,
          direction: descending ? 'DESC' : 'ASC',
        } as const;
      default:
        return undefined;
    }
  }

  findById(organizationId: string, id: string) {
    return this.prisma.inventoryItem.findFirst({
      where: { id, organizationId, isActive: true },
      include: itemWithLots,
    });
  }

  findByIds(organizationId: string, ids: string[]) {
    return this.prisma.inventoryItem.findMany({
      where: { organizationId, id: { in: ids }, isActive: true },
      select: { id: true },
    });
  }

  findOptions(organizationId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        unit: true,
      },
      orderBy: { name: 'asc' },
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
