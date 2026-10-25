# FINANX V2 — Smart Transaction Entry Discovery

**Working ID:** `V2-STE-01`  
**Nama fitur:** Smart Transaction Entry — Catat Lagi / Gunakan Riwayat  
**Status:** Discovery selesai untuk konsep inti; **kemampuan masuk V2 disetujui**, rincian kandidat masih perlu review sebelum requirement implementasi final  
**Tanggal dokumentasi:** 22 Oktober 2026  
**Baseline:** FINANX v1.0.0 (frozen)  
**Cakupan:** pemanfaatan histori transaksi untuk membuat transaksi baru melalui histori maupun formulir tambah; pemilih histori; UX mobile; prefill; draft; validasi; edge case

> Dokumen ini merekam hasil diskusi produk, bukan spesifikasi implementasi final. **Confirmed Future Requirement** berlaku untuk kemampuan Smart Transaction Entry sebagai bagian V2; tidak berarti seluruh detail yang berstatus *Proposed* sudah disahkan. Jangan mengubah dokumen baseline V1.

## 1. Konteks, masalah, dan tujuan

FINANX V1 telah dipakai mencatat keuangan nyata dan dinilai nyaman; pengguna tidak melaporkan kendala besar pada input sehari-hari. Tiga kualitas inti yang harus dipertahankan adalah **cepat, akurat, konsisten**. Pengguna menginginkan pengembangan yang relevan tanpa mengubah proses pencatatan sederhana menjadi lebih berat.

Contoh kebutuhan nyata: pembelian telur 1 kg sekitar Rp 26.000 dapat berulang kira-kira seminggu sekali. Pengguna **tidak terutama meminta transaksi otomatis berdasarkan jadwal**, melainkan ingin menggunakan kembali informasi dari transaksi yang sudah dicatat agar tidak harus menginput hal yang sama dari awal. Harga dan tanggal bisa berubah.

**Problem statement:** Saat mencatat transaksi serupa, pengguna mengulangi pengisian field yang sebenarnya sudah tersedia di histori FINANX.

**Outcome:** Pengguna dapat memilih transaksi sebelumnya, meninjau/mengubah data yang digunakan kembali, lalu secara sadar menyimpan transaksi **baru**, dengan alur manual V1 tetap tersedia tanpa langkah wajib tambahan.

## 2. Acuan dan batas V1

Acuan: `PRODUCT-v1.md`, `REQUIREMENTS-v1.md`, `DATA-MODEL-v1.md`, `DESIGN-v1.md`, `SUPABASE-v1.md`.

- V1 mendukung tambah/edit transaksi jenis `income`/`expense`; nominal bilangan bulat IDR lebih besar dari nol; kategori aktif sesuai jenis, tanggal `YYYY-MM-DD` wajib, keterangan opsional (`FR-TX-01`–`08`).
- Tanggal transaksi boleh di masa lalu, hari ini, atau masa depan. Pengguna kadang mencatat gaji akhir bulan sebagai transaksi tanggal awal bulan berikutnya; kemampuan ini **harus tetap bisa dilakukan**.
- Daftar transaksi aktif mengikuti tanggal terbaru, kemudian waktu pembuatan terbaru; pencarian V1 mencocokkan keterangan dan nama kategori secara case-insensitive (`FR-LIST-01`, `FR-LIST-05`).
- Penghapusan menggunakan `deleted_at` (soft delete); histori kategori pada transaksi lama dipertahankan, tetapi kategori yang telah dihapus tidak dapat dipilih untuk transaksi baru.
- Mode demo menyimpan data di `localStorage`; cloud menggunakan Supabase Auth, Postgres dan RLS menurut pemilik. Data pengguna tidak boleh bocor antar akun.
- The Stamped Register: permukaan kertas register, aturan garis ledger, IBM Plex Mono untuk angka/chrome, Inter untuk teks, ink untuk pemasukan, slate untuk pengeluaran, stamp red untuk aksi/fokus, sudut mekanis kecil; sheet transaksi adalah komponen V1.

## 3. Prinsip desain fitur

