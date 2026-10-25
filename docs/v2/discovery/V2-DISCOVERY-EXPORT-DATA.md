# FINANX V2 — Export Data Discovery

**Working ID:** `V2-EXPORT-01`  
**Nama fitur:** Transaction Data Export (CSV)  
**Status:** Discovery ditutup; **Export Data masuk V2 — Confirmed Future Requirement** pada tingkat kemampuan dan batas cakupan yang disetujui. Detail teknis yang belum disetujui tetap **Proposed**.  
**Tanggal dokumentasi:** 22 Oktober 2026  
**Baseline:** FINANX v1.0.0 (frozen)  
**Cakupan inti:** Ekspor CSV dari **filter aktif** atau **seluruh histori transaksi aktif**; akses melalui halaman Transaksi.

> Dokumen ini merangkum keputusan discovery. Ini bukan `REQUIREMENTS-v2.md` final dan tidak mengubah dokumen V1 kanonis. Klaim kelayakan masih konseptual; performa dan detail pengamanan perlu diverifikasi dalam implementasi.

## 1. Latar belakang dan masalah pengguna

FINANX V1 sudah digunakan untuk pencatatan keuangan nyata. V1 menyediakan histori dan filter transaksi, namun **belum menyediakan ekspor data** (`PRODUCT-v1.md` dan `REQUIREMENTS-v1.md`). Pengguna perlu mengambil salinan transaksi untuk arsip pribadi dan analisis di luar FINANX (misalnya Excel atau Google Sheets).

**Tujuan:** memungkinkan pengguna mengunduh data transaksi yang sudah dicatat secara mudah, lengkap sesuai cakupan yang dipilih, dan aman tanpa menjadikan FINANX aplikasi pelaporan/backup yang kompleks.

**Prinsip:** cepat, akurat, konsisten; kontrol pengguna; tidak menambah langkah pencatatan; tetap memakai *The Stamped Register*.

## 2. Baseline V1 yang dipertahankan

Sumber kebenaran: `PRODUCT-v1.md`, `REQUIREMENTS-v1.md`, `DATA-MODEL-v1.md`, `DESIGN-v1.md`, `SUPABASE-v1.md`.

- Domain transaksi: `type` (`income`/`expense`), `amount` integer positif IDR, `date` date-only `YYYY-MM-DD`, referensi kategori, dan `description` opsional.
- Transaksi masa lalu, hari ini, dan masa depan sah (`FR-TX-04`, `BR-06`).
- Soft delete transaksi: hanya `deleted_at` kosong yang aktif; hanya transaksi aktif masuk daftar/agregasi (`FR-TX-07`, `BR-03`).
- Histori: urutan tanggal menurun lalu waktu pembuatan menurun, filter jenis/kategori/bulan/pencarian, pagination lokal 10 item per halaman (`FR-LIST-01`–`06`).
- Kategori kustom yang dihapus tidak menghapus transaksi historis.
- Mode demo: `localStorage` (`finanx:v1`); cloud: Supabase Auth + PostgreSQL + RLS berdasarkan kepemilikan pengguna.
- Desain: register-paper, aturan garis ledger, IBM Plex Mono untuk angka/chrome, Inter untuk teks, ink/slate untuk money signs, stamp red untuk tindakan/fokus.

Kandidat V2 **Integrated Historical Navigation** akan memperluas filter daftar menjadi tahun dan bulan. Fitur ekspor mengikuti hasil filter yang **benar-benar aktif** pada saat ekspor, bukan mengasumsikan perubahan navigasi sudah tersedia di V1.

## 3. Keputusan yang disepakati

