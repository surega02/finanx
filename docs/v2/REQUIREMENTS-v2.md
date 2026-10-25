# FINANX — Product Requirements v2.0.0

**Status:** FINAL PRODUCT SPECIFICATION — approved for implementation handoff; runtime verification gates remain  
**Tanggal dokumen:** 22 Oktober 2026  
**Target rilis:** V2 (tanggal belum ditetapkan)  
**Baseline:** FINANX v1.0.0 (frozen)  
**Review pendamping:** `V2-SCOPE-REVIEW.md`

> **Aturan status:** Lima kemampuan V2 disetujui. Pada 22 Oktober 2026, owner juga menetapkan enam keputusan finalisasi O-01 s.d. O-06 dan mendelegasikan detail yang tidak disebutkan ke praktik implementasi yang aman, sederhana, dan kompatibel V1. Ketentuan eksplisit pada §14.1–§14.6 berlaku mengungguli label [PROPOSED]/[OPEN] lama pada bagian terkait. Detail yang memerlukan audit kode tetap merupakan **verification gate**, bukan kebebasan mengubah perilaku produk. V1 tetap frozen.

## 1. Tujuan dan masalah pengguna

FINANX V1 adalah personal money ledger untuk mencatat pemasukan/pengeluaran IDR secara cepat, akurat, konsisten, dan tenang. V2 memperluas manfaat tanpa menambah langkah wajib pada pencatatan harian:

1. Pengguna bisa memahami perbandingan dan tren keuangan, bukan hanya angka satu bulan.
2. Transaksi yang mirip dengan histori bisa dicatat kembali tanpa input ulang.
3. Pengguna dapat membaca saldo kumulatif dengan pilihan dasar saldo awal yang jelas.
4. Riwayat lintas bulan/tahun dapat ditemukan dan ditelusuri dari Dashboard.
5. Pengguna dapat memperoleh salinan CSV dari transaksi pribadinya.

**Constraint UX:** tetap memakai **The Stamped Register**; register paper, ink/slate, stamp red terbatas untuk aksi, IBM Plex Mono untuk angka/chrome, Inter untuk prose, garis ledger, tanpa redesign dashboard bergaya SaaS. Android Chrome adalah konteks penggunaan penting; aksesibilitas sentuh dan keyboard tetap harus diuji.

## 2. Source of truth dan aturan V1 yang dipertahankan

Referensi kanonis: `PRODUCT-v1.md`, `REQUIREMENTS-v1.md`, `DATA-MODEL-v1.md`, `DESIGN-v1.md`, `SUPABASE-v1.md`. Semua dokumen tersebut tidak dimodifikasi.

- Model inti: User → Categories → Transactions → Monthly Summary.
- IDR saja; `Transaction.amount` integer > 0; `type` = `income` atau `expense`.
- Tanggal transaksi `YYYY-MM-DD`, boleh masa lalu, kini, atau masa depan; **tanggal pencatatan dipilih pengguna** adalah dasar agregasi ke bulan, bukan inferensi kapan uang berpindah.
- Hanya transaksi aktif (`deleted_at IS NULL`) dihitung dan ditampilkan pada agregat; soft delete/undo tetap berlaku.
- Saldo bulanan = pemasukan bulan terpilih − pengeluaran bulan terpilih (bukan uang total tersedia).
- Kategori sistem/kustom, histori kategori soft-deleted, login demo/cloud, serta kepemilikan data cloud dengan RLS tetap dipertahankan.
- Frontend React 18/Vite 6; demo `localStorage` (`finanx:v1` sebagai baseline); cloud Supabase Auth/Postgres/RLS.
- Riwayat V1 terurut tanggal desc kemudian `created_at` desc; pagination 10 item per halaman.

## 3. Scope V2

| ID fitur | Fitur | Scope approval |
|---|---|---|
| V2-DASH | Dashboard Balanced Insight | **Confirmed Future Requirement**, disetujui 22 Okt 2026 |
| V2-STE | Smart Transaction Entry | **Confirmed Future Requirement** |
| V2-BAL | Saldo Kumulatif & Saldo Awal Opsional | **Confirmed Future Requirement** |
| V2-HNAV | Integrated Historical Navigation | **Confirmed Future Requirement** |
| V2-EXP | Export Data CSV | **Confirmed Future Requirement** |

### 3.1 Explicitly out of scope

Budgeting (ditunda), Wallet/rekening, transfer antarrekening, recurring otomatis, transaksi favorit/template terpisah, AI prediction, investasi, utang/piutang, multi-currency, lampiran, laporan PDF, ekspor XLSX khusus, import/restore, backup otomatis, integrasi bank, PWA/offline-first. **PWA Discovery dilewati atas instruksi pengguna.** Audit login/persistensi sesi dilakukan terpisah sebagai evaluasi/perbaikan kompatibel V1, bukan requirement V2 ini.

## 4. Functional requirements — Dashboard Balanced Insight (V2-DASH)

**Status kemampuan: CONFIRMED; rincian operasional pada bagian ini disahkan melalui keputusan O-03 (§14.3).**

| ID | Requirement | Status |
|---|---|---|
| FR-DASH-01 | Dashboard tetap menampilkan pemasukan, pengeluaran, dan saldo bulanan dari transaksi aktif untuk bulan terpilih. | Confirmed V1 |
| FR-DASH-02 | Tampilan utama menyediakan perbandingan total bulanan terhadap bulan kalender sebelumnya. | Confirmed direction |
| FR-DASH-03 | Pada bulan berjalan, pengguna dapat mengakses **perbandingan periode setara** sebagai detail tambahan, tanpa meninggalkan Dashboard. | Confirmed direction; eligibility detail Proposed |
| FR-DASH-04 | Bulan mendatang tetap menunjukkan total tercatat tetapi **persentase perbandingan tidak ditampilkan** sampai bulan tersebut dimulai. | Confirmed decision |
| FR-DASH-05 | Grafik tren historis **selalu terlihat** di halaman Dashboard, tidak memerlukan expand atau halaman baru. | Confirmed decision |
| FR-DASH-06 | **[PROPOSED]** Tren mencakup enam bulan kalender berturut-turut yang berakhir pada bulan Dashboard terpilih; dua seri: pemasukan (ink) dan pengeluaran (slate). | Proposed |
| FR-DASH-07 | **[PROPOSED]** Rincian kategori menambahkan perubahan terhadap bulan sebelumnya, tetapi mempertahankan ringkasan kategori V1. | Proposed |
| FR-DASH-08 | **[PROPOSED]** Bulan berjalan ditandai sementara; periode masa depan ditandai sebagai periode mendatang. Angka masa depan berasal dari transaksi dengan tanggal masa depan yang memang dicatat pengguna. | Proposed |
| FR-DASH-09 | **[PROPOSED]** Perbandingan kategori dan total berbasis rentang tanggal yang dinyatakan jelas; tidak memberi penilaian normatif semisal 'boros'. | Proposed |

