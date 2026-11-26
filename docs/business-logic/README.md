# Dokumentasi Business Logic

Bagian ini menjelaskan alur proses bisnis end-to-end yang diimplementasikan di dalam backend Admin Jualan, mulai dari manajemen tenant/organisasi, pengelolaan stok FIFO, pembelian, produksi/preparation, penjualan POS, hingga pencatatan arus kas.

## Daftar Proses Bisnis

| Proses Bisnis               | File Dokumentasi                                           | Ringkasan                                                                                             |
| --------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Organization Management** | [organization-management.md](./organization-management.md) | Siklus hidup organisasi, keanggotaan (`OrganizationUser`), dan alur approval                          |
| **Inventory Management**    | [inventory-management.md](./inventory-management.md)       | Model lot FIFO, penyesuaian stok manual, kebijakan `STRICT` vs `ALLOW_NEGATIVE`, dan perhitungan aset |
| **Purchase Management**     | [purchase-management.md](./purchase-management.md)         | Pembelian bahan baku (`DRAFT` -> `FINALIZED`), pembuatan lot, dan pembatalan                          |
| **Preparation Management**  | [preparation-management.md](./preparation-management.md)   | Produksi/racikan batch (`DRAFT` -> `COMPLETED`), reservasi bahan FIFO, dan perhitungan HPP output     |
| **Sales Management**        | [sales-management.md](./sales-management.md)               | Pembuatan order, validasi modifier, pemotongan stok, costing FIFO, dan pembayaran                     |
| **Cash Management**         | [cash-management.md](./cash-management.md)                 | Buku kas otomatis & manual, perhitungan saldo, dan arus kas                                           |
