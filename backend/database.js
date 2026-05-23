require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
  charset: 'utf8mb4'
});

pool.on('connection', (connection) => {
  connection.query('SET time_zone = "+07:00"');
});

const promisePool = pool.promise();

const setupDatabase = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('Connected to MySQL database.');

    // SQL statements to create tables if they don't exist
    const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        menu_item_id VARCHAR(255) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
      );
    `;

    const createMenuItemsTable = `
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL,
        category VARCHAR(255),
        image_url VARCHAR(255),
        hpp DECIMAL(10, 2) DEFAULT 0,
        hpp_details JSON DEFAULT NULL,
        discount DECIMAL(10, 2) DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        description TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        order_index INTEGER DEFAULT 0,
        is_hidden BOOLEAN DEFAULT FALSE
      );
    `;

    const createMenuItemOptionsTable = `
      CREATE TABLE IF NOT EXISTS menu_item_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_item_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        price_adjustment DECIMAL(10, 2) DEFAULT 0,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
      );
    `;

    const createSettingsTable =
      'CREATE TABLE IF NOT EXISTS settings (' +
      '`key` VARCHAR(255) PRIMARY KEY,' +
      '`value` VARCHAR(255)' +
      ');';

    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        timestamp DATETIME NOT NULL,
        items JSON NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        ppn DECIMAL(10, 2) NOT NULL,
        isEmployeeMeal BOOLEAN DEFAULT FALSE,
        payment_method VARCHAR(50) DEFAULT 'Tunai',
        cash_paid DECIMAL(10, 2) DEFAULT 0,
        \`change\` DECIMAL(10, 2) DEFAULT 0,
        order_id INT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      );
    `;

    const createExpensesTable = `
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(255),
        date DATETIME NOT NULL,
        notes TEXT DEFAULT NULL,
        user_id INT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;

    const addNotesColumnToExpenses = `
      ALTER TABLE expenses
      ADD COLUMN notes TEXT DEFAULT NULL;
    `;

    const checkNotesColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'expenses' AND COLUMN_NAME = 'notes';
    `;

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user', 'kasir', 'guest', 'owner', 'pelanggan', 'penjual') DEFAULT 'user'
      );
    `;

    const createNotesTable = `
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    const createBannersTable = `
      CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        image_url VARCHAR(255),
        color_class VARCHAR(50) DEFAULT 'bg-green-600',
        icon_name VARCHAR(50) DEFAULT 'Percent',
        link_url VARCHAR(255),
        show_text BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createSellerBannersTable = `
      CREATE TABLE IF NOT EXISTS seller_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle TEXT,
        image_url VARCHAR(255),
        link_url VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    const createPromosTable = `
      CREATE TABLE IF NOT EXISTS promos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        code VARCHAR(50) UNIQUE,
        icon VARCHAR(50) DEFAULT 'Ticket',
        color VARCHAR(20) DEFAULT '#059669',
        expiry VARCHAR(255),
        is_hero BOOLEAN DEFAULT FALSE,
        image_url VARCHAR(255),
        badge_text VARCHAR(255),
        discount_value DECIMAL(15, 2) DEFAULT 0.00,
        discount_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
        min_purchase DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    const createInformationTable = `
      CREATE TABLE IF NOT EXISTS information (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(255),
        link_type VARCHAR(50) DEFAULT 'none',
        link_value VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    await connection.query(createNotesTable);
    console.log('notes table is ready.');
    await connection.query(createBannersTable);
    console.log('banners table is ready.');
    await connection.query(createSellerBannersTable);
    console.log('seller_banners table is ready.');
    await connection.query(createPromosTable);
    console.log('promos table is ready.');
    await connection.query(createInformationTable);
    console.log('information table is ready.');

    await connection.query(createReviewsTable);
    console.log('reviews table is ready.');

    // Create popups table for multiple popup management
    const createPopupsTable = `
      CREATE TABLE IF NOT EXISTS popups (
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
    `;
    await connection.query(createPopupsTable);
    console.log('popups table is ready.');

    // Migration for popups table to ensure all columns exist (important for production)
    const [popupCols] = await connection.query("SHOW COLUMNS FROM popups");
    const popupColNames = popupCols.map(c => c.Field);

    if (!popupColNames.includes('priority')) {
      await connection.query("ALTER TABLE popups ADD COLUMN priority INT DEFAULT 0");
      console.log("Added priority column to popups table.");
    }
    if (!popupColNames.includes('view_count')) {
      await connection.query("ALTER TABLE popups ADD COLUMN view_count INT DEFAULT 0");
      console.log("Added view_count column to popups table.");
    }
    if (!popupColNames.includes('click_count')) {
      await connection.query("ALTER TABLE popups ADD COLUMN click_count INT DEFAULT 0");
      console.log("Added click_count column to popups table.");
    }
    if (!popupColNames.includes('last_pushed_at')) {
      await connection.query("ALTER TABLE popups ADD COLUMN last_pushed_at TIMESTAMP NULL DEFAULT NULL");
      console.log("Added last_pushed_at column to popups table.");
    }
    if (!popupColNames.includes('show_on_pages')) {
      await connection.query("ALTER TABLE popups ADD COLUMN show_on_pages JSON DEFAULT NULL");
      console.log("Added show_on_pages column to popups table.");
    }
    if (!popupColNames.includes('link_type')) {
      await connection.query("ALTER TABLE popups ADD COLUMN link_type VARCHAR(50) DEFAULT 'none'");
      console.log("Added link_type column to popups table.");
    }
    if (!popupColNames.includes('link_value')) {
      await connection.query("ALTER TABLE popups ADD COLUMN link_value VARCHAR(255) DEFAULT NULL");
      console.log("Added link_value column to popups table.");
    }

    // Migration for promos table
    const [isHeroCol] = await connection.query("SHOW COLUMNS FROM promos LIKE 'is_hero'");
    if (isHeroCol.length === 0) {
      await connection.query("ALTER TABLE promos ADD COLUMN is_hero BOOLEAN DEFAULT FALSE");
      console.log("Added is_hero column to promos table.");
    }
    const [imageUrlCol] = await connection.query("SHOW COLUMNS FROM promos LIKE 'image_url'");
    if (imageUrlCol.length === 0) {
      await connection.query("ALTER TABLE promos ADD COLUMN image_url VARCHAR(255)");
      console.log("Added image_url column to promos table.");
    }
    const [badgeTextCol] = await connection.query("SHOW COLUMNS FROM promos LIKE 'badge_text'");
    if (badgeTextCol.length === 0) {
      await connection.query("ALTER TABLE promos ADD COLUMN badge_text VARCHAR(255)");
      console.log("Added badge_text column to promos table.");
    }
    const [isOneTimeCol] = await connection.query("SHOW COLUMNS FROM promos LIKE 'is_one_time'");
    if (isOneTimeCol.length === 0) {
      await connection.query("ALTER TABLE promos ADD COLUMN is_one_time BOOLEAN DEFAULT FALSE");
      console.log("Added is_one_time column to promos table.");
    }

    // Check and add is_active to information table
    const [isActiveInfoCol] = await connection.query("SHOW COLUMNS FROM information LIKE 'is_active'");
    if (isActiveInfoCol.length === 0) {
      await connection.query("ALTER TABLE information ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
      console.log("Added is_active column to information table.");
    }

    // Check and add show_text to banners table
    const [showTextBannerCol] = await connection.query("SHOW COLUMNS FROM banners LIKE 'show_text'");
    if (showTextBannerCol.length === 0) {
      await connection.query("ALTER TABLE banners ADD COLUMN show_text BOOLEAN DEFAULT TRUE");
      console.log("Added show_text column to banners table.");
    }

    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          customer_name VARCHAR(255),
          customer_address TEXT,
          customer_phone VARCHAR(50),
          items JSON NOT NULL,
          total DECIMAL(15, 2) NOT NULL,
          status ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          payment_method VARCHAR(50),
          note TEXT,
          points_used DECIMAL(15, 2) DEFAULT 0,
          promo_id INT DEFAULT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (promo_id) REFERENCES promos(id) ON DELETE SET NULL
      );
    `;
    await connection.query(createOrdersTable);
    console.log('orders table is ready.');

    // Check if points_used column exists in orders table
    const [pointsUsedColumnorders] = await connection.query("SHOW COLUMNS FROM orders LIKE 'points_used'");
    if (pointsUsedColumnorders.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN points_used DECIMAL(15, 2) DEFAULT 0");
      console.log("Added points_used column to orders table.");
    }

    // Check if promo_id column exists in orders table
    const [promoIdColumnOrders] = await connection.query("SHOW COLUMNS FROM orders LIKE 'promo_id'");
    if (promoIdColumnOrders.length === 0) {
      // Step 1: Add the column
      await connection.query("ALTER TABLE orders ADD COLUMN promo_id INT DEFAULT NULL");

      // Step 2: Add the foreign key separate just in case (to avoid ER_FK_CANNOT_OPEN_PARENT on some environments)
      try {
        await connection.query("ALTER TABLE orders ADD FOREIGN KEY (promo_id) REFERENCES promos(id) ON DELETE SET NULL");
      } catch (fkError) {
        console.warn("Warming: Gagal menambahkan foreign key promo_id ke tabel orders. Kolom tetap ditambahkan.", fkError.message);
      }

      console.log("Added promo_id column to orders table.");
    }

    // Check if promo_discount column exists in orders table
    const [promoDiscountColumnOrders] = await connection.query("SHOW COLUMNS FROM orders LIKE 'promo_discount'");
    if (promoDiscountColumnOrders.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN promo_discount DECIMAL(15, 2) DEFAULT 0");
      console.log("Added promo_discount column to orders table.");
    }

    // Check if subtotal column exists in orders? (optional, but good)
    // Actually items JSON has subtotal, but it's good to have it as a column too.
    // For now let's just stick to promo_discount.

    // Check and add payment_method to orders
    const checkPaymentMethodColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_method';
    `;
    const [pmOrdersRows] = await connection.query(checkPaymentMethodColumn);
    if (pmOrdersRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Tunai'");
      console.log('Added payment_method column to orders table.');
    }

    // Check and add note to orders
    const checkOrderNoteColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'note';
    `;
    const [noteOrdersRows] = await connection.query(checkOrderNoteColumn);
    if (noteOrdersRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN note TEXT DEFAULT NULL");
      console.log('Added note column to orders table.');
    }

    // Check and add customer_address to orders
    const checkOrderAddrColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'customer_address';
    `;
    const [addrOrdersRows] = await connection.query(checkOrderAddrColumn);
    if (addrOrdersRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN customer_address TEXT DEFAULT NULL");
      console.log('Added customer_address column to orders table.');
    }

    // Check and add customer_phone to orders
    const checkOrderPhoneColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'customer_phone';
    `;
    const [phoneOrdersRows] = await connection.query(checkOrderPhoneColumn);
    if (phoneOrdersRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(25) DEFAULT NULL");
      console.log('Added customer_phone column to orders table.');
    }

    // Check and add deleted_at to orders for soft delete
    const checkOrderDeletedAtColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'deleted_at';
    `;
    const [deletedAtOrdersRows] = await connection.query(checkOrderDeletedAtColumn);
    if (deletedAtOrdersRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL");
      console.log('Added deleted_at column to orders table.');
    }

    const createEmployeesTable = `
      CREATE TABLE IF NOT EXISTS employees(
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(255) NOT NULL,
      avatar VARCHAR(255),
      phone VARCHAR(255),
      email VARCHAR(255)
    );
    `;

    // Add role column if it doesn't exist and set default for existing users
    const addRoleColumn = `
      ALTER TABLE users
      ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    `;

    // Check if role column exists before adding
    const checkRoleColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role';
    `;

    // Check and add address to users
    const checkUserAddrColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address';
    `;
    const [addrUsersRows] = await connection.query(checkUserAddrColumn);
    if (addrUsersRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL");
      console.log('Added address column to users table.');
    }

    // Check and add phone to users
    const checkUserPhoneColumnMigration = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone';
    `;
    const [phoneUsersRowsMigration] = await connection.query(checkUserPhoneColumnMigration);
    if (phoneUsersRowsMigration[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN phone VARCHAR(25) DEFAULT NULL");
      console.log('Added phone column to users table.');
    }

    // Check and add points to users
    const checkUserPointsColumnMigration = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'points';
    `;
    const [pointsUsersRowsMigration] = await connection.query(checkUserPointsColumnMigration);
    if (pointsUsersRowsMigration[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN points DECIMAL(10, 2) DEFAULT 0");
      console.log('Added points column to users table.');
    }

    // Check and add created_at to users
    const checkUserCreatedAtColumnMigration = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at';
    `;
    const [createdAtUsersRowsMigration] = await connection.query(checkUserCreatedAtColumnMigration);
    if (createdAtUsersRowsMigration[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
      console.log('Added created_at column to users table.');
    }

    // Execute the create table statements
    await connection.query(createMenuItemsTable);

    // List of columns to check and add if missing
    const columnsToEnsure = [
      { name: 'image_url', type: 'VARCHAR(255)' },
      { name: 'hpp', type: 'DECIMAL(10, 2) DEFAULT 0' },
      { name: 'hpp_details', type: 'JSON DEFAULT NULL' },
      { name: 'discount', type: 'DECIMAL(10, 2) DEFAULT 0' },
      { name: 'is_featured', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'description', type: 'TEXT' },
      { name: 'order_index', type: 'INTEGER DEFAULT 0' },
      { name: 'is_hidden', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    for (const col of columnsToEnsure) {
      const checkColumnSql = `
        SELECT COUNT(*) as colCount FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = ?;
      `;
      const [rows] = await connection.query(checkColumnSql, [col.name]);
      if (rows[0].colCount === 0) {
        await connection.query(`ALTER TABLE menu_items ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Successfully added column '${col.name}' to menu_items table.`);
      }

      // --- Explicit check for 'is_hidden' using SHOW COLUMNS (more reliable) ---
      try {
        const [isHiddenCol] = await connection.query("SHOW COLUMNS FROM menu_items LIKE 'is_hidden'");
        if (isHiddenCol.length === 0) {
          await connection.query("ALTER TABLE menu_items ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE");
          console.log("Added is_hidden column to menu_items table (explicit migration).");
        }
      } catch (err) {
        console.error('Error in explicit is_hidden migration:', err);
      }
    }

    // Create menu_item_options table
    await connection.query(createMenuItemOptionsTable);
    console.log('menu_item_options table is ready.');

    await connection.query(createSettingsTable);

    // Migration to ensure 'key' column in settings table is unique
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM settings LIKE 'id'");
      if (columns.length > 0) {
        // Table has id column, we can safely delete duplicates using s1.id < s2.id
        await connection.query(`
          DELETE s1 FROM settings s1
          INNER JOIN settings s2 
          ON s1.\`key\` = s2.\`key\` 
          AND s1.id < s2.id
        `);
        console.log('Cleaned up duplicate settings from settings table.');
      }

      // Check if a unique constraint on 'key' already exists
      const [existingIndex] = await connection.query(`
        SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND INDEX_NAME = 'unique_key'
      `);

      if (existingIndex.length === 0) {
        const [isUnique] = await connection.query(`
          SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.STATISTICS 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'key' AND NON_UNIQUE = 0
        `);
        
        if (isUnique.length === 0) {
          await connection.query("ALTER TABLE settings ADD UNIQUE KEY unique_key (\`key\`)");
          console.log('Successfully added unique constraint on settings.key.');
        }
      }
    } catch (err) {
      console.error('Error migrating settings unique constraint:', err.message);
    }

    const insertDefaultSettings = `
      INSERT IGNORE INTO settings(\`key\`, \`value\`) VALUES
      ('cashier_dashboard_title', 'Dasbor Kasir'),
      ('dashboard_running_text', 'Selamat datang di POS Berkah 88! Semangat berjualan hari ini!'),
      ('dashboard_running_text_enabled', '1'),
      ('dashboard_watermark_enabled', '1'),
      ('daily_welcome_enabled', '1'),
      ('audit_start_date', '');
    `;
    await connection.query(insertDefaultSettings);

    // Ensure simple_transaction_title is always 'Transaksi'
    const ensureSimpleTransactionTitle = `
      INSERT INTO settings (\`key\`, \`value\`) VALUES
      ('simple_transaction_title', 'Transaksi')
      ON DUPLICATE KEY UPDATE \`value\` = 'Transaksi';
    `;
    await connection.query(ensureSimpleTransactionTitle);

    // Ensure ignore_stock_simple_transaction setting exists and defaults to '0' (false)
    const ensureIgnoreStockSimpleTransactionSetting = `
      INSERT INTO settings (\`key\`, \`value\`) VALUES
      ('ignore_stock_simple_transaction', '0'),
      ('ppn', '0.12'),
      ('receipt_version', '1'),
      ('auth_ui_version', '1')
      ON DUPLICATE KEY UPDATE \`value\` = \`value\`;
    `;
    await connection.query(ensureIgnoreStockSimpleTransactionSetting);

    // Ensure ignore_stock_sales_form setting exists and defaults to '0' (false)
    const ensureIgnoreStockSalesFormSetting = `
      INSERT INTO settings (\`key\`, \`value\`) VALUES
      ('ignore_stock_sales_form', '0')
      ON DUPLICATE KEY UPDATE \`value\` = \`value\`;
    `;
    await connection.query(ensureIgnoreStockSalesFormSetting);

    await connection.query(createTransactionsTable);

    await connection.query(createExpensesTable);

    await connection.query(createUsersTable);
    console.log('users table is ready.');

    const createSimpleTransactionsTable = `
      CREATE TABLE IF NOT EXISTS simple_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        cash_paid DECIMAL(10, 2),
        change_given DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;

    const createSimpleTransactionItemsTable = `
      CREATE TABLE IF NOT EXISTS simple_transaction_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        simple_transaction_id INT NOT NULL,
        menu_item_id VARCHAR(255) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price_per_item DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (simple_transaction_id) REFERENCES simple_transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
      );
    `;

    await connection.query(createSimpleTransactionsTable);
    console.log('simple_transactions table is ready.');
    await connection.query(createSimpleTransactionItemsTable);
    console.log('simple_transaction_items table is ready.');

    // Create cash_reconciliations table
    const createCashReconciliationsTable = `
      CREATE TABLE IF NOT EXISTS cash_reconciliations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        expected_tunai DECIMAL(15, 2) DEFAULT 0,
        expected_transfer DECIMAL(15, 2) DEFAULT 0,
        expected_gojek DECIMAL(15, 2) DEFAULT 0,
        actual_tunai DECIMAL(15, 2) DEFAULT 0,
        actual_transfer DECIMAL(15, 2) DEFAULT 0,
        actual_gojek DECIMAL(15, 2) DEFAULT 0,
        variance_tunai DECIMAL(15, 2) DEFAULT 0,
        variance_transfer DECIMAL(15, 2) DEFAULT 0,
        variance_gojek DECIMAL(15, 2) DEFAULT 0,
        notes TEXT,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
    await connection.query(createCashReconciliationsTable);
    console.log('cash_reconciliations table is ready.');


    await connection.query(createNotesTable);
    console.log('notes table is ready.');
    await connection.query(createEmployeesTable);
    console.log('employees table is ready.');




    const createRawMaterialsTable = `
      CREATE TABLE IF NOT EXISTS raw_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL UNIQUE,
        unit VARCHAR(50) NOT NULL,
        current_stock DECIMAL(10, 2) DEFAULT 0.00,
        stok_minimum DECIMAL(10, 2) DEFAULT 0.00,
        suggestion_purchase_quantity DECIMAL(10, 2) DEFAULT 0.00,
        price_per_item DECIMAL(10, 2) DEFAULT 0.00,
        standard_stock_per_day DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await connection.query(createRawMaterialsTable);
    console.log('raw_materials table is ready.');

    const createMaterialUnitsTable = `
      CREATE TABLE IF NOT EXISTS material_units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        is_calculable BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(createMaterialUnitsTable);
    console.log('material_units table is ready.');

    // Populate default units
    const [unitCountRows] = await connection.query('SELECT COUNT(*) as count FROM material_units');
    if (unitCountRows[0].count === 0) {
      const defaultUnits = [
        { name: 'kg', is_calculable: true },
        { name: 'pcs', is_calculable: true },
        { name: 'box', is_calculable: true },
        { name: 'botol', is_calculable: true },
        { name: 'liter', is_calculable: true },
        { name: 'gram', is_calculable: false },
        { name: 'ml', is_calculable: false },
        { name: 'ikat', is_calculable: true },
        { name: 'piring', is_calculable: true },
        { name: 'cup', is_calculable: true }
      ];

      const insertUnitSql = 'INSERT INTO material_units (name, is_calculable) VALUES ?';
      const unitValues = defaultUnits.map(u => [u.name, u.is_calculable]);
      await connection.query(insertUnitSql, [unitValues]);
      console.log('Default material units inserted.');
    }

    // Check and add name column to raw_materials if it doesn't exist
    const checkNameColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'name';
    `;
    const addNameColumnNullable = `
      ALTER TABLE raw_materials ADD COLUMN name VARCHAR(191) NULL;
    `;
    const updateExistingNames = `
      UPDATE raw_materials SET name = CONCAT('material_', id) WHERE name IS NULL;
    `;
    const alterNameNotNull = `
      ALTER TABLE raw_materials MODIFY COLUMN name VARCHAR(191) NOT NULL;
    `;
    const addNameUniqueConstraint = `
      ALTER TABLE raw_materials ADD CONSTRAINT unique_name UNIQUE (name);
    `;
    const [nameRows] = await connection.query(checkNameColumn);
    if (nameRows[0]['COUNT(*)'] === 0) {
      console.log('Adding name column to raw_materials table.');
      await connection.query(addNameColumnNullable);
      await connection.query(updateExistingNames); // Populate existing nulls
      await connection.query(alterNameNotNull);
      await connection.query(addNameUniqueConstraint);
      console.log('Added name column and constraints to raw_materials table.');
    }

    // Check and add unit column to raw_materials if it doesn't exist
    const checkUnitColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'unit';
    `;
    const addUnitColumnNullable = `
      ALTER TABLE raw_materials ADD COLUMN unit VARCHAR(50) NULL;
    `;
    const updateExistingUnits = `
      UPDATE raw_materials SET unit = 'pcs' WHERE unit IS NULL;
    `;
    const alterUnitNotNull = `
      ALTER TABLE raw_materials MODIFY COLUMN unit VARCHAR(50) NOT NULL;
    `;
    const [unitRows] = await connection.query(checkUnitColumn);
    if (unitRows[0]['COUNT(*)'] === 0) {
      console.log('Adding unit column to raw_materials table.');
      await connection.query(addUnitColumnNullable);
      await connection.query(updateExistingUnits);
      await connection.query(alterUnitNotNull);
      console.log('Added unit column and constraints to raw_materials table.');
    }

    // Check and add current_stock column to raw_materials if it doesn't exist
    const checkCurrentStockColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'current_stock';
    `;
    const addCurrentStockColumn = `
      ALTER TABLE raw_materials ADD COLUMN current_stock DECIMAL(10, 2) DEFAULT 0.00;
    `;
    const [currentStockRows] = await connection.query(checkCurrentStockColumn);
    if (currentStockRows[0]['COUNT(*)'] === 0) {
      await connection.query(addCurrentStockColumn);
      console.log('Added current_stock column to raw_materials table.');
    }

    // Check and add stok_minimum column to raw_materials if it doesn't exist
    const checkStokMinimumColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'stok_minimum';
    `;
    const [stokMinimumRows] = await connection.query(checkStokMinimumColumn);
    if (stokMinimumRows[0]['COUNT(*)'] === 0) {
      // Check if old column 'min_stock_level' exists
      const checkOldMinStockLevelColumn = `
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'min_stock_level';
      `;
      const [oldMinStockRows] = await connection.query(checkOldMinStockLevelColumn);
      if (oldMinStockRows[0]['COUNT(*)'] > 0) {
        // Rename old column to new column
        const renameMinStockLevelColumn = `
          ALTER TABLE raw_materials CHANGE COLUMN min_stock_level stok_minimum DECIMAL(10, 2) DEFAULT 0.00;
        `;
        await connection.query(renameMinStockLevelColumn);
        console.log('Renamed min_stock_level column to stok_minimum in raw_materials table.');
      } else {
        // Add the new column if neither old nor new exists
        const addStokMinimumColumn = `
          ALTER TABLE raw_materials ADD COLUMN stok_minimum DECIMAL(10, 2) DEFAULT 0.00;
        `;
        await connection.query(addStokMinimumColumn);
        console.log('Added stok_minimum column to raw_materials table.');
      }
    }

    // Ensure purchase_buffer_amount column in raw_materials table has correct definition
    const pbColumnName = 'purchase_buffer_amount';
    const pbTableName = 'raw_materials';
    const pbExpectedType = 'DECIMAL(10,2)';
    const pbExpectedDefault = '0.00'; // Changed default from 10.00 to 0.00

    const [pbColumnInfo] = await connection.query(`
      SELECT COLUMN_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?;
    `, [pbTableName, pbColumnName]);

    if (pbColumnInfo.length > 0) {
      const { COLUMN_TYPE, COLUMN_DEFAULT } = pbColumnInfo[0];
      const normalizedDefault = COLUMN_DEFAULT !== null ? parseFloat(COLUMN_DEFAULT).toFixed(2) : null;

      if (COLUMN_TYPE.toUpperCase() !== pbExpectedType.toUpperCase() || normalizedDefault !== pbExpectedDefault) {
        console.log(`Modifying ${pbColumnName} column in ${pbTableName} table: Current type ${COLUMN_TYPE}, default ${COLUMN_DEFAULT}. Expected type ${pbExpectedType}, default ${pbExpectedDefault}.`);
        await connection.query(`ALTER TABLE ${pbTableName} MODIFY COLUMN ${pbColumnName} ${pbExpectedType} DEFAULT ${pbExpectedDefault}`);
        console.log(`Modified ${pbColumnName} column with correct definition.`);
      } else {
        console.log(`${pbColumnName} column in ${pbTableName} table is already correctly defined.`);
      }
    } else {
      await connection.query(`ALTER TABLE ${pbTableName} ADD COLUMN ${pbColumnName} ${pbExpectedType} DEFAULT ${pbExpectedDefault}`);
      console.log(`Added ${pbColumnName} column to ${pbTableName} table.`);
    }

    // Check and add suggestion_purchase_quantity column to raw_materials if it doesn't exist
    const checkSuggestionPurchaseQuantityColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'suggestion_purchase_quantity';
    `;
    const addSuggestionPurchaseQuantityColumn = `
      ALTER TABLE raw_materials ADD COLUMN suggestion_purchase_quantity DECIMAL(10, 2) DEFAULT 0.00;
    `;
    const [suggestionPurchaseQuantityRows] = await connection.query(checkSuggestionPurchaseQuantityColumn);
    if (suggestionPurchaseQuantityRows[0]['COUNT(*)'] === 0) {
      await connection.query(addSuggestionPurchaseQuantityColumn);
      console.log('Added suggestion_purchase_quantity column to raw_materials table.');
    }

    const checkCustomUnitColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'custom_unit';
    `;
    const addCustomUnitColumn = `
      ALTER TABLE raw_materials ADD COLUMN custom_unit VARCHAR(50) DEFAULT 'pcs';
    `;
    const [customUnitRows] = await connection.query(checkCustomUnitColumn);
    if (customUnitRows[0]['COUNT(*)'] === 0) {
      await connection.query(addCustomUnitColumn);
      console.log('Added custom_unit column to raw_materials table.');
    }

    // Check and add price_per_item column to raw_materials if it doesn't exist
    const checkPricePerItemColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'price_per_item';
    `;
    const addPricePerItemColumn = `
      ALTER TABLE raw_materials ADD COLUMN price_per_item DECIMAL(10, 2) DEFAULT 0.00;
    `;
    const [pricePerItemRows] = await connection.query(checkPricePerItemColumn);
    if (pricePerItemRows[0]['COUNT(*)'] === 0) {
      await connection.query(addPricePerItemColumn);
      console.log('Added price_per_item column to raw_materials table.');
    }

    // Check and add standard_stock_per_day column to raw_materials if it doesn't exist
    const checkStandardStockPerDayColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'standard_stock_per_day';
    `;
    const addStandardStockPerDayColumn = `
      ALTER TABLE raw_materials ADD COLUMN standard_stock_per_day DECIMAL(10, 2) DEFAULT 0.00;
    `;
    const [standardStockPerDayRows] = await connection.query(checkStandardStockPerDayColumn);
    if (standardStockPerDayRows[0]['COUNT(*)'] === 0) {
      await connection.query(addStandardStockPerDayColumn);
      console.log('Added standard_stock_per_day column to raw_materials table.');
    }

    // Check and add menu_stock column to raw_materials if it doesn't exist
    const checkMenuStockColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'menu_stock';
    `;
    const addMenuStockColumn = `
      ALTER TABLE raw_materials ADD COLUMN menu_stock DECIMAL(10, 2) DEFAULT 0.00;
    `;
    const [menuStockRows] = await connection.query(checkMenuStockColumn);
    if (menuStockRows[0]['COUNT(*)'] === 0) {
      await connection.query(addMenuStockColumn);
      console.log('Added menu_stock column to raw_materials table.');
    }

    // Check and add raw_stock_price column to raw_materials if it doesn't exist
    const checkRawStockPriceColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_materials' AND COLUMN_NAME = 'raw_stock_price';
    `;
    const addRawStockPriceColumn = `
      ALTER TABLE raw_materials ADD COLUMN raw_stock_price DECIMAL(10, 2) DEFAULT 0.00;
    `;
    const [rawStockPriceRows] = await connection.query(checkRawStockPriceColumn);
    if (rawStockPriceRows[0]['COUNT(*)'] === 0) {
      await connection.query(addRawStockPriceColumn);
      console.log('Added raw_stock_price column to raw_materials table.');
    }

    const createMenuRecipesTable = `
      CREATE TABLE IF NOT EXISTS menu_recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_item_id VARCHAR(255) NOT NULL,
        raw_material_id INT NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createMenuRecipesTable);
    console.log('menu_recipes table is ready.');

    const createRawMaterialStockHistoryTable = `
      CREATE TABLE IF NOT EXISTS raw_material_stock_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_id INT NOT NULL,
        type ENUM('in', 'out') NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        price_per_unit DECIMAL(10, 2) DEFAULT 0.00,
        total_price DECIMAL(10, 2) DEFAULT 0.00,
        notes TEXT,
        transaction_date DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
      );
    `;
    await connection.query(createRawMaterialStockHistoryTable);
    console.log('raw_material_stock_history table is ready.');

    // Check and add price_per_unit column to raw_material_stock_history if it doesn't exist
    const checkPricePerUnitHistoryColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_material_stock_history' AND COLUMN_NAME = 'price_per_unit';
    `;
    const addPricePerUnitHistoryColumn = `
      ALTER TABLE raw_material_stock_history ADD COLUMN price_per_unit DECIMAL(10, 2) DEFAULT 0.00;
    `;
    const [pricePerUnitHistoryRows] = await connection.query(checkPricePerUnitHistoryColumn);
    if (pricePerUnitHistoryRows[0]['COUNT(*)'] === 0) {
      await connection.query(addPricePerUnitHistoryColumn);
      console.log('Added price_per_unit column to raw_material_stock_history table.');
    }

    // Check and add total_price column to raw_material_stock_history if it doesn't exist
    const checkTotalPriceHistoryColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raw_material_stock_history' AND COLUMN_NAME = 'total_price';
    `;
    const addTotalPriceHistoryColumn = `
      ALTER TABLE raw_material_stock_history ADD COLUMN total_price DECIMAL(10, 2) DEFAULT 0.00;
    `;
    const [totalPriceHistoryRows] = await connection.query(checkTotalPriceHistoryColumn);
    if (totalPriceHistoryRows[0]['COUNT(*)'] === 0) {
      await connection.query(addTotalPriceHistoryColumn);
      console.log('Added total_price column to raw_material_stock_history table.');
    }

    const createAccountsTable = `
      CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL UNIQUE,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        type ENUM('lapak', 'owner') NOT NULL,
        user_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;

    const createAccountTransactionsTable = `
      CREATE TABLE IF NOT EXISTS account_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT NOT NULL,
        type ENUM('deposit', 'expense', 'withdrawal') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_by_user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    await connection.query(createAccountsTable);
    console.log('accounts table is ready.');

    await connection.query(createAccountTransactionsTable);
    console.log('account_transactions table is ready.');

    // Migration to ensure type includes 'withdrawal'
    const alterAccountTransactionsType = `
      ALTER TABLE account_transactions MODIFY COLUMN type ENUM('deposit', 'expense', 'withdrawal') NOT NULL;
    `;
    await connection.query(alterAccountTransactionsType);
    console.log('Modified type column in account_transactions table to include withdrawal.');

    // Insert default accounts if tables are empty
    const [lapakAccountRows] = await connection.query('SELECT id FROM accounts WHERE name = ?', ['lapak_deposit']);
    if (lapakAccountRows.length === 0) {
      await connection.query(
        'INSERT INTO accounts (name, balance, type) VALUES (?, ?, ?)',
        ['lapak_deposit', 0.00, 'lapak']
      );
      console.log('Default "lapak_deposit" account created.');
    }

    const [ownerAccountRows] = await connection.query('SELECT id FROM accounts WHERE name = ?', ['owner_deposit']);
    if (ownerAccountRows.length === 0) {
      // For owner account, we can link it to an existing 'admin' user or leave user_id as NULL
      // For now, let's leave user_id as NULL as it's a general owner account, not tied to a specific user
      await connection.query(
        'INSERT INTO accounts (name, balance, type) VALUES (?, ?, ?)',
        ['owner_deposit', 0.00, 'owner']
      );
      console.log('Default "owner_deposit" account created.');
    }



    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL UNIQUE
      );
    `;
    await connection.query(createCategoriesTable);
    console.log('categories table is ready.');

    // Insert default categories if the table is empty
    const [categoryRows] = await connection.query('SELECT id FROM categories LIMIT 1');
    if (categoryRows.length === 0) {
      const defaultCategories = ['Makanan', 'Minuman', 'Lainnya'];
      const insertPromises = defaultCategories.map(name => {
        return connection.query('INSERT INTO categories (name) VALUES (?)', [name]);
      });
      await Promise.all(insertPromises);
      console.log('Default categories inserted.');
    }

    // Check and add icon column to categories if it doesn't exist
    const checkCategoryIconColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'icon';
    `;
    const [iconCategoryRows] = await connection.query(checkCategoryIconColumn);
    if (iconCategoryRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE categories ADD COLUMN icon VARCHAR(255) DEFAULT NULL");
      console.log('Added icon column to categories table.');
    }

    // Check and add is_visible column to categories if it doesn't exist
    const checkCategoryVisibleColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'is_visible';
    `;
    const [visibleCategoryRows] = await connection.query(checkCategoryVisibleColumn);
    if (visibleCategoryRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE categories ADD COLUMN is_visible BOOLEAN DEFAULT TRUE");
      console.log('Added is_visible column to categories table.');
    }

    const createEmployeeCreditsTable = `
      CREATE TABLE IF NOT EXISTS employee_credits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NULL,
        employee_name VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        credit_date DATE NOT NULL,
        status ENUM('unpaid', 'paid', 'partial') DEFAULT 'unpaid',
        due_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
      );
    `;
    await connection.query(createEmployeeCreditsTable);
    console.log('employee_credits table is ready.');

    const createExpenseCategoriesTable = `
      CREATE TABLE IF NOT EXISTS expense_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL UNIQUE
      );
    `;
    await connection.query(createExpenseCategoriesTable);
    console.log('expense_categories table is ready.');

    // Insert default expense categories if the table is empty
    const [expenseCategoryRows] = await connection.query('SELECT id FROM expense_categories LIMIT 1');
    if (expenseCategoryRows.length === 0) {
      const defaultExpenseCategories = [
        'Bahan Baku & Supplies',
        'Listrik & Air',
        'Pembelian Stok',
        'Peralatan',
        'Perawatan & Perbaikan',
        'Transportasi',
        'Promosi & Marketing',
        'Operasional Lainnya',
        'Lain-lain'
      ];
      const insertPromises = defaultExpenseCategories.map(name => {
        return connection.query('INSERT INTO expense_categories (name) VALUES (?)', [name]);
      });
      await Promise.all(insertPromises);
      console.log('Default expense categories inserted.');
    }


    // Check and add notes column to expenses if it doesn't exist
    const [notesRows] = await connection.query(checkNotesColumn);
    if (notesRows[0]['COUNT(*)'] === 0) {
      await connection.query(addNotesColumnToExpenses);
      console.log('Added notes column to expenses table.');
    }

    const addIgnoreStockColumn = `
      ALTER TABLE transactions ADD COLUMN ignore_stock TINYINT(1) DEFAULT 0;
    `;

    const checkIgnoreStockColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'ignore_stock';
    `;

    // Check and add reset_password_token and reset_password_expires to users
    const [resetTokenCol] = await connection.query("SHOW COLUMNS FROM users LIKE 'reset_password_token'");
    if (resetTokenCol.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255) DEFAULT NULL");
      console.log('Added reset_password_token column to users table.');
    }
    const [resetExpiresCol] = await connection.query("SHOW COLUMNS FROM users LIKE 'reset_password_expires'");
    if (resetExpiresCol.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN reset_password_expires TIMESTAMP NULL DEFAULT NULL");
      console.log('Added reset_password_expires column to users table.');
    }

    // Check and add email column to users if it doesn't exist
    const [emailCol] = await connection.query("SHOW COLUMNS FROM users LIKE 'email'");
    if (emailCol.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL");
      console.log('Added email column to users table.');
    }

    // Check and add role column if it doesn't exist
    const [rows] = await connection.query(checkRoleColumn);
    if (rows[0]['COUNT(*)'] === 0) {
      await connection.query(addRoleColumn);
      console.log('Added role column to users table.');
    } else {
      // If the column exists, modify it to the new ENUM type
      const alterRoleToEnum = `
        ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'kasir', 'guest', 'owner', 'pelanggan', 'penjual') DEFAULT 'user';
      `;
      await connection.query(alterRoleToEnum);
      console.log('Modified role column to ENUM type including penjual.');
    }

    // Check and add avatar_url column to users if it doesn't exist
    const checkAvatarUrlColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar_url';
    `;
    const addAvatarUrlColumn = `
      ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL;
    `;
    const [avatarRows] = await connection.query(checkAvatarUrlColumn);
    if (avatarRows[0]['COUNT(*)'] === 0) {
      await connection.query(addAvatarUrlColumn);
      console.log('Added avatar_url column to users table.');
    }

    // Check and add app_mode column to users if it doesn't exist
    const checkAppModeColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'app_mode';
    `;
    const addAppModeColumn = `
      ALTER TABLE users ADD COLUMN app_mode ENUM('simple', 'full') DEFAULT 'full';
    `;
    const [appModeRows] = await connection.query(checkAppModeColumn);
    if (appModeRows[0]['COUNT(*)'] === 0) {
      await connection.query(addAppModeColumn);
      console.log('Added app_mode column to users table.');
    }

    // Check and add phone column to users if it doesn't exist
    const checkPhoneColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone';
    `;
    const addPhoneColumn = `
      ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL;
    `;
    const [phoneRows] = await connection.query(checkPhoneColumn);
    if (phoneRows[0]['COUNT(*)'] === 0) {
      await connection.query(addPhoneColumn);
      console.log('Added phone column to users table.');
    }

    // Check and add email column to users if it doesn't exist
    const checkEmailColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email';
    `;
    const addEmailColumn = `
      ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL;
    `;
    const [emailRows] = await connection.query(checkEmailColumn);
    if (emailRows[0]['COUNT(*)'] === 0) {
      await connection.query(addEmailColumn);
      console.log('Added email column to users table.');
    }

    // Check and add address column to users if it doesn't exist
    const checkAddressColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address';
    `;
    const addAddressColumn = `
      ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL;
    `;
    const [addressRows] = await connection.query(checkAddressColumn);
    if (addressRows[0]['COUNT(*)'] === 0) {
      await connection.query(addAddressColumn);
      console.log('Added address column to users table.');
    }

    // Check and add push_token column to users if it doesn't exist
    const checkPushTokenColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'push_token';
    `;
    const addPushTokenColumn = `
      ALTER TABLE users ADD COLUMN push_token VARCHAR(255) DEFAULT NULL;
    `;
    const [pushTokenRows] = await connection.query(checkPushTokenColumn);
    if (pushTokenRows[0]['COUNT(*)'] === 0) {
      await connection.query(addPushTokenColumn);
      console.log('Added push_token column to users table.');
    }

    // Check and add notification_settings column to users if it doesn't exist
    const checkNotificationSettingsColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'notification_settings';
    `;
    const addNotificationSettingsColumn = `
      ALTER TABLE users ADD COLUMN notification_settings JSON DEFAULT NULL;
    `;
    const [notificationSettingsRows] = await connection.query(checkNotificationSettingsColumn);
    if (notificationSettingsRows[0]['COUNT(*)'] === 0) {
      await connection.query(addNotificationSettingsColumn);
      console.log('Added notification_settings column to users table.');
    }

    const addUpdatedAtToMenuItems = `
      ALTER TABLE menu_items ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
    `;

    const checkUpdatedAtOnMenuItems = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'updatedAt';
    `;

    // Check and add ignore_stock column to transactions if it doesn't exist
    const [ignoreStockRows] = await connection.query(checkIgnoreStockColumn);
    if (ignoreStockRows[0]['COUNT(*)'] === 0) {
      await connection.query(addIgnoreStockColumn);
      console.log('Added ignore_stock column to transactions table.');
    }

    // Check and add updatedAt column to menu_items if it doesn't exist
    const [updatedAtRows] = await connection.query(checkUpdatedAtOnMenuItems);
    if (updatedAtRows[0]['COUNT(*)'] === 0) {
      await connection.query(addUpdatedAtToMenuItems);
      console.log('Added updatedAt column to menu_items table.');
    }

    // Check and add order_id column to transactions if it doesn't exist
    const checkOrderIdColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'order_id';
    `;
    const addOrderIdColumn = `
      ALTER TABLE transactions
      ADD COLUMN order_id INT NULL,
      ADD FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
    `;
    const [orderIdRows] = await connection.query(checkOrderIdColumn);
    if (orderIdRows[0]['COUNT(*)'] === 0) {
      await connection.query(addOrderIdColumn);
      console.log('Added order_id column and foreign key to transactions table.');
    }

    // Check and add user_id column to orders table if it doesn't exist
    const checkOrderUserIdColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'user_id';
    `;
    const addOrderUserIdColumn = `
      ALTER TABLE orders
      ADD COLUMN user_id INT NULL,
      ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    `;
    const [orderUserIdRows] = await connection.query(checkOrderUserIdColumn);
    if (orderUserIdRows[0]['COUNT(*)'] === 0) {
      await connection.query(addOrderUserIdColumn);
      console.log('Added user_id column and foreign key to orders table.');
    }

    // Check and add cash_paid and change columns to transactions if they don't exist
    const checkCashPaidAndChangeColumns = `
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME IN ('cash_paid', 'change');
    `;
    const addCashPaidAndChangeColumns = `
      ALTER TABLE transactions
      ADD COLUMN cash_paid DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN \`change\` DECIMAL(10, 2) DEFAULT 0;
    `;
    const [cashChangeRows] = await connection.query(checkCashPaidAndChangeColumns);
    if (cashChangeRows[0].count < 2) { // If either or both columns are missing
      await connection.query(addCashPaidAndChangeColumns);
      console.log('Added cash_paid and change columns to transactions table.');
    }

    // Check and add manual_discount column to transactions if it doesn't exist
    const checkManualDiscountColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'manual_discount';
    `;
    const addManualDiscountColumn = `
      ALTER TABLE transactions ADD COLUMN manual_discount DECIMAL(10, 2) DEFAULT 0;
    `;
    const [manualDiscountRows] = await connection.query(checkManualDiscountColumn);
    if (manualDiscountRows[0]['COUNT(*)'] === 0) {
      await connection.query(addManualDiscountColumn);
      console.log('Added manual_discount column to transactions table.');
    }

    // Check and add promo_discount column to transactions if it doesn't exist
    const checkPromoDiscountColumnTx = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'promo_discount';
    `;
    const addPromoDiscountColumnTx = `
      ALTER TABLE transactions ADD COLUMN promo_discount DECIMAL(15, 2) DEFAULT 0;
    `;
    const [promoDiscountTxRows] = await connection.query(checkPromoDiscountColumnTx);
    if (promoDiscountTxRows[0]['COUNT(*)'] === 0) {
      await connection.query(addPromoDiscountColumnTx);
      console.log('Added promo_discount column to transactions table.');
    }

    // Check and add deleted_at column to transactions if it doesn't exist
    const checkDeletedAtColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'deleted_at';
    `;
    const addDeletedAtColumn = `
      ALTER TABLE transactions ADD COLUMN deleted_at DATETIME DEFAULT NULL;
    `;
    const [deletedAtRows] = await connection.query(checkDeletedAtColumn);
    if (deletedAtRows[0]['COUNT(*)'] === 0) {
      await connection.query(addDeletedAtColumn);
      console.log('Added deleted_at column to transactions table.');
    }

    // Check and add is_permanent_delete column to transactions if it doesn't exist
    const checkIsPermanentDeleteColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'is_permanent_delete';
    `;
    const addIsPermanentDeleteColumn = `
      ALTER TABLE transactions ADD COLUMN is_permanent_delete BOOLEAN DEFAULT FALSE;
    `;
    const [isPermanentDeleteRows] = await connection.query(checkIsPermanentDeleteColumn);
    if (isPermanentDeleteRows[0]['COUNT(*)'] === 0) {
      await connection.query(addIsPermanentDeleteColumn);
      console.log('Added is_permanent_delete column to transactions table.');
    }

    // Check and add customer_name column to transactions if it doesn't exist
    const checkCustNameColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'customer_name';
    `;
    const [custNameRows] = await connection.query(checkCustNameColumn);
    if (custNameRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE transactions ADD COLUMN customer_name VARCHAR(255) DEFAULT NULL");
      console.log('Added customer_name column to transactions table.');
    }

    // Check and add customer_phone column to transactions if it doesn't exist
    const checkCustPhoneColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'customer_phone';
    `;
    const [custPhoneRows] = await connection.query(checkCustPhoneColumn);
    if (custPhoneRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE transactions ADD COLUMN customer_phone VARCHAR(25) DEFAULT NULL");
      console.log('Added customer_phone column to transactions table.');
    }

    // Check and add customer_address column to transactions if it doesn't exist
    const checkCustAddrColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'customer_address';
    `;
    const [custAddrRows] = await connection.query(checkCustAddrColumn);
    if (custAddrRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE transactions ADD COLUMN customer_address TEXT DEFAULT NULL");
      console.log('Added customer_address column to transactions table.');
    }

    // Check and add catatan column to transactions if it doesn't exist
    const checkCatatanColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'catatan';
    `;
    const [catatanRows] = await connection.query(checkCatatanColumn);
    if (catatanRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE transactions ADD COLUMN catatan TEXT DEFAULT NULL");
      console.log('Added catatan column to transactions table.');
    }

    // Check and add hpp column to menu_items if it doesn't exist
    const checkHppColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'hpp';
    `;
    const addHppColumn = `
      ALTER TABLE menu_items ADD COLUMN hpp DECIMAL(10, 2) DEFAULT 0;
    `;
    const [hppRows] = await connection.query(checkHppColumn);
    if (hppRows[0]['COUNT(*)'] === 0) {
      await connection.query(addHppColumn);
      console.log('Added hpp column to menu_items table.');
    }

    // Check and add discount column to menu_items if it doesn't exist
    const checkDiscountColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'discount';
    `;
    const addDiscountColumn = `
      ALTER TABLE menu_items ADD COLUMN discount DECIMAL(5, 2) DEFAULT 0.00;
    `;
    const [discountRows] = await connection.query(checkDiscountColumn);
    if (discountRows[0]['COUNT(*)'] === 0) {
      await connection.query(addDiscountColumn);
      console.log('Added discount column to menu_items table.');
    }

    // Check and add is_featured column to menu_items if it doesn't exist
    const checkIsFeaturedColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'is_featured';
    `;
    const addIsFeaturedColumn = `
      ALTER TABLE menu_items ADD COLUMN is_featured TINYINT(1) DEFAULT 0;
    `;
    const [isFeaturedRows] = await connection.query(checkIsFeaturedColumn);
    if (isFeaturedRows[0]['COUNT(*)'] === 0) {
      await connection.query(addIsFeaturedColumn);
      console.log('Added is_featured column to menu_items table.');
    }

    // Check and add user_id column to transactions if it doesn't exist
    const checkUserIdColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'user_id';
    `;
    const addUserIdColumn = `
      ALTER TABLE transactions
      ADD COLUMN user_id INT NULL,
      ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    `;
    const [userIdRows] = await connection.query(checkUserIdColumn);
    if (userIdRows[0]['COUNT(*)'] === 0) {
      await connection.query(addUserIdColumn);
      console.log('Added user_id column and foreign key to transactions table.');
    }



    // Check and add user_id column to expenses if it doesn't exist
    const checkExpenseUserIdColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'expenses' AND COLUMN_NAME = 'user_id';
    `;
    const addExpenseUserIdColumn = `
      ALTER TABLE expenses
      ADD COLUMN user_id INT NULL,
      ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    `;
    const [expenseUserIdRows] = await connection.query(checkExpenseUserIdColumn);
    if (expenseUserIdRows[0]['COUNT(*)'] === 0) {
      await connection.query(addExpenseUserIdColumn);
      console.log('Added user_id column and foreign key to expenses table.');
    }

    // Check and add account_id column to expenses
    const [expenseAccountIdCol] = await connection.query("SHOW COLUMNS FROM expenses LIKE 'account_id'");
    if (expenseAccountIdCol.length === 0) {
      await connection.query("ALTER TABLE expenses ADD COLUMN account_id INT NULL");
      await connection.query("ALTER TABLE expenses ADD FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL");
      console.log('Added account_id column to expenses table.');
    }

    // Check and add expense_id column to account_transactions
    const [atExpenseIdCol] = await connection.query("SHOW COLUMNS FROM account_transactions LIKE 'expense_id'");
    if (atExpenseIdCol.length === 0) {
      await connection.query("ALTER TABLE account_transactions ADD COLUMN expense_id INT NULL");
      await connection.query("ALTER TABLE account_transactions ADD FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE");
      console.log('Added expense_id column to account_transactions table.');
    }



    // --- Logika Pembuatan Admin Default ---
    const [adminUser] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
    if (adminUser.length === 0) {
      const defaultAdminPassword = 'admin'; // Password default
      const hashedAdminPassword = await bcrypt.hash(defaultAdminPassword, 10);
      await connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedAdminPassword, 'admin']
      );
      console.log('Default admin user "admin" created with password "admin".');
    }
    // --- Akhir Logika Pembuatan Admin Default ---

    // Create app_settings table
    const createAppSettingsTable = `
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        og_title VARCHAR(255) NOT NULL,
        og_description TEXT,
        og_image_url VARCHAR(255),
        restaurant_name VARCHAR(255) DEFAULT 'Trz Kasir Apps',
        restaurant_slogan VARCHAR(255) DEFAULT 'Aplikasi kasir modern cepat dan keren'
      );
    `;
    await connection.query(createAppSettingsTable);


    // Check and insert default app settings if none exist
    const [settingsRows] = await connection.query('SELECT id FROM app_settings LIMIT 1');
    if (settingsRows.length === 0) {
      await connection.query(
        'INSERT INTO app_settings (og_title, og_description, og_image_url, restaurant_name, restaurant_slogan) VALUES (?, ?, ?, ?, ?)',
        ['Kasir Berkah 88', 'Aplikasi kasir modern untuk bisnis Anda.', '/no_image.png', 'Trz Kasir Apps', 'Aplikasi kasir modern cepat dan keren']
      );
      console.log('Default app settings inserted.');
    }

    // Check and add restaurant_name column to app_settings if it doesn't exist
    const checkRestaurantNameColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_settings' AND COLUMN_NAME = 'restaurant_name';
    `;
    const addRestaurantNameColumn = `
      ALTER TABLE app_settings ADD COLUMN restaurant_name VARCHAR(255) DEFAULT 'Trz Kasir Apps';
    `;
    const [restaurantNameRows] = await connection.query(checkRestaurantNameColumn);
    if (restaurantNameRows[0]['COUNT(*)'] === 0) {
      await connection.query(addRestaurantNameColumn);
      console.log('Added restaurant_name column to app_settings table.');
    }

    // Check and add restaurant_slogan column to app_settings if it doesn't exist
    const checkRestaurantSloganColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_settings' AND COLUMN_NAME = 'restaurant_slogan';
    `;
    const addRestaurantSloganColumn = `
      ALTER TABLE app_settings ADD COLUMN restaurant_slogan VARCHAR(255) DEFAULT 'Aplikasi kasir modern cepat dan keren';
    `;
    const [restaurantSloganRows] = await connection.query(checkRestaurantSloganColumn);
    if (restaurantSloganRows[0]['COUNT(*)'] === 0) {
      await connection.query(addRestaurantSloganColumn);
      console.log('Added restaurant_slogan column to app_settings table.');
    }

    // Check and add owner_phone column to app_settings if it doesn't exist
    const checkOwnerPhoneColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_settings' AND COLUMN_NAME = 'owner_phone';
    `;
    const addOwnerPhoneColumn = `
      ALTER TABLE app_settings ADD COLUMN owner_phone VARCHAR(20) DEFAULT NULL;
    `;
    const [ownerPhoneRows] = await connection.query(checkOwnerPhoneColumn);
    if (ownerPhoneRows[0]['COUNT(*)'] === 0) {
      await connection.query(addOwnerPhoneColumn);
      console.log('Added owner_phone column to app_settings table.');
    }

    // Check and add show_stock_alert column to app_settings if it doesn't exist
    const checkShowStockAlertColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_settings' AND COLUMN_NAME = 'show_stock_alert';
    `;
    const addShowStockAlertColumn = `
      ALTER TABLE app_settings ADD COLUMN show_stock_alert TINYINT(1) DEFAULT 1;
    `;
    const [showStockAlertRows] = await connection.query(checkShowStockAlertColumn);
    if (showStockAlertRows[0]['COUNT(*)'] === 0) {
      await connection.query(addShowStockAlertColumn);
      console.log('Added show_stock_alert column to app_settings table.');
    }

    // Check and add restaurant_url column to app_settings if it doesn't exist
    const checkRestaurantUrlColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_settings' AND COLUMN_NAME = 'restaurant_url';
    `;
    const addRestaurantUrlColumn = `
      ALTER TABLE app_settings ADD COLUMN restaurant_url VARCHAR(255) DEFAULT 'www.berkah88.id';
    `;
    const [restaurantUrlRows] = await connection.query(checkRestaurantUrlColumn);
    if (restaurantUrlRows[0]['COUNT(*)'] === 0) {
      await connection.query(addRestaurantUrlColumn);
      console.log('Added restaurant_url column to app_settings table.');
    }

    // Check and add is_open column to app_settings if it doesn't exist
    const checkIsOpenColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_settings' AND COLUMN_NAME = 'is_open';
    `;
    const addIsOpenColumn = `
      ALTER TABLE app_settings ADD COLUMN is_open TINYINT(1) DEFAULT 1;
    `;
    const [isOpenRows] = await connection.query(checkIsOpenColumn);
    if (isOpenRows[0]['COUNT(*)'] === 0) {
      await connection.query(addIsOpenColumn);
      console.log('Added is_open column to app_settings table.');
    }

    // Check and add ignore_stock column to app_settings if it doesn't exist
    const checkIgnoreStockGlobalColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_settings' AND COLUMN_NAME = 'ignore_stock';
    `;
    const addIgnoreStockGlobalColumn = `
      ALTER TABLE app_settings ADD COLUMN ignore_stock TINYINT(1) DEFAULT 0;
    `;
    const [ignoreStockGlobalRows] = await connection.query(checkIgnoreStockGlobalColumn);
    if (ignoreStockGlobalRows[0]['COUNT(*)'] === 0) {
      await connection.query(addIgnoreStockGlobalColumn);
      console.log('Added ignore_stock column to app_settings table.');
    }

    // Check and add store_address column to app_settings if it doesn't exist
    const [storeAddressCols] = await connection.query("SHOW COLUMNS FROM app_settings LIKE 'store_address'");
    if (storeAddressCols.length === 0) {
      await connection.query("ALTER TABLE app_settings ADD COLUMN store_address TEXT DEFAULT NULL");
      console.log("Added store_address column to app_settings table.");
    }

    // Check and add open_time column to app_settings if it doesn't exist
    const [openTimeCols] = await connection.query("SHOW COLUMNS FROM app_settings LIKE 'open_time'");
    if (openTimeCols.length === 0) {
      await connection.query("ALTER TABLE app_settings ADD COLUMN open_time VARCHAR(10) DEFAULT '08:00'");
      console.log("Added open_time column to app_settings table.");
    }

    // Check and add close_time column to app_settings if it doesn't exist
    const [closeTimeCols] = await connection.query("SHOW COLUMNS FROM app_settings LIKE 'close_time'");
    if (closeTimeCols.length === 0) {
      await connection.query("ALTER TABLE app_settings ADD COLUMN close_time VARCHAR(10) DEFAULT '22:00'");
      console.log("Added close_time column to app_settings table.");
    }

    // --- Optimasi: Tambahkan Indeks untuk Peningkatan Performa ---
    const addIndexIfNotExists = async (connection, tableName, indexName, columns) => {
      const checkIndexQuery = `
        SELECT COUNT(1) as count
        FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
        AND table_name = ? 
        AND index_name = ?;
      `;
      const addIndexQuery = `ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\`(${columns});`;

      const [rows] = await connection.query(checkIndexQuery, [tableName, indexName]);
      if (rows[0].count === 0) {
        await connection.query(addIndexQuery);
        console.log(`Added index ${indexName} to ${tableName} table.`);
      }
    };

    console.log('Checking and adding indexes for performance optimization...');
    await addIndexIfNotExists(connection, 'transactions', 'idx_timestamp', 'timestamp');
    await addIndexIfNotExists(connection, 'transactions', 'idx_user_id', 'user_id');
    await addIndexIfNotExists(connection, 'expenses', 'idx_date', 'date');
    await addIndexIfNotExists(connection, 'menu_items', 'idx_category', 'category');
    await addIndexIfNotExists(connection, 'menu_item_options', 'idx_menu_item_id', 'menu_item_id');
    await addIndexIfNotExists(connection, 'orders', 'idx_created_at', 'created_at');
    console.log('Index optimization check complete.');
    // --- Akhir Optimasi Indeks ---

    // --- Automatic Deletion of Old Trashed Transactions ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const deleteOldSql = `
      DELETE FROM transactions 
      WHERE deleted_at IS NOT NULL AND deleted_at < ?
    `;
    const [deleteResult] = await connection.query(deleteOldSql, [thirtyDaysAgo]);
    if (deleteResult.affectedRows > 0) {
      console.log(`Successfully deleted ${deleteResult.affectedRows} old trashed transactions.`);
    }
    // --- End Automatic Deletion ---


    // Create activity_logs table
    const createActivityLogsTable = `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(255) NOT NULL,
        target_type VARCHAR(100),
        target_id VARCHAR(255),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;
    await connection.query(createActivityLogsTable);
    console.log('activity_logs table is ready.');

    // --- Chat System: create messages table ---
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message TEXT NOT NULL,
        order_id INT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      );
    `;
    await connection.query(createMessagesTable);
    console.log('messages table is ready.');

    // Check and add order_id column to messages if it doesn't exist
    const checkMessageOrderIdColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'order_id';
    `;
    const addMessageOrderIdColumn = `
      ALTER TABLE messages ADD COLUMN order_id INT DEFAULT NULL;
    `;
    const addMessageOrderForeignKey = `
      ALTER TABLE messages ADD CONSTRAINT fk_messages_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
    `;

    const [msgOrderRows] = await connection.query(checkMessageOrderIdColumn);
    if (msgOrderRows[0]['COUNT(*)'] === 0) {
      await connection.query(addMessageOrderIdColumn);
      try {
        await connection.query(addMessageOrderForeignKey);
      } catch (e) {
        console.log('Skipping FK creation for messages.order_id (might already exist or index issue)');
      }
      console.log('Added order_id column and foreign key to messages table.');
    }

    // Check and add is_read column to messages if it doesn't exist
    const checkIsReadColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'is_read';
    `;
    const addIsReadColumn = `
      ALTER TABLE messages ADD COLUMN is_read TINYINT(1) DEFAULT 0;
    `;
    const [msgIsReadRows] = await connection.query(checkIsReadColumn);
    if (msgIsReadRows[0]['COUNT(*)'] === 0) {
      await connection.query(addIsReadColumn);
      console.log('Added is_read column to messages table.');
    }

    // Check and add deleted_at column to messages if it doesn't exist
    const checkDeletedAtMsgColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'deleted_at';
    `;
    const addDeletedAtMsgColumn = `
      ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
    `;
    const [msgDeletedAtRows] = await connection.query(checkDeletedAtMsgColumn);
    if (msgDeletedAtRows[0]['COUNT(*)'] === 0) {
      await connection.query(addDeletedAtMsgColumn);
      console.log('Added deleted_at column to messages table.');
    }

    // Check and add image_url column to messages if it doesn't exist
    const checkImageUrlMsgColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'image_url';
    `;
    const addImageUrlMsgColumn = `
      ALTER TABLE messages ADD COLUMN image_url VARCHAR(255) DEFAULT NULL;
    `;
    const [msgImageUrlRows] = await connection.query(checkImageUrlMsgColumn);
    if (msgImageUrlRows[0]['COUNT(*)'] === 0) {
      await connection.query(addImageUrlMsgColumn);
      console.log('Added image_url column to messages table.');
    }

    // Check and add audio_url column to messages if it doesn't exist
    const checkAudioUrlMsgColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'audio_url';
    `;
    const addAudioUrlMsgColumn = `
      ALTER TABLE messages ADD COLUMN audio_url VARCHAR(255) DEFAULT NULL;
    `;
    const [msgAudioUrlRows] = await connection.query(checkAudioUrlMsgColumn);
    if (msgAudioUrlRows[0]['COUNT(*)'] === 0) {
      await connection.query(addAudioUrlMsgColumn);
      console.log('Added audio_url column to messages table.');
    }

    // Check and add is_edited column to messages if it doesn't exist
    const checkIsEditedMsgColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'is_edited';
    `;
    const addIsEditedMsgColumn = `
      ALTER TABLE messages ADD COLUMN is_edited TINYINT(1) DEFAULT 0;
    `;
    const [msgIsEditedRows] = await connection.query(checkIsEditedMsgColumn);
    if (msgIsEditedRows[0]['COUNT(*)'] === 0) {
      await connection.query(addIsEditedMsgColumn);
      console.log('Added is_edited column to messages table.');
    }

    // Ensure messages table supports emojis (utf8mb4)
    try {
      const [tableStatus] = await connection.query("SHOW TABLE STATUS WHERE Name = 'messages'");
      if (tableStatus.length > 0 && tableStatus[0].Collation !== 'utf8mb4_unicode_ci') {
        console.log('Migrating messages table to utf8mb4 for emoji support...');
        await connection.query("ALTER TABLE messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        console.log('Successfully converted messages table to utf8mb4.');
      }
    } catch (e) {
      console.error('Info: Charset conversion for messages table skipped or failed:', e.message);
    }

    // Create menu_reviews table
    const createMenuReviewsTable = `
      CREATE TABLE IF NOT EXISTS menu_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_item_id VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        order_id INT NULL,
        rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        UNIQUE KEY \`unique_user_item\` (user_id, menu_item_id(191))
      );
    `;
    await connection.query(createMenuReviewsTable);
    console.log('menu_reviews table is ready.');

    // Migration for unique constraint
    try {
      // 1. First, clean up any existing duplicate reviews (keeping only the latest one)
      // This is necessary because ALTER TABLE ADD UNIQUE will fail if duplicates exist.
      await connection.query(`
        DELETE r1 FROM menu_reviews r1
        JOIN menu_reviews r2 
        ON r1.user_id = r2.user_id 
        AND r1.menu_item_id = r2.menu_item_id 
        AND r1.id < r2.id
      `);
      console.log('Cleaned up duplicate reviews from menu_reviews table.');

      const [existingConstraints] = await connection.query(`
            SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_reviews' AND INDEX_NAME = 'unique_user_item_order'
        `);
      if (existingConstraints.length > 0) {
        try {
          await connection.query("ALTER TABLE menu_reviews DROP INDEX unique_user_item_order");
          console.log('Successfully dropped old unique_user_item_order index.');
        } catch (dropErr) {
          if (!dropErr.message.includes('foreign key constraint')) {
            throw dropErr;
          }
          console.log('Skipping drop of unique_user_item_order as it is needed by a FK.');
        }
      }

      // 2. Add the new unique constraint if it doesn't exist
      const [newConstr] = await connection.query(`
          SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_reviews' AND INDEX_NAME = 'unique_user_item'
      `);
      if (newConstr.length === 0) {
        await connection.query("ALTER TABLE menu_reviews ADD UNIQUE KEY unique_user_item (user_id, menu_item_id(191))");
        console.log('Successfully added menu_reviews unique_user_item constraint.');
      }
    } catch (err) {
      console.error('Error migrating menu_reviews constraints:', err.message);
    }

    // --- Points System Migration ---
    // Check and add points column to users if it doesn't exist
    const checkPointsColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'points';
    `;
    const [pointsRows] = await connection.query(checkPointsColumn);
    if (pointsRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN points DECIMAL(10, 2) DEFAULT 0.00");
      console.log('Added points column to users table.');
    }

    // Ensure points_per_item setting exists
    const ensurePointsSetting = `
      INSERT IGNORE INTO settings(\`key\`, \`value\`) VALUES
      ('points_per_item', '100'),
      ('point_system_enabled', '1');
    `;
    await connection.query(ensurePointsSetting);

    // Removed duplicate points_history creation from here


    // Check and add points column to users if it doesn't exist
    const checkUserPointsColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'points';
    `;
    const [pointsUserRows] = await connection.query(checkUserPointsColumn);
    if (pointsUserRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN points DECIMAL(15, 2) DEFAULT 0.00");
      console.log('Added points column to users table.');
    }

    // Check and add customer_id, points_used, points_earned to transactions
    const checkTxCustomerIdColumn = `
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'customer_id';
    `;
    const [txCustRows] = await connection.query(checkTxCustomerIdColumn);
    if (txCustRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE transactions ADD COLUMN customer_id INT NULL, ADD FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL");
      console.log('Added customer_id column to transactions table.');
    }

    const checkTxPointsUsedColumn = `
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'points_used';
    `;
    const [txPointsUsedRows] = await connection.query(checkTxPointsUsedColumn);
    if (txPointsUsedRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE transactions ADD COLUMN points_used DECIMAL(15, 2) DEFAULT 0.00");
      console.log('Added points_used column to transactions table.');
    }

    const checkTxPointsEarnedColumn = `
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'points_earned';
    `;
    const [txPointsEarnedRows] = await connection.query(checkTxPointsEarnedColumn);
    if (txPointsEarnedRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE transactions ADD COLUMN points_earned DECIMAL(15, 2) DEFAULT 0.00");
      console.log('Added points_earned column to transactions table.');
    }

    // Check and add discount_value to promos
    const checkPromoDiscountValueColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promos' AND COLUMN_NAME = 'discount_value';
    `;
    const [promoDiscValueRows] = await connection.query(checkPromoDiscountValueColumn);
    if (promoDiscValueRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE promos ADD COLUMN discount_value DECIMAL(15, 2) DEFAULT 0.00");
      console.log('Added discount_value column to promos table.');
    }

    // Check and add discount_type to promos
    const checkPromoDiscountTypeColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promos' AND COLUMN_NAME = 'discount_type';
    `;
    const [promoDiscTypeRows] = await connection.query(checkPromoDiscountTypeColumn);
    if (promoDiscTypeRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE promos ADD COLUMN discount_type ENUM('fixed', 'percentage') DEFAULT 'fixed'");
      console.log('Added discount_type column to promos table.');
    }

    // Check and add min_purchase to promos
    const checkPromoMinPurchaseColumn = `
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promos' AND COLUMN_NAME = 'min_purchase';
    `;
    const [promoMinPurchaseRows] = await connection.query(checkPromoMinPurchaseColumn);
    if (promoMinPurchaseRows[0]['COUNT(*)'] === 0) {
      await connection.query("ALTER TABLE promos ADD COLUMN min_purchase DECIMAL(15, 2) DEFAULT 0.00");
      console.log('Added min_purchase column to promos table.');
    }


    // --- Promos Table Setup ---
    try {
      const createPromosTable = `
        CREATE TABLE IF NOT EXISTS promos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          code VARCHAR(50) UNIQUE,
          icon VARCHAR(50),
          color VARCHAR(50),
          expiry DATETIME,
          is_active BOOLEAN DEFAULT TRUE,
          discount_value DECIMAL(10, 2) DEFAULT 0,
          discount_type VARCHAR(20) DEFAULT 'percentage',
          min_purchase DECIMAL(10, 2) DEFAULT 0,
          is_hero BOOLEAN DEFAULT FALSE,
          image_url TEXT,
          badge_text VARCHAR(50),
          is_one_time BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await connection.query(createPromosTable);
      console.log('promos table checked/created.');

      // Check and add columns if missing
      const promoColsToCheck = [
        { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'is_hero', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'is_one_time', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'min_purchase', type: 'DECIMAL(10, 2) DEFAULT 0' },
        { name: 'image_url', type: 'TEXT' },
        { name: 'badge_text', type: 'VARCHAR(50)' },
        { name: 'discount_value', type: 'DECIMAL(10, 2) DEFAULT 0' },
        { name: 'discount_type', type: "VARCHAR(20) DEFAULT 'percentage'" },
        { name: 'code', type: 'VARCHAR(50)' },
        { name: 'expiry', type: 'DATETIME' },
        { name: 'icon', type: 'VARCHAR(50)' },
        { name: 'color', type: 'VARCHAR(50)' }
      ];

      for (const col of promoColsToCheck) {
        const checkColSql = `
          SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promos' AND COLUMN_NAME = '${col.name}';
        `;
        const [rows] = await connection.query(checkColSql);
        if (rows[0].count === 0) {
          console.log(`Adding missing column ${col.name} to promos table...`);
          await connection.query(`ALTER TABLE promos ADD COLUMN ${col.name} ${col.type}`);
        }
      }
    } catch (promoErr) {
      console.error("Error setting up promos table:", promoErr);
    }



    // --- Points History Table Setup ---
    try {
      const createPointsHistoryTable = `
        CREATE TABLE IF NOT EXISTS points_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          type VARCHAR(50) NOT NULL,
          description TEXT,
          transaction_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;
      await connection.query(createPointsHistoryTable);
      console.log('points_history table checked/created.');

      // Ensure type column is VARCHAR(50) if it already exists as ENUM or shorter VARCHAR
      // This handles the migration for existing tables that might have the strict ENUM
      const checkTypeColumn = `
        SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'points_history' AND COLUMN_NAME = 'type';
      `;
      const [typeColRows] = await connection.query(checkTypeColumn);
      if (typeColRows.length > 0 && typeColRows[0].COLUMN_TYPE.toLowerCase().includes('enum')) {
        await connection.query("ALTER TABLE points_history MODIFY COLUMN type VARCHAR(50) NOT NULL");
        console.log('Migrated points_history.type to VARCHAR(50).');
      }

    } catch (err) {
      console.error('Error setting up points_history table:', err);
    }


    // --- Activity Logs Table Setup ---
    try {
      const createActivityLogsTable = `
        CREATE TABLE IF NOT EXISTS activity_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          action VARCHAR(255) NOT NULL,
          target_type VARCHAR(50),
          target_id VARCHAR(255),
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await connection.query(createActivityLogsTable);
      console.log('activity_logs table checked/created.');
    } catch (err) {
      console.error('Error setting up activity_logs table:', err);
    }


    // --- Ensure Point System Settings ---
    try {
      const ensurePointSettings = `
        INSERT IGNORE INTO settings (\`key\`, \`value\`) VALUES
        ('point_system_enabled', '1'),
        ('points_per_item', '100');
      `;
      // Use IGNORE to not overwrite if they exist, but ensure defaults are there
      await connection.query(ensurePointSettings);
      console.log('Point system settings checked/ensured.');
    } catch (settingsErr) {
      console.error("Error ensuring point settings:", settingsErr);
    }


    // --- Menu Reviews Table Setup moved to earlier section ---


    // --- Expense Categories Table Setup ---
    try {
      const createExpenseCategoriesTable = `
        CREATE TABLE IF NOT EXISTS expense_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE
        );
      `;
      await connection.query(createExpenseCategoriesTable);
      console.log('expense_categories table checked/created.');
    } catch (err) {
      console.error('Error setting up expense_categories table:', err);
    }

    // --- Expenses Table Migrations ---
    try {
      const [expenseCols] = await connection.query("SHOW COLUMNS FROM expenses");
      const expenseColNames = expenseCols.map(c => c.Field);

      if (!expenseColNames.includes('user_id')) {
        await connection.query("ALTER TABLE expenses ADD COLUMN user_id INT NULL");
        try {
          await connection.query("ALTER TABLE expenses ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL");
        } catch (fkErr) {
          console.log('Skipping FK creation for expenses.user_id (might already exist)');
        }
        console.log("Added user_id column to expenses table.");
      }

      if (!expenseColNames.includes('notes')) {
        await connection.query("ALTER TABLE expenses ADD COLUMN notes TEXT DEFAULT NULL");
        console.log("Added notes column to expenses table.");
      }
    } catch (err) {
      console.error('Error migrating expenses table:', err);
    }

    // --- Information Table Migrations ---
    try {
      const [linkTypeCol] = await connection.query("SHOW COLUMNS FROM information LIKE 'link_type'");
      if (linkTypeCol.length === 0) {
        await connection.query("ALTER TABLE information ADD COLUMN link_type VARCHAR(50) DEFAULT 'none'");
        console.log("Added link_type column to information table.");
      }
      const [linkValueCol] = await connection.query("SHOW COLUMNS FROM information LIKE 'link_value'");
      if (linkValueCol.length === 0) {
        await connection.query("ALTER TABLE information ADD COLUMN link_value VARCHAR(255) DEFAULT NULL");
        console.log("Added link_value column to information table.");
      }
    } catch (err) {
      console.error('Error migrating information table:', err);
    }

    // --- Closing Sessions (Tutup Buku) Setup ---
    try {
      const createClosingSessionsTable = `
        CREATE TABLE IF NOT EXISTS closing_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          closed_by_user_id INT NULL,
          total_sales DECIMAL(15, 2) DEFAULT 0,
          total_expenses DECIMAL(15, 2) DEFAULT 0,
          total_profit DECIMAL(15, 2) DEFAULT 0,
          lapak_balance_at_closing DECIMAL(15, 2) DEFAULT 0,
          owner_balance_at_closing DECIMAL(15, 2) DEFAULT 0,
          initial_capital_next_day DECIMAL(15, 2) DEFAULT 0,
          notes TEXT,
          FOREIGN KEY (closed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB;
      `;
      // Jika tabel sudah ada tapi bukan InnoDB, kita perlu ubah (atau drop dan recreate untuk kemudahan migrasi awal)
      const [sessionsStatus] = await connection.query("SHOW TABLE STATUS LIKE 'closing_sessions'");
      if (sessionsStatus.length > 0 && sessionsStatus[0].Engine !== 'InnoDB') {
        console.log('Converting closing_sessions to InnoDB...');
        await connection.query("ALTER TABLE closing_sessions ENGINE=InnoDB");
      }

      await connection.query(createClosingSessionsTable);
      console.log('closing_sessions table is ready.');

      // Tables to add closing_session_id
      const tablesToArchive = [
        'transactions',
        'orders',
        'expenses',
        'account_transactions',
        'simple_transactions',
        'simple_transaction_items',
        'cash_reconciliations',
        'employee_credits',
        'raw_material_stock_history'
      ];

      for (const tableName of tablesToArchive) {
        try {
          // Ensure table is InnoDB before adding FK
          const [tableStatus] = await connection.query(`SHOW TABLE STATUS LIKE ?`, [tableName]);
          if (tableStatus.length > 0 && tableStatus[0].Engine !== 'InnoDB') {
            console.log(`Converting ${tableName} to InnoDB to support foreign keys...`);
            await connection.query(`ALTER TABLE ${tableName} ENGINE=InnoDB`);
          }

          const checkColSql = `
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'closing_session_id';
          `;
          const [rows] = await connection.query(checkColSql, [tableName]);
          if (rows[0].count === 0) {
            console.log(`Adding closing_session_id to ${tableName}...`);
            await connection.query(`ALTER TABLE ${tableName} ADD COLUMN closing_session_id INT NULL`);
          }

          // Check if constraint exists already
          const checkFkSql = `
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?;
          `;
          const [fkRows] = await connection.query(checkFkSql, [tableName, `fk_${tableName}_closing_session`]);
          if (fkRows[0].count === 0) {
            console.log(`Adding foreign key constraint to ${tableName}...`);
            await connection.query(`ALTER TABLE ${tableName} ADD CONSTRAINT fk_${tableName}_closing_session FOREIGN KEY (closing_session_id) REFERENCES closing_sessions(id) ON DELETE SET NULL`);
          }
        } catch (tableErr) {
          console.error(`Error processing table ${tableName} for archiving:`, tableErr.message);
        }
      }
    } catch (err) {
      console.error('Error setting up closing sessions:', err);
    }

    // === HPP INGREDIENTS: Master Bahan Dinamis ===
    const createHppIngredientsTable = `
      CREATE TABLE IF NOT EXISTS hpp_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(createHppIngredientsTable);
    console.log('hpp_ingredients table is ready.');

    connection.release();

  } catch (error) {
    console.error('Error setting up the database:', error);
    console.error(error.stack);
    // Exit process if database connection fails
    process.exit(1);
  }
};

setupDatabase();

module.exports = promisePool;
