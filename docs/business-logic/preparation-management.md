# Preparation Management

Modul `Preparation` menangani proses produksi/racikan internal yang mengonversi beberapa bahan baku (`PreparationItem`) menjadi satu `InventoryItem` baru (`outputInventoryItemId`).

## Siklus Hidup Preparation

1. **Pembuatan (`POST /api/preparations`) -> Status `DRAFT`**:
   - Sistem langsung mereservasi dan memotong stok lot bahan baku menggunakan alokasi FIFO (`receivedAt ASC, id ASC`) dalam transaksi `Serializable`.
   - Kebijakan stok selalu **strict**: jika ada bahan baku yang stoknya tidak mencukupi, pembuatan preparation ditolak (`409 Conflict`).
   - Mencatat `InventoryTransaction` tipe `PREPARATION_OUT` untuk setiap lot yang terpotong.
   - Menghitung biaya rata-rata tertimbang per bahan (`PreparationItem.unitCost` & `totalCost`), lalu menjumlahkannya menjadi `outputTotalCost` dan `outputUnitCost = floor_3_dec(outputTotalCost / outputQuantity)`.
   - Pada tahap `DRAFT`, `InventoryLot` untuk hasil produksi (`outputLot`) **belum dibuat**.
2. **Pembaruan (`PATCH /api/preparations/:id`)**:
   - Hanya berlaku saat status masih `DRAFT`.
   - Jika komposisi bahan diubah, sistem mengembalikan stok reservasi `PREPARATION_OUT` sebelumnya ke lot asal, lalu merencanakan ulang alokasi FIFO untuk komposisi bahan terbaru.
3. **Penyelesaian (`POST /api/preparations/:id/complete`) -> Status `COMPLETED`**:
   - Membuat `InventoryLot` baru untuk `outputInventoryItemId` dengan `preparationOutputId = preparation.id`, `receivedAt = preparedAt`, dan HPP `outputUnitCost`.
   - Mencatat `InventoryTransaction` tipe `PREPARATION_IN`.
4. **Penghapusan (`DELETE /api/preparations/:id`)**:
   - Preparation berstatus `COMPLETED` hanya boleh dihapus oleh `OWNER`, dan hanya jika `outputLot` belum pernah dikonsumsi (`remainingQuantity == quantity` dan tidak ada `PREPARATION_OUT` dari lot tersebut).
   - Mengembalikan stok `PREPARATION_OUT` ke lot bahan baku asal, menghapus transaksi `PREPARATION_IN`/`PREPARATION_OUT`, menghapus `outputLot`, dan menghapus record `Preparation`.
