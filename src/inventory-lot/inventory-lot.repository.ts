import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { InventoryTransactionType } from '../../prisma/generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GetInventoryLotsByPagesDto } from './dto/get-inventory-lots-by-pages.dto.js';
import { inventoryLotSortMap } from './constants/sort-map.constants.js';

@Injectable()
export class InventoryLotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(
    id: string,
    organizationId: string,
    data: {
      remainingQuantity?: Prisma.Decimal;
      receivedAt?: Date;
      expiredAt?: Date | null;
    },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const lockedLots = await transaction.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT lot.id
          FROM inventory_lots AS lot
          INNER JOIN inventory_items AS item
            ON item.id = lot.inventory_item_id
          WHERE lot.id = CAST(${id} AS uuid)
            AND item.organization_id = CAST(${organizationId} AS uuid)
          FOR UPDATE OF lot
        `,
      );
      if (lockedLots.length === 0) {
        return null;
      }

      const previousLot = await transaction.inventoryLot.findUniqueOrThrow({
        where: { id },
        select: {
          inventoryItemId: true,
          remainingQuantity: true,
          unitCost: true,
        },
      });

      const updatedLot = await transaction.inventoryLot.update({
        where: { id },
        data,
        include: {
          purchaseItem: {
            select: {
              purchase: {
                select: { invoiceNumber: true, supplierName: true },
              },
            },
          },
          preparationOutput: {
            select: { name: true },
          },
        },
      });

      if (
        data.remainingQuantity !== undefined &&
        !previousLot.remainingQuantity.equals(data.remainingQuantity)
      ) {
        const quantityDifference = data.remainingQuantity.minus(
          previousLot.remainingQuantity,
        );
        const quantity = quantityDifference.abs();

        await transaction.inventoryTransaction.create({
          data: {
            organizationId,
            inventoryItemId: previousLot.inventoryItemId,
            inventoryLotId: id,
            type: quantityDifference.greaterThan(0)
              ? InventoryTransactionType.ADJUSTMENT_IN
              : InventoryTransactionType.ADJUSTMENT_OUT,
            quantity,
            unitCost: previousLot.unitCost,
            totalCost: previousLot.unitCost.mul(quantity).toDecimalPlaces(2),
          },
        });
      }

      return updatedLot;
    });
  }

  async findByPages(data: GetInventoryLotsByPagesDto, organizationId: string) {
    const { page, size, sortBy, inventoryItemId, search } = data;
    const skip = (page - 1) * size;
    const where: Prisma.InventoryLotWhereInput = {
      inventoryItem: {
        is: { id: inventoryItemId, organizationId, isActive: true },
      },
      ...(search && {
        purchaseItem: {
          is: {
            purchase: {
              is: {
                invoiceNumber: {
                  contains: search,
                  mode: 'insensitive',
                },
                supplierName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryLot.findMany({
        skip,
        take: size,
        where,
        orderBy:
          inventoryLotSortMap[sortBy] ?? inventoryLotSortMap['-receivedAt'],
        include: {
          purchaseItem: {
            select: {
              purchase: {
                select: { invoiceNumber: true, supplierName: true },
              },
            },
          },
          preparationOutput: {
            select: { name: true },
          },
        },
      }),
      this.prisma.inventoryLot.count({ where }),
    ]);

    return { items, total };
  }
}
