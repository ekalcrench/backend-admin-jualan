import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { ProductIngredientChange } from './types/product-ingredient-change.type.js';

const productInclude = {
  productIngredients: {
    include: {
      inventoryItem: {
        select: {
          id: true,
          name: true,
          unit: true,
          lots: {
            orderBy: { receivedAt: 'asc' },
            take: 1,
            select: { unitCost: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId } = data;
    const skip = (page - 1) * size;
    const where: Prisma.ProductWhereInput = {
      organizationId,
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-createdAt'],
        include: productInclude,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string, organizationId: string) {
    return this.prisma.product.findFirst({
      where: { id, organizationId },
      include: productInclude,
    });
  }

  findInventoryItemsByIds(organizationId: string, ids: string[]) {
    return this.prisma.inventoryItem.findMany({
      where: {
        organizationId,
        id: { in: ids },
        isActive: true,
      },
      select: { id: true },
    });
  }

  create(
    organizationId: string,
    data: Pick<Prisma.ProductCreateInput, 'name' | 'sellingPrice'>,
    productIngredients: Array<{ inventoryItemId: string; quantity: number }>,
  ) {
    return this.prisma.product.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
        productIngredients: {
          create: productIngredients.map(({ inventoryItemId, quantity }) => ({
            quantity,
            inventoryItem: { connect: { id: inventoryItemId } },
          })),
        },
      },
      include: productInclude,
    });
  }

  update(
    id: string,
    data: Prisma.ProductUpdateInput,
    productIngredients: ProductIngredientChange[] = [],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const updates = productIngredients.filter(
        (ingredient): ingredient is ProductIngredientChange & { id: string } =>
          ingredient.id !== undefined,
      );
      const updateIds = updates.map((ingredient) => ingredient.id);

      if (new Set(updateIds).size !== updateIds.length) {
        return 'related-record-not-found' as const;
      }

      if (updateIds.length) {
        const existingIngredients = await transaction.productIngredient.count({
          where: { productId: id, id: { in: updateIds } },
        });
        if (existingIngredients !== updateIds.length) {
          return 'related-record-not-found' as const;
        }
      }

      await transaction.product.update({ where: { id }, data });

      for (const ingredient of productIngredients) {
        if (ingredient.id) {
          if (Object.keys(ingredient.ingredientData).length) {
            await transaction.productIngredient.update({
              where: { id: ingredient.id },
              data: ingredient.ingredientData,
            });
          }
        } else if (ingredient.createData) {
          await transaction.productIngredient.create({
            data: {
              ...ingredient.createData,
              product: { connect: { id } },
            },
          });
        }
      }

      return transaction.product.findUniqueOrThrow({
        where: { id },
        include: productInclude,
      });
    });
  }

  delete(id: string, organizationId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findFirst({
        where: { id, organizationId },
        select: {
          _count: { select: { orderItems: true } },
        },
      });

      if (!product) {
        return 'not-found' as const;
      }

      if (product._count.orderItems > 0) {
        return 'has-orders' as const;
      }

      await transaction.productIngredient.deleteMany({
        where: { productId: id },
      });
      await transaction.product.delete({ where: { id } });
      return 'deleted' as const;
    });
  }
}