1. **Reuse, bukan otomasi:** pemilihan histori hanya mengisi draft; tidak langsung menyimpan.
2. **Alur manual tetap cepat:** FAB tetap membuka formulir tambah normal; penggunaan histori opsional.
3. **Dua pintu masuk, satu formulir:** dari daftar histori dan dari formulir tambah; tidak membangun dua logika penyimpanan.
4. **Kontrol pengguna:** semua field tetap dapat diperiksa/diedit sebelum save.
5. **Tidak mengubah sumber:** transaksi terdahulu tetap utuh; yang baru memiliki ID sendiri.
6. **Perlindungan draft:** navigasi tidak boleh menghapus input diam-diam; konfirmasi ketika membuang perubahan yang belum disimpan.
7. **Konsistensi keamanan/data:** hanya histori yang sah dimiliki pengguna, validasi V1 tetap berlaku, dan hasil sama secara domain di mode demo/cloud.

## 4. Rekam keputusan (decision log)

| ID | Keputusan | Status | Alasan / batas |
|---|---|---|---|
| STE-D01 | Smart Transaction Entry **harus ada pada V2** | **Confirmed Future Requirement — tingkat kemampuan** | Kebutuhan eksplisit dari pengguna untuk mempercepat input |
| STE-D02 | Akses dari **histori transaksi** melalui aksi **Catat Lagi** | **Disetujui** | Memakai transaksi yang sedang dibaca |
| STE-D03 | Akses dari **formulir tambah** melalui aksi **Gunakan Riwayat** | **Disetujui** | Bisa mencari contoh transaksi saat sudah berada dalam alur pencatatan |
| STE-D04 | Jalur formulir memakai **pemilih histori terpisah**, lalu kembali ke formulir setelah dipilih | **Disetujui** | Ruang pencarian lebih nyaman pada Android |
| STE-D05 | Saat menutup formulir, **konfirmasi hanya jika terdapat perubahan belum disimpan**; jika bersih langsung tutup | **Disetujui** | Menjaga cepat sekaligus mencegah kehilangan input |
| STE-D06 | Satu sheet dengan dua view internal, bukan modal bertumpuk | **Proposed** | Navigasi/draft/fokus lebih sederhana |
| STE-D07 | Satu formulir V1 dan mekanisme validasi/save bersama bagi dua pintu masuk | **Proposed** | Menghindari perilaku yang berbeda |
| STE-D08 | Prefill jenis, nominal, kategori valid, dan keterangan; tanggal baru default hari ini | **Proposed** | Mengurangi input tanpa mengulang tanggal lama |
| STE-D09 | Jika memilih histori berisiko menimpa draft yang telah diubah, minta konfirmasi sebelum penggantian | **Proposed** | Mencegah hilangnya perubahan |
| STE-D10 | Draft disimpan selama sheet aktif; tidak perlu persistensi lintas refresh/sesi pada kemampuan dasar | **Proposed** | Menghindari manajemen draft persisten tambahan |
| STE-D11 | Pencarian histori menurut keterangan/kategori, urutan transaksi terbaru | **Proposed** | Konsisten dengan mental model V1 |
| STE-D12 | Recurring otomatis, AI prediction, template/favorit, dan autosave tidak masuk kemampuan dasar | **Proposed sebagai out-of-scope dasar** | Kompleksitas tidak diperlukan untuk use case awal |

**Catatan status:** User telah menutup brainstorming konsep Smart Transaction Entry dan meminta dokumentasi. Hal ini **tidak otomatis mengesahkan semua aturan Proposed** sebagai requirement final.

## 5. Lingkup kandidat fitur

### 5.1 Jalur A — Catat Lagi dari histori

1. Pengguna melihat transaksi **aktif** pada daftar/histori.
2. Pengguna menjalankan aksi sekunder **Catat Lagi**.
3. FINANX membuka **formulir tambah transaksi** (bukan edit) dengan nilai awal dari sumber yang valid.
4. Pengguna mengubah field jika diperlukan.
5. Pengguna menekan Simpan; sistem menjalankan validasi dan proses create transaksi V1.
6. Jika berhasil, transaksi baru tercatat dengan ID baru; transaksi sumber tidak berubah.