### 4.1 Rumus dan penanganan khusus

- Untuk metrik pemasukan/pengeluaran: `delta = total_selected - total_previous`; `delta_percent = delta / total_previous × 100%` jika `total_previous > 0`. Jika pembanding 0, **jangan bagi nol**; tampilkan perubahan nominal dan keterangan yang sesuai. **[PROPOSED]**
- Total bulanan menghitung seluruh transaksi aktif dengan `date` di bulan terkait, **termasuk transaksi bertanggal masa depan dalam bulan yang sama**. Ini melestarikan perilaku V1.
- **[PROPOSED]** Periode setara untuk bulan berjalan memakai tanggal 1 s.d. tanggal lokal hari ini vs tanggal 1 s.d. tanggal serupa pada bulan lalu, dibatasi hari terakhir bulan pembanding; tampilkan rentang aktual bila tidak sama panjang. Periode setara hanya untuk bulan berjalan; lihat §14.3.
- **[PROPOSED]** Bulan kosong bernilai 0 sebagai *tidak ada transaksi tercatat*, bukan bukti tidak ada aktivitas keuangan. Grafik tetap menampilkan posisi bulan kosong; periode masa depan diberi pembeda non-warna (contoh garis putus).
- **[RESOLVED O-03]** Kategori yang hanya tercatat pada bulan pembanding ditampilkan dalam detail perbandingan, bukan wajib masuk daftar utama; lihat §14.3.
- Saldo negatif boleh tampil sebagai hasil hitungan selisih; hindari persentase saldo jika pembanding negatif/nol yang menyesatkan.

## 5. Functional requirements — Smart Transaction Entry (V2-STE)

**Status kemampuan: CONFIRMED; rincian operasional disahkan melalui O-02 (§14.2).**

| ID | Requirement | Status |
|---|---|---|
| FR-STE-01 | Pengguna bisa memilih **Catat Lagi** dari transaksi aktif di histori. | Confirmed direction |
| FR-STE-02 | Pengguna bisa memilih **Gunakan Riwayat** dari formulir tambah transaksi. | Confirmed direction |
| FR-STE-03 | Dari formulir, pemilih histori adalah tampilan **terpisah**; memilih sumber mengembalikan pengguna ke formulir tambah terisi, bukan autosave. | Confirmed direction |
| FR-STE-04 | Kedua jalur memakai aturan create, edit field, validasi, dan save transaksi V1 yang sama. | Proposed implementation contract |
| FR-STE-05 | **[PROPOSED]** Salin `type`, `amount`, `description`, dan kategori apabila kategori masih aktif/valid. Default tanggal transaksi baru adalah hari lokal saat ini; pertahankan tanggal yang telah sengaja dipilih pada draft. | Proposed |
| FR-STE-06 | Transaksi sumber tidak berubah; transaksi hasil reuse mendapat ID baru dan masuk histori sebagai transaksi aktif biasa. | Core expected behavior |
| FR-STE-07 | Ketika kembali dari pemilih ke formulir tanpa memilih sumber, nilai draft tetap utuh. | Proposed / consistent with agreed direction |
| FR-STE-08 | Jika formulir ditutup **tanpa perubahan**, tutup langsung; jika **memiliki perubahan belum disimpan**, minta konfirmasi sebelum membuang isian. | Confirmed decision |
| FR-STE-09 | **[PROPOSED]** Jika pemilihan sumber akan menimpa field draft yang telah diubah, minta persetujuan penggantian; batal berarti mempertahankan draft. | Proposed |
| FR-STE-10 | **[PROPOSED]** Hasil pencarian sumber berdasarkan keterangan/nama kategori, case-insensitive; hanya transaksi aktif milik pengguna; urut tanggal desc kemudian created_at desc. | Proposed |
| FR-STE-11 | **[PROPOSED]** Tidak aktifnya kategori sumber tidak boleh melewati validasi kategori aktif pada saat simpan. | Proposed |
| FR-STE-12 | **[PROPOSED]** Gagal save tidak menghapus draft; lindungi dari double-submit; jangan melarang dua transaksi identik yang sengaja dibuat. | Proposed |

### 5.1 Draft dan navigasi mobile

- **[PROPOSED]** Gunakan satu sheet dengan dua tampilan internal (form dan picker) agar modal tidak bertumpuk.
- **[PROPOSED]** Tombol Back Android/Back picker harus kembali satu tingkat tanpa kehilangan draft; penutupan sheet via close/backdrop/Escape/Back mengikuti kebijakan dirty state yang sama.
- **[RESOLVED O-02]** Prefill awal dari `Catat Lagi` **tidak dianggap dirty**: baseline draft adalah isian prefilling setelah form selesai diinisialisasi. Perubahan pengguna setelahnya dibandingkan terhadap baseline tersebut. Lihat §14.2.
- **[RESOLVED O-02]** Konflik overwrite, navigasi Android, jumlah hasil, dan retry penyimpanan ditetapkan pada §14.2.
- Tidak ada draft autosave lintas sesi, scheduled recurring, favorite maupun AI suggestion dalam scope dasar.

## 6. Functional requirements — Saldo Kumulatif dan Saldo Awal (V2-BAL)

**Status kemampuan: CONFIRMED; rincian operasional disahkan melalui O-01 (§14.1).**

