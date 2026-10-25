# FINANX V2 — Historical Navigation Discovery

**Working ID:** `V2-HNAV-01`  
**Nama fitur:** Integrated Historical Navigation  
**Status:** Discovery ditutup; **kemampuan masuk V2 disetujui** pada tingkat konsep. Aturan rinci yang belum secara eksplisit dipilih tetap *Proposed* dan perlu review sebelum requirement implementasi final.  
**Tanggal dokumentasi:** 22 Oktober 2026  
**Baseline:** FINANX v1.0.0 (frozen)  
**Cakupan:** filter bulan/tahun, pemilih periode langsung pada Dashboard, navigasi kontekstual dari Dashboard ke transaksi, dan pemulihan konteks saat kembali.

> Dokumen ini merekam hasil diskusi produk, **bukan** perubahan terhadap `REQUIREMENTS-v1.md` ataupun spesifikasi implementasi final. Gunakan dokumen V1 kanonis sebagai sumber kebenaran perilaku yang sudah tersedia. Label *Confirmed Future Requirement* berlaku untuk kemampuan Integrated Historical Navigation yang dipilih pengguna; tidak otomatis mengesahkan setiap detail berstatus *Proposed*.

## 1. Latar belakang, masalah, dan tujuan

FINANX V1 telah digunakan untuk pencatatan keuangan nyata dan dirasa nyaman oleh pengguna. Prinsip pengembangan yang perlu dijaga adalah **cepat, akurat, konsisten**, dengan identitas desain **The Stamped Register**: pengalaman seolah membalik dan membaca halaman buku keuangan.

V1 menyediakan navigasi bulan sebelumnya/berikutnya pada Dashboard, tetapi filter daftar transaksi menyediakan *Semua* dan Januari–Desember untuk **tahun berjalan** tanpa mekanisme pemilihan tahun historis yang dijelaskan dalam requirement. Penelusuran ke transaksi pembentuk angka Dashboard juga belum ditetapkan sebagai navigasi kontekstual V1.

**Problem statement:** Pengguna yang ingin menelusuri transaksi lintas tahun atau memeriksa transaksi pembentuk nilai Dashboard memerlukan navigasi yang lebih terarah; berulang kali berpindah bulan dan menyusun filter secara manual kurang efisien.

**Outcome yang dituju:** Pengguna dapat langsung membuka bulan dan tahun yang dikehendaki, menjelajahi transaksi historis, berpindah dari angka Dashboard ke transaksi yang relevan, lalu kembali ke periode Dashboard sebelumnya tanpa kehilangan konteks.

## 2. Referensi dan baseline V1 yang harus dijaga

Sumber: `PRODUCT-v1.md`, `REQUIREMENTS-v1.md`, `DATA-MODEL-v1.md`, `DESIGN-v1.md`, `SUPABASE-v1.md`.

- `FR-DASH-01`–`05`: Dashboard menampilkan pemasukan, pengeluaran, saldo bulanan, rincian kategori, dan navigasi bulan sebelumnya/berikutnya/kembali ke bulan berjalan.
- `FR-LIST-01`–`06`: daftar transaksi aktif diurutkan berdasarkan tanggal terbaru lalu waktu pembuatan terbaru; filter jenis, kategori aktif, bulan (*Semua* + Januari–Desember untuk tahun berjalan), pencarian keterangan/kategori case-insensitive, dan pagination lokal 10 item per halaman.
- `FR-TX-04`, `BR-06`: tanggal transaksi `YYYY-MM-DD` dapat berada di masa lalu, hari ini, atau masa depan; transaksi masa depan ditampilkan pada bulan sesuai tanggalnya.
- Soft delete: hanya transaksi aktif (`deleted_at` kosong) masuk daftar dan agregasi; penghapusan kategori kustom tidak menghapus histori transaksi aktif.
- Mode demo menggunakan `localStorage` (`finanx:v1`); mode cloud menggunakan Supabase Auth, Postgres, dan RLS berdasarkan kepemilikan pengguna.
- Desain The Stamped Register menggunakan permukaan register-paper, garis pemisah ledger, IBM Plex Mono untuk angka/chrome, Inter untuk teks, dua tinta (ink untuk income dan slate untuk expense), serta stamp red untuk aksi dan fokus. Navigasi mobile tidak boleh bergantung pada hover.

