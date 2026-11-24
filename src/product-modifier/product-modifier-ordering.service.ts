import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { OrderModifierValidationError } from './errors/order-modifier-validation.error.js';
import type {
  OrderItemModifierSnapshotInput,
  OrderModifierSelectionInput,
  ResolvedOrderModifierItem,
} from './types/product-modifier-ordering.types.js';

type ProductWithOrderingModifiers = Prisma.ProductGetPayload<{
  select: {
    id: true;
    organizationId: true;
    name: true;
    sellingPrice: true;
    isActive: true;
    stockManagement: true;
    inventoryPolicy: true;
    productIngredients: {
      select: {
        inventoryItemId: true;
        quantity: true;
      };
    };
    modifierGroupMappings: {
      select: {
        modifierGroup: {
          select: {
            id: true;
            organizationId: true;
            name: true;
            isRequired: true;
            minSelection: true;
            maxSelection: true;
            isMultiple: true;
            options: {
              select: {
                id: true;
                name: true;
                price: true;
                inventoryItemId: true;
                inventoryQuantity: true;
                trackInventory: true;
                inventoryPolicy: true;
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class ProductModifierOrderingService {
  /**
   * Resolves and validates modifier selections for order items using the
   * authoritative database names and prices. Must be called inside the order
   * transaction so product/option changes cannot slip in between validation
   * and snapshot creation.
   */
  async resolveOrderItems(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    items: OrderModifierSelectionInput[],
  ): Promise<ResolvedOrderModifierItem[]> {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = productIds.length
      ? await transaction.product.findMany({
          where: { organizationId, id: { in: productIds } },
          select: {
            id: true,
            organizationId: true,
            name: true,
            sellingPrice: true,
            isActive: true,
            stockManagement: true,
            inventoryPolicy: true,
            productIngredients: {
              select: {
                inventoryItemId: true,
                quantity: true,
              },
            },
            modifierGroupMappings: {
              where: { modifierGroup: { is: { isActive: true } } },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              select: {
                modifierGroup: {
                  select: {
                    id: true,
                    organizationId: true,
                    name: true,
                    isRequired: true,
                    minSelection: true,
                    maxSelection: true,
                    isMultiple: true,
                    options: {
                      where: { isActive: true },
                      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                      select: {
                        id: true,
                        name: true,
                        price: true,
                        inventoryItemId: true,
                        inventoryQuantity: true,
                        trackInventory: true,
                        inventoryPolicy: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : [];
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    return items.map((item) =>
      this.resolveItem(productsById.get(item.productId), item),
    );
  }

  private resolveItem(
    product: ProductWithOrderingModifiers | undefined,
    item: OrderModifierSelectionInput,
  ): ResolvedOrderModifierItem {
    if (!product) {
      throw new OrderModifierValidationError(
        'product-not-found',
        'One or more products were not found in this organization',
      );
    }
    if (!product.isActive) {
      throw new OrderModifierValidationError(
        'product-inactive',
        `Product "${product.name}" is inactive and cannot be ordered`,
      );
    }

    const modifierSnapshots =
      item.modifierOptionIds === null
        ? undefined
        : this.resolveSnapshots(product, item.modifierOptionIds);
    const modifierTotal = (modifierSnapshots ?? []).reduce(
      (total, snapshot) => total.plus(snapshot.unitPrice),
      new Prisma.Decimal(0),
    );

    return {
      productId: product.id,
      productName: product.name,
      sellingPrice: product.sellingPrice,
      stockManagement: product.stockManagement,
      inventoryPolicy: product.inventoryPolicy,
      productIngredients: product.productIngredients,
      modifierSnapshots,
      modifierTotal,
    };
  }

  private resolveSnapshots(
    product: ProductWithOrderingModifiers,
    modifierOptionIds: string[],
  ): OrderItemModifierSnapshotInput[] {
    if (new Set(modifierOptionIds).size !== modifierOptionIds.length) {
      throw new OrderModifierValidationError(
        'duplicate-modifier-option',
        'The same modifier option cannot be selected more than once',
      );
    }

    for (const mapping of product.modifierGroupMappings) {
      if (mapping.modifierGroup.organizationId !== product.organizationId) {
        throw new OrderModifierValidationError(
          'modifier-option-invalid',
          'Modifier groups must belong to the same organization as the product',
        );
      }
    }

    const optionById = new Map<
      string,
      {
        group: ProductWithOrderingModifiers['modifierGroupMappings'][number]['modifierGroup'];
        option: ProductWithOrderingModifiers['modifierGroupMappings'][number]['modifierGroup']['options'][number];
      }
    >();
    for (const mapping of product.modifierGroupMappings) {
      for (const option of mapping.modifierGroup.options) {
        optionById.set(option.id, {
          group: mapping.modifierGroup,
          option,
        });
      }
    }

    const selectedByGroupId = new Map<
      string,
      Array<{
        option: ProductWithOrderingModifiers['modifierGroupMappings'][number]['modifierGroup']['options'][number];
      }>
    >();
    for (const optionId of modifierOptionIds) {
      const selected = optionById.get(optionId);
      if (!selected) {
        throw new OrderModifierValidationError(
          'modifier-option-invalid',
          'One or more modifier options are unavailable for this product',
        );
      }

      const groupSelections = selectedByGroupId.get(selected.group.id) ?? [];
      groupSelections.push({ option: selected.option });
      selectedByGroupId.set(selected.group.id, groupSelections);
    }

    const snapshots: OrderItemModifierSnapshotInput[] = [];
    for (const mapping of product.modifierGroupMappings) {
      const group = mapping.modifierGroup;
      const selectedOptions = selectedByGroupId.get(group.id) ?? [];
      const minimumSelections = group.isRequired
        ? Math.max(1, group.minSelection)
        : group.minSelection;

      if (selectedOptions.length < minimumSelections) {
        throw new OrderModifierValidationError(
          'selection-min',
          `Modifier group "${group.name}" requires at least ${minimumSelections} selection(s)`,
        );
      }
      if (selectedOptions.length > group.maxSelection) {
        throw new OrderModifierValidationError(
          'selection-max',
          `Modifier group "${group.name}" allows at most ${group.maxSelection} selection(s)`,
        );
      }
      if (!group.isMultiple && selectedOptions.length > 1) {
        throw new OrderModifierValidationError(
          'selection-max',
          `Modifier group "${group.name}" only allows a single selection`,
        );
      }

      for (const { option } of selectedOptions) {
        if (option.trackInventory && !option.inventoryItemId) {
          throw new OrderModifierValidationError(
            'modifier-option-invalid',
            `Modifier option "${option.name}" is configured to track inventory without an inventory item`,
          );
        }
        snapshots.push({
          modifierGroupId: group.id,
          modifierOptionId: option.id,
          groupName: group.name,
          optionName: option.name,
          unitPrice: option.price,
          inventoryItemId: option.inventoryItemId,
          inventoryQuantity: option.inventoryQuantity,
          trackInventory: option.trackInventory,
          inventoryPolicy: option.inventoryPolicy,
          sortOrder: snapshots.length,
        });
      }
    }

    return snapshots;
  }
}
