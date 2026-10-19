import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PurchaseStatus,
} from '../../prisma/generated/prisma/client.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { UpdatePurchaseItemDto } from './dto/update-purchase-item.dto.js';
import { UpdatePurchaseDto } from './dto/update-purchase.dto.js';
import { PurchaseRepository } from './purchase.repository.js';
import { PurchaseItemChange } from './types/purchase-item-change.type.js';
import { OrganizationContext } from '../common/types/organization-context.types.js';
import { OrganizationUserRole } from '../common/enums/organization-user-role.enum.js';

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
          create: dto.purchaseItems.map((item) => {
            return {
              quantity: item.quantity,
              packageSize: item.packageSize,
              totalCost: item.totalCost,
              receivedAt: new Date(item.receivedAt),
              expiredAt: item.expiredAt ? new Date(item.expiredAt) : null,
              inventoryItem: { connect: { id: item.inventoryItemId } },
            };
          }),
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
    const updatedPurchaseItemIds = new Set(
      dto.purchaseItems
        ?.map((item) => item.id)
        .filter((itemId): itemId is string => itemId !== undefined) ?? [],
    );

    if (
      dto.deletedPurchaseItemIds?.some((itemId) =>
        updatedPurchaseItemIds.has(itemId),
      )
    ) {
      throw new BadRequestException(
        'A purchase item cannot be updated and deleted in the same request',
      );
    }

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
        dto.deletedPurchaseItemIds,
      );

      if (purchase === 'finalized') {
        throw new ConflictException('Only draft purchases can be updated');
      }
      if (purchase === 'not-found') {
        throw new NotFoundException('Purchase not found');
      }
      if (purchase === 'related-record-not-found') {
        throw new NotFoundException(
          'One or more purchase items or inventory lots were not found',
        );
      }
      if (purchase === 'consumed') {
        throw new ConflictException(
          'Purchase items cannot be updated or deleted because their inventory has already been consumed',
        );
      }
      if (purchase === 'inventory-lots-exist') {
        throw new ConflictException(
          'Purchase items cannot be deleted because inventory lots have already been recorded',
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
    // If there is not id then it creates new purchase items
    if (!item.id) {
      const {
        inventoryItemId,
        quantity,
        packageSize,
        totalCost,
        receivedAt,
        expiredAt,
      } = item;
      if (
        inventoryItemId === undefined ||
        quantity === undefined ||
        packageSize === undefined ||
        totalCost === undefined ||
        receivedAt === undefined
      ) {
        throw new BadRequestException(
          'New purchase items require inventoryItemId, quantity, packageSize, totalCost, and receivedAt',
        );
      }

      const createData = {
        quantity,
        packageSize,
        totalCost,
        receivedAt: new Date(receivedAt),
        expiredAt: expiredAt ? new Date(expiredAt) : null,
        inventoryItem: { connect: { id: inventoryItemId } },
      } satisfies Prisma.PurchaseItemCreateWithoutPurchaseInput;

      return {
        purchaseItemData: {},
        createData,
      };
    }

    // Else it updates current items
    const purchaseItemData: Prisma.PurchaseItemUncheckedUpdateManyInput = {
      ...(item.inventoryItemId !== undefined && {
        inventoryItemId: item.inventoryItemId,
      }),
      ...(item.quantity !== undefined && { quantity: item.quantity }),
      ...(item.packageSize !== undefined && {
        packageSize: item.packageSize,
      }),
      ...(item.totalCost !== undefined && { totalCost: item.totalCost }),
      ...(item.receivedAt !== undefined && {
        receivedAt: new Date(item.receivedAt),
      }),
      ...(item.expiredAt !== undefined && {
        expiredAt: item.expiredAt ? new Date(item.expiredAt) : null,
      }),
    };

    return {
      id: item.id,
      purchaseItemData,
    };
  }

  async delete(id: string, context: OrganizationContext) {
    const result = await this.purchaseRepository.delete(
      id,
      this.requireOrganizationId(context),
      context.organizationRoles?.includes(OrganizationUserRole.OWNER) ?? false,
    );

    if (result === 'not-found') {
      throw new NotFoundException('Purchase not found');
    }

    if (result === 'forbidden') {
      throw new ForbiddenException(
        'Only an organization owner can delete a finalized purchase',
      );
    }

    if (result === 'consumed') {
      throw new ConflictException(
        'Purchase cannot be deleted because its inventory has already been consumed',
      );
    }

    if (result === 'preparation-records-exist') {
      throw new ConflictException(
        'Purchase cannot be deleted because its inventory is referenced by preparation records',
      );
    }

    if (result === 'status-changed') {
      throw new ConflictException(
        'Purchase status changed while deletion was in progress; retry the request',
      );
    }

    return true;
  }

  async finalize(id: string, context: OrganizationContext) {
    const result = await this.purchaseRepository.finalize(
      id,
      this.requireOrganizationId(context),
    );

    if (result === 'not-found') {
      throw new NotFoundException('Purchase not found');
    }

    if (result === 'not-draft') {
      throw new ConflictException('Only draft purchases can be finalized');
    }

    return this.toResponse(result);
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

    if (purchase.status !== PurchaseStatus.DRAFT) {
      throw new ConflictException('Only draft purchases can be updated');
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
        quantity: number;
        packageSize: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        receivedAt: Date;
        expiredAt: Date | null;
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
        quantity: item.quantity,
        packageSize: item.packageSize.toNumber(),
        totalCost: item.totalCost.toNumber(),
        receivedAt: item.receivedAt,
        expiredAt: item.expiredAt,
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
