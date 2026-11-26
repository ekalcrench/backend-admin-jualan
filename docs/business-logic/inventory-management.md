# Inventory Management

_(Lihat juga referensi teknis mendalam pada [docs/inventory-costing.md](../inventory-costing.md).)_

## 1. Struktur Item & Lot Stok

- Master bahan baku disimpan pada `InventoryItem` dengan satuan dasar (`GRAM`, `ML`, atau `PCS`). Tidak ada konversi satuan otomatis antar unit; seluruh resep, pembelian, preparation, dan modifier menggunakan unit dasar yang sama dengan `InventoryItem.unit`.
- Stok fisik tidak disimpan sebagai satu kolom angka di `InventoryItem`, melainkan dipecah menjadi batch pada `InventoryLot`.
- `totalStock`, `totalCost`, dan `averageCost` pada `InventoryItem` dihitung secara dinamis dari penjumlahan `remainingQuantity` dan `unitCost * remainingQuantity` seluruh lot miliknya.

## 2. Sumber Penambahan & Pengurangan Stok

- **Pembelian (`Purchase`)**: Saat difinalisasi, setiap `PurchaseItem` membuat 1 `InventoryLot` baru dengan kuantitas `quantity * packageSize` dan `InventoryTransaction` tipe `PURCHASE`.
- **Produksi (`Preparation`)**: Saat dibuat (`DRAFT`), bahan baku dipotong FIFO (`PREPARATION_OUT`). Saat diselesaikan (`COMPLETED`), hasil produksi membuat 1 `InventoryLot` baru (`PREPARATION_IN`).
- **Penjualan (`Order`)**: Saat order dibuat (`UNPAID`), produk bertipe `INVENTORY` dan modifier dengan `trackInventory: true` memotong lot secara FIFO (`SALE`). Saat order `UNPAID` diubah atau dihapus, stok dikembalikan ke lot (`RETURN`).
- **Penyesuaian Manual (`InventoryLot`)**: Mengubah `remainingQuantity` lewat `PATCH /api/inventory-lots/:id` menulis nilai absolut baru dan mencatat selisihnya sebagai `ADJUSTMENT_IN` atau `ADJUSTMENT_OUT`.

## 3. Alokasi FIFO & Kebijakan Stok (`STRICT` vs `ALLOW_NEGATIVE`)

- Pengeluaran stok selalu mengurutkan lot berdasarkan `(receivedAt ASC, id ASC)` di dalam transaksi `Serializable` dengan row-level locking.
- **`STRICT`**: Total permintaan tidak boleh melebihi sisa stok lot. Jika kurang, seluruh transaksi dibatalkan (`409 Conflict`).
- **`ALLOW_NEGATIVE`**: Menghabiskan lot positif secara FIFO terlebih dahulu. Jika masih kurang, sisa kekurangan (shortage) dibebankan ke lot tertua menjadi `remainingQuantity` negatif, atau dibuatkan **shortage lot** baru (`quantity = 0`, `unitCost = 0`, `remainingQuantity < 0`) jika item belum memiliki lot sama sekali.

## 4. Penghapusan Inventory Item

- `DELETE /api/inventory-items/:id` mencoba menghapus fisik; jika gagal karena kendala foreign key (misalnya `onDelete: Restrict` dari `ProductModifierOption` atau referensi lot/transaksi), sistem otomatis melakukan **soft delete** dengan mengubah `isActive = false`.
