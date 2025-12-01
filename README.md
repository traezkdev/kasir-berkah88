# Kasir Berkah 88

Sistem manajemen Point of Sale (POS) dan inventaris berbasis web modern yang dibangun dengan React untuk frontend dan Node.js/Express.js untuk backend. Dirancang untuk membantu bisnis kecil hingga menengah mengelola penjualan, inventaris, bahan baku, dan staf secara efisien dengan kontrol akses berbasis peran yang kuat.

## 🚀 Fitur

### Frontend & Teknologi Inti
-   **React 18** - Pustaka JavaScript modern untuk membangun antarmuka pengguna.
-   **Vite** - Alat pembangunan dan server pengembangan yang sangat cepat.
-   **Redux Toolkit** - Manajemen status dengan pengaturan Redux yang disederhanakan.
-   **TailwindCSS** - Kerangka kerja CSS berbasis utilitas untuk pengembangan UI yang cepat dan desain responsif.
-   **React Router v6** - Routing deklaratif untuk aplikasi React.
-   **Visualisasi Data** - Integrasi D3.js dan Recharts untuk visualisasi data yang kuat (jika berlaku).
-   **Form Management** - React Hook Form untuk penanganan formulir yang efisien.
-   **Animation** - Framer Motion untuk animasi UI yang halus (jika berlaku).
-   **Authentication (JWT)** - Secure user login dan session management.

### Fitur Aplikasi Utama

-   **Kontrol Akses Berbasis Peran (RBAC):**
    -   **Admin:** Akses penuh ke semua fitur, pengaturan, manajemen pengguna, dan operasi data sensitif.
    -   **Owner:** Akses ke laporan keuangan, bahan baku, dan wawasan dashboard.
    -   **Kasir:** Terutama untuk memproses transaksi penjualan.
    -   **User:** Akses terbatas, biasanya untuk operasi dasar.
    -   **Guest:** Akses tampilan yang sangat terbatas.
-   **Dashboard Utama (`/`):**
    -   Gambaran umum metrik bisnis utama (pendapatan, pengeluaran, laba bersih, nilai stok).
    -   Tombol tindakan cepat untuk tugas-tugas umum (misalnya, transaksi baru, kelola menu).
    -   **Status Sinkronisasi Data Hanya Baca:** Menampilkan waktu terakhir diperbarui untuk Stok Menu, Stok Bahan Baku, dan Dana Lapak.
-   **Manajemen Menu:**
    -   Operasi CRUD (Buat, Baca, Perbarui, Hapus) untuk item menu.
    -   Kelola harga item, tingkat stok, kategori, HPP (Harga Pokok Penjualan), diskon, dan status unggulan.
-   **Manajemen Stok Bahan Baku (`/raw-material-stock`):**
    -   Operasi CRUD yang komprehensif untuk bahan baku.
    -   Lacak `current_stock` (stok fisik), `menu_stock` (stok bahan yang sudah diolah/siap jual), `stok_minimum`, `suggestion_purchase_quantity`, `price_per_item`, dan `custom_unit`.
    -   **Logika Stok Gabungan:** Secara kritis menentukan status stok berdasarkan `(current_stock + menu_stock)`.
    -   Fitur untuk mencatat pergerakan stok masuk dan keluar.
-   **Tampilan Stok Kritis (`/main-critical-stock`):**
    -   Halaman khusus untuk menampilkan bahan baku yang stok gabungannya (`current_stock + menu_stock`) berada di bawah `stok_minimum`.
    -   Notifikasi terperinci yang menunjukkan defisit (misalnya, "Stok menipis, kurang X dari standar").
    -   Menyediakan jumlah pembelian yang disarankan untuk item-item kritis.
-   **Manajemen Transaksi:**
    -   Memproses transaksi penjualan baru secara efisien.
    -   Melihat riwayat transaksi, termasuk transaksi yang dihapus secara lunak (dibuang).
    -   Dukungan untuk diskon manual dan makanan karyawan.
-   **Pelacakan Pengeluaran:**
    -   Mencatat dan mengelola pengeluaran bisnis berdasarkan kategori.
    -   Melihat riwayat pengeluaran.
-   **Manajemen Akun:**
    -   Mengelola akun "Owner Deposit" dan "Lapak Deposit" untuk pelacakan keuangan.
    -   Mencatat deposit dan pengeluaran untuk setiap akun.
