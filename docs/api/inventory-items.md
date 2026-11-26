# API Inventory Items

Manajemen master bahan baku / item inventori (`src/inventory-item/inventory-item.controller.ts`). Seluruh endpoint memerlukan konteks `organizationId` di JWT.

---

### Get Inventory Items (Paginated)

**Endpoint:** `GET /api/inventory-items`

**Deskripsi:**
Mengambil daftar item inventori aktif (`isActive: true`) beserta kalkulasi `totalStock`, `totalCost`, dan `averageCost` dari seluruh lot terkait.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Query Parameters:**

- `page`, `size` (wajib)
- `sortBy` (wajib):
  - Kolom standar: `createdAt`, `-createdAt`, `name`, `-name`, `unit`, `-unit` (default `name`)
  - Kolom agregasi (raw SQL): `totalStock`, `-totalStock`, `averageCost`, `-averageCost`, `totalCost`, `-totalCost`
- `search` (opsional): mencari pada `name` (case-insensitive)

**Response (`200 OK`):**

```json
{
  "items": [
    {
      "id": "aaa8400-e29b-41d4-a716-446655440000",
      "organizationId": "111e8400-e29b-41d4-a716-446655440000",
      "name": "Beras",
      "unit": "GRAM",
      "totalStock": 5000,
      "totalCost": 75000,
      "averageCost": 15,
      "createdAt": "2026-08-12T10:00:00.000Z",
      "updatedAt": "2026-08-12T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "size": 10, "total": 1, "totalPages": 1 }
}
```

---

### Get Inventory Item Options

**Endpoint:** `GET /api/inventory-items/options`

**Deskripsi:**
Mengambil seluruh item inventori aktif (`id`, `name`, `unit`) diurutkan berdasarkan `name ASC` untuk dropdown.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Response (`200 OK`):**

```json
[
  {
    "id": "aaa8400-e29b-41d4-a716-446655440000",
    "name": "Beras",
    "unit": "GRAM"
  }
]
```

---

### Get Total Inventory Assets

**Endpoint:** `GET /api/inventory-items/assets`

**Deskripsi:**
Menghitung total nilai aset inventori aktif organisasi saat ini (`SUM(lot.unit_cost * lot.remaining_quantity)`).

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Response (`200 OK`):**

```json
{
  "totalAssets": 1250000
}
```

---

### Get Inventory Item by ID

**Endpoint:** `GET /api/inventory-items/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Path Parameters:** `id` (UUID `InventoryItem`)

**Error Responses:** `404 Not Found` (`Inventory item not found`)

---

### Create Inventory Item

**Endpoint:** `POST /api/inventory-items`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Request Body:**

| Field  | Type            | Required | Default | Description                             |
| ------ | --------------- | -------- | ------- | --------------------------------------- |
| `name` | string          | Yes      | -       | Nama item inventori (maks 255 karakter) |
| `unit` | `InventoryUnit` | No       | `GRAM`  | Satuan dasar (`GRAM`, `ML`, `PCS`)      |

**Error Responses:**

- `409 Conflict`: `An item with this name already exists`

---

### Update Inventory Item

**Endpoint:** `PATCH /api/inventory-items/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Request Body:** `name` (opsional), `unit` (opsional)

**Error Responses:** `404 Not Found`, `409 Conflict`

---

### Delete Inventory Item

**Endpoint:** `DELETE /api/inventory-items/:id`

**Deskripsi:**
Menghapus item inventori secara fisik. Jika gagal karena masih direferensikan oleh tabel lain (mis. `ProductModifierOption` dengan `onDelete: Restrict`, lot, atau transaksi), repository otomatis melakukan **soft delete** dengan mengubah `isActive = false`.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Response (`200 OK`):** `true`

**Error Responses:** `404 Not Found` (`Barang tidak ada`)
