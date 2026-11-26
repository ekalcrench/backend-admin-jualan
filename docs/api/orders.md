# API Orders

Manajemen transaksi penjualan (`DINE_IN`, `TAKEAWAY`, `DELIVERY`) serta analitik/overview penjualan (`src/order/order.controller.ts`). Seluruh endpoint pada modul ini memerlukan `@OrganizationRoles(OWNER, ADMIN)`.

---

### Get Orders (Paginated)

**Endpoint:** `GET /api/orders`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Query Parameters:**

- `page`, `size` (wajib)
- `sortBy` (wajib): `orderNumber`, `-orderNumber`, `totalAmount`, `-totalAmount`, `totalQuantity`, `-totalQuantity`, `createdAt`, `-createdAt` (default `-createdAt`)
- `search` (opsional): mencari pada `orderNumber` dan `items[].product.name`
- `startDate`, `endDate` (opsional, format date): filter `createdAt` (`endDate` inklusif hingga akhir hari UTC)

**Error Responses:** `400 Bad Request` (`startDate must be before or equal to endDate`)

---

### Get Order Overview

**Endpoint:** `GET /api/orders/overview`

**Deskripsi:**
Mengembalikan ringkasan total omzet (`totalAmount`), total kuantitas (`totalQuantity`), dan laba kotor (`totalGrossProfit`) untuk order berstatus `PAID`, beserta perbandingan periode sebelumnya.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Query Parameters:** `startDate`, `endDate` (opsional, **harus dikirim berpasangan** jika salah satu diisi).

**Business Rules:**

- Hanya menghitung order dengan `status = PAID`.
- Jika ada item berstatus `costingStatus = UNKNOWN` pada periode tersebut, `totalGrossProfit` (atau `prevTotalGrossProfit`) bernilai `null`.

**Response (`200 OK`):**

```json
{
  "totalAmount": 500000,
  "totalQuantity": 20,
  "totalGrossProfit": 220000,
  "prevTotalAmount": 400000,
  "prevTotalQuantity": 16,
  "prevTotalGrossProfit": 180000
}
```

---

### Get Order Overview Items

**Endpoint:** `GET /api/orders/overview-items`

**Deskripsi:**
Mengembalikan produk paling laris (`mostSellItems*`) dan paling sedikit terjual (`leastSellItems*`) berdasarkan `OrderItem` pada rentang tanggal opsional.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Query Parameters:** `startDate`, `endDate` (opsional)

---

### Get Order by ID

**Endpoint:** `GET /api/orders/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Error Responses:** `404 Not Found` (`Order not found`)

---

### Create Order

**Endpoint:** `POST /api/orders`

**Deskripsi:**
Membuat order baru berstatus `UNPAID` dalam satu transaksi `Serializable`. Harga produk, harga modifier, HPP (`unitCost`), serta pemotongan stok (`MANUAL` maupun `INVENTORY` FIFO) langsung diproses saat pembuatan order.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Request Body:**

| Field           | Type          | Required    | Description                                                                                       |
| --------------- | ------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `type`          | `OrderType`   | Yes         | `DELIVERY`, `TAKEAWAY`, atau `DINE_IN`                                                            |
| `orderNumber`   | string        | Yes         | Nomor order (unik per organisasi)                                                                 |
| `customerId`    | string (UUID) | No          | ID `User` pelanggan                                                                               |
| `deliveryOrder` | object        | Conditional | Wajib jika `type = DELIVERY` (`deliveryFee`, `name`, `address`, `phone`, `latitude`, `longitude`) |
| `takeawayOrder` | object        | Conditional | Wajib jika `type = TAKEAWAY` (`name`, `phone?`, `pickUpTime?`)                                    |
| `dineInOrder`   | object        | Conditional | Wajib jika `type = DINE_IN` (`tableId`, `name?`, `guestCount?`)                                   |
| `orderItems`    | array         | Yes         | Minimal 1 item (`productId`, `quantity >= 1`, `modifierOptionIds?`)                               |

**Contoh Request (`DINE_IN`):**

```json
{
  "type": "DINE_IN",
  "orderNumber": "ORD-20260812-001",
  "dineInOrder": {
    "tableId": "444e8400-e29b-41d4-a716-446655440000",
    "name": "Meja 1",
    "guestCount": 2
  },
  "orderItems": [
    {
      "productId": "555e8400-e29b-41d4-a716-446655440000",
      "quantity": 2,
      "modifierOptionIds": ["666e8400-e29b-41d4-a716-446655440000"]
    }
  ]
}
```

**Business Rules:**

- `cashierId` otomatis diambil dari `jwt.sub`.
- Produk dan opsi modifier harus `isActive: true` serta memenuhi aturan `isRequired`, `minSelection`, `maxSelection`, `isMultiple`.
- Untuk `DINE_IN`, `table` harus ada di organisasi dan `guestCount <= table.capacity`.
- Untuk `DELIVERY`, `deliveryFee` disimpan pada `delivery_orders`, tetapi `Order.totalAmount` hanya menjumlahkan `orderItems` (`(unitPrice + modifierTotal) * quantity`).
- Stok dipotong langsung saat order dibuat (`inventoryDeducted = true`).

**Error Responses:**

- `400 Bad Request`: Detail tipe order tidak cocok, validasi modifier gagal, atau `guestCount > table.capacity`
- `404 Not Found`: Produk, customer, atau meja tidak ditemukan
- `409 Conflict`: Nomor order duplikat atau stok tidak mencukupi (`STRICT`)

---

### Mark Order as Paid

**Endpoint:** `POST /api/orders/:id/mark-paid`

**Deskripsi:**
Mengubah status order dari `UNPAID` menjadi `PAID` dan mencatat pemasukan kas (`CashTransaction` bertipe `SALE`, `amount: order.totalAmount`, `referenceId: order.id`).

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Business Rules:**

- Jika `inventoryDeducted` sudah `true` (perilaku standar saat `create`), tidak memotong stok lagi.
- Order yang sudah `PAID` mengembalikan `409 Conflict` (`Order is already paid`).

---

### Update Unpaid Order

**Endpoint:** `PATCH /api/orders/:id`

**Deskripsi:**
Memperbarui order yang masih berstatus `UNPAID`. Jika ada perubahan item (`orderItems` atau `deletedOrderItemIds`), sistem mengembalikan stok lama (`RETURN` untuk lot inventori & restore stok manual), lalu menerapkan ulang kebutuhan stok terbaru secara atomik.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Error Responses:**

- `409 Conflict`: `Paid orders cannot be updated` atau stok tidak mencukupi
- `404 Not Found`: Order atau order item tidak ditemukan

---

### Delete Unpaid Order

**Endpoint:** `DELETE /api/orders/:id`

**Deskripsi:**
Menghapus order berstatus `UNPAID`, mengembalikan stok manual produk dan stok lot inventori (dicatat sebagai transaksi `RETURN`), serta menghapus detail tipe order (`DineInOrder`/`TakeawayOrder`/`DeliveryOrder`).

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Response (`200 OK`):** `true`

**Error Responses:**

- `409 Conflict`: `Paid orders cannot be deleted`
- `404 Not Found`: `Order not found`
