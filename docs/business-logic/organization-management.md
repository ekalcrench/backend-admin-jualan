# Organization Management

## 1. Pembuatan & Pengelolaan Organisasi

- Organisasi dibuat oleh pengguna level platform (`ADMIN` atau `SUPER_ADMIN`) melalui `POST /api/organizations`.
- Setiap organisasi dapat memiliki `username` unik opsional (maks 30 karakter), `logoBase64` (wajib saat create, maksimal 2 MiB), serta daftar akun media sosial (`OrganizationSocialMedia`).
- Saat `PATCH /api/organizations/:id` mengirimkan `socialMedias`, seluruh media sosial lama dihapus dan diganti dengan daftar baru dalam satu operasi update Prisma.

## 2. Keanggotaan & Siklus Persetujuan (`OrganizationUser`)

1. Pengguna mendaftar akun platform (`POST /api/auth/register`) dan memverifikasi OTP email (`PUT /api/auth/register/verify`) sehingga status akun menjadi `ACTIVE`.
2. `OWNER` atau `ADMIN` organisasi menambahkan user tersebut ke organisasi via `POST /api/organization-users` dengan menentukan `role` (`OWNER`, `ADMIN`, `MEMBER`) dan `status` awal.
3. Jika status awal adalah `PENDING_APPROVAL`, hanya `OWNER` yang dapat menyetujuinya melalui `POST /api/organization-users/:id/approve` (status berubah menjadi `APPROVED`, `approvedAt` & `approvedById` terisi).
4. Hanya anggota berstatus `APPROVED` yang dapat memilih organisasi tersebut pada `POST /api/auth/login/organization` untuk mendapatkan JWT konteks organisasi.
5. `OWNER` atau `ADMIN` dapat menangguhkan anggota `APPROVED` menjadi `SUSPENDED` (`POST /api/organization-users/:id/suspend`) dan mengaktifkannya kembali menjadi `APPROVED` (`POST /api/organization-users/:id/activate`).
