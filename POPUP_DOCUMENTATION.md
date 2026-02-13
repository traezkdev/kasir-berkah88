# Dokumentasi Fitur Multiple Popup

## Gambaran Umum
Sistem popup telah diupgrade untuk mendukung:
1. **Multiple Popup** - Bisa menambahkan lebih dari 1 popup
2. **Kontrol Halaman** - Popup bisa ditampilkan di halaman tertentu saja
3. **Push Ulang** - Popup yang sudah pernah ditutup bisa di-push ulang
4. **Prioritas** - Mengatur urutan tampilan popup
5. **Statistik** - Tracking views dan clicks

## Struktur Database

### Tabel `popups`
```sql
CREATE TABLE popups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(255),
  link_type VARCHAR(50) DEFAULT 'none',
  link_value VARCHAR(255) DEFAULT NULL,
  show_on_pages JSON DEFAULT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_pushed_at TIMESTAMP NULL DEFAULT NULL
);
```

### Field Explanation:
- **id**: ID unik popup
- **title**: Judul popup
- **image_url**: URL gambar popup
- **link_type**: Tipe link ('none', 'url', 'screen')
- **link_value**: Nilai link (URL atau nama screen)
- **show_on_pages**: Array halaman tempat popup ditampilkan (JSON)
  - Contoh: `["dashboard", "menu", "cart"]`
  - Jika kosong `[]`, popup tampil di semua halaman
- **priority**: Prioritas tampilan (semakin tinggi, semakin duluan muncul)
- **is_active**: Status aktif/nonaktif
- **view_count**: Jumlah popup dilihat
- **click_count**: Jumlah popup diklik
- **last_pushed_at**: Waktu terakhir di-push (untuk push ulang)

## API Endpoints

### 1. Get All Popups (Seller/Admin)
```
GET /api/popups
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "Promo Ramadan",
      "image_url": "/public/uploads/popup1.jpg",
      "link_type": "screen",
      "link_value": "PromoScreen",
      "show_on_pages": ["dashboard", "menu"],
      "priority": 10,
      "is_active": true,
      "view_count": 150,
      "click_count": 45,
      "created_at": "2026-02-12T10:00:00Z",
      "last_pushed_at": "2026-02-12T15:00:00Z"
    }
  ]
}
```

### 2. Get Active Popups (Customer)
```
GET /api/popups/active?page=dashboard
```

Query Parameters:
- `page` (optional): Filter popup berdasarkan halaman
  - Nilai: `dashboard`, `menu`, `cart`, `profile`, `promo`, dll

Response:
```json
{
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "Promo Ramadan",
      "image_url": "/public/uploads/popup1.jpg",
      "link_type": "screen",
      "link_value": "PromoScreen",
      "show_on_pages": ["dashboard", "menu"],
      "priority": 10
    }
  ]
}
```

### 3. Create Popup
```
POST /api/popups
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Body:
```json
{
  "data": {
    "title": "Promo Spesial",
    "link_type": "screen",
    "link_value": "PromoScreen",
    "show_on_pages": ["dashboard", "menu"],
    "priority": 5,
    "is_active": true
  },
  "image": <file>
}
```

### 4. Update Popup
```
PUT /api/popups/:id
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Body:
```json
{
  "data": {
    "title": "Promo Updated",
    "link_type": "url",
    "link_value": "https://example.com",
    "show_on_pages": ["dashboard"],
    "priority": 8,
    "is_active": true,
    "remove_image": false
  },
  "image": <file> (optional)
}
```

### 5. Delete Popup
```
DELETE /api/popups/:id
Headers: Authorization: Bearer <token>
```

### 6. Push Popup Ulang
```
POST /api/popups/:id/push
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "message": "Popup berhasil di-push ulang",
  "data": {
    "id": 1,
    "last_pushed_at": "2026-02-12T16:00:00Z"
  }
}
```

### 7. Track View
```
POST /api/popups/:id/view
```

### 8. Track Click
```
POST /api/popups/:id/click
```

