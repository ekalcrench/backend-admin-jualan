# Dokumentasi REST API Backend Admin Jualan

Seluruh endpoint API menggunakan global prefix `/api` (kecuali static assets di `/uploads/*`). Dokumentasi interaktif Swagger tersedia di `/api`.

---

## Konvensi Umum

### 1. Authentication & Headers

- Sebagian besar endpoint memerlukan header:

  ```http
  Authorization: Bearer <accessToken>
  ```

- Endpoint operasional (inventori, pembelian, persiapan, produk, modifier, order, kas, serta list/create `organization-users`) memerlukan token hasil `POST /api/auth/login/organization` yang memuat klaim `organizationId` dan `organization_roles`.
- Endpoint dengan `@Public()` tidak memerlukan token.

### 2. Global ValidationPipe

Seluruh request body dan query parameter divalidasi dengan `ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })`. Mengirim field yang tidak terdaftar di DTO akan menghasilkan `400 Bad Request`.

### 3. Pola Pagination Standar (`DefaultGetByPagesDto`)

Endpoint daftar berhalaman (`GET /api/...`) umumnya menggunakan query parameter berikut:

| Parameter | Type   | Required | Default | Description                                                            |
| --------- | ------ | -------- | ------- | ---------------------------------------------------------------------- |
| `page`    | number | Yes      | -       | Nomor halaman (`> 0`)                                                  |
| `size`    | number | Yes      | -       | Jumlah item per halaman (`> 0`)                                        |
| `sortBy`  | string | Yes      | -       | Field pengurutan; awalan `-` menandakan descending (mis. `-createdAt`) |
| `search`  | string | No       | -       | Kata kunci pencarian (case-insensitive)                                |

Format response pagination standar:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "size": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

## Daftar Modul API

| Modul                      | File Dokumentasi                                         | Deskripsi Singkat                                                               |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Auth**                   | [auth.md](./auth.md)                                     | Login, pilih organisasi, logout, registrasi, verifikasi OTP, resend OTP         |
| **Users**                  | [users.md](./users.md)                                   | Manajemen pengguna level platform & opsi pengguna                               |
| **Organizations**          | [organizations.md](./organizations.md)                   | CRUD organisasi (tenant) beserta media sosial                                   |
| **Organization Users**     | [organization-users.md](./organization-users.md)         | Manajemen keanggotaan, approval, suspend, dan aktivasi user organisasi          |
| **Inventory Items**        | [inventory-items.md](./inventory-items.md)               | Master bahan baku, opsi bahan, dan total nilai aset                             |
| **Inventory Lots**         | [inventory-lots.md](./inventory-lots.md)                 | Daftar batch/lot stok & penyesuaian stok manual                                 |
| **Inventory Transactions** | [inventory-transactions.md](./inventory-transactions.md) | Riwayat mutasi stok inventori                                                   |
| **Purchases**              | [purchases.md](./purchases.md)                           | Pembelian bahan baku (`DRAFT` -> `FINALIZED`)                                   |
| **Preparations**           | [preparations.md](./preparations.md)                     | Produksi/racikan internal (`DRAFT` -> `COMPLETED`)                              |
| **Products**               | [products.md](./products.md)                             | Master produk jual, resep bahan, opsi, & stok terendah                          |
| **Product Modifiers**      | [product-modifiers.md](./product-modifiers.md)           | Grup modifier, opsi modifier, reorder, & assignment ke produk                   |
| **Orders**                 | [orders.md](./orders.md)                                 | Transaksi penjualan (`DINE_IN`, `TAKEAWAY`, `DELIVERY`), pembayaran, & overview |
| **Cash Transactions**      | [cash-transactions.md](./cash-transactions.md)           | Buku kas, saldo, arus kas, serta transaksi `INVESTMENT` & `PROFIT_SHARING`      |
