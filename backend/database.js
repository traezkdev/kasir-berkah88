const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = "kasir.sqlite";

// Mock transaction data to be seeded
const mockTransactions = [
    {
      id: 'TXN001',
      timestamp: new Date('2025-01-21T09:15:00').toISOString(),
      items: JSON.stringify([
        { name: 'Nasi Gudeg', quantity: 2, price: 15000 },
        { name: 'Es Teh Manis', quantity: 2, price: 5000 }
      ]),
      total: 40000,
      isEmployeeMeal: 0 // 0 for false, 1 for true
    },
    {
      id: 'TXN002',
      timestamp: new Date('2025-01-21T10:30:00').toISOString(),
      items: JSON.stringify([
        { name: 'Ayam Bakar', quantity: 1, price: 25000 },
        { name: 'Nasi Putih', quantity: 1, price: 5000 },
        { name: 'Sambal Terasi', quantity: 1, price: 3000 }
      ]),
      total: 33000,
      isEmployeeMeal: 0
    },
    {
      id: 'TXN003',
      timestamp: new Date('2025-01-21T11:45:00').toISOString(),
      items: JSON.stringify([
        { name: 'Soto Ayam', quantity: 1, price: 18000 },
        { name: 'Kerupuk', quantity: 1, price: 2000 }
      ]),
      total: 20000,
      isEmployeeMeal: 1
    },
    {
      id: 'TXN004',
      timestamp: new Date('2025-01-21T12:20:00').toISOString(),
      items: JSON.stringify([
        { name: 'Gado-gado', quantity: 3, price: 12000 },
        { name: 'Es Jeruk', quantity: 3, price: 6000 }
      ]),
      total: 54000,
      isEmployeeMeal: 0
    },
    {
      id: 'TXN005',
      timestamp: new Date('2025-01-21T13:10:00').toISOString(),
      items: JSON.stringify([
        { name: 'Rendang', quantity: 1, price: 30000 },
        { name: 'Nasi Putih', quantity: 1, price: 5000 },
        { name: 'Es Teh Manis', quantity: 1, price: 5000 }
      ]),
      total: 40000,
      isEmployeeMeal: 0
    }
  ];

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
