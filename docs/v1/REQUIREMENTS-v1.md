# Product Requirements — Finanx v1.0.0

Status: selesai dan menjadi baseline rilis pertama  
Tanggal baseline: 29 Agustus 2026

## 1. Tujuan

Finanx v1 memungkinkan seorang pengguna mencatat dan meninjau arus uang pribadi dengan cepat. Dokumen ini menggambarkan perilaku aplikasi yang benar-benar tersedia pada v1.0.0 dan menjadi referensi regresi untuk pengembangan selanjutnya.

## 2. Ruang lingkup

### 2.1 Autentikasi dan mode aplikasi

- FR-AUTH-01: Tanpa konfigurasi Supabase, aplikasi berjalan dalam mode demo dengan login Google simulasi dan penyimpanan `localStorage`.
- FR-AUTH-02: Dengan environment Supabase yang valid, aplikasi menggunakan Google OAuth dan memuat data pengguna dari Supabase.
- FR-AUTH-03: Pengguna dapat logout.
- FR-AUTH-04: Banner data contoh hanya tampil dalam mode demo.

### 2.2 Transaksi

- FR-TX-01: Pengguna dapat membuat pemasukan atau pengeluaran.
- FR-TX-02: Setiap transaksi wajib memiliki tipe, jumlah positif, kategori aktif, dan tanggal.
- FR-TX-03: Keterangan bersifat opsional.
- FR-TX-04: Tanggal memakai presisi hari (`YYYY-MM-DD`) dan boleh berada di masa lalu, hari ini, atau masa depan.
- FR-TX-05: Pengguna dapat mengubah tipe, jumlah, kategori, tanggal, dan keterangan transaksi.
- FR-TX-06: Pengguna dapat melakukan soft delete transaksi dan mengurungkannya melalui toast.
- FR-TX-07: Transaksi terhapus tidak masuk daftar atau perhitungan dashboard.
- FR-TX-08: Jumlah dibulatkan ke bilangan bulat rupiah dan harus lebih besar dari nol.

### 2.3 Daftar dan filter transaksi

- FR-LIST-01: Transaksi aktif diurutkan berdasarkan tanggal terbaru, lalu waktu pembuatan terbaru.
- FR-LIST-02: Pengguna dapat memfilter semua jenis, pemasukan, atau pengeluaran.
- FR-LIST-03: Pengguna dapat memfilter semua kategori atau satu kategori aktif.
- FR-LIST-04: Filter bulan menyediakan Semua serta Januari–Desember untuk tahun berjalan; bulan berjalan dipilih secara awal.
- FR-LIST-05: Pencarian mencocokkan keterangan dan nama kategori tanpa membedakan huruf besar/kecil.
- FR-LIST-06: Daftar menggunakan pagination lokal sebanyak 10 item per halaman.

### 2.4 Dashboard

- FR-DASH-01: Dashboard menampilkan total pemasukan, pengeluaran, dan saldo untuk bulan terpilih.
- FR-DASH-02: Saldo dihitung sebagai pemasukan dikurangi pengeluaran.
- FR-DASH-03: Dashboard menampilkan perbandingan pemasukan/pengeluaran dan rincian total per kategori.
- FR-DASH-04: Pengguna dapat berpindah ke bulan sebelumnya, bulan berikutnya, dan kembali ke bulan berjalan.
- FR-DASH-05: Bulan tanpa transaksi menampilkan empty state dan akses untuk menambah transaksi.

### 2.5 Kategori

- FR-CAT-01: Aplikasi menyediakan kategori sistem terpisah untuk pemasukan dan pengeluaran.
- FR-CAT-02: Pengguna dapat membuat kategori kustom dengan nama, tipe, dan ikon yang tersedia.
- FR-CAT-03: Nama kategori aktif harus unik secara case-insensitive dalam tipe yang sama.
- FR-CAT-04: Pengguna hanya dapat menghapus kategori kustom.
- FR-CAT-05: Penghapusan kategori bersifat soft delete dan tidak menghapus transaksi lama.

