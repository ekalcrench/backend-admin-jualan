# API Auth

Endpoint autentikasi, registrasi, verifikasi email OTP, pemilihan konteks organisasi, dan pencabutan token.

---

### Login Platform

**Endpoint:** `POST /api/auth/login`

**Deskripsi:**
Memverifikasi email dan password pengguna, lalu mengembalikan profil user beserta JWT platform berdurasi 1 jam (belum memiliki konteks `organizationId`).

**Authentication:** Public (`@Public()`)

**Authorization:** Semua pengguna

**Request Body:**

| Field      | Type   | Required | Validation                     | Description              |
| ---------- | ------ | -------- | ------------------------------ | ------------------------ |
| `email`    | string | Yes      | `@IsEmail()`, `@IsNotEmpty()`  | Email pengguna terdaftar |
| `password` | string | Yes      | `@IsString()`, `@IsNotEmpty()` | Password plaintext       |

**Contoh Request:**

```json
{
  "email": "owner@example.com",
  "password": "secretPassword123"
}
```

**Business Rules:**

- Password diverifikasi menggunakan `argon2.verify`.
- Token yang diterbitkan berlaku selama `1h` dengan `organization_roles: []` dan tanpa `organizationId`.
- _(Catatan: Implementasi saat ini tidak memeriksa `user.status` dan mengembalikan objek `user` termasuk field `password` dari repository.)_

**Response (`200 OK`):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "owner@example.com",
    "name": "Budi",
    "emailVerifiedAt": "2026-08-12T10:00:00.000Z",
    "status": "ACTIVE",
    "role": "USER",
    "createdAt": "2026-08-12T09:50:00.000Z",
    "updatedAt": "2026-08-12T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

- `404 Not Found`: `Email belum terdaftar`
- `401 Unauthorized`: `Password tidak valid`
- `400 Bad Request`: Payload tidak valid

---

### Login Organization (Pilih Tenant)

**Endpoint:** `POST /api/auth/login/organization`

**Deskripsi:**
Memilih organisasi yang akan diakses dan menerbitkan `accessToken` baru berdurasi 1 hari yang berisi `organizationId` dan `organization_roles`. Token sebelumnya otomatis dicabut.

**Authentication:** Required (Bearer JWT)

**Authorization:** Semua user terautentikasi yang menjadi anggota `APPROVED` pada organisasi tujuan

**Request Body:**

| Field            | Type   | Required | Validation                   | Description            |
| ---------------- | ------ | -------- | ---------------------------- | ---------------------- |
| `organizationId` | string | Yes      | `@IsUUID()`, `@IsNotEmpty()` | UUID organisasi tujuan |

**Contoh Request:**

```json
{
  "organizationId": "111e8400-e29b-41d4-a716-446655440000"
}
```

**Business Rules:**

- Memeriksa keanggotaan user pada `organization_users` untuk `organizationId` tersebut.
- Status keanggotaan harus `APPROVED`.
- Memanggil `logout()` untuk mencatat `jwt_id` token lama ke tabel `revoked_tokens`.
- Menerbitkan JWT baru dengan klaim `organizationId` dan `organization_roles: [membership.role]`.

**Response (`200 OK`):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

- `401 Unauthorized`: Token tidak ada / tidak valid / sudah di-revoke
- `404 Not Found`: `User not found`
- `403 Forbidden`: User belum terdaftar di organisasi atau status keanggotaan bukan `APPROVED`

---

### Logout

**Endpoint:** `POST /api/auth/logout`

**Deskripsi:**
Mencabut access token yang sedang digunakan dengan menyimpan `jwt_id` ke tabel `revoked_tokens`.

**Authentication:** Required (Bearer JWT)

**Authorization:** Semua user terautentikasi

**Response (`200 OK`):**

```json
true
```

**Efek Database:** Menambahkan 1 record ke `revoked_tokens`.

---

### Register

**Endpoint:** `POST /api/auth/register`

**Deskripsi:**
Mendaftarkan akun pengguna baru dengan status `PENDING_EMAIL` dan mengirimkan kode OTP 6 digit ke email via Resend.

**Authentication:** Public (`@Public()`)

**Authorization:** Publik

**Request Body:**

