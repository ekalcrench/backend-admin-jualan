# API Cash Transactions

Manajemen buku kas, saldo kas, arus kas, serta pencatatan transaksi kas manual (`INVESTMENT` & `PROFIT_SHARING`) pada `src/cash-transaction/cash-transaction.controller.ts`.

---

### Get Cash Transactions (Paginated)

**Endpoint:** `GET /api/cash-transactions`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Query Parameters:**

- `page`, `size` (wajib)
- `sortBy` (wajib): `transactionAt`, `-transactionAt`, `amount`, `-amount`, `createdAt`, `-createdAt` (default `-transactionAt`)
- `search` (opsional): mencari pada `description`
- `startDate`, `endDate` (opsional, format date): filter `transactionAt`

---

### Get Organization Cash Balance

**Endpoint:** `GET /api/cash-transactions/balance`

**Deskripsi:**
Menghitung saldo kas kumulatif organisasi hingga `endDate` (jika dikirim).

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Query Parameters:** `endDate` (opsional, format date)

**Business Rules:**

- `balance = (SUM(SALE) + SUM(INVESTMENT)) - (SUM(PURCHASE) + SUM(PROFIT_SHARING))`

**Response (`200 OK`):**

```json
{
  "balance": 3500000
}
```

---

### Get Organization Cash Flow

**Endpoint:** `GET /api/cash-transactions/cash-flow`

**Deskripsi:**
Mengembalikan total kas masuk (`cashIn`), kas keluar (`cashOut`), dan perbandingan periode sebelumnya (`prevCashIn`, `prevCashOut`).

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Query Parameters:** `startDate`, `endDate` (opsional)

**Business Rules:**

- `cashIn` = `SALE` + `INVESTMENT`
- `cashOut` = `PURCHASE` + `PROFIT_SHARING`

**Response (`200 OK`):**

```json
{
  "cashIn": 1500000,
  "cashOut": 600000,
  "prevCashIn": 1200000,
  "prevCashOut": 500000
}
```

---

### Get Cash Transaction by ID

**Endpoint:** `GET /api/cash-transactions/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Error Responses:** `404 Not Found` (`Cash transaction not found`)

---

### Create Manual Cash Transaction

**Endpoint:** `POST /api/cash-transactions`

**Deskripsi:**
Mencatat transaksi kas manual. Hanya diperbolehkan untuk tipe `INVESTMENT` dan `PROFIT_SHARING` (tipe `SALE` dan `PURCHASE` hanya dibuat otomatis oleh sistem).

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Request Body:**

| Field           | Type                  | Required | Validation                                        | Description                              |
| --------------- | --------------------- | -------- | ------------------------------------------------- | ---------------------------------------- |
| `type`          | `CashTransactionType` | Yes      | `@IsIn(['INVESTMENT', 'PROFIT_SHARING'])`         | Jenis transaksi manual                   |
| `amount`        | number                | Yes      | `0.01 <= val <= 9999999999999.99`, maks 2 desimal | Nominal kas                              |
| `description`   | string \| null        | No       | `@IsString()`                                     | Keterangan transaksi                     |
| `transactionAt` | string                | No       | `@IsDateString()`                                 | Waktu transaksi (default waktu saat ini) |

---

### Update Manual Cash Transaction

**Endpoint:** `PATCH /api/cash-transactions/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Business Rules:**

- Hanya record bertipe `INVESTMENT` atau `PROFIT_SHARING` yang dapat diubah; jika record adalah `SALE` atau `PURCHASE`, mengembalikan `403 Forbidden`.
- Minimal 1 field harus dikirim (`400 Bad Request` jika body kosong).

---

### Delete Manual Cash Transaction

**Endpoint:** `DELETE /api/cash-transactions/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Business Rules:**

- Hanya record bertipe `INVESTMENT` atau `PROFIT_SHARING` yang dapat dihapus (`SALE`/`PURCHASE` -> `403 Forbidden`).

**Response (`200 OK`):** `true`
