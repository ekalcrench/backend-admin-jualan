import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import type { UserRequestHeader } from '../common/types/user-request-header.types.js';
import { CreateProductModifierGroupDto } from './dto/create-product-modifier-group.dto.js';
import { CreateProductModifierOptionDto } from './dto/create-product-modifier-option.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { GetProductModifierGroupsDto } from './dto/get-product-modifier-groups.dto.js';
import { ProductModifierGroupDetailResponseDto } from './dto/product-modifier-group-detail-response.dto.js';
import { ProductModifierGroupResponseDto } from './dto/product-modifier-group-response.dto.js';
import {
  ProductModifierGroupOnProductResponseDto,
  ProductModifierGroupsResponseDto,
} from './dto/product-modifier-groups-response.dto.js';
import { ProductModifierOptionResponseDto } from './dto/product-modifier-option-response.dto.js';
import { ReorderProductModifierGroupsDto } from './dto/reorder-product-modifier-groups.dto.js';
import { ReorderProductModifierOptionsDto } from './dto/reorder-product-modifier-options.dto.js';
import { ReplaceProductModifierGroupsDto } from './dto/replace-product-modifier-groups.dto.js';
import { UpdateModifierActiveStatusDto } from './dto/update-modifier-active-status.dto.js';
import { UpdateProductModifierGroupDto } from './dto/update-product-modifier-group.dto.js';
import { UpdateProductModifierOptionDto } from './dto/update-product-modifier-option.dto.js';
import { ProductModifierRepository } from './product-modifier.repository.js';
import type {
  ProductModifierAssignmentsRecord,
  ProductModifierGroupDetailRecord,
  ProductModifierGroupListRecord,
  ProductModifierOptionRecord,
} from './types/product-modifier-record.types.js';

type SelectionRules = {
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  isMultiple: boolean;
};

@Injectable()
export class ProductModifierService {
  constructor(
    private readonly productModifierRepository: ProductModifierRepository,
  ) {}

  async findByPages(dto: GetByPagesDto, context: UserRequestHeader) {
    const organizationId = this.requireOrganizationId(context);
    const { items, total } = await this.productModifierRepository.findByPages({
      ...dto,
      organizationId,
    });

    return {
      items: items.map((group) => this.toGroupResponse(group)),
      pagination: {
        page: dto.page,
        size: dto.size,
        total,
        totalPages: Math.ceil(total / dto.size),
      },
    };
  }

  async findById(id: string, context: UserRequestHeader) {
    const group = await this.productModifierRepository.findById(
      id,
      this.requireOrganizationId(context),
    );
    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    return this.toGroupDetailResponse(group);
  }

