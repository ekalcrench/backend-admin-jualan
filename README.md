# Backend Admin Jualan

Layanan backend API untuk aplikasi **Admin Jualan** yang menangani autentikasi, manajemen organisasi (multi-tenant), inventori, pembelian, produksi/preparation, produk & modifier, transaksi penjualan (POS), serta pencatatan arus kas.

## Teknologi Utama

- **Runtime & Bahasa:** Node.js, TypeScript
- **Framework:** NestJS (`@nestjs/core`, `@nestjs/platform-express`)
- **Database & ORM:** PostgreSQL, Prisma ORM (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **Autentikasi & Keamanan:** JWT (`@nestjs/jwt`), Argon2 (`argon2`)
- **Validasi & Dokumentasi API:** `class-validator`, `class-transformer`, `@nestjs/swagger`
- **Email Transaksional:** Resend (`resend`)

## Prerequisites

Pastikan environment lokal sudah terpasang:

- **Node.js** (disarankan v24.x, sesuai `Dockerfile` yang menggunakan `24.18.0-alpine`)
- **npm** (bawaan Node.js)
- **PostgreSQL** (lokal atau instance terkelola yang dapat diakses melalui `DATABASE_URL`)

## Install Dependencies

```bash
npm install
```

Atau untuk instalasi deterministik sesuai `package-lock.json`:

```bash
npm ci
```

## Konfigurasi Environment Variables

File `.env.example` belum tersedia di root project. Buat file `.env` di root project dan isi dengan variabel berikut (gunakan nilai placeholder sesuai environment lokal Anda):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?schema=public"
JWT_SECRET="your-jwt-secret-key"
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="noreply@example.com"
PORT=8080
```

Keterangan variabel:
- `DATABASE_URL`: Connection string PostgreSQL untuk Prisma (`prisma.config.ts` dan `PrismaService`).
- `JWT_SECRET`: Secret key untuk menandatangani dan memverifikasi access token JWT.
- `RESEND_API_KEY`: API key Resend untuk pengiriman email OTP verifikasi.
- `RESEND_FROM_EMAIL` (atau `RESEND_FROM`): Alamat email pengirim OTP.
- `PORT`: Opsional; port HTTP server (default `8080`).

## Database & Migration

Pastikan service PostgreSQL sudah berjalan dan `DATABASE_URL` telah dikonfigurasi.

Untuk menjalankan migrasi pada environment **development**:

```bash
npm run prisma:migrate
```

Untuk menerapkan migrasi pada environment **production / staging**:

```bash
npm run prisma:deploy
```

*(Opsional)* Membuka Prisma Studio untuk inspeksi data:

```bash
npm run prisma:studio
```

## Prisma Generate

Generate Prisma Client ke `prisma/generated/prisma` (wajib dijalankan setelah instalasi pertama atau perubahan file schema di `prisma/schema/`):

```bash
npm run prisma:generate
```

## Menjalankan Aplikasi (Development Mode)

```bash
npm run start:dev
```

Aplikasi berjalan dengan watch mode di `http://localhost:8080` (atau sesuai `PORT`).

## Production Build

Perintah `build` otomatis menjalankan `prebuild` (`prisma generate`), lalu mengompilasi TypeScript dan alias path ke folder `dist/`:

```bash
npm run build
```

## Menjalankan Aplikasi (Production Mode)

Setelah proses build selesai:

```bash
npm run start:prod
```

## Informasi Tambahan

- **Global Prefix & Swagger UI:** Seluruh endpoint API menggunakan prefix `/api` (kecuali file statis pada `/uploads/*`). Swagger UI dapat diakses di `http://localhost:8080/api`.
- **Docker:** Proyek menyertakan `Dockerfile` yang menjalankan `npm ci`, `npx prisma generate`, `npm run build`, serta `npx prisma migrate deploy && npm run start:prod` pada port `8080`.
- **Perintah Lainnya (`package.json`):**
  - `npm run start` — Menjalankan aplikasi tanpa watch mode.
  - `npm run test` — Menjalankan unit test (Jest).
  - `npm run test:e2e` — Menjalankan end-to-end test.
  - `npm run lint` — Menjalankan ESLint dengan auto-fix.
  - `npm run format` — Memformat kode dengan Prettier.

## Documentation

Untuk memahami arsitektur backend, API, struktur database, Prisma Model, dan business logic, silakan baca [Dokumentasi Backend](./docs/README.md).
