# 📊 DOKUMENTASI DASHBOARD KASIR BERKAH 88

## 🎯 PANDUAN MEMAHAMI METRIK KEUANGAN

Dokumen ini menjelaskan setiap kartu metrik yang ada di dashboard dan cara membacanya dengan benar.

---

## 📌 METRIK UTAMA DASHBOARD

### 1️⃣ **Modal Awal**
**Nilai:** Rp 626.000  
**Warna:** Ungu  
**Penjelasan:**  
- Jumlah modal awal yang Anda setorkan saat memulai bisnis
- Angka ini diambil dari pengaturan awal di halaman Settings
- Tidak berubah kecuali Anda update manual di Settings

**Cara Baca:**  
"Saya memulai bisnis dengan modal Rp 626.000"

---

### 2️⃣ **Modal Berjalan**
**Nilai:** Rp 462.500  
**Warna:** Biru  
**Rumus:** `Modal Awal + Total Pendapatan + Total Stok - Total Pengeluaran`

**Penjelasan:**  
- Nilai total kekayaan bisnis Anda saat ini (termasuk uang + barang)
- Menunjukkan berapa seharusnya nilai aset Anda berdasarkan catatan
- Jika ada stok barang, nilainya ikut dihitung di sini

**Cara Baca:**  
"Berdasarkan catatan, total kekayaan bisnis saya seharusnya Rp 462.500"

---

### 3️⃣ **Modal Akhir Saat Ini (Uang Nyata)**
**Nilai:** Rp 762.500  
**Warna:** Hijau  
**Rumus:** `Saldo Owner + Saldo Lapak`

**Penjelasan:**  
- Uang TUNAI yang benar-benar ada di tangan Anda saat ini
- Gabungan dari saldo di dompet owner dan saldo di kasir lapak
- Ini adalah uang fisik yang bisa Anda pegang/lihat

**Cara Baca:**  
"Uang tunai yang saya pegang sekarang adalah Rp 762.500"

---

### 4️⃣ **Total Nilai Stok (Bahan & Menu)**
**Nilai:** Rp 0  
**Warna:** Ungu  
**Penjelasan:**  
- Nilai total semua stok barang yang Anda miliki saat ini
- Termasuk bahan mentah (beras, gas, dll) dan menu siap jual
- Dihitung dari: `Jumlah Stok × Harga per Item`

**Cara Baca:**  
"Nilai barang yang saya punya di gudang/toko adalah Rp 0"

---

### 5️⃣ **Saldo Owner**
**Nilai:** Rp 586.000  
**Warna:** Hijau  
**Penjelasan:**  
- Uang yang ada di dompet/rekening owner (Anda)
- Biasanya untuk simpanan atau modal cadangan
- Bisa ditambah/dikurangi melalui fitur Transfer Dana

**Cara Baca:**  
"Uang di dompet saya (owner) adalah Rp 586.000"

---

### 6️⃣ **Kekayaan Bisnis (Equity)**
**Nilai:** Rp 462.500  
**Warna:** Kuning/Gold  
**Rumus:** `Modal Awal + Laba Bersih`

**Penjelasan:**  
- Target kekayaan yang seharusnya Anda miliki
- Menunjukkan pertumbuhan bisnis dari awal hingga sekarang
- Jika positif = bisnis untung, jika negatif = bisnis rugi

**Cara Baca:**  
"Dari modal awal Rp 626.000, setelah dikurangi rugi Rp 163.500, seharusnya kekayaan saya Rp 462.500"

---

### 7️⃣ **Total Pendapatan (Semua Waktu)**
**Nilai:** Rp 1.182.000  
**Warna:** Hijau  
**Penjelasan:**  
- Total semua uang yang masuk dari penjualan
- Dihitung dari awal bisnis sampai sekarang
- Tidak termasuk transaksi "Makan Karyawan"

**Cara Baca:**  
"Total uang yang saya dapat dari jualan adalah Rp 1.182.000"

---

### 8️⃣ **Total Pengeluaran (Semua Waktu)**
**Nilai:** Rp 1.345.500  
**Warna:** Merah  
**Penjelasan:**  
- Total semua uang yang keluar untuk biaya operasional
- Termasuk: belanja bahan, gaji, listrik, transport, dll
- Dihitung dari awal bisnis sampai sekarang

**Cara Baca:**  
"Total uang yang saya keluarkan untuk biaya adalah Rp 1.345.500"