**Mobile:** jangan menambahkan banyak tombol permanen ke baris ledger. Kandidat pola: aksi Catat Lagi melalui menu tindakan per baris yang nyaman disentuh dan tidak bergantung pada hover. Penempatan konkret harus ditinjau pada UI aktual V1.

### 5.2 Jalur B — Gunakan Riwayat dari formulir tambah

1. FAB membuka formulir tambah V1 seperti biasa.
2. Pengguna dapat memilih **Gunakan Riwayat** sebagai aksi sekunder opsional.
3. Pemilih histori terpisah muncul, mengutamakan pencarian dan daftar transaksi yang dapat dipakai.
4. Pengguna memilih sumber atau kembali tanpa memilih.
5. Ketika memilih, pengguna kembali ke formulir dengan nilai yang diisi sesuai aturan prefill, setelah resolusi konflik draft jika ada.
6. Pengguna meninjau/mengubah lalu menyimpan melalui alur create yang sama.

**Tidak boleh:** FAB secara otomatis memaksa pengguna melewati pencarian histori pada setiap transaksi baru.

### 5.3 Model navigasi dalam sheet — proposal

State konseptual: `add-form` ↔ `history-picker`, dengan satu draft formulir yang bertahan selama perpindahan.

| Aksi | Hasil yang diusulkan |
|---|---|
| Buka Gunakan Riwayat | Buka view pemilih; simpan state draft saat ini |
| Kembali/Cancel dari pemilih | Kembali ke formulir; draft tidak berubah |
| Pilih transaksi sumber | Validasi sumber; bila perlu konfirmasi penggantian; terapkan prefill; kembali ke formulir |
| Tombol Back Android dari pemilih | Kembali ke form, tidak keluar aplikasi/hilang draft |
| Tombol Back Android dari form | Ikuti alur tutup sheet dan kebijakan dirty draft |
| Close/backdrop/Escape pada form | Jika bersih tutup; jika kotor konfirmasi buang perubahan |
| Berhasil save | Bersihkan draft sementara dan tutup sesuai pola V1 |
| Gagal save | Tetap di form dan pertahankan draft |

Perilaku tombol Back Android dan history browser **harus diuji pada Chrome Android**, termasuk keyboard terbuka; penanganan yang tepat bergantung pada implementasi sheet dan navigasi V1. Fokus pencarian saat membuka pemilih dan fokus ketika kembali perlu diuji agar keyboard tidak muncul tidak sengaja.

## 6. Pencarian dan daftar sumber — rancangan

- Hanya gunakan **transaksi aktif milik pengguna saat ini**; transaksi terhapus tidak ditawarkan dari pencarian aktif.
- Pencarian dapat mencocokkan `description` dan nama kategori secara case-insensitive, selaras pencarian V1.
- Ketika pencarian kosong, tampilkan transaksi terbaru sehingga pengguna tidak harus mengetik untuk mulai memilih.
- Urutkan tanggal transaksi terbaru, lalu waktu pembuatan terbaru (seperti V1). Nilai tanggal masa depan sah sehingga dapat berada di bagian atas.
- Setiap hasil setidaknya memperlihatkan **jenis**, nominal, kategori, tanggal sumber, dan keterangan bila ada, supaya pilihan tidak ambigu.
- Kandidat batas hasil awal, misalnya 10 dengan pemuatan hasil lanjutan; **angka final dan mekanisme paging belum diputuskan**.
- Transaksi yang keterangan/nominalnya sama tetap merupakan catatan berbeda; jangan otomatis menggabungkannya atau menebak harga terbaru.
- Pencarian tanpa hasil menampilkan pesan ringkas dan jalur kembali ke input manual.
- Bila histori panjang, kemampuan responsif dan latensi pencarian harus diuji dengan dataset realistis.

## 7. Prefill dan validasi data — rancangan

