const express = require('express');
const cors = require('cors');
const db = require('./database.js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000; // Using a different port to avoid conflict with React dev server

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});

// API Endpoints

// --- Menu Items Endpoints ---

// Get all menu items
app.get("/api/menu-items", (req, res, next) => {
    const sql = "select * from menu_items"
    const params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

// Add a new menu item
app.post("/api/menu-items", (req, res, next) => {
    const { id, name, price, stock, category, image_url } = req.body;
    const sql = 'INSERT INTO menu_items (id, name, price, stock, category, image_url) VALUES (?,?,?,?,?,?)';
    const params = [id, name, price, stock, category, image_url];
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": req.body,
            "id" : this.lastID
        })
    });
});

// Update a menu item
app.put("/api/menu-items/:id", (req, res, next) => {
    const { name, price, stock, category, image_url } = req.body;
    const sql = `UPDATE menu_items set 
           name = COALESCE(?,name), 
           price = COALESCE(?,price), 
           stock = COALESCE(?,stock), 
           category = COALESCE(?,category), 
           image_url = COALESCE(?,image_url) 
           WHERE id = ?`;
    const params = [name, price, stock, category, image_url, req.params.id];
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": res.message})
            return;
        }
        res.json({ message: "success", data: req.body, changes: this.changes })
    });
});

// Delete a menu item
app.delete("/api/menu-items/:id", (req, res, next) => {
    db.run(
        'DELETE FROM menu_items WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({"message":"deleted", changes: this.changes})
    });
});

// --- Settings Endpoints ---

// Get PPN setting
app.get('/api/settings/ppn', (req, res) => {
  const sql = "SELECT value FROM settings WHERE key = ?";
  db.get(sql, ['ppn'], (err, row) => {
    if (err) {
      res.status(400).json({"error":err.message});
      return;
    }
    if (row) {
      res.json({
        "message":"success",
        "data": parseFloat(row.value)
      });
    } else {
      // If not found, return default value
      res.json({
        "message":"success",
        "data": 0.11
      });
    }
  });
});

// Update PPN setting
app.put('/api/settings/ppn', (req, res) => {
  const { value } = req.body;
  if (value === undefined) {
    return res.status(400).json({ "error": "Value is required" });
  }
  const sql = 'UPDATE settings SET value = ? WHERE key = ?';
  db.run(sql, [value.toString(), 'ppn'], function(err) {
    if (err) {
      res.status(400).json({"error":err.message});
      return;
    }
    if (this.changes > 0) {
      res.json({ message: "success", data: { key: 'ppn', value } });
    } else {
      // If no rows were updated, it means the key doesn't exist. Insert it.
      const insertSql = 'INSERT INTO settings (key, value) VALUES (?, ?)';
      db.run(insertSql, ['ppn', value.toString()], (err) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({ message: "success", data: { key: 'ppn', value } });
      });
    }
  });
});


// --- Transaction Endpoints ---

// Get all transactions
app.get("/api/transactions", (req, res, next) => {
    const sql = "select * from transactions ORDER BY timestamp DESC"
    const params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        // Parse items from JSON string to object
        const transactions = rows.map(row => ({
            ...row,
            items: JSON.parse(row.items),
            isEmployeeMeal: row.isEmployeeMeal === 1, // Convert integer back to boolean
            timestamp: new Date(row.timestamp) // Convert ISO string back to Date object
        }));
        res.json({
            "message":"success",
            "data":transactions
        })
      });
});

// Get a single transaction by id
app.get("/api/transactions/:id", (req, res, next) => {
    const sql = "select * from transactions where id = ?"
    const params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        const transaction = {
            ...row,
            items: JSON.parse(row.items),
            isEmployeeMeal: row.isEmployeeMeal === 1,
            timestamp: new Date(row.timestamp)
        };
        res.json({
            "message":"success",
            "data":transaction
        })
      });
});


// Create a new transaction
app.post("/api/transactions/", (req, res, next) => {
    const errors=[]
    if (!req.body.items){
        errors.push("No items specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    const data = {
        id: `TXN${Date.now()}`,
        timestamp: new Date().toISOString(),
        items: JSON.stringify(req.body.items),
        total: req.body.total,
        ppn: req.body.ppn,
        isEmployeeMeal: req.body.isEmployeeMeal ? 1 : 0
    };
    const sql ='INSERT INTO transactions (id, timestamp, items, total, ppn, isEmployeeMeal) VALUES (?,?,?,?,?,?)'
    const params =[data.id, data.timestamp, data.items, data.total, data.ppn, data.isEmployeeMeal]
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

// Delete a transaction
app.delete("/api/transactions/:id", (req, res, next) => {
    db.run(
        'DELETE FROM transactions WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({"message":"deleted", changes: this.changes})
    });
});

// Delete all transactions
app.delete("/api/transactions", (req, res, next) => {
    db.run(
        'DELETE FROM transactions',
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({"message":"all deleted", changes: this.changes})
    });
});


// Default response for any other request
app.use(function(req, res){
    res.status(404);
});