  async create(dto: CreateProductModifierGroupDto, context: UserRequestHeader) {
    const organizationId = this.requireOrganizationId(context);
    const rules: SelectionRules = {
      isRequired: dto.isRequired ?? false,
      minSelection: dto.minSelection ?? 0,
      maxSelection: dto.maxSelection ?? 1,
      isMultiple: dto.isMultiple ?? false,
    };
    this.validateSelectionRules(rules);

    try {
      const group = await this.productModifierRepository.createGroup({
        organizationId,
        name: this.normalizeName(dto.name, 'Modifier group'),
        description: dto.description ?? null,
        ...rules,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      });
      return this.toGroupDetailResponse(group);
    } catch (error) {
      this.throwIfDuplicateGroupName(error);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateProductModifierGroupDto,
    context: UserRequestHeader,
  ) {
    const organizationId = this.requireOrganizationId(context);
    const existing = await this.productModifierRepository.findById(
      id,
      organizationId,
    );
    if (!existing) {
      throw new NotFoundException('Modifier group not found');
    }

    const rules: SelectionRules = {
      isRequired: dto.isRequired ?? existing.isRequired,
      minSelection: dto.minSelection ?? existing.minSelection,
      maxSelection: dto.maxSelection ?? existing.maxSelection,
      isMultiple: dto.isMultiple ?? existing.isMultiple,
    };
    this.validateSelectionRules(rules);

    try {
      const group = await this.productModifierRepository.updateGroup(id, {
        ...(dto.name !== undefined && {
          name: this.normalizeName(dto.name, 'Modifier group'),
        }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
        ...(dto.minSelection !== undefined && {
          minSelection: dto.minSelection,
        }),
        ...(dto.maxSelection !== undefined && {
          maxSelection: dto.maxSelection,
        }),
        ...(dto.isMultiple !== undefined && { isMultiple: dto.isMultiple }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      });
      return this.toGroupDetailResponse(group);
    } catch (error) {
      this.throwIfDuplicateGroupName(error);
      throw error;
    }
  }

  async delete(id: string, context: UserRequestHeader) {
    const result = await this.productModifierRepository.deleteGroup(
      id,
      this.requireOrganizationId(context),
    );
    if (result === 'not-found') {
      throw new NotFoundException('Modifier group not found');
    }

    return true;
  }

  async setActive(
    id: string,
    dto: UpdateModifierActiveStatusDto,
    context: UserRequestHeader,
  ) {
    const organizationId = this.requireOrganizationId(context);
    await this.ensureGroupExists(id, organizationId);
    const group = await this.productModifierRepository.setGroupActive(
      id,
      dto.isActive,
    );

    return this.toGroupDetailResponse(group);
  }

  async createOption(
    groupId: string,
    dto: CreateProductModifierOptionDto,
    context: UserRequestHeader,
  ) {
    const organizationId = this.requireOrganizationId(context);
    await this.ensureGroupExists(groupId, organizationId);
    if (dto.price !== undefined && dto.price < 0) {
      throw new BadRequestException('Modifier option price cannot be negative');
    }

    const inventory = this.resolveInventoryConfiguration(
      dto.inventoryItemId ?? null,
      dto.inventoryQuantity ?? null,
    );
    if (dto.trackInventory && !inventory.inventoryItemId) {
      throw new BadRequestException(
        'An inventory item is required when trackInventory is enabled',
      );
    }
    if (inventory.inventoryItemId) {
      await this.ensureInventoryItemAssignable(
        inventory.inventoryItemId,
        organizationId,
      );
    }

    try {
      const option = await this.productModifierRepository.createOption({
        modifierGroupId: groupId,
        name: this.normalizeName(dto.name, 'Modifier option'),
        description: dto.description ?? null,
        price: dto.price ?? 0,
        inventoryItemId: inventory.inventoryItemId,
        inventoryQuantity: inventory.inventoryQuantity,
        trackInventory: dto.trackInventory ?? false,
        inventoryPolicy: dto.inventoryPolicy,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      });
      return this.toOptionResponse(option);
    } catch (error) {
      this.throwIfDuplicateOptionName(error);
      throw error;
    }
  }

  async updateOption(
    id: string,
    dto: UpdateProductModifierOptionDto,
    context: UserRequestHeader,
  ) {
    const organizationId = this.requireOrganizationId(context);
    const option = await this.productModifierRepository.findOptionById(
      id,
      organizationId,
    );
    if (!option) {
      throw new NotFoundException('Modifier option not found');
    }
    if (dto.price !== undefined && dto.price < 0) {
      throw new BadRequestException('Modifier option price cannot be negative');
    }

    const existingInventoryItemId = option.inventoryItemId;
    const existingInventoryQuantity =
      option.inventoryQuantity?.toNumber() ?? null;
    const inventoryTouched =
      dto.inventoryItemId !== undefined || dto.inventoryQuantity !== undefined;
    let inventoryData: {
      inventoryItemId?: string | null;
      inventoryQuantity?: number | null;
    } = {};

    if (inventoryTouched) {
      inventoryData = this.resolveInventoryUpdate(
        existingInventoryItemId,
        existingInventoryQuantity,
        dto,
      );
      // Only validate the item when the reference is newly assigned or changed.
      // Keeping an existing (possibly since deactivated) reference must not block
      // unrelated edits such as price or name changes.
      if (
        inventoryData.inventoryItemId &&
        inventoryData.inventoryItemId !== existingInventoryItemId
      ) {
        await this.ensureInventoryItemAssignable(
          inventoryData.inventoryItemId,
          organizationId,
        );
      }
    }
    const trackInventory = dto.trackInventory ?? option.trackInventory;
    const inventoryItemId = inventoryTouched
      ? inventoryData.inventoryItemId
      : existingInventoryItemId;
    if (trackInventory && !inventoryItemId) {
      throw new BadRequestException(
        'An inventory item is required when trackInventory is enabled',
      );
    }

    try {
      const updated = await this.productModifierRepository.updateOption(id, {
        ...(dto.name !== undefined && {
          name: this.normalizeName(dto.name, 'Modifier option'),
        }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(inventoryTouched && inventoryData),
        ...(dto.trackInventory !== undefined && {
          trackInventory: dto.trackInventory,
        }),
        ...(dto.inventoryPolicy !== undefined && {
          inventoryPolicy: dto.inventoryPolicy,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      });
      return this.toOptionResponse(updated);
    } catch (error) {
      this.throwIfDuplicateOptionName(error);
      throw error;
    }
  }

  async deleteOption(id: string, context: UserRequestHeader) {
    const option = await this.productModifierRepository.findOptionById(
      id,
      this.requireOrganizationId(context),
    );
    if (!option) {
      throw new NotFoundException('Modifier option not found');
    }

    await this.productModifierRepository.deleteOption(id);
    return true;
  }

  async setOptionActive(
    id: string,
    dto: UpdateModifierActiveStatusDto,
    context: UserRequestHeader,
  ) {
    const option = await this.productModifierRepository.findOptionById(
      id,
      this.requireOrganizationId(context),
    );
    if (!option) {
      throw new NotFoundException('Modifier option not found');
    }

    const updated = await this.productModifierRepository.setOptionActive(
      id,
      dto.isActive,
    );
    return this.toOptionResponse(updated);
  }

  async reorderOptions(
    groupId: string,
    dto: ReorderProductModifierOptionsDto,
    context: UserRequestHeader,
  ) {
    if (new Set(dto.optionIds).size !== dto.optionIds.length) {
      throw new BadRequestException('Duplicate option ids are not allowed');
    }

    const result = await this.productModifierRepository.reorderOptions(
      groupId,
      this.requireOrganizationId(context),
      dto.optionIds,
    );
    if (result === 'group-not-found') {
      throw new NotFoundException('Modifier group not found');
    }
    if (result === 'option-set-mismatch') {
      throw new BadRequestException(
        'The provided option ids must exactly match the options in this modifier group',
      );
    }

    return result.map((option) => this.toOptionResponse(option));
  }

  async findProductModifierGroups(
    productId: string,
    dto: GetProductModifierGroupsDto,
    context: UserRequestHeader,
  ) {
    return this.loadProductModifierGroups(
      productId,
      this.requireOrganizationId(context),
      dto.activeOnly ?? false,
    );
  }

  async replaceProductModifierGroups(
    productId: string,
    dto: ReplaceProductModifierGroupsDto,
    context: UserRequestHeader,
  ) {
    const organizationId = this.requireOrganizationId(context);
    if (new Set(dto.modifierGroupIds).size !== dto.modifierGroupIds.length) {
      throw new BadRequestException(
        'Duplicate modifier group ids are not allowed',
      );
    }

    const result =
      await this.productModifierRepository.replaceProductModifierGroups(
        productId,
        organizationId,
        dto.modifierGroupIds,
      );
    if (result === 'product-not-found') {
      throw new NotFoundException('Product not found');
    }
    if (result === 'modifier-group-not-found') {
      throw new BadRequestException(
        'One or more modifier groups were not found in this organization',
      );
    }
    if (result === 'duplicate-modifier-groups') {
      throw new BadRequestException(
        'Duplicate modifier group ids are not allowed',
      );
    }

    return this.loadProductModifierGroups(productId, organizationId, false);
  }

  async removeProductModifierGroup(
    productId: string,
    modifierGroupId: string,
    context: UserRequestHeader,
  ) {
    const result =
      await this.productModifierRepository.removeProductModifierGroup(
        productId,
        this.requireOrganizationId(context),
        modifierGroupId,
      );
    if (result === 'product-not-found') {
      throw new NotFoundException('Product not found');
    }
    if (result === 'mapping-not-found') {
      throw new NotFoundException(
        'Modifier group is not assigned to this product',
      );
    }

    return true;
  }

  async reorderProductModifierGroups(
    productId: string,
    dto: ReorderProductModifierGroupsDto,
    context: UserRequestHeader,
  ) {
    const organizationId = this.requireOrganizationId(context);
    if (new Set(dto.modifierGroupIds).size !== dto.modifierGroupIds.length) {
      throw new BadRequestException(
        'Duplicate modifier group ids are not allowed',
      );
    }

    const result =
      await this.productModifierRepository.reorderProductModifierGroups(
        productId,
        organizationId,
        dto.modifierGroupIds,
      );
    if (result === 'product-not-found') {
      throw new NotFoundException('Product not found');
    }
    if (result === 'mapping-set-mismatch') {
      throw new BadRequestException(
        'The provided modifier group ids must exactly match the groups assigned to this product',
      );
    }

    return this.loadProductModifierGroups(productId, organizationId, false);
  }

  private requireOrganizationId(context: UserRequestHeader) {
    if (!context.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    return context.organizationId;
  }

  private async ensureGroupExists(id: string, organizationId: string) {
    const group = await this.productModifierRepository.findGroupSummary(
      id,
      organizationId,
    );
    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    return group;
  }

  private async loadProductModifierGroups(
    productId: string,
    organizationId: string,
    activeOnly: boolean,
  ) {
    const product = await this.productModifierRepository.findProductAssignments(
      productId,
      organizationId,
      activeOnly,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.toProductModifierGroupsResponse(product);
  }

  private normalizeName(name: string, label: string) {
    const normalized = name.trim();
    if (!normalized) {
      throw new BadRequestException(`${label} name is required`);
    }

    return normalized;
  }

  private validateSelectionRules(rules: SelectionRules) {
    if (
      !Number.isInteger(rules.minSelection) ||
      !Number.isInteger(rules.maxSelection)
    ) {
      throw new BadRequestException('Selection limits must be whole numbers');
    }
    if (rules.minSelection < 0) {
      throw new BadRequestException('minSelection cannot be negative');
    }
    if (rules.maxSelection < rules.minSelection) {
      throw new BadRequestException(
        'maxSelection must be greater than or equal to minSelection',
      );
    }
    if (rules.isRequired && rules.minSelection < 1) {
      throw new BadRequestException(
        'minSelection must be at least 1 when isRequired is true',
      );
    }
    if (!rules.isMultiple && rules.maxSelection > 1) {
      throw new BadRequestException(
        'maxSelection cannot be greater than 1 when isMultiple is false',
      );
    }
  }

  /**
   * A modifier option either consumes inventory or it does not. The item and the
   * quantity are configured together; a quantity without an item (or the other
   * way around) would silently break order inventory consumption, so both are
   * rejected before writing.
   */
  private resolveInventoryConfiguration(
    inventoryItemId: string | null,
    inventoryQuantity: number | null,
  ): { inventoryItemId: string | null; inventoryQuantity: number | null } {
    if (inventoryQuantity !== null) {
      if (!Number.isFinite(inventoryQuantity) || inventoryQuantity <= 0) {
        throw new BadRequestException(
          'inventoryQuantity must be greater than zero',
        );
      }
    }
    if (inventoryItemId === null && inventoryQuantity !== null) {
      throw new BadRequestException(
        'inventoryQuantity requires inventoryItemId',
      );
    }
    if (inventoryItemId !== null && inventoryQuantity === null) {
      throw new BadRequestException(
        'inventoryQuantity is required when inventoryItemId is set',
      );
    }

    return { inventoryItemId, inventoryQuantity };
  }

  private resolveInventoryUpdate(
    existingInventoryItemId: string | null,
    existingInventoryQuantity: number | null,
    dto: UpdateProductModifierOptionDto,
  ): { inventoryItemId: string | null; inventoryQuantity: number | null } {
    if (dto.inventoryItemId === null) {
      if (
        dto.inventoryQuantity !== undefined &&
        dto.inventoryQuantity !== null
      ) {
        throw new BadRequestException(
          'inventoryQuantity must be null or omitted when inventoryItemId is null',
        );
      }
      return { inventoryItemId: null, inventoryQuantity: null };
    }

    return this.resolveInventoryConfiguration(
      dto.inventoryItemId !== undefined
        ? dto.inventoryItemId
        : existingInventoryItemId,
      dto.inventoryQuantity !== undefined
        ? dto.inventoryQuantity
        : existingInventoryQuantity,
    );
  }

  private async ensureInventoryItemAssignable(
    id: string,
    organizationId: string,
  ) {
    const inventoryItem =
      await this.productModifierRepository.findActiveInventoryItem(
        id,
        organizationId,
      );
    if (!inventoryItem) {
      throw new BadRequestException(
        'One or more inventory items were not found in this organization',
      );
    }
  }

  private toGroupResponse(
    group: ProductModifierGroupListRecord,
  ): ProductModifierGroupResponseDto {
    return {
      id: group.id,
      organizationId: group.organizationId,
      name: group.name,
      description: group.description,
      isRequired: group.isRequired,
      minSelection: group.minSelection,
      maxSelection: group.maxSelection,
      isMultiple: group.isMultiple,
      isActive: group.isActive,
      sortOrder: group.sortOrder,
      optionsCount: group._count.options,
      assignedProductsCount: group._count.productMappings,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private toGroupDetailResponse(
    group: ProductModifierGroupDetailRecord,
  ): ProductModifierGroupDetailResponseDto {
    return {
      ...this.toGroupResponse(group),
      options: group.options.map((option) => this.toOptionResponse(option)),
      products: group.productMappings.map((mapping) => ({
        id: mapping.product.id,
        name: mapping.product.name,
        sellingPrice: mapping.product.sellingPrice.toNumber(),
        mappingId: mapping.id,
        sortOrder: mapping.sortOrder,
      })),
    };
  }

  private toOptionResponse(
    option: ProductModifierOptionRecord,
  ): ProductModifierOptionResponseDto {
    return {
      id: option.id,
      modifierGroupId: option.modifierGroupId,
      name: option.name,
      description: option.description,
      price: option.price.toNumber(),
      inventoryItemId: option.inventoryItemId,
      inventoryQuantity: option.inventoryQuantity?.toNumber() ?? null,
      trackInventory: option.trackInventory,
      inventoryPolicy: option.inventoryPolicy,
      inventoryItem: option.inventoryItem
        ? {
            id: option.inventoryItem.id,
            name: option.inventoryItem.name,
            unit: option.inventoryItem.unit,
          }
        : null,
      isActive: option.isActive,
      sortOrder: option.sortOrder,
      createdAt: option.createdAt,
      updatedAt: option.updatedAt,
    };
  }

  private toProductModifierGroupsResponse(
    product: ProductModifierAssignmentsRecord,
  ): ProductModifierGroupsResponseDto {
    return {
      product: {
        id: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice.toNumber(),
      },
      modifierGroups: product.modifierGroupMappings.map(
        (mapping): ProductModifierGroupOnProductResponseDto => ({
          id: mapping.modifierGroup.id,
          mappingId: mapping.id,
          name: mapping.modifierGroup.name,
          description: mapping.modifierGroup.description,
          isRequired: mapping.modifierGroup.isRequired,
          minSelection: mapping.modifierGroup.minSelection,
          maxSelection: mapping.modifierGroup.maxSelection,
          isMultiple: mapping.modifierGroup.isMultiple,
          isActive: mapping.modifierGroup.isActive,
          sortOrder: mapping.sortOrder,
          options: mapping.modifierGroup.options.map((option) =>
            this.toOptionResponse(option),
          ),
          createdAt: mapping.modifierGroup.createdAt,
          updatedAt: mapping.modifierGroup.updatedAt,
        }),
      ),
    };
  }

  private throwIfDuplicateGroupName(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A modifier group with this name already exists in this organization',
      );
    }
  }

  private throwIfDuplicateOptionName(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'An option with this name already exists in this modifier group',
      );
    }
  }
}
