# Filter cepat transaksi — 2 November 2026

## Permintaan dan semantik yang disetujui

Pengguna meminta filter Hari Ini, 7 Hari, dan 1 Bulan pada halaman Transaksi dengan desain yang sama. Pengguna mengonfirmasi bahwa **1 Bulan berarti bulan berjalan, tanggal 1 sampai hari ini**, bukan 30 hari terakhir.

- Hari Ini memakai tanggal lokal perangkat.
- 7 Hari mencakup hari ini dan enam tanggal sebelumnya; rentang dapat melintasi bulan/tahun.
- 1 Bulan mencakup tanggal 1 bulan berjalan sampai hari ini.
- Batas awal/akhir inklusif. Transaksi mendatang dan yang dihapus tidak masuk preset ini.
- Bulan/Tahun mengembalikan filter kalender manual sebelumnya. Default dan drill-down Dashboard tetap memakai perilaku kalender V1/V2.

## Implementasi dan kompatibilitas

Preset menggunakan segmented control, warna ink/kertas, font mono, garis dan ukuran sentuh minimal 44px incumbent The Stamped Register. Pada layar sempit kontrol menjadi dua kolom. Rentang aktif ditampilkan sebagai tanggal pasti. Jenis, kategori termasuk historis, pencarian, dan pagination tetap dapat dipadukan; pergantian preset mereset halaman menjadi satu.

URL `range=today|7d|month` mempertahankan preset saat refresh/Back. Nilai lain diabaikan menjadi mode kalender, dan preset tidak diterapkan pada Dashboard. Bulan/tahun yang sebelumnya dipilih tetap tersimpan untuk kembali ke mode manual; tidak membatasi preset lintas bulan/tahun. Hook tanggal lokal menyelaraskan kembali setelah pergantian hari, fokus, atau perubahan visibility.

Ekspor terfilter menerima batas tanggal yang sama dengan daftar dan tetap meliputi seluruh hasil, bukan satu halaman. Pilihan ekspor seluruh histori tetap menggunakan cakupan sebelumnya. Tidak ada perubahan skema/migrasi, RLS, penulisan transaksi, atau data pengguna. Dokumen kanonis V1/V2 tidak ditimpa; ini tambahan yang diminta pengguna setelah V2.

## Bukti

- Build Vite berhasil; 35/35 tes unit/regresi logika lulus, termasuk lima tes tanggal baru.
- `scripts/test-history-period-browser.mjs`: 58/58 pemeriksaan lulus pada 1440, 360, dan 320px dengan data sintetis, zona Asia/Jakarta dan jam terkontrol.
- Acceptance mencakup batas inklusif, pergantian tahun, tanggal lokal berbeda dari UTC, bulan berjalan yang belum selesai, tipe/kategori/pencarian, refresh/Back, pagination, ekspor 16 hasil lintas halaman, pergantian hari/resume, ID/EN, target sentuh, dan overflow. Tidak ada uncaught browser error.
- Regresi UI V1/V2 `scripts/test-v2-browser.mjs --ui-only`: 63/63 pemeriksaan lulus. Harness memakai tanggal demo tetap agar jumlah baris lintas halaman tidak berubah saat awal bulan dan menunggu file unduhan selesai secara terbatas, bukan jeda tetap 300ms. Bukti: `transaction-periods-regression-20261102.json`.
- Review visual independen: **ship**, lima bagian review lengkap, tidak ada finding material pada keenam screenshot filter di desktop/mobile.
- Detector komponen/stylesheet: tidak ada finding. Bukti browser disalin ke `transaction-periods-browser-20261102.json`.

Pengujian ini tidak membuktikan Android fisik atau production. Agent belum melakukan deployment. Perubahan diagnostik koneksi dari pekerjaan sebelumnya tetap dipertahankan sebagai perubahan terpisah; laporan ini tidak mengklaim masalah koneksi HP tersebut sudah terverifikasi selesai pada perangkat pengguna.
