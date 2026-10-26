# FINANX — Catatan Implementasi UI v2

Tanggal awal: 22 Oktober 2026; diperbarui 26 Oktober 2026 untuk refinement UI mobile yang disetujui pengguna. Catatan tambahan berdasarkan sumber implementasi dan bukti QA yang ditautkan di bawah. Acuan visual tetap [DESIGN-v1.md](../v1/DESIGN-v1.md), dengan perilaku tambahan pada [DESIGN-v2.md](DESIGN-v2.md). Dokumen ini merekam implementasi terkini dan keputusan UI terbaru tanpa menulis ulang spesifikasi desain, kebutuhan, atau kontrak data kanonis.

## Pemetaan lima fitur

| Fitur | Komponen | Implementasi yang terlihat pada sumber |
|---|---|---|
| Dashboard Balanced Insight | `src/components/Dashboard.jsx` | Ringkasan tiga sel tetap dipertahankan; pemasukan/pengeluaran mendapat delta bertanda dan bulan pembanding. Tren enam bulan tampil setelah Counterforce, dengan dua seri ink/slate serta daftar nilai tepat dalam `dl`. Detail perbandingan memakai `details`; kategori dan ringkasan menyediakan drill-down. |
| Smart Transaction Entry | `src/components/Transactions.jsx`, `TransactionSheet.jsx` | `Catat Lagi` membuka formulir create yang sama dalam mode `reuse`. `Gunakan Riwayat` mengganti tampilan internal sheet dengan pencarian, sepuluh pilihan awal, dan muat lebih banyak. Sumber tidak diedit; kategori nonaktif harus dipilih ulang. |
| Saldo kumulatif | `src/components/Dashboard.jsx`, `FinancialSettings.jsx` | Readout sekunder mengikuti breakdown, terpisah dari saldo bulanan. Pengaturan saldo awal berada dalam plate formulir; perubahan/reset konfigurasi memerlukan konfirmasi inline yang menampilkan nilai dan tanggal. |
| Navigasi historis | `src/components/Dashboard.jsx`, `Transactions.jsx` | Sesuai persetujuan pengguna 26 Oktober 2026, pemilih bulan/tahun langsung di Dashboard dihapus; judul periode, tombol bulan sebelumnya/berikutnya, dan Hari Ini tetap tersedia. Filter tahun/bulan histori tetap tersedia bersama jenis, kategori, pencarian, dan pagination sepuluh baris. Drill-down membawa konteks periode/jenis/kategori dan tautan kembali yang divalidasi. |
| Ekspor CSV | `src/components/Transactions.jsx`, `ExportSheet.jsx` | Tombol sekunder membuka sheet dengan dua radio cakupan: seluruh baris sesuai filter lintas halaman atau seluruh histori aktif. Ringkasan filter, format CSV, catatan privasi, dan tombol unduh eksplisit tetap terlihat. |

## Bahasa visual yang dipertahankan

Identitas **The Stamped Register** diwarisi; V2 tidak menetapkan sistem visual baru. `src/styles.css` tetap menjadi sumber token implementasi.

