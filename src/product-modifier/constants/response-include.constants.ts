import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const productModifierOptionOrderBy = [
  { sortOrder: 'asc' },
  { createdAt: 'asc' },
] satisfies Prisma.ProductModifierOptionOrderByWithRelationInput[];

export const productModifierGroupListInclude = {
  _count: {
    select: {
      options: true,
      productMappings: true,
    },
  },
} satisfies Prisma.ProductModifierGroupInclude;

export const productModifierGroupDetailInclude = {
  options: {
    orderBy: productModifierOptionOrderBy,
  },
  productMappings: {
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sellingPrice: true,
        },
      },
    },
  },
  _count: {
    select: {
      options: true,
      productMappings: true,
    },
  },
} satisfies Prisma.ProductModifierGroupInclude;
