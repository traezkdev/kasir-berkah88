# 🏪 Kasir Berkah88

Sistem Point of Sale (POS) dan manajemen bisnis berbasis web yang lengkap dan modern. Dibangun dengan React + Vite untuk frontend, Node.js/Express untuk backend, dan AI Chatbot untuk customer support. Dirancang khusus untuk bisnis F&B (Food & Beverage) dengan fitur lengkap dari transaksi, inventori, keuangan, hingga analitik.

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Fitur Utama

### 🎯 **Manajemen Penjualan & Transaksi**
- **Point of Sale (POS)** - Interface kasir yang cepat dan intuitif
- **Transaksi Sederhana** - Mode transaksi cepat untuk penjualan langsung
- **Riwayat Transaksi** - Pencatatan lengkap dengan filter tanggal dan metode pembayaran
- **Cetak Struk** - Thermal printer support (58mm) dengan format optimized
- **Multi Payment Method** - Tunai, Transfer, GoPay, dan Makan Karyawan
- **Diskon & Promo** - Sistem diskon manual dan otomatis
- **Catatan Transaksi** - Tambahkan notes untuk setiap transaksi

### 📦 **Manajemen Inventori & Stok**
- **Menu Management** - CRUD lengkap untuk item menu dengan kategori
- **Stok Bahan Baku** - Tracking bahan mentah dengan unit custom
- **Resep Menu** - Hubungkan menu dengan bahan baku (BOM - Bill of Materials)
- **Stok Kritis** - Alert otomatis untuk stok menipis
- **Saran Pembelian** - Rekomendasi quantity pembelian berdasarkan stok minimum
- **Riwayat Pergerakan Stok** - Log keluar-masuk stok dengan detail

### 💰 **Manajemen Keuangan**
- **Rekonsiliasi Kas** - Pencocokan kas fisik vs sistem
- **Tracking Pengeluaran** - Pencatatan pengeluaran dengan 10+ kategori
- **Manajemen Akun** - Owner Deposit & Lapak Deposit
- **Laporan Keuangan** - Dashboard dengan metrik real-time
- **Analitik Pengeluaran** - Chart dan visualisasi data pengeluaran
- **Export Data** - Export ke Excel dan PDF

### 👥 **Manajemen Tim & User**
- **Role-Based Access Control (RBAC)**:
  - **Admin** - Full access ke semua fitur
  - **Owner** - Akses laporan dan keuangan
  - **Kasir** - Fokus pada transaksi penjualan
  - **Guest** - View-only access
- **Manajemen Karyawan** - Data karyawan dengan posisi dan kontak
- **Catatan Internal** - Sistem notes untuk komunikasi tim
- **Master Password** - Proteksi untuk operasi sensitif

### 📊 **Dashboard & Reporting**
- **Dashboard Utama** - Metrik bisnis real-time
- **Quick Actions** - Shortcut untuk fitur yang sering digunakan
- **Data Visualization** - Chart dan grafik interaktif
- **Filter & Search** - Pencarian dan filter data yang powerful
- **Responsive Design** - Optimized untuk desktop dan mobile

### 🤖 **AI Chatbot Assistant**
- **BerkahBot** - AI assistant yang memahami semua fitur aplikasi
- **Database Knowledge** - Tahu struktur 20+ tabel database
- **Real-time Data Analysis** - Analisis stok, keuangan, dan transaksi
- **Feature Guidance** - Panduan step-by-step penggunaan fitur
- **Chat-based Transactions** - Inisiasi transaksi via chat
- **Multi AI Provider** - Support Groq, Gemini, dan OpenAI

### 🎨 **UI/UX Features**
- **Dark Mode** - Theme switching (Default & Admin theme)
- **Responsive Layout** - Mobile-first design
- **Bottom Navigation** - Quick access di mobile
- **Floating Widget** - Chatbot widget yang dapat di-minimize
- **Toast Notifications** - Feedback visual untuk setiap action
- **Loading States** - Skeleton loading dan spinners
- **Modal & Dialogs** - Confirmation modals untuk operasi penting

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - UI library dengan hooks
- **Vite** - Build tool yang super cepat
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Lucide React** - Icon library
- **date-fns** - Date manipulation dengan timezone support
- **XLSX & jsPDF** - Export data ke Excel dan PDF

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Relational database
- **JWT** - Authentication & authorization
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### **AI Chatbot**
- **Groq SDK** - Fast AI inference
- **Google Generative AI** - Gemini models
- **OpenAI** - GPT models
- **LangChain** - Text processing
- **Xenova Transformers** - Embeddings untuk RAG
- **Vector Database** - Semantic search

---

## 📋 Prerequisites

- **Node.js** v18.x atau lebih baru
- **npm** atau **yarn**
- **MySQL** v8.x atau lebih baru
- **AI API Key** (Groq/Gemini/OpenAI) untuk chatbot

---

## 🚀 Instalasi & Setup

### 1️⃣ **Clone Repository**
```bash
git clone https://github.com/traezkdev/kasir-berkah88.git
cd kasir-berkah88
```

### 2️⃣ **Setup Database**
```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE kasir CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kasir_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON kasir.* TO 'kasir_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3️⃣ **Setup Backend**
```bash
cd backend
npm install

# Buat file .env
cat > .env << EOF
DB_HOST=localhost
DB_USER=kasir_user
DB_PASSWORD=your_password
DB_DATABASE=kasir
DB_PORT=3306
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
EOF

# Jalankan server (database schema otomatis dibuat)
npm start
# Backend running di http://localhost:4000
```

### 4️⃣ **Setup Frontend**
```bash
cd ..
npm install

