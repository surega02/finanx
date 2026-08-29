# Finanx — Product Baseline v1.0.0

Status: final untuk rilis pertama  
Tanggal baseline: 29 Agustus 2026

## Ringkasan produk

Finanx adalah aplikasi web buku keuangan pribadi untuk mencatat pemasukan dan pengeluaran, mengelompokkan transaksi, dan membaca ringkasan bulanan. Produk mengutamakan pencatatan yang cepat, tampilan tenang, dan perhitungan yang mudah dipercaya.

Pengguna utama adalah individu yang menggunakan rupiah dan ingin mengelola transaksi pribadi tanpa kerumitan akun/dompet, anggaran, atau laporan akuntansi lanjutan.

## Platform dan teknologi aktual

- Web responsif dengan React 18 dan Vite 6.
- Mode demo menggunakan `localStorage` dan login Google simulasi.
- Mode cloud opsional menggunakan Supabase Auth, Postgres, dan Row Level Security.
- Bahasa Indonesia dan Inggris.
- Mata uang tunggal IDR.

## Kemampuan v1

- Login Google asli pada mode cloud dan login simulasi pada mode demo.
- Dashboard bulanan dengan total pemasukan, pengeluaran, saldo, perbandingan, rincian kategori, dan navigasi bulan.
- Tambah dan edit transaksi pemasukan/pengeluaran.
- Tanggal transaksi boleh di masa lalu, hari ini, atau masa depan.
- Soft delete transaksi dengan aksi urungkan.
- Daftar transaksi yang diurutkan dari tanggal terbaru.
- Filter jenis, kategori, 12 bulan pada tahun berjalan, serta pencarian keterangan.
- Pagination lokal sebanyak 10 transaksi per halaman.
- Kategori sistem dan kategori kustom per jenis transaksi.
- Soft delete kategori kustom; transaksi lama tetap menyimpan referensi kategorinya.
- Profil pengguna, pilihan bahasa, informasi versi, dan logout.
- Tata letak responsif untuk ponsel, tablet, dan desktop.

## Prinsip produk

1. Mencatat transaksi harus singkat dan jelas.
2. Semua ringkasan dihitung dari transaksi aktif sebagai satu sumber data.
3. Data pengguna cloud harus terisolasi dengan Row Level Security.
4. Antarmuka mengutamakan keterbacaan dan ketenangan dibanding kepadatan fitur.
5. Baseline v1 hanya berubah untuk perbaikan kompatibel; fitur baru direncanakan dalam requirement versi berikutnya.

## Di luar cakupan v1

- Akun atau dompet terpisah dan transfer antar akun.
- Anggaran, transaksi berulang, dan pengingat.
- Target keuangan, utang/piutang, investasi, dan kurs multi-mata-uang.
- Lampiran bukti transaksi dan ekspor data.
- Kolaborasi, peran admin, dan pelaporan lanjutan.

## Dokumen terkait

- [REQUIREMENTS-v1.md](REQUIREMENTS-v1.md) — requirement dan kriteria penerimaan v1.
- [DATA-MODEL-v1.md](DATA-MODEL-v1.md) — model data aktual mode demo dan cloud.
- [DESIGN-v1.md](DESIGN-v1.md) — baseline desain visual.
- [SUPABASE-v1.md](SUPABASE-v1.md) — setup backend cloud.

## Aturan pengembangan berikutnya

Dokumen ini tetap menjadi baseline v1. Untuk pengembangan baru, buat `REQUIREMENTS-v<versi>.md` yang menjelaskan tujuan, perubahan terhadap v1, requirement, migrasi data, dan kriteria penerimaan. Setelah scope disetujui, buat dokumen produk/desain/data-model versi baru hanya jika area tersebut berubah.
