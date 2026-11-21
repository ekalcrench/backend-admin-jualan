import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const sortMap: Record<
  string,
  Prisma.ProductModifierGroupOrderByWithRelationInput[]
> = {
  createdAt: [{ createdAt: 'asc' }],
  '-createdAt': [{ createdAt: 'desc' }],
  name: [{ name: 'asc' }],
  '-name': [{ name: 'desc' }],
  sortOrder: [{ sortOrder: 'asc' }, { name: 'asc' }],
  '-sortOrder': [{ sortOrder: 'desc' }, { name: 'asc' }],
  isActive: [{ isActive: 'desc' }, { sortOrder: 'asc' }],
  '-isActive': [{ isActive: 'asc' }, { sortOrder: 'asc' }],
};