## 3. Prinsip rancangan

1. **Evolusi navigasi, bukan halaman baru:** memanfaatkan Dashboard dan daftar transaksi yang sudah ada.
2. **Tetap cepat:** jangan menambah tahap saat pengguna mencatat transaksi baru.
3. **Konteks dapat ditelusuri:** angka Dashboard dapat mengantar pengguna ke transaksi yang membentuknya.
4. **Kembali tidak kehilangan posisi:** alur Dashboard → Transaksi → kembali memulihkan periode sebelumnya.
5. **Filter konsisten:** periode, jenis, kategori, dan pencarian bisa digabung dengan aturan yang dapat diprediksi.
6. **Layar Android sebagai prioritas pengujian:** kontrol ringkas, target sentuh memadai, navigasi Back aman, tanpa scroll horizontal yang tidak perlu.
7. **Integritas data V1:** tidak mengubah arti nominal, tanggal, status aktif, atau isolasi kepemilikan.

## 4. Rekam keputusan (decision log)

| ID | Keputusan / arah | Status | Alasan / batas |
|---|---|---|---|
| HNAV-D01 | Memilih **Integrated Historical Navigation** dibanding Basic | **Disetujui** | Selain kontrol periode, pengguna ingin navigasi dari Dashboard ke transaksi relevan. |
| HNAV-D02 | Filter **tahun dan bulan** pada halaman transaksi | **Arah disetujui** | Membuka histori lintas tahun secara langsung. |
| HNAV-D03 | Pemilih **bulan/tahun langsung** pada Dashboard, mempertahankan tombol sebelumnya/berikutnya | **Arah disetujui** | Memungkinkan lompat periode tanpa menekan tombol berkali-kali. |
| HNAV-D04 | Navigasi kontekstual **Dashboard → transaksi** | **Arah disetujui** | Memeriksa sumber angka finansial. |
| HNAV-D05 | Saat **kembali dari transaksi**, Dashboard mempertahankan periode sebelumnya | **Disetujui eksplisit** | Tidak kehilangan konteks penelusuran. |
| HNAV-D06 | Integrated Historical Navigation **masuk V2** | **Confirmed Future Requirement — tingkat kemampuan** | Ditetapkan saat penutupan diskusi fitur. |
| HNAV-D07 | *Semua Bulan* berarti semua bulan **dalam tahun terpilih** | **Proposed** | Definisi yang sederhana dan tidak ambigu. |
| HNAV-D08 | Total pemasukan/pengeluaran dan rincian kategori menjadi titik masuk kontekstual; saldo tidak | **Proposed** | Saldo adalah selisih, bukan satu jenis transaksi. |
| HNAV-D09 | Perubahan filter mereset halaman pagination ke halaman 1 | **Proposed** | Menghindari posisi halaman yang tak relevan setelah filter berubah. |
| HNAV-D10 | Klik titik pada grafik tren sebagai navigasi langsung | **Out of scope kandidat dasar / dapat ditinjau kemudian** | Prioritaskan tiga titik masuk dasar dulu. |
| HNAV-D11 | Navigasi baru ke Dashboard melalui menu utama dapat mengikuti perilaku awal V1; tindakan *kembali* memulihkan konteks | **Proposed** | Membedakan back-navigation dari navigasi baru. |

**Batas persetujuan:** pengguna memilih arah Integrated dan memulihkan periode saat kembali. Detail pemetaan interaksi, filter kategori nonaktif, state, URL, serta kebijakan default masih memerlukan review spesifikasi.

## 5. Cakupan fungsional kandidat V2

### 5.1 Filter tahun dan bulan pada halaman Transaksi

