import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { UpdatePurchaseItemDto } from './dto/update-purchase-item.dto.js';
import { UpdatePurchaseDto } from './dto/update-purchase.dto.js';
import { PurchaseRepository } from './purchase.repository.js';
import { PurchaseItemChange } from './types/purchase-item-change.type.js';

type OrganizationContext = { organizationId?: string };

@Injectable()
export class PurchaseService {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  async findByPages(dto: GetByPagesDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    const { items, total } = await this.purchaseRepository.findByPages({
      ...dto,
      organizationId,
    });

    return {
      items: items.map((purchase) => this.toResponse(purchase)),
      pagination: {
        page: dto.page,
        size: dto.size,
        total,
        totalPages: Math.ceil(total / dto.size),
      },
    };
  }

  async findById(id: string, context: OrganizationContext) {
    const purchase = await this.purchaseRepository.findById(
      id,
      this.requireOrganizationId(context),
    );

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return this.toResponse(purchase);
  }

  async create(dto: CreatePurchaseDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    const inventoryItemIds = [
      ...new Set(dto.purchaseItems.map((item) => item.inventoryItemId)),
    ];
    const inventoryItems =
      await this.purchaseRepository.findInventoryItemsByIds(
        organizationId,
        inventoryItemIds,
      );

    if (inventoryItems.length !== inventoryItemIds.length) {
      throw new NotFoundException(
        'One or more inventory items were not found in this organization',
      );
    }

    try {
      const purchase = await this.purchaseRepository.create({
        supplierName: dto.supplierName,
        invoiceNumber: dto.invoiceNumber,
        purchasedAt: new Date(dto.purchasedAt),
        organization: { connect: { id: organizationId } },
        purchaseItems: {
          create: dto.purchaseItems.map((item) => ({
            quantity: item.quantity,
            totalCost: item.totalCost,
            inventoryItem: { connect: { id: item.inventoryItemId } },
            inventoryLot: {
              create: {
                inventoryItem: { connect: { id: item.inventoryItemId } },
                quantity: item.quantity,
                remainingQuantity: item.quantity,
                unitCost: item.totalCost / item.quantity,
                totalCost: item.totalCost,
                receivedAt: new Date(item.receivedAt),
                expiredAt: item.expiredAt ? new Date(item.expiredAt) : null,
              },
            },
          })),
        },
      });

      return this.toResponse(purchase);
    } catch (error) {
      this.throwIfDuplicateInvoice(error);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdatePurchaseDto,
    context: OrganizationContext,
  ) {
    const organizationId = this.requireOrganizationId(context);
    await this.ensureExists(id, organizationId);

    const itemChanges = dto.purchaseItems?.map((item) =>
      this.toPurchaseItemChange(item),
    );

    const inventoryItemIds = [
      ...new Set(
        dto.purchaseItems
          ?.map((item) => item.inventoryItemId)
          .filter((inventoryItemId): inventoryItemId is string =>
            Boolean(inventoryItemId),
          ) ?? [],
      ),
    ];

    // Check inventory item validation
    if (inventoryItemIds.length) {
      const inventoryItems =
        await this.purchaseRepository.findInventoryItemsByIds(
          organizationId,
          inventoryItemIds,
        );

      if (inventoryItems.length !== inventoryItemIds.length) {
        throw new NotFoundException(
          'One or more inventory items were not found in this organization',
        );
      }
    }

    const data: Prisma.PurchaseUpdateInput = {
      ...(dto.supplierName !== undefined && { supplierName: dto.supplierName }),
      ...(dto.invoiceNumber !== undefined && {
        invoiceNumber: dto.invoiceNumber,
      }),
      ...(dto.purchasedAt !== undefined && {
        purchasedAt: new Date(dto.purchasedAt),
      }),
    };

    try {
      const purchase = await this.purchaseRepository.update(
        id,
        data,
        itemChanges,
      );

      if (purchase === 'related-record-not-found') {
        throw new NotFoundException(
          'One or more purchase items or inventory lots were not found',
        );
      }

      return this.toResponse(purchase);
    } catch (error) {
      this.throwIfDuplicateInvoice(error);
      throw error;
    }
  }

  private toPurchaseItemChange(
    item: UpdatePurchaseItemDto,
  ): PurchaseItemChange {
    if (Boolean(item.id) !== Boolean(item.inventoryLotId)) {
      throw new BadRequestException(
        'Both purchase item id and inventory lot id are required when updating an item',
      );
    }

    // If there is not id then it creates new purchase items
    if (!item.id) {
      const { inventoryItemId, quantity, totalCost, receivedAt, expiredAt } =
        item;
      if (
        inventoryItemId === undefined ||
        quantity === undefined ||
        totalCost === undefined ||
        receivedAt === undefined
      ) {
        throw new BadRequestException(
          'New purchase items require inventoryItemId, quantity, totalCost, and receivedAt',
        );
      }

      const createData = {
        quantity,
        totalCost,
        inventoryItem: { connect: { id: inventoryItemId } },
        inventoryLot: {
          create: {
            inventoryItem: { connect: { id: inventoryItemId } },
            quantity,
            remainingQuantity: quantity,
            unitCost: totalCost / quantity,
            totalCost,
            receivedAt: new Date(receivedAt),
            expiredAt: expiredAt ? new Date(expiredAt) : null,
          },
        },
      } satisfies Prisma.PurchaseItemCreateWithoutPurchaseInput;

      return {
        purchaseItemData: {},
        inventoryLotData: {},
        createData,
      };
    }

    // Else it updates current items
    const purchaseItemData: Prisma.PurchaseItemUncheckedUpdateManyInput = {
      ...(item.inventoryItemId !== undefined && {
        inventoryItemId: item.inventoryItemId,
      }),
      ...(item.quantity !== undefined && { quantity: item.quantity }),
      ...(item.totalCost !== undefined && { totalCost: item.totalCost }),
    };
    const inventoryLotData: Prisma.InventoryLotUpdateManyMutationInput = {
      ...(item.quantity !== undefined && { quantity: item.quantity }),
      ...(item.totalCost !== undefined && { totalCost: item.totalCost }),
      ...(item.receivedAt !== undefined && {
        receivedAt: new Date(item.receivedAt),
      }),
      ...(item.totalCost !== undefined &&
        item.quantity !== undefined && {
          unitCost: item.totalCost / item.quantity,
        }),
      ...(item.expiredAt !== undefined && {
        expiredAt: item.expiredAt ? new Date(item.expiredAt) : null,
      }),
    };

    return {
      id: item.id,
      inventoryLotId: item.inventoryLotId,
      purchaseItemData,
      inventoryLotData,
    };
  }

  async delete(id: string, context: OrganizationContext) {
    const result = await this.purchaseRepository.delete(
      id,
      this.requireOrganizationId(context),
    );

    if (result === 'not-found') {
      throw new NotFoundException('Purchase not found');
    }

    if (result === 'consumed') {
      throw new ConflictException(
        'Purchase cannot be deleted because its inventory has already been consumed',
      );
    }

    return true;
  }

  private requireOrganizationId(context: OrganizationContext) {
    if (!context.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    return context.organizationId;
  }

  private async ensureExists(id: string, organizationId: string) {
    const purchase = await this.purchaseRepository.findById(id, organizationId);

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }
  }

  private throwIfDuplicateInvoice(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Purchase invoice already exists');
    }
  }

