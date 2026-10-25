# FINANX V2 — Saldo Kumulatif & Saldo Awal Opsional Discovery

**Working ID:** `V2-BALANCE-01`  
**Nama fitur:** Saldo Kumulatif dengan Saldo Awal Opsional  
**Status:** Discovery konsep ditutup; **kemampuan masuk V2 disetujui**, detail aturan masih perlu review sebelum requirement final  
**Tanggal dokumentasi:** 22 Oktober 2026  
**Baseline:** FINANX v1.0.0 (frozen)  
**Cakupan:** saldo bulanan, saldo kumulatif, nominal/tanggal saldo awal, batas perhitungan historis, UX ringkas, edge case, dampak data dan migrasi

> Dokumen ini merekam hasil pembahasan produk. **Confirmed Future Requirement** berlaku untuk kemampuan saldo kumulatif dengan saldo awal opsional pada V2. Aturan teknis/UX yang disebut **Proposed** belum otomatis disahkan. Lima dokumen baseline V1 tidak diubah.

## 1. Latar belakang dan problem statement

FINANX V1 merupakan *personal money ledger* yang sudah nyaman digunakan untuk pencatatan keuangan nyata, dengan nilai inti **cepat, akurat, konsisten**. Pengguna mula-mula sengaja membatasi saldo pada selisih pemasukan dan pengeluaran per bulan. Setelah dievaluasi, pengguna menginginkan kemampuan memahami akumulasi perubahan uang antarbulan tanpa harus mencatat sumber dana atau rekening untuk setiap transaksi.

**Masalah:** Saldo bulanan membantu membaca arus uang per bulan, tetapi tidak memperlihatkan bagaimana hasil bulan-bulan tersebut terakumulasi. Selain itu, transaksi yang baru dicatat sejak pengguna mulai memakai FINANX tidak selalu mencakup seluruh uang yang sudah dimiliki sebelumnya.

**Outcome yang dituju:** Pengguna dapat melihat hasil bulanan seperti V1, melihat akumulasi catatan sampai periode tertentu, dan **secara opsional** menetapkan titik awal nominal serta tanggal untuk penghitungan saldo kumulatif. Pencatatan harian tetap tidak membutuhkan field baru.

## 2. Acuan V1 yang tetap berlaku

Acuan: `PRODUCT-v1.md`, `REQUIREMENTS-v1.md`, `DATA-MODEL-v1.md`, `DESIGN-v1.md`, `SUPABASE-v1.md`.

- Dashboard V1 menampilkan pemasukan bulanan, pengeluaran bulanan, dan **saldo bulanan = pemasukan − pengeluaran** (`FR-DASH-01`–`03`). Rumus ini **tidak diubah**.
- Semua nominal transaksi positif; `type` (`income`/`expense`) menentukan tanda pada arus uang; mata uang hanya IDR (`BR-01`–`02`).
- Agregasi hanya menggunakan transaksi aktif (`deleted_at` kosong). Transaksi bertanggal masa lalu, saat ini, maupun **masa depan** sah dan masuk bulan menurut field `date` (`FR-TX-04`, `BR-03`, `BR-06`).
- `date` merupakan nilai *date-only* (`YYYY-MM-DD`), bukan timestamp; hindari konversi zona waktu yang menggeser tanggal.
- Data demo disimpan pada `localStorage` key `finanx:v1`; cloud memakai Supabase Postgres, Auth, dan Row Level Security per pengguna.
- Desain **The Stamped Register**: register-paper, garis ledger, IBM Plex Mono untuk angka, Inter untuk teks, ink/slate untuk arah keuangan, stamp red khusus aksi/fokus. Hindari kartu dashboard yang mengambang.

**Konteks penggunaan:** Pengguna dapat mengalokasikan gaji akhir bulan menjadi transaksi bertanggal awal bulan berikutnya. Perhitungan V2 harus tetap memakai `date` yang dipilih pengguna, bukan mencoba menebak tanggal uang diterima sebenarnya.

## 3. Definisi konseptual

