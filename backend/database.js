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

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            items TEXT,
            total INTEGER,
            ppn REAL,
            isEmployeeMeal INTEGER
        )`, (err) => {
            if (err) {
                // Table already created
            } else {
                // Table just created, creating some rows
                const insert = 'INSERT INTO transactions (id, timestamp, items, total, isEmployeeMeal, ppn) VALUES (?,?,?,?,?,?)'
                db.serialize(() => {
                    const stmt = db.prepare(insert);
                    mockTransactions.forEach(txn => {
                        stmt.run([txn.id, txn.timestamp, txn.items, txn.total, txn.isEmployeeMeal, 0.11]);
                    });
                    stmt.finalize();
                });
                 console.log('Mock transactions seeded.');
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY,
            name TEXT,
            price INTEGER,
            stock INTEGER,
            category TEXT,
            image_url TEXT
        )`, (err) => {
            if (err) {
                // Table already created
            } else {
                // Table just created, creating some rows
                const mockMenuItems = [
                    { id: 'M001', name: 'Nasi Goreng Spesial', price: 25000, stock: 50, category: 'Makanan Utama', image_url: '' },
                    { id: 'M002', name: 'Mie Ayam Komplit', price: 20000, stock: 45, category: 'Makanan Utama', image_url: '' },
                    { id: 'M003', name: 'Ayam Bakar Madu', price: 28000, stock: 30, category: 'Makanan Utama', image_url: '' },
                    { id: 'M004', name: 'Soto Betawi', price: 22000, stock: 40, category: 'Makanan Utama', image_url: '' },
                    { id: 'M005', name: 'Gado-gado', price: 18000, stock: 60, category: 'Salad', image_url: '' },
                    { id: 'M006', name: 'Es Teh Manis', price: 5000, stock: 100, category: 'Minuman', image_url: '' },
                    { id: 'M007', name: 'Es Jeruk', price: 7000, stock: 90, category: 'Minuman', image_url: '' },
                    { id: 'M008', name: 'Kerupuk Udang', price: 3000, stock: 200, category: 'Camilan', image_url: '' },
                ];
                const insert = 'INSERT INTO menu_items (id, name, price, stock, category, image_url) VALUES (?,?,?,?,?,?)'
                db.serialize(() => {
                    const stmt = db.prepare(insert);
                    mockMenuItems.forEach(item => {
                        stmt.run([item.id, item.name, item.price, item.stock, item.category, item.image_url]);
                    });
                    stmt.finalize();
                });
                 console.log('Mock menu items seeded.');
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`, (err) => {
            if (err) {
                // Table already created
            } else {
                // Table just created, creating default PPN
                const insert = 'INSERT INTO settings (key, value) VALUES (?,?)'
                db.run(insert, ["ppn", "0.11"]);
            }
        });
    }
});

module.exports = db;
