import { ForbiddenException, Injectable } from '@nestjs/common';
import { GetInventoryLotsByPagesDto } from './dto/get-inventory-lots-by-pages.dto.js';
import { InventoryLotRepository } from './inventory-lot.repository.js';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { UserRequestHeader } from '../common/types/user-request-header.types.js';

@Injectable()
export class InventoryLotService {
  constructor(
    private readonly inventoryLotRepository: InventoryLotRepository,
  ) {}

  async findByPages(
    dto: GetInventoryLotsByPagesDto,
    userHeader: UserRequestHeader,
  ) {
    const organizationId = this.requireOrganizationId(userHeader);
    const { items, total } = await this.inventoryLotRepository.findByPages(
      dto,
      organizationId,
    );

    return {
      items: items.map((lot) => this.toResponse(lot)),
      pagination: {
        page: dto.page,
        size: dto.size,
        total,
        totalPages: Math.ceil(total / dto.size),
      },
    };
  }

  private requireOrganizationId(userHeader: UserRequestHeader) {
    if (!userHeader.organizationId) {
      throw new ForbiddenException('Organization userHeader is required');
    }

    return userHeader.organizationId;
  }

  private toResponse(
    lot: {
      quantity: Prisma.Decimal;
      remainingQuantity: Prisma.Decimal;
      unitCost: Prisma.Decimal;
      totalCost: Prisma.Decimal;
      purchaseItem?: {
        purchase: { invoiceNumber: string | null; supplierName: string | null };
      } | null;
      preparationOutput?: {
        name: string;
      } | null;
    } & Record<string, unknown>,
  ) {
    const {
      purchaseItem,
      preparationOutput,
      quantity,
      unitCost,
      totalCost,
      remainingQuantity,
      ...rest
    } = lot;

    return {
      ...rest,
      invoiceNumber: purchaseItem?.purchase.invoiceNumber ?? null,
      supplierName: purchaseItem?.purchase.supplierName ?? null,
      quantity: quantity.toNumber(),
      remainingQuantity: remainingQuantity.toNumber(),
      unitCost: unitCost.toNumber(),
      totalCost: totalCost.toNumber(),
      preparationName: preparationOutput?.name,
    };
  }
}
