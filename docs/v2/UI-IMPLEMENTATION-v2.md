# FINANX — Catatan Implementasi UI v2

Tanggal: 22 Oktober 2026. Catatan tambahan berdasarkan sumber implementasi dan hasil QA yang dilaporkan pada sesi ini. Acuan visual tetap [DESIGN-v1.md](../v1/DESIGN-v1.md), dengan perilaku tambahan pada [DESIGN-v2.md](DESIGN-v2.md). Dokumen ini tidak mengganti spesifikasi desain, kebutuhan, atau kontrak data.

## Pemetaan lima fitur

| Fitur | Komponen | Implementasi yang terlihat pada sumber |
|---|---|---|
| Dashboard Balanced Insight | `src/components/Dashboard.jsx` | Ringkasan tiga sel tetap dipertahankan; pemasukan/pengeluaran mendapat delta bertanda dan bulan pembanding. Tren enam bulan tampil setelah Counterforce, dengan dua seri ink/slate serta daftar nilai tepat dalam `dl`. Detail perbandingan memakai `details`; kategori dan ringkasan menyediakan drill-down. |
| Smart Transaction Entry | `src/components/Transactions.jsx`, `TransactionSheet.jsx` | `Catat Lagi` membuka formulir create yang sama dalam mode `reuse`. `Gunakan Riwayat` mengganti tampilan internal sheet dengan pencarian, sepuluh pilihan awal, dan muat lebih banyak. Sumber tidak diedit; kategori nonaktif harus dipilih ulang. |
| Saldo kumulatif | `src/components/Dashboard.jsx`, `FinancialSettings.jsx` | Readout sekunder mengikuti breakdown, terpisah dari saldo bulanan. Pengaturan saldo awal berada dalam plate formulir; perubahan/reset konfigurasi memerlukan konfirmasi inline yang menampilkan nilai dan tanggal. |
| Navigasi historis | `src/components/Dashboard.jsx`, `Transactions.jsx` | Kontrol bulan dan tahun langsung berada di bawah navigasi bulan Dashboard. Histori menggabungkan tahun, bulan, jenis, kategori, pencarian, dan pagination sepuluh baris. Drill-down membawa konteks periode/jenis/kategori dan tautan kembali yang divalidasi. |
| Ekspor CSV | `src/components/Transactions.jsx`, `ExportSheet.jsx` | Tombol sekunder membuka sheet dengan dua radio cakupan: seluruh baris sesuai filter lintas halaman atau seluruh histori aktif. Ringkasan filter, format CSV, catatan privasi, dan tombol unduh eksplisit tetap terlihat. |

## Bahasa visual yang dipertahankan

Identitas **The Stamped Register** diwarisi; V2 tidak menetapkan sistem visual baru. `src/styles.css` tetap menjadi sumber token implementasi.

- Kertas `--paper: #f2f1ec`, permukaan sheet/kontrol `--paper-raised: #f7f6f2`, tan `#e8e4da`; garis `--rule: #b9b6a9` dan `--rule-soft: #d3d0c4`.
- Pemasukan memakai ink `#191918`, pengeluaran slate `#4a5b6b`. Stamp red `#c22f1d` tetap untuk aksi/fokus; delta memakai tanda nominal dan tidak menambah kode merah/hijau untuk penilaian keuangan.
- Inter untuk teks; IBM Plex Mono untuk angka/chrome. `.num` mempertahankan angka tabular. Nominal tepat dapat membungkus, bukan dipotong atau dipadatkan; ringkasan tetap tiga sel dengan saldo bergaris bawah ganda.
- Sudut 1–2px, plate transparan, pemisah hairline dan penutup section berwarna ink tetap digunakan. Bayangan sheet/toast dan tepi tekan tombol/FAB mengikuti bahasa V1.
- Shell mempertahankan sidebar 248px, konten maksimum 880px, dan media query mobile `max-width: 900px` dengan tab bawah/FAB. Kontrol periode membungkus; baris transaksi mobile membagi main/amount, tanggal, lalu aksi.
- Tambahan `.ledger-note`, `.ledger-link`, `.period-controls`, `.trend-values`, `.history-choice`, dan `.export-option` memakai token lama. Aksi transaksi selalu terlihat; tombol utama, tombol ikon transaksi, penutup sheet, serta kontrol bulan diberi ukuran minimum 44px. Preferensi reduced-motion tetap ditangani CSS.

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

Finish reviewer independen memberi **SHIP, 8/10** untuk lingkup UI sumber dan 14 screenshot V2 pada lebar 1440/360px. Dua finding tentang delta positif dan Shift+Tab telah diperbaiki. Contoh hasil tersimpan: [Dashboard 1440px](../../.impeccable/review/v2-populated-1440.png) dan [Dashboard 360px](../../.impeccable/review/v2-populated-360.png).

Browser pada build produksi melaporkan **57 assertion lulus**, termasuk konteks drill-down/Back, trap fokus awal Shift+Tab, draft/picker/reuse, CSV lintas pagination, pengaturan saldo awal, lokalisasi, dan overflow. Rincian hasil tersimpan di [v2-browser-results.json](../../.impeccable/review/v2-browser-results.json). Benchmark memakai 10.000 transaksi, 100 kategori, dan histori lima tahun pada desktop serta viewport mobile dengan CPU throttling 4× sebagai proksi.

Bukti tersebut tidak memvalidasi perangkat Android fisik, keyboard virtual, TalkBack, integrasi cloud produksi, maupun pembukaan CSV dalam aplikasi spreadsheet. Status SHIP di atas terbatas pada review UI dan pengujian browser yang disebutkan; catatan ini tidak memperluas klaim QA ke area tersebut.
