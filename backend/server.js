const express = require('express');
const cors = require('cors');
const db = require('./database.js'); // db is now the promisePool
const bcrypt = require('bcryptjs'); // Import bcryptjs
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/'); // Files will be stored in public/uploads/
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Fallback for development

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.status(401).json({ error: "Authentication token required" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(401).json({ error: "Invalid or expired token" });
        req.user = user; // Attach user payload to request (userId, username, role)
        next();
    });
};

// Auth Middleware for Role-Based Access Control
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }
        next();
    };
};

// API Endpoints

// --- Menu Items Endpoints ---

// Get all menu items
app.get("/api/menu-items", authenticateToken, authorizeRoles('user', 'admin', 'guest'), async (req, res, next) => {
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
app.post("/api/menu-items", authenticateToken, authorizeRoles('user', 'admin'), upload.single('image'), async (req, res, next) => {
    try {
        const { id, name, price, stock, category } = req.body;
        // Image URL is now derived from the uploaded file
        const image_url = req.file ? `/public/uploads/${req.file.filename}` : null;

        const sql = 'INSERT INTO menu_items (id, name, price, stock, category, image_url) VALUES (?,?,?,?,?,?)';
        const params = [id, name, price, stock, category, image_url];
        const [result] = await db.query(sql, params);
        res.json({
            "message": "success",
            "data": { ...req.body, image_url },
            "id": result.insertId
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Update a menu item
app.put("/api/menu-items/:id", authenticateToken, authorizeRoles('user', 'admin'), upload.single('image'), async (req, res, next) => {
    try {
        const { name, price, stock, category } = req.body;
        const image_url = req.file ? `/public/uploads/${req.file.filename}` : null;

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
app.delete("/api/menu-items/:id", authenticateToken, authorizeRoles('user', 'admin'), async (req, res, next) => {
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
app.get('/api/settings/ppn', authenticateToken, authorizeRoles('user', 'admin', 'guest'), async (req, res) => {
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
app.put('/api/settings/ppn', authenticateToken, authorizeRoles('admin'), async (req, res) => {
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
app.get("/api/transactions", authenticateToken, authorizeRoles('user', 'admin', 'guest'), async (req, res, next) => {
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
app.get("/api/transactions/:id", authenticateToken, authorizeRoles('user', 'admin', 'guest'), async (req, res, next) => {
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
app.post("/api/transactions/", authenticateToken, authorizeRoles('user', 'admin'), async (req, res, next) => {
    try {
        const errors = [];
        if (!req.body.items) {
            errors.push("No items specified");
        }
        if (errors.length) {
            res.status(400).json({ "error": errors.join(",") });
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
        // --- END STOCK VALIDATION --

        // --- Generate New Transaction ID ---
        let newTransactionId;
        const [lastTransaction] = await db.query("SELECT id FROM transactions WHERE id LIKE 'TRZ%' ORDER BY id DESC LIMIT 1");

        if (lastTransaction && lastTransaction.length > 0) {
            const lastId = lastTransaction[0].id;
            const lastNumber = parseInt(lastId.substring(3), 10);
            if (!isNaN(lastNumber)) {
                const newNumber = lastNumber + 1;
                newTransactionId = 'TRZ' + newNumber.toString().padStart(3, '0');
            } else {
                // This should not happen if the query is correct, but as a fallback
                newTransactionId = 'TRZ001';
            }
        } else {
            newTransactionId = 'TRZ001';
        }
        // --- End Generate New Transaction ID ---

        // Define data and sql BEFORE params
        const data = {
            id: newTransactionId,
            timestamp: new Date(),
            items: JSON.stringify(req.body.items),
            total: req.body.total,
            ppn: req.body.ppn,
            isEmployeeMeal: req.body.isEmployeeMeal ? 1 : 0,
            payment_method: req.body.payment_method || 'Tunai'
        };
        const sql = 'INSERT INTO transactions (id, timestamp, items, total, ppn, isEmployeeMeal, payment_method) VALUES (?,?,?,?,?,?,?)';

        const params = [data.id, data.timestamp, data.items, data.total, data.ppn, data.isEmployeeMeal, data.payment_method];
        const [result] = await db.query(sql, params);

        // --- STOCK REDUCTION LOGIC --- 
        for (const item of req.body.items) { 
            const updateStockSql = 'UPDATE menu_items SET stock = stock - ? WHERE id = ?';
            await db.query(updateStockSql, [item.quantity, item.id]);
        }

        res.json({
            "message": "success",
            "data": req.body,
            "id": data.id // Return the new custom ID
        });
    } catch (err) {
        res.status(400).json({ "error": err.message, "stack": err.stack });
    }
});

// Delete a transaction
app.delete("/api/transactions/:id", authenticateToken, authorizeRoles('user', 'admin'), async (req, res, next) => {
    try {
        const sql = 'DELETE FROM transactions WHERE id = ?';
        const [result] = await db.query(sql, [req.params.id]);
        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Delete all transactions
app.delete("/api/transactions", authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
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
app.get("/api/expenses", authenticateToken, authorizeRoles('user', 'admin', 'guest'), async (req, res, next) => {
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
app.post("/api/expenses", authenticateToken, authorizeRoles('user', 'admin'), async (req, res, next) => {
    try {
        const { name, amount, category, date, notes } = req.body;
        if (!name || !amount || !date) {
            return res.status(400).json({ "error": "Missing required fields: name, amount, date" });
        }
        const sql = 'INSERT INTO expenses (name, amount, category, date, notes) VALUES (?,?,?,?,?)';
        const params = [name, amount, category, date, notes];
        const [result] = await db.query(sql, params);
        res.json({
            "message": "success",
            "data": { id: result.insertId, ...req.body },
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Update an expense
app.put("/api/expenses/:id", authenticateToken, authorizeRoles('user', 'admin'), async (req, res, next) => {
    try {
        const { name, amount, category, date, notes } = req.body;
        const sql = `UPDATE expenses set 
           name = COALESCE(?, name), 
           amount = COALESCE(?, amount), 
           category = COALESCE(?, category), 
           date = COALESCE(?, date), 
           notes = COALESCE(?, notes) 
           WHERE id = ?`;
        const params = [name, amount, category, date ? new Date(date) : null, notes, req.params.id];
        const [result] = await db.query(sql, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Expense not found" });
        }
        
        res.json({
            "message": "success",
            "data": req.body,
            "changes": result.affectedRows
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Delete an expense
app.delete("/api/expenses/:id", authenticateToken, authorizeRoles('user', 'admin'), async (req, res, next) => {
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
app.delete("/api/expenses", authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const sql = 'TRUNCATE TABLE expenses';
        await db.query(sql);
        res.json({ "message": "all deleted" });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});


// --- Notes Endpoints ---

// Get all notes for the logged-in user
app.get("/api/notes", authenticateToken, async (req, res) => {
    try {
        const sql = "SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC";
        const [rows] = await db.query(sql, [req.user.userId]);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new note
app.post("/api/notes", authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }
        const sql = 'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [req.user.userId, title, content]);
        res.status(201).json({ 
            message: "Note created successfully", 
            data: { id: result.insertId, title, content, user_id: req.user.userId }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a note
app.put("/api/notes/:id", authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        const { id } = req.params;

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        const sql = 'UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?';
        const [result] = await db.query(sql, [title, content, id, req.user.userId]);

        if (result.affectedRows > 0) {
            res.json({ message: "Note updated successfully" });
        } else {
            res.status(404).json({ error: "Note not found or user not authorized" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a note
app.delete("/api/notes/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM notes WHERE id = ? AND user_id = ?';
        const [result] = await db.query(sql, [id, req.user.userId]);

        if (result.affectedRows > 0) {
            res.json({ message: "Note deleted successfully" });
        } else {
            res.status(404).json({ error: "Note not found or user not authorized" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Order Endpoints ---

// Create a new pending order (public)
app.post("/api/orders", async (req, res) => {
    try {
        const { customer_name, customer_address, items, total } = req.body;
        if (!customer_name || !items || !total) {
            return res.status(400).json({ error: "Missing required fields: customer_name, items, total" });
        }

        const sql = 'INSERT INTO orders (customer_name, customer_address, items, total, status) VALUES (?, ?, ?, ?, ?)';
        const params = [customer_name, customer_address, JSON.stringify(items), total, 'pending'];
        const [result] = await db.query(sql, params);

        res.status(201).json({ 
            message: "Order created successfully and is pending verification.", 
            data: { id: result.insertId, ...req.body, status: 'pending' }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Get all orders (admin only)
app.get("/api/orders", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const sql = "SELECT * FROM orders ORDER BY created_at DESC";
        const [rows] = await db.query(sql);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an order's status (admin only)
app.put("/api/orders/:id/status", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status provided. Must be 'accepted' or 'rejected'." });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Handle 'rejected' status: just update and finish
        if (status === 'rejected') {
            const updateSql = 'UPDATE orders SET status = ? WHERE id = ?';
            await connection.query(updateSql, ['rejected', id]);
            await connection.commit();
            return res.json({ message: `Order ${id} has been rejected.` });
        }

        // Handle 'accepted' status: the complex transaction
        if (status === 'accepted') {
            // 1. Get the order and lock the row to prevent concurrent modifications
            const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ? AND status = \'pending\' FOR UPDATE', [id]);
            if (orderRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: "Order not found or not in pending state." });
            }
            const order = orderRows[0];
            const items = JSON.parse(order.items); // Items are stored as JSON string in the DB

            // 2. Stock Validation
            for (const item of items) {
                const [menuItemRows] = await connection.query('SELECT name, stock FROM menu_items WHERE id = ?', [item.id]);
                if (menuItemRows.length === 0) {
                    await connection.rollback();
                    return res.status(400).json({ error: `Menu item with ID ${item.id} not found.` });
                }
                if (menuItemRows[0].stock < item.quantity) {
                    await connection.rollback();
                    return res.status(400).json({ error: `Insufficient stock for ${menuItemRows[0].name}. Available: ${menuItemRows[0].stock}, Requested: ${item.quantity}` });
                }
            }

            // 3. Stock Reduction
            for (const item of items) {
                await connection.query('UPDATE menu_items SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
            }

            // 4. Create a new record in the transactions table
            const [ppnSetting] = await connection.query("SELECT value FROM settings WHERE `key` = 'ppn'");
            const ppnRate = ppnSetting.length > 0 ? parseFloat(ppnSetting[0].value) : 0.11;
            const totalWithPpn = order.total * (1 + ppnRate);
            const ppnAmount = order.total * ppnRate;

            let newTransactionId;
            const [lastTransaction] = await connection.query("SELECT id FROM transactions WHERE id LIKE 'TRZ%' ORDER BY id DESC LIMIT 1");
            if (lastTransaction && lastTransaction.length > 0) {
                const lastId = lastTransaction[0].id;
                const lastNumber = parseInt(lastId.substring(3), 10);
                newTransactionId = 'TRZ' + (lastNumber + 1).toString().padStart(3, '0');
            } else {
                newTransactionId = 'TRZ001';
            }

            const transactionData = {
                id: newTransactionId,
                timestamp: new Date(),
                items: JSON.stringify(items),
                total: totalWithPpn, // Assuming order.total does not include PPN
                ppn: ppnAmount,
                isEmployeeMeal: 0,
                payment_method: 'Tunai' // Default or could be added to order
            };
            await connection.query('INSERT INTO transactions (id, timestamp, items, total, ppn, isEmployeeMeal, payment_method) VALUES (?,?,?,?,?,?,?)', Object.values(transactionData));

            // 5. Update the order status to 'accepted'
            await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['accepted', id]);

            // 6. Commit the transaction
            await connection.commit();
            res.json({ message: `Order ${id} has been accepted and transaction ${newTransactionId} created.` });
        }
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: "Transaction failed: " + err.message, stack: err.stack });
    } finally {
        connection.release();
    }
});


// --- Auth Endpoints ---

// Register User
app.post("/api/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash password
        const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [username, hashedPassword, 'user']);

        res.status(201).json({ message: "User registered successfully", userId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') { // MySQL error code for duplicate entry
            return res.status(409).json({ error: "Username already exists" });
        }
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Login User
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const sql = 'SELECT id, username, password, role FROM users WHERE username = ?';
        const [rows] = await db.query(sql, [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: "Login successful", token });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});


// --- Settings Endpoints ---

// Get public settings
app.get("/api/settings", async (req, res) => {
    try {
        const publicSettingsKeys = ['website_title', 'header_title', 'favicon_url', 'registration_enabled', 'web_description', 'cover_image_url'];
        const sql = "SELECT `key`, `value` FROM settings WHERE `key` IN (?)";
        const [rows] = await db.query(sql, [publicSettingsKeys]);
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json({ message: "success", data: settings });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Get all settings (protected)
app.get("/api/all-settings", authenticateToken, authorizeRoles('user', 'admin', 'guest'), async (req, res) => {
    try {
        const sql = "SELECT `key`, `value` FROM settings";
        const [rows] = await db.query(sql);
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json({ message: "success", data: settings });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update multiple settings
app.post("/api/settings", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const settings = req.body;
        if (typeof settings !== 'object' || settings === null || Object.keys(settings).length === 0) {
            return res.status(400).json({ error: "Invalid request body: expected a non-empty object of settings." });
        }

        const promises = Object.entries(settings).map(([key, value]) => {
            const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
            return db.query(sql, [key, value !== null ? value.toString() : null]);
        });

        await Promise.all(promises);

        res.json({ message: "Settings updated successfully", data: settings });

    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update website title
app.put("/api/settings/title", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['website_title']);

        if (rows.length > 0) {
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [title, 'website_title']);
        } else {
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['website_title', title]);
        }
                res.json({ message: "Website title updated successfully", data: { title } });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update header title
app.put("/api/settings/header-title", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: "Judul header diperlukan" });
        }

        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['header_title']);

        if (rows.length > 0) {
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [title, 'header_title']);
        } else {
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['header_title', title]);
        }
        res.json({ message: "Judul header berhasil diperbarui", data: { title } });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Enable/disable registration
app.put("/api/settings/registration", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: "'enabled' must be a boolean" });
        }

        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['registration_enabled']);

        if (rows.length > 0) {
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [enabled.toString(), 'registration_enabled']);
        } else {
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['registration_enabled', enabled.toString()]);
        }
        res.json({ message: "Registration setting updated successfully", data: { enabled } });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update web description
app.put('/api/settings/description', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ message: 'Description is required.' });
        }
        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['web_description']);

        if (rows.length > 0) {
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [description, 'web_description']);
        } else {
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['web_description', description]);
        }
        res.json({ message: 'Web description updated successfully!', data: { web_description: description } });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Upload favicon
app.post('/api/settings/favicon/', authenticateToken, authorizeRoles('admin'), upload.single('favicon'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No favicon file uploaded.' });
        }
        const faviconUrl = `/public/uploads/${req.file.filename}`;
        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['favicon_url']);

        if (rows.length > 0) {
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [faviconUrl, 'favicon_url']);
        } else {
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['favicon_url', faviconUrl]);
        }
        res.json({ message: 'Favicon updated successfully!', data: { favicon_url: faviconUrl } });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Upload cover image
app.post('/api/settings/cover-image/', authenticateToken, authorizeRoles('admin'), upload.single('coverImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No cover image file uploaded.' });
        }
        const coverImageUrl = `/public/uploads/${req.file.filename}`;
        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['cover_image_url']);

        if (rows.length > 0) {
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [coverImageUrl, 'cover_image_url']);
        } else {
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['cover_image_url', coverImageUrl]);
        }
        res.json({ message: 'Cover image updated successfully!', data: { cover_image_url: coverImageUrl } });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// --- Admin User Management Endpoints ---

// Create Admin User
app.post("/api/admin/users", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [username, hashedPassword, 'admin']);

        res.status(201).json({ message: "Admin user created successfully", userId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Username already exists" });
        }
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Get all users (Admin only)
app.get("/api/admin/users", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const sql = 'SELECT id, username, role FROM users';
        const [rows] = await db.query(sql);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update user role (Admin only)
app.put("/api/admin/users/:id/role", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { newRole } = req.body;
        const { id } = req.params;

        if (!newRole || (newRole !== 'admin' && newRole !== 'user' && newRole !== 'guest')) {
            return res.status(400).json({ error: "Invalid role specified. Must be 'admin', 'user', or 'guest'." });
        }

        // Prevent changing own role (optional, but good practice)
        if (req.user.userId == id && newRole !== req.user.role) {
            return res.status(403).json({ error: "Forbidden: Cannot change your own role." });
        }

        const sql = 'UPDATE users SET role = ? WHERE id = ?';
        const [result] = await db.query(sql, [newRole, id]);

        if (result.affectedRows > 0) {
            res.json({ message: "User role updated successfully" });
        } else {
            res.status(404).json({ error: "User not found or role not changed" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// --- Data Management Endpoints (Admin Only) ---

// Delete all transactions, expenses, and reset menu item stock
app.delete("/api/admin/data/all", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { masterPassword } = req.body;
        if (!masterPassword) {
            return res.status(400).json({ error: "Master password is required" });
        }

        const [masterPassRow] = await db.query('SELECT value FROM settings WHERE `key` = ?', ['master_password']);
        const storedMasterPassword = masterPassRow.length > 0 ? masterPassRow[0].value : null;

        if (!storedMasterPassword || !(await bcrypt.compare(masterPassword, storedMasterPassword))) {
            return res.status(401).json({ error: "Kata sandi master salah" });
        }

        await db.query('TRUNCATE TABLE transactions');
        await db.query('TRUNCATE TABLE expenses');
        await db.query('UPDATE menu_items SET stock = 0'); // Reset stock

        res.json({ message: "All transactions, expenses, and menu item stock have been cleared." });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update master password
app.put("/api/settings/master-password", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { currentMasterPassword, newMasterPassword } = req.body;
        if (!currentMasterPassword || !newMasterPassword) {
            return res.status(400).json({ error: "Current and new master passwords are required" });
        }

        const [masterPassRow] = await db.query('SELECT value FROM settings WHERE `key` = ?', ['master_password']);
        const storedMasterPassword = masterPassRow.length > 0 ? masterPassRow[0].value : null;

        if (storedMasterPassword && !(await bcrypt.compare(currentMasterPassword, storedMasterPassword))) {
            return res.status(401).json({ error: "Invalid current master password" });
        }

        const hashedNewMasterPassword = await bcrypt.hash(newMasterPassword, 10);

        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['master_password']);

        if (rows.length > 0) {
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [hashedNewMasterPassword, 'master_password']);
        } else {
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['master_password', hashedNewMasterPassword]);
        }

        res.json({ message: "Master password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Delete a user (Admin only)
app.delete("/api/admin/users/:id", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting their own account
        if (req.user.userId == id) {
            return res.status(403).json({ error: "Forbidden: Cannot delete your own account." });
        }

        const sql = 'DELETE FROM users WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows > 0) {
            res.json({ message: "User deleted successfully" });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});


// --- User Profile Endpoints ---

// Get User Profile
app.get("/api/user/profile", authenticateToken, authorizeRoles('user', 'admin'), async (req, res) => {
    try {
        const sql = 'SELECT id, username FROM users WHERE id = ?';
        const [rows] = await db.query(sql, [req.user.userId]);
        if (rows.length > 0) {
            res.json({ message: "success", data: rows[0] });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update Username
app.put("/api/user/profile/username", authenticateToken, authorizeRoles('user', 'admin'), async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        // Check if new username already exists
        const checkSql = 'SELECT id FROM users WHERE username = ? AND id != ?';
        const [existingUser] = await db.query(checkSql, [username, req.user.userId]);
        if (existingUser.length > 0) {
            return res.status(409).json({ error: "Username already taken" });
        }

        const sql = 'UPDATE users SET username = ? WHERE id = ?';
        const [result] = await db.query(sql, [username, req.user.userId]);

        if (result.affectedRows > 0) {
            res.json({ message: "Username updated successfully" });
        } else {
            res.status(404).json({ error: "User not found or username not changed" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Change Password
app.put("/api/user/profile/password", authenticateToken, authorizeRoles('user', 'admin'), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }

        const sql = 'SELECT password FROM users WHERE id = ?';
        const [rows] = await db.query(sql, [req.user.userId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid current password" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
        const [result] = await db.query(updateSql, [hashedNewPassword, req.user.userId]);

        if (result.affectedRows > 0) {
            res.json({ message: "Password updated successfully" });
        } else {
            res.status(500).json({ error: "Failed to update password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Logout (client-side token removal is primary, this is for completeness)
app.post("/api/logout", authenticateToken, (req, res) => {
    // On the server-side, if using JWTs, there's no session to destroy.
    // The client simply discards the token.
    // This endpoint can be used for logging purposes or if a blacklist mechanism is implemented.
    res.json({ message: "Logged out successfully" });
});


// Public API to get all menu items for guest users (no authentication required)
app.get("/api/guest/menu-items", async (req, res) => {
    try {
        const sql = "SELECT id, name, price, stock, category, image_url FROM menu_items";
        const [rows] = await db.query(sql);
        res.json({
            "message": "success",
            "data": rows
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Default response for any other request
app.use(function(req, res) {
    res.status(404).send();
});
