/**
 * DATABASE SCHEMA DOCUMENTATION
 * Kasir Berkah88 - Database Structure
 * 
 * File ini berisi dokumentasi lengkap struktur database untuk AI Chatbot.
 * PENTING: File ini HANYA untuk referensi AI, TIDAK untuk eksekusi!
 */

// ========================================
// 📋 DAFTAR TABEL DATABASE
// ========================================

const DATABASE_SCHEMA = {

    // 1. MENU & PRODUK
    menu_items: {
        description: "Daftar menu/produk yang dijual",
        columns: {
            id: "VARCHAR(255) PRIMARY KEY - ID unik menu",
            name: "VARCHAR(255) NOT NULL - Nama menu",
            price: "DECIMAL(10,2) NOT NULL - Harga jual",
            stock: "INT NOT NULL - Jumlah stok tersedia",
            category: "VARCHAR(255) - Kategori menu (Makanan/Minuman/Lainnya)",
            updatedAt: "DATETIME - Waktu terakhir diupdate",
            order_index: "INTEGER DEFAULT 0 - Urutan tampilan menu"
        },
        example: {
            id: "MENU001",
            name: "Ayam Penyet",
            price: 15000,
            stock: 50,
            category: "Makanan"
        }
    },

    menu_item_options: {
        description: "Opsi tambahan untuk menu (misal: Level Pedas, Extra Sambal)",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            menu_item_id: "VARCHAR(255) - Foreign key ke menu_items",
            name: "VARCHAR(255) - Nama opsi",
            price_adjustment: "DECIMAL(10,2) DEFAULT 0 - Penyesuaian harga"
        }
    },

    categories: {
        description: "Kategori menu",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(191) UNIQUE - Nama kategori"
        },
        default_data: ["Makanan", "Minuman", "Lainnya"]
    },

    // 2. TRANSAKSI
    transactions: {
        description: "Riwayat transaksi penjualan",
        columns: {
            id: "VARCHAR(255) PRIMARY KEY - ID transaksi",
            timestamp: "DATETIME NOT NULL - Waktu transaksi",
            items: "JSON NOT NULL - Daftar item yang dibeli (array)",
            total: "DECIMAL(10,2) NOT NULL - Total harga",
            ppn: "DECIMAL(10,2) NOT NULL - Pajak PPN",
            isEmployeeMeal: "BOOLEAN DEFAULT FALSE - Apakah makan karyawan",
            payment_method: "VARCHAR(50) DEFAULT 'Tunai' - Metode bayar (Tunai/Transfer/Gojek)",
            cash_paid: "DECIMAL(10,2) DEFAULT 0 - Uang yang dibayarkan",
            change: "DECIMAL(10,2) DEFAULT 0 - Kembalian",
            manual_discount: "DECIMAL(10,2) DEFAULT 0 - Diskon manual",
            ignore_stock: "TINYINT(1) DEFAULT 0 - Abaikan pengurangan stok",
            order_id: "INT NULL - Foreign key ke orders",
            deleted_at: "DATETIME DEFAULT NULL - Soft delete timestamp",
            is_permanent_delete: "BOOLEAN DEFAULT FALSE - Hapus permanen"
        },
        notes: "Items berisi JSON array seperti: [{id, name, quantity, price, category}]"
    },

    simple_transactions: {
        description: "Transaksi sederhana (interface simpel)",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            user_id: "INT - Foreign key ke users",
            total_amount: "DECIMAL(10,2) NOT NULL",
            payment_method: "VARCHAR(50) NOT NULL",
            cash_paid: "DECIMAL(10,2)",
            change_given: "DECIMAL(10,2)",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        }
    },

    simple_transaction_items: {
        description: "Detail item transaksi sederhana",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            simple_transaction_id: "INT NOT NULL",
            menu_item_id: "VARCHAR(255) NOT NULL",
            item_name: "VARCHAR(255) NOT NULL",
            quantity: "INT NOT NULL",
            price_per_item: "DECIMAL(10,2) NOT NULL",
            total_price: "DECIMAL(10,2) NOT NULL"
        }
    },

    orders: {
        description: "Pesanan yang perlu konfirmasi",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            customer_name: "VARCHAR(255) NOT NULL",
            customer_address: "TEXT",
            items: "JSON NOT NULL",
            total: "DECIMAL(10,2) NOT NULL",
            status: "VARCHAR(50) DEFAULT 'pending' - pending/accepted/rejected",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        }
    },

    // 3. KEUANGAN
    expenses: {
        description: "Catatan pengeluaran operasional",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(255) NOT NULL - Nama pengeluaran",
            amount: "DECIMAL(10,2) NOT NULL - Jumlah",
            category: "VARCHAR(255) - Kategori pengeluaran",
            date: "DATETIME NOT NULL - Tanggal pengeluaran",
            notes: "TEXT DEFAULT NULL - Catatan tambahan"
        }
    },

    cash_reconciliations: {
        description: "Rekonsiliasi kas (cocokkan uang fisik vs sistem)",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            date: "DATE NOT NULL UNIQUE - Tanggal rekonsiliasi",
            expected_tunai: "DECIMAL(15,2) DEFAULT 0 - Tunai yang seharusnya",
            expected_transfer: "DECIMAL(15,2) DEFAULT 0 - Transfer yang seharusnya",
            expected_gojek: "DECIMAL(15,2) DEFAULT 0 - Gojek yang seharusnya",
            actual_tunai: "DECIMAL(15,2) DEFAULT 0 - Tunai aktual",
            actual_transfer: "DECIMAL(15,2) DEFAULT 0 - Transfer aktual",
            actual_gojek: "DECIMAL(15,2) DEFAULT 0 - Gojek aktual",
            variance_tunai: "DECIMAL(15,2) DEFAULT 0 - Selisih tunai",
            variance_transfer: "DECIMAL(15,2) DEFAULT 0 - Selisih transfer",
            variance_gojek: "DECIMAL(15,2) DEFAULT 0 - Selisih gojek",
            notes: "TEXT - Catatan/alasan selisih",
            user_id: "INT - User yang melakukan rekonsiliasi",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        }
    },

    accounts: {
        description: "Akun keuangan (Lapak Deposit & Owner Deposit)",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(191) UNIQUE - Nama akun",
            balance: "DECIMAL(10,2) DEFAULT 0 - Saldo",
            type: "ENUM('lapak','owner') - Tipe akun",
            user_id: "INT NULL - Foreign key ke users",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        },
        default_accounts: [
            { name: "lapak_deposit", type: "lapak" },
            { name: "owner_deposit", type: "owner" }
        ]
    },

    account_transactions: {
        description: "Riwayat transaksi akun (deposit/expense)",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            account_id: "INT NOT NULL - Foreign key ke accounts",
            type: "ENUM('deposit','expense') - Tipe transaksi",
            amount: "DECIMAL(10,2) NOT NULL - Jumlah",
            description: "TEXT - Deskripsi transaksi",
            created_by_user_id: "INT NOT NULL - User yang membuat",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        }
    },

    // 4. STOK & BAHAN BAKU
    raw_materials: {
        description: "Bahan baku mentah",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(191) UNIQUE NOT NULL - Nama bahan",
            unit: "VARCHAR(50) NOT NULL - Satuan (kg/pcs/liter/dll)",
            current_stock: "DECIMAL(10,2) DEFAULT 0 - Stok saat ini",
            stok_minimum: "DECIMAL(10,2) DEFAULT 0 - Batas minimum stok",
            suggestion_purchase_quantity: "DECIMAL(10,2) DEFAULT 0 - Saran jumlah beli",
            price_per_item: "DECIMAL(10,2) DEFAULT 0 - Harga per satuan",
            standard_stock_per_day: "DECIMAL(10,2) DEFAULT 0 - Standar stok per hari",
            menu_stock: "DECIMAL(10,2) DEFAULT 0 - Stok yang sudah jadi menu",
            raw_stock_price: "DECIMAL(10,2) DEFAULT 0 - Harga total stok mentah",
            custom_unit: "VARCHAR(50) DEFAULT 'pcs' - Satuan custom",
            purchase_buffer_amount: "DECIMAL(10,2) DEFAULT 0 - Buffer pembelian",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        }
    },

    material_units: {
        description: "Satuan bahan baku",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(50) UNIQUE NOT NULL - Nama satuan",
            is_calculable: "BOOLEAN DEFAULT TRUE - Bisa dihitung atau tidak",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        },
        default_units: [
            { name: "kg", is_calculable: true },
            { name: "pcs", is_calculable: true },
            { name: "box", is_calculable: true },
            { name: "botol", is_calculable: true },
            { name: "liter", is_calculable: true },
            { name: "gram", is_calculable: false },
            { name: "ml", is_calculable: false },
            { name: "ikat", is_calculable: true },
            { name: "piring", is_calculable: true },
            { name: "cup", is_calculable: true }
        ]
    },

    raw_material_stock_history: {
        description: "Riwayat keluar-masuk stok bahan baku",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            material_id: "INT NOT NULL - Foreign key ke raw_materials",
            type: "ENUM('in','out') NOT NULL - Masuk atau keluar",
            quantity: "DECIMAL(10,2) NOT NULL - Jumlah",
            price_per_unit: "DECIMAL(10,2) DEFAULT 0 - Harga per unit",
            total_price: "DECIMAL(10,2) DEFAULT 0 - Total harga",
            notes: "TEXT - Catatan",
            transaction_date: "DATETIME NOT NULL - Tanggal transaksi",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        }
    },

    menu_recipes: {
        description: "Resep menu (bahan baku yang dibutuhkan per menu)",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            menu_item_id: "VARCHAR(255) NOT NULL - Foreign key ke menu_items",
            raw_material_id: "INT NOT NULL - Foreign key ke raw_materials",
            quantity: "DECIMAL(10,2) NOT NULL - Jumlah bahan yang dibutuhkan",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        }
    },

    // 5. USER & KARYAWAN
    users: {
        description: "User/pengguna aplikasi",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            username: "VARCHAR(255) UNIQUE NOT NULL - Username",
            password: "VARCHAR(255) NOT NULL - Password (hashed)",
            role: "ENUM('admin','user','kasir','guest','owner') DEFAULT 'user' - Role user",
            avatar_url: "VARCHAR(255) DEFAULT NULL - URL avatar"
        },
        roles: {
            admin: "Akses penuh semua fitur",
            user: "Akses penuh kecuali beberapa settings",
            kasir: "Akses terbatas untuk kasir (transaksi, riwayat)",
            owner: "Dashboard owner, laporan bisnis",
            guest: "Akses terbatas"
        }
    },

    employees: {
        description: "Data karyawan",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(255) NOT NULL - Nama karyawan",
            position: "VARCHAR(255) NOT NULL - Posisi/jabatan",
            avatar: "VARCHAR(255) - URL foto",
            phone: "VARCHAR(255) - Nomor telepon",
            email: "VARCHAR(255) - Email"
        }
    },

    // 6. UTILITAS
    notes: {
        description: "Catatan user",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            user_id: "INT NOT NULL - Foreign key ke users",
            title: "VARCHAR(255) NOT NULL - Judul catatan",
            content: "TEXT - Isi catatan",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        }
    },

    settings: {
        description: "Pengaturan aplikasi (key-value pairs)",
        columns: {
            key: "VARCHAR(255) PRIMARY KEY - Nama setting",
            value: "VARCHAR(255) - Nilai setting"
        },
        common_settings: {
            cashier_dashboard_title: "Judul dashboard kasir",
            simple_transaction_title: "Judul transaksi sederhana (default: 'Transaksi')",
            ignore_stock_simple_transaction: "Abaikan stok di transaksi sederhana (0/1)",
            ignore_stock_sales_form: "Abaikan stok di form penjualan (0/1)",
            initial_capital: "Modal awal bisnis",
            initial_capital_date: "Tanggal set modal awal",
            logo_url: "URL logo aplikasi",
            menu_stock_last_updated: "Waktu terakhir update stok menu",
            raw_materials_last_updated: "Waktu terakhir update bahan baku",
            lapak_funds_last_updated: "Waktu terakhir update uang lapak"
        }
    },

    app_settings: {
        description: "Pengaturan aplikasi tambahan",
        columns: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            key: "VARCHAR(255) UNIQUE - Nama setting",
            value: "TEXT - Nilai setting (bisa JSON)"
        }
    }
};

