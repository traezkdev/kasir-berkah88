const pool = require('./database'); // Menggunakan koneksi pool yang sudah ada

const addRawMaterial = async (name, unit, min_stock_level, price_per_item, standard_stock_per_day) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `INSERT INTO raw_materials (name, unit, min_stock_level, price_per_item, standard_stock_per_day) VALUES (?, ?, ?, ?, ?)`,
      [name, unit, min_stock_level, price_per_item, standard_stock_per_day]
    );
    return result;
  } finally {
    connection.release();
  }
};

const getRawMaterials = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT id, name, unit, current_stock, min_stock_level, price_per_item, standard_stock_per_day
      FROM raw_materials
    `);
    return rows;
  } finally {
    connection.release();
  }
};

const getRawMaterialById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT id, name, unit, current_stock, min_stock_level, price_per_item, standard_stock_per_day FROM raw_materials WHERE id = ?`,
      [id]
    );
    return rows[0]; // Mengembalikan satu objek bahan mentah
  } finally {
    connection.release();
  }
};

const updateRawMaterial = async (id, name, unit, min_stock_level, price_per_item, standard_stock_per_day) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `UPDATE raw_materials SET name = ?, unit = ?, min_stock_level = ?, price_per_item = ?, standard_stock_per_day = ? WHERE id = ?`,
      [name, unit, min_stock_level, price_per_item, standard_stock_per_day, id]
    );
    return result;
  } finally {
    connection.release();
  }
};

const deleteRawMaterial = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `DELETE FROM raw_materials WHERE id = ?`,
      [id]
    );
    return result;
  } finally {
    connection.release();
  }
};

const addStockIn = async (material_id, quantity, price_per_unit, transaction_date, notes) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Dapatkan harga per item jika tidak disediakan, atau gunakan yang disediakan
    let actual_price_per_unit = price_per_unit;
    if (!actual_price_per_unit) {
      const [materialRows] = await connection.query(
        `SELECT price_per_item FROM raw_materials WHERE id = ?`,
        [material_id]
      );
      if (materialRows.length > 0) {
        actual_price_per_unit = materialRows[0].price_per_item;
      } else {
        throw new Error('Material not found or price_per_unit not provided.');
      }
    }

    // 2. Hitung total_price
    const total_price = quantity * actual_price_per_unit;

    // 3. Update current_stock di tabel raw_materials
    await connection.query(
      `UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?`,
      [quantity, material_id]
    );

    // 4. Masukkan entri baru ke tabel raw_material_stock_history
    await connection.query(
      `INSERT INTO raw_material_stock_history (material_id, type, quantity, price_per_unit, total_price, transaction_date, notes) VALUES (?, 'in', ?, ?, ?, ?, ?)`,
      [material_id, quantity, actual_price_per_unit, total_price, transaction_date, notes]
    );

    await connection.commit();
    return { success: true, message: 'Stock-in recorded successfully.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const addStockOut = async (material_id, quantity, price_per_unit, transaction_date, notes) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Dapatkan stok saat ini dan harga per item
    const [materialRows] = await connection.query(
      `SELECT current_stock, price_per_item FROM raw_materials WHERE id = ?`,
      [material_id]
    );

    if (materialRows.length === 0) {
      throw new Error('Material not found.');
    }

    const { current_stock, price_per_item } = materialRows[0];

    // 2. Validasi stok keluar
    if (current_stock < quantity) {
      throw new Error('Jumlah keluar melebihi stok yang tersedia.');
    }

    // 3. Gunakan harga per unit yang disediakan atau fallback ke price_per_item
    let actual_price_per_unit = price_per_unit || price_per_item;
    // Untuk stok keluar, total_price bisa dianggap negatif atau 0 tergantung kebutuhan akuntansi
    const total_price = quantity * actual_price_per_unit; // Ini akan menjadi nilai positif, indikasi pengeluaran

    // 4. Update current_stock di tabel raw_materials
    await connection.query(
      `UPDATE raw_materials SET current_stock = current_stock - ? WHERE id = ?`,
      [quantity, material_id]
    );

    // 5. Masukkan entri baru ke tabel raw_material_stock_history
    await connection.query(
      `INSERT INTO raw_material_stock_history (material_id, type, quantity, price_per_unit, total_price, transaction_date, notes) VALUES (?, 'out', ?, ?, ?, ?, ?)`,
      [material_id, quantity, actual_price_per_unit, total_price, transaction_date, notes]
    );

    await connection.commit();
    return { success: true, message: 'Stock-out recorded successfully.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getStockHistory = async (filters = {}) => {
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT
        rmsh.id,
        rmsh.material_id,
        rm.name AS material_name,
        rm.unit AS material_unit,
        rmsh.type,
        rmsh.quantity,
        rmsh.price_per_unit,
        rmsh.total_price,
        rmsh.transaction_date,
        rmsh.notes,
        rmsh.created_at
      FROM
        raw_material_stock_history rmsh
      JOIN
        raw_materials rm ON rmsh.material_id = rm.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.material_id) {
      query += ` AND rmsh.material_id = ?`;
      params.push(filters.material_id);
    }
    if (filters.type) {
      query += ` AND rmsh.type = ?`;
      params.push(filters.type);
    }
    if (filters.startDate) {
      query += ` AND rmsh.transaction_date >= ?`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ` AND rmsh.transaction_date <= ?`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY rmsh.transaction_date DESC`;

    const [rows] = await connection.query(query, params);
    return rows;
  } finally {
    connection.release();
  }
};

module.exports = {
  addRawMaterial,
  getRawMaterials,
  getRawMaterialById,
  updateRawMaterial,
  deleteRawMaterial,
  addStockIn,
  addStockOut,
  getStockHistory,
};