| Istilah | Arti | Status |
|---|---|---|
| **Saldo Bulanan** | Total pemasukan aktif pada bulan terpilih dikurangi pengeluaran aktif di bulan tersebut | **Confirmed V1** |
| **Saldo Kumulatif** | Nilai titik awal ditambah arus bersih transaksi aktif mulai tanggal titik awal sampai akhir bulan terpilih | **Confirmed Future Requirement** pada tingkat kemampuan; aturan detail Proposed |
| **Saldo Awal** | Nilai uang acuan yang boleh ditetapkan pengguna sebagai titik mulai perhitungan | **Disetujui: opsional** |
| **Tanggal Saldo Awal** | Tanggal efektif titik awal yang ditentukan sendiri oleh pengguna | **Disetujui: ditentukan pengguna** |
| **Akumulasi Transaksi** | Jumlah bersih seluruh transaksi tercatat ketika pengguna belum menetapkan saldo awal | **Proposed** sebagai label/perilaku fallback |

**Peringatan interpretasi:** Saldo kumulatif bukan otomatis saldo bank, uang tunai tersedia, atau total kekayaan. Kebenarannya sebagai posisi uang bergantung pada kelengkapan pencatatan dan kualitas saldo awal. FINANX V2 dalam cakupan ini **tidak** mengelola Wallet/rekening.

## 4. Rekam keputusan (decision log)

| ID | Keputusan / usulan | Status | Alasan / batas |
|---|---|---|---|
| BAL-D01 | Menambahkan **saldo kumulatif** dalam V2 | **Confirmed Future Requirement — tingkat kemampuan** | Memperluas pembacaan saldo lintas bulan |
| BAL-D02 | **Saldo awal opsional** | **Disetujui** | Pengguna tanpa kebutuhan saldo awal tetap dapat memakai FINANX |
| BAL-D03 | **Tanggal saldo awal dipilih pengguna** | **Disetujui** | Menghindari asumsi tanggal transaksi pertama sebagai acuan |
| BAL-D04 | Saldo bulanan V1 tetap dihitung terpisah | **Confirmed V1, dipertahankan** | Jangan mengubah makna saldo bulanan |
| BAL-D05 | Histori sebelum tanggal saldo awal tidak dihapus | **Proposed — rekomendasi akhir** | Menjaga data V1 dan laporan historis |
| BAL-D06 | Histori sebelum tanggal saldo awal tidak ikut membentuk kumulatif setelah titik awal | **Proposed — rekomendasi akhir** | Mencegah penghitungan ganda |
| BAL-D07 | Sebelum tanggal saldo awal, saldo kumulatif berbasis titik awal ditampilkan **belum tersedia**, bukan nol | **Proposed — rekomendasi akhir** | Belum ada dasar untuk menghitung mundur posisi uang |
| BAL-D08 | Bila saldo awal belum diatur, tampilkan **Akumulasi Transaksi** dari seluruh histori aktif (bukan mengklaim posisi uang) | **Proposed — rekomendasi akhir** | Tetap bermanfaat tanpa asumsi saldo riil nol |
| BAL-D09 | Saldo awal Rp 0 yang **diatur eksplisit** berbeda dari belum mengatur saldo awal | **Proposed — rekomendasi akhir** | Semantik data tidak boleh hilang |
| BAL-D10 | Pengaturan saldo awal tidak masuk formulir transaksi harian | **Arah disepakati** | Menjaga kecepatan input |
| BAL-D11 | Wallet, sumber dana, saldo per rekening, dan transfer bukan prasyarat fitur ini | **Arah V2 disepakati** | Menghindari kompleksitas domain yang belum diperlukan |
| BAL-D12 | Lokasi pengaturan, format tampilan, batas nilai, dan perilaku pengubahan titik awal | **Open Question** | Memerlukan spesifikasi lanjut sebelum implementasi |

Penutupan diskusi ini **tidak** berarti seluruh proposal di tabel otomatis menjadi keputusan final implementasi.

## 5. Model perhitungan yang diusulkan

### 5.1 Saldo bulanan tidak berubah

Untuk bulan kalender `M`:

- `Income(M)` = jumlah nominal transaksi aktif bertipe `income` yang bertanggal di M.
- `Expense(M)` = jumlah nominal transaksi aktif bertipe `expense` yang bertanggal di M.
- `MonthlyBalance(M) = Income(M) − Expense(M)`.