| ID | Requirement | Status |
|---|---|---|
| FR-BAL-01 | Saldo bulanan V1 **tidak berubah**, terpisah dari saldo kumulatif. | Confirmed V1 |
| FR-BAL-02 | Pengguna dapat melihat saldo kumulatif; saldo awal **opsional** dan pengguna **memilih tanggal efektif**. | Confirmed Future Requirement |
| FR-BAL-03 | Pengaturan saldo awal bukan field wajib pada formulir transaksi harian. | Agreed direction |
| FR-BAL-04 | **[PROPOSED]** Jika saldo awal diatur, saldo kumulatif pada akhir bulan M = saldo awal + Σ income aktif − Σ expense aktif dengan `date >= tanggal_efektif` dan `date < awal_bulan_setelah_M`. | Proposed operational rule |
| FR-BAL-05 | **[PROPOSED]** Histori sebelum tanggal efektif tetap tersedia dan memengaruhi saldo bulanan masing-masing, tetapi tidak menambah kumulatif setelah tanggal efektif. | Proposed |
| FR-BAL-06 | **[PROPOSED]** Pada periode sebelum tanggal efektif, saldo kumulatif berbasis saldo awal = *Belum tersedia*, bukan Rp 0. Untuk bulan yang mengandung tanggal awal, hitung hanya sejak tanggal efektif. | Proposed |
| FR-BAL-07 | **[PROPOSED]** Jika saldo awal belum diatur, tampilkan 'Akumulasi Transaksi' (akumulasi seluruh histori aktif), bukan label yang mengklaim uang riil tersedia. Nilai awal 0 eksplisit harus dibedakan dari `unset`. | Proposed |
| FR-BAL-08 | **[PROPOSED]** Perubahan saldo awal, tanggal efektif, atau transaksi dengan tanggal setelah efektif menyebabkan perhitungan ulang periode terdampak. | Proposed |

### 6.1 Keputusan final saldo awal (O-01)

- **[APPROVED]** Nominal saldo awal adalah integer IDR **>= 0**; `0` eksplisit berbeda dari unset. Batas aman UI dan encoding mengikuti §14.1.
- **[APPROVED]** Tanggal efektif dipilih pengguna, dapat berada di masa lalu, hari ini, **atau masa depan**, setara fleksibilitas date-only V1. Sebelum titik efektif, saldo kumulatif berbasis saldo awal berstatus *Belum tersedia*; bulan yang memuat titik awal dihitung dari tanggal tersebut.
- **[APPROVED]** Pengguna boleh mengubah atau menghapus/reset saldo awal; sebelum update atau delete harus ada konfirmasi eksplisit. Penghapusan hanya mereset pengaturan, **tidak** menghapus transaksi.
- **[APPROVED DELEGATED DESIGN]** UI pengaturan terletak di Profil/Pengaturan sebagai bagian ledger yang mengikuti `DESIGN-v1.md`, bukan tambahan field transaksi. Detail skema dan migrasi ditetapkan dalam §14.1.
- Tanpa saldo awal, tampilkan **Akumulasi Transaksi** berdasarkan semua transaksi aktif yang tercatat; saat belum ada transaksi tampilkan 0 dengan label tersebut dan penjelasan singkat, bukan klaim total uang tersedia.
- Saldo kumulatif **bukan** saldo bank, Wallet, atau total kekayaan.

## 7. Functional requirements — Integrated Historical Navigation (V2-HNAV)

**Status kemampuan: CONFIRMED; rincian operasional disahkan melalui O-04 (§14.4).**

| ID | Requirement | Status |
|---|---|---|
| FR-HNAV-01 | Halaman Transaksi menyediakan filter **tahun** dan **bulan** (termasuk Semua Bulan untuk tahun dipilih). | Confirmed direction; `Semua Bulan` semantics Proposed |
| FR-HNAV-02 | Dashboard mempertahankan tombol sebelumnya/berikutnya dan menambahkan pemilih bulan/tahun langsung. | Confirmed direction |
| FR-HNAV-03 | Total pemasukan, total pengeluaran, dan rincian kategori Dashboard dapat membuka halaman transaksi dengan periode/jenis/kategori yang sesuai. | Confirmed direction |
| FR-HNAV-04 | Kembali dari histori melalui alur navigasi kontekstual harus memulihkan periode Dashboard yang sebelumnya dipilih. | Confirmed decision |
| FR-HNAV-05 | Filter waktu harus dapat dikombinasikan dengan jenis, kategori, pencarian; perubahan filter me-reset pagination ke halaman 1. | Proposed extension of V1 |
| FR-HNAV-06 | **[PROPOSED]** Pemilih tahun menyediakan periode histori yang relevan dan transaksi future; ketika ganti tahun, bulan dipertahankan. | Proposed |
| FR-HNAV-07 | **[PROPOSED]** Histori kategori soft-deleted tetap bisa diakses lewat konteks dari dashboard meskipun tidak dipilih untuk transaksi baru. | Proposed |
| FR-HNAV-08 | **[PROPOSED]** Navigasi tab baru ke Dashboard boleh mempertahankan perilaku default V1; restoring konteks diwajibkan khusus tindakan Back dalam alur drill-down. | Proposed |

**[RESOLVED O-04]** Kontrak URL, browser Back/refresh, kategori historis, dan filter ditentukan di §14.4. Drill-down saldo kumulatif **tidak ditambahkan** pada scope ini.

## 8. Functional requirements — Export Data CSV (V2-EXP)

**Status kemampuan: CONFIRMED; rincian operasional disahkan melalui O-05 (§14.5).**