| Field/atribut | Usulan saat reuse | Catatan |
|---|---|---|
| `type` | Salin `income`/`expense` sumber | Jika berbeda dari draft saat ini, tampilkan hasil perubahan dengan jelas |
| `amount` | Salin jumlah sumber | Harus tetap bilangan bulat IDR `> 0`, dapat diedit |
| `category` | Gunakan kategori yang sama jika masih **aktif, milik user, sesuai jenis** | Jika kategori dihapus/tidak valid, minta kategori aktif baru |
| `description` | Salin keterangan sumber | Opsional dan dapat diedit |
| `date` | Untuk formulir baru default **hari ini menurut tanggal lokal** | Jangan otomatis salin tanggal sumber; jika user sudah sengaja memilih tanggal pada draft, pertahankan |
| `id` | Buat ID transaksi baru | Jangan reuse ID sumber |
| `created_at` / `updated_at` | Metadata transaksi baru melalui mekanisme V1 | Jangan salin timestamp sumber |
| `deleted_at` | Transaksi baru aktif | Nilai sesuai mekanisme create V1 |

**Tidak ada autosave.** Pemilihan histori tidak boleh menghasilkan transaksi baru sampai pengguna menekan Simpan dan operasi berhasil menurut mekanisme aplikasi.

### 7.1 Kasus tanggal

- Pengguna boleh mengubah tanggal ke masa lalu atau masa depan sebagaimana V1.
- Kebiasaan mengalokasikan gaji akhir bulan ke awal bulan berikutnya tetap dimungkinkan.
- Tanggal hari ini harus diperoleh sebagai **calendar date lokal**, bukan potongan tanggal UTC yang berpotensi bergeser sehari.
- Penggunaan histori tidak mengubah konsep tanggal V1 atau menambahkan `transaction_effective_date` baru.

### 7.2 Kategori lama

- Histori transaksi lama tetap dapat dibaca meskipun kategorinya soft-deleted.
- Saat reuse, kategori yang sudah tidak aktif **tidak boleh otomatis dipakai** untuk create transaksi baru.
- Pertahankan informasi lain dari transaksi sumber dan minta pemilihan kategori aktif sebelum submit.
- Verifikasi identitas dan status kategori dari state terkini / hasil cloud yang tersedia, termasuk pemilik dan kecocokan jenis.

## 8. Draft, konflik isi, dan dialog konfirmasi

### 8.1 Kebijakan close — disetujui

- **Form bersih:** tutup langsung tanpa konfirmasi.
- **Form memiliki perubahan belum disimpan:** tampilkan dialog konfirmasi (contoh teks: “Buang perubahan? Transaksi ini belum disimpan.”) dengan pilihan **Kembali Mengedit** dan **Buang Perubahan**.
- Membuka/menutup pemilih histori tanpa memilih **tidak dianggap sebagai perintah membuang draft**.
- Setelah save gagal, draft tetap ada.

### 8.2 Definisi dirty state — usulan yang perlu dipastikan

Bandingkan nilai field yang bermakna (`type`, `amount`, `category`, `date`, `description`) dengan **baseline draft awal yang sesuai saat formulir dibuka**. Kondisi “pernah mengetik” saja tidak cukup bila semua nilai kembali sama dengan baseline. Prefill histori yang mengubah field juga dapat membuat draft dirty. Kebijakan harus membedakan draft kosong normal dan form yang dibuka lewat Catat Lagi agar aksi penutupan tidak menghasilkan konfirmasi palsu atau kehilangan kerja.

### 8.3 Konflik saat memilih histori — usulan

- Jika formulir masih dalam keadaan awal, gunakan data sumber tanpa konfirmasi tambahan.
- Jika ada perubahan pengguna yang akan ditimpa oleh pemilihan sumber, tampilkan konfirmasi **Gunakan data riwayat / Kembali** sebelum mengaplikasikan prefill.
- Jika dibatalkan, seluruh draft sebelumnya tetap utuh dan pengguna tetap dapat memilih sumber lain atau kembali.
- Pertahankan tanggal yang telah dipilih pengguna secara eksplisit walaupun nilai lainnya diganti.
- **Open design detail:** tentukan apakah dialog menampilkan daftar field terdampak atau cukup pesan umum; jangan menambah friksi bila tidak ada field yang tertimpa.

### 8.4 Persistensi draft

Usulan fitur dasar: draft berada dalam state selama sheet masih aktif dan **tidak dijanjikan pulih setelah reload/browser ditutup**. Penyimpanan lintas sesi, expiry dan perlindungan data lokal adalah lingkup eksplorasi terpisah. Jangan menjanjikan data draft tersimpan permanen tanpa fitur itu.

