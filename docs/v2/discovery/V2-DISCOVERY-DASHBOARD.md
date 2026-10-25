# FINANX V2 — Dashboard Discovery

**Working ID:** `V2-DASHBOARD-01`  
**Nama kandidat:** Balanced Financial Insights  
**Status:** Discovery — kandidat siap ditinjau; **belum** menjadi Confirmed Future Requirement  
**Tanggal dokumentasi:** 22 Oktober 2026  
**Baseline:** FINANX v1.0.0 (frozen)  
**Cakupan:** dashboard, perbandingan bulanan, tren historis, insight kategori, aturan waktu dan evaluasi kelayakan

> Dokumen ini merekam diskusi dan pilihan arah produk. Istilah **Dipilih untuk eksplorasi** tidak otomatis berarti scope V2 disetujui untuk implementasi. Dokumen V1 tidak diubah.

## 1. Konteks dan masalah

FINANX V1 telah digunakan untuk pencatatan keuangan nyata dan dinilai nyaman oleh pengguna yang memberikan umpan balik. Tidak ada kendala besar pada proses mencatat yang dilaporkan. Tiga kualitas yang harus dipertahankan adalah **cepat, akurat, dan konsisten**.

Dashboard V1 menjawab jumlah pemasukan, pengeluaran, dan selisih bulanan, serta menampilkan perbandingan keduanya dan rincian kategori. Pengguna menginginkan konteks **tren dan perbandingan antarbulan**, bukan perombakan alur transaksi. Arah desain **The Stamped Register** dipertahankan agar terasa seperti membuka buku keuangan.

**Problem statement:** Pengguna dapat melihat angka suatu bulan, tetapi belum memperoleh gambaran langsung apakah angka tersebut berubah dari bulan sebelumnya atau membentuk suatu pola dari waktu ke waktu.

**Outcome yang dituju:** Pengguna bisa membaca ringkasan bulanan seperti V1, memahami perubahan terhadap bulan lalu, dan melihat pola enam bulan, tanpa menambah langkah input transaksi.

## 2. Sumber kebenaran V1 yang tidak berubah

Acuan: `PRODUCT-v1.md`, `REQUIREMENTS-v1.md`, `DATA-MODEL-v1.md`, `DESIGN-v1.md`, `SUPABASE-v1.md`.

- Dashboard mempunyai navigasi bulan, total pemasukan, pengeluaran, saldo = pemasukan − pengeluaran, perbandingan pemasukan/pengeluaran, rincian kategori, dan empty state (`FR-DASH-01`–`05`).
- Mata uang tunggal IDR; nominal transaksi positif dan jenis `income`/`expense` menentukan arah.
- `date` adalah tanggal kalender `YYYY-MM-DD`, boleh lampau, sekarang, atau masa depan. Transaksi masa depan masuk pada bulan tanggal yang dicatat (`FR-TX-04`, `BR-06`).
- Perhitungan berasal dari **transaksi aktif** (`deleted_at` kosong); menghapus transaksi mengeluarkannya dari ringkasan.
- Pada cloud, kategori dan transaksi milik pengguna dipisahkan dengan RLS. Mode demo menggunakan `localStorage` dan cloud menggunakan Supabase.
- Desain: kertas register, garis ledger, angka IBM Plex Mono tabular, teks Inter, ink untuk pemasukan, slate untuk pengeluaran, stamp red untuk aksi/konfirmasi/fokus. Hindari dashboard kartu mengambang atau visual berwarna-warni.

**Konteks perilaku pengguna yang berpengaruh pada desain:** Gaji yang diterima di akhir suatu bulan kadang dicatat pada tanggal awal bulan berikutnya agar menjadi pemasukan bulan berikutnya. Ini tidak mengubah aturan tanggal V1 dan tidak boleh diam-diam ditafsirkan sebagai tanggal penerimaan kas yang sebenarnya.

## 3. Batas dan prinsip produk

