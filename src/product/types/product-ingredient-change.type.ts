import { Prisma } from '../../../prisma/generated/prisma/client.js';

export type ProductIngredientChange = {
  id?: string;
  ingredientData: Prisma.ProductIngredientUncheckedUpdateInput;
  createData?: Prisma.ProductIngredientCreateWithoutProductInput;
};