## 9. Edge cases dan failure handling

| Situasi | Perilaku kandidat |
|---|---|
| Sumber soft-deleted sebelum hasil dipilih | Jangan gunakan sebagai sumber aktif; tampilkan pesan dan pertahankan draft |
| Sumber berubah sejak daftar ditampilkan | Saat reuse, gunakan data sumber terkini yang sah atau beri pesan bila tidak lagi tersedia; jangan diam-diam menimpa draft |
| Kategori sumber soft-deleted | Field kategori harus dipilih ulang; field lain boleh diprefill |
| Kategori tidak sesuai dengan jenis sumber | Tolak pemilihan kategori tersebut pada transaksi baru |
| Nama kategori berubah | Pakai referensi kategori valid terkini, bukan memaksakan nama historis |
| Nominal sumber/draft tidak valid | Validasi V1 berlaku; create ditolak sampai benar |
| Sumber bertanggal masa depan | Dapat dipilih sebagai referensi; tanggal draft baru mengikuti aturan yang diusulkan |
| User mengubah form, membuka picker lalu kembali | Seluruh perubahan dipertahankan |
| User mengganti sumber setelah mengedit draft | Resolusi konflik sebelum field ditimpa |
| Pengguna batal menutup dialog discard | Kembali mengedit dengan nilai utuh |
| Dua pembelian yang sama pada hari yang sama | Diizinkan; kemiripan data tidak otomatis berarti duplikat |
| Klik Simpan dua kali | Cegah pemrosesan bersamaan dari aksi yang sama |
| Network gagal atau hasil save tidak pasti | Jangan konfirmasi berhasil sebelum status sah diketahui; jangan otomatis retry berisiko menghasilkan transaksi ganda tanpa pemeriksaan |
| Mode demo vs cloud | Business rules reuse/prefill sama; penyimpanan mengikuti mode masing-masing |
| Histori kosong / tidak ada hasil | Empty state; jalur manual tetap tersedia |

**Pembatasan klaim:** disabling tombol selama request berjalan membantu, tetapi **tidak sendirian menjamin idempotensi** bila response hilang setelah server menyimpan. Strategi retry aman harus ditentukan saat audit implementasi.

## 10. Rekomendasi UX dan design constraints

- Gunakan sheet transaksi bergaya **The Stamped Register**; pemilih histori sebaiknya menjadi tampilan internal, bukan overlay baru bertumpuk.
- Pada list mobile, aksi **Catat Lagi** jangan membuat deretan tombol padat; pertimbangkan menu aksi baris / pola sentuh yang sesuai dengan UI existing.
- **Gunakan Riwayat** adalah aksi sekunder yang tidak mengalahkan CTA simpan atau FAB merah.
- Tetap pertahankan warna ink/slate untuk nilai; stamp red untuk fokus, konfirmasi, dan aksi sesuai sistem desain.
- Layar kecil Android: target sentuh layak, status fokus dan keyboard dapat diprediksi, pencarian tidak memaksa scroll horizontal.
- Pencarian dan prefill harus terasa cepat; hindari ranking/prediksi yang sulit dijelaskan.
- Teks utama disarankan **Catat Lagi** pada histori dan **Gunakan Riwayat** di formulir; pasangan bahasa Inggris perlu mengikuti lokalisasi ID/EN V1.

## 11. Dampak teknis, data, keamanan, dan migrasi

### 11.1 Domain dan skema

- Kemampuan dasar dapat dibuat dengan **tabel `transactions` dan `categories` V1**; tidak wajib menambah `templates`, `recurrences`, `source_transaction_id`, atau kolom baru.
- Setiap hasil reuse adalah **create transaksi biasa**, bukan transfer, jadwal, atau relasi wajib dengan transaksi sumber.
- Tidak ada migrasi/backfill data yang diperlukan **selama** fitur tetap hanya memakai kolom V1.
- Rollback konsep dasar: UI reuse dapat dimatikan tanpa mengubah validitas transaksi baru yang sudah tersimpan; tetap perlu rencana release/QA konkret.