| ID | Keputusan | Status | Catatan |
|---|---|---|---|
| EXP-D01 | Pengguna dapat mengekspor transaksi **sesuai filter aktif** | **Disetujui eksplisit** | Semua hasil yang cocok, bukan hanya halaman pagination. |
| EXP-D02 | Pengguna dapat mengekspor **seluruh histori transaksi aktif** | **Disetujui eksplisit** | Mengabaikan filter yang sedang dipakai. |
| EXP-D03 | Export Data masuk FINANX V2 | **Confirmed Future Requirement** | Persetujuan eksplisit untuk cakupan CSV sederhana. |
| EXP-D04 | Ekspor menggunakan **CSV sederhana** | **Disetujui pada tingkat format** | Detail BOM/delimiter/header di bawah masih kandidat aturan. |
| EXP-D05 | Akses melalui halaman **Transaksi** | **Bagian dari cakupan yang disetujui** | Tidak perlu halaman Export Center tersendiri. |
| EXP-D06 | Tidak menambahkan laporan PDF/XLSX, backup/restore, atau ekspor terjadwal | **Batas cakupan disetujui** | Dapat dievaluasi untuk rilis lain. |
| EXP-D07 | CSV UTF-8 dengan BOM dan koma sebagai delimiter | **Proposed** | Perlu uji kompatibilitas Excel/Sheets lintas locale. |
| EXP-D08 | Kolom `date,type,category,description,amount` | **Proposed** | Kandidat struktur dasar untuk difinalkan. |
| EXP-D09 | Empty result tidak membuat file, tampilkan pemberitahuan | **Proposed** | Perilaku UX tambahan. |

**Pemisahan status:** persetujuan fitur tidak otomatis mengonfirmasi setiap keputusan teknis atau microcopy yang belum dipilih secara eksplisit.

## 4. Cakupan fungsional V2

### 4.1 Mode ekspor A — Sesuai filter aktif

- Ekspor seluruh **transaksi aktif** yang cocok dengan filter pada halaman Transaksi, misalnya tahun, bulan, jenis, kategori, dan pencarian.
- Gunakan gabungan filter yang terlihat pada saat pengguna mengonfirmasi ekspor.
- Hasil ekspor **tidak dibatasi pagination** (meskipun UI daftar menampilkan 10 item per halaman).
- Urutan baris kandidat mengikuti histori V1: `date` terbaru, lalu `created_at` terbaru.
- Setelah Integrated Historical Navigation tersedia, dukung filter tahun/bulan lintas tahun tanpa aturan ekspor khusus yang berbeda.

### 4.2 Mode ekspor B — Seluruh histori aktif

- Ekspor semua transaksi aktif milik pengguna, lintas tahun dan termasuk tanggal masa depan.
- Abaikan filter dan pagination yang sedang aktif pada layar transaksi.
- Tidak mengekspor record dengan `deleted_at` terisi.
- Tidak mengubah transaksi, kategori, atau angka dashboard.

## 5. Spesifikasi kandidat CSV

**Format yang disepakati:** CSV sederhana, satu file untuk satu operasi ekspor.

| Nama kolom kandidat | Isi | Contoh |
|---|---|---|
| `date` | Tanggal transaksi, date-only ISO | `2026-10-22` |
| `type` | Jenis transaksi | `expense` |
| `category` | Nama kategori untuk dibaca manusia | `Belanja` |
| `description` | Keterangan, boleh kosong | `Telur 1 kg` |
| `amount` | Integer positif dalam IDR, tanpa `Rp` atau pemisah ribuan | `26000` |

Contoh (data fiktif):

```csv
date,type,category,description,amount
2026-10-22,expense,Belanja,Telur 1 kg,26000
2026-10-01,income,Gaji,Gaji bulanan,6500000
```

**Aturan kandidat:**

- Encoding UTF-8; pertimbangkan BOM (`UTF-8 BOM`) demi kemudahan saat membuka di Excel.
- Delimiter koma `,`, line endings standar; quote/escape field berisi koma, tanda kutip, atau baris baru mengikuti aturan CSV.
- Header konsisten dalam bahasa Inggris, tidak berubah mengikuti bahasa UI.
- Deskripsi kosong tetap menghasilkan field kosong; jangan mengubah tipe dan tanda nominal.
- Ekspor nominal sebagai teks desimal integer biasa (tanpa formula atau format tampilan), dengan memperhatikan batas representasi presisi aplikasi spreadsheet untuk nominal sangat besar.
- Nama kategori dari referensi/snapshot historis yang tersedia agar transaksi berkategori nonaktif tetap dapat dibaca; jika nama tidak dapat diresolusikan, tentukan fallback eksplisit sebelum implementasi (lihat pertanyaan terbuka).