- Tambahkan pemilih **tahun** dan **bulan** ke kontrol filter daftar transaksi.
- Pengguna dapat menelusuri tahun sebelum maupun sesudah tahun berjalan apabila ada transaksi masa depan yang relevan.
- Kandidat perilaku: memilih *Semua Bulan* berarti Januari–Desember dalam tahun yang dipilih; opsi *Seluruh Histori* lintas tahun **tidak menjadi bagian dasar**.
- Filter periode tetap dapat digabung dengan jenis, kategori, dan pencarian keterangan/kategori; pagination V1 tetap 10 transaksi per halaman.
- Urutan histori tetap mengikuti V1: tanggal terbaru, lalu waktu pembuatan terbaru.
- Rentang tahun dalam UI harus mengikuti data dan aturan yang ditentukan, **jangan mengunci tahun contoh** seperti 2024–2028 dari mockup discovery.

### 5.2 Pemilih periode langsung pada Dashboard

- Navigasi bulan sebelumnya dan berikutnya **tetap tersedia**, termasuk mekanisme kembali ke bulan berjalan.
- Judul bulan/tahun dapat menjadi pintu masuk untuk memilih **bulan dan tahun** secara langsung.
- Pemilihan periode memperbarui seluruh konten Dashboard sesuai bulan terpilih: angka ringkasan, perbandingan, tren dan rincian kategori yang kelak tersedia dalam Balanced Insight.
- Pemilih periode mengikuti gaya garis ledger dan tidak membutuhkan halaman baru.
- Bulan lampau, berjalan, atau mendatang tetap mengikuti aturan tanggal transaksi V1 dan keputusan dashboard V2 yang terkait.

### 5.3 Navigasi kontekstual Dashboard → Transaksi

Pemetaan kandidat:

| Sumber di Dashboard | Filter halaman Transaksi yang dibuka |
|---|---|
| Total pemasukan | Tahun dan bulan Dashboard + jenis `income` |
| Total pengeluaran | Tahun dan bulan Dashboard + jenis `expense` |
| Rincian kategori | Tahun dan bulan Dashboard + jenis kategori + ID kategori yang dipilih |

- Filter otomatis hanya merupakan **titik awal**; setelah tiba di halaman Transaksi, pengguna bebas mengubah filter.
- Klik saldo bulanan **tidak diwajibkan** membuka transaksi: saldo adalah selisih dari dua jenis arus uang, bukan kelompok transaksi tunggal.
- Navigasi dari titik grafik tren historis tidak menjadi syarat cakupan dasar saat ini.
- Kategori nonaktif yang masih direferensikan transaksi aktif historis perlu dapat dipertahankan dalam konteks filter dari Dashboard, **tanpa** membuatnya dapat dipilih untuk transaksi baru.

### 5.4 Memulihkan konteks saat kembali

Contoh: Dashboard **September 2025** → rincian pengeluaran kategori Makanan → halaman Transaksi dengan filter terkait → tombol Back Android / navigasi kembali → Dashboard tetap **September 2025**.

- Periode Dashboard yang memulai penelusuran harus dipertahankan.
- Pemulihan harus berlaku pada alur kembali yang wajar, bukan bergantung pada tombol custom tertentu saja.
- Perilaku saat pengguna memilih **menu Dashboard sebagai navigasi baru** tidak otomatis disamakan dengan tombol Kembali; perlu keputusan spesifik berdasarkan navigasi V1.
- Implementasi dapat memakai navigation state atau parameter URL selama perilaku pengguna setara dan dapat diuji; teknik belum diputuskan.

## 6. Ringkasan alur pengguna

### Flow A — Mencari histori lintas tahun

1. Pengguna membuka halaman Transaksi.
2. Memilih tahun (misal 2025) dan bulan (misal September).
3. Daftar transaksi aktif diperbarui mengikuti periode terpilih, bersama filter lain yang berlaku.
4. Jika hasil kosong, tampilkan empty state yang jelas, bukan error.
5. Pengguna dapat mengubah periode atau filter tanpa meninggalkan halaman.

### Flow B — Lompat periode Dashboard

1. Pengguna membuka Dashboard.
2. Memilih judul bulan/tahun untuk membuka pemilih periode.
3. Memilih bulan dan tahun tujuan.
4. Dashboard diperbarui; tombol sebelumnya/berikutnya tetap berfungsi dari periode baru.

### Flow C — Menelusuri angka ke transaksi, lalu kembali

