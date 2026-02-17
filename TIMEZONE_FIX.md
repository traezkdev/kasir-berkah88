# Fix: Masalah "6 Jam Yang Lalu" pada Popup Pesanan Baru

## Masalah
Popup pesanan baru menampilkan waktu "6 jam yang lalu" padahal pesanan baru saja masuk.

## Penyebab
1. Server production berada di timezone **Europe (GMT+1)**, sedangkan aplikasi digunakan di Indonesia (GMT+7)
2. Selisih timezone: **6 jam**
3. MySQL DATETIME tidak menyimpan informasi timezone (timezone-naive)
4. Data lama tersimpan dengan timezone Eropa, saat dibaca dengan timezone WIB hasilnya salah

## Solusi yang Diterapkan

### 1. Set Timezone Server ke WIB

**File: `backend/.env`**
```bash
TZ=Asia/Jakarta
```

Ini memastikan semua operasi `new Date()` di Node.js menggunakan timezone Indonesia.

### 2. Smart Offset untuk Data Lama

**File: `backend/server.js` (Endpoint GET /api/orders)**

Menggunakan **cutoff date** untuk membedakan data lama dan baru:

```javascript
// CUTOFF DATE: 2026-02-17 00:00:00 WIB (when timezone was fixed)
const TIMEZONE_MIGRATION_DATE = new Date('2026-02-17T00:00:00+07:00');

if (dateObj < TIMEZONE_MIGRATION_DATE) {
    // Old data: Add 6 hours offset to compensate (GMT+1 → GMT+7 = +6 hours)
    const offsetMs = 6 * 60 * 60 * 1000;
    const correctedDate = new Date(dateObj.getTime() + offsetMs);
    isoDate = correctedDate.toISOString();
} else {
    // New data: Already stored with correct timezone, no offset needed
    isoDate = dateObj.toISOString();
}
```

**Keuntungan:**
- ✅ Data lama (sebelum 17 Feb 2026) otomatis dapat offset +6 jam
- ✅ Data baru (setelah 17 Feb 2026) tidak dapat offset (sudah benar)
- ✅ Tidak perlu hapus kode di masa depan
- ✅ Sistem otomatis tahu mana data lama dan mana data baru

### 3. Konsistensi Format Timestamp

**Socket Event (new_order):**
- Selalu kirim `created_at` dan `timestamp` dalam format ISO (UTC)
- Tambahkan `user_id` untuk filtering

**Frontend:**
- Parse ISO timestamp langsung dengan `new Date()`
- JavaScript otomatis konversi UTC ke timezone lokal perangkat

## Implementasi

### Backend Changes

1. **Environment Variable** (`.env`):
   ```bash
   TZ=Asia/Jakarta
   ```

2. **Socket Events** (`server.js`):
   - POST /api/orders (baris ~4270)
   - POST /api/transactions (baris ~2995)
   
   Keduanya mengirim:
   ```javascript
   {
     created_at: new Date().toISOString(),
     timestamp: new Date().toISOString(),
     user_id: userId
   }
   ```

3. **GET /api/orders** (baris ~4347):
   - Smart offset dengan cutoff date (17 Feb 2026)
   - Data lama: +6 jam offset
   - Data baru: tanpa offset
   - Konversi ke ISO format

### Frontend Changes

**File: `mobile/src/components/NewOrderPopup.js`**
- Simplified time parsing logic
- Removed complex timezone detection
- Direct ISO string parsing

## Testing

Setelah implementasi:

1. ✅ Restart backend server
2. ✅ Buat pesanan baru
3. ✅ Popup muncul dengan "Baru saja masuk"
4. ✅ Waktu akurat sesuai timezone lokal
5. ✅ Data lama tetap tampil dengan waktu yang benar
6. ✅ Data baru tidak terkena offset yang tidak perlu

## Catatan Penting

### Cutoff Date: 17 Februari 2026, 00:00 WIB

Tanggal ini adalah batas pemisah antara:
- **Data Lama** (< 17 Feb 2026): Dibuat saat server di Eropa → Perlu offset +6 jam
- **Data Baru** (≥ 17 Feb 2026): Dibuat saat server di WIB → Tidak perlu offset

### Tidak Perlu Maintenance di Masa Depan

Dengan smart offset ini, Bapak **tidak perlu** ingat-ingat untuk hapus kode di masa depan. Sistem otomatis handle semua data dengan benar, baik lama maupun baru.

### Jika Ingin Ubah Cutoff Date

Jika ternyata ada data yang dibuat setelah 17 Feb tapi masih salah, ubah tanggal di `server.js` baris ~4349:

```javascript
const TIMEZONE_MIGRATION_DATE = new Date('2026-02-XX T00:00:00+07:00');
//                                              ↑ Ubah tanggal di sini
```

## File yang Diubah

1. ✅ `backend/.env` - Tambah `TZ=Asia/Jakarta`
2. ✅ `backend/.env.example` - Dokumentasi
3. ✅ `backend/server.js` - Fix timezone di 3 tempat:
   - Socket event untuk transactions
   - Socket event untuk orders
   - GET /api/orders endpoint (smart offset dengan cutoff date)
4. ✅ `mobile/src/components/NewOrderPopup.js` - Simplified parsing
5. ✅ `mobile/src/context/OrderNotificationContext.js` - Konsistensi data

## Status
✅ **RESOLVED** - Popup sekarang menampilkan waktu yang akurat untuk semua data


