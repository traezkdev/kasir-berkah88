const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'kasir.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error connecting to database: ${err.message}`);
  }
  console.log('Connected to the kasir database.');
});

module.exports = db;