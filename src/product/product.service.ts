import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { UpdateProductIngredientDto } from './dto/update-product-ingredient.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductRepository } from './product.repository.js';
import { ProductIngredientChange } from './types/product-ingredient-change.type.js';

type OrganizationContext = { organizationId?: string };
type ProductRecord = NonNullable<
  Awaited<ReturnType<ProductRepository['findById']>>
>;

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async findByPages(dto: GetByPagesDto, context: OrganizationContext) {
    const { items, total } = await this.productRepository.findByPages({
      ...dto,
      organizationId: this.requireOrganizationId(context),
    });

    return {
      items: items.map((product) => this.toResponse(product)),
      pagination: {
        page: dto.page,
        size: dto.size,
        total,
        totalPages: Math.ceil(total / dto.size),
      },
    };
  }

  async findById(id: string, context: OrganizationContext) {
    const product = await this.productRepository.findById(
      id,
      this.requireOrganizationId(context),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.toResponse(product);
  }

  async create(dto: CreateProductDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    await this.ensureInventoryItemsBelongToOrganization(
      dto.productIngredients,
      organizationId,
    );

    try {
      const product = await this.productRepository.create(
        organizationId,
        { name: dto.name, sellingPrice: dto.sellingPrice },
        dto.productIngredients,
      );
      return this.toResponse(product);
    } catch (error) {
      this.throwIfDuplicateName(error);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    context: OrganizationContext,
  ) {
    const organizationId = this.requireOrganizationId(context);
    await this.ensureExists(id, organizationId);

    const ingredientChanges = (dto.productIngredients ?? []).map((ingredient) =>
      this.toProductIngredientChange(ingredient),
    );
    const inventoryItemsToValidate = (dto.productIngredients ?? [])
      .filter(
        (
          ingredient,
        ): ingredient is UpdateProductIngredientDto & {
          inventoryItemId: string;
        } => ingredient.inventoryItemId !== undefined,
      )
      .map((ingredient) => ({
        inventoryItemId: ingredient.inventoryItemId,
      }));
    if (inventoryItemsToValidate.length) {
      await this.ensureInventoryItemsBelongToOrganization(
        inventoryItemsToValidate,
        organizationId,
      );
    }

    const productData: Prisma.ProductUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.sellingPrice !== undefined && {
        sellingPrice: dto.sellingPrice,
      }),
    };

    try {
      const product = await this.productRepository.update(
        id,
        productData,
        ingredientChanges,
      );
      if (product === 'related-record-not-found') {
        throw new NotFoundException(
          'One or more product ingredients were not found for this product',
        );
      }
      return this.toResponse(product);
    } catch (error) {
      this.throwIfDuplicateName(error);
      throw error;
    }
  }

  async delete(id: string, context: OrganizationContext) {
    const result = await this.productRepository.delete(
      id,
      this.requireOrganizationId(context),
    );

    if (result === 'not-found') {
      throw new NotFoundException('Product not found');
    }
    if (result === 'has-orders') {
      throw new ConflictException(
        'A product associated with orders cannot be deleted',
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
    const product = await this.productRepository.findById(id, organizationId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }

  private async ensureInventoryItemsBelongToOrganization(
    ingredients: Array<{ inventoryItemId: string }>,
    organizationId: string,
  ) {
    const ids = [
      ...new Set(ingredients.map((ingredient) => ingredient.inventoryItemId)),
    ];
    if (!ids.length) {
      return;
    }

    const inventoryItems = await this.productRepository.findInventoryItemsByIds(
      organizationId,
      ids,
    );
    if (inventoryItems.length !== ids.length) {
      throw new BadRequestException(
        'One or more inventory items are unavailable for this organization',
      );
    }
  }

  private toProductIngredientChange(
    ingredient: UpdateProductIngredientDto,
  ): ProductIngredientChange {
    if (!ingredient.id) {
      if (
        ingredient.inventoryItemId === undefined ||
        ingredient.quantity === undefined
      ) {
        throw new BadRequestException(
          'New product ingredients require inventoryItemId and quantity',
        );
      }

      return {
        ingredientData: {},
        createData: {
          inventoryItem: { connect: { id: ingredient.inventoryItemId } },
          quantity: ingredient.quantity,
        },
      };
    }

    return {
      id: ingredient.id,
      ingredientData: {
        ...(ingredient.inventoryItemId !== undefined && {
          inventoryItemId: ingredient.inventoryItemId,
        }),
        ...(ingredient.quantity !== undefined && {
          quantity: ingredient.quantity,
        }),
      },
    };
  }

  private toResponse(product: ProductRecord) {
    return {
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      id: product.id,
      organizationId: product.organizationId,
      name: product.name,
      sellingPrice: product.sellingPrice.toNumber(),
      productIngredients: product.productIngredients.map((ingredient) => ({
        id: ingredient.id,
        quantity: ingredient.quantity.toNumber(),
        unitCost: ingredient.inventoryItem.lots[0]?.unitCost.toNumber() ?? null,
        inventoryItem: {
          id: ingredient.inventoryItem.id,
          name: ingredient.inventoryItem.name,
          unit: ingredient.inventoryItem.unit,
        },
      })),
    };
  }

  private throwIfDuplicateName(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A product with this name already exists in this organization',
      );
    }
  }
}
