const pool = require('./database'); // Menggunakan koneksi pool yang sudah ada

const addRawMaterial = async (name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, purchase_buffer_amount = 10, menu_stock = 0) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `INSERT INTO raw_materials (name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, purchase_buffer_amount, menu_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, purchase_buffer_amount, menu_stock]
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
      SELECT id, name, unit, custom_unit, current_stock, stok_minimum, price_per_item, standard_stock_per_day, purchase_buffer_amount, menu_stock
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
      `SELECT id, name, unit, custom_unit, current_stock, stok_minimum, price_per_item, standard_stock_per_day, purchase_buffer_amount, menu_stock FROM raw_materials WHERE id = ?`,
      [id]
    );
    return rows[0]; // Mengembalikan satu objek bahan mentah
  } finally {
    connection.release();
  }
};

const updateRawMaterial = async (id, name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, purchase_buffer_amount, current_stock, menu_stock) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `UPDATE raw_materials SET name = ?, unit = ?, custom_unit = ?, stok_minimum = ?, price_per_item = ?, standard_stock_per_day = ?, purchase_buffer_amount = ?, current_stock = ?, menu_stock = ? WHERE id = ?`,
      [name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, purchase_buffer_amount, current_stock, menu_stock, id]
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
      // To include the entire end day, add ' 23:59:59'
      query += ` AND rmsh.transaction_date <= ?`;
      params.push(`${filters.endDate} 23:59:59`);
    }

    query += ` ORDER BY rmsh.transaction_date DESC`;

    const [rows] = await connection.query(query, params);
    return rows;
  } finally {
    connection.release();
  }
};

const deleteStockHistoryEntry = async (historyId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get history entry details to ensure it exists
    const [historyRows] = await connection.query(
      `SELECT id FROM raw_material_stock_history WHERE id = ?`, // No need to SELECT FOR UPDATE if not reverting stock
      [historyId]
    );

    if (historyRows.length === 0) {
      throw new Error('Stock history entry not found.');
    }

    // 2. Delete the history entry directly
    const [result] = await connection.query(
      `DELETE FROM raw_material_stock_history WHERE id = ?`,
      [historyId]
    );

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getLowStockRawMaterials = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        rm.id, 
        rm.name, 
        rm.current_stock,
        rm.menu_stock,
        (rm.current_stock + rm.menu_stock) as total_effective_stock,
        rm.stok_minimum,
        rm.purchase_buffer_amount,
        GREATEST(0, (rm.stok_minimum + rm.purchase_buffer_amount) - (rm.current_stock + rm.menu_stock)) as suggestion_purchase_quantity,
        rm.unit,
        (rm.stok_minimum - (rm.current_stock + rm.menu_stock)) as deficit,
        (
          SELECT 
            FLOOR((rm.current_stock + rm.menu_stock) / mr.quantity) 
          FROM menu_recipes mr 
          WHERE mr.raw_material_id = rm.id 
          ORDER BY mr.quantity DESC 
          LIMIT 1
        ) as estimated_menu_portions
      FROM raw_materials rm
      WHERE (rm.current_stock + rm.menu_stock) < rm.stok_minimum
    `);
    return rows;
  } finally {
    connection.release();
  }
};

// Get the count of low stock raw materials
const getLowStockRawMaterialsCount = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT COUNT(*) as low_stock_count
      FROM raw_materials
      WHERE (current_stock + menu_stock) <= stok_minimum AND stok_minimum > 0
    `);
    return rows[0];
  } finally {
    connection.release();
  }
};

// --- Menu Recipes Functions ---
const addMenuRecipe = async (menu_item_id, raw_material_id, quantity) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `INSERT INTO menu_recipes (menu_item_id, raw_material_id, quantity) VALUES (?, ?, ?)`,
      [menu_item_id, raw_material_id, quantity]
    );
    return result;
  } finally {
    connection.release();
  }
};

const getMenuRecipes = async (menu_item_id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT mr.id, mr.raw_material_id, rm.name as raw_material_name, mr.quantity, rm.unit
       FROM menu_recipes mr
       JOIN raw_materials rm ON mr.raw_material_id = rm.id
       WHERE mr.menu_item_id = ?`,
      [menu_item_id]
    );
    return rows;
  } finally {
    connection.release();
  }
};

const deleteMenuRecipe = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `DELETE FROM menu_recipes WHERE id = ?`,
      [id]
    );
    return result;
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
  getStockHistory,
  deleteStockHistoryEntry,
  getLowStockRawMaterials,
  getLowStockRawMaterialsCount,
  addMenuRecipe,
  getMenuRecipes,
  deleteMenuRecipe,
};