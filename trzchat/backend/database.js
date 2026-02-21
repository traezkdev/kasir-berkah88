const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDB() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database');

        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        await connection.changeUser({ database: process.env.DB_NAME });

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
        status VARCHAR(255) DEFAULT 'online',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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

        await connection.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('private', 'group') DEFAULT 'private',
        name VARCHAR(255),
        avatar VARCHAR(255),
        last_message TEXT,
        last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT,
        sender_id INT,
        text TEXT,
        type ENUM('text', 'image', 'audio', 'file') DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
      )
    `);

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
