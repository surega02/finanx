# Data Model — Finanx v1.0.0

Status: baseline implementasi rilis pertama  
Backend cloud: Supabase Postgres

## 1. Mode penyimpanan

Finanx v1 mempunyai dua mode dengan bentuk domain yang sama:

- Mode demo menyimpan state JSON pada `localStorage` dengan key `finanx:demo:v1`.
- Mode cloud membaca dan menulis tabel Supabase serta memakai Supabase Auth sebagai identitas pengguna. Data keuangan cloud hanya berada dalam memori sesi aplikasi dan tidak dipersist ke cache demo. Penyimpanan sesi/token tetap ditangani Supabase Auth.
- Key lama `finanx:v1` dibersihkan. Saat membuka demo, data lama hanya dimigrasikan bila UID adalah `demo-uid`; cache beridentitas cloud tidak dibuka sebagai demo.

## 2. Model domain aplikasi

```text
User
├── uid
├── name
├── email
├── photo
├── created_at
└── updated_at

Category
├── id
├── type: income | expense
├── name
├── nameId
├── icon
├── source: system | user
├── created_at
├── updated_at
└── deleted_at

Transaction
├── id
├── type: income | expense
├── amount: integer > 0
├── date: YYYY-MM-DD
├── category
├── description
├── created_at
├── updated_at
└── deleted_at
```

Pada state lokal, `Transaction.category` berisi snapshot minimum kategori (`id`, `source`, `name`, `nameId`, `icon`) agar histori tetap dapat ditampilkan.

## 3. Skema Supabase

### profiles

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | uuid | PK, FK ke `auth.users.id` |
| `name` | text | opsional |
| `email` | text | opsional |
| `photo_url` | text | opsional |
| `language` | text | default `id` |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |

### categories

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | text | bagian PK gabungan |
| `user_id` | uuid | bagian PK gabungan, FK ke pemilik |
| `type` | text | `income` atau `expense` |
| `name` | text | wajib |
| `name_id` | text | nama Indonesia opsional |
| `icon` | text | wajib |
| `source` | text | default `user` |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |
| `deleted_at` | timestamptz | kosong ketika aktif |

Index: `(user_id, type)`.

### transactions

| Kolom | Tipe | Aturan |
| --- | --- | --- |
| `id` | text | bagian PK gabungan |
| `user_id` | uuid | bagian PK gabungan, FK ke pemilik |
| `type` | text | `income` atau `expense` |
| `amount` | bigint | lebih besar dari nol |
| `date` | date | wajib; masa depan diperbolehkan |
| `category_id` | text | bersama `user_id` menjadi FK ke kategori pemilik |
| `description` | text | opsional |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |
| `deleted_at` | timestamptz | kosong ketika aktif |

Index: `(user_id, date desc)`.

## 4. Relasi

```text
auth.users 1 ─── 1 profiles
auth.users 1 ─── * categories
auth.users 1 ─── * transactions
categories 1 ─── * transactions
```

Semua baris cloud memiliki kepemilikan langsung atau tidak langsung kepada satu pengguna autentikasi.

## 5. Row Level Security

- `profiles`: `auth.uid() = id`.
- `categories`: `auth.uid() = user_id`.
- `transactions`: `auth.uid() = user_id`.
- Fungsi `ensure_system_categories(uid)` hanya bekerja jika `auth.uid() = uid`.

Kebijakan lengkap dan fungsi seed berada di `supabase/schema.sql`.

## 6. Operasi data

- Create/update menggunakan `upsert` dari store aplikasi.
- Delete transaksi dan kategori adalah soft delete melalui `deleted_at`.
- Daftar dan dashboard mengabaikan record dengan `deleted_at` terisi.
- Dashboard menghitung agregat di sisi aplikasi untuk rentang awal bulan inklusif hingga awal bulan berikutnya eksklusif.
- Tanggal disimpan sebagai nilai date-only untuk menghindari pergeseran zona waktu.

## 7. Catatan migrasi versi berikutnya

Setiap requirement baru yang mengubah skema wajib menentukan:

1. tabel/kolom/index/policy yang berubah;
2. kompatibilitas terhadap data `finanx:v1` dan database v1;
3. backfill atau transformasi data;
4. strategi rollback;
5. versi schema tujuan.

Jangan mengubah dokumen baseline ini untuk fitur baru; buat `DATA-MODEL-v<versi>.md` bila model data berubah.