### 11.2 Frontend

- Gunakan satu state draft, satu fungsi aplikasi prefill, serta jalur validasi dan save yang sama untuk kedua pintu masuk.
- Pertahankan perubahan draft saat view berpindah dan ketika save gagal.
- Audit perilaku dirty-state, backdrop/Escape, Back Android, focus/keyboard, serta kondisi asynchronous saat pilihan sumber berubah.
- Komposisi komponen existing belum diverifikasi; coding assistant perlu memeriksa struktur aktual sebelum memilih detail implementasi.

### 11.3 Cloud dan keamanan

- Queries histori harus terikat user autentikasi dan tetap ditopang RLS V1 (`auth.uid() = user_id` sesuai tabel).
- Kategori sumber saat dipakai harus sesuai owner dan `type` transaksi yang akan dibuat.
- Jangan membawa transaksi pengguna lain melalui cached search, state, atau mode pemilih.
- Hindari mencatat detail finansial/sesi sensitif secara berlebihan di log diagnostik.

### 11.4 Kinerja

- Uji pencarian histori dan switching view pada Chrome Android dan perangkat dengan performa terbatas.
- Pastikan list besar tidak memperlambat membuka sheet dan mengetik normal.
- Pertimbangkan filtering/pagination sesuai volume dan strategi data V1; belum ada target kinerja terukur yang disepakati.

## 12. Candidate acceptance criteria (belum disahkan)

| ID | Kriteria uji |
|---|---|
| STE-AC-01 | Pada histori aktif, tersedia aksi **Catat Lagi** yang membuka create form, bukan edit form |
| STE-AC-02 | Pada formulir tambah biasa, tersedia aksi opsional **Gunakan Riwayat** |
| STE-AC-03 | Aksi Gunakan Riwayat membuka tampilan pemilih terpisah dan memungkinkan kembali ke form |
| STE-AC-04 | Pemilih menampilkan dan mencari histori aktif milik pengguna dengan hasil yang dapat dibedakan |
| STE-AC-05 | Pemilihan histori melakukan prefill jenis, nominal, keterangan, dan kategori valid yang sesuai sumber |
| STE-AC-06 | Tanggal transaksi baru default hari ini pada formulir baru dan dapat diganti ke masa lalu/masa depan |
| STE-AC-07 | Tanggal yang telah dipilih secara eksplisit pada draft tetap terjaga ketika reuse |
| STE-AC-08 | Kategori terhapus/tidak sesuai tidak boleh disimpan sebagai kategori transaksi baru |
| STE-AC-09 | Kembali dari pemilih tanpa memilih tidak mengubah draft |
| STE-AC-10 | Jika pemilihan histori akan menimpa edit yang ada, user dapat membatalkan penggantian tanpa kehilangan draft |
| STE-AC-11 | Menutup form tanpa perubahan tidak memunculkan konfirmasi |
| STE-AC-12 | Menutup form dengan perubahan belum disimpan menampilkan konfirmasi yang dapat dibatalkan |
| STE-AC-13 | Seluruh field dapat diedit sebelum simpan; pemilihan histori tidak melakukan autosave |
| STE-AC-14 | Simpan berhasil menghasilkan ID baru dan transaksi sumber tidak berubah |
| STE-AC-15 | Batal/close tidak membuat transaksi |
| STE-AC-16 | Gagal menyimpan tidak menghapus draft atau mengirim konfirmasi keberhasilan palsu |
| STE-AC-17 | Dua transaksi identik yang sengaja dicatat tetap diperbolehkan; double-submit dari satu aksi ditangani aman |
| STE-AC-18 | Alur manual V1 tetap dapat digunakan tanpa membuka histori atau menambah field wajib |
| STE-AC-19 | Kedua mode demo/cloud memberikan perilaku domain yang konsisten dan cloud menjaga isolasi akun |
| STE-AC-20 | Pada Chrome Android, navigasi Back, fokus keyboard, dan sheet tidak menyebabkan draft hilang tanpa pilihan pengguna |

## 13. Open questions sebelum handoff implementasi

