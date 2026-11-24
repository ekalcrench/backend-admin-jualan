# Inventory tracking and product costing

Product stock management has three modes: `UNTRACKED`, `MANUAL`, and
`INVENTORY`. Modifier options continue to use independent `trackInventory` and
`inventoryPolicy` settings. Product ingredients remain optional. Each
configured ingredient must reference an inventory item in the product's
organization and have a positive quantity. Modifier inventory item and
quantity must be configured together; enabling modifier tracking without an
item is invalid.

`UNTRACKED` means unlimited product availability and returns `stock: null`.
`MANUAL` requires a non-negative integer stock value. Orders decrement that
counter at creation, including unpaid orders, and reject a line when the
aggregate ordered quantity exceeds available stock. This rule is always strict
and does not use `inventoryPolicy`. Editing or deleting an unpaid order
restores its previous manual deductions before applying the edited quantities.
Manual stock changes are protected by product-row locks and conditional
updates.

`INVENTORY` derives product stock from its ingredients and inventory lots.
Product ingredient quantities are deducted only in this mode. Existing
products with `trackInventory: true` migrate to `INVENTORY`; others migrate to
`UNTRACKED`.

## Order behavior

Order creation resolves active products and selected active modifier options
inside one serializable transaction. It snapshots prices, recipe-derived unit
cost, cost status, and modifier inventory settings, then applies tracked stock
consumption in that transaction. Modifier tracking is independent of product
stock management. An unpaid order's stock is already deducted; marking it paid
does not deduct again. Editing an unpaid order returns its previous manual
product stock and inventory-lot movements, then reapplies its current
requirements atomically. Deleting an unpaid deducted order returns its manual
product stock and net inventory-lot movements. Inventory-lot returns are
recorded as `RETURN` inventory transactions; order-item snapshots record which
manual product quantities were deducted.

Consumption from all tracked recipe and modifier sources is aggregated by
inventory item and allocated FIFO by `(receivedAt, id)`. Inventory item rows are
locked in ID order, lots are updated conditionally, and the transaction uses
serializable isolation. A failed strict check rolls back the full order.

## Policies and shortages

- `STRICT` requires strict-policy tracked demand for an inventory item to be
  no greater than its net remaining quantity. Strict sources allocate first;
  an `ALLOW_NEGATIVE` source for the same item may then consume the remainder
  and create a shortage.
- `ALLOW_NEGATIVE` permits a shortage. Available positive lots are used FIFO;
  the remaining shortage is assigned to the oldest lot by `(receivedAt, id)`.
  If the item has no lot, the system creates a zero-quantity shortage lot with
  negative `remainingQuantity` and unknown cost. This makes the shortage
  visible in stock totals and inventory transactions rather than dropping it.

The existing manual lot editor remains an absolute stock adjustment: it writes
the requested `remainingQuantity` and records the signed difference as an
`ADJUSTMENT_IN` or `ADJUSTMENT_OUT` transaction. It does not erase the order
shortage or transaction history, and its input validation continues to reject
negative manual quantities.

## Costing

Costing is read-only except for the stock allocation already performed for an
`INVENTORY` product or tracked modifier. Product ingredient costs are calculated
whenever configured, including `UNTRACKED` and `MANUAL` products. A linked modifier inventory item
contributes cost whether or not its tracking is enabled; an unlinked modifier
has no inventory-derived cost.

FIFO uses `InventoryLot.unitCost`. Tracked allocations use the same lots and
quantities as the stock deduction. Non-tracked sources use a read-only FIFO
cost estimate and do not reserve or mutate stock. If any configured source
cannot be fully costed from available lots (including a shortage with no lot),
the order item has `costingStatus: UNKNOWN` and API `unitCost: null`; otherwise
the status is `CALCULATED`, including a genuine zero cost. Historical order
items keep their unit-cost snapshots when catalog configuration or lot costs
change. Gross profit is reported as `null` for a period containing an unknown
paid item cost. Pre-existing order-item rows are migrated as `UNKNOWN` because
the prior schema could not distinguish a real zero from a missing cost.

## API fields

Product create/update accepts `stockManagement`, `stock`, and `inventoryPolicy`.
`stock` is required when creating or switching to `MANUAL`, and may only be set
while the effective mode is `MANUAL`. It is returned as `null` for
`UNTRACKED`, as the configured counter for `MANUAL`, and as the
ingredient-derived quantity for `INVENTORY`. `productIngredients` may be
omitted on create. Modifier-option create/update continues to accept
`trackInventory` and `inventoryPolicy`. Order item responses add
`costingStatus`, and `unitCost` is nullable when cost is unknown. Overview
gross-profit fields are nullable when the selected period includes unknown
costs.