### 5.2 Dengan saldo awal yang diatur

Misalkan:
- `A` = nominal saldo awal yang disimpan pengguna.
- `D` = tanggal efektif saldo awal (inklusif).
- `E(M)` = tanggal kalender terakhir dari bulan terpilih M.
- `SignedAmount(t)` = `+amount` untuk pemasukan, `−amount` untuk pengeluaran.

Jika `E(M) >= D`:

`CumulativeBalance(M) = A + Σ SignedAmount(t)`, untuk semua transaksi aktif dengan `D <= t.date <= E(M)`.

**Definisi titik awal:** `A` merepresentasikan posisi **sebelum** semua transaksi yang bertanggal `D` diproses. Karena itu, transaksi pada tanggal `D` ikut dihitung. Detail ini harus dijelaskan kepada pengguna untuk menghindari hitung ganda.

Jika `E(M) < D`, saldo kumulatif berbasis saldo awal **tidak tersedia**. Saldo bulanan periode sebelum D tetap tersedia tanpa perubahan.

**Kasus tanggal di tengah bulan:** apabila D = 15 Maret, saldo kumulatif Maret dihitung dari A ditambah transaksi **15–31 Maret**, sementara saldo bulanan Maret tetap dihitung dari transaksi **1–31 Maret**. Jangan menghitung kumulatif hanya dari penjumlahan saldo bulanan penuh pada bulan pertama.

### 5.3 Tanpa saldo awal

**Proposed:** tampilkan metrik berlabel **Akumulasi Transaksi**, yaitu jumlah bertanda seluruh transaksi aktif bertanggal sampai akhir bulan terpilih, termasuk periode historis. Nilai ini bukan saldo nyata dan tidak boleh diberi label *uang tersedia*.

Jika nominal atau tanggal saldo awal kemudian diatur, gunakan model §5.2 mulai tanggal efektif dan jangan mencampur akumulasi historis sebelumnya ke dalam angka baru.

### 5.4 Contoh ilustratif

Saldo awal Rp 10.000.000 berlaku **1 Maret 2026**:

| Bulan | Arus bersih bulanan | Saldo kumulatif berbasis saldo awal |
|---|---:|---:|
| Januari | +Rp 2.000.000 | Belum tersedia |
| Februari | +Rp 1.000.000 | Belum tersedia |
| Maret | −Rp 1.500.000 | Rp 8.500.000 |
| April | +Rp 3.000.000 | Rp 11.500.000 |
| Mei | +Rp 1.000.000 | Rp 12.500.000 |

Contoh mengasumsikan titik awal di tanggal 1 dan seluruh transaksi relevan sesudahnya tercatat. Transaksi Januari–Februari tetap ada dan tetap membentuk laporan bulanan, tetapi tidak dihitung kembali sesudah titik awal.

## 6. Pengalaman pengguna dan tampilan (proposal)

- Tiga informasi utama Dashboard V1 (**Pemasukan**, **Pengeluaran**, **Saldo Bulanan**) tetap memiliki prioritas visual.
- **Saldo Kumulatif** menjadi informasi tambahan/sekunder yang dibaca dari dashboard. Posisi dan layout detail menunggu eksplorasi UX.
- Pengaturan saldo awal berisi **nominal** dan **tanggal efektif**. Pengguna dapat membiarkannya tidak terisi; pengaturan ini tidak diwajibkan untuk mencatat transaksi.
- Ketika saldo awal tidak diatur, gunakan label **Akumulasi Transaksi** (proposal) dengan penjelasan bahwa angka berasal dari catatan yang tersedia.
- Untuk bulan sebelum saldo awal, tampilkan `—` / **Belum tersedia** dan jelaskan tanggal mulai kumulatif.
- Saat nilai/tanggal saldo awal diubah, hasil setelah tanggal efektif dihitung ulang; pengubahan titik awal perlu umpan balik yang jelas tentang cakupannya.
- Gunakan typografi, aturan garis, warna, serta komponen **The Stamped Register**, tanpa mengubah form tambah transaksi V1.

## 7. Edge cases dan aturan yang perlu diuji