| ID | Requirement | Status |
|---|---|---|
| FR-EXP-01 | Pengguna dapat mengekspor transaksi aktif sebagai file CSV melalui halaman Transaksi. | Confirmed Future Requirement |
| FR-EXP-02 | Pengguna memilih mode **Sesuai Filter Aktif** (tahun, bulan, jenis, kategori, teks pencarian) atau **Seluruh Histori Aktif**. | Confirmed decision |
| FR-EXP-03 | Ekspor selalu memuat **semua baris hasil scope**, tidak terbatas 10 item pagination UI. | Core correctness requirement |
| FR-EXP-04 | **[PROPOSED]** Format UTF-8 CSV dengan header Inggris `date,type,category,description,amount`, tanggal ISO, `type` income/expense, integer IDR positif tanpa pemisah ribuan. | Proposed format detail |
| FR-EXP-05 | **[PROPOSED]** Urutan baris sama dengan histori V1: tanggal terbaru lalu waktu pembuatan terbaru. Kategori yang terhapus tetap dapat ditulis namanya. | Proposed |
| FR-EXP-06 | **[PROPOSED]** Hasil kosong menampilkan informasi dan tidak membuat file; kegagalan ekspor tidak boleh mengubah transaksi. | Proposed |
| FR-EXP-07 | **[PROPOSED]** Penulisan CSV menggunakan escaping standar untuk koma, kutip dan newline, serta mitigasi formula injection untuk nilai teks tidak tepercaya. | Proposed security detail, safety mandatory |
| FR-EXP-08 | File ekspor hanya dibuat atas tindakan pengguna, tidak otomatis dikirim ke server pihak ketiga. | Privacy constraint |

### 8.1 Kontrak format dan keamanan ekspor (O-05)

- **[APPROVED DELEGATED DESIGN]** UTF-8 **dengan BOM**, delimiter **koma**, header tetap `date,type,category,description,amount`, satu baris per transaksi aktif dan urutan histori V1; angka nominal integer decimal tanpa separator.
- Terapkan CSV quoting menurut RFC 4180 untuk koma, kutip, CR/LF; line ending CRLF. Semua cell teks berasal dari data pengguna diperlakukan untrusted. Cegah spreadsheet formula injection dengan escape/penetralan nilai yang dapat diinterpretasi formula (`=`, `+`, `-`, `@`, termasuk diawali whitespace/kontrol), lalu verifikasi pada Excel dan Sheets; dokumentasikan bahwa proteksi ini dapat mengubah presentasi teks saat dibuka di spreadsheet.
- Nama kategori berdasarkan referensi kategori milik pengguna yang valid; untuk kategori yang soft-deleted, tetap tampilkan nama historis. Pada mode demo, jika referensi hilang gunakan snapshot yang tersedia; bila tidak dapat ditemukan, gunakan label fallback yang eksplisit dan jangan menghilangkan baris.
- Ekspor mengambil semua hasil filter, termasuk melampaui pagination. Untuk cloud, proses harus menghindari campuran dataset yang berubah tanpa diketahui pengguna: gunakan snapshot konsisten atau deteksi perubahan dan gagalkan dengan opsi retry. Tidak ada file sebagian yang diklaim sukses.
- Batas presisi/volume serta benchmark tercantum pada §14.5–§14.6.

## 9. Requirement nonfungsional dan keamanan

| ID | Requirement | Status |
|---|---|---|
| NFR-V2-01 | Pengguna harus tetap dapat mencatat transaksi manual seperti V1 tanpa langkah wajib tambahan. | Constraint lintas fitur |
| NFR-V2-02 | Semua agregasi memakai transaksi aktif sebagai satu source of truth; hasil mode demo/cloud sama untuk data identik. | Baseline extension |
| NFR-V2-03 | Penghitungan tanggal menggunakan date-only `YYYY-MM-DD`, batas rentang jelas, dan tanggal lokal untuk 'hari ini', tanpa pergeseran zona waktu. | Baseline extension |
| NFR-V2-04 | Pemilik cloud hanya dapat mengakses data miliknya melalui RLS, termasuk pengaturan saldo awal baru. | Security requirement |
| NFR-V2-05 | Ekspor mencegah pembacaan data pengguna lain dan formula injection serta tidak mempublikasikan data keuangan secara otomatis. | Security requirement |
| NFR-V2-06 | Responsif Android Chrome dan desktop, tidak mensyaratkan hover, menggunakan fokus/keyboard, label aksesibel, dan kontrol dengan target sentuh memadai. | UX quality requirement |
| NFR-V2-07 | Penyimpanan gagal/tertunda tidak boleh membuat sukses palsu atau membuang draft yang belum tersimpan; cegah request save paralel. | Data integrity requirement |
| NFR-V2-08 | Grafik/aggregasi dan export diuji sesuai target §14.6; angka uang tidak boleh berubah akibat rounding grafik. | Approved via O-06 |
| NFR-V2-09 | Tetap memakai palet/typography/ledger rules sesuai `DESIGN-v1.md`; stamp red bukan warna metrik keuangan. | Confirmed design direction |
| NFR-V2-10 | Kompatibilitas V1: jangan menghapus/mengubah transaksi, kategori, maupun perilaku tanggal; perlakukan migrasi skema sebagai additive. | Migration constraint |

## 10. Data model dan migrasi V1 → V2

### 10.1 Persistensi saldo awal (satu-satunya perubahan domain persisten yang teridentifikasi)

**[APPROVED DATA CONTRACT — lihat §14.1]** Per pengguna dibutuhkan `opening_balance_amount` dan `opening_balance_date` yang **keduanya null ketika belum diatur**, berikut nilai timestamp update audit bila diperlukan. Nominal Rp 0 yang diatur harus bisa dibedakan dari kedua nilai null. Implementasi V2 menggunakan tabel konfigurasi terpisah yang dimiliki pengguna; detail pada §14.1. Jika diterapkan:

- Constraint: keduanya null atau keduanya terisi; `opening_balance_date` bertipe `date` (bukan timestamptz); nominal integer IDR >= 0 dengan batas aman pada §14.1.
- Cloud: FK ke pemilik, policy `auth.uid()` sesuai ownership dan privilege minimum; bila ada tabel baru, tambah index/constraint yang sesuai.
- Demo: tambah schema/state version atau migrasi aman dari `finanx:v1` yang menjaga transaksi/kategori/profil lama; **jangan** menimpa key lama secara destruktif tanpa rollback.
- Backfill: seluruh pengguna V1 berstatus *unset* (null), **bukan** opening balance 0 otomatis.
- Rollback: transaksi V1 tidak bergantung pada pengaturan saldo awal; nonaktifkan pembacaan fitur V2 sambil menjaga backup data tambahan, tanpa menghapus data transaksi.
- **[RESOLVED O-01]** Skema tujuan, batas numerik, edit/delete, dan rollout dua mode ditentukan di §14.1.

