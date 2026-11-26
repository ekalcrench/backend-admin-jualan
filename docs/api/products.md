# API Products

Manajemen master produk jual dan resep bahan baku (`src/product/product.controller.ts`).

---

### Get Products (Paginated)

**Endpoint:** `GET /api/products`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Query Parameters:**

- `page`, `size` (wajib)
- `sortBy` (wajib): `createdAt`, `-createdAt`, `name`, `-name`, `sellingPrice`, `-sellingPrice`, `isActive`, `-isActive` (default `-createdAt`)
- `search` (opsional): mencari pada `name`

**Business Rules:**

- Nilai `stock` pada response dihitung sesuai `stockManagement`:
  - `UNTRACKED` -> `null`
  - `MANUAL` -> `product.stock`
  - `INVENTORY` -> `MIN(FLOOR(totalRemainingStockBahan / ingredient.quantity))` (atau `0` jika tidak ada bahan)

---

### Get Product Options

**Endpoint:** `GET /api/products/options`

**Deskripsi:**
Mengambil daftar ringkas produk untuk kebutuhan POS/pembuatan order.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`

**Query Parameters:**

| Parameter    | Type    | Required | Default | Description                                                     |
| ------------ | ------- | -------- | ------- | --------------------------------------------------------------- |
| `activeOnly` | boolean | No       | `false` | Jika `true`, hanya mengembalikan produk dengan `isActive: true` |

---

### Get Lowest Stock Products

**Endpoint:** `GET /api/products/lowest-stocks`

**Deskripsi:**
Mengembalikan daftar produk (`{ name, stock }`) yang memiliki nilai stok paling rendah di organisasi (mengabaikan produk `UNTRACKED` yang bernilai `null`).

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

---

### Get Product by ID

**Endpoint:** `GET /api/products/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Error Responses:** `404 Not Found` (`Product not found`)

---

### Create Product

**Endpoint:** `POST /api/products`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Request Body:**

| Field                | Type                     | Required    | Default     | Description                                                                       |
| -------------------- | ------------------------ | ----------- | ----------- | --------------------------------------------------------------------------------- |
| `name`               | string                   | Yes         | -           | Nama produk (unik per organisasi)                                                 |
| `sellingPrice`       | number                   | Yes         | -           | Harga jual (`>= 0`, maks 2 desimal)                                               |
| `isActive`           | boolean                  | No          | `true`      | Status aktif produk                                                               |
| `stockManagement`    | `ProductStockManagement` | No          | `UNTRACKED` | `UNTRACKED`, `MANUAL`, atau `INVENTORY`                                           |
| `stock`              | integer                  | Conditional | `null`      | Wajib `>= 0` jika `stockManagement = MANUAL`; dilarang dikirim untuk mode lain    |
| `inventoryPolicy`    | `InventoryPolicy`        | No          | `STRICT`    | `STRICT` atau `ALLOW_NEGATIVE`                                                    |
| `productIngredients` | array                    | No          | `[]`        | Daftar bahan baku (`inventoryItemId`, `quantity > 0`), unik per `inventoryItemId` |

**Error Responses:**

- `400 Bad Request`: Validasi `stock` vs `stockManagement` gagal, atau `inventoryItemId` tidak aktif/bukan milik organisasi
- `409 Conflict`: `A product with this name already exists in this organization`

---

### Update Product

**Endpoint:** `PATCH /api/products/:id`

**Deskripsi:**
Memperbarui properti produk, menambah/mengubah `productIngredients`, dan menghapus bahan via `deletedProductIngredientIds`. Jika `stockManagement` diubah ke selain `MANUAL`, `stock` otomatis di-reset ke `null`.

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

---

### Delete Product

**Endpoint:** `DELETE /api/products/:id`

**Authentication:** Required (Organization Context)

**Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

**Business Rules:**

- Produk yang sudah pernah dipakai pada `OrderItem` tidak dapat dihapus (`409 Conflict`: `Produk tidak dapat dihapus karena sudah dipakai untuk transaksi`).
- Jika belum pernah dipesan, `ProductIngredient` dan `Product` dihapus fisik.
