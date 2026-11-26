# API Organizations

Manajemen tenant/organisasi (`src/organization/organization.controller.ts`).

---

### Get Organizations (Paginated)

**Endpoint:** `GET /api/organizations`

**Deskripsi:**
Mengambil daftar organisasi berhalaman beserta relasi `socialMedias`.

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)`

**Query Parameters:**
Menggunakan `DefaultGetByPagesDto`:

- `page`, `size` (wajib, `> 0`)
- `sortBy` (wajib): `createdAt`, `-createdAt`, `name`, `-name`, `email`, `-email`, `phone`, `-phone` (default `-createdAt`)
- `search` (opsional): mencari pada `name`, `email`, `address`, `phone`, `username`, dan `socialMedias.username`

**Response (`200 OK`):**

```json
{
  "items": [
    {
      "id": "111e8400-e29b-41d4-a716-446655440000",
      "name": "Soto Padang Uni Nurul",
      "username": "sotopadang_uninurul",
      "address": "Indramayu",
      "email": "info@sotopadang.id",
      "phone": "081234567890",
      "logoBase64": "data:image/png;base64,...",
      "createdAt": "2026-08-12T10:00:00.000Z",
      "updatedAt": "2026-08-12T10:00:00.000Z",
      "socialMedias": [
        {
          "id": "222e8400-e29b-41d4-a716-446655440000",
          "platform": "INSTAGRAM",
          "username": "sotopadang.id",
          "sortOrder": 0
        }
      ]
    }
  ],
  "pagination": { "page": 1, "size": 10, "total": 1, "totalPages": 1 }
}
```

---

### Get Organization by ID

**Endpoint:** `GET /api/organizations/:id`

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)`

**Path Parameters:** `id` (UUID Organization)

**Error Responses:** `404 Not Found` (`Organization not found`)

---

### Create Organization

**Endpoint:** `POST /api/organizations`

**Deskripsi:**
Membuat organisasi baru beserta daftar media sosial opsional.

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)`

**Request Body:**

| Field          | Type   | Required | Validation                                                  | Description                                                |
| -------------- | ------ | -------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| `name`         | string | Yes      | `@IsString()`, `@IsNotEmpty()`                              | Nama organisasi                                            |
| `username`     | string | No       | `@IsString()`, `@IsNotEmpty()`, `@MaxLength(30)`            | Username unik organisasi                                   |
| `address`      | string | Yes      | `@IsString()`, `@IsNotEmpty()`                              | Alamat organisasi                                          |
| `email`        | string | Yes      | `@IsEmail()`, `@IsNotEmpty()`                               | Email organisasi                                           |
| `phone`        | string | Yes      | `@IsString()`, `@IsNotEmpty()`                              | Nomor telepon                                              |
| `logoBase64`   | string | Yes      | `@IsString()`, `@IsNotEmpty()`, `@MaxLength(2097152)`       | Logo dalam Base64 (maks 2 MiB)                             |
| `socialMedias` | array  | No       | `@IsArray()`, `@ArrayUnique(platform)`, `@ValidateNested()` | Daftar media sosial (`platform`, `username`, `sortOrder?`) |

**Contoh Request:**

```json
{
  "name": "Soto Padang Uni Nurul",
  "username": "sotopadang_uninurul",
  "address": "Indramayu",
  "email": "info@sotopadang.id",
  "phone": "081234567890",
  "logoBase64": "data:image/png;base64,iVBORw0KGgo...",
  "socialMedias": [
    {
      "platform": "INSTAGRAM",
      "username": "sotopadang.id",
      "sortOrder": 0
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request`: Payload tidak valid atau `logoBase64` melebihi 2 MiB
- `409 Conflict`: `Organization username, social media username, or platform already exists.`

---

### Update Organization

**Endpoint:** `PATCH /api/organizations/:id`

**Deskripsi:**
Memperbarui data organisasi. Jika `socialMedias` dikirim, seluruh daftar media sosial lama organisasi akan dihapus (`deleteMany: {}`) dan diganti dengan array yang baru.

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)`

**Path Parameters:** `id` (UUID Organization)

**Request Body:** Sama seperti `CreateOrganizationDto`, seluruh field bersifat opsional.

**Error Responses:** `404 Not Found`, `400 Bad Request`, `409 Conflict`

---

### Delete Organization

**Endpoint:** `DELETE /api/organizations/:id`

**Authentication:** Required

**Authorization:** `@Roles(UserRole.SUPER_ADMIN)`

**Response (`200 OK`):** `true`

**Error Responses:** `404 Not Found` (`Organization not found`)
