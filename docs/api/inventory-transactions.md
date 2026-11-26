# API Inventory Transactions

Riwayat ledger pergerakan stok inventori (`src/inventory-transaction/inventory-transaction.controller.ts`). Endpoint ini bersifat read-only; pencatatan dilakukan otomatis oleh modul `Purchase`, `Preparation`, `Order`, dan `InventoryLot`.

---

### Get Inventory Transactions (Paginated)

**Endpoint:** `GET /api/inventory-transactions`

**Deskripsi:**
Mengambil daftar transaksi mutasi stok milik organisasi.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Query Parameters:**

- `page`, `size` (wajib)
- `sortBy` (wajib): `quantity`, `-quantity`, `type`, `-type`, `unitCost`, `-unitCost`, `totalCost`, `-totalCost`, `createdAt`, `-createdAt` (default `-createdAt`)
- `search` (opsional): mencari berdasarkan `inventoryItem.name` (case-insensitive)

**Response (`200 OK`):**

```json
{
  "items": [
    {
      "id": "ddd8400-e29b-41d4-a716-446655440000",
      "organizationId": "111e8400-e29b-41d4-a716-446655440000",
      "inventoryItemId": "aaa8400-e29b-41d4-a716-446655440000",
      "inventoryLotId": "bbb8400-e29b-41d4-a716-446655440000",
      "type": "PURCHASE",
      "referenceId": "eee8400-e29b-41d4-a716-446655440000",
      "quantity": 6000,
      "unitCost": 15,
      "totalCost": 90000,
      "createdAt": "2026-08-12T08:05:00.000Z",
      "inventoryItem": {
        "id": "aaa8400-e29b-41d4-a716-446655440000",
        "name": "Beras",
        "unit": "GRAM"
      },
      "inventoryLot": {
        "id": "bbb8400-e29b-41d4-a716-446655440000",
        "receivedAt": "2026-08-12T08:00:00.000Z",
        "expiredAt": null
      }
    }
  ],
  "pagination": { "page": 1, "size": 10, "total": 1, "totalPages": 1 }
}
```
