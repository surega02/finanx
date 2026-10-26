# Status verifikasi menuju produksi — 26 Oktober 2026

Catatan tambahan, bukan perubahan dokumen kanonis. Status berikut membedakan hasil pengguna dari eksekusi agent.

| Area | Status / sumber bukti |
|---|---|
| Backup public | Arsip pengguna berhasil dipulihkan secara lokal; rehearsal migrasi mempertahankan seluruh record. Lihat BACKUP-RESTORE-20261026.md. |
| V1 target database | Pengguna melaporkan PK gabungan kategori/transaksi, FK kategori per pemilik, RLS aktif, dan USING/WITH CHECK sesuai owner. |
| Riwayat awal | Pengguna melaporkan objek V2 dan migration_history belum ada. Setelah setup CLI, dry-run hanya memuat 202610220002_financial_settings.sql. |
| Backend V2 | Pengguna melaporkan financial_settings dan ledger_snapshot_v2() tersedia, RLS settings aktif, dan snapshot SECURITY INVOKER. Pemasangan dilakukan pengguna, bukan agent. |
| Uji cloud dua akun | Pengguna menyatakan LULUS untuk isolasi A/B, persistensi refresh/login, Catat Lagi/edit/delete/undo, saldo awal terpisah dari bulanan, dan CSV owner/filter lintas halaman. Ini hasil fungsional yang dilaporkan pengguna. |
| Uji langsung RLS target | **LULUS berdasarkan hasil pengguna** dari supabase/verify-v2-rls.sql: total_checks=52, passed_checks=52, all_passed=true, failed_checks=[]. Scope role/claims simulation, bukan JWT validation/API transport. Pengguna melaporkan seluruh write probe/fixture dibatalkan. |
| Preview/frontend produksi | Pengguna mengonfirmasi deployment Production pada https://finanx-me.vercel.app/. Deployment dilakukan pengguna. Hasil smoke test khusus URL produksi belum dilaporkan. |
| Android fisik dan Excel/Sheets | Belum ada laporan spesifik yang membuktikan gate ini. |

## Script pemeriksaan RLS

`supabase/verify-v2-rls.sql` menerima dua UID akun Auth yang sudah diuji, tanpa token/password. Pengguna mengganti dua placeholder UID dan menjalankan seluruh script dalam SQL Editor sebagai postgres.

Script menyiapkan fixture, mengganti role ke authenticated dan claims untuk kedua arah, lalu memeriksa own SELECT, foreign SELECT/INSERT/UPDATE/DELETE, owner reassignment pada empat tabel, konteks role tanpa BYPASSRLS, dan snapshot isolation. Total 52 pemeriksaan. Semua write fixture/probe dan pergantian role/claims dibatalkan menggunakan blok exception/subtransaction; hanya tabel sesi sementara untuk ringkasan hasil yang tersisa. Tidak ada perubahan policy, grants, schema permanen, atau fungsi publik yang dilakukan script.

Validasi script oleh agent pada cluster lokal disposable: 52/52 lulus, fingerprint seluruh record tetap identik, dan kontrol negatif dengan RLS transaksi dinonaktifkan terdeteksi sebagai kegagalan. Seluruh write kontrol negatif juga dibatalkan; cluster lokal dihentikan dan dihapus. Ini belum merupakan hasil eksekusi pada Supabase pengguna.

Sesudah validasi lokal, pengguna menjalankan script pada Supabase dan mengirim hasil 52/52 lulus tanpa failed_checks. Ini memenuhi pemeriksaan kebijakan database pada target sesuai scope script; tidak memperluas bukti menjadi validasi JWT/API.

Scope: pengujian role/claims pada database bukan validasi tanda tangan JWT atau transport API. Uji frontend dua akun melengkapi bukti fungsional; jangan mengklaim script SQL ini memverifikasi JWT secara langsung.

## Tahap berikutnya

Frontend telah dideploy pengguna ke Production. Periksa login/logout pada origin produksi, persistensi setelah refresh, isolasi dua akun, satu kali simpan saat klik berulang, dan CSV sesuai filter. Pengujian Android fisik serta pembukaan CSV di Excel/Sheets tetap membutuhkan bukti perangkat/aplikasi nyata. Permintaan penyesuaian UI mobile setelah deployment dicatat terpisah; perubahan lokal tersebut belum otomatis berada di Production.
