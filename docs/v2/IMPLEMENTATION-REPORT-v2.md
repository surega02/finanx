# FINANX V2.0.0 — laporan implementasi lokal

Tanggal: 22 Oktober 2026. **Status: implementasi lokal dan verifikasi yang tersedia selesai; belum layak dinyatakan siap rilis produksi.** Tidak ada deployment aplikasi atau migrasi ke database pengguna. Seluruh dokumen kanonis `docs/v1/` dan empat dokumen input V2 dipertahankan.

## Audit mendahului perubahan

[IMPLEMENTATION-PLAN-v2.md](IMPLEMENTATION-PLAN-v2.md) ditulis sebelum perubahan kode produksi, sesudah membaca baseline V1, kontrak V2, store, komponen, SQL dan pengujian. Baseline awal: 13 tes autentikasi dan build V1 lulus. UI V1 diperiksa pada desktop/360px sebelum perubahan komponen.

Ketidaksesuaian utama: V2 mengasumsikan `finanx:v1`, tetapi V1 terbaru sudah memakai `finanx:demo:v1` untuk isolasi cache cloud. Migrasi mendukung sumber demo aktual dan legacy yang terbukti milik demo, mempertahankan snapshot demo, serta tetap membersihkan legacy milik cloud sesuai pengamanan V1. Kontrak V1 tidak diubah diam-diam. Referensi `V2-SCOPE-REVIEW.md` juga tidak tersedia di repo; tidak ada keputusan baru yang diambil berdasarkan isi yang tidak tersedia.

## Lima fitur yang diimplementasikan

| Fitur | Hasil |
|---|---|
| Dashboard Balanced Insight | Summary tiga sel V1, perubahan nominal bertanda/denominator aman, detail periode setara, future tanpa persen, enam bulan berurutan, kategori historis/prior-only, alternatif teks angka eksak. |
| Smart Transaction Entry | Catat Lagi dan picker internal dengan 10/load-more; baseline bersih, dirty/overwrite confirmation, tanggal eksplisit dipertahankan, kategori aktif, ID stabil dan save/retry terkonfirmasi. |
| Saldo Kumulatif/Saldo Awal | Settings Profil, null berbeda dari nol, tanggal efektif inklusif termasuk future, update/reset dikonfirmasi; perhitungan BigInt dan rekap bulanan tetap terpisah. |
| Historical Navigation | URL year/month/type/category/q/page tervalidasi, Semua Bulan dalam tahun terpilih, drill-down/return internal aman, Back dan refresh; filter mereset halaman. |
| Export CSV | Dua cakupan, seluruh hasil lintas pagination, BOM/koma/CRLF, quoting/formula neutralization, kategori historis, snapshot cloud konsisten, tanpa file untuk hasil kosong/error. |

Versi aplikasi/package menjadi 2.0.0. Tidak ada fitur Wallet, budgeting, recurring, AI, PWA, import/restore atau ekspor selain CSV. Dokumentasi UI aktual: [UI-IMPLEMENTATION-v2.md](UI-IMPLEMENTATION-v2.md).

## Data, keamanan dan kompatibilitas

- Migrasi additive `supabase/migrations/202610220002_financial_settings.sql`: financial_settings, pair/range constraints, timestamp server, RLS empat operasi, privilege authenticated. PK/FK/tabel V1 tidak diubah.
- RPC `ledger_snapshot_v2`: SECURITY INVOKER, owner dari auth.uid(), satu pernyataan SQL/snapshot MVCC, bigint sebagai teks. Menghindari pemotongan default pagination respons tabel. App memerlukan migrasi ini sebelum rollout cloud; missing RPC adalah error, bukan data kosong.
- Demo schemaVersion=2 pada `finanx:demo:v2`; migrasi tervalidasi, tulis/baca ulang, tidak overwrite key sumber. Parse/quota gagal dapat dipulihkan. Rollback adapter mempertahankan transaksi sesudah migrasi.
- Agregat BigInt dan formatting eksak; konversi rasio hanya untuk geometri grafik. Transaksi V1 tidak diberi batas 15 digit saldo awal. Data integer tidak aman dari Number ditolak agar rounding tidak disembunyikan.
- Jalur create/edit UI menunggu konfirmasi; create memakai ID yang sama pada retry, mengecek keberadaan ID, dan tidak menimpa intent yang sudah tersimpan. Dua transaksi sengaja identik tetap boleh memakai ID berbeda. Delete/undo juga menunggu respons cloud sebelum memperbarui ledger lokal/toast sukses; error tidak dianggap sukses.
- Isolasi akun dan invalidasi hasil async V1 dipertahankan. Refresh cloud awal mempertahankan URL; pergantian identitas/logout mereset konteks akun. State keuangan cloud tidak disimpan di cache demo.
- Perilaku persistensi kategori/bahasa V1 tetap mengikuti jalur V1; bukan perombakan sinkronisasi/offline di V2. Pengujian cloud nyata tetap diperlukan untuk seluruh alur.

## Hasil verifikasi

