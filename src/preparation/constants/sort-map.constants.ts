import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const sortMap: Record<
  string,
  Prisma.PreparationOrderByWithRelationInput
> = {
  name: { name: 'asc' },
  '-name': { name: 'desc' },
  preparedAt: { preparedAt: 'asc' },
  '-preparedAt': { preparedAt: 'desc' },
  createdAt: { createdAt: 'asc' },
  '-createdAt': { createdAt: 'desc' },
  outputTotalCost: { outputTotalCost: 'asc' },
  '-outputTotalCost': { outputTotalCost: 'desc' },
};