1. Pengguna membuka Dashboard pada suatu bulan historis.
2. Memilih total pemasukan/pengeluaran atau rincian kategori yang dapat ditelusuri.
3. FINANX membuka halaman Transaksi dengan filter kontekstual sesuai sumbernya.
4. Pengguna dapat memeriksa dan mengubah filter.
5. Pengguna kembali; Dashboard menggunakan bulan/tahun asal alur, bukan otomatis bulan berjalan.

## 7. Aturan bisnis dan filter

| Kasus | Perilaku kandidat |
|---|---|
| Tahun berubah pada daftar transaksi | Bulan pilihan dipertahankan jika valid; hasil disaring ulang |
| Tahun berganti (Desember ↔ Januari) | Navigasi Dashboard lintas tahun berjalan normal |
| *Semua Bulan* dipilih | Seluruh bulan dalam **tahun** yang dipilih (proposed) |
| Kombinasi filter | Jenis, kategori, pencarian, dan periode bekerja bersamaan |
| Filter berubah | Pagination kembali ke halaman 1 (proposed) |
| Tidak ada hasil | Tampilkan empty state dan kemampuan mengubah filter |
| Tanggal masa depan | Tetap dapat ditemukan, sesuai aturan V1 |
| Transaksi soft-deleted | Tidak dimunculkan dalam daftar aktif |
| Transaksi berubah tanggalnya | Hasil periode lama/baru diperbarui sesuai tanggal terkini |
| Kategori soft-deleted | Transaksi aktif historis tetap bisa ditelusuri dengan referensi lama |
| Kembali dari penelusuran | Periode Dashboard asal dipertahankan (**disetujui**) |

**Catatan:** *Semua Bulan* bukan sinonim otomatis untuk *seluruh histori* lintas tahun. Perbedaan ini harus tertera jelas di antarmuka apabila usulan ini disahkan.

## 8. Edge case dan risiko UX

1. **Kategori terhapus:** filter normal V1 menampilkan kategori aktif. Deep-link kontekstual dari Dashboard perlu mempertahankan ID kategori nonaktif yang muncul dalam transaksi lama, tanpa menambahkannya ke opsi kategori untuk transaksi baru.
2. **Filter dari konteks tidak menghasilkan hasil:** jangan menampilkan error; tetap perlihatkan periode/filter terapan agar pengguna tahu mengapa daftar kosong.
3. **Periode masa depan:** pemilih periode dan filter tahun tidak boleh melarang transaksi masa depan yang valid.
4. **Tahun tanpa transaksi:** jangan berasumsi tahun tersebut tidak valid semata-mata karena hasil kosong; definisikan cara navigasi ke tahun demikian.
5. **Pagination tidak cocok setelah perubahan filter:** reset ke halaman pertama.
6. **Kembali setelah filter diedit:** keputusan disetujui hanya menjamin periode Dashboard asal; belum ada keputusan untuk memulihkan filter transaksi yang diubah.
7. **Tombol Back Android dan history browser:** harus menghindari kembali ke periode salah atau keluar aplikasi tanpa sengaja.
8. **Browser refresh / direct URL:** perlu ditentukan apakah periode tersimpan dalam URL dan apa fallback bila state navigasi tidak tersedia.
9. **Keterangan tanggal:** gunakan `YYYY-MM-DD` sebagai tanggal kalender tanpa pergeseran timezone.
10. **Jumlah transaksi besar:** filter dan pagination lokal V1 perlu uji performa sebelum memutuskan server-side pagination.

## 9. Implikasi terhadap fitur V2 lainnya

- **Dashboard Balanced Insight:** semua ringkasan, perbandingan dan grafik tren mengikuti periode Dashboard; navigasi kontekstual memungkinkan pengguna memeriksa transaksi pembentuk total/kategori. Detail klik pada grafik tren belum menjadi cakupan dasar.
- **Smart Transaction Entry:** histori untuk analisis dan histori untuk *Catat Lagi* mempunyai tujuan berbeda. Keduanya dapat berbagi logika pencarian/akses data, tetapi tidak perlu digabung menjadi satu UI padat.
- **Saldo kumulatif + saldo awal opsional:** pemilih periode harus menampilkan saldo kumulatif sesuai bulan/titik awal yang relevan, jika fitur saldo tersebut sudah diterapkan. Histori sebelum tanggal saldo awal tetap bisa ditelusuri meski tidak masuk saldo kumulatif setelah titik awal.