# Buat file .env
cat > .env << EOF
VITE_API_URL=http://localhost:4000
JWT_SECRET=same_as_backend
EOF

# Jalankan development server
npm run dev
# Frontend running di http://localhost:5173
```

### 5️⃣ **Setup Chatbot (Opsional)**
```bash
cd chatbot
npm install

# Buat file .env
cat > .env << EOF
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
PORT=4001
AI_PROVIDER=groq

# Database (sama dengan backend)
DB_HOST=localhost
DB_USER=kasir_user
DB_PASSWORD=your_password
DB_DATABASE=kasir
DB_PORT=3306
EOF

# Generate vector database (opsional untuk RAG)
npm run ingest

# Jalankan chatbot server
npm start
# Chatbot running di http://localhost:4001
```

### 6️⃣ **Akses Aplikasi**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Chatbot**: http://localhost:4001

**Default Login:**
- Username: `admin`
- Password: `admin123`

⚠️ **PENTING**: Ganti password default setelah login pertama!

---

## 📁 Struktur Proyek

```
kasir-berkah88/
├── public/                     # Static assets
├── src/                        # Frontend source code
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   └── admin/              # Admin-specific components
│   ├── pages/                  # Page components
│   │   ├── main-dashboard/     # Dashboard utama
│   │   ├── menu-management/    # Manajemen menu
│   │   ├── raw-material-stock/ # Stok bahan baku
│   │   ├── transaction-history/# Riwayat transaksi
│   │   ├── expense-tracking/   # Tracking pengeluaran
│   │   ├── cash-reconciliation/# Rekonsiliasi kas
│   │   ├── chatbot/            # Halaman chatbot
│   │   └── settings/           # Pengaturan
│   ├── contexts/               # React contexts
│   ├── utils/                  # Utility functions
│   ├── App.jsx                 # Root component
│   ├── Routes.jsx              # Route configuration
│   └── main.jsx                # Entry point
├── backend/                    # Backend source code
│   ├── database.js             # Database schema & migrations
│   ├── server.js               # Express server & API routes
│   └── .env                    # Backend environment variables
├── chatbot/                    # AI Chatbot
│   ├── server.js               # Chatbot server
│   ├── ingest.js               # Vector DB generator
│   ├── database-schema.js      # DB schema documentation
│   ├── widget.js               # Chatbot widget
│   └── .env                    # Chatbot environment variables
├── .env                        # Frontend environment variables
├── INSTALASI_PRODUKSI.txt      # Production deployment guide
├── package.json                # Frontend dependencies
├── tailwind.config.js          # Tailwind configuration
└── vite.config.js              # Vite configuration
```

---

## 🎨 Styling & Theming

Aplikasi menggunakan **TailwindCSS** dengan konfigurasi custom:
- **2 Theme Variants**: Default (Light) dan Admin (Dark)
- **Custom Color Palette**: Primary, Secondary, Accent, Destructive
- **Responsive Breakpoints**: Mobile-first approach
- **Custom Animations**: Smooth transitions dan micro-interactions
- **Typography**: Font Inter dari Google Fonts

---

## 🔐 Security Features

- **JWT Authentication** - Token-based auth dengan expiry
- **Password Hashing** - bcrypt untuk password security
- **Master Password** - Extra layer untuk operasi sensitif
- **RBAC** - Role-based access control
- **SQL Injection Prevention** - Prepared statements
- **XSS Protection** - Input sanitization
- **CORS Configuration** - Controlled cross-origin access

---

## 📦 Deployment

### **Production Build**
```bash
# Build frontend
npm run build
# Output: dist/

# Backend & Chatbot siap deploy as-is
```

### **Deployment Options**
1. **VPS/Dedicated Server** - Lihat `INSTALASI_PRODUKSI.txt`
2. **Docker** - Dockerfile included (coming soon)
3. **Cloud Platforms** - AWS, GCP, Azure compatible

### **Recommended Stack**
- **Web Server**: Nginx
- **Process Manager**: PM2
- **SSL**: Let's Encrypt (Certbot)
- **Database**: MySQL 8.x
- **OS**: Ubuntu 20.04+

---

## 🧪 Testing

```bash
# Run tests (jika tersedia)
npm test

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📊 Database Schema

Aplikasi menggunakan **20+ tabel** untuk mengelola data:

**Core Tables:**
- `users` - User accounts & authentication
- `employees` - Employee data
- `menu_items` - Menu products
- `categories` - Menu categories
- `raw_materials` - Raw material inventory
- `menu_recipes` - Menu-material relationships

**Transaction Tables:**
- `transactions` - Sales transactions
- `simple_transactions` - Quick sales
- `orders` - Order details

**Financial Tables:**
- `expenses` - Business expenses
- `cash_reconciliations` - Cash reconciliation records
- `accounts` - Financial accounts

**System Tables:**
- `settings` - App settings
- `app_settings` - Application configuration
- `notes` - Internal notes

Lihat `chatbot/database-schema.js` untuk dokumentasi lengkap.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

**Kang Alfin (traezkdev)**
- Email: traezkdev@gmail.com
- GitHub: [@traezkdev](https://github.com/traezkdev)

---

## 🙏 Acknowledgments

- React Team untuk amazing library
- Tailwind Labs untuk TailwindCSS
- Groq untuk fast AI inference
- Semua open-source contributors

---

## 📞 Support

Jika ada pertanyaan atau masalah:
- 📧 Email: traezkdev@gmail.com
- 📖 Documentation: Lihat `INSTALASI_PRODUKSI.txt`
- 🐛 Issues: [GitHub Issues](https://github.com/traezkdev/kasir-berkah88/issues)

---

**Made with ❤️ for Berkah88**

Selamat menggunakan Kasir Berkah88! 🚀