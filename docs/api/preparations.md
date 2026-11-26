# API Preparations

Manajemen batch produksi/racikan internal (`src/preparation/preparation.controller.ts`).

---

### Get Preparations (Paginated)

**Endpoint:** `GET /api/preparations`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Query Parameters:**

- `page`, `size` (wajib)
- `sortBy` (wajib): `name`, `-name`, `preparedAt`, `-preparedAt`, `createdAt`, `-createdAt`, `outputTotalCost`, `-outputTotalCost` (default `-preparedAt`)
- `search` (opsional): mencari pada `name`, `outputInventoryItem.name`, dan `items[].inventoryItem.name`

---

### Get Preparation by ID

**Endpoint:** `GET /api/preparations/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Error Responses:** `404 Not Found` (`Preparation not found`)

---

### Create Draft Preparation

**Endpoint:** `POST /api/preparations`

**Deskripsi:**
Membuat dokumen preparation berstatus `DRAFT` dan **langsung mereservasi/memotong stok bahan baku** menggunakan alokasi FIFO (`receivedAt ASC, id ASC`) dalam transaksi `Serializable`. Lot hasil (`outputLot`) belum dibuat sampai `complete` dipanggil.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Request Body:**

| Field                   | Type           | Required | Validation                     | Description                                               |
| ----------------------- | -------------- | -------- | ------------------------------ | --------------------------------------------------------- |
| `name`                  | string         | Yes      | `@IsString()`, `@IsNotEmpty()` | Nama batch produksi                                       |
| `preparedAt`            | string         | Yes      | `@IsDateString()`              | Waktu produksi                                            |
| `expiredAt`             | string \| null | No       | `@IsDateString()`              | Tanggal kadaluarsa output                                 |
| `notes`                 | string \| null | No       | `@IsString()`                  | Catatan                                                   |
| `outputInventoryItemId` | string (UUID)  | Yes      | `@IsUUID()`                    | ID `InventoryItem` hasil produksi                         |
| `outputQuantity`        | number         | Yes      | `>= 0.01`, maks 2 desimal      | Kuantitas hasil produksi                                  |
| `preparationItems`      | array          | Yes      | `@ArrayMinSize(1)`             | Daftar bahan baku (`inventoryItemId`, `quantity >= 0.01`) |

**Business Rules:**

- Seluruh `inventoryItemId` (output maupun bahan) harus aktif dan milik organisasi.
- Jika stok lot bahan baku tidak mencukupi (selalu strict), transaksi di-rollback dan mengembalikan `409 Conflict` (`Stock bahan tidak mencukupi`).
- Mencatat `InventoryTransaction` bertipe `PREPARATION_OUT` dan menghitung `outputTotalCost` serta `outputUnitCost`.

---

### Update Draft Preparation

**Endpoint:** `PATCH /api/preparations/:id`

**Deskripsi:**
Memperbarui preparation berstatus `DRAFT`. Jika `preparationItems` atau `deletedPreparationItemIds` dikirim, sistem mengembalikan stok reservasi lama, lalu merencanakan ulang alokasi FIFO untuk komposisi bahan terbaru.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Error Responses:**

- `409 Conflict`: `Only draft preparations can be updated` atau `Stock bahan tidak mencukupi`
- `400 Bad Request`: `A preparation must contain at least one preparation item`
- `404 Not Found`: `Preparation not found`

---

### Complete Preparation

**Endpoint:** `POST /api/preparations/:id/complete`

**Deskripsi:**
Menyelesaikan preparation dari `DRAFT` menjadi `COMPLETED`, membuat `InventoryLot` output (`preparationOutputId`), dan mencatat `InventoryTransaction` bertipe `PREPARATION_IN`.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Error Responses:**

- `404 Not Found`: `Preparation not found`
- `409 Conflict`: `Only draft preparations can be completed`

---

### Delete Preparation

**Endpoint:** `DELETE /api/preparations/:id`

**Deskripsi:**
Menghapus preparation, mengembalikan seluruh kuantitas `PREPARATION_OUT` ke lot bahan baku asal, serta menghapus `outputLot` (jika ada) dan `InventoryTransaction` terkait.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Business Rules:**

- Preparation berstatus `COMPLETED` **hanya boleh dihapus oleh `OWNER`** (`ADMIN` -> `403 Forbidden`).
- Gagal (`409 Conflict`) jika `outputLot` sudah pernah dikonsumsi (`remainingQuantity < quantity` atau ada `PREPARATION_OUT`).

**Response (`200 OK`):** `true`
