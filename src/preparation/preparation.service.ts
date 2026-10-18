import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { OrganizationContext } from '../common/types/organization-context.types.js';
import { CreatePreparationDto } from './dto/create-preparation.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { UpdatePreparationDto } from './dto/update-preparation.dto.js';
import { PreparationRepository } from './preparation.repository.js';

@Injectable()
export class PreparationService {
  constructor(private readonly preparationRepository: PreparationRepository) {}

  async findByPages(dto: GetByPagesDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    const { items, total } = await this.preparationRepository.findByPages({
      ...dto,
      organizationId,
    });

    return {
      items: items.map((preparation) => this.toResponse(preparation)),
      pagination: {
        page: dto.page,
        size: dto.size,
        total,
        totalPages: Math.ceil(total / dto.size),
      },
    };
  }

  async findById(id: string, context: OrganizationContext) {
    const preparation = await this.preparationRepository.findById(
      id,
      this.requireOrganizationId(context),
    );
    if (!preparation) {
      throw new NotFoundException('Preparation not found');
    }

    return this.toResponse(preparation);
  }

  async create(dto: CreatePreparationDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    await this.ensureInventoryItemsBelongToOrganization(
      [
        dto.outputInventoryItemId,
        ...dto.preparationItems.map((item) => item.inventoryItemId),
      ],
      organizationId,
    );

    const preparation = await this.preparationRepository.create(
      organizationId,
      {
        name: dto.name,
        preparedAt: new Date(dto.preparedAt),
        notes: dto.notes,
        outputInventoryItemId: dto.outputInventoryItemId,
        outputQuantity: new Prisma.Decimal(dto.outputQuantity),
      },
      dto.preparationItems,
    );
    if (preparation === 'insufficient-stock') {
      throw new ConflictException(
        'There is not enough remaining inventory to complete this preparation',
      );
    }

    return this.toResponse(preparation);
  }

  async update(
    id: string,
    dto: UpdatePreparationDto,
    context: OrganizationContext,
  ) {
    const organizationId = this.requireOrganizationId(context);
    const inventoryItemIds = [
      ...(dto.outputInventoryItemId ? [dto.outputInventoryItemId] : []),
      ...(dto.preparationItems
        ?.map((item) => item.inventoryItemId)
        .filter((itemId): itemId is string => itemId !== undefined) ?? []),
    ];
    if (inventoryItemIds.length) {
      await this.ensureInventoryItemsBelongToOrganization(
        inventoryItemIds,
        organizationId,
      );
    }

    const preparation = await this.preparationRepository.update(
      id,
      organizationId,
      {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.preparedAt !== undefined && {
          preparedAt: new Date(dto.preparedAt),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.outputInventoryItemId !== undefined && {
          outputInventoryItemId: dto.outputInventoryItemId,
        }),
        ...(dto.outputQuantity !== undefined && {
          outputQuantity: new Prisma.Decimal(dto.outputQuantity),
        }),
      },
      dto.preparationItems,
      dto.deletedPreparationItemIds ?? [],
    );

    if (preparation === 'not-found') {
      throw new NotFoundException('Preparation not found');
    }
    if (preparation === 'related-record-not-found') {
      throw new NotFoundException(
        'One or more preparation items were not found for this preparation',
      );
    }
    if (preparation === 'insufficient-stock') {
      throw new ConflictException(
        'There is not enough remaining inventory to complete this preparation',
      );
    }
    if (preparation === 'output-consumed') {
      throw new ConflictException(
        'A preparation cannot be changed while its output inventory has been consumed',
      );
    }
    if (preparation === 'empty-preparation') {
      throw new BadRequestException(
        'A preparation must contain at least one preparation item',
      );
    }

    return this.toResponse(preparation);
  }

  async delete(id: string, context: OrganizationContext) {
    const result = await this.preparationRepository.delete(
      id,
      this.requireOrganizationId(context),
    );
    if (result === 'not-found') {
      throw new NotFoundException('Preparation not found');
    }
    if (result === 'output-consumed') {
      throw new ConflictException(
        'A preparation cannot be deleted while its output inventory has been consumed',
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

  private async ensureInventoryItemsBelongToOrganization(
    inventoryItemIds: string[],
    organizationId: string,
  ) {
    const ids = [...new Set(inventoryItemIds)];
    const inventoryItems =
      await this.preparationRepository.findInventoryItemsByIds(
        organizationId,
        ids,
      );
    if (inventoryItems.length !== ids.length) {
      throw new NotFoundException(
        'One or more inventory items were not found in this organization',
      );
    }
  }

  private toResponse(
    preparation: NonNullable<
      Awaited<ReturnType<PreparationRepository['findById']>>
    >,
  ) {
    const { items, ...preparationData } = preparation;
    return {
      ...preparationData,
      outputQuantity: preparation.outputQuantity.toNumber(),
      outputUnitCost: preparation.outputUnitCost.toNumber(),
      outputTotalCost: preparation.outputTotalCost.toNumber(),
      preparationItems: items.map((item) => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity.toNumber(),
        unitCost: item.unitCost.toNumber(),
        totalCost: item.totalCost.toNumber(),
        inventoryItem: item.inventoryItem,
        lotAllocations: item.allocations.map((allocation) => ({
          inventoryLotId: allocation.inventoryLotId,
          quantity: allocation.quantity.toNumber(),
          unitCost: allocation.unitCost.toNumber(),
          totalCost: allocation.totalCost.toNumber(),
        })),
      })),
    };
  }
}
