# FINANX V2 — Audit V1 dan rencana implementasi

Tanggal: 22 Oktober 2026. Status: audit awal dan rencana sebelum perubahan produksi.

## Sumber dan batas

Baseline yang dibaca: seluruh `docs/v1/*.md`, kode React/store/adaptor Supabase, schema dan migrasi SQL, tes autentikasi, serta skrip verifikasi. Kontrak V2: Requirements, Data Model, Design, Final Consistency Review. Dokumen kanonis tidak diubah. Scope hanya DASH, STE, BAL, HNAV, EXP; tidak ada Wallet, budgeting, recurring, PWA, import, atau domain baru lainnya.

## Temuan audit V1

| Temuan | Bukti aktual | Implikasi V2 / penanganan |
|---|---|---|
| Kontradiksi key demo | `DATA-MODEL-v1.md` §1 dan `store.js`: `finanx:demo:v1`; V2 mengasumsikan `finanx:v1` | Utamakan key demo aktual; hanya impor legacy dengan `user.uid=demo-uid`. Pertahankan snapshot demo, jangan pertahankan cache cloud yang dapat dibaca demo. Tidak mengubah isolasi autentikasi V1. |
| Save belum terkonfirmasi | `Store._push()` memakai upsert fire-and-forget; sheet langsung menampilkan stempel sukses | Untuk create/retry V2, tunggu server, ID stabil per intent, verifikasi ID pada hasil tak pasti, draft tetap ada saat gagal. Perubahan internal ini diperlukan NFR-V2-07/O-02. |
| Data cloud berpotensi terpotong | `loadCloud()` satu select tanpa pagination/snapshot | Semua agregat dan ekspor harus lengkap. Gunakan RPC snapshot sebagai satu pernyataan SQL, owner-scoped dan security invoker; bigint dikirim sebagai teks. Kegagalan tidak menjadi ledger kosong. |
| Presisi belum dijamin | summary menambah Number, bigint adaptor tidak dinormalisasi | Agregat integer eksak, termasuk jika melampaui MAX_SAFE_INTEGER; tidak membatasi nominal transaksi V1 ke batas saldo awal. |
| Kategori historis hilang pada rincian | `categoryTotals()` hanya lookup kategori aktif | Gunakan kategori historis/snapshot untuk baca, tetap kategori aktif untuk input baru. |
| Routing hanya memori | `App.jsx` view/month dan filter Transactions lokal | Tambahkan URL query tervalidasi, konteks return internal dan browser Back; tidak menambah navigasi utama. |
| Semua Bulan V1 beda cakupan | Kode tidak memfilter tahun bila `month=all` | O-04 secara eksplisit menetapkan Semua Bulan dalam tahun terpilih; tandai sebagai perubahan V2 yang disetujui. |
| Cache filter V1 | useMemo Transactions bergantung objek store yang dimutasi | Pastikan delete/undo/edit memperbarui daftar dan agregat melalui subscription/revision. |
| Cakupan tes terbatas | 13 tes auth; skrip UI belum acceptance V2, assertion overflow mobile longgar, tidak exit gagal | Tambah regresi ledger, acceptance V2, kegagalan save/migrasi, browser flows dan benchmark yang mengembalikan exit gagal. |
| Referensi dokumen hilang | `V2-SCOPE-REVIEW.md` dirujuk tetapi tidak tersedia di repo | Empat dokumen input dan keputusan final §14 menjadi kontrak implementasi; tidak mengarang isi referensi yang hilang. |

Baseline lokal: `npm run test:auth` **13/13 lulus**, `npm run build` **lulus** sebelum perubahan produksi. Ini belum membuktikan OAuth/RLS deployment. Chrome headless memerlukan lingkungan eksekusi yang dapat menjangkau server lokal; percobaan awal sandbox gagal. ADB belum berhasil terhubung, PostgreSQL port default belum tersedia. Jangan menyatakan Android fisik, Excel/Sheets atau database produksi telah diuji berdasarkan emulasi/static review.

## Urutan implementasi

