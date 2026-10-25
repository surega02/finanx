# FINANX V2 — runbook staging dan rollback

Status: implementasi lokal; deployment dan perangkat nyata belum diverifikasi. Dokumen ini tidak mengubah kontrak V1/V2.

## Sebelum deploy cloud

1. Backup database dengan prosedur deployment organisasi. Jalankan diagnosis metadata read-only `supabase/diagnose-auth.sql` pada staging/target. Pastikan kategori/transaksi memakai `(user_id,id)` dan FK kategori memakai `(user_id,category_id)`. Skema aktual belum dapat dibuktikan hanya dari file repo.
2. Jika dibutuhkan, selesaikan migrasi V1 `20261020_per_user_keys.sql` dengan review data dan backup. Jangan mereset tabel.
3. Melalui runner migration versi, pasang `supabase/migrations/202610220002_financial_settings.sql` tepat sekali. Nama timestamp memastikan urutan sesudah migrasi V1; target **schemaVersion 2**. CREATE TABLE/POLICY sengaja gagal jika skema tak cocok, agar runner melakukan rollback atomik, bukan menyamarkan ketidaksesuaian dengan IF NOT EXISTS.
4. Tabel baru memiliki RLS empat operasi, batas nominal/pasangan null, timestamp server. RPC `ledger_snapshot_v2` bersifat SECURITY INVOKER, owner-scoped, satu snapshot MVCC, bigint sebagai teks. Tidak ada perubahan tabel/PK/FK V1.
5. Uji SELECT/INSERT/UPDATE/DELETE dan owner reassignment dengan dua JWT pengguna staging nyata serta anon; uji OAuth/session switch. Uji transport RPC melalui PostgREST/Supabase SDK, batas respons/gateway dan fetch latency 10k secara terpisah. Migrasi ini belum dipasang pada proyek pengguna oleh implementasi lokal.
6. Deploy app hanya setelah RPC tersedia. Missing settings row berarti unset, tetapi missing RPC adalah error pemuatan yang dapat di-retry, bukan ledger kosong. Cloud tidak masuk penyimpanan demo.

## Demo

Urutan deteksi: `finanx:demo:v2` valid → gunakan; jika belum ada, `finanx:demo:v1` → legacy `finanx:v1` dengan UID demo → seed untuk pengguna baru. State mendapat schemaVersion=2 dan financialSettings unset. Transaksi/kategori/profil disalin; snapshot demo lama dipertahankan. Legacy beridentitas cloud tetap dibersihkan sesuai pengamanan V1, tidak boleh diimpor ke demo. Parse/quota/validasi gagal menampilkan error pemulihan; jangan menimpa sumber dengan seed.

Kuota localStorage tetap batas browser, bukan batas jumlah transaksi produk. Commit transaksi/settings gagal mempertahankan draft dan tidak menyatakan sukses. Benchmark workload besar dilakukan setelah data siap di memori, terpisah dari kemampuan persistensi demo.

## Rollback tanpa membuang transaksi V2

**Cloud:** rollback binary/app ke V1 yang kompatibel; biarkan tabel settings dan fungsi V2 tetap ada. Transaksi V2 adalah baris V1 biasa dan tetap tersedia. Jangan drop tabel atau memulihkan backup lama di atas transaksi terbaru untuk sekadar menonaktifkan V2.

**Demo:** key V1 adalah snapshot lama, bukan replika. Sebelum mengganti app, hentikan penulisan, ambil salinan lengkap `finanx:demo:v2` terbaru menjadi file pemulihan lokal dan verifikasi jumlah/ID/nilai transaksi. Gunakan adapter internal `projectDemoRollback()` dari `src/lib/ledger.js` pada salinan tersebut untuk menghasilkan objek V1. Adapter hanya menghilangkan schemaVersion/financialSettings dan mempertahankan domain terbaru. Simpan hasil ke `finanx:demo:v1` **hanya setelah backup kedua key dan validasi kesetaraan record**; baca ulang lalu bandingkan sebelum mengaktifkan V1. Simpan key V2 dan file salinannya untuk recovery. Jangan otomatis mengganti state dari snapshot lama. Ini prosedur deployment internal, bukan fitur import/restore produk.

Rehearsal otomatis: migrasi V1 → V2, buat transaksi sesudah migrasi, reload V2, proyeksi V1, dan buktikan kedua ID masih ada (`tests/v2.test.mjs`). Rehearsal rollback browser pengguna/staging aktual masih gate rilis.

## Pengujian lokal yang dapat diulang

- `npm test`: regresi auth dan ledger/acceptance unit V2.
- `npm run build`: build konfigurasi proyek aktif.
- `npm run test:browser`: build demo terisolasi lalu Chrome headless desktop/360px dan benchmark CPU normal/4×. Set `CHROME_PATH` bila perlu. Hasil di `.impeccable/review/v2-browser-results.json` dan screenshot PNG.
- Database: buat cluster PostgreSQL kosong **khusus tes**, bind localhost port **55432** dengan owner test `postgres`. Jalankan `psql -h 127.0.0.1 -p 55432 -U postgres -d postgres -f tests/database-v2.sql`, lalu `node scripts/test-v2-snapshot.mjs`. Fixture membuat role/auth tiruan; **bukan** untuk Supabase asli atau database pengguna. Hentikan cluster sesudah selesai.
- `scripts/test-v2-snapshot.mjs` menjalankan 500 read snapshot selama 250 update/insert/delete atomik pada dua koneksi terpisah.

## Gate rilis yang memerlukan lingkungan tambahan

- Android Chrome kelas menengah nyata: keyboard virtual, Back, download/save file, 44px touch, 360px, benchmark/render/heap.
- Excel dan Google Sheets nyata: pastikan formula CSV tidak dievaluasi, termasuk whitespace/control; periksa BOM/koma/quote/newline/15-digit dan catat versi aplikasi. Unit test escaping bukan pengganti pengujian aplikasi spreadsheet.
- Supabase staging/target: metadata/grants/RLS aktual, OAuth dua akun, transport RPC/SDK, network time, failure setelah commit, batas respons dan rollback deployment.
- Screen reader nyata dan keyboard seluruh state serta focus restoration. Tes Tab otomatis hanya bukti cakupan yang diuji.

Jangan memberi status siap rilis sebelum gate tersebut memiliki bukti lulus.
