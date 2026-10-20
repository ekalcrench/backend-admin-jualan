import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { InventoryItemRepository } from './inventory-item.repository.js';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { OrganizationContext } from '../common/types/organization-context.types.js';

@Injectable()
export class InventoryItemService {
  constructor(
    private readonly inventoryItemRepository: InventoryItemRepository,
  ) {}

  async findByPages(dto: GetByPagesDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    const { items, total } = await this.inventoryItemRepository.findByPages({
      ...dto,
      organizationId,
    });

    return {
      items: items.map((item) => this.toResponse(item)),
      pagination: {
        page: dto.page,
        size: dto.size,
        total,
        totalPages: Math.ceil(total / dto.size),
      },
    };
  }

  async findById(id: string, context: OrganizationContext) {
    const item = await this.inventoryItemRepository.findById(
      this.requireOrganizationId(context),
      id,
    );

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.toResponse(item);
  }

  findOptions(context: OrganizationContext) {
    return this.inventoryItemRepository.findOptions(
      this.requireOrganizationId(context),
    );
  }

  async create(dto: CreateInventoryItemDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);

    try {
      const item = await this.inventoryItemRepository.create({
        name: dto.name,
        ...(dto.unit && { unit: dto.unit }),
        organization: { connect: { id: organizationId } },
      });

      return this.toResponse(item);
    } catch (error) {
      this.throwIfDuplicateName(error);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateInventoryItemDto,
    context: OrganizationContext,
  ) {
    const organizationId = this.requireOrganizationId(context);
    await this.ensureExists(id, organizationId);

    try {
      const item = await this.inventoryItemRepository.update(id, dto);

      return this.toResponse(item);
    } catch (error) {
      this.throwIfDuplicateName(error);
      throw error;
    }
  }

  async delete(id: string, context: OrganizationContext) {
    await this.ensureExists(id, this.requireOrganizationId(context));
    await this.inventoryItemRepository.delete(id);
    return true;
  }

  async ensureInventoryItemsBelongToOrganization(
    inventoryItemIds: string[],
    organizationId: string,
  ) {
    const ids = [...new Set(inventoryItemIds)];
    const inventoryItems = await this.inventoryItemRepository.findByIds(
      organizationId,
      ids,
    );
    if (inventoryItems.length !== ids.length) {
      throw new NotFoundException(
        'One or more inventory items were not found in this organization',
      );
    }
  }

  private requireOrganizationId(context: OrganizationContext) {
    if (!context.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    return context.organizationId;
  }

  private toResponse(item: {
    createdAt: Date;
    updatedAt: Date;
    id: string;
    organizationId: string;
    name: string;
    unit: string;
    lots: Array<{
      remainingQuantity: Prisma.Decimal;
      unitCost: Prisma.Decimal;
    }>;
  }) {
    const totalStock = item.lots.reduce(
      (total, lot) => total.plus(lot.remainingQuantity),
      new Prisma.Decimal(0),
    );
    const totalCost = item.lots.reduce(
      (total, lot) => total.plus(lot.unitCost.mul(lot.remainingQuantity)),
      new Prisma.Decimal(0),
    );

    return {
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      id: item.id,
      organizationId: item.organizationId,
      name: item.name,
      unit: item.unit,
      totalStock: totalStock.toNumber(),
      totalCost: totalCost.toNumber(),
      averageCost: totalStock.isZero()
        ? 0
        : totalCost.dividedBy(totalStock).toNumber(),
    };
  }

  private async ensureExists(id: string, organizationId: string) {
    const item = await this.inventoryItemRepository.findById(
      organizationId,
      id,
    );

    if (!item) {
      throw new NotFoundException('Barang tidak ada');
    }
  }

  private throwIfDuplicateName(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('An item with this name already exists');
    }
  }
}
