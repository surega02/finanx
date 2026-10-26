# Verifikasi backup ledger — 26 Oktober 2026

Sumber: arsip pengguna `finanx-v1-20261026-100031.dump`, 19.840 byte, PostgreSQL sumber 17.6, format custom dari pg_dump 17.10. File asli hanya dibaca dan tidak diubah.

Hasil akhir: **lulus pemulihan schema public dan rehearsal migrasi V2 lokal** pada PostgreSQL 17.10 yang terisolasi dari produksi.

- Pre-data, data, serta post-data (constraint/index/RLS) berhasil dipulihkan dengan exit-on-error.
- Tiga tabel V1 dipulihkan. Semua constraint tervalidasi.
- Migrasi `202610220002_financial_settings.sql` diterapkan pada salinan hasil restore.
- Jumlah baris dan fingerprint seluruh record profiles/categories/transactions identik sebelum dan sesudah migrasi.
- RLS aktif pada empat tabel; settings baru kosong; snapshot RPC tersedia dan SECURITY INVOKER.
- Isi record, identitas pemilik, serta nominal pribadi tidak ditampilkan dalam hasil verifikasi.
- Cluster sementara dihentikan dan salinan data sementara dihapus setelah uji akhir. Tidak ada perubahan pada database produksi.

**Batas cakupan:** arsip hanya memuat schema public dan diekspor tanpa ACL/owner. Schema auth tidak tersedia, sehingga uji membangun placeholder auth.users dari referensi ID ledger dan stub auth.uid agar FK/policy dapat dipulihkan. Ini bukan pemulihan akun/password/token Supabase Auth, konfigurasi Google OAuth, grants deployment, atau bukti transport Supabase/RLS dengan dua JWT nyata.

Percobaan awal harness terhenti pada penanganan proses Windows. Harness diperbaiki agar proses PostgreSQL tidak mewarisi pipe yang menahan penyelesaian pg_ctl; salinan awal dibersihkan, kemudian seluruh pengujian diulang dan lulus. Kegagalan awal tersebut bukan bukti arsip rusak.

Bukti tanpa isi data pribadi: [backup-restore-20261026.json](backup-restore-20261026.json).

Gate berikutnya tetap pemeriksaan riwayat migrasi target, penerapan versi pada cloud pengujian, OAuth/RLS dua akun nyata, Android Chrome fisik, dan validasi CSV di Excel/Sheets sebelum sign-off produksi.