### 2.6 Profil, bahasa, dan versi

- FR-PROFILE-01: Profil menampilkan foto/inisial, nama, email, tanggal bergabung, dan tanggal pembaruan.
- FR-PROFILE-02: Bahasa tampilan dapat diubah antara Indonesia dan Inggris.
- FR-PROFILE-03: Halaman profil menampilkan versi aplikasi `v1.0.0` dan tahun hak cipta.

## 3. Aturan bisnis

- BR-01: Mata uang v1 selalu IDR.
- BR-02: Nilai transaksi selalu positif; tipe menentukan pemasukan atau pengeluaran.
- BR-03: Ringkasan hanya memakai transaksi yang `deleted_at`-nya kosong.
- BR-04: Kategori transaksi disimpan sebagai referensi kategori; implementasi lokal juga membawa snapshot tampilan kategori.
- BR-05: Data mode cloud hanya dapat diakses pemiliknya melalui kebijakan RLS.
- BR-06: Tanggal transaksi masa depan sah dan ikut tampil pada bulan yang sesuai.

## 4. Requirement nonfungsional

- NFR-01: Antarmuka responsif pada ponsel, tablet, dan desktop.
- NFR-02: Kontrol utama dapat digunakan dengan keyboard dan memiliki label aksesibilitas.
- NFR-03: Data demo bertahan setelah refresh melalui `localStorage`.
- NFR-04: Kegagalan sinkronisasi cloud tidak boleh merusak struktur state lokal yang sedang digunakan.
- NFR-05: Build produksi dibuat dengan `npm run build` menggunakan Node.js 18 atau lebih baru.
- NFR-06: Kredensial Supabase tidak disimpan di repository dan hanya diberikan melalui environment variables.

## 5. Kriteria penerimaan rilis v1

- AC-01: Pengguna dapat masuk, menambah pemasukan dan pengeluaran, lalu melihat total dashboard berubah.
- AC-02: Transaksi bertanggal masa depan dapat dibuat dan diedit tanpa ditolak oleh input maupun validasi submit.
- AC-03: Filter bulan menampilkan 12 nama bulan dan menghasilkan daftar sesuai bulan yang dipilih.
- AC-04: Filter jenis, kategori, pencarian, dan pagination dapat dipakai bersamaan.
- AC-05: Soft delete menghilangkan transaksi dari daftar dan ringkasan; urungkan memulihkannya.
- AC-06: Kategori kustom dapat dibuat dan dihapus tanpa menghapus histori transaksi.
- AC-07: Bahasa tampilan berubah antara Indonesia dan Inggris.
- AC-08: Mode demo berfungsi tanpa environment cloud; mode Supabase mengisolasi data antar pengguna.
- AC-09: Profil menampilkan `v1.0.0`.
- AC-10: Seluruh dokumentasi v1 menyebut Supabase sebagai implementasi cloud aktif.

## 6. Batasan v1

Tidak termasuk akun/dompet, transfer, anggaran, transaksi berulang, target, utang/piutang, investasi, multi-mata-uang, lampiran, ekspor, notifikasi, kolaborasi, admin, atau laporan lanjutan.

## 7. Template requirement versi berikutnya

Salin bagian berikut ke dokumen baru, misalnya `REQUIREMENTS-v1.1.md` atau `REQUIREMENTS-v2.md`:

```md
# Product Requirements — Finanx vX.Y.Z

Status: draft
Target rilis: TBD
Baseline: v1.0.0

## Tujuan dan masalah pengguna
## Perubahan dari baseline
## Ruang lingkup
## Di luar ruang lingkup
## Functional requirements
## Aturan bisnis
## Perubahan UI/UX
## Perubahan data dan migrasi
## Keamanan dan privasi
## Kriteria penerimaan
## Risiko dan keputusan terbuka
```