**Keamanan CSV:** field teks tidak tepercaya (termasuk kategori dan deskripsi) perlu perlindungan terhadap *CSV/spreadsheet formula injection*, termasuk nilai yang diawali `=`, `+`, `-`, `@` atau variasi whitespace/control character yang relevan. Gunakan pendekatan yang aman untuk target spreadsheet, uji bahwa nilai tetap dapat dibaca, dan dokumentasikan kompromi jika harus mengubah representasi string. Quoting CSV biasa saja bukan mitigasi yang cukup.

## 6. UX dan lokasi akses

- Halaman **Transaksi** memiliki aksi sekunder **Ekspor Data**, bukan halaman baru atau alur wajib saat mencatat.
- Ketika dipilih, tampilkan sheet sederhana sesuai gaya V1, dengan dua pilihan: **Sesuai filter aktif** (kandidat default) dan **Seluruh histori aktif**.
- Tampilkan format yang akan diunduh: **CSV (.csv)**, tanpa pemilih format jika hanya satu format tersedia.
- Pengguna mengonfirmasi ekspor untuk memulai pembuatan/unduhan file. Jangan melakukan upload ke pihak ketiga.
- Tunjukkan progres singkat atau status menyiapkan file jika proses tidak instan; beri pesan kesalahan jika gagal. Hindari toast berhasil sebelum file benar-benar disiapkan/unduhan dipicu.
- Di Android Chrome, uji unduhan, nama file, pembukaan hasil, dan pembatalan jika browser memblokir download.
- UI mengikuti *The Stamped Register*: permukaan kertas, garis ledger, sudut mekanis, IBM Plex Mono pada chrome/angka, tanpa card-heavy dashboard.

## 7. Aturan nama file (proposed)

- Contoh filter satu bulan: `finanx-transactions-2026-10.csv`.
- Contoh seluruh histori: `finanx-transactions-all.csv`.
- Untuk filter gabungan yang kompleks, gunakan nama generik seperti `finanx-transactions-filtered.csv` atau sertakan tanggal ekspor agar tidak mudah tertimpa.
- Hindari memasukkan nama pengguna, email, atau informasi sensitif ke nama file.

## 8. Validasi, edge case, dan error

| Kondisi | Perilaku kandidat |
|---|---|
| Filter aktif menghasilkan 0 transaksi | Tampilkan *tidak ada transaksi untuk diekspor*; jangan membuat file kosong. |
| Histori seluruhnya kosong | Pesan yang sama; tombol ekspor dapat dinonaktifkan bila jumlah hasil diketahui. |
| Ada transaksi masa depan | Sertakan jika termasuk cakupan; tanggal tidak dimodifikasi. |
| Ada transaksi soft-deleted | Selalu dikecualikan. |
| Kategori sudah nonaktif | Tetap ekspor transaksi aktif beserta nama historis yang dapat diresolusikan. |
| Keterangan kosong | CSV field kosong. |
| Keterangan mengandung koma/kutip/newline | Serialize dengan aturan CSV benar. |
| Keterangan menyerupai formula | Netralisasi dengan cara yang teruji di Excel/Sheets. |
| Hasil cocok >10 baris | Ekspor seluruh hasil, bukan hanya halaman yang ditampilkan. |
| Filter berubah ketika sheet terbuka | Gunakan kondisi filter yang berlaku saat konfirmasi, tampilkan konteks yang konsisten. |
| Jumlah data besar | Hindari UI membeku; uji memori, loading, dan mekanisme fetch/batching cloud. |
| Kegagalan fetch/serialisasi/download | Laporkan kegagalan, jangan menghasilkan file yang diam-diam tidak lengkap. |
| Pengguna menekan ekspor berulang | Hindari operasi paralel yang tidak diperlukan. |
| Transaksi berubah selama ekspor | Tentukan kebijakan konsistensi snapshot yang wajar sebelum implementasi. |