### 10.2 Fitur lain

Dashboard, Smart Entry, Historical Navigation, dan CSV tidak memerlukan perubahan wajib pada tabel transaksi maupun kategori untuk cakupan dasar. Jangan menambahkan source_transaction_id, recurring schedule, wallet ID, budget ID, atau analytics cache sebagai bagian dari scope tanpa justifikasi/keputusan baru. Tetap uji relasi kategori historis dan RLS cloud.

## 11. Acceptance criteria kandidat lintas fitur

> AC berikut menjadi kriteria verifikasi V2, dilengkapi keputusan §14. Detail implementasi masih perlu lulus audit kode, pengujian integrasi, keamanan, dan performa sebelum status siap rilis.

### 11.1 Dashboard

- **AC-DASH-01:** Bulan terpilih menunjukkan total income, expense, dan saldo identik dengan rumus V1.
- **AC-DASH-02:** Total bulanan memiliki pembanding bulan sebelumnya; Januari 2027 dibanding Desember 2026.
- **AC-DASH-03:** Bulan berjalan memungkinkan detail periode setara dengan rentang pembanding yang terlihat.
- **AC-DASH-04:** Bulan mendatang menampilkan total transaksi tercatat tetapi tidak menampilkan persentase perubahan.
- **AC-DASH-05:** Grafik tren selalu terlihat dan memperlihatkan enam bulan kalender sesuai aturan enam bulan, termasuk bulan tanpa catatan.
- **AC-DASH-06:** Edit, pindah tanggal, hapus, dan undo transaksi memperbarui ringkasan, tren, serta kategori terdampak.
- **AC-DASH-07:** Pengguna Android dapat membaca nilai, label, dan konteks bulan tanpa scroll horizontal.

### 11.2 Smart Entry

- **AC-STE-01:** Aksi Catat Lagi dari histori membuka draft transaksi baru tanpa mengubah sumber.
- **AC-STE-02:** Dari formulir tambah, Gunakan Riwayat membuka picker terpisah; pilihan kembali ke formulir terisi, tanpa menyimpan otomatis.
- **AC-STE-03:** Back dari picker tanpa memilih tidak menghilangkan isian draft.
- **AC-STE-04:** Menutup draft tidak berubah tidak meminta konfirmasi; menutup draft berubah meminta konfirmasi dan Cancel mempertahankannya.
- **AC-STE-05:** Kategori tidak aktif tidak dapat dipakai pada transaksi baru; semua validasi V1 tetap berlaku.
- **AC-STE-06:** Penyimpanan berhasil membuat ID baru dan memperbarui agregat, gagal tidak menghilangkan draft.
- **AC-STE-07:** Alur tambah manual V1 tetap tersedia tanpa langkah wajib ekstra.

### 11.3 Saldo kumulatif

- **AC-BAL-01:** Mengatur nilai dan tanggal saldo awal tidak mengubah data transaksi lama atau total bulanan V1.
- **AC-BAL-02:** Saldo awal efektif di tengah bulan hanya menambahkan transaksi sejak tanggal efektif inklusif.
- **AC-BAL-03:** Perubahan transaksi sebelum tanggal efektif tidak mengubah kumulatif setelah tanggal efektif; perubahan setelahnya memengaruhi periode yang relevan.
- **AC-BAL-04:** Histori sebelum tanggal efektif tetap bisa diakses; nilai kumulatif untuk periode sebelumnya tidak diklaim 0 jika memang tidak terhitung.
- **AC-BAL-05:** Belum mengatur saldo awal berbeda dari menetapkan angka awal 0 secara eksplisit.
- **AC-BAL-06:** Perhitungan kumulatif lintas tahun dan transaksi masa depan konsisten dengan aturan date-only.

### 11.4 Historical Navigation

- **AC-HNAV-01:** Pengguna bisa langsung memilih bulan dan tahun Dashboard, sekaligus tetap memakai prev/next.
- **AC-HNAV-02:** Halaman histori dapat memfilter tahun, bulan, jenis, kategori, dan pencarian secara bersamaan.
- **AC-HNAV-03:** Dari total pemasukan/pengeluaran atau kategori Dashboard, pengguna dibawa ke transaksi terfilter tepat.
- **AC-HNAV-04:** Back dari drill-down mengembalikan Dashboard ke bulan/tahun asal tanpa reset ke bulan berjalan.
- **AC-HNAV-05:** Filter baru mengembalikan pagination ke halaman pertama; empty state tidak dianggap error.
- **AC-HNAV-06:** Kategori historis nonaktif dan tanggal masa depan tetap dapat ditelusuri dengan aman.

### 11.5 CSV Export

- **AC-EXP-01:** Mode Filter Aktif mengekspor semua transaksi yang cocok, termasuk yang tidak terlihat karena pagination.
- **AC-EXP-02:** Mode Semua Histori Aktif mengekspor seluruh transaksi aktif pengguna tanpa mengikuti filter saat itu.
- **AC-EXP-03:** File memuat tanggal, jenis, kategori, keterangan, nominal dan seluruh nominal IDR tetap akurat sesuai keputusan serialisasi final.
- **AC-EXP-04:** Nilai dengan koma, kutip, newline, dan karakter pembuka formula diuji dengan Excel dan Google Sheets serta tetap aman.
- **AC-EXP-05:** Tidak ada data pengguna lain dalam CSV cloud; transaksi soft-deleted dikecualikan.
- **AC-EXP-06:** Ekspor gagal atau hasil kosong tidak mengubah data aplikasi; file berhasil dapat diunduh dari Android Chrome.

## 12. Test matrix dan regresi wajib

