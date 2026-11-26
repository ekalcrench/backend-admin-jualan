# Sales Management (Order, Product, & Modifier)

## 1. Pembuatan Order (`POST /api/orders`)

Seluruh proses pembuatan order berjalan di dalam satu transaksi `Serializable` dengan penguncian baris produk (`lockProducts`) dan item inventori:

1. **Validasi Tipe Order**:
   - `DINE_IN`: Memvalidasi `Table` milik organisasi dan `guestCount <= table.capacity`, lalu membuat `DineInOrder`. _(Catatan: Status meja `Table.status` tidak diubah otomatis oleh backend.)_
   - `TAKEAWAY`: Membuat `TakeawayOrder`.
   - `DELIVERY`: Membuat `DeliveryOrder`. _(Catatan: `deliveryFee` disimpan pada `DeliveryOrder` dan tidak ditambahkan ke `Order.totalAmount`.)_
2. **Resolusi Produk & Modifier**:
   - Produk harus `isActive = true`.
   - Opsi modifier harus `isActive = true`, ter-assign ke produk melalui grup yang `isActive = true`, dan memenuhi aturan `isRequired`, `minSelection`, `maxSelection`, dan `isMultiple`.
   - Harga jual (`Product.sellingPrice`, `ProductModifierOption.price`) dan konfigurasi inventori modifier di-snapshot ke `OrderItem` dan `OrderItemModifier`.
3. **Kalkulasi Total**:
   - `Order.totalAmount = SUM((item.unitPrice + SUM(modifier.unitPrice)) * item.quantity)`
   - `Order.totalQuantity = SUM(item.quantity)`
4. **Pemotongan Stok & Costing (HPP)**:
   - Produk `UNTRACKED`: Tidak memotong stok produk.
   - Produk `MANUAL`: Memotong `Product.stock` secara atomik (selalu strict) dan menandai `OrderItem.manualStockDeducted = true`.
   - Produk `INVENTORY` dan Modifier dengan `trackInventory = true`: Mengagregasi kebutuhan bahan baku dan memotong `InventoryLot` secara FIFO (`SALE`).
   - Costing FIFO dihitung untuk setiap item yang memiliki bahan baku (termasuk produk `UNTRACKED`/`MANUAL` yang memiliki `ProductIngredient` atau modifier dengan `inventoryItemId` secara read-only). Jika ada komponen yang tidak memiliki lot atau mengalami shortage tanpa lot, `costingStatus = UNKNOWN` (API mengembalikan `unitCost: null`).
5. **Status Awal**: Order dibuat dengan status `UNPAID` dan `inventoryDeducted = true`.

## 2. Pengubahan & Penghapusan Order `UNPAID`

- Hanya order berstatus `UNPAID` yang dapat diubah (`PATCH /api/orders/:id`) atau dihapus (`DELETE /api/orders/:id`).
- Saat item pada order `UNPAID` diubah atau order dihapus, backend mengembalikan stok manual produk (`Product.stock`) dan mengembalikan mutasi lot inventori (dicatat sebagai `InventoryTransaction` bertipe `RETURN`). Pada operasi update, kebutuhan stok terbaru kemudian diterapkan kembali secara atomik.

## 3. Pembayaran Order (`POST /api/orders/:id/mark-paid`)

- Mengubah `Order.status` dari `UNPAID` menjadi `PAID` (setelah `PAID`, order bersifat immutable).
- Karena stok sudah dipotong saat `create` (`inventoryDeducted = true`), `markPaid` tidak memotong stok ulang.
- Mencatat `CashTransaction` bertipe `SALE` sebesar `Order.totalAmount` dengan `referenceId = order.id`.
- Order berstatus `PAID` langsung masuk ke perhitungan `GET /api/orders/overview` (`totalAmount`, `totalQuantity`, `totalGrossProfit`).