## 9. Privasi dan keamanan

1. File hanya dibuat atas tindakan eksplisit pengguna; tidak ada ekspor otomatis di latar belakang.
2. Ekspor cloud hanya mencakup data yang diizinkan untuk pengguna terautentikasi; RLS V1 tetap wajib.
3. Mode demo hanya mengekspor state pengguna demo yang tersedia pada browser itu.
4. Jangan mencampur data pengguna lain, memasukkan token autentikasi, atau menambah metadata internal tak relevan.
5. CSV tidak otomatis diunggah ke Google Drive atau layanan lain.
6. Setelah file berada di perangkat, keamanannya bergantung pada penyimpanan dan berbagi oleh pengguna; UI dapat menyebut bahwa file berisi data keuangan pribadi.
7. Jangan mengandalkan `user_id` dari input klien untuk mengambil data di luar cakupan pemilik; verifikasi alur query/fetch aktual.

## 10. Data model, implementasi, dan migrasi

- **Schema:** untuk ekspor transaksi sederhana, tidak dibutuhkan tabel/kolom baru.
- **Migrasi:** tidak perlu backfill atau transformasi transaksi V1.
- **Agregasi:** tidak perlu menyimpan total saldo atau laporan; ekspor adalah representasi transaksi aktif.
- **Shared filter semantics:** hasil ekspor harus sama dengan himpunan hasil filter halaman Transaksi, dengan pengecualian pagination; hindari dua implementasi predicate filter yang berbeda.
- **Cloud loading:** bila data tidak seluruhnya dimuat pada klien, implementasi harus memastikan data cocok diambil secara lengkap tanpa hanya mengandalkan page UI.
- **Mobile performance:** uji ekspor histori berukuran besar di Android Chrome sebelum memilih pendekatan satu-blob atau batching.
- **Rollback:** karena fitur aditif dan tanpa migrasi skema, penghapusan aksi ekspor dapat dilakukan tanpa mengubah data V1.

## 11. Dependency & hubungan fitur V2 lain

- **Integrated Historical Navigation** menentukan filter lintas tahun dan kategori yang dapat diwariskan oleh mode *sesuai filter aktif*.
- **Dashboard Balanced Insight** tidak harus mengekspor angka ringkasan dalam cakupan dasar; sumber datanya tetap transaksi aktif.
- **Smart Transaction Entry** menghasilkan transaksi biasa; transaksi baru otomatis termasuk cakupan ekspor ketika aktif dan memenuhi filter.
- **Saldo Kumulatif + Saldo Awal** tidak perlu diekspor sebagai kolom pada CSV transaksi; ekspor konfigurasi saldo awal dan backup membutuhkan discovery terpisah.

## 12. Di luar cakupan (disetujui untuk scope dasar)

- File Excel `.xlsx` berformat/berworksheet banyak.
- Laporan PDF siap cetak.
- Backup sistem, restore/impor data, dan migrasi akun melalui CSV.
- Unduhan terjadwal atau email otomatis.
- Integrasi Drive/Dropbox atau upload otomatis.
- Halaman Export Center dan custom report builder.
- Ekspor transaksi terhapus secara default.
- Grafik, saldo kumulatif, dan ringkasan sebagai isi file ekspor dasar.

## 13. Kandidat acceptance criteria