### 9. Get Statistics
```
GET /api/popups/:id/stats
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "message": "success",
  "data": {
    "view_count": 150,
    "click_count": 45,
    "ctr": 30.00,
    "last_pushed_at": "2026-02-12T15:00:00Z"
  }
}
```

## Cara Kerja Sistem

### 1. Menampilkan Popup di Customer App
```javascript
// Fetch popup untuk halaman tertentu
const response = await fetch(`${API_URL}/api/popups/active?page=dashboard`);
const { data: popups } = await response.json();

// Popup sudah terurut berdasarkan priority
// Tampilkan popup satu per satu atau sekaligus
```

### 2. Tracking Views dan Clicks
```javascript
// Saat popup ditampilkan
await fetch(`${API_URL}/api/popups/${popupId}/view`, {
  method: 'POST'
});

// Saat popup diklik
await fetch(`${API_URL}/api/popups/${popupId}/click`, {
  method: 'POST'
});
```

### 3. Push Ulang Popup
Ketika seller menekan tombol "Push Ulang":
- Field `last_pushed_at` diupdate ke waktu sekarang
- Customer yang sudah pernah menutup popup akan melihatnya lagi
- Berguna untuk promo penting yang perlu dilihat ulang

## Halaman yang Tersedia

Berikut halaman-halaman yang bisa dipilih untuk menampilkan popup:

### Customer Pages:
- `dashboard` - Dashboard customer
- `menu` - Halaman menu/katalog
- `cart` - Keranjang belanja
- `profile` - Profil customer
- `promo` - Halaman promo
- `orders` - Riwayat pesanan
- `points` - Riwayat poin

### Seller Pages:
- `seller_dashboard` - Dashboard penjual
- `seller_orders` - Pesanan masuk
- `seller_products` - Manajemen produk

## Contoh Penggunaan

### Scenario 1: Popup Promo untuk Dashboard dan Menu
```json
{
  "title": "Diskon 50% Hari Ini!",
  "show_on_pages": ["dashboard", "menu"],
  "priority": 10,
  "is_active": true
}
```

### Scenario 2: Popup Info untuk Semua Halaman
```json
{
  "title": "Aplikasi Update v1.6.1",
  "show_on_pages": [],
  "priority": 5,
  "is_active": true
}
```

### Scenario 3: Popup Khusus Cart
```json
{
  "title": "Gratis Ongkir Min. Belanja 50rb",
  "show_on_pages": ["cart"],
  "priority": 8,
  "is_active": true
}
```

## Tips Best Practices

1. **Prioritas**:
   - Gunakan angka 1-10
   - 10 = Paling penting (muncul duluan)
   - 1 = Kurang penting

2. **Halaman**:
   - Kosongkan array untuk popup global
   - Pilih halaman spesifik untuk popup yang relevan
   - Jangan terlalu banyak popup di satu halaman

3. **Push Ulang**:
   - Gunakan untuk promo penting
   - Jangan terlalu sering (spam)
   - Idealnya 1-2 kali per hari max

4. **Gambar**:
   - Ukuran optimal: 800x600px
   - Format: JPG/PNG
   - Ukuran file: < 500KB

## Migration dari Sistem Lama

Sistem lama menggunakan `settings` table dengan key `popup_promo_enabled` dan `popup_promo_image`.

Untuk migrasi:
1. Buat popup baru menggunakan API
2. Upload gambar yang sama
3. Set `show_on_pages` sesuai kebutuhan
4. Nonaktifkan setting lama jika perlu

## Troubleshooting

### Popup tidak muncul?
- Cek `is_active = true`
- Cek `show_on_pages` sesuai halaman
- Cek priority (popup dengan priority lebih tinggi muncul duluan)

### Gambar tidak tampil?
- Pastikan path gambar benar
- Cek file ada di folder `backend/public/uploads/`
- Cek permission folder

### Push ulang tidak bekerja?
- Pastikan `last_pushed_at` terupdate
- Implementasi di frontend harus cek timestamp ini
- Customer harus clear local storage popup yang sudah ditutup
