import { responseInclude } from '../constants/response-include.constants.js';
import type { Prisma } from '../../../prisma/generated/prisma/client.js';

export type OrderQueryRecord = Prisma.OrderGetPayload<{
  include: typeof responseInclude;
}>;
