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
  timezone: '+07:00'
});

const promisePool = pool.promise();

const setupDatabase = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('Connected to MySQL database.');

    // SQL statements to create tables if they don't exist
    const createMenuItemsTable = `
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL,
        category VARCHAR(255),
        image_url VARCHAR(255)
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
        notes TEXT DEFAULT NULL
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
        role ENUM('admin', 'user', 'kasir', 'guest') DEFAULT 'user'
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

    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_address TEXT,
        items JSON NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createEmployeesTable = `
      CREATE TABLE IF NOT EXISTS employees (
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

    // Execute the create table statements
    await connection.query(createMenuItemsTable);

    await connection.query(createSettingsTable);


    const insertDefaultSettings = `
      INSERT IGNORE INTO settings (\`key\`, \`value\`) VALUES
      ('cashier_dashboard_title', 'Dasbor Kasir');
    `;
    await connection.query(insertDefaultSettings);

    await connection.query(createTransactionsTable);

    await connection.query(createExpensesTable);

    await connection.query(createUsersTable);
    console.log('users table is ready.');
    await connection.query(createNotesTable);
    console.log('notes table is ready.');
    await connection.query(createEmployeesTable);
    console.log('employees table is ready.');
    await connection.query(createOrdersTable);
    console.log('orders table is ready.');

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

    // Check and add role column if it doesn't exist
    const [rows] = await connection.query(checkRoleColumn);
    if (rows[0]['COUNT(*)'] === 0) {
      await connection.query(addRoleColumn);
      console.log('Added role column to users table.');
    } else {
      // If the column exists, modify it to the new ENUM type
      const alterRoleToEnum = `
        ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'kasir', 'guest') DEFAULT 'user';
      `;
      await connection.query(alterRoleToEnum);
      console.log('Modified role column to ENUM type.');
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