| Pemeriksaan | Bukti / hasil |
|---|---|
| Regresi auth + ledger/acceptance unit | `npm test`: **25/25 lulus**. Termasuk migrasi/rollback, null/0/future, periode pendek/lintas tahun, soft delete/undo, kategori historis, uang eksak, URL berbahaya, CSV, dirty state, uncertain save/double submit dan kegagalan delete/undo. |
| Build | `npm run build`: **lulus**. |
| Browser produksi demo | **57/57 pemeriksaan lulus**: 1440px dan 360px/touch; create dari reuse, edit future, delete/undo, search/page, kategori custom, CSV >10 baris, setting 0/future/reset cancel, ID/EN, Back, Shift+Tab awal, dan tanpa overflow/error JS. |
| SQL additive/RLS | PostgreSQL disposable, dua identitas `authenticated` sintetis: constraints, timestamp, owner reassignment, anon denial, owner-scoped snapshot, bigint maksimum, data V1 terpelihara: **lulus**. Bukan dua JWT Supabase nyata. |
| Konkurensi snapshot | **500 read konsisten selama 250 update/insert/delete atomik paralel** pada dua koneksi PostgreSQL: lulus. |
| Desain | Review independen sumber + 14 screenshot V2 dan 2 baseline: **SHIP pada lingkup UI**, skor 8/10. Dua finding delta positif dan Shift+Tab awal diperbaiki; export capture diulang setelah animasi selesai. |
| Detector | `detect.mjs --json`: `[]`. Dokumen V1 tidak berubah; `git diff --check` diperiksa. |

Skrip/bukti dapat diulang melalui [ROLLOUT-v2.md](ROLLOUT-v2.md). Hasil browser terstruktur: [verification/browser-results.json](verification/browser-results.json). Screenshot lokal berada di `.impeccable/review/` (diabaikan Git). Cluster test PostgreSQL dihentikan setelah pengujian.

## Benchmark

Dataset: 10.000 transaksi aktif, 100 kategori, lima tahun, keterangan panjang, future dates dan kategori soft-deleted. Data disiapkan di memori; pengukuran ini tidak mencakup network Supabase atau biaya persistensi localStorage. Kuota localStorage terdeteksi saat percobaan fixture besar, ditangani terpisah sebagai batas browser; data tidak dipotong untuk memenuhi target.

Angka dan parameter terperinci ada dalam JSON bukti. Target komputasi serta render Dashboard/histori ≤500ms p95 dan picker/prefill ≤300ms p95 terpenuhi pada desktop dan proxy mobile CPU 4×. CSV sekitar 3 MB selesai sambil memberi giliran event loop; heap sebelum/sesudah diukur, bukan klaim peak heap atau jaminan semua perangkat.

| Pengukuran akhir | Desktop | Proxy mobile CPU 4× | Target |
|---|---:|---:|---:|
| Dashboard render p95 | 31,1 ms | 113,9 ms | ≤500 ms |
| Histori filter/render p95 | 31,0 ms | 49,8 ms | ≤500 ms |
| Picker open p95 | 29,8 ms | 50,8 ms | ≤300 ms |
| Prefill render p95 | 34,5 ms | 55,2 ms | ≤300 ms |
| CSV 10.000 baris | 84,2 ms | 370,6 ms | Tidak freeze/crash |
| Heap JS sebelum → sesudah CSV | 8,90 → 19,65 MB | 8,55 → 19,64 MB | Diukur; bukan peak heap |

Sebelum optimasi, satu run build produksi CPU 4× melewati target (Dashboard 547,5 ms; prefill 344,4 ms). Perbaikan: memo derivasi Dashboard, lookup kategori/scale yang diinvalidasi berdasarkan revision, render detail kategori hanya saat dibuka, dan preview keterangan picker dua baris dengan teks penuh tetap di DOM/form. Semua nominal dan seluruh baris tetap dipertahankan. Run terakhir sesudah perubahan lulus; variasi host tetap alasan pengujian Android fisik diperlukan.

**Proxy mobile** berarti desktop Chrome headless, viewport 360px/touch dan throttling CPU 4×. Mengganti user agent tidak membuatnya pengujian Android fisik.

## Gate rilis yang belum dipenuhi

1. **Android Chrome nyata kelas menengah**: perangkat tidak terhubung (`adb devices -l` kosong). Keyboard virtual/Back, download/save, touch, screen reader dan benchmark fisik belum diverifikasi.
2. **Excel dan Google Sheets nyata**: escaping/formula tests lokal lulus, tetapi tidak ada sesi aplikasi spreadsheet untuk membuktikan import CSV/injection di masing-masing aplikasi. Jangan mengklaim gate ini lulus.
3. **Supabase staging/produksi aktual**: skema/grants terpasang, OAuth/JWT dua akun, RPC melalui gateway/SDK, network latency/response limits, unknown-outcome save dan rollback deployment belum diverifikasi. Tidak ada perubahan database produksi.
4. **Rollback deployment/browser pengguna aktual**: rehearsal adapter dan fixture SQL lulus, tetapi backup/restore staging dan rekonsiliasi key demo pengguna aktual masih harus dijalankan menurut runbook.

Keempat gate harus diselesaikan sebelum sign-off rilis. Tidak ada klaim seluruh acceptance V2 lintas perangkat/layanan telah lulus hanya dari pengujian lokal.