1. **V1 regression:** create/edit/delete/undo transaksi, kategori, bahasa, demo/cloud, login/logout, pagination, semua tanggal termasuk masa depan.
2. **Cross-year:** 31 Desember → 1 Januari, tren lintas tahun, filter histori lintas tahun, saldo kumulatif melintasi tahun.
3. **Opening balance mid-month:** transaksi sehari sebelum, tepat pada tanggal efektif, sesudah; edit historis; setting unset vs 0 eksplisit.
4. **Empty/partial/future:** bulan tanpa transaksi, pengguna baru, bulan berjalan, bulan mendatang, pembanding 0, total saldo negatif.
5. **Smart Entry Android:** pilih histori, back, dirty confirmation, kategori soft-deleted, operasi save terganggu, double tap.
6. **Drill-down Android:** dashboard bulan lama → kategori → histori terfilter → Back kembali ke bulan asal; browser refresh sesuai keputusan implementasi.
7. **CSV:** filter + pagination, dataset besar, formula injection, embedded newline/quotes, exact IDR integers, data akses yang sesuai kepemilikan.
8. **Ownership:** dua akun cloud tidak dapat membaca konfigurasi saldo awal, transaksi, kategori, atau ekspor akun lain.

## 13. Prioritas delivery dan dependensi (rekomendasi, belum jadwal rilis)

- **Foundation:** audit utilitas agregasi/date-only, ownership/RLS, dan filter lintas tahun.
- **User workflows:** Historical Navigation (periode & drill-down), Smart Entry (reuse), CSV Export (data scoped).
- **Insights:** Dashboard perbandingan/tren; saldo kumulatif dengan migrasi config dan perhitungan lintas tanggal.
- **Hardening:** Android navigation, regresi V1, keamanan CSV, volume data, failure recovery.

Urutan implementasi di atas **[PROPOSED]**. Tanggal rilis dan pembagian milestone belum disetujui.

## 14. Resolved decisions & technical verification gates

**Persetujuan 22 Oktober 2026:** owner menyelesaikan O-01 s.d. O-06. Di mana owner menyatakan “best practice”, keputusan konkret berikut menjadi standar handoff; perubahan perilaku pengguna atau keamanan memerlukan review ulang.

### 14.1 O-01 — Opening balance: data, tanggal, update/delete, dan pengaturan

1. **Nilai:** bilangan bulat rupiah >= 0, sampai **999.999.999.999.999** (15 digit) agar kompatibel dengan akurasi spreadsheet umum dan berada di bawah `Number.MAX_SAFE_INTEGER`. Validasi di UI dan database; jangan menyimpan nilai pecahan atau float. Nilai transaksi V1 tidak diubah. Pada batas agregasi, gunakan integer arithmetic yang tepat; jangan kehilangan presisi jika jumlah kumulatif melampaui batas aman JavaScript (gunakan BigInt/string decimal untuk agregasi bila diperlukan).
2. **Tanggal:** `YYYY-MM-DD` lokal, termasuk tanggal masa depan; pengaturan bermakna saldo sebelum transaksi pada tanggal efektif, dan transaksi pada tanggal tersebut dihitung inklusif. Untuk tanggal efektif masa depan, periode sebelumnya menampilkan `Belum tersedia` pada saldo kumulatif (saldo bulanan tetap berfungsi).
3. **Cloud schema v2:** tambah tabel `financial_settings` dengan `user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`, `opening_balance_amount bigint NULL`, `opening_balance_date date NULL`, `updated_at timestamptz NOT NULL DEFAULT now()`, constraint pasangan null/non-null, check `opening_balance_amount BETWEEN 0 AND 999999999999999` ketika terisi. Satu baris per pengguna; row-level `USING`/`WITH CHECK` hanya `auth.uid() = user_id` untuk SELECT/INSERT/UPDATE/DELETE. Gunakan migrasi additive bernomor/skema versi **2**, tanpa mengubah PK/FK transaksi/kategori V1. Jangan mengekspos service role key.
4. **Demo:** state v2 yang memuat financial settings dan migrasi non-destruktif dari `finanx:v1`; bila v2 belum tersedia, import transaksi/kategori/profil v1 dan set opening balance null. Simpan v1 sebagai rollback source selama migrasi; pengaturan v2 diisolasi sesuai mode demo, dan jangan menggabungkan data demo dengan akun cloud secara otomatis.
5. **UI:** di Profil → Pengaturan Keuangan → Saldo Awal, dalam gaya register tanpa kartu mengambang; input nominal IDR dan date picker, ringkasan efek pada saldo kumulatif. Validasi dan pesan kesalahan inline sesuai `DESIGN-v1.md`. **Sebelum setiap update atau delete/reset** nilai yang sudah tersimpan, tampilkan konfirmasi dengan nilai/tanggal lama dan baru (untuk update), atau penjelasan reset (untuk delete). Create pertama tidak perlu konfirmasi tambahan di luar aksi Simpan. Saat reset: set kedua field null atomik, bukan delete transaksi.
6. **Tanggal histori dan perubahan:** transaksi sebelum tanggal efektif tidak berkontribusi ke kumulatif berbasis saldo awal, tetapi tetap tampil di histori/saldo bulanan. Setiap perubahan pengaturan menghitung ulang semua periode terkait; jangan mengubah catatan asli. Riwayat sebelum tanggal efektif tidak diberi nilai kumulatif palsu.

### 14.2 O-02 — Dirty baseline, picker, penimpaan, dan save yang tak pasti

