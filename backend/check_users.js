require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

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

async function checkUsers() {
    try {
        const [rows] = await promisePool.query('SELECT id, username, role FROM users');
        let output = '=== LIST USERS ===\n';
        rows.forEach(r => {
            output += `ID: ${r.id}, Username: ${r.username}, Role: ${r.role}\n`;
        });
        fs.writeFileSync(path.join(__dirname, 'users_log.txt'), output);
        console.log('Results written to users_log.txt');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkUsers();