| ID | Kriteria |
|---|---|
| EXP-AC-01 | Aksi Ekspor Data tersedia dari halaman Transaksi tanpa menambah langkah input V1. |
| EXP-AC-02 | Pengguna dapat memilih ekspor *sesuai filter aktif* atau *seluruh histori aktif*. |
| EXP-AC-03 | Ekspor terfilter menghormati kombinasi periode, jenis, kategori, dan pencarian yang berlaku. |
| EXP-AC-04 | Ekspor terfilter memuat semua hasil yang cocok, bukan hanya 10 baris pagination. |
| EXP-AC-05 | Ekspor seluruh histori memuat semua transaksi aktif milik pengguna, termasuk yang bertanggal masa depan. |
| EXP-AC-06 | Transaksi dengan `deleted_at` terisi tidak diekspor. |
| EXP-AC-07 | CSV memiliki kolom terdefinisi, tanggal `YYYY-MM-DD`, `type` stabil, dan nominal integer positif. |
| EXP-AC-08 | Keterangan dengan koma, kutip, newline, karakter Indonesia, dan string menyerupai formula ditangani dengan benar dan aman. |
| EXP-AC-09 | Kategori soft-deleted tidak menyebabkan transaksi aktif historis hilang dari ekspor. |
| EXP-AC-10 | Ketika tidak ada hasil, pengguna mendapat umpan balik jelas dan tidak menerima file yang menyesatkan. |
| EXP-AC-11 | Kegagalan fetch/ekspor tidak menghasilkan file seolah lengkap atau mengubah data sumber. |
| EXP-AC-12 | Pada mode cloud, hasil dibatasi kepemilikan pengguna melalui RLS. |
| EXP-AC-13 | Mode demo dan cloud menghasilkan isi logis yang konsisten untuk data input identik. |
| EXP-AC-14 | Alur ekspor dapat digunakan melalui Android Chrome, termasuk unduhan dan pembacaan CSV. |

Kriteria ini bersifat **kandidat untuk requirement formal**; nilai ambang performa dan pilihan serialisasi akhir masih perlu diuji.

## 14. Open questions sebelum handoff

1. Konfirmasi aturan **UTF-8 BOM, delimiter koma, header Inggris**, dan strategi escaping formula yang aman serta tetap kompatibel Excel/Sheets.
2. Apakah kategori di CSV menggunakan nama saat ini, nama snapshot saat transaksi dibuat, atau fallback lain apabila referensi sudah berubah/tidak tersedia?
3. Apakah UX ekspor ketika hasil kosong menggunakan tombol nonaktif atau pesan setelah pengguna menekan Ekspor?
4. Definisikan batas ukuran dan strategi pembangkitan/fetch file untuk histori besar agar tidak mengunci UI Android.
5. Bagaimana menangani data yang berubah selama ekspor, terutama pada mode cloud?
6. Tentukan apakah format angka besar wajib dipreservasi sebagai numerik pada spreadsheet atau sebagai teks untuk menghindari pembulatan oleh Excel.

## 15. Penilaian kelayakan dan hasil discovery

**Keputusan produk:** Export Data CSV sederhana **disetujui masuk FINANX V2** (*Confirmed Future Requirement*).

**Penilaian konseptual:** manfaat sedang–tinggi, kompleksitas rendah–sedang, risiko utama pada **kelengkapan cakupan**, **keamanan CSV**, **privasi**, dan **performa perangkat mobile**. Tidak perlu schema baru dan tidak memengaruhi mental model keuangan V1.

**Langkah berikutnya:** gunakan dokumen ini sebagai masukan `REQUIREMENTS-v2.md` setelah scope keseluruhan V2 stabil; periksa detail open questions sebelum handoff coding assistant. Jangan menyalin seluruh rekomendasi Proposed sebagai requirement final tanpa keputusan eksplisit.

---

**Decision history:**
- Pengguna memilih dukungan **filter aktif + seluruh histori aktif** dalam diskusi Export Data.
- Pengguna menyetujui **Export Data sebagai Confirmed Future Requirement V2 dengan cakupan CSV sederhana** pada 22 Oktober 2026.
- Dokumen discovery ini ditutup tanpa mengubah baseline FINANX v1.0.0.
