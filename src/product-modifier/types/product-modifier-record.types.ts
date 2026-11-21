import { Prisma } from '../../../prisma/generated/prisma/client.js';
import {
  productModifierGroupDetailInclude,
  productModifierGroupListInclude,
} from '../constants/response-include.constants.js';

export type ProductModifierGroupListRecord =
  Prisma.ProductModifierGroupGetPayload<{
    include: typeof productModifierGroupListInclude;
  }>;

export type ProductModifierGroupDetailRecord =
  Prisma.ProductModifierGroupGetPayload<{
    include: typeof productModifierGroupDetailInclude;
  }>;

export type ProductModifierOptionRecord =
  Prisma.ProductModifierOptionGetPayload<Record<string, never>>;

export type ProductModifierOptionWithGroupRecord =
  Prisma.ProductModifierOptionGetPayload<{
    include: {
      modifierGroup: {
        select: {
          id: true;
          organizationId: true;
          isActive: true;
        };
      };
    };
  }>;

export type ProductModifierAssignmentsRecord = Prisma.ProductGetPayload<{
  include: {
    modifierGroupMappings: {
      include: {
        modifierGroup: {
          include: {
            options: true;
          };
        };
      };
    };
  };
}>;
