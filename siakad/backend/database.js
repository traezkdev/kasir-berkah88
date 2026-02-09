require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

const setupDatabase = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('Connected to MySQL Database (SIAKAD).');

        // 1. Create Users Table
        const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nama_lengkap VARCHAR(255),
        role ENUM('admin', 'guru', 'siswa') NOT NULL,
        nisn_nik VARCHAR(50),
        email VARCHAR(255),
        wa_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
        await connection.query(createUsersTable);

        // 2. Create Kelas Table
        const createKelasTable = `
      CREATE TABLE IF NOT EXISTS kelas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_kelas VARCHAR(50) NOT NULL,
        wali_kelas_id INT,
        FOREIGN KEY (wali_kelas_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
        await connection.query(createKelasTable);

        // 3. Create Mata Pelajaran Table
        const createMapelTable = `
      CREATE TABLE IF NOT EXISTS mata_pelajaran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_mapel VARCHAR(100) NOT NULL,
        guru_id INT,
        FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
        await connection.query(createMapelTable);

        // 4. Create Presensi Table
        const createPresensiTable = `
      CREATE TABLE IF NOT EXISTS presensi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        siswa_id INT NOT NULL,
        guru_id INT NOT NULL,
        kelas_id INT NOT NULL,
        mapel_id INT NOT NULL,
        tanggal DATE NOT NULL,
        status ENUM('Hadir', 'Izin', 'Sakit', 'Alpha') NOT NULL,
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (siswa_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
        await connection.query(createPresensiTable);

        // 5. Create Jurnal KBM Table
        const createJurnalTable = `
      CREATE TABLE IF NOT EXISTS jurnal_kbm (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guru_id INT NOT NULL,
        kelas_id INT NOT NULL,
        mapel_id INT NOT NULL,
        tanggal DATE NOT NULL,
        materi TEXT NOT NULL,
        catatan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
        await connection.query(createJurnalTable);

        console.log('Semua tabel database SIAS PRO siap digunakan.');

        connection.release();
    } catch (err) {
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('Database does not exist. Please create "siakad_db" manually in MySQL.');
        } else {
            console.error('Database connection error:', err.message);
        }
    }
};

setupDatabase();

module.exports = promisePool;
