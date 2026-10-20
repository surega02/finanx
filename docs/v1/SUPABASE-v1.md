# Setup Supabase — Finanx v1.0.0

Status: panduan backend cloud baseline v1.

Finanx berjalan dalam mode demo secara default. Environment Supabase mengaktifkan Google OAuth asli, database Postgres, dan isolasi data melalui Row Level Security.

## 1. Buat proyek

Buat proyek Supabase dan simpan Project URL serta anon/public key dari pengaturan API proyek.

## 2. Pasang skema v1

Pada proyek baru, buka SQL Editor lalu jalankan seluruh isi [supabase/schema.sql](supabase/schema.sql). Skema membuat:

- `profiles` untuk identitas tampilan dan bahasa;
- `categories` untuk kategori sistem dan kustom per pengguna;
- `transactions` untuk transaksi per pengguna;
- index untuk akses kategori dan transaksi berdasarkan tanggal;
- kebijakan RLS untuk semua tabel;
- fungsi `ensure_system_categories(uid)` untuk seed kategori bawaan.

Kategori dan transaksi memakai primary key gabungan `(user_id, id)`. Struktur ini penting karena setiap pengguna memiliki ID kategori sistem yang sama, tetapi datanya tetap terisolasi.

> `schema.sql` adalah skema instalasi baru v1. Jika pernah memasang skema prototipe sebelum v1.0.0, lakukan backup dan migrasikan primary key/foreign key lama sebelum memakai skema ini. Jangan menjalankan perubahan destruktif langsung pada data produksi.

## 3. Aktifkan Google OAuth

1. Buka Supabase Dashboard → Authentication → Providers → Google.
2. Buat OAuth Client bertipe Web Application di Google Cloud Console.
3. Tambahkan redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Masukkan Client ID dan Client Secret ke provider Google di Supabase.

## 4. Environment lokal

Salin `.env.example` menjadi `.env`, lalu isi:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Restart `npm run dev` setelah mengubah environment.

## 5. URL aplikasi

Pada Authentication → URL Configuration:

- isi Site URL dengan origin produksi aplikasi;
- tambahkan `http://localhost:5173` sebagai redirect URL pengembangan;
- tambahkan origin preview yang memang digunakan.

## 6. Perilaku mode

- Environment lengkap: mode cloud, Google OAuth asli, data dibaca dari dan disinkronkan ke Supabase.
- Environment kosong/tidak lengkap: mode demo, login simulasi, data contoh dan perubahan disimpan di `localStorage`.
- Banner data contoh hanya tampil pada mode demo.
- Store cloud baru dibuka setelah data untuk UID sesi aktif berhasil dimuat. Pergantian akun dan logout menutup store lama serta membatalkan penerapan hasil pemuatan yang kedaluwarsa.
- Data keuangan cloud tidak disimpan dalam `localStorage`; mode demo menggunakan key terpisah `finanx:demo:v1`. Supabase Auth tetap mengelola penyimpanan sesi/token.
- Kegagalan pemuatan cloud menampilkan status gagal dengan pilihan coba lagi atau keluar. Kegagalan logout menutup data dan menampilkan pilihan mengulangi logout.

## 7. Pemeriksaan minimum

1. Login dengan dua akun Google berbeda.
2. Pastikan kedua akun mendapatkan kategori sistem masing-masing.
3. Buat transaksi pada tiap akun dan pastikan data tidak saling terlihat.
4. Buat transaksi bertanggal masa depan dan pastikan tersimpan sebagai `date` tanpa pergeseran hari.
5. Soft delete transaksi dan pastikan `deleted_at` terisi.
6. Ubah bahasa dan pastikan profil menyimpan pilihan bahasa.

## 8. Keamanan

- Anon key boleh digunakan frontend bersama RLS; jangan pernah meletakkan service-role key di aplikasi.
- Semua operasi data harus dijalankan sebagai pengguna yang terautentikasi.
- Fungsi seed memverifikasi bahwa `auth.uid()` sama dengan parameter pengguna.
- Uji kebijakan RLS setiap kali skema atau requirement versi berikutnya berubah.

## 9. Regresi autentikasi lokal

