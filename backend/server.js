const express = require('express');
const cors = require('cors');
const db = require('./database.js'); // db is now the promisePool

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// API Endpoints

// --- Menu Items Endpoints ---

// Get all menu items
app.get("/api/menu-items", async (req, res, next) => {
    try {
        const sql = "select * from menu_items";
        const [rows] = await db.query(sql);
        res.json({
            "message": "success",
            "data": rows
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Add a new menu item
app.post("/api/menu-items", async (req, res, next) => {
    try {
        const { id, name, price, stock, category, image_url } = req.body;
        const sql = 'INSERT INTO menu_items (id, name, price, stock, category, image_url) VALUES (?,?,?,?,?,?)';
        const params = [id, name, price, stock, category, image_url];
        const [result] = await db.query(sql, params);
        res.json({
            "message": "success",
            "data": req.body,
            "id": result.insertId
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Update a menu item
app.put("/api/menu-items/:id", async (req, res, next) => {
    try {
        const { name, price, stock, category, image_url } = req.body;
        const sql = `UPDATE menu_items set 
           name = COALESCE(?,name), 
           price = COALESCE(?,price), 
           stock = COALESCE(?,stock), 
           category = COALESCE(?,category), 
           image_url = COALESCE(?,image_url) 
           WHERE id = ?`;
        const params = [name, price, stock, category, image_url, req.params.id];
        const [result] = await db.query(sql, params);
        res.json({ message: "success", data: req.body, changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Delete a menu item
app.delete("/api/menu-items/:id", async (req, res, next) => {
    try {
        const sql = 'DELETE FROM menu_items WHERE id = ?';
        const [result] = await db.query(sql, [req.params.id]);
        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// --- Settings Endpoints ---

// Get PPN setting
app.get('/api/settings/ppn', async (req, res) => {
    try {
        const sql = "SELECT value FROM settings WHERE `key` = ?";
        const [rows] = await db.query(sql, ['ppn']);
        if (rows.length > 0) {
            res.json({
                "message": "success",
                "data": parseFloat(rows[0].value)
            });
        } else {
            res.json({
                "message": "success",
                "data": 0.11 // Default value
            });
        }
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Update PPN setting
app.put('/api/settings/ppn', async (req, res) => {
    try {
        const { value } = req.body;
        if (value === undefined) {
            return res.status(400).json({ "error": "Value is required" });
        }

        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['ppn']);

        if (rows.length > 0) {
            // Update existing setting
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [value.toString(), 'ppn']);
        } else {
            // Insert new setting
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['ppn', value.toString()]);
        }
        
        res.json({ message: "success", data: { key: 'ppn', value } });

    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});


// --- Transaction Endpoints ---

// Get all transactions
app.get("/api/transactions", async (req, res, next) => {
    try {
        const sql = "select * from transactions ORDER BY timestamp DESC";
        const [rows] = await db.query(sql);
        // The mysql2 driver with JSON column support will autoparse the string
        const transactions = rows.map(row => ({
            ...row,
            isEmployeeMeal: row.isEmployeeMeal === 1,
        }));
        res.json({
            "message": "success",
            "data": transactions
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get a single transaction by id
app.get("/api/transactions/:id", async (req, res, next) => {
    try {
        const sql = "select * from transactions where id = ?";
        const params = [req.params.id];
        const [rows] = await db.query(sql, params);
        if (rows.length > 0) {
            const transaction = {
                ...rows[0],
                isEmployeeMeal: rows[0].isEmployeeMeal === 1,
            };
            res.json({
                "message": "success",
                "data": transaction
            });
        } else {
            res.status(404).json({ "error": "Transaction not found" });
        }
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});


// Create a new transaction
app.post("/api/transactions/", async (req, res, next) => {
    try {
        const errors = [];
        if (!req.body.items) {
            errors.push("No items specified");
        }
        if (errors.length) {
            res.status(400).json({ "error": errors.join(",") });
            return;
        }
        if (errors.length) {
            res.status(400).json({"error":errors.join(",")});
            return;
        }

        // --- STOCK VALIDATION BEFORE TRANSACTION ---
        for (const cartItem of req.body.items) {
            const [rows] = await db.query('SELECT stock FROM menu_items WHERE id = ?', [cartItem.id]);
            if (rows.length === 0) {
                return res.status(400).json({ "error": `Item with ID ${cartItem.id} not found.` });
            }
            const currentStock = rows[0].stock;
            if (cartItem.quantity > currentStock) {
                return res.status(400).json({ "error": `Insufficient stock for item ${cartItem.id}. Available: ${currentStock}, Requested: ${cartItem.quantity}` });
            }
        }
        // --- END STOCK VALIDATION ---

        // Define data and sql BEFORE params
        const data = {
            id: `TXN${Date.now()}`,
            timestamp: new Date(),
            items: JSON.stringify(req.body.items),
            total: req.body.total,
            ppn: req.body.ppn,
            isEmployeeMeal: req.body.isEmployeeMeal ? 1 : 0
        };
        const sql = 'INSERT INTO transactions (id, timestamp, items, total, ppn, isEmployeeMeal) VALUES (?,?,?,?,?,?)';

        const params = [data.id, data.timestamp, data.items, data.total, data.ppn, data.isEmployeeMeal];
        const [result] = await db.query(sql, params);

        // --- STOCK REDUCTION LOGIC --- 
        for (const item of req.body.items) { 
            const updateStockSql = 'UPDATE menu_items SET stock = stock - ? WHERE id = ?';
            await db.query(updateStockSql, [item.quantity, item.id]);
        }

        res.json({
            "message": "success",
            "data": req.body,
            "id": result.insertId
        });
    } catch (err) {
        res.status(400).json({ "error": err.message, "stack": err.stack });
    }
});

// Delete a transaction
app.delete("/api/transactions/:id", async (req, res, next) => {
    try {
        const sql = 'DELETE FROM transactions WHERE id = ?';
        const [result] = await db.query(sql, [req.params.id]);
        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Delete all transactions
app.delete("/api/transactions", async (req, res, next) => {
    try {
        const sql = 'DELETE FROM transactions';
        const [result] = await db.query(sql);
        res.json({ "message": "all deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});


// --- Expense Endpoints ---

// Get all expenses
app.get("/api/expenses", async (req, res, next) => {
    try {
        const sql = "SELECT * FROM expenses ORDER BY date DESC";
        const [rows] = await db.query(sql);
        res.json({
            "message": "success",
            "data": rows
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Add a new expense
app.post("/api/expenses", async (req, res, next) => {
    try {
        const { name, amount, category, date } = req.body;
        if (!name || !amount || !date) {
            return res.status(400).json({ "error": "Missing required fields: name, amount, date" });
        }
        const sql = 'INSERT INTO expenses (name, amount, category, date) VALUES (?,?,?,?)';
        const params = [name, amount, category, new Date(date)];
        const [result] = await db.query(sql, params);
        res.json({
            "message": "success",
            "data": { id: result.insertId, ...req.body },
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Delete an expense
app.delete("/api/expenses/:id", async (req, res, next) => {
    try {
        const sql = 'DELETE FROM expenses WHERE id = ?';
        const [result] = await db.query(sql, [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Expense not found" });
        }
        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Delete all expenses
app.delete("/api/expenses", async (req, res, next) => {
    try {
        const sql = 'TRUNCATE TABLE expenses';
        await db.query(sql);
        res.json({ "message": "all deleted" });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});


// Default response for any other request
app.use(function(req, res) {
    res.status(404).send();
});
