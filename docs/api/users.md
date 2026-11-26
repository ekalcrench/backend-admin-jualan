# API Users

Manajemen pengguna di level platform (`src/user/user.controller.ts`).

---

### Get Users (Paginated)

**Endpoint:** `GET /api/users`

**Deskripsi:**
Mengambil daftar pengguna secara berhalaman beserta pencarian dan pengurutan.

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)`

**Query Parameters:**

| Parameter | Type         | Required | Description                                                                          |
| --------- | ------------ | -------- | ------------------------------------------------------------------------------------ |
| `page`    | number       | Yes      | Halaman (`> 0`)                                                                      |
| `size`    | number       | Yes      | Jumlah per halaman (`> 0`)                                                           |
| `sortBy`  | string       | Yes      | `createdAt`, `-createdAt`, `name`, `-name`, `email`, `-email` (default `-createdAt`) |
| `search`  | string       | No       | Pencarian berdasarkan `name` atau `email`                                            |
| `role`    | `UserRole`   | No       | Filter role (`USER`, `ADMIN`, `SUPER_ADMIN`)                                         |
| `status`  | `UserStatus` | No       | Filter status (`PENDING_EMAIL`, `ACTIVE`, `SUSPENDED`)                               |

> [!NOTE]
> **Catatan Teknis (Perlu Dikonfirmasi):** Pada `UserRepository.findByPages`, filter `role` dan `status` hanya diterapkan di klausa `where` apabila `search` juga diisi; jika `search` kosong, `where` menjadi `{}`. Selain itu, item yang dikembalikan tidak melalui `toResponse()` sehingga field `password` ikut terbawa di `items`.

**Response (`200 OK`):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "Budi",
      "emailVerifiedAt": "2026-08-12T10:00:00.000Z",
      "status": "ACTIVE",
      "role": "USER",
      "createdAt": "2026-08-12T09:50:00.000Z",
      "updatedAt": "2026-08-12T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "size": 10, "total": 1, "totalPages": 1 }
}
```

---

### Get User Options

**Endpoint:** `GET /api/users/options`

**Deskripsi:**
Mengambil daftar ringkas user (`id`, `name`, `email`) untuk kebutuhan dropdown/select (mis. saat menambah user ke organisasi).

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)`

**Query Parameters:**

| Parameter | Type   | Required | Description                                   |
| --------- | ------ | -------- | --------------------------------------------- |
| `search`  | string | No       | Filter `name` atau `email` (case-insensitive) |

**Response (`200 OK`):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Budi",
    "email": "budi@example.com"
  }
]
```

---

### Get User by ID

**Endpoint:** `GET /api/users/:id`

**Deskripsi:**
Mengambil detail satu pengguna berdasarkan UUID (tanpa field `password`).

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)`

**Path Parameters:** `id` (UUID User)

**Response (`200 OK`):** Objek user tanpa `password`.

**Error Responses:** `404 Not Found` (`User not found`)

---

### Get Organizations Linked to User

**Endpoint:** `GET /api/users/:id/organizations`

**Deskripsi:**
Mengambil daftar organisasi di mana user menjadi anggota, beserta `role` dan `status` keanggotaannya.

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)`

**Path Parameters:** `id` (UUID User)

**Response (`200 OK`):**

```json
[
  {
    "id": "111e8400-e29b-41d4-a716-446655440000",
    "name": "Soto Padang Uni Nurul",
    "logoBase64": "data:image/png;base64,...",
    "role": "OWNER",
    "status": "APPROVED"
  }
]
```

---

### Update User

**Endpoint:** `PATCH /api/users/:id`

**Deskripsi:**
Memperbarui data user (`email`, `password`, `name`, `role`).

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN)`

**Path Parameters:** `id` (UUID User)

**Request Body:** Semua field opsional (`email`, `password`, `name`, `role`).

> [!NOTE]
> **Catatan Teknis:** Jika `password` dikirim pada `PATCH /api/users/:id`, `UserService.update` langsung meneruskan `dto` ke repository tanpa melakukan hashing `argon2`.

**Error Responses:**

- `404 Not Found`: `User not found`
- `409 Conflict`: `Email already exists`

---

### Suspend User

**Endpoint:** `POST /api/users/:id/suspend`

**Deskripsi:**
Mengubah status user menjadi `SUSPENDED`.

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN)`

**Response (`200 OK`):** Objek user dengan `status: "SUSPENDED"`.

---

### Activate User

**Endpoint:** `POST /api/users/:id/activate`

**Deskripsi:**
Mengubah status user menjadi `ACTIVE`.

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)`

**Response (`200 OK`):** Objek user dengan `status: "ACTIVE"`.
