# API Purchases

Manajemen pembelian bahan baku dari supplier (`src/purchase/purchase.controller.ts`).

---

### Get Purchases (Paginated)

**Endpoint:** `GET /api/purchases`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Query Parameters:**

- `page`, `size` (wajib)
- `sortBy` (wajib): `invoiceNumber`, `-invoiceNumber`, `purchasedAt`, `-purchasedAt`, `createdAt`, `-createdAt`, `supplierName`, `-supplierName` (default `-purchasedAt`)
- `search` (opsional): mencari pada `supplierName`, `invoiceNumber`, dan `purchaseItems[].inventoryItem.name`

---

### Get Purchase by ID

**Endpoint:** `GET /api/purchases/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Error Responses:** `404 Not Found` (`Purchase not found`)

---

### Create Draft Purchase

**Endpoint:** `POST /api/purchases`

**Deskripsi:**
Membuat dokumen pembelian berstatus `DRAFT`. Belum membuat `InventoryLot`, `InventoryTransaction`, maupun `CashTransaction`.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Request Body:**

| Field           | Type   | Required | Validation                     | Description                                                  |
| --------------- | ------ | -------- | ------------------------------ | ------------------------------------------------------------ |
| `supplierName`  | string | Yes      | `@IsString()`, `@IsNotEmpty()` | Nama supplier                                                |
| `invoiceNumber` | string | Yes      | `@IsString()`, `@IsNotEmpty()` | Nomor invoice (unik bersama `supplierName` dalam organisasi) |
| `purchasedAt`   | string | Yes      | `@IsDateString()`              | Tanggal pembelian                                            |
| `purchaseItems` | array  | Yes      | `@ArrayMinSize(1)`             | Minimal 1 item pembelian                                     |

Detail tiap elemen `purchaseItems`:

- `inventoryItemId` (UUID, wajib, harus aktif di organisasi)
- `quantity` (int `>= 1`, wajib) — jumlah kemasan
- `packageSize` (number `>= 0.01`, maks 2 desimal, wajib) — isi per kemasan
- `totalCost` (number `>= 0`, maks 2 desimal, wajib) — total biaya item
- `receivedAt` (ISO date-time, wajib)
- `expiredAt` (ISO date-time, opsional)

**Error Responses:**

- `404 Not Found`: `One or more inventory items were not found in this organization`
- `409 Conflict`: `Purchase invoice already exists`

---

### Finalize Purchase

**Endpoint:** `POST /api/purchases/:id/finalize`

**Deskripsi:**
Mengubah status pembelian dari `DRAFT` menjadi `FINALIZED`, membuat `InventoryLot` dan `InventoryTransaction` (`PURCHASE`) untuk setiap item, serta mencatat pengeluaran kas (`CashTransaction` tipe `PURCHASE`).

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Business Rules & Efek Database:**

- Hanya dapat dijalankan pada pembelian berstatus `DRAFT`.
- Untuk setiap `PurchaseItem`:
  - `totalQuantity = quantity * packageSize`
  - `unitCost = totalCost / totalQuantity`
  - Membuat `InventoryLot` dan `InventoryTransaction` (`type: PURCHASE`, `referenceId: purchase.id`).
- Membuat 1 `CashTransaction` (`type: PURCHASE`, `amount: SUM(item.totalCost)`, `referenceId: purchase.id`).

**Error Responses:**

- `404 Not Found`: `Purchase not found`
- `409 Conflict`: `Only draft purchases can be finalized`

---

### Update Draft Purchase

**Endpoint:** `PATCH /api/purchases/:id`

**Deskripsi:**
Memperbarui header pembelian, menambah/mengubah `purchaseItems` (item tanpa `id` akan dibuat baru; item dengan `id` akan di-update), dan menghapus item melalui `deletedPurchaseItemIds`.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Business Rules:**

- Hanya berlaku untuk pembelian berstatus `DRAFT`.
- Item yang sama tidak boleh ada di `purchaseItems` dan `deletedPurchaseItemIds` secara bersamaan (`400 Bad Request`).

**Error Responses:**

- `409 Conflict`: `Only draft purchases can be updated` atau `Purchase invoice already exists`
- `404 Not Found`: `Purchase not found` atau item tidak ditemukan

---

### Delete Purchase

**Endpoint:** `DELETE /api/purchases/:id`

**Deskripsi:**
Menghapus pembelian beserta `InventoryLot` dan `InventoryTransaction` (`PURCHASE`) terkait.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Business Rules:**

- Pembelian berstatus `FINALIZED` **hanya boleh dihapus oleh `OWNER`** (jika `ADMIN`, mengembalikan `403 Forbidden`).
- Gagal (`409 Conflict`) jika ada `InventoryLot` yang stoknya sudah terpakai (`remainingQuantity < quantity`) atau pernah digunakan pada `PREPARATION_OUT`.
- _(Catatan: Penghapusan `Purchase` yang `FINALIZED` menghapus `InventoryTransaction` dan `InventoryLot`, tetapi tidak menghapus `CashTransaction` terkait.)_

**Response (`200 OK`):** `true`
