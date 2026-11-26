# API Product Modifiers

Manajemen grup modifier, opsi modifier, dan assignment grup modifier ke produk. Terdiri dari 3 controller:

1. `ProductModifierGroupController` (`/api/product-modifier-groups`)
2. `ProductModifierOptionController` (`/api/product-modifier-options`)
3. `ProductModifierAssignmentController` (`/api/products/:productId/modifier-groups`)

---

## A. Modifier Groups (`/api/product-modifier-groups`)

### Get Modifier Groups (Paginated)

- **Endpoint:** `GET /api/product-modifier-groups`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`
- **Query Parameters:** `DefaultGetByPagesDto` (`page`, `size`, `sortBy`, `search` pada `name` / `description`)

### Get Modifier Group Detail

- **Endpoint:** `GET /api/product-modifier-groups/:id`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`
- **Response:** Detail grup beserta array `options` dan `products` yang ter-assign.

### Create Modifier Group

- **Endpoint:** `POST /api/product-modifier-groups`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Request Body:** `name` (wajib), `description?`, `isRequired?` (`false`), `minSelection?` (`0`), `maxSelection?` (`1`), `isMultiple?` (`false`), `isActive?` (`true`), `sortOrder?` (`0`).
- **Business Rules (Selection Rules):**
  - `minSelection >= 0` dan `maxSelection >= minSelection`.
  - Jika `isRequired = true`, maka `minSelection >= 1`.
  - Jika `isMultiple = false`, maka `maxSelection <= 1`.

### Update Modifier Group

- **Endpoint:** `PATCH /api/product-modifier-groups/:id`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Business Rules:** Memvalidasi ulang kombinasi selection rules efektif (`dto` digabung dengan nilai eksisting).

### Set Modifier Group Active Status

- **Endpoint:** `PATCH /api/product-modifier-groups/:id/status`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Request Body:** `{ "isActive": boolean }`

### Delete Modifier Group

- **Endpoint:** `DELETE /api/product-modifier-groups/:id`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Business Rules:** Jika grup masih ter-assign ke produk (`productMappings > 0`), grup **tidak dihapus fisik** melainkan di-nonaktifkan (`isActive = false`) agar mapping tetap utuh. Jika tidak ada mapping, dihapus fisik.

---

## B. Modifier Options (`/api/product-modifier-groups/:id/options` & `/api/product-modifier-options`)

### Create Modifier Option

- **Endpoint:** `POST /api/product-modifier-groups/:id/options`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Request Body:**
  - `name` (wajib, unik dalam grup)
  - `description?`
  - `price?` (default `0`, `>= 0`)
  - `inventoryItemId?` & `inventoryQuantity?` (harus diisi berpasangan; `inventoryQuantity > 0`)
  - `trackInventory?` (default `false`; jika `true`, `inventoryItemId` wajib ada)
  - `inventoryPolicy?` (default `STRICT`)
  - `isActive?` (`true`), `sortOrder?` (`0`)

### Reorder Options in Group

- **Endpoint:** `PATCH /api/product-modifier-groups/:id/options/reorder`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Request Body:** `{ "optionIds": string[] }` — harus memuat **seluruh** ID opsi yang ada di grup tanpa duplikat.

### Update Modifier Option

- **Endpoint:** `PATCH /api/product-modifier-options/:id`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Business Rules:** Mengirim `inventoryItemId: null` akan menghapus keterkaitan inventori (`inventoryItemId = null`, `inventoryQuantity = null`).

### Set Modifier Option Active Status

- **Endpoint:** `PATCH /api/product-modifier-options/:id/status`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Request Body:** `{ "isActive": boolean }`

### Delete Modifier Option

- **Endpoint:** `DELETE /api/product-modifier-options/:id`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`

---

## C. Product Modifier Assignments (`/api/products/:productId/modifier-groups`)

### Get Assigned Modifier Groups for Product

- **Endpoint:** `GET /api/products/:productId/modifier-groups`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN, MEMBER)`
- **Query Parameters:** `activeOnly` (boolean, opsional, default `false` — jika `true`, hanya mengembalikan grup & opsi yang `isActive: true`).

### Replace Assigned Modifier Groups

- **Endpoint:** `PUT /api/products/:productId/modifier-groups`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Request Body:** `{ "modifierGroupIds": string[] }` — mengganti seluruh daftar grup modifier produk sesuai urutan array.

### Reorder Assigned Modifier Groups

- **Endpoint:** `PATCH /api/products/:productId/modifier-groups/reorder`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
- **Request Body:** `{ "modifierGroupIds": string[] }` — harus cocok persis dengan himpunan grup yang saat ini ter-assign ke produk.

### Remove Modifier Group from Product

- **Endpoint:** `DELETE /api/products/:productId/modifier-groups/:modifierGroupId`
- **Authorization:** `@OrganizationRoles(OWNER, ADMIN)`