1. **Foundation dan regresi**: utilitas tanggal lokal/integer eksak, satu filter/sort untuk histori/picker/ekspor, state URL defensif, subscription store; fixture V1 dan V2.
2. **Migrasi additive versi 2**: tabel financial_settings, pair/range constraints, trigger timestamp server, RLS SELECT/INSERT/UPDATE/DELETE. RPC snapshot owner-scoped tanpa perubahan PK/FK V1; privilege minimum dan bigint teks. Tidak menjalankan migrasi produksi sebelum preflight deployment.
3. **Migrasi demo**: key terpisah `finanx:demo:v2`; validasi bentuk V1 aktual, salin record tanpa mengubah, tambah schemaVersion/settings unset, tulis dan baca ulang. Error parse/quota ditampilkan dan sumber tidak ditimpa. Snapshot V1 bukan replika V2.
4. **Historical Navigation**: year/month + filter gabungan, pagination 10, reset page, dashboard picker/drill-down, return relatif aman, refresh/Back memulihkan periode.
5. **Smart Entry**: Catat Lagi dan picker satu sheet, 10 + load more, baseline ternormalisasi, tanggal eksplisit, kategori aktif, konfirmasi dirty/overwrite, fokus/Back. Stable ID dan server-confirmed save/retry.
6. **Dashboard/BAL**: summary V1 tetap 3 sel; pembanding, periode setara, tren enam bulan, kategori historis/prior-only; kumulatif sekunder. Pengaturan saldo awal di Profil; null berbeda dari nol; konfirmasi update/reset.
7. **CSV**: sheet dua scope, BOM/koma/CRLF, quoting dan formula neutralization, semua hasil lintas halaman. Cloud export memakai snapshot konsisten; tidak membuat file parsial saat gagal. Unduhan hanya tindakan eksplisit.
8. **Hardening**: seluruh string ID/EN, aksesibilitas, 360px dan desktop, regresi V1/acceptance V2, rollback rehearsal, SQL dua identitas, benchmark 10k/100 kategori/5 tahun, laporan gate aktual.

## Urutan rollout dan rollback

1. Backup database dan inspeksi metadata aktual dengan `supabase/diagnose-auth.sql`; pastikan key gabungan V1 sudah terpasang. Jangan mengulang schema instalasi untuk memigrasikan produksi.
2. Jalankan migrasi versi 2 lewat runner versi pada staging; uji dua akun termasuk owner reassignment dan snapshot saat insert/update/delete bersamaan. Missing settings row berarti unset; tidak backfill nol.
3. Deploy aplikasi setelah skema tersedia. Demo tidak digabung dengan cloud. Snapshot RPC gagal harus menghasilkan error/retry, bukan data kosong atau ekspor sebagian.
4. Rehearsal rollback: simpan seluruh state V2 termasuk transaksi sesudah migrasi ke file JSON lokal; adaptasikan domain V1 dari state V2 terbaru dan validasi kesetaraan record sebelum menggunakan kembali aplikasi V1. Jangan sekadar kembali ke snapshot lama. Cloud rollback aplikasi membiarkan tabel settings dan transaksi baru tetap ada; tidak drop tabel atau revert transaksi.
5. Rilis hanya sesudah semua gate wajib lulus. Jika perangkat/akun/layanan tidak tersedia, catat **belum diverifikasi**, bukan PASS.

## Matriks verifikasi

- V1: create/edit/date future/delete/undo, kategori custom/historis, filter + pagination, bahasa, demo refresh dan isolasi akun/logout.
- V2: lintas tahun/enam bulan kosong, periode setara bulan pendek, future tanpa persen; kumulatif efektif inklusif/null/0/future; picker dirty/overwrite/Back, kegagalan jaringan dan double submit; URL invalid/external return; CSV >10 baris/injection/quotes/newlines/precision.
- Database: constraints, timestamp server, grants/RLS dua akun seluruh operasi, FK V1, snapshot konsisten dan eksak, migrasi rollback tanpa kehilangan record.
- Benchmark: 10.000 aktif/100 kategori/lima tahun; p95 dashboard/history ≤500ms, picker ≤300ms setelah data siap; CSV latency/heap, fetch terpisah; desktop dan Android Chrome kelas menengah.
- Visual: The Stamped Register, 360px tanpa overflow, uang eksak, target kritikal ≥44px, keyboard/fokus/screen-reader dan reduced motion.