| Field      | Type   | Required | Validation                     | Description       |
| ---------- | ------ | -------- | ------------------------------ | ----------------- |
| `email`    | string | Yes      | `@IsEmail()`, `@IsNotEmpty()`  | Alamat email unik |
| `password` | string | Yes      | `@IsString()`, `@IsNotEmpty()` | Password akun     |
| `name`     | string | Yes      | `@IsString()`, `@IsNotEmpty()` | Nama lengkap      |

**Business Rules:**

- Jika email sudah terdaftar dengan status `PENDING_EMAIL`, sistem otomatis memanggil `resendOtp` dan mengembalikan profil user tanpa membuat user baru.
- Jika email sudah terdaftar dengan status selain `PENDING_EMAIL`, mengembalikan `409 Conflict` (`Email sudah terdaftar`).
- Password dan OTP di-hash menggunakan `argon2`. OTP berlaku 10 menit.

**Response (`201 Created`):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "Siti",
  "emailVerifiedAt": null,
  "status": "PENDING_EMAIL",
  "role": "USER",
  "createdAt": "2026-08-12T10:00:00.000Z",
  "updatedAt": "2026-08-12T10:00:00.000Z"
}
```

---

### Check Registration Verification

**Endpoint:** `GET /api/auth/register/verify`

**Deskripsi:**
Memeriksa status verifikasi pendaftaran email dan kapan OTP baru boleh dikirim ulang (`otpValidResendTime`).

**Authentication:** Public (`@Public()`)

**Query Parameters:**

| Parameter | Type   | Required | Description                               |
| --------- | ------ | -------- | ----------------------------------------- |
| `email`   | string | Yes      | Email yang sedang dalam proses verifikasi |

**Response (`200 OK`):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Siti",
    "emailVerifiedAt": null,
    "status": "PENDING_EMAIL",
    "role": "USER",
    "createdAt": "2026-08-12T10:00:00.000Z",
    "updatedAt": "2026-08-12T10:00:00.000Z"
  },
  "otpValidResendTime": "2026-08-12T10:01:00.000Z"
}
```

**Error Responses:**

- `404 Not Found`: `User not found`
- `400 Bad Request`: `Email sudah terdaftar` (jika status bukan `PENDING_EMAIL`) atau record OTP tidak ditemukan

---

### Verify Registration OTP

**Endpoint:** `PUT /api/auth/register/verify`

**Deskripsi:**
Memverifikasi kode OTP 6 digit dan mengaktifkan akun pengguna (`status` menjadi `ACTIVE`, `emailVerifiedAt` diisi).

**Authentication:** Public (`@Public()`)

**Request Body:**

| Field   | Type   | Required | Validation                                      | Description      |
| ------- | ------ | -------- | ----------------------------------------------- | ---------------- |
| `email` | string | Yes      | `@IsEmail()`, `@IsNotEmpty()`                   | Email pendaftar  |
| `code`  | string | Yes      | `@IsString()`, `@IsNotEmpty()`, `@Length(6, 6)` | Kode OTP 6 digit |

**Business Rules:**

- Memeriksa kadaluarsa OTP (`expiresAt >= now`).
- Memeriksa batas percobaan (`attempts <= 5`). Jika salah, `attempts` bertambah 1 dan melempar `400 Bad Request`.
- Jika valid, mengubah `User.status` menjadi `ACTIVE` dan mengisi `emailVerifiedAt`.

**Response (`200 OK`):** Mengembalikan objek `User` tanpa `password`.

---

### Resend OTP

**Endpoint:** `POST /api/auth/resend-otp`

**Deskripsi:**
Mengirim ulang kode OTP baru ke email pendaftar yang masih berstatus `PENDING_EMAIL`.

**Authentication:** Public (`@Public()`)

**Request Body:**

| Field   | Type   | Required | Validation                    | Description     |
| ------- | ------ | -------- | ----------------------------- | --------------- |
| `email` | string | Yes      | `@IsEmail()`, `@IsNotEmpty()` | Email pendaftar |

**Business Rules:**

- Hanya diperbolehkan jika waktu saat ini `>= lastSentAt + 60 detik`.
- Menghasilkan OTP 6 digit baru, mereset `attempts` ke `0`, dan memperpanjang `expiresAt` 10 menit ke depan.

**Response (`201 Created`):** Mengembalikan `{ user, otpValidResendTime }`.

**Error Responses:**

- `400 Bad Request`: `Resend OTP is not allowed yet` atau status user bukan `PENDING_EMAIL`
- `404 Not Found`: `User not found`