---

### 9️⃣ **Total Laba Bersih (Semua Waktu)**
**Nilai:** -Rp 163.500 (RUGI)  
**Warna:** Merah (karena minus)  
**Rumus:** `Total Pendapatan - Total Pengeluaran`

**Penjelasan:**  
- Hasil akhir bisnis Anda (untung atau rugi)
- Jika positif (+) = UNTUNG
- Jika negatif (-) = RUGI
- Ini adalah indikator kesehatan bisnis

**Cara Baca:**  
"Bisnis saya saat ini RUGI Rp 163.500 karena pengeluaran lebih besar dari pendapatan"

---

### 🔟 **Selisih Perhitungan (Audit)** ⭐ PENTING!
**Nilai:** + Rp 300.000 (Uang Lebih)  
**Warna:** Biru (info)  
**Rumus:** `Modal Akhir - (Modal Awal + Pendapatan - Pengeluaran)`

**Penjelasan DETAIL:**  
Kartu ini adalah **ALAT AUDIT** untuk mengecek apakah uang Anda sesuai dengan catatan.

**Cara Kerja:**
1. **Hitung Uang Seharusnya:**  
   `626.000 (Modal Awal) + 1.182.000 (Pendapatan) - 1.345.500 (Pengeluaran) = 462.500`

2. **Bandingkan dengan Uang Nyata:**  
   `762.500 (Uang di Tangan) - 462.500 (Uang Seharusnya) = + 300.000`

**Hasil Interpretasi:**

| Hasil | Warna | Artinya | Tindakan |
|-------|-------|---------|----------|
| **+ Rp XXX (Uang Lebih)** | 🔵 Biru | Ada uang lebih dari catatan | Cek apakah ada pendapatan yang lupa dicatat, atau ada uang tambahan dari luar |
| **- Rp XXX (Uang Kurang)** | 🔴 Merah | Ada uang hilang/kurang | Cek apakah ada pengeluaran yang lupa dicatat, atau ada kebocoran uang |
| **Data Akurat (Pas)** | 🟢 Hijau | Uang sesuai dengan catatan | Selamat! Data Anda 100% akurat |

**Cara Baca Kasus Anda:**  
"Uang di tangan saya Rp 762.500, tapi berdasarkan catatan seharusnya hanya Rp 462.500. Artinya ada **Rp 300.000 lebih**. Kemungkinan ada pendapatan yang belum dicatat atau ada sumber uang tambahan."

---

## 🔍 CARA MENGGUNAKAN DASHBOARD UNTUK AUDIT

### ✅ Langkah-Langkah Audit Harian:

1. **Cek Modal Akhir Saat Ini**  
   → Hitung uang fisik di dompet + kasir

2. **Lihat Selisih Perhitungan**  
   → Jika **HIJAU** = Data akurat, lanjut kerja  
   → Jika **BIRU** = Ada uang lebih, cek pendapatan yang lupa dicatat  
   → Jika **MERAH** = Ada uang kurang, cek pengeluaran yang lupa dicatat

3. **Cek Total Laba Bersih**  
   → Jika **MERAH (minus)** = Pengeluaran > Pendapatan, harus hemat  
   → Jika **HIJAU (plus)** = Bisnis sehat, pertahankan

4. **Bandingkan Pendapatan vs Pengeluaran**  
   → Pastikan Pendapatan selalu lebih besar dari Pengeluaran

---

## 🎓 TIPS MENJAGA DATA TETAP AKURAT

1. ✅ **Catat SEMUA transaksi** (jangan ada yang terlewat)
2. ✅ **Cek Selisih Perhitungan setiap hari** (pastikan hijau/pas)
3. ✅ **Hitung uang fisik** setiap tutup toko
4. ✅ **Jangan lupa catat pengeluaran kecil** (bensin, pulsa, dll)
5. ✅ **Update stok barang** jika ada pembelian baru

---

## 📞 BANTUAN

Jika ada pertanyaan atau angka yang tidak sesuai, hubungi developer atau cek kembali:
- Halaman **Tracking Pengeluaran** (untuk cek pengeluaran)
- Halaman **Transaksi** (untuk cek pendapatan)
- Halaman **Uang Bisnis** (untuk cek saldo owner/lapak)

---

**Terakhir Diperbarui:** 7 Januari 2026  
**Versi Dashboard:** 2.0 (Audit Akurat)