Jalankan `npm run test:auth` untuk menguji pergantian identitas, sesi lintas tab melalui event SDK tiruan, hasil pemuatan kedaluwarsa, error sesi/query/logout, isolasi cache demo, dan penonaktifan store lama. Pengujian ini menggunakan client tiruan; pemeriksaan OAuth dan RLS dengan dua akun nyata tetap diperlukan pada proyek Supabase uji.

## 10. Akun kedua gagal memuat data

Pesan pemuatan gagal belum membuktikan penyebabnya. Frontend menampilkan tahap dan kode error tanpa detail SQL atau data pribadi. Untuk pemeriksaan struktur, jalankan `supabase/diagnose-auth.sql` di SQL Editor; script hanya membaca metadata.

- `categoriesSeed / 23505`: periksa constraint unik kategori. Primary key kategori harus `(user_id, id)`, bukan `id` saja. Duplikasi seed pada login bersamaan juga dapat memicu kode ini pada RPC lama.
- `categoriesSeed / 42P10`: target konflik `(user_id, id)` belum mempunyai constraint unik yang sesuai. Perlu migrasi skema lama setelah meninjau hasil diagnosis dan melakukan backup; jangan menghapus tabel untuk mengatasi login.
- `42501`: periksa grant dan kebijakan RLS. Jangan menonaktifkan RLS.
- RPC tidak ditemukan (`PGRST202` atau `42883`): frontend mencoba seed langsung melalui client pengguna dengan konflik `(user_id, id)` dan tetap tunduk pada RLS. Error lain tidak memicu fallback.
- `UNKNOWN`: kegagalan belum memiliki kode database yang dikenali; periksa respons request gagal di Network browser tanpa membagikan token atau header Authorization.

Seed RPC pada `schema.sql` kini memakai `ON CONFLICT (user_id, id) DO NOTHING`, sehingga aman dipanggil bersamaan dan dapat melengkapi kategori sistem yang belum ada. Perubahan file SQL lokal tidak otomatis memperbarui RPC database yang sudah dipasang. Setelah memastikan key gabungan sudah benar, perbarui definisi fungsi `ensure_system_categories` dari schema tersebut pada proyek yang digunakan.

Perubahan frontend juga harus dideploy agar pesan diagnosis dan fallback tersedia pada aplikasi Vercel. Diagnosis produksi tetap diperlukan bila akun kedua gagal setelah deployment.

## 11. Migrasi skema lama dengan primary key ID global

Jika hasil diagnosis menunjukkan `categories_pkey PRIMARY KEY (id)` dan `transactions_pkey PRIMARY KEY (id)`, jalankan migrasi khusus berikut, bukan mengulang `schema.sql` yang menggunakan `CREATE TABLE IF NOT EXISTS`:

1. Buat backup database dan lakukan saat trafik rendah; migrasi mengunci kategori/transaksi selama perubahan constraint.
2. Buka `supabase/migrations/20261020_per_user_keys.sql`, salin seluruh isinya ke Supabase SQL Editor, lalu jalankan sebagai satu script.
3. Jalankan kembali `supabase/diagnose-auth.sql`. Kedua primary key harus `(user_id, id)` dan foreign key kategori transaksi harus `(user_id, category_id)` ke kategori `(user_id, id)`.
4. Login akun B dan tekan Coba lagi. Pastikan kategori bawaan tersedia, data A tidak terlihat, lalu login kembali sebagai A untuk memastikan data lamanya tetap tersedia.

Migrasi juga memperbarui RPC seed dalam transaksi yang sama. Data kategori/transaksi tidak dihapus atau dipindahkan antar akun; RLS dan foreign key ke `auth.users` dipertahankan. Semua perubahan dibatalkan bila pemeriksaan awal atau perubahan constraint gagal. Jika ditemukan transaksi yang merujuk kategori milik akun lain, migrasi sengaja berhenti agar data ditinjau tanpa menebak pemiliknya. Jika terjadi lock timeout, ulangi pada waktu trafik rendah.

Validasi lokal pada PostgreSQL dengan fixture skema lama mencakup pemeliharaan data, seed dua akun, pemanggilan seed berulang, pengulangan migrasi, keberadaan RLS, penolakan foreign key lintas pemilik, serta rollback pemeriksaan awal. File SQL pengujian sementara telah dihapus setelah validasi selesai.
