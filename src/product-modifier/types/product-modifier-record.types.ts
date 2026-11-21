import { Prisma } from '../../../prisma/generated/prisma/client.js';
import {
  productModifierGroupDetailInclude,
  productModifierGroupListInclude,
  productModifierOptionInclude,
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
  Prisma.ProductModifierOptionGetPayload<{
    include: typeof productModifierOptionInclude;
  }>;

export type ProductModifierOptionWithGroupRecord =
  Prisma.ProductModifierOptionGetPayload<{
    include: {
      inventoryItem: {
        select: {
          id: true;
          name: true;
          unit: true;
        };
      };
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
            options: {
              include: typeof productModifierOptionInclude;
            };
          };
        };
      };
    };
  };
}>;
