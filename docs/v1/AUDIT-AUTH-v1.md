# Audit autentikasi FINANX V1

Tanggal: 20 Oktober 2026. Cakupan: kode frontend, store, skema SQL, dan dokumentasi v1 pada workspace saat audit. Audit tidak mengubah implementasi.

## Kesimpulan

Ditemukan 4 masalah: 2 P1 (tinggi) dan 2 P2 (sedang). Perbaikan prioritas adalah mengikat store ke identitas sesi serta memisahkan cache cloud dari demo. Isolasi database pada skema sudah menggunakan RLS, tetapi isolasi data pada browser belum konsisten.

## Temuan

> Penyebab kegagalan akun B telah dikonfirmasi dari hasil constraint database: kategori dan transaksi masih memakai primary key global `(id)`, serta referensi kategori belum menyertakan pemilik. Disiapkan migrasi `supabase/migrations/20261020_per_user_keys.sql` yang mempertahankan data dan mengganti key menjadi per pengguna. Migrasi tidak dijalankan pada Supabase produksi oleh agent.

> Tindak lanjut laporan akun B gagal memuat: RPC seed yang tidak tersedia kini memiliki fallback terbatas melalui RLS; kode error dan tahap pemuatan ditampilkan tanpa detail sensitif. Seed SQL dibuat idempoten terhadap login bersamaan. Seluruh 13 pengujian lokal dan build lulus. Penyebab pada deployment belum dipastikan; tersedia pemeriksaan metadata read-only di `supabase/diagnose-auth.sql`. Perubahan frontend dan SQL lokal belum berarti deployment/database produksi telah diperbarui.

> Status tindak lanjut, 20 Oktober 2026: keempat temuan di bawah telah ditangani pada kode lokal. Store mengikuti UID sesi aktif, cache cloud tidak lagi dipersist, hasil pemuatan lama diabaikan, dan error pemuatan ditampilkan dengan opsi pemulihan. Logout gagal juga menutup data serta menampilkan opsi ulang. Regresi otomatis tersedia melalui `npm run test:auth`; seluruh 10 pengujian dan build produksi lulus. Verifikasi OAuth/RLS pada proyek Supabase nyata belum dilakukan. Rujukan baris dan uraian berikut merekam kondisi saat audit awal, sebelum perbaikan.

### 1. [P1] Pergantian identitas sesi tidak mengganti store

Lokasi: `src/App.jsx:45–52`, `src/lib/store.js:180–183`.

Listener `onAuthStateChange` hanya memanggil `setUser`. `Store.loadCloud` hanya dipanggil saat inisialisasi. Jika sesi A berubah menjadi B tanpa pemuatan ulang halaman (misalnya login B dari tab lain), identitas tampilan menjadi B tetapi transaksi, kategori, dan `_userId` tetap milik A. Bila halaman awalnya belum memiliki sesi, login dari tab lain justru dapat membuka store lokal tanpa koneksi cloud.

Reproduksi dengan harness yang menjalankan hasil transformasi `App.jsx` dan mengganti React/Supabase dengan stub: muat sesi A, kirim sesi kosong, lalu sesi B. Hasil: `identity=B`, `storeOwner=A`, transaksi `PRIVATE_A` tetap tersedia.

Dampak: data keuangan A terlihat di bawah identitas B pada browser yang sama. Penulisan juga masih membawa `user_id=A`; RLS seharusnya menolaknya ketika token aktif milik B, sedangkan perubahan lokal tetap tersimpan karena error sinkronisasi diabaikan. Ini bukan bukti bypass RLS atau akses lintas akun secara remote.

Perbaikan: kosongkan store dan state UI yang mengandung data akun ketika UID berubah atau sesi berakhir. Muat store untuk UID baru sebelum membuka Shell; hindari memuat ulang data pada setiap refresh token bila UID tetap sama.

### 2. [P1] Cache cloud dapat dibuka melalui login demo

Lokasi: `src/lib/store.js:87`, `125–129`, `168–174`; `src/components/Login.jsx:23–26`; `src/App.jsx:73–81`.

`Store.loadCloud` menyimpan seluruh data ke key `finanx:v1`, sama dengan penyimpanan demo. Logout tidak menghapus cache tersebut. Saat aplikasi kemudian berjalan tanpa konfigurasi Supabase pada origin yang sama, `Store.load` mengambil data cloud itu, lalu login simulasi membuka identitas dan transaksi pengguna sebelumnya tanpa Google OAuth.

Reproduksi store dengan Supabase dan localStorage tiruan: jalankan `Store.loadCloud` untuk A dengan transaksi `PRIVATE_A`, kemudian panggil `Store.load`. Hasil: pemilik tetap A dan transaksi privat tersedia, tetapi `_supabase=null`. Login demo menggunakan `store.state.user` secara langsung.

Dampak: kebocoran lokal pada browser bersama dan perpindahan cloud ke demo pada origin yang sama. Cache juga tetap ada setelah logout. Eksploitasi remote maupun kebocoran token tidak dibuktikan oleh skenario ini.