1. Pada `Catat Lagi`, **prefill awal adalah baseline bersih (not dirty)** setelah formulir diinisialisasi; tidak ada konfirmasi close bila tidak ada perubahan lanjutan. Baseline normal formulir kosong adalah nilai default V1. Pemilihan dari picker **setelah** baseline diinisialisasi adalah perubahan bila nilai efektif berubah.
2. **Dirty** dihitung dari perbandingan ter-normalisasi terhadap baseline semua field (type, amount, category, description, date); mengubah lalu mengembalikan tepat ke baseline berarti bersih. Validasi/tampilan transient tidak menandai dirty. `Catat Lagi` tidak menyimpan transaksi sampai pengguna menekan Simpan.
3. Form yang sudah dirty: sebelum mengganti field lewat riwayat, tampilkan konfirmasi **Gunakan data riwayat / Pertahankan isian** yang menyebut penimpaan. Jika dibatalkan, nilai dan tanggal draft tetap sama. Bila diterima, salin jenis, nominal, kategori aktif, keterangan; pertahankan tanggal yang telah dipilih secara eksplisit oleh pengguna, selain itu gunakan hari lokal saat ini. Jika kategori sumber nonaktif, kosongkan pilihan kategori dan minta input kategori valid.
4. Pemilih histori adalah tampilan internal satu sheet; tombol kembali internal dan Back Android mengembalikan form dengan draft tetap utuh. Saat sheet akan ditutup dari aksi mana pun, aturan dirty close yang sama diterapkan. Tidak menumpuk modal. Tampilkan **10 hasil awal** terurut terbaru, lalu muat hasil berikutnya bila diminta; hasil pencarian selalu dibatasi ke transaksi aktif pemilik.
5. Selama penyimpanan, cegah double submit di UI. Gunakan **client-generated stable transaction ID per satu niat create (bukan per retry)** dan operasi idempotent/upsert aman menurut constraint V1 supaya retry jaringan tidak membuat dua baris untuk satu tindakan. Jika outcome tak pasti, cek keberadaan ID yang sama sebelum retry; jangan buat ID baru. Pertahankan draft sampai sukses terkonfirmasi, dan jangan menampilkan sukses palsu. Dua pencatatan terpisah yang kebetulan identik tetap diperbolehkan.

### 14.3 O-03 — Dashboard: periode, kategori nol, tren dan masa depan

1. Tren menampilkan **enam bulan kalender berturut-turut** berakhir pada bulan Dashboard terpilih, menggunakan seri income/expense dan agregasi transaksi aktif. Bulan tanpa transaksi diplot nol dengan konteks **tidak ada transaksi tercatat**; tidak menyimpulkan nol aktivitas aktual.
2. Bulan mendatang boleh menampilkan jumlah pencatatan dan titik tren, dibedakan dengan **garis putus-putus/penanda 'periode mendatang'**. **Tidak tampilkan persentase perubahan bulanan** untuk bulan mendatang. Pada bulan berjalan, tampilkan label *sementara*.
3. Untuk detail **periode setara**, hanya sediakan ketika Dashboard memilih **bulan berjalan**: tanggal 1 s.d. hari lokal ini dibanding tanggal 1 s.d. `min(hari ini, hari terakhir bulan sebelumnya)` bulan sebelumnya. Bila panjang hari berbeda, tampilkan kedua rentang aktual dan catatan *periode pembanding lebih pendek*. Perhitungan berdasarkan `date` date-only; transaksi setelah hari ini tidak masuk detail ini walaupun masuk total bulan.
4. Kategori yang memiliki transaksi **hanya di bulan pembanding** (sekarang 0) tidak wajib muncul pada daftar utama kategori bulan terpilih; sertakan dalam **detail perbandingan** dengan nilai nol dan perubahan nominal negatif. Jika angka pembanding 0, hindari persentase tak terdefinisi. Gunakan nama historis bila kategori sudah soft-deleted.
5. Perubahan pemasukan/pengeluaran selalu dihitung `selected - previous`. Tampilkan nominal dan persentase hanya bila pembanding > 0; untuk saldo negatif atau pembanding nol tidak tampilkan interpretasi persen yang menyesatkan. Jangan memakai label moral otomatis atau warna di luar palet V1.

### 14.4 O-04 — State navigasi, refresh, dan kategori historis

1. Gunakan **URL query parameters** sebagai sumber state yang dapat dibagikan untuk periode Dashboard (`year`, `month`) dan filter halaman Transaksi (`year`, `month`, `type`, `category`, `q`, `page`), dengan parsing/validasi defensif. `Semua Bulan` berarti semua bulan dalam tahun terpilih. Filter yang berubah mereset page=1.
2. Drill-down Dashboard → Histori membawa periode/jenis/kategori ke URL tujuan, serta URL Dashboard asal sebagai `return` internal yang terverifikasi sebagai **relative same-origin route**, bukan arbitrary external redirect. Browser Back/Android Back kembali ke periode asal; refresh pada halaman manapun mempertahankan filter URL. Jika user masuk Dashboard dari navigasi utama baru, terapkan default V1 kecuali pengguna memilih periode baru secara eksplisit.
3. Kategori yang soft-deleted tetap dapat dipakai sebagai **filter baca** historis berdasarkan ID per pemilik, tetapi tidak pernah sebagai kategori input transaksi baru. Pastikan RLS/ownership berlaku; abaikan parameter filter tidak valid dengan fallback yang aman.
4. Tautan kontekstual hanya dari total income, total expense, dan kategori pada scope dasar. Saldo kumulatif dan titik grafik tidak membutuhkan drill-down tersendiri.

### 14.5 O-05 — CSV final: format, text safety, dan konsistensi ekspor

1. **UTF-8 BOM**, koma sebagai delimiter, CRLF tiap baris, header konstan `date,type,category,description,amount`; nilai `amount` sebagai digit integer positif tanpa simbol/format lokal; `date` ISO `YYYY-MM-DD`, `type` kode V1 `income`/`expense`.
2. Quote nilai ketika perlu dan gandakan setiap `"` di dalam field sesuai CSV standar. **Sebelum encoding CSV**, netralkan teks berisiko spreadsheet formula pada `category` dan `description`: setelah mempertimbangkan leading whitespace/control, nilai yang berawalan `=`, `+`, `-`, `@` diberi **awalan apostrof `'`** dan/atau sanitasi yang diuji terhadap Excel serta Google Sheets; jangan menghapus isi transaksi asli di database. Perlakukan CSV sebagai salinan analitis yang diproteksi, bukan media backup round-trip tanpa perubahan.
3. Nama kategori dari relasi kategori milik pengguna yang valid (termasuk soft-deleted); dalam demo gunakan snapshot kategori jika relasi tidak ada; bila benar-benar tidak dapat ditemukan, gunakan `Kategori tidak tersedia` agar baris tetap diekspor.
4. Hanya transaksi aktif pemilik. Export filter menggunakan **semua matching rows**, bukan halaman paginasi. Jika dataset berubah selama ekspor cloud, gunakan snapshot konsisten pada server untuk ekspor cloud atau mekanisme concurrency/version verification yang benar-benar mendeteksi perubahan isi; perbandingan jumlah baris saja tidak cukup. Jika konsistensi tidak dapat dijamin, hentikan ekspor dan tampilkan error/retry. Proses chunking untuk dataset besar harus menyusun satu CSV valid dengan header tunggal, tanpa duplikasi atau kehilangan baris.
5. Tidak melakukan ekspor atas nama pengguna tanpa aksi eksplisit; file tidak otomatis dikirim keluar. Untuk hasil kosong, tampilkan informasi tanpa file.