-   **Pengaturan (`/settings`):**
    -   Pengaturan aplikasi umum (judul situs web, logo, deskripsi, pendaftaran).
    -   Manajemen Pengguna dan Karyawan (khusus Admin).
    -   Manajemen kata sandi master untuk operasi sensitif.
    -   **Modal Sinkronisasi Data:** Modal khusus untuk secara manual memicu sinkronisasi data tertentu untuk Stok Menu, Bahan Baku, dan Dana Lapak, masing-masing memperbarui stempel waktunya sendiri.

### Backend (API)
-   **Node.js dengan Express.js** - Kerangka kerja sisi server yang kuat dan skalabel.
-   **MySQL Database** - Basis data relasional untuk menyimpan semua data aplikasi.
-   **`rawMaterialsDb.js`** - Modul terpusat untuk mengelola operasi basis data bahan baku, memastikan integritas data dan logika bisnis.
-   **`database.js`** - Mengelola koneksi basis data dan migrasi/pembaruan skema otomatis saat server dimulai.
-   **JWT untuk Keamanan API** - Melindungi endpoint API dengan autentikasi berbasis token.

## 📋 Prasyarat

-   Node.js (v14.x atau lebih tinggi)
-   npm atau yarn
-   MySQL Server (akses lokal atau jarak jauh)

## 🛠️ Instalasi

1.  **Kloning repositori:**
    ```bash
    git clone [repository-url]
    cd kasir-berkah88
    ```

2.  **Pengaturan Backend:**
    ```bash
    cd backend
    npm install
    # Buat file .env berdasarkan .env.example dengan kredensial MySQL dan JWT_SECRET Anda
    # Contoh isi .env:
    # DB_HOST=localhost
    # DB_USER=root
    # DB_PASSWORD=kata_sandi_anda
    # DB_DATABASE=kasir_berkah88
    # JWT_SECRET=kunci_rahasia_jwt_super
    # VITE_API_URL=http://localhost:4000 (atau URL backend yang Anda deploy)
    npm start # Atau gunakan `node server.js`
    # Tabel database akan secara otomatis dibuat/diperbarui pada saat pertama dijalankan.
    ```

3.  **Pengaturan Frontend:**
    ```bash
    cd .. # Kembali ke direktori root
    npm install
    # Buat file .env berdasarkan .env.example dengan URL API backend Anda
    # Contoh isi .env:
    # VITE_API_URL=http://localhost:4000
    npm run dev
    ```

4.  **Akses Aplikasi:**
    Buka browser Anda dan navigasikan ke `http://localhost:5173` (atau alamat yang disediakan oleh Vite).

## 📁 Struktur Proyek

```
kasir-berkah88/
├── public/                 # Aset statis untuk frontend
├── src/                    # Kode sumber frontend
│   ├── components/         # Komponen UI yang dapat digunakan kembali
│   ├── pages/              # Komponen halaman (misalnya, MainDashboard, RawMaterialStock)
│   ├── styles/             # Gaya global dan konfigurasi Tailwind
│   ├── utils/              # Fungsi utilitas (authFetch.js, dll.)
│   ├── App.jsx             # Komponen aplikasi utama
│   ├── Routes.jsx          # Konfigurasi rute aplikasi
│   └── index.jsx           # Titik masuk aplikasi
├── backend/                # Kode sumber backend
│   ├── database.js         # Koneksi dan manajemen skema MySQL
│   ├── rawMaterialsDb.js   # Fungsi database khusus bahan baku
│   ├── server.js           # Server Express.js utama dan rute API
│   └── .env                # Variabel lingkungan backend
├── .env                    # Variabel lingkungan frontend
├── index.html              # Template HTML frontend
├── package.json            # Dependensi dan skrip proyek (frontend)
├── tailwind.config.js      # Konfigurasi Tailwind CSS
└── vite.config.js          # Konfigurasi Vite
```

## 🎨 Styling

Proyek ini menggunakan Tailwind CSS untuk styling. Konfigurasi meliputi:
-   Plugin Formulir untuk styling formulir.
-   Plugin Tipografi untuk styling teks.
-   Plugin Rasio Aspek untuk elemen responsif.
-   Kueri Kontainer untuk desain responsif khusus komponen.
-   Tipografi Cair untuk teks responsif.
-   Utilitas animasi.

Aplikasi ini dibangun dengan desain responsif menggunakan breakpoint Tailwind CSS.

## 📦 Deployment

Bangun aplikasi frontend untuk produksi:

```bash
npm run build
```
Deploy folder `dist` ke hosting statis Anda. Folder `backend` harus di-deploy secara terpisah ke lingkungan server Node.js.