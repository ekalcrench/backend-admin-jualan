import {
  PreparationStatus,
  Prisma,
} from '../../../prisma/generated/prisma/client.js';

export type PreparationValues = {
  name?: string;
  status?: PreparationStatus;
  preparedAt?: Date;
  expiredAt?: Date | null;
  notes?: string | null;
  outputInventoryItemId?: string;
  outputQuantity?: Prisma.Decimal;
};