1. **Cepat:** penambahan insight tidak menambah field wajib atau tahap pada pencatatan.
2. **Akurat:** angka dapat ditelusuri ke transaksi aktif dan rentang tanggal yang dinyatakan jelas.
3. **Konsisten:** dashboard, tren, dan kategori memakai aturan agregasi yang sama; demo/cloud menghasilkan angka sama untuk data identik.
4. **Calm ledger:** informasi baru menjadi kelanjutan halaman register V1, bukan redesign dashboard generik.
5. **Interpretasi hati-hati:** perubahan angka bukan penilaian otomatis tentang perilaku keuangan; periode parsial dan mendatang perlu penanda.
6. **Progressive disclosure:** total dan tren mudah ditemukan; pembanding periode setara dan rincian lebih dalam merupakan detail tambahan.

## 4. Rekam keputusan dan status

| ID | Keputusan / gagasan | Status | Alasan / catatan |
|---|---|---|---|
| D-01 | Memakai arah **Balanced Insight** | **Dipilih untuk eksplorasi** | Tambahan pemahaman tanpa membebani dashboard |
| D-02 | Mempertahankan **The Stamped Register** | **Arah desain disepakati** | Kesan membaca buku keuangan dipertahankan |
| D-03 | Perbandingan **total bulan vs total bulan sebelumnya** menjadi tampilan utama | **Dipilih untuk eksplorasi** | Mengikuti model bulan V1 |
| D-04 | Perbandingan **periode setara** tersedia sebagai detail tambahan | **Dipilih untuk eksplorasi** | Memberi konteks untuk bulan yang belum selesai |
| D-05 | Grafik tren berada **langsung di dashboard dan selalu terlihat** | **Dipilih untuk eksplorasi** | Manfaat tren tanpa navigasi tambahan |
| D-06 | Bulan mendatang tetap menampilkan total, tetapi **persentase perubahan disembunyikan sampai bulan dimulai** | **Dipilih untuk eksplorasi** | Mencegah interpretasi prematur, tetap mendukung transaksi masa depan |
| D-07 | Tren memakai enam bulan kalender hingga bulan dashboard terpilih | **Proposed** | Cukup informatif; tidak menambah pemilih rentang |
| D-08 | Tren menampilkan dua seri: pemasukan dan pengeluaran | **Proposed** | Menjaga keterbacaan dan dua tinta ledger |
| D-09 | Rincian kategori mendapat konteks perubahan terhadap bulan sebelumnya | **Proposed** | Memahami perubahan, bukan hanya nominal |
| D-10 | Periode setara hanya tersedia pada bulan berjalan | **Proposed / Open Question** | Mengurangi UI tambahan untuk bulan selesai/mendatang |
| D-11 | Saldo kumulatif dan saldo awal | **Open Question, di luar scope dashboard ini** | Memerlukan definisi posisi uang yang lebih luas |

Tidak ada persetujuan eksplisit bahwa seluruh kandidat di atas merupakan scope implementasi final V2.

## 5. Arsitektur informasi dan interaksi yang diusulkan

Urutan baca satu halaman, tetap menggunakan komponen/aturan visual V1:

| Urutan | Bagian | Perlakuan |
|---|---|---|
| 01 | Kepala buku dan navigasi bulan | Pertahankan V1 |
| 02 | Ringkasan: pemasukan, pengeluaran, saldo bulanan | Pertahankan angka V1; tambah konteks perubahan bulanan sebagai informasi sekunder |
| 03 | Perbandingan pemasukan vs pengeluaran | Pertahankan counterforce V1 |
| 04 | **Tren keuangan enam bulan** | Baru; selalu terlihat, tidak memerlukan expand/collapse |
| 05 | Rincian kategori pemasukan/pengeluaran | Pertahankan bagian V1; usulkan indikator perubahan kecil dan detail lanjutan |

Detail periode setara idealnya menggunakan mekanisme ekspansi ledger atau sheet yang konsisten dengan V1, bukan halaman baru atau kartu yang dominan. **Usulan ini belum menentukan komponen final.** Tidak perlu halaman analisis baru untuk cakupan awal ini.

### 5.1 Hierarki informasi pada Android

- Angka utama dan saldo harus tampil sebelum tren, lalu kategori; tidak menambah langkah menuju aksi pencatatan.
- Grafik selalu terlihat ketika bagian tren masuk area gulir, tetapi tidak mendominasi layar; tidak ada kebutuhan scroll horizontal.
- Nilai IDR lengkap ada pada angka utama/detail; label sumbu grafik boleh disingkat (misalnya `jt`) tanpa kehilangan ketepatan agregasi.
- Pertahankan kertas, garis, ink/slate, mono tabular; garis/titik/garis putus-putus lebih sesuai daripada warna baru atau kartu tinggi.

## 6. Perilaku dan aturan perhitungan (rancangan, belum final)

### 6.1 Definisi periode

- **Bulan terpilih (`M`)**: bulan kalender aktif pada navigasi dashboard.
- **Bulan pembanding (`M−1`)**: bulan kalender tepat sebelumnya, termasuk lintas tahun.
- **Bulan lampau**: sebelum bulan kalender saat ini.
- **Bulan berjalan**: bulan kalender saat ini.
- **Bulan mendatang**: setelah bulan kalender saat ini.
- Status periode menggunakan tanggal kalender lokal pengguna; nilai `date` transaksi sendiri tidak boleh bergeser akibat konversi timezone.

### 6.2 Agregasi total bulanan (default)

- Pemasukan `I(M)` = jumlah `amount` transaksi aktif bertipe `income` dengan `date` pada bulan M.
- Pengeluaran `E(M)` = jumlah `amount` transaksi aktif bertipe `expense` dengan `date` pada bulan M.
- Saldo bulanan `S(M) = I(M) − E(M)`; **bukan** saldo kas kumulatif atau total dana tersedia.
- Perubahan nominal suatu metrik `ΔX = X(M) − X(M−1)`.
- Persentase untuk metrik nonnegatif ketika `X(M−1) > 0`: `Δ% = ΔX / X(M−1) × 100%`.
- Untuk metrik pembanding = 0: persentase tidak ditampilkan; perubahan nominal/penjelasan yang tepat digunakan. Untuk saldo bertanda negatif, hindari persentase saldo yang menyesatkan: **usulan** prioritaskan perubahan nominal.
- Semua total bulanan memasukkan transaksi masa depan yang tanggalnya berada di bulan terpilih, sesuai baseline V1.

### 6.3 Perbandingan periode setara (detail)

**Proposed:** pada bulan berjalan, bandingkan tanggal 1–hari ini pada bulan terpilih dengan tanggal 1–tanggal sepadan pada bulan sebelumnya, menggunakan `transaction.date` dan transaksi aktif.

Contoh pada tanggal 20 Oktober: 1–20 Oktober versus 1–20 September. Transaksi bertanggal 25 Oktober masuk total Oktober tetapi **tidak** masuk perbandingan periode setara sampai tanggal 20 Oktober.

Jika bulan pembanding tidak memiliki tanggal yang sepadan, rentang pembanding dibatasi pada hari terakhir bulan tersebut dan rentang ditampilkan eksplisit. Hal ini membuat jumlah hari berbeda: **perlu disetujui sebagai trade-off**, terutama untuk Februari dan tanggal 29–31.

**Open Question:** perlu atau tidaknya periode setara untuk bulan lampau selain bulan berjalan. Rekomendasi sementara: tidak perlu, karena bulan lampau sudah selesai.

### 6.4 Penanganan periode mendatang

- Tampilkan pemasukan, pengeluaran, dan saldo bulanan sebagaimana V1.
- **Sembunyikan persentase perubahan** terhadap bulan sebelumnya sampai periode itu dimulai (keputusan arah pengguna).
- **Perlu difinalisasi:** apakah perubahan nominal juga disembunyikan bersama indikator perbandingan untuk bulan mendatang. Rekomendasi sementara: sembunyikan seluruh indikator perubahan, jangan hanya angka persennya, untuk menghindari dua interpretasi.
- Periode mendatang tidak otomatis berarti transaksi `planned`, `pending`, atau belum diterima; FINANX V1 belum memiliki status semacam itu.

