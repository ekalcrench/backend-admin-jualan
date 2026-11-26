# Cash Management

Modul `CashTransaction` berfungsi sebagai buku besar arus kas (cash ledger) per organisasi.

## 1. Jenis Transaksi Kas (`CashTransactionType`)

| Tipe             | Arah Kas     | Sumber Pencatatan                                                              | Dapat Diubah/Dihapus Manual? |
| ---------------- | ------------ | ------------------------------------------------------------------------------ | ---------------------------- |
| `SALE`           | Masuk (`+`)  | Otomatis saat `POST /api/orders/:id/mark-paid` (`referenceId = order.id`)      | Tidak (`403 Forbidden`)      |
| `INVESTMENT`     | Masuk (`+`)  | Manual via `POST /api/cash-transactions`                                       | Ya (`OWNER` / `ADMIN`)       |
| `PURCHASE`       | Keluar (`-`) | Otomatis saat `POST /api/purchases/:id/finalize` (`referenceId = purchase.id`) | Tidak (`403 Forbidden`)      |
| `PROFIT_SHARING` | Keluar (`-`) | Manual via `POST /api/cash-transactions`                                       | Ya (`OWNER` / `ADMIN`)       |

## 2. Perhitungan Saldo & Arus Kas

- **Saldo Kas (`GET /api/cash-transactions/balance`)**:
  $$\text{Balance} = (\text{Total SALE} + \text{Total INVESTMENT}) - (\text{Total PURCHASE} + \text{Total PROFIT\_SHARING})$$
  Dihitung dari awal hingga akhir hari `endDate` (jika parameter `endDate` diberikan).
- **Arus Kas (`GET /api/cash-transactions/cash-flow`)**:
  - `cashIn` = `SALE + INVESTMENT` pada rentang `startDate` s.d. `endDate`.
  - `cashOut` = `PURCHASE + PROFIT_SHARING` pada rentang `startDate` s.d. `endDate`.
  - `prevCashIn` dan `prevCashOut` dihitung pada periode pembanding sebelumnya dengan durasi yang sama (atau sebelum `startDate` jika hanya `startDate` yang diberikan).
