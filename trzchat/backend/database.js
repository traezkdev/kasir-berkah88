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
    if (!columnNames.includes('fcm_token')) {
      await connection.query(`ALTER TABLE users ADD COLUMN fcm_token TEXT NULL AFTER status`);
      console.log('Added fcm_token column to users table');
    } else {
      // Pastikan kolom cukup lebar jika sudah ada
      await connection.query(`ALTER TABLE users MODIFY COLUMN fcm_token TEXT NULL`);
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
        type ENUM('text', 'image', 'audio', 'video', 'file') DEFAULT 'text',
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

    // Migration: Update ENUM for type column
    await connection.query(`ALTER TABLE messages MODIFY COLUMN type ENUM('text', 'image', 'audio', 'video', 'file') DEFAULT 'text'`);
    console.log('Updated type column ENUM in messages table');

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
    if (!msgColumnNames.includes('image_url')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN image_url VARCHAR(500) NULL AFTER audio_url`);
      console.log('Added image_url column to messages table');
    }
    if (!msgColumnNames.includes('video_url')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN video_url VARCHAR(500) NULL AFTER image_url`);
      console.log('Added video_url column to messages table');
    }
    if (!msgColumnNames.includes('file_url')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN file_url VARCHAR(500) NULL AFTER video_url`);
      console.log('Added file_url column to messages table');
    }
    if (!msgColumnNames.includes('file_name')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN file_name VARCHAR(255) NULL AFTER file_url`);
      console.log('Added file_name column to messages table');
    }
    if (!msgColumnNames.includes('thumbnail_url')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN thumbnail_url VARCHAR(500) NULL AFTER video_url`);
      console.log('Added thumbnail_url column to messages table');
    }
    if (!msgColumnNames.includes('status')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN status ENUM('sent', 'delivered', 'read') DEFAULT 'sent' AFTER is_deleted`);
      console.log('Added status column to messages table');
    }
    if (!msgColumnNames.includes('width')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN width INT NULL AFTER text`);
      console.log('Added width column to messages table');
    }
    if (!msgColumnNames.includes('height')) {
      await connection.query(`ALTER TABLE messages ADD COLUMN height INT NULL AFTER width`);
      console.log('Added height column to messages table');
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS message_visibility (
        user_id INT,
        message_id INT,
        hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, message_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT,
        user_id INT,
        is_archived TINYINT(1) DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Migration: Add is_archived to chat_participants if missing
    const [cpColumns] = await connection.query(`SHOW COLUMNS FROM chat_participants`);
    const cpColumnNames = cpColumns.map(c => c.Field);
    if (!cpColumnNames.includes('is_archived')) {
      await connection.query(`ALTER TABLE chat_participants ADD COLUMN is_archived TINYINT(1) DEFAULT 0 AFTER user_id`);
      console.log('Added is_archived column to chat_participants table');
    }


    connection.release();
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = { pool, initDB };