### 6.5 Bahasa insight

Gunakan kalimat netral berbasis angka, misalnya "Pengeluaran tercatat naik 7,1% dibanding periode yang sama bulan lalu." Hindari vonis seperti "Anda boros" atau otomatis menganggap pengeluaran turun sebagai keberhasilan.

## 7. Tren historis enam bulan (Proposed)

**Rentang:** enam bulan kalender berturut-turut, inklusif bulan M, tanpa menghilangkan bulan kosong. Contoh: untuk Oktober 2026 berarti Mei–Oktober 2026; untuk Januari 2027 berarti Agustus 2026–Januari 2027.

**Seri:** `income` dengan ink dan `expense` dengan slate; tidak perlu saldo sebagai seri ketiga. Detail nilai bulanan dapat dibaca melalui interaksi yang ramah sentuh maupun alternatif teks yang dapat diakses.

**Aturan tampilan:**

- Bulan tanpa transaksi ditunjukkan sebagai Rp 0, dengan label hati-hati: "tidak ada transaksi tercatat" — bukan bukti tidak ada aktivitas finansial.
- Jika histori baru dimulai, jangan mengarang data bulan-bulan sebelumnya; bulan tanpa catatan tetap mengikuti posisi kalender.
- Data mendatang boleh muncul pada grafik berdasarkan transaksi yang tercatat, tetapi perlu tanda visual nonwarna, misalnya garis putus-putus atau label "periode mendatang".
- Bulan berjalan juga bersifat parsial walaupun totalnya dapat mengandung transaksi bertanggal lebih akhir dari hari ini; jelaskan konteks bila interpretasi dapat salah.
- Tidak perlu kontrol 3/6/12 bulan pada cakupan awal.

**Open Question:** pilihan yang paling jelas dan dapat diakses untuk membedakan bulan mendatang pada garis tren, terutama bila periode mendatang muncul sebelum/di ujung rentang grafik.

## 8. Insight kategori (Proposed)

- Pertahankan pemisahan kategori pemasukan dan pengeluaran sebagaimana V1.
- Urutkan rincian utama berdasarkan nilai bulan terpilih (terbesar dahulu), bukan berdasarkan persentase kenaikan.
- Tambahkan perubahan nominal/persentase terhadap bulan sebelumnya bila pembandingnya valid.
- Jika bulan sebelumnya bernilai nol dan bulan ini ada nilai, beri label seperti "Baru tercatat" atau tampilkan nominal tanpa persentase tak terdefinisi.
- Jika kategori di-soft-delete, transaksi **aktif** historis yang merujuk pada kategori tersebut tetap harus dihitung dan ditampilkan sesuai representasi kategori yang tersedia.
- Untuk bulan mendatang, usulan menyembunyikan indikator persentase kategori mengikuti keputusan perbandingan utama.
- Hindari tabel historis lengkap untuk semua kategori langsung di dashboard; rinciannya bisa dibuka secara opsional.

**Open Question:** apakah kategori yang hanya memiliki nilai pada bulan pembanding tetapi nol pada bulan terpilih harus tetap terlihat dalam daftar utama V2, atau hanya dalam detail perbandingan. Ini perlu diputuskan agar "kategori menghilang" tidak menyamarkan penurunan ke nol.

## 9. Edge case dan validasi