## 10. Dampak desain dan aksesibilitas

- Tetap memakai desain **The Stamped Register**: kertas register, garis aturan ledger, sudut mekanis kecil; tidak membuat halaman baru atau dashboard berisi kartu mengambang.
- Judul bulan/tahun yang dapat dipilih harus memiliki penanda affordance dan fokus keyboard, bukan sekadar teks yang tak terlihat interaktif.
- Ikon dan hit area pada Android harus cukup mudah disentuh; tidak mengandalkan hover.
- Dalam navigasi balik, fokus dan scroll perlu ditangani agar pengguna memahami posisi yang dikembalikan.
- Copy filter harus eksplisit mengenai tahun dan bulan yang sedang aktif.

## 11. Data model, keamanan, kompatibilitas, migrasi

**Data persisten:** kemampuan dasar ini dapat menggunakan `transactions.date`, `type`, `category_id`, `deleted_at`, dan relasi kategori V1. **Tidak diperlukan skema database atau migrasi data baru** untuk filter dan navigasi sebagai konsep.

**Keamanan:** mode cloud tetap menggunakan RLS (`user_id` sebagai pemilik) dan tidak boleh mengakses data pengguna lain. Konteks filter dari Dashboard bukan alasan untuk melewati pembatasan tersebut.

**Mode demo:** filter, transisi navigasi, dan perhitungan harus memiliki perilaku domain yang konsisten dengan cloud.

**Kinerja:** V1 menggunakan pagination lokal 10 item; evaluasi perlu menilai apakah strategi ini masih layak saat histori membesar. Jangan menjadikan server-side pagination sebagai persyaratan baru tanpa bukti kebutuhan.

**Kompatibilitas:** `PRODUCT-v1.md`, `REQUIREMENTS-v1.md`, `DATA-MODEL-v1.md`, `DESIGN-v1.md`, dan `SUPABASE-v1.md` tetap tidak diubah. Perubahan navigasi V2 tidak boleh memodifikasi data transaksi historis.

## 12. Candidate acceptance criteria

Kriteria berikut merupakan **kandidat untuk requirement formal**, bukan seluruhnya sudah disahkan.

| ID | Acceptance criteria kandidat |
|---|---|
| HNAV-AC-01 | Pengguna dapat memilih tahun dan bulan pada halaman Transaksi, termasuk tahun lampau. |
| HNAV-AC-02 | Filter periode, jenis, kategori, dan pencarian bekerja bersama tanpa mengubah aturan pencocokan V1. |
| HNAV-AC-03 | Dashboard menyediakan pemilih bulan/tahun langsung, tanpa menghilangkan navigasi bulan sebelumnya/berikutnya. |
| HNAV-AC-04 | Setelah memilih periode Dashboard, semua nilai dan rincian mengikuti periode baru. |
| HNAV-AC-05 | Memilih total pemasukan membuka transaksi dengan filter `income` pada bulan/tahun Dashboard. |
| HNAV-AC-06 | Memilih total pengeluaran membuka transaksi dengan filter `expense` pada bulan/tahun Dashboard. |
| HNAV-AC-07 | Memilih rincian kategori membuka transaksi aktif dengan filter periode, jenis, dan kategori terkait. |
| HNAV-AC-08 | Kembali dari halaman transaksi yang dibuka secara kontekstual memulihkan bulan/tahun Dashboard semula. |
| HNAV-AC-09 | Mengubah filter mengembalikan pagination ke halaman pertama. |
| HNAV-AC-10 | Periode tanpa transaksi menampilkan empty state yang dapat dipahami. |
| HNAV-AC-11 | Transaksi bertanggal masa depan tetap dapat ditelusuri sesuai periodenya. |
| HNAV-AC-12 | Histori transaksi aktif dengan kategori nonaktif tetap dapat ditemukan lewat navigasi kontekstual. |
| HNAV-AC-13 | Tombol Back Android tidak menghilangkan konteks periode saat kembali dari transaksi ke Dashboard. |
| HNAV-AC-14 | Perilaku pencarian/filter konsisten pada mode demo dan cloud untuk data yang identik. |
| HNAV-AC-15 | Kontrol navigasi dapat diakses lewat keyboard/sentuhan, tanpa hover sebagai satu-satunya cara interaksi. |

