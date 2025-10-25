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
        isEmployeeMeal BOOLEAN DEFAULT FALSE
        
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
        role VARCHAR(50) DEFAULT 'user'
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
    console.log('menu_items table is ready.');
    await connection.query(createSettingsTable);
    console.log('settings table is ready.');
    await connection.query(createTransactionsTable);
    console.log('transactions table is ready.');
    await connection.query(createExpensesTable);
    console.log('expenses table is ready.');
    await connection.query(createUsersTable);
    console.log('users table is ready.');
    await connection.query(createNotesTable);
    console.log('notes table is ready.');
    await connection.query(createEmployeesTable);
    console.log('employees table is ready.');
    await connection.query(createOrdersTable);
    console.log('orders table is ready.');

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
    }

    // Check and add ignore_stock column to transactions if it doesn't exist
    const [ignoreStockRows] = await connection.query(checkIgnoreStockColumn);
    if (ignoreStockRows[0]['COUNT(*)'] === 0) {
      await connection.query(addIgnoreStockColumn);
      console.log('Added ignore_stock column to transactions table.');
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