| Kasus | Perilaku/rambu usulan |
|---|---|
| Kedua bulan Rp 0 | Tidak ada perubahan; hindari `NaN` atau `∞%` |
| Pembanding Rp 0, bulan ini > 0 | Tampilkan perubahan nominal tanpa persentase |
| Bulan terpilih belum selesai | Tandai sebagai bulan berjalan; total tidak boleh dipresentasikan sebagai hasil final |
| Transaksi sudah dicatat untuk tanggal mendatang dalam bulan berjalan | Termasuk total bulan; tidak termasuk detail sampai hari ini |
| Bulan mendatang | Tampilkan total V1; sembunyikan persen perbandingan |
| Januari | Pembanding Desember tahun sebelumnya |
| Februari / tanggal 29–31 | Batas periode disesuaikan dan rentang tanggal ditunjukkan secara jelas |
| Histori belum lengkap | "Tidak ada transaksi tercatat", bukan "tidak ada pengeluaran" |
| Bulan kosong | Titik nol tetap ada dalam timeline enam bulan |
| Transaksi diedit tipe, tanggal, kategori, atau jumlah | Semua bulan/kelompok yang terpengaruh dihitung ulang |
| Soft delete / undo | Agregat dan grafik segera konsisten dengan transaksi aktif |
| Kategori dihapus | Transaksi aktif historis tetap dihitung |
| Saldo negatif | Tampilkan angka bertanda dengan benar; jangan beri persentase saldo yang ambigu |
| Nominal besar | Agregasi tetap memakai bilangan utuh rupiah; pemendekan hanya presentasi |
| Demo vs cloud | Nilai sama untuk data yang sama; isolasi pemilik cloud tetap berlaku |
| Layar Android sempit | Grafik, tooltip, dan nilai dapat dibaca tanpa horizontal scroll |
| Belum ada data transaksi sama sekali | Empty state V1 tetap berguna; komponen baru tidak menghasilkan pernyataan menyesatkan |

## 10. Dampak teknis dan kompatibilitas (penilaian awal)

**Model data:** untuk insight yang dibahas, belum terlihat kebutuhan wajib menambah tabel atau kolom. Input agregasi sudah ada: `transactions.type`, `amount`, `date`, `category_id`, `deleted_at`, serta referensi kategori. Tidak ada usulan migrasi/backfill untuk kandidat ini selama semua informasi bersifat hasil hitung.

**Logika aplikasi:** perlukan agregasi konsisten untuk periode bulanan dan rentang tanggal, serta pembandingan lintas tahun dan penanganan pembagi nol. Cegah ketidaksesuaian angka antara ringkasan, grafik, dan rincian kategori.

**Mode cloud dan keamanan:** pertahankan RLS dan kepemilikan user pada query data; jangan memproses data dari user lain. Performa memerlukan audit cara memuat transaksi pada aplikasi aktual sebelum menetapkan teknik implementasi tertentu.

**UX/performa:** uji pada Android Chrome, dengan fokus pada waktu buka, perpindahan bulan, render tren, dan interaksi sentuh. Masalah sesi login tidak menentu sedang diaudit oleh AI coding assistant secara terpisah sebagai evaluasi kualitas V1; PWA bukan prasyarat fitur dashboard ini.

**Rollback:** karena tidak perlu mengubah schema dalam cakupan awal, rollback secara konseptual adalah mengembalikan komponen/logika tampilan ke perilaku V1. Tetap diperlukan rencana rilis dan pengujian regresi jika implementasi mengubah store/agregasi bersama.

## 11. Kriteria penerimaan kandidat (belum final)

- **AC-DASH-01:** Angka utama pemasukan, pengeluaran, dan saldo sama dengan perilaku V1 untuk data yang sama.
- **AC-DASH-02:** Pada bulan yang telah dimulai, perubahan terhadap bulan sebelumnya tampil dengan label periode yang jelas.
- **AC-DASH-03:** Detail periode setara tersedia untuk bulan berjalan tanpa meninggalkan dashboard; transaksi setelah hari ini dikecualikan hanya dari detail periode setara.
- **AC-DASH-04:** Bulan mendatang tetap menampilkan total transaksi V1, dan persentase perbandingan tidak ditampilkan.
- **AC-DASH-05:** Tren enam bulan selalu terlihat pada halaman dashboard dan rentangnya berakhir pada bulan terpilih.
- **AC-DASH-06:** Bulan kalender tanpa catatan tidak dihilangkan; nilai nol ditampilkan tanpa klaim kelengkapan histori.
- **AC-DASH-07:** Pengeditan, soft delete, dan undo memperbarui angka terkait pada ringkasan, tren, dan kategori.
- **AC-DASH-08:** Kategori yang dihapus tidak menyebabkan transaksi aktif historis hilang dari perhitungan.
- **AC-DASH-09:** Angka dan hasil agregasi konsisten antara mode demo dan cloud untuk himpunan data identik.
- **AC-DASH-10:** Dashboard dapat dibaca dan digunakan pada Android Chrome tanpa scroll horizontal yang tidak perlu dan tanpa menambah langkah wajib untuk mencatat transaksi.
- **AC-DASH-11:** Bulan Januari dibandingkan dengan Desember tahun sebelumnya; pembagi nol tidak pernah menghasilkan persentase tak valid.
- **AC-DASH-12:** Bulan berjalan dan periode mendatang diberi konteks yang mencegah pembacaan angka sebagai hasil final.