1. **Komponen aksi histori aktual:** menu per baris atau aksi lain yang paling sesuai dengan V1 mobile?
2. **Penempatan view picker:** internal sheet yang mengganti isi atau varian lain yang setara, sambil menjaga behavior Back?
3. **Dirty baseline untuk prefill awal dari jalur Catat Lagi:** kapan field hasil prefill dianggap perubahan belum disimpan dan kapan konfirmasi ditampilkan?
4. **Konflik replace:** apakah cukup satu konfirmasi umum, dan field mana yang dijaga jika tidak ikut diganti?
5. **Search paging/performance:** batas awal hasil, caching, dan strategi source freshness.
6. **Retry/idempotensi save cloud:** bagaimana aplikasi memastikan tidak menggandakan transaksi saat outcome request tidak pasti?
7. **Lokalisasi teks dan accessibility:** label ID/EN, ukuran target sentuh, pengembalian fokus setelah view picker dan dialog.
8. **Perilaku close melalui backdrop/Escape/Back pada perangkat tertentu:** pastikan semuanya tunduk pada satu kebijakan draft.

Pertanyaan ini tidak memblokir penutupan brainstorming konsep; harus diselesaikan ketika membakukan requirement dan melakukan audit implementasi.

## 14. Penilaian kelayakan dan prioritas

| Dimensi | Assessment discovery |
|---|---|
| Nilai pengguna | **Tinggi** berdasarkan kebutuhan yang disampaikan |
| Kompleksitas UX | **Sedang** (picker, draft, konflik, mobile navigation) |
| Kompleksitas domain | **Rendah** selama reuse menghasilkan transaksi standar |
| Perubahan database | **Tidak wajib** untuk lingkup dasar |
| Migrasi data | **Tidak diperlukan** tanpa perubahan skema |
| Risiko utama | Draft tertimpa/hilang, sumber/kategori tidak valid, double-submit, friksi mobile |
| Kebergantungan | Form create V1, histori aktif, kategori, mekanisme save dan status cloud/demo |

**Rekomendasi:** Smart Transaction Entry adalah kemampuan inti yang patut diprioritaskan untuk V2, dengan implementasi pertama difokuskan pada **Catat Lagi** dan **Gunakan Riwayat** yang deterministik. Audit UX dan implementasi V1 dilakukan sebelum handoff kode. Ini adalah assessment, bukan estimasi engineering yang telah diverifikasi.

## 15. Di luar lingkup dasar

- Transaksi berulang otomatis berbasis jadwal, background scheduler, atau reminder.
- AI untuk memprediksi nominal, tanggal, kategori, atau harga terkini.
- Template/favorit persisten dan manajemen daftar favorit.
- Penggabungan otomatis transaksi serupa atau deduplikasi yang melarang transaksi identik.
- Autosave transaksi saat memilih histori.
- Draft persisten lintas reload/browser/sesi.
- Wallet, transfer antar rekening, budgeting, atau perubahan skema saldo.

Kemampuan ini dapat dieksplorasi di area discovery terpisah bila terdapat bukti kebutuhan; tidak otomatis menjadi requirement V2.

## 16. Langkah setelah discovery

1. Simpan dokumen ini sebagai referensi **V2-FEATURE-02 / V2-STE-01**.
2. Review bersama baseline V1 dan hasil audit form/histori aktual dari coding assistant.
3. Tetapkan open questions yang memengaruhi validasi, navigasi dan data integrity.
4. Setelah scope V2 secara keseluruhan stabil dan aturan disetujui, turunkan menjadi `REQUIREMENTS-v2.md` dengan acceptance criteria final dan skenario regression.
5. Pertahankan `PRODUCT-v1.md`, `REQUIREMENTS-v1.md`, `DATA-MODEL-v1.md`, `DESIGN-v1.md`, serta `SUPABASE-v1.md` sebagai baseline frozen.

**Ringkasan keputusan:** Smart Transaction Entry masuk V2; dapat dibuka dari histori maupun form tambah; menggunakan pemilih histori terpisah; setelah memilih kembali ke form; konfirmasi penutupan hanya jika ada perubahan belum disimpan. Rincian lanjutan tetap diberi label *Proposed* sampai disahkan.
