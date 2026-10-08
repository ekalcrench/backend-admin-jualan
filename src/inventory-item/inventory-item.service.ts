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

type OrganizationContext = { organizationId?: string };

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
      items: items.map(({ lots, ...item }) => {
        const totalStock = lots.reduce(
          (total, lot) => total.plus(lot.remainingQuantity),
          new Prisma.Decimal(0),
        );
        const weightedCost = lots.reduce(
          (total, lot) => total.plus(lot.remainingQuantity.mul(lot.unitCost)),
          new Prisma.Decimal(0),
        );

        return {
          ...item,
          totalStock: totalStock.toNumber(),
          averageCost: totalStock.isZero()
            ? 0
            : weightedCost.dividedBy(totalStock).toNumber(),
        };
      }),
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
      id,
      this.requireOrganizationId(context),
    );

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  findOptions(search: string | undefined, context: OrganizationContext) {
    return this.inventoryItemRepository.findOptions(
      this.requireOrganizationId(context),
      search,
    );
  }

  async create(dto: CreateInventoryItemDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);

    try {
      return await this.inventoryItemRepository.create({
        name: dto.name,
        ...(dto.unit && { unit: dto.unit }),
        organization: { connect: { id: organizationId } },
      });
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
      return await this.inventoryItemRepository.update(id, dto);
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

  private requireOrganizationId(context: OrganizationContext) {
    if (!context.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    return context.organizationId;
  }

  private async ensureExists(id: string, organizationId: string) {
    const item = await this.inventoryItemRepository.findById(
      id,
      organizationId,
    );

    if (!item) {
      throw new NotFoundException('Inventory item not found');
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