### 14.6 O-06 — Performance, accessibility, volume dan test gates

1. Benchmark uji minimal: **10.000 transaksi aktif** dan **100 kategori** per pengguna dengan data lintas **5 tahun**, termasuk transaksi dengan keterangan panjang, tanggal masa depan, dan kategori soft-deleted. Uji pada Android Chrome kelas menengah dan desktop. Dataset ini adalah target pengujian, bukan batas jumlah transaksi produk.
2. Sasaran terukur untuk implementasi setelah data siap di memori: pergantian bulan/refresh agregasi Dashboard **p95 <= 500 ms**; filter/pencarian histori **p95 <= 500 ms**; membuka picker/prefill **p95 <= 300 ms**. CSV 10.000 baris harus selesai tanpa browser freeze atau tab crash; ukur latensi dan heap, laporkan hasilnya. Angka ini *performance target* untuk uji, bukan jaminan di semua perangkat/koneksi.
3. Bila sumber data cloud belum dimuat, ukur **network fetch time** terpisah dari render/computation time. Paginasi/permintaan bertahap diperbolehkan tetapi tidak boleh mengubah arti hasil filter, tren, kumulatif, atau total ekspor.
4. Uji touch target minimal kira-kira **44 × 44 CSS px** untuk aksi mobile kritikal (atau area klik efektif ekuivalen); sediakan keyboard/focus indicators, label, pembaca layar, dan tidak ada scroll horizontal pada lebar viewport **360 CSS px**. Performa buruk tidak dibenarkan dengan memotong nominal, kehilangan histori, atau ekspor sebagian.
5. Gate rilis: lulus regresi V1, migrasi additive + rollback rehearsal, RLS dua akun, CSV injection lintas spreadsheet, idempotency saat jaringan gagal, serta unit/integration test untuk awal/akhir bulan, pergantian tahun, saldo awal tengah bulan dan tanggal masa depan. Jika target kinerja tidak tercapai, lakukan optimasi dan catat hasil sebelum sign-off.

**Status handoff:** Keputusan produk O-01–O-06 **terselesaikan; spesifikasi produk final untuk handoff implementasi**. Coding assistant masih wajib memvalidasi kesesuaian terhadap basis kode aktual, menuliskan migrasi SQL dan migrasi demo, serta memverifikasi pengujian/performa sebelum release.

## 15. Decision history dan referensi

- 22 Okt 2026: owner menyetujui Dashboard Balanced Insight sebagai requirement V2; melewati tahap discovery PWA; meminta review scope dan pembuatan requirement V2.
- 22 Okt 2026: owner menyelesaikan O-01–O-06: saldo awal >= 0 dan future date diperbolehkan, konfirmasi update/delete, prefill Catat Lagi tidak dirty, dan delegasi detail lainnya pada best practice yang tertulis di §14.
- Sebelumnya: Smart Entry, Saldo Kumulatif dengan saldo awal opsional, Historical Navigation, dan Export CSV telah disetujui masing-masing pada tingkat kemampuan/cakupan.
- Budgeting ditunda dari V2; Wallet, recurring otomatis dan PWA tidak ditambahkan.

**Dokumen discovery:**
- `V2-DISCOVERY-DASHBOARD.md`
- `V2-DISCOVERY-SMART-TRANSACTION.md`
- `V2-DISCOVERY-CUMULATIVE-BALANCE.md`
- `V2-DISCOVERY-HISTORICAL-NAVIGATION.md`
- `V2-DISCOVERY-EXPORT-DATA.md`

**Dokumen baseline V1:**
- `PRODUCT-v1.md`
- `REQUIREMENTS-v1.md`
- `DATA-MODEL-v1.md`
- `DESIGN-v1.md`
- `SUPABASE-v1.md`

**Dokumen pendamping:** `V2-SCOPE-REVIEW.md`. Dokumen ini menetapkan requirement produk V2 setelah keputusan O-01–O-06; **bukan pengganti** lima sumber kebenaran V1 dan bukan instruksi mengubah V1 diam-diam. Status rilis tetap bergantung pada verifikasi teknis dan pengujian.

## 16. Final consistency review (22 Oktober 2026)

- **Status:** Produk/UX/data contract disepakati untuk handoff; tidak menyatakan kode, migrasi, kinerja, atau keamanan produksi telah tervalidasi.
- **Precedence:** §14 dan definisi final dalam `DATA-MODEL-v2.md` / `DESIGN-v2.md` mengkonkretkan butir [PROPOSED] historis dalam §§4–8. Tag [PROPOSED] lama adalah jejak discovery, **bukan** keputusan produk yang masih terbuka apabila telah dicakup O-01–O-06.
- **Cloud CSV consistency:** hitung jumlah baris sebelum/sesudah tidak cukup untuk membuktikan snapshot; strategi snapshot/version verification harus diuji saat ada update/delete/insert bersamaan. Jangan klaim ekspor lengkap sebelum diverifikasi.
- **Demo rollback:** `finanx:v1` yang dipertahankan merupakan snapshot migrasi, bukan replika otomatis perubahan V2. Wajib sediakan prosedur pemulihan/ekspor data V2 sebelum rollback demo tanpa kehilangan transaksi baru.
- **Technical gates:** audit bentuk state dan routing aplikasi V1, skema yang benar-benar terpasang, testing SQL/RLS, idempotency, CSV safety, dan performa tetap wajib sebelum rilis. Hasil audit yang memerlukan perubahan kontrak pengguna harus dikembalikan untuk product review; bukan diubah diam-diam.