| Kasus | Perilaku yang direkomendasikan / pertanyaan |
|---|---|
| Belum ada saldo awal | Tampilkan *Akumulasi Transaksi*, bukan klaim uang riil; **Proposed** |
| Saldo awal diatur `Rp 0` | Perlakukan sebagai nilai yang sah dan terkonfigurasi; **Proposed** |
| Tanggal saldo awal di tengah bulan | Sertakan hanya transaksi dari tanggal tersebut pada kumulatif bulan pertama |
| Transaksi tepat pada tanggal saldo awal | **Ikut dihitung** karena batas inklusif; saldo awal adalah nilai sebelum transaksi hari itu |
| Transaksi sebelum tanggal saldo awal | Tetap di histori dan saldo bulanan, dikecualikan dari saldo kumulatif berbasis titik awal |
| Bulan terpilih sebelum saldo awal | Cumulative unavailable (`—`), bukan nol |
| Nilai kumulatif negatif | Tampilkan hasil negatif tanpa mengubah aturan transaksi V1 |
| Transaksi diedit, dihapus, atau tanggalnya diubah | Perhitungan ulang pada semua periode terpengaruh memakai transaksi aktif |
| Saldo awal diubah tanggalnya | Hitung ulang dari titik awal yang baru; hindari pencampuran hasil lama |
| Transaksi masa depan | Ikut pada bulan tanggal tercatat, termasuk kumulatif bulan mendatang; beri konteks periode mendatang sesuai keputusan Dashboard Discovery |
| Tidak ada transaksi setelah saldo awal | Kumulatif sama dengan nominal saldo awal untuk bulan yang eligible |
| Tahun berganti | Akumulasi berlanjut lintas tahun; jangan reset saat Januari |
| Data V1 mulai di tengah tahun / histori tidak lengkap | Jangan menyatakan kumulatif sebagai saldo bank nyata; jelaskan dependensi kelengkapan catatan |
| Jumlah sangat besar | Gunakan bilangan IDR presisi integer; definisikan batas input dan representasi aman sebelum implementasi |
| Mode demo dan cloud | Nilai hasil konsisten untuk data yang identik, dengan pengaturan titik awal masing-masing user |

## 8. Dampak data model, keamanan, migrasi

### 8.1 Data persisten baru (proposal)

Minimal memerlukan konfigurasi per pengguna:

- `opening_balance_amount`: nominal IDR. `NULL` berarti *belum diatur*, sedangkan `0` berarti eksplisit diatur.
- `opening_balance_date`: tanggal efektif `YYYY-MM-DD`, `NULL` jika belum diatur.

**Catatan skema:** tabel pengaturan keuangan khusus atau kolom baru pada tabel profil **belum dipilih**. Jika dipisahkan, relasi satu pengaturan per user dan RLS `auth.uid()` harus ditegakkan. Jika kolom ada di profil, kebijakan ownership V1 tetap berlaku. Konsistensi kedua field harus dijaga secara atomik; pasangan hanya valid bila keduanya terisi atau keduanya `NULL`.

**Open Question:** Apakah saldo awal boleh negatif? Range nominal aman terhadap `bigint` database dan number handling JavaScript harus ditentukan sebelum implementasi. Jangan mengasumsikan aturan `amount > 0` untuk transaksi otomatis berlaku pada saldo awal.

### 8.2 Migrasi V1 → V2

- Pertahankan seluruh transaksi dan kategori V1; tidak lakukan backfill transaksi palsu.
- Untuk pengguna V1, kedua field saldo awal mula-mula **belum diatur (`NULL`)**, bukan default nominal nol.
- Mode demo membutuhkan strategi upgrade dari struktur `finanx:v1` tanpa menimpa data; detail key/versi target belum diputuskan.
- Mode cloud membutuhkan perubahan skema non-destruktif, RLS, indeks/constraint seperlunya, pengujian rollback dan backup.
- Migrasi tidak boleh mengubah perhitungan saldo bulanan V1.

### 8.3 Keamanan dan kompatibilitas