Perbaikan: gunakan penyimpanan demo terpisah, jangan pernah memuat cache cloud sebagai demo, hapus cache cloud lama `finanx:v1` secara terarah, dan bersihkan data akun saat logout. Jika cache cloud dibutuhkan, gunakan namespace UID dan buka hanya setelah sesi dengan UID yang sama tersedia.

### 3. [P2] Inisialisasi lama dapat mengembalikan pengguna setelah logout

Lokasi: `src/App.jsx:32–39`, `45–52`.

Setelah `getSession` memperoleh A, aplikasi menunggu `Store.loadCloud`. Jika sesi berakhir selama penantian, listener menetapkan `user=null`, tetapi hasil pemuatan lama tetap menjalankan `setStore` dan `setUser(A)`. Flag `active` hanya melindungi unmount, bukan perubahan sesi.

Reproduksi harness: tahan penyelesaian `loadCloud(A)`, kirim sesi kosong, kemudian selesaikan pemuatan. Hasil akhir: identitas A kembali terpasang.

Dampak: Shell dapat menampilkan data A setelah sesi berakhir. Ini pemulihan state UI yang kedaluwarsa, bukan pemulihan token autentikasi; RLS tetap menjadi pengaman operasi server.

Perbaikan: beri nomor generasi pada setiap perubahan sesi, invalidasi pekerjaan lama ketika logout/UID berubah, lalu hanya terapkan hasil pemuatan yang masih sesuai dengan generasi dan UID aktif.

### 4. [P2] Kegagalan pemuatan cloud dianggap sebagai data kosong

Lokasi: `src/lib/store.js:153–168`; `src/App.jsx:31–43`.

Hasil query kategori/transaksi tidak memeriksa `.error`; `data=null` diubah menjadi array kosong, dipersist, dan dipasang sebagai store pengguna yang berhasil login. Penolakan akses atau kegagalan query dengan demikian tampak sebagai ledger kosong. Jika pemuatan justru melempar exception, `init()` tidak memiliki penanganan error/finally sehingga booting dapat tertahan.

Dampak: pengguna tidak dapat membedakan akun baru dari kegagalan akses data; cache sebelumnya dapat tergantikan oleh hasil kosong. Audit tidak menemukan bahwa jalur ini menghapus transaksi server.

Perbaikan: periksa error autentikasi dan kedua query sebelum mengganti store/cache. Tampilkan status gagal dan opsi coba lagi; pastikan loading selalu diselesaikan. Untuk sesi yang tidak sah, tutup akses UI data dan ikuti status sesi terbaru.

## Kontrol yang sudah tersedia

- Google OAuth ditangani oleh Supabase Auth pada mode cloud.
- Ketiga tabel mengaktifkan RLS dengan `USING` dan `WITH CHECK` yang membandingkan pemilik dengan `auth.uid()`.
- Foreign key kategori transaksi menyertakan `user_id`, sehingga referensi kategori lintas pemilik dibatasi skema.
- Fungsi `SECURITY DEFINER ensure_system_categories` memeriksa bahwa pemanggil memiliki UID yang diminta dan menetapkan `search_path`.
- Konfigurasi frontend menggunakan nama variabel anon/public key; panduan melarang service-role key di frontend. Nilai rahasia deployment tidak diperiksa.

## Validasi dan batas audit

- `npm run build`: lulus.
- Harness sementara menjalankan kode App yang ditransformasi dengan esbuild untuk pergantian akun, logout saat init, dan respons logout error. Store juga diuji untuk perpindahan cache cloud ke demo. Harness tidak ditambahkan ke repository dan tidak memakai akun nyata.
- SDK Supabase lokal diperiksa: pada kegagalan revokasi biasa, implementasi SDK tetap menghapus sesi lokal. Karena itu, respons logout error saja tidak cukup untuk menyimpulkan token lokal tetap tersimpan. Aplikasi tetap mengabaikan error revokasi dan tidak memberi tahu pengguna bahwa logout global mungkin gagal.
- Skema RLS diperiksa secara statis. Tidak ada pengujian terhadap database atau Google OAuth produksi, konfigurasi redirect allowlist, grant aktual, kebijakan tambahan, maupun pengaturan sesi deployment.
- `scripts/verify.mjs` berfokus pada demo dan tampilan; belum menyediakan pengujian autentikasi dua akun atau RLS. Script tersebut tidak dijalankan dalam audit ini.

## Verifikasi setelah perbaikan

1. Login A, logout, login B dari tab yang sama dan tab lain; pastikan identitas dan seluruh data selalu cocok.
2. Logout saat query masih tertunda; hasil lama tidak boleh membuka Shell kembali.
3. Pastikan cache cloud lama tidak dapat dibuka melalui demo pada origin yang sama.
4. Simulasikan error query, sesi kedaluwarsa, dan kegagalan logout; UI harus memberi status yang benar.
5. Pada proyek uji, gunakan dua JWT pengguna berbeda dan anon key untuk mencoba SELECT/INSERT/UPDATE/DELETE lintas pemilik, serta RPC dengan UID pengguna lain; semuanya harus ditolak atau menghasilkan nol baris sesuai operasi.
