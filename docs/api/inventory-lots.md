# API Inventory Lots

Pengelolaan batch/lot stok inventori (`src/inventory-lot/inventory-lot.controller.ts`).

---

### Get Inventory Lots (Paginated)

**Endpoint:** `GET /api/inventory-lots`

**Deskripsi:**
Mengambil daftar lot untuk suatu `inventoryItemId` aktif di organisasi.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Query Parameters:**

| Parameter         | Type          | Required | Description                                                                                                                                                                                                                       |
| ----------------- | ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inventoryItemId` | string (UUID) | Yes      | ID `InventoryItem` yang ingin dilihat lot-nya                                                                                                                                                                                     |
| `page`            | number        | Yes      | Nomor halaman (`> 0`)                                                                                                                                                                                                             |
| `size`            | number        | Yes      | Jumlah item per halaman (`> 0`)                                                                                                                                                                                                   |
| `sortBy`          | string        | Yes      | `quantity`, `-quantity`, `remainingQuantity`, `-remainingQuantity`, `unitCost`, `-unitCost`, `totalCost`, `-totalCost`, `receivedAt`, `-receivedAt`, `createdAt`, `-createdAt`, `expiredAt`, `-expiredAt` (default `-receivedAt`) |
| `search`          | string        | No       | Mencari pada `purchase.invoiceNumber` dan `purchase.supplierName`                                                                                                                                                                 |

**Response (`200 OK`):**

```json
{
  "items": [
    {
      "id": "bbb8400-e29b-41d4-a716-446655440000",
      "inventoryItemId": "aaa8400-e29b-41d4-a716-446655440000",
      "purchaseItemId": "ccc8400-e29b-41d4-a716-446655440000",
      "preparationOutputId": null,
      "quantity": 6000,
      "remainingQuantity": 4500,
      "unitCost": 15,
      "totalCost": 90000,
      "receivedAt": "2026-08-12T08:00:00.000Z",
      "expiredAt": null,
      "createdAt": "2026-08-12T08:05:00.000Z",
      "updatedAt": "2026-08-12T12:00:00.000Z",
      "invoiceNumber": "INV-001",
      "supplierName": "Toko Beras Jaya"
    }
  ],
  "pagination": { "page": 1, "size": 10, "total": 1, "totalPages": 1 }
}
```

---

### Update Inventory Lot (Manual Stock Adjustment)

**Endpoint:** `PATCH /api/inventory-lots/:id`

**Deskripsi:**
Memperbarui `remainingQuantity`, `receivedAt`, atau `expiredAt` pada suatu lot dengan row-level lock (`FOR UPDATE OF lot`).

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Request Body:**

| Field               | Type           | Required | Validation                                     | Description                                  |
| ------------------- | -------------- | -------- | ---------------------------------------------- | -------------------------------------------- |
| `remainingQuantity` | number         | No       | `0 <= val <= 9999999999999.99`, maks 2 desimal | Sisa stok absolut baru (tidak boleh negatif) |
| `receivedAt`        | string         | No       | `@IsDateString()`                              | Tanggal masuk baru (memengaruhi urutan FIFO) |
| `expiredAt`         | string \| null | No       | `@IsDateString()`                              | Tanggal kadaluarsa baru atau `null`          |

**Business Rules & Efek Database:**

- Jika `remainingQuantity` berubah dari nilai sebelumnya, sistem otomatis mencatat record baru di `inventory_transactions`:
  - `ADJUSTMENT_IN` jika `remainingQuantity` baru > nilai lama.
  - `ADJUSTMENT_OUT` jika `remainingQuantity` baru < nilai lama.
  - `quantity` diisi selisih absolutnya, `unitCost` menggunakan `lot.unitCost`, `totalCost = round(unitCost * quantity, 2)`, dan `referenceId = null`.

**Error Responses:**

- `404 Not Found`: `Inventory lot not found`
- `400 Bad Request`: Validasi gagal