## 13. Pertanyaan terbuka sebelum requirement implementasi final

1. **Rentang tahun:** apakah pemilih menampilkan seluruh tahun dari transaksi paling awal hingga paling akhir, memberi akses bebas untuk tahun kosong, atau menggunakan kontrol tahun numerik? Bagaimana rentang tahun masa depan?
2. **Default filter setelah masuk halaman Transaksi:** apakah V1 bulan berjalan tetap default, dan apa yang terjadi saat filter kontekstual disetel oleh Dashboard?
3. **Transaksi kategori nonaktif:** bagaimana menampilkan pilihan yang tidak lagi masuk kategori aktif tanpa menyebabkan pilihan filter hilang atau membuka kategori tersebut untuk transaksi baru?
4. **Kontrak navigasi:** state internal vs URL query; bagaimana pengaruh refresh, bookmark, dan direct-link?
5. **Navigasi kembali setelah perubahan filter:** apa saja yang perlu dipulihkan selain periode Dashboard asal (misal scroll Dashboard)?
6. **Navigasi menu Dashboard baru:** apakah selalu bulan berjalan seperti perilaku awal atau mempertahankan periode yang terakhir dibuka?
7. **Detail klik grafik tren:** tetap di luar scope dasar atau dibutuhkan untuk kelengkapan Balanced Insight?
8. **Volume data:** kapan pagination lokal perlu diperbaiki, dan apa indikator performanya pada Android?
9. **Empty state tahun kosong:** bagaimana menawarkan jalur kembali yang mudah tanpa mencampurkan *tidak tercatat* dengan *tidak ada aktivitas*?

## 14. Batas fitur dan hal yang tidak dimasukkan

**Termasuk pada konsep Integrated Historical Navigation V2:**

- Pemilih tahun dan bulan pada halaman Transaksi.
- Pemilih periode langsung pada Dashboard sambil mempertahankan navigasi bulan V1.
- Navigasi kontekstual dari total pemasukan, total pengeluaran, dan rincian kategori menuju histori terfilter (sebagai kandidat interaksi detail).
- Pemulihan periode Dashboard saat pengguna kembali dari halaman Transaksi.
- Dukungan transaksi lintas tahun dan tanggal masa depan tanpa mengubah data V1.

**Di luar cakupan dasar:**

- Halaman laporan historis yang benar-benar baru.
- Advanced query builder, saved filters/presets, atau multi-year comparison khusus.
- Kalender transaksi yang kompleks dan pengarsipan otomatis berdasarkan tahun.
- Navigasi interaktif dari setiap titik grafik tren.
- Redesign dashboard dari The Stamped Register menjadi pola SaaS card-heavy.

## 15. Ringkasan keputusan dan penutupan discovery

**Kesimpulan:** Integrated Historical Navigation dinilai layak untuk FINANX V2 dengan kompleksitas perkiraan **rendah–sedang** dan tanpa kebutuhan perubahan model data. Pengguna memilih cakupan Integrated dan secara eksplisit menyetujui bahwa **kembali dari halaman transaksi harus mempertahankan periode Dashboard asal**. Di akhir sesi, kemampuan Integrated Historical Navigation ditetapkan sebagai **Confirmed Future Requirement pada tingkat kemampuan**.

**Batasan penting:** keputusan tentang mekanisme penyimpanan navigation state, semua rincian filter, serta perilaku kategori nonaktif belum otomatis menjadi requirement final. Detail tersebut dicatat sebagai proposal/kriteria kandidat untuk review.

**Langkah selanjutnya:** gunakan dokumen ini bersama `V2-DISCOVERY-DASHBOARD.md`, `V2-DISCOVERY-SMART-TRANSACTION.md`, dan `V2-DISCOVERY-CUMULATIVE-BALANCE.md` untuk proses prioritisasi dan penyusunan `REQUIREMENTS-v2.md` setelah scope akhir diputuskan. Jangan mengubah dokumen kanonis V1.
