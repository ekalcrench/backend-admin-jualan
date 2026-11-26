# API Organization Users

Manajemen keanggotaan pengguna di dalam organisasi (`src/organization-user/organization-user.controller.ts`).

---

### Get Organization Users (Paginated)

**Endpoint:** `GET /api/organization-users`

**Deskripsi:**
Mengambil daftar anggota pada organisasi yang sedang aktif di JWT (`organizationId`).

**Authentication:** Required (Token dengan konteks `organizationId`)

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)`

**Query Parameters:**
Menggunakan `DefaultGetByPagesDto`:

- `page`, `size` (wajib)
- `sortBy` (wajib): `createdAt`, `-createdAt`, `name`, `-name`, `email`, `-email` (default `-createdAt`)
- `search` (opsional): mencari pada `user.name` atau `user.email`

**Response (`200 OK`):**

```json
{
  "items": [
    {
      "id": "333e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "organizationId": "111e8400-e29b-41d4-a716-446655440000",
      "name": "Budi",
      "email": "budi@example.com",
      "role": "ADMIN",
      "status": "APPROVED",
      "approvedAt": "2026-08-12T10:05:00.000Z",
      "approvedById": "660e8400-e29b-41d4-a716-446655440000",
      "approvedBy": "Owner Toko",
      "updatedById": "660e8400-e29b-41d4-a716-446655440000",
      "updatedBy": "Owner Toko",
      "createdAt": "2026-08-12T10:00:00.000Z",
      "updatedAt": "2026-08-12T10:05:00.000Z"
    }
  ],
  "pagination": { "page": 1, "size": 10, "total": 1, "totalPages": 1 }
}
```

---

### Get Organization User by ID

**Endpoint:** `GET /api/organization-users/:id`

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)`

**Path Parameters:** `id` (UUID `OrganizationUser`)

**Error Responses:** `404 Not Found` (`User not found`)

---

### Create Organization User

**Endpoint:** `POST /api/organization-users`

**Deskripsi:**
Menambahkan user yang sudah terdaftar di platform ke dalam organisasi aktif di JWT.

**Authentication:** Required (Token dengan `organizationId`)

**Authorization:** `@OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)`

**Request Body:**

| Field    | Type                     | Required | Validation                     | Description                                                           |
| -------- | ------------------------ | -------- | ------------------------------ | --------------------------------------------------------------------- |
| `userId` | string                   | Yes      | `@IsNotEmpty()`                | UUID User yang akan ditambahkan                                       |
| `role`   | `OrganizationUserRole`   | Yes      | `@IsString()`, `@IsNotEmpty()` | `OWNER`, `ADMIN`, atau `MEMBER`                                       |
| `status` | `OrganizationUserStatus` | Yes      | `@IsString()`, `@IsNotEmpty()` | Status awal (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `SUSPENDED`) |

**Error Responses:**

- `403 Forbidden`: `Organization context is required`
- `409 Conflict`: `User sudah terdaftar` (jika sudah ada di organisasi yang sama)

---

### Update Organization User

**Endpoint:** `PATCH /api/organization-users/:id`

**Deskripsi:**
Memperbarui `role`, `status`, atau `userId` keanggotaan organisasi.

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN)`

**Path Parameters:** `id` (UUID `OrganizationUser`)

**Error Responses:** `404 Not Found`

---

### Suspend Organization User

**Endpoint:** `POST /api/organization-users/:id/suspend`

**Deskripsi:**
Mengubah status anggota organisasi dari `APPROVED` menjadi `SUSPENDED`.

**Authentication:** Required

**Authorization:** `@OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)`

**Business Rules:**

- Hanya anggota berstatus `APPROVED` yang dapat disuspend. Jika bukan, mengembalikan `400 Bad Request` (`Status user tidak valid untuk disuspensi`).

---

### Activate Organization User

**Endpoint:** `POST /api/organization-users/:id/activate`

**Deskripsi:**
Mengaktifkan kembali anggota organisasi dari `SUSPENDED` menjadi `APPROVED`.

**Authentication:** Required

**Authorization:** `@OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)`

**Business Rules:**

- Hanya anggota berstatus `SUSPENDED` yang dapat diaktifkan. Jika bukan, mengembalikan `400 Bad Request` (`Status user tidak valid untuk diaktifkan`).

---

### Approve Organization User

**Endpoint:** `POST /api/organization-users/:id/approve`

**Deskripsi:**
Menyetujui anggota baru dari `PENDING_APPROVAL` menjadi `APPROVED` dan mencatat `approvedAt` serta `approvedById`.

**Authentication:** Required

**Authorization:** `@OrganizationRoles(OrganizationUserRole.OWNER)`

**Business Rules:**

- Hanya anggota berstatus `PENDING_APPROVAL` yang dapat di-approve. Jika bukan, mengembalikan `400 Bad Request` (`Status user tidak valid untuk disetujui`).