- Config saldo awal hanya bisa dibaca/diubah oleh user pemilik di mode cloud; tidak boleh bocor lintas akun.
- Transaksi aktif tetap sumber angka pergerakan; pengaturan saldo awal menjadi **parameter acuan**, bukan transaksi sintetis.
- Bila opsi saldo awal dibatalkan/dihapus, perilaku kembali ke metrik tanpa saldo awal perlu diuji dengan histori panjang.
- Rollback ke V1 harus menjaga data transaksi V1. Perlakuan terhadap field konfigurasi tambahan saat rollback perlu dokumentasi implementasi.

## 9. Kompleksitas dan kelayakan

| Dimensi | Penilaian awal | Alasan |
|---|---|---|
| Nilai pengguna | Tinggi (hipotesis berdasar diskusi) | Melihat kontinuitas hasil keuangan antarbulan |
| Dampak alur input | Rendah | Tidak menambah field wajib setiap transaksi |
| UX | Rendah–Sedang | Pengaturan satu kali, label dan penjelasan jelas |
| Agregasi | Sedang | Rentang tanggal, efek pengubahan data, titik awal tengah bulan |
| Database | Kecil tetapi nyata | Menyimpan nominal/tanggal dan menjaga kepemilikan |
| Migrasi | Rendah–Sedang | Harus menjaga data V1 dan membedakan `NULL` vs `0` |
| Risiko terbesar | Semantik dan akurasi | Mencegah hitung ganda dan kesan uang tersedia yang keliru |

**Evaluasi:** Layak untuk FINANX V2, sebagai kemampuan sekunder yang melengkapi Balanced Insight. Kelayakan ini berdasarkan penalaran produk dan baseline dokumen, **belum** audit kode atau uji performa.

## 10. Kandidat acceptance criteria (belum disahkan)

| ID | Acceptance criteria |
|---|---|
| BAL-AC-01 | Saldo bulanan tetap sama persis dengan perhitungan V1 untuk data identik. |
| BAL-AC-02 | Pengguna dapat memilih untuk tidak menetapkan saldo awal dan tetap membuat transaksi biasa. |
| BAL-AC-03 | Pengguna dapat mengatur nominal dan tanggal efektif saldo awal secara eksplisit. |
| BAL-AC-04 | Bila tanggal saldo awal D berlaku, transaksi aktif dengan tanggal sebelum D tidak masuk perhitungan kumulatif setelah D. |
| BAL-AC-05 | Transaksi tepat pada D ikut dihitung; titik awal merepresentasikan nilai sebelum transaksi D. |
| BAL-AC-06 | Pada bulan sebelum D, saldo bulanan tetap muncul tetapi saldo kumulatif berbasis D tidak ditampilkan sebagai nol. |
| BAL-AC-07 | Pada bulan pertama, jika D di tengah bulan, hanya transaksi pada/ setelah D yang dihitung ke kumulatif. |
| BAL-AC-08 | Mengubah atau menghapus transaksi aktif memperbarui hasil kumulatif periode terkait. |
| BAL-AC-09 | Transaksi pada bulan mendatang ikut perhitungan kumulatif sesuai tanggal tercatat, tanpa dianggap sudah terjadi secara kas. |
| BAL-AC-10 | Saldo awal eksplisit Rp 0 dibedakan dari kondisi belum diatur. |
| BAL-AC-11 | Tidak ada data transaksi historis V1 yang dihapus atau diubah oleh migrasi fitur saldo. |
| BAL-AC-12 | Perhitungan menghasilkan nilai yang sama di mode demo dan cloud untuk data dan titik awal identik. |
| BAL-AC-13 | Cloud menerapkan RLS sehingga pengguna hanya dapat membaca/mengubah konfigurasi saldo awal miliknya. |
| BAL-AC-14 | Tidak ada field tambahan wajib pada form transaksi V1. |
| BAL-AC-15 | Bila saldo awal belum diatur, metrik fallback diberi label yang tidak mengklaim saldo riil. |

## 11. Open questions sebelum requirement final

