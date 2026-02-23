const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.changeUser({ database: process.env.DB_NAME });

    // Ensure database uses utf8mb4
    await connection.query(`ALTER DATABASE \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    // Create Tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(20),
        avatar VARCHAR(255),
        status VARCHAR(20) DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // Migration: Add columns if they missed in previous versions
    const [existingColumns] = await connection.query(`SHOW COLUMNS FROM users`);
    const columnNames = existingColumns.map(c => c.Field);

    if (!columnNames.includes('email')) {
      await connection.query(`ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE AFTER username`);
      console.log('Added email column to users table');
    }
    if (!columnNames.includes('phone')) {
      await connection.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER full_name`);
      console.log('Added phone column to users table');
    }
    if (!columnNames.includes('last_seen')) {
      await connection.query(`ALTER TABLE users ADD COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status`);
      console.log('Added last_seen column to users table');
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('private', 'group') DEFAULT 'private',
        name VARCHAR(255),
        avatar VARCHAR(255),
        last_message TEXT,
        last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT,
        sender_id INT,
        reply_to INT NULL,
        text TEXT,
        type ENUM('text', 'image', 'audio', 'file') DEFAULT 'text',
        is_edited BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id),
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (reply_to) REFERENCES messages(id) ON DELETE SET NULL
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // Migration for existing tables to support utf8mb4
    await connection.query(`ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`ALTER TABLE chats CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`ALTER TABLE messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    // Migration: Add columns to messages table
    const [existingMsgColumns] = await connection.query(`SHOW COLUMNS FROM messages`);
    const msgColumnNames = existingMsgColumns.map(c => c.Field);

    if (!msgColumnNames.includes('reply_to')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN reply_to INT NULL AFTER sender_id`);
      await connection.query(`ALTER TABLE messages ADD CONSTRAINT fk_reply_to FOREIGN KEY (reply_to) REFERENCES messages(id) ON DELETE SET NULL`);
      console.log('Added reply_to column to messages table');
    }
    if (!msgColumnNames.includes('is_edited')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE AFTER type`);
      console.log('Added is_edited column to messages table');
    }
    if (!msgColumnNames.includes('is_deleted')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER is_edited`);
      console.log('Added is_deleted column to messages table');
    }
    if (!msgColumnNames.includes('audio_url')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN audio_url VARCHAR(500) NULL AFTER text`);
      console.log('Added audio_url column to messages table');
    }
    if (!msgColumnNames.includes('status')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN status ENUM('sent', 'delivered', 'read') DEFAULT 'sent' AFTER is_deleted`);
      console.log('Added status column to messages table');
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT,
        user_id INT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    connection.release();
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = { pool, initDB };