- Kertas `--paper: #f2f1ec`, permukaan sheet/kontrol `--paper-raised: #f7f6f2`, tan `#e8e4da`; garis `--rule: #b9b6a9` dan `--rule-soft: #d3d0c4`.
- Pemasukan memakai ink `#191918`, pengeluaran slate `#4a5b6b`. Stamp red `#c22f1d` tetap untuk aksi/fokus; delta memakai tanda nominal dan tidak menambah kode merah/hijau untuk penilaian keuangan.
- Inter untuk teks; IBM Plex Mono untuk angka/chrome. `.num` mempertahankan angka tabular. Nominal tepat dapat membungkus, bukan dipotong atau dipadatkan; ringkasan tetap tiga sel dengan saldo bergaris bawah ganda.
- Sudut 1–2px, plate transparan, pemisah hairline dan penutup section berwarna ink tetap digunakan. Bayangan sheet/toast dan tepi tekan tombol/FAB mengikuti bahasa V1.
- Shell mempertahankan sidebar 248px, konten maksimum 880px, dan media query mobile `max-width: 900px` dengan tab bawah/FAB. Kontrol periode histori membungkus; baris transaksi mobile memakai grid dua kolom: kategori/deskripsi (`main`) dan nominal (`amount`) di atas, tanggal (`date`) dan pemicu menu (`actions`) di bawah. Nominal tetap dapat membungkus.
- Tambahan `.ledger-note`, `.ledger-link`, `.period-controls`, `.trend-values`, `.history-choice`, dan `.export-option` memakai token lama. Pemicu titik tiga transaksi selalu terlihat; tombol utama, tombol ikon transaksi, penutup sheet, serta kontrol bulan diberi ukuran minimum 44px. Menu transaksi memakai permukaan raised, garis rule, dan bayangan token `--shadow-soft`. Preferensi reduced-motion tetap ditangani CSS.

## Refinement UI mobile — 26 Oktober 2026

Perubahan ini mempertahankan identitas **The Stamped Register** dan komponen yang sudah ada. Persetujuan menghapus pemilih periode langsung Dashboard dicatat pada [catatan verifikasi terbaru](verification/MOBILE-UX-20261026.md); keputusan ini memperbarui perilaku implementasi yang sebelumnya ditentukan V2. Filter periode histori tidak berubah.

- **Menu transaksi:** `src/components/TransactionActions.jsx` mengelompokkan `Catat Lagi`, `Ubah`, dan `Hapus` untuk setiap baris `Transactions.jsx`. Pemicu memiliki nama aksesibel dengan konteks transaksi serta `aria-haspopup`, `aria-expanded`, dan `aria-controls`; menu dan item memakai role yang sesuai. Pemicu berukuran 44 × 44px dan setiap item memiliki tinggi minimum 44px.
- **Penempatan dan interaksi:** menu dirender melalui portal ke `document.body`, memakai posisi fixed yang dibatasi viewport dan token `--shadow-soft`. Arrow Up/Down membuka atau memindahkan fokus secara melingkar; Home/End memilih item pertama/terakhir. Escape menutup dan mengembalikan fokus ke pemicu; Tab menutup sambil melanjutkan navigasi fokus. Klik di luar menutup; resize/scroll menutup dan mengembalikan fokus. Pemilihan aksi mengembalikan fokus ke pemicu sebelum menjalankan reuse/edit/delete agar dialog dapat memulihkan fokus saat ditutup.
- **Saldo awal:** `FinancialSettings.jsx` memakai `.financial-settings__actions` dengan dua kolom sama lebar dan jarak 10px, termasuk pada mobile. Simpan dan Reset berdampingan saat saldo awal sudah dikonfigurasi; bila hanya Simpan tersedia, tombol memenuhi lebar baris. Label dapat membungkus. Validasi, konfirmasi update/reset inline, serta status simpan tetap mengikuti alur sebelumnya.
- **Disposisi review terbaru:** finding MATERIAL tentang bayangan keras menu diperbaiki dengan menggantinya memakai `--shadow-soft`; reviewer menyatakan finding tersebut resolved dan memberi verdict pass. Disposisi ini terbatas pada finding tersebut, bukan penilaian ulang numerik seluruh UI.

## FAB cap stempel FINANX — 26 Oktober 2026

Sesuai permintaan pengguna, tombol `.fab` dalam `src/components/Shell.jsx` kini menyerupai cap stempel FINANX. Wrapper dekoratif `.fab__stamp` memakai `aria-hidden="true"`; handle terdiri dari kepala dan batang tinta, pad merah (76 × 50px) memuat ikon plus dan tulisan FINANX dengan font ledger monospace (10px), lalu alas tinta (84 × 7px). Blok FAB di `src/styles.css` memakai token warna, radius, dan bayangan incumbent **The Stamped Register**. Hover pada perangkat yang mendukung hover mengangkat cap 2px; state active menekan cap 2px. Preferensi reduced-motion mengikuti aturan global. Handler klik tetap membuka formulir transaksi baru dan nama aksesibel tetap `t.addTransaction`.

Reviewer independen `stamp_fab_finish_reviewer` memberi disposisi **SHIP** untuk refinement FAB ini. `npm run build` dilaporkan lulus dan detector menghasilkan daftar finding kosong. [Bukti browser FAB](verification/stamp-fab-browser-20261026.json) mencatat **30/30 pemeriksaan lulus** pada lebar 1440/768/360/320px: target sentuh dan batas viewport, overflow, aktivasi klik/tap serta keyboard, pemulihan fokus setelah dialog ditutup, penghormatan reduced-motion, FAB tersembunyi pada Profil, dan tidak ada uncaught browser error. Contoh visual: [desktop](../../.impeccable/review/stamp-fab-1440.png), [mobile](../../.impeccable/review/stamp-fab-360.png), serta detail cap [desktop](../../.impeccable/review/stamp-fab-detail-1440.png) dan [mobile](../../.impeccable/review/stamp-fab-detail-360.png).

Disposisi dan pemeriksaan ini terbatas pada FAB dalam demo sintetis Chrome desktop/emulasi viewport mobile. Hasil ini tidak menyelesaikan benchmark CPU 4× yang tetap gagal, tidak mencakup validasi Android fisik atau Production, dan tidak menyatakan ada deployment baru.

## State, fokus, dan riwayat navigasi

- **Dashboard:** bulan berjalan mendapat penanda sementara dan detail periode setara; bulan mendatang tetap menampilkan nominal tercatat dengan persentase perbandingan disembunyikan. Segmen tren mendatang putus-putus dan memiliki keterangan tekstual. Saat saldo awal belum diatur, label menjadi `Akumulasi Transaksi`; sebelum tanggal efektif, readout menjadi `Belum tersedia` dengan tanggal acuan.
- **Form transaksi:** state internal `form`, `picker`, `discard`, dan `overwrite` berada dalam satu dialog. Baseline draft dinormalisasi; `Catat Lagi` awal dianggap bersih. Back dari picker mempertahankan draft; penutupan draft berubah menampilkan konfirmasi, dan penggantian dari riwayat meminta persetujuan bila draft sudah berubah. Tanggal yang dipilih eksplisit dipertahankan. Simpan mengunci aksi paralel; kegagalan mempertahankan isian dengan `role="alert"`; keberhasilan menampilkan stamp lalu menutup sheet.
- **Pengaturan:** validasi gagal memakai alert inline; state sibuk menonaktifkan kontrol. Konfirmasi update/reset tetap dalam formulir, dan hasil simpan diumumkan melalui `role="status"`.
- **Ekspor:** penguncian sinkron mencegah unduh paralel dan penutupan saat sibuk. Hasil kosong tidak membuat file; status unduh dan kegagalan menggunakan `status`/`alert`. Pesan berhasil menyatakan unduh dimulai, bukan menjamin file telah disimpan pengguna.
- **Dialog:** `src/lib/use-dialog.js` memberi fokus ke judul atau elemen `data-autofocus` saat tahap berubah, menjebak Tab dan Shift+Tab termasuk ketika fokus awal ada di judul, mengembalikan fokus ke pemicu saat ditutup, mengunci scroll, serta memberi `inert` pada saudara di luar dialog. Sheet memiliki nama melalui `aria-labelledby` dan `aria-modal`.
- **Back/Escape:** history sentinel menghubungkan browser Back ke penutupan/tahap internal sheet. Penolakan penutupan, termasuk dirty state atau operasi sibuk, memasang sentinel kembali. Escape mengikuti kebijakan close yang sama. Ini menjelaskan mekanisme sumber, bukan bukti perilaku keyboard virtual Android fisik.
- **Histori:** perubahan filter mereset halaman menjadi satu dan memperbarui URL; state URL mengatur periode, filter, pencarian, dan halaman. Kategori historis tetap dapat dibaca/difilter, sedangkan pilihan formulir create hanya memakai kategori aktif. ID/EN tetap melalui kamus `t`; tren memiliki daftar nilai tekstual selain SVG bernama.
- **Pekerjaan render:** derivasi Dashboard dimemoisasi berdasarkan revision/periode; detail kategori dibuat ketika dibuka. Lookup kategori dan skala grafik diinvalidasi saat data berubah. Keterangan picker dibatasi sebagai preview dua baris, dengan teks lengkap tetap di DOM dan formulir; nominal tidak dipotong. Delete/undo menunggu konfirmasi cloud sebelum status sukses.

