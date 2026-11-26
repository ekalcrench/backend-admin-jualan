# Dokumentasi Backend Admin Jualan

Selamat datang di dokumentasi teknis backend **Admin Jualan**. Dokumentasi ini disusun berdasarkan implementasi aktual source code (NestJS + Prisma ORM + PostgreSQL) agar developer dapat memahami arsitektur, struktur database, kontrak API, serta business logic tanpa harus menelusuri seluruh source code dari awal.

---

## Struktur Dokumentasi

### 1. Fondasi Sistem

- **[Arsitektur Aplikasi](./architecture.md)** — Stack teknologi, arsitektur layer (Controller-Service-Repository), struktur folder, multi-tenancy, dan environment variables.
- **[Database & Prisma Schema](./database.md)** — Diagram ERD, seluruh 26 model Prisma beserta deskripsi setiap field, relasi, index/constraint, dan seluruh 16 enum.
- **[Authentication & Authorization](./authentication-authorization.md)** — Alur JWT, verifikasi OTP email, token revocation, global guards, serta matriks role platform dan organisasi.
- **[Inventory & Product Costing (Referensi Teknis)](./inventory-costing.md)** — Spesifikasi detail mode stok (`UNTRACKED`, `MANUAL`, `INVENTORY`), alokasi FIFO, shortage lot, dan costing HPP.

### 2. Dokumentasi REST API (`docs/api/`)

- **[Ringkasan & Konvensi API](./api/README.md)** — Global prefix `/api`, Swagger UI, pagination, dan validasi global.
- **[Auth](./api/auth.md)** — Login, pilih organisasi, logout, register, verifikasi & resend OTP.
- **[Users](./api/users.md)** — Manajemen user level platform.
- **[Organizations](./api/organizations.md)** — Manajemen tenant/organisasi & media sosial.
- **[Organization Users](./api/organization-users.md)** — Keanggotaan user dalam organisasi & approval.
- **[Inventory Items](./api/inventory-items.md)** — Master bahan baku, opsi, & total nilai aset.
- **[Inventory Lots](./api/inventory-lots.md)** — Daftar batch/lot stok & penyesuaian stok manual.
- **[Inventory Transactions](./api/inventory-transactions.md)** — Ledger mutasi stok inventori.
- **[Purchases](./api/purchases.md)** — Pembelian bahan baku (`DRAFT` -> `FINALIZED`).
- **[Preparations](./api/preparations.md)** — Produksi/racikan batch (`DRAFT` -> `COMPLETED`).
- **[Products](./api/products.md)** — Master produk jual, resep bahan, & mode stok.
- **[Product Modifiers](./api/product-modifiers.md)** — Grup modifier, opsi modifier, & assignment ke produk.
- **[Orders](./api/orders.md)** — Transaksi penjualan (`DINE_IN`, `TAKEAWAY`, `DELIVERY`), pembayaran, & overview.
- **[Cash Transactions](./api/cash-transactions.md)** — Buku kas, saldo, arus kas, `INVESTMENT`, & `PROFIT_SHARING`.

### 3. Dokumentasi Business Logic (`docs/business-logic/`)

- **[Ringkasan Business Logic](./business-logic/README.md)**
- **[Organization Management](./business-logic/organization-management.md)**
- **[Inventory Management](./business-logic/inventory-management.md)**
- **[Purchase Management](./business-logic/purchase-management.md)**
- **[Preparation Management](./business-logic/preparation-management.md)**
- **[Sales Management](./business-logic/sales-management.md)**
- **[Cash Management](./business-logic/cash-management.md)**
