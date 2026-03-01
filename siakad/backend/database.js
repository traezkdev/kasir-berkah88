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
        jenis_kelamin ENUM('L', 'P'),
        nisn_nik VARCHAR(50),
        email VARCHAR(255),
        wa_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(createUsersTable);

    // Tambahkan kolom jenis_kelamin jika belum ada (untuk database yang sudah terlanjur dibuat)
    try {
      await connection.query("ALTER TABLE users ADD COLUMN jenis_kelamin ENUM('L', 'P') AFTER role");
    } catch (err) {
      // Abaikan jika kolom sudah ada
    }

    // Tambahkan kolom profile_photo jika belum ada
    try {
      await connection.query("ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255) AFTER jenis_kelamin");
    } catch (err) {
      // Abaikan jika kolom sudah ada
    }

    // 2. Create Kelas Table
    const createKelasTable = `
      CREATE TABLE IF NOT EXISTS kelas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_kelas VARCHAR(50) NOT NULL,
        tingkat VARCHAR(10),
        wali_kelas_id INT,
        FOREIGN KEY (wali_kelas_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
    await connection.query(createKelasTable);

    // Tambahkan kolom tingkat jika belum ada
    try {
      await connection.query("ALTER TABLE kelas ADD COLUMN tingkat VARCHAR(10) AFTER nama_kelas");
    } catch (err) { }

    // Tambahkan kolom keterangan jika belum ada
    try {
      await connection.query("ALTER TABLE kelas ADD COLUMN keterangan TEXT AFTER wali_kelas_id");
    } catch (err) { }

    // 3. Create Mata Pelajaran Table
    const createMapelTable = `
      CREATE TABLE IF NOT EXISTS mata_pelajaran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kode_mapel VARCHAR(20) UNIQUE,
        nama_mapel VARCHAR(100) NOT NULL,
        kategori VARCHAR(50) DEFAULT 'Umum',
        deskripsi TEXT,
        guru_id INT,
        FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
    await connection.query(createMapelTable);

    // Tambahkan kolom jika belum ada
    try { await connection.query("ALTER TABLE mata_pelajaran ADD COLUMN kode_mapel VARCHAR(20) UNIQUE AFTER id"); } catch (err) { }
    try { await connection.query("ALTER TABLE mata_pelajaran ADD COLUMN kategori VARCHAR(50) DEFAULT 'Umum' AFTER nama_mapel"); } catch (err) { }
    try { await connection.query("ALTER TABLE mata_pelajaran ADD COLUMN deskripsi TEXT AFTER kategori"); } catch (err) { }

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

    // 6. Create Jadwal Pelajaran Table
    const createJadwalTable = `
      CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kelas_id INT NOT NULL,
        mapel_id INT NOT NULL,
        hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
        jam_mulai TIME NOT NULL,
        jam_selesai TIME NOT NULL,
        ruangan VARCHAR(50),
        FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
        FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createJadwalTable);

    // 7. Create Settings Table
    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT
      );
    `;
    await connection.query(createSettingsTable);

    // 8. Create Nilai Table
    const createNilaiTable = `
      CREATE TABLE IF NOT EXISTS nilai (
        id INT AUTO_INCREMENT PRIMARY KEY,
        siswa_id INT NOT NULL,
        mapel_id INT NOT NULL,
        guru_id INT NOT NULL,
        kelas_id INT NOT NULL,
        nilai_uh FLOAT DEFAULT 0,
        nilai_uts FLOAT DEFAULT 0,
        nilai_uas FLOAT DEFAULT 0,
        nilai_akhir FLOAT DEFAULT 0,
        semester ENUM('Ganjil', 'Genap') NOT NULL,
        tahun_ajaran VARCHAR(20) NOT NULL,
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (siswa_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
        FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createNilaiTable);

    // 9. Create Agenda Table
    const createAgendaTable = `
      CREATE TABLE IF NOT EXISTS agenda (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        tanggal DATE NOT NULL,
        type ENUM('Akademik', 'Umum', 'Eskul') DEFAULT 'Umum',
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(createAgendaTable);

    // Initial Data for Settings
    const [settingsExist] = await connection.query("SELECT COUNT(*) as count FROM settings");
    if (settingsExist[0].count === 0) {
      const seedSettings = `
        INSERT INTO settings (setting_key, setting_value) VALUES 
        ('welcome_title', 'Pantau Akademik <br><span class="text-indigo-200 italic font-serif">Lebih Mudah & Cepat.</span>'),
        ('welcome_subtitle', 'Akses data nilai, absen, dan tugas dalam satu platform yang terintegrasi dan aman.'),
        ('register_title', 'Bangun Masa Depan <br><span class="text-purple-300 italic font-serif">Bersama SIAS PRO.</span>'),
        ('register_subtitle', 'Platform sistem informasi akademik terpadu untuk kemudahan akses edukasi dan manajemen sekolah masa kini.'),
        ('header_name', 'Sistem Informasi Akademik'),
        ('sidebar_name', 'SIAS PRO')
      `;
      await connection.query(seedSettings);
    }

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