## Bukti dan batas QA

### QA historis — 22 Oktober 2026

Finish reviewer independen memberi **SHIP, 8/10** untuk lingkup UI sumber dan 14 screenshot V2 pada lebar 1440/360px. Dua finding tentang delta positif dan Shift+Tab telah diperbaiki. Contoh hasil tersimpan: [Dashboard 1440px](../../.impeccable/review/v2-populated-1440.png) dan [Dashboard 360px](../../.impeccable/review/v2-populated-360.png).

Browser pada build produksi melaporkan **57 assertion lulus**, termasuk konteks drill-down/Back, trap fokus awal Shift+Tab, draft/picker/reuse, CSV lintas pagination, pengaturan saldo awal, lokalisasi, dan overflow. Rincian hasil tersimpan di [v2-browser-results.json](../../.impeccable/review/v2-browser-results.json). Benchmark memakai 10.000 transaksi, 100 kategori, dan histori lima tahun pada desktop serta viewport mobile dengan CPU throttling 4× sebagai proksi.

Bukti tersebut tidak memvalidasi perangkat Android fisik, keyboard virtual, TalkBack, integrasi cloud produksi, maupun pembukaan CSV dalam aplikasi spreadsheet. Status SHIP di atas terbatas pada review UI dan pengujian browser yang disebutkan; catatan ini tidak memperluas klaim QA ke area tersebut.

### Verifikasi refinement — 26 Oktober 2026

[Catatan verifikasi mobile](verification/MOBILE-UX-20261026.md) mencatat `npm test` 25/25 lulus, build lulus, serta detector tanpa finding pada komponen yang berubah dan stylesheet. Bukti [browser terbaru](verification/mobile-ui-browser-20261026.json) memuat **63/63 pemeriksaan lulus** dan tidak ada uncaught browser error pada build demo terisolasi dengan data sintetis, Chrome desktop 1440px dan emulasi mobile 360px. Cakupannya termasuk penghapusan picker Dashboard, navigasi periode, menu transaksi, keyboard/fokus/dismissal, target sentuh/viewport, reuse satu insert, edit/hapus/undo, ekspor, saldo awal, tombol sejajar, dan lokalisasi. Hasil ini terpisah dari review historis **SHIP, 8/10** di atas; tidak ada skor review baru yang diklaim.

[Benchmark terbaru](verification/mobile-ui-benchmark-20261026.json) menggunakan 10.000 transaksi, 100 kategori, dan histori lima tahun. Desktop memenuhi seluruh ambang yang diperiksa. Proksi viewport mobile dengan CPU throttling 4× berstatus **gagal**: render Dashboard P95 1398 ms (batas 500 ms), komputasi picker 338 ms (300 ms), pembukaan picker 403 ms (300 ms), serta prefill 545 ms (300 ms). Render histori 343 ms memenuhi batas 500 ms. Ambang tidak dilonggarkan; kelulusan fungsi/tata letak tidak menyelesaikan temuan performa ini.

Agent belum melakukan deployment baru atau memvalidasi perubahan ini pada Production. Android fisik, keyboard virtual, TalkBack, login/persistensi dan isolasi dua akun pada Production, serta pembukaan CSV dalam Excel/Sheets belum divalidasi agent. Emulasi viewport dan proksi CPU 4× tidak membuktikan performa atau perilaku perangkat Android fisik.
