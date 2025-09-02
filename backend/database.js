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
  queueLimit: 0
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

    // Check and add notes column to expenses if it doesn't exist
    const [notesRows] = await connection.query(checkNotesColumn);
    if (notesRows[0]['COUNT(*)'] === 0) {
      await connection.query(addNotesColumnToExpenses);
      console.log('Added notes column to expenses table.');
    }

    // Check and add role column if it doesn't exist
    const [rows] = await connection.query(checkRoleColumn);
    if (rows[0]['COUNT(*)'] === 0) {
      await connection.query(addRoleColumn);
      console.log('Added role column to users table.');
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
    // Exit process if database connection fails
    process.exit(1);
  }
};

setupDatabase();

module.exports = promisePool;
