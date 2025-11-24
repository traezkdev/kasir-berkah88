
const pool = require('./database'); // Menggunakan koneksi pool yang sudah ada

const createRawMaterialsTables = async () => {
  const connection = await pool.getConnection();
  try {
    // Tabel untuk menyimpan daftar bahan mentah
    await connection.query(`DROP TABLE IF EXISTS raw_material_stock_history`);
    await connection.query(`DROP TABLE IF EXISTS raw_materials`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL UNIQUE, -- Mengurangi panjang untuk mengatasi ER_TOO_LONG_KEY
        unit VARCHAR(100) NOT NULL,       -- Menambah fleksibilitas untuk unit
        current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        min_stock_level DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table 'raw_materials' checked/created successfully.");

    // Tabel untuk menyimpan riwayat semua transaksi stok (masuk/keluar)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS raw_material_stock_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_id INT NOT NULL,
        type ENUM('in', 'out') NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        transaction_date DATETIME NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
      )
    `);
    console.log("Table 'raw_material_stock_history' checked/created successfully.");

  } catch (error) {
    console.error("Error creating raw materials tables:", error);
  } finally {
    connection.release();
  }
};

module.exports = { createRawMaterialsTables };
