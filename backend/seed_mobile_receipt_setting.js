require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    try {
        // Coba baca config dari file db.js atau config.js
        let dbConfig;
        try {
            const cfg = require('./config');
            dbConfig = cfg.db || cfg;
        } catch(e) {
            // Fallback
        dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'kasir'
        };
        }

        const db = await mysql.createConnection(dbConfig);
        
        await db.query(
            "INSERT IGNORE INTO settings (`key`, `value`) VALUES (?, ?)",
            ['mobile_receipt_ui_version', '1']
        );
        
        const [rows] = await db.query(
            "SELECT `key`, `value` FROM settings WHERE `key` = ?",
            ['mobile_receipt_ui_version']
        );
        
        console.log('Setting mobile_receipt_ui_version:', rows);
        await db.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
})();