  private toResponse(
    purchase: {
      purchaseItems: Array<{
        id: string;
        inventoryItemId: string;
        quantity: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        inventoryItem: { id: string; name: string; unit: string };
        inventoryLot: {
          id: string;
          quantity: Prisma.Decimal;
          remainingQuantity: Prisma.Decimal;
          unitCost: Prisma.Decimal;
          totalCost: Prisma.Decimal;
          receivedAt: Date;
          expiredAt: Date | null;
        } | null;
      }>;
    } & Record<string, unknown>,
  ) {
    return {
      ...purchase,
      purchaseItems: purchase.purchaseItems.map((item) => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity.toNumber(),
        totalCost: item.totalCost.toNumber(),
        inventoryItem: item.inventoryItem,
        inventoryLot: item.inventoryLot
          ? {
              id: item.inventoryLot.id,
              quantity: item.inventoryLot.quantity.toNumber(),
              remainingQuantity: item.inventoryLot.remainingQuantity.toNumber(),
              unitCost: item.inventoryLot.unitCost.toNumber(),
              totalCost: item.inventoryLot.totalCost.toNumber(),
              receivedAt: item.inventoryLot.receivedAt,
              expiredAt: item.inventoryLot.expiredAt,
            }
          : null,
      })),
    };
  }
}