1. **Nilai saldo awal:** hanya `>= 0`, atau izinkan negatif untuk kondisi kewajiban/defisit? Bagaimana batas maksimum IDR dan akurasi integer?
2. **Lokasi pengaturan:** Profil, Settings keuangan, atau akses dari detail saldo kumulatif? Bagaimana on-boarding ringan tanpa memaksa?
3. **Penanganan pengubahan/menghapus konfigurasi:** apakah perlu konfirmasi jika tanggal titik awal berubah, dan bagaimana copy penjelasan recalculation?
4. **Fallback tanpa saldo awal:** finalisasi nama *Akumulasi Transaksi* dan apakah nilai itu selalu terlihat untuk seluruh periode histori, termasuk periode sebelum transaksi pertama.
5. **Saldo awal bertanggal mendatang:** diperbolehkan atau dibatasi? Bagaimana indikator dashboard sebelum tanggal efektif?
6. **Desain skema:** tambah kolom pada `profiles` atau entitas pengaturan terpisah; constraint, RLS, migrasi demo/cloud, dan rollback.
7. **Pengukuran performa:** volume transaksi maksimum dan strategi agregasi untuk histori panjang pada Android.
8. **Integrasi Dashboard Balanced Insight:** lokasi teks saldo kumulatif, ketentuan bulan berjalan/mendatang, dan hindari kebingungan dengan saldo bulanan.

Pertanyaan ini tidak membatalkan persetujuan fitur, tetapi perlu diselesaikan sebelum handoff implementasi final.

## 12. Batas V2 dan alternatif yang tidak dipilih

**Termasuk dalam kemampuan saldo V2 (tingkat konsep):**

- Mempertahankan saldo bulanan V1.
- Menampilkan saldo kumulatif lintas bulan.
- Saldo awal **opsional** dengan nominal dan tanggal pilihan pengguna.
- Perhitungan mengikuti transaksi aktif dengan tanggal pencatatan FINANX; mendukung tahun berganti dan transaksi masa depan.
- Data historis V1 tetap utuh.

**Tidak termasuk dalam fitur saldo ini:**

- Wallet/rekening bank/e-wallet terpisah, saldo per sumber dana, dan transfer internal.
- Rekonsiliasi bank, sinkronisasi saldo bank, pelacakan investasi/aset, dan akuntansi multi-rekening.
- Mengubah transaksi historis menjadi saldo awal otomatis atau membuat transaksi sintetis untuk menyamakan saldo.

**Alternatif yang dievaluasi:** (A) akumulasi transaksi tanpa saldo awal vs (B) saldo kumulatif dengan saldo awal opsional. Pengguna **memilih B**, karena lebih fleksibel dan berpotensi mencerminkan posisi uang dengan lebih baik tanpa membebani input harian.

## 13. Hubungan dengan discovery lain

- `V2-DISCOVERY-DASHBOARD.md`: saldo kumulatif dapat menjadi informasi sekunder; tren dan perbandingan tetap memakai rumus saldo bulanan V1, kecuali ada keputusan eksplisit lain.
- `V2-DISCOVERY-SMART-TRANSACTION.md`: transaksi yang dibuat via *Catat Lagi* tetap transaksi aktif biasa dan ikut kumulatif sesuai `date` setelah disimpan.
- `REQUIREMENTS-v2.md`, `DATA-MODEL-v2.md`, dan `DESIGN-v2.md` **belum** ditulis/final untuk area ini; disusun setelah keputusan terbuka diselesaikan dan scope V2 dikonfirmasi.

## 14. Kesimpulan dan handoff discovery

**Kesimpulan:** konsep **Saldo Kumulatif dengan Saldo Awal Opsional** layak menjadi kemampuan FINANX V2 dan disetujui pada tingkat kemampuan. Pengguna juga menyetujui bahwa **tanggal saldo awal dipilih sendiri**. Solusi mempertahankan saldo bulanan V1, tidak mewajibkan Wallet, dan tidak menambah field wajib saat mencatat transaksi.

**Rekomendasi final discovery (belum disahkan sebagai semua aturan final):** pertahankan histori sebelum saldo awal untuk laporan bulanan, tetapi keluarkan dari kumulatif setelah tanggal awal; tampilkan saldo kumulatif sebelum titik awal sebagai *belum tersedia*; dan bila saldo awal belum diatur, gunakan metrik *Akumulasi Transaksi* berlabel jujur.

**Next:** Simpan dokumen ini sebagai referensi discovery. Setelah fitur V2 lain diprioritaskan, review pertanyaan terbuka dan gabungkan keputusan final ke dokumen requirement/data model V2; jangan mengubah V1.
