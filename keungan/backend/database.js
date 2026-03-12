import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const initDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await connection.end();

        console.log(`Database '${process.env.DB_NAME}' siap.`);

        // Pembuatan Tabel
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                avatar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                category VARCHAR(50) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS debts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                date DATE NOT NULL,
                due_date DATE,
                status ENUM('utang', 'piutang') NOT NULL,
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS bills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                due_date DATE NOT NULL,
                status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(15, 2) NOT NULL,
                used_amount DECIMAL(15, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS savings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                target_amount DECIMAL(15, 2) NOT NULL,
                current_amount DECIMAL(15, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('info', 'warning', 'success', 'error', 'bill', 'budget') DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        for (const table of tables) {
            await pool.query(table);
        }

        // Tambah kolom paid_amount ke tabel bills jika belum ada (Cara Kompatibel)
        const [columns] = await pool.query("SHOW COLUMNS FROM bills LIKE 'paid_amount'");
        if (columns.length === 0) {
            await pool.query("ALTER TABLE bills ADD COLUMN paid_amount DECIMAL(15, 2) DEFAULT 0");
        }

        // Tambah kolom profil dan settings ke tabel users
        const [userCols] = await pool.query("SHOW COLUMNS FROM users");
        const colNames = userCols.map(c => c.Field);
        
        if (!colNames.includes('phone')) {
            await pool.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20)");
        }
        if (!colNames.includes('notif_transaksi')) {
            await pool.query("ALTER TABLE users ADD COLUMN notif_transaksi BOOLEAN DEFAULT TRUE");
        }
        if (!colNames.includes('notif_tagihan')) {
            await pool.query("ALTER TABLE users ADD COLUMN notif_tagihan BOOLEAN DEFAULT TRUE");
        }
        if (!colNames.includes('notif_budget')) {
            await pool.query("ALTER TABLE users ADD COLUMN notif_budget BOOLEAN DEFAULT FALSE");
        }
        if (!colNames.includes('currency')) {
            await pool.query("ALTER TABLE users ADD COLUMN currency VARCHAR(10) DEFAULT 'IDR'");
        }
        if (!colNames.includes('language')) {
            await pool.query("ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'id'");
        }
        if (!colNames.includes('dark_mode')) {
            await pool.query("ALTER TABLE users ADD COLUMN dark_mode BOOLEAN DEFAULT FALSE");
        }

        console.log("Semua tabel berhasil disinkronkan.");
    } catch (error) {
        console.error("Gagal inisialisasi database:", error.message);
    }
};

export default pool;