## 12. Pertanyaan terbuka sebelum finalisasi V2

1. **Periode setara:** hanya bulan berjalan (rekomendasi), atau juga dapat ditinjau pada bulan historis?
2. **Tanggal 29–31:** setujukah periode pembanding dipotong pada hari terakhir bulan yang lebih pendek, meski jumlah harinya berbeda?
3. **Bulan mendatang:** apakah indikator perubahan nominal juga disembunyikan (rekomendasi), selain persentase yang sudah dipilih?
4. **Perbandingan kategori:** bagaimana memperlihatkan kategori yang turun menjadi nol dan kategori historis yang tidak aktif?
5. **Bentuk detail:** ekspansi inline atau sheet agar paling selaras dengan desain dan mudah dipakai pada Android?
6. **Grafik:** bagaimana interaksi nilai per bulan, aksesibilitas keyboard/screen reader, dan penandaan masa depan tanpa warna baru?
7. **Data historis:** apakah hanya perlu teks peringatan mengenai histori terbatas, atau butuh indikator eksplisit mulai pencatatan (yang mungkin memerlukan data tambahan)?
8. **Performa:** berapa volume transaksi yang mewakili penggunaan nyata dan target respons yang layak pada Android?
9. **Copywriting:** label tetap "Saldo Bulanan" atau perlu penjelasan tetap untuk menghindari salah arti sebagai uang tersedia?

## 13. Prioritas dan keputusan langkah lanjut

**Penilaian kelayakan awal:** kandidat **layak secara konseptual** dan relevan sebagai prioritas V2 karena menjawab permintaan nyata mengenai tren/perbandingan, memanfaatkan data yang ada, tidak mengharuskan Wallet, dan tidak memperberat input. Risiko dominan adalah **interpretasi yang keliru** atas periode parsial, masa depan, dan histori tidak lengkap; risiko implementasi meliputi performa mobile dan konsistensi agregasi.

**Belum diputuskan:** apakah keseluruhan paket Balanced Insight masuk rilis V2, detail UX final, target performa, serta acceptance criteria final.

**Langkah yang direkomendasikan:** tinjau open questions; validasi mockup pada Android dan hasil hitung dengan set contoh lintas waktu; minta persetujuan eksplisit untuk scope; kemudian turunkan ke `REQUIREMENTS-v2.md` dan `DESIGN-v2.md` hanya pada bagian yang berubah. **Jangan mengubah baseline V1.**

## 14. Di luar cakupan dokumen ini

- Rekening/Wallet, transfer antar rekening, dan saldo dana aktual.
- Saldo awal dan saldo kumulatif antarb​ulan (discovery terpisah).
- Budgeting, recurring otomatis, dan `Catat Lagi` dari histori (kandidat discovery terpisah).
- PWA, perbaikan autentikasi, ekspor data, navigasi riwayat umum, dan laporan lanjutan (jalur evaluasi tersendiri).

---

**Ringkasan satu kalimat:** Balanced Insight membuat halaman buku keuangan FINANX lebih mampu menjelaskan perubahan antarb​​ulan, tanpa mengganti identitas register atau menambah kerja pencatatan.