// ========================================
// 📊 RELASI ANTAR TABEL
// ========================================

const TABLE_RELATIONSHIPS = {
    "menu_items → menu_item_options": "One to Many (1 menu bisa punya banyak opsi)",
    "menu_items → menu_recipes": "One to Many (1 menu punya banyak bahan)",
    "menu_items → simple_transaction_items": "One to Many",

    "raw_materials → menu_recipes": "One to Many (1 bahan bisa untuk banyak menu)",
    "raw_materials → raw_material_stock_history": "One to Many",

    "users → notes": "One to Many (1 user bisa punya banyak catatan)",
    "users → accounts": "One to Many (optional)",
    "users → account_transactions": "One to Many",
    "users → simple_transactions": "One to Many",
    "users → cash_reconciliations": "One to Many",

    "orders → transactions": "One to One (optional)",

    "accounts → account_transactions": "One to Many",

    "simple_transactions → simple_transaction_items": "One to Many"
};

// ========================================
// 💡 TIPS QUERY UNTUK AI
// ========================================

const COMMON_QUERIES = {
    "Cek stok menu yang menipis": `
    SELECT name, stock, category 
    FROM menu_items 
    WHERE stock <= 5 AND stock > 0
    ORDER BY stock ASC
  `,

    "Cek bahan baku yang menipis": `
    SELECT name, current_stock, stok_minimum, unit
    FROM raw_materials
    WHERE current_stock <= stok_minimum
    ORDER BY current_stock ASC
  `,

    "Total penjualan hari ini": `
    SELECT SUM(total) as total_sales, COUNT(*) as total_transactions
    FROM transactions
    WHERE DATE(timestamp) = CURDATE()
    AND isEmployeeMeal = 0
    AND deleted_at IS NULL
  `,

    "Menu terlaris": `
    SELECT 
      JSON_EXTRACT(items, '$[*].name') as menu_names,
      COUNT(*) as order_count
    FROM transactions
    WHERE deleted_at IS NULL
    GROUP BY menu_names
    ORDER BY order_count DESC
    LIMIT 10
  `,

    "Saldo akun": `
    SELECT name, balance, type
    FROM accounts
  `,

    "Pengeluaran bulan ini": `
    SELECT SUM(amount) as total_expenses
    FROM expenses
    WHERE MONTH(date) = MONTH(CURDATE())
    AND YEAR(date) = YEAR(CURDATE())
  `
};

// ========================================
// 🎯 INFORMASI PENTING
// ========================================

const IMPORTANT_NOTES = {
    timezone: "Database menggunakan timezone +07:00 (WIB)",
    soft_delete: "Transaksi menggunakan soft delete (deleted_at)",
    json_fields: "Field 'items' di transactions dan orders berisi JSON array",
    payment_methods: ["Tunai", "Transfer", "Gojek"],
    default_accounts: ["lapak_deposit", "owner_deposit"],
    user_roles: ["admin", "user", "kasir", "guest", "owner"]
};

module.exports = {
    DATABASE_SCHEMA,
    TABLE_RELATIONSHIPS,
    COMMON_QUERIES,
    IMPORTANT_NOTES
};
