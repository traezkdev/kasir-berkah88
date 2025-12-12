const express = require('express');
const cors = require('cors');
const db = require('./database.js'); // db is now the promisePool
const bcrypt = require('bcryptjs'); // Import bcryptjs
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    addRawMaterial,
    getRawMaterials,
    getRawMaterialById,
    updateRawMaterial,
    deleteRawMaterial,
    getStockHistory,
    deleteStockHistoryEntry,
    getLowStockRawMaterials,
    getLowStockRawMaterialsCount,
    addMenuRecipe,
    getMenuRecipes,
    deleteMenuRecipe,
} = require('./rawMaterialsDb');

const app = express();
app.use(cors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(express.json());
// Error handling for JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

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

    if (token == null) {
        console.log('Authentication token missing');
        return res.status(401).json({ error: "Authentication token required" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Invalid or expired token:', err.message);
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        req.user = {
            userId: user.userId,
            username: user.username,
            role: user.role.trim() // Trim whitespace from the role
        };
        next();
    });
};

// Auth Middleware for Role-Based Access Control
const authorizeRoles = (...roles) => {
    return (req, res, next) => {

        if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
            console.log('Forbidden: Insufficient permissions for user:', req.user ? req.user.username : 'N/A');
            return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }

        next();
    };
};

const authorizeAccountAccess = (accountType) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if (accountType === 'lapak' && (userRole === 'admin' || userRole === 'user' || userRole === 'kasir')) {
            next();
        } else if (accountType === 'owner' && (userRole === 'admin' || userRole === 'owner')) {
            next();
        } else {
            return res.status(403).json({ error: "Forbidden: Insufficient permissions for this account type" });
        }
    };
};

// API Endpoints

// --- Raw Materials Endpoints ---

// Get all raw materials
app.get("/api/raw-materials", authenticateToken, authorizeRoles('admin', 'owner', 'user', 'kasir'), async (req, res) => {
    try {
        const rawMaterials = await getRawMaterials();
        res.json({ message: "success", data: rawMaterials });
    } catch (err) {
        console.error("Error fetching raw materials:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Add a new raw material
app.post("/api/raw-materials", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, purchase_buffer_amount, menu_stock } = req.body;
        if (!name || !unit) { // custom_unit can be optional for now, assuming a default will be set
            return res.status(400).json({ error: "Name and unit are required" });
        }

        // Gunakan fungsi addRawMaterial dari rawMaterialsDb
        const result = await addRawMaterial(
            name,
            unit,
            custom_unit || 'pcs',
            parseFloat(stok_minimum) || 0,
            parseFloat(price_per_item) || 0,
            parseFloat(standard_stock_per_day) || 0,
            parseFloat(purchase_buffer_amount) || 0, // Correct position for purchase_buffer_amount
            parseFloat(menu_stock) || 0
        );

        // Asumsi result mengandung insertId jika berhasil
        res.status(201).json({
            message: "Raw material added successfully",
            data: { id: result.insertId, name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, suggestion_purchase_quantity, menu_stock },
        });

    } catch (err) {
        console.error("Error adding new raw material:", err);
        if (err.message && err.message.includes('ER_DUP_ENTRY')) { // Cek pesan error dari fungsi db
            return res.status(409).json({ error: "Raw material with this name already exists" });
        }
        res.status(500).json({ error: err.message || "Terjadi kesalahan server saat menambahkan bahan mentah baru." });
    }
});


// Update a raw material
app.put("/api/raw-materials/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, suggestion_purchase_quantity, current_stock, menu_stock, purchase_buffer_amount } = req.body;

        const result = await updateRawMaterial(
            id,
            name,
            unit,
            custom_unit || 'pcs',
            parseFloat(stok_minimum) || 0,
            parseFloat(price_per_item) || 0,
            parseFloat(standard_stock_per_day) || 0,
            parseFloat(purchase_buffer_amount) || 0, // Correct position for purchase_buffer_amount
            parseFloat(current_stock),
            parseFloat(menu_stock) || 0
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Raw material not found" });
        }
        res.json({ message: "success", data: { id, name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, suggestion_purchase_quantity, current_stock, menu_stock } });
    } catch (err) {
        if (err.message && err.message.includes('ER_DUP_ENTRY')) {
            return res.status(409).json({ error: "Raw material with this name already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete a raw material
app.delete("/api/raw-materials/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        // Gunakan fungsi deleteRawMaterial dari rawMaterialsDb
        const result = await deleteRawMaterial(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Raw material not found" });
        }
        res.json({ message: "Raw material and its history deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get raw material stock history with filtering
app.get("/api/raw-materials/history", authenticateToken, authorizeRoles('admin', 'owner', 'user'), async (req, res) => {
    try {
        const filters = req.query; // material_id, type, startDate, endDate
        const history = await getStockHistory(filters);
        res.json({ message: "success", data: history });
    } catch (err) {
        console.error("Error fetching stock history:", err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a raw material stock history entry
app.delete("/api/raw-materials/history/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteStockHistoryEntry(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Stock history entry not found" });
        }
        res.json({ message: "Stock history entry deleted successfully" });
    } catch (err) {
        console.error("Error deleting stock history entry:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- Stock Alert Endpoints ---
app.get("/api/stock-alerts", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const lowStockMaterials = await getLowStockRawMaterials();
        res.json({ message: "success", data: lowStockMaterials });
    } catch (err) {
        console.error("Error fetching low stock materials:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

app.get("/api/stock-alerts/count", authenticateToken, authorizeRoles('admin', 'owner', 'user', 'kasir'), async (req, res) => {
    try {
        const count = await getLowStockRawMaterialsCount();
        res.json({ message: "success", data: count });
    } catch (err) {
        console.error("Error fetching low stock materials count:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// --- Menu Recipes Endpoints ---
app.get("/api/menu-recipes/:menu_item_id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { menu_item_id } = req.params;
        const recipes = await getMenuRecipes(menu_item_id);
        res.json({ message: "success", data: recipes });
    } catch (err) {
        console.error("Error fetching menu recipes:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

app.post("/api/menu-recipes", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { menu_item_id, raw_material_id, quantity } = req.body;
        if (!menu_item_id || !raw_material_id || !quantity) {
            return res.status(400).json({ error: "menu_item_id, raw_material_id, and quantity are required" });
        }
        const result = await addMenuRecipe(menu_item_id, raw_material_id, quantity);
        res.status(201).json({
            message: "Menu recipe added successfully",
            data: { id: result.insertId, menu_item_id, raw_material_id, quantity },
        });
    } catch (err) {
        console.error("Error adding menu recipe:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/menu-recipes/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteMenuRecipe(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Menu recipe not found" });
        }
        res.json({ message: "Menu recipe deleted successfully" });
    } catch (err) {
        console.error("Error deleting menu recipe:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- Menu Items Endpoints ---

// Get all menu items with pagination and category filtering
app.get("/api/menu-items", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir'), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const category = req.query.category;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let queryParams = [];
        if (category) {
            whereClause = 'WHERE mi.category = ?';
            queryParams.push(category);
        }

        // Query to get total count
        const countSql = `SELECT COUNT(*) as totalItems FROM menu_items mi ${whereClause}`;
        const [countRows] = await db.query(countSql, queryParams);
        const totalItems = countRows[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        // Query to get paginated data with options
        const dataSql = `
            SELECT 
                mi.*,
                COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', mio.id, 
                                'name', mio.name, 
                                'price_adjustment', mio.price_adjustment
                            )
                        )
                        FROM menu_item_options mio 
                        WHERE mio.menu_item_id = mi.id
                    ),
                    '[]'
                ) AS options
            FROM menu_items mi
            ${whereClause}
            ORDER BY mi.order_index ASC 
            LIMIT ? OFFSET ?;
        `;

        const [rows] = await db.query(dataSql, [...queryParams, limit, offset]);

        // Parse the options string for each item
        const data = rows.map(row => ({
            ...row,
            options: JSON.parse(row.options) // COALESCE guarantees a parsable string
        }));

        res.json({
            "message": "success",
            "data": data,
            "pagination": {
                "currentPage": page,
                "totalPages": totalPages,
                "totalItems": totalItems,
                "limit": limit,
                "category": category || null
            }
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get all menu items without pagination
app.get("/api/menu-items/all", authenticateToken, authorizeRoles('user', 'admin', 'kasir', 'owner'), async (req, res) => {
    try {
        const sql = `
            SELECT 
                mi.*,
                COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', mio.id, 
                                'name', mio.name, 
                                'price_adjustment', mio.price_adjustment
                            )
                        )
                        FROM menu_item_options mio 
                        WHERE mio.menu_item_id = mi.id
                    ),
                    '[]'
                ) AS options
            FROM menu_items mi
            ORDER BY mi.order_index ASC;
        `;
        const [rows] = await db.query(sql);

        // Parse the options string for each item
        const data = rows.map(row => ({
            ...row,
            options: JSON.parse(row.options) // No need for ternary, COALESCE guarantees a string
        }));

        res.json({
            "message": "success",
            "data": data
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Add a new menu item
app.post("/api/menu-items", authenticateToken, authorizeRoles('user', 'admin'), upload.single('image'), async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let itemData;
        if (req.file) {
            itemData = JSON.parse(req.body.data);
        } else {
            itemData = req.body;
        }

        const { id, name, price, stock, category, hpp, discount, is_featured, options } = itemData;
        const image_url = req.file ? `/public/uploads/${req.file.filename}` : null;
        const final_is_featured = is_featured ? 1 : 0;

        const menuItemSql = 'INSERT INTO menu_items (id, name, price, stock, category, image_url, hpp, discount, is_featured) VALUES (?,?,?,?,?,?,?,?,?)';
        const menuItemParams = [id, name, price, stock, category, image_url, hpp, discount, final_is_featured];
        await connection.query(menuItemSql, menuItemParams);

        if (options && Array.isArray(options) && options.length > 0) {
            const optionSql = 'INSERT INTO menu_item_options (menu_item_id, name, price_adjustment) VALUES ?';
            const optionValues = options.map(opt => [id, opt.name, opt.price_adjustment || 0]);
            await connection.query(optionSql, [optionValues]);
        }

        await connection.commit();

        res.status(201).json({
            "message": "success",
            "data": { ...itemData, image_url },
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Error adding menu item:", err);
        res.status(400).json({ "error": err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Endpoint untuk memperbarui urutan item menu
app.put('/api/menu-items/reorder', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { itemIds } = req.body; // itemIds adalah array ID dalam urutan baru

    if (!Array.isArray(itemIds)) {
        return res.status(400).json({ message: 'error', error: 'itemIds must be an array' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        for (let i = 0; i < itemIds.length; i++) {
            const id = itemIds[i];
            const order_index = i;
            await connection.query('UPDATE menu_items SET order_index = ? WHERE id = ?', [order_index, id]);
        }

        await connection.commit();
        res.json({ message: 'success', data: { message: 'Menu items reordered successfully' } });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error reordering items:', error);
        res.status(500).json({ message: 'error', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Update a menu item
app.put("/api/menu-items/:id", authenticateToken, authorizeRoles('user', 'admin'), upload.single('image'), async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();
        await connection.beginTransaction();

        let itemData;
        let new_image_url = null;

        // Handle multipart/form-data (with image) vs application/json (no image)
        if (req.file) {
            itemData = JSON.parse(req.body.data);
            new_image_url = `/public/uploads/${req.file.filename}`;
        } else {
            itemData = req.body;
        }

        // Dynamically build the update query
        const updateFields = {};
        const params = [];

        // List of allowed fields to update
        const allowedFields = ['name', 'price', 'stock', 'category', 'hpp', 'discount', 'is_featured'];

        allowedFields.forEach(field => {
            if (itemData[field] !== undefined) {
                // Special handling for boolean
                if (field === 'is_featured') {
                    updateFields[field] = itemData[field] ? 1 : 0;
                } else {
                    updateFields[field] = itemData[field];
                }
            }
        });

        // Handle image update separately
        if (new_image_url) {
            const [currentRows] = await connection.query('SELECT image_url FROM menu_items WHERE id = ?', [id]);
            if (currentRows.length > 0 && currentRows[0].image_url) {
                const oldImagePath = path.join(__dirname, currentRows[0].image_url);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateFields.image_url = new_image_url;
        }

        if (Object.keys(updateFields).length > 0) {
            const setClauses = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
            const queryParams = [...Object.values(updateFields), id];
            const menuItemSql = `UPDATE menu_items SET ${setClauses} WHERE id = ?`;

            const [result] = await connection.query(menuItemSql, queryParams);
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ "error": "Menu item not found" });
            }
        }

        // Handle options update (delete and re-insert)
        if (itemData.options && Array.isArray(itemData.options)) {
            // Delete old options
            await connection.query('DELETE FROM menu_item_options WHERE menu_item_id = ?', [id]);
            // Add new options if they exist
            if (itemData.options.length > 0) {
                const optionSql = 'INSERT INTO menu_item_options (menu_item_id, name, price_adjustment) VALUES ?';
                const optionValues = itemData.options.map(opt => [id, opt.name, opt.price_adjustment || 0]);
                await connection.query(optionSql, [optionValues]);
            }
        }

        await connection.commit();

        res.json({
            "message": "success",
            "data": { id, ...itemData },
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Error updating menu item:", err);
        res.status(400).json({ "error": err.message });
    } finally {
        if (connection) {
            connection.release();
        }
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

// --- Categories Endpoints ---

// Get all categories
app.get("/api/categories", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir'), async (req, res) => {
    try {
        const sql = "SELECT * FROM categories ORDER BY name ASC";
        const [rows] = await db.query(sql);
        res.json({
            "message": "success",
            "data": rows
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Add a new category
app.post("/api/categories", authenticateToken, authorizeRoles('user', 'admin'), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ "error": "Category name is required" });
        }
        const sql = 'INSERT INTO categories (name) VALUES (?)';
        const [result] = await db.query(sql, [name]);
        res.status(201).json({
            "message": "success",
            "data": { id: result.insertId, name },
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Category name already exists" });
        }
        res.status(400).json({ "error": err.message });
    }
});

// Update a category
app.put("/api/categories/:id", authenticateToken, authorizeRoles('user', 'admin'), async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;
        if (!name) {
            return res.status(400).json({ "error": "Category name is required" });
        }
        const sql = 'UPDATE categories SET name = ? WHERE id = ?';
        const [result] = await db.query(sql, [name, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Category not found" });
        }
        res.json({
            "message": "success",
            "data": { id, name },
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Category name already exists" });
        }
        res.status(400).json({ "error": err.message });
    }
});

// Delete a category
app.delete("/api/categories/:id", authenticateToken, authorizeRoles('user', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM categories WHERE id = ?';
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Category not found" });
        }
        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});


// --- Settings Endpoints ---

// Get PPN setting
app.get('/api/settings/ppn', authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir'), async (req, res) => {
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

// Get logo_url setting
app.get('/api/settings/logo', async (req, res) => {
    try {
        const sql = "SELECT value FROM settings WHERE `key` = ?";
        const [rows] = await db.query(sql, ['logo_url']);
        if (rows.length > 0 && rows[0].value) {
            res.json({
                "message": "success",
                "data": { "logo_url": rows[0].value }
            });
        } else {
            // Return a default logo if not set
            res.json({
                "message": "success",
                "data": { "logo_url": null }
            });
        }
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Helper function for timestamp updates to avoid repetition
const updateTimestamp = async (key, res) => {
    try {
        const now = new Date();
        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        await db.query(sql, [key, now.toISOString()]);
        res.json({ message: `Timestamp for ${key} recorded successfully`, timestamp: now.toISOString() });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
};

// Endpoint to mark menu stock data as updated
app.put("/api/sync/timestamp/menu-stock", authenticateToken, authorizeRoles('admin', 'owner', 'user', 'kasir'), (req, res) => {
    updateTimestamp('menu_stock_last_updated', res);
});

// Endpoint to mark raw materials data as updated
app.put("/api/sync/timestamp/raw-materials", authenticateToken, authorizeRoles('admin', 'owner', 'user', 'kasir'), (req, res) => {
    updateTimestamp('raw_materials_last_updated', res);
});

// Endpoint to mark lapak funds data as updated
app.put("/api/sync/timestamp/lapak-funds", authenticateToken, authorizeRoles('admin', 'owner', 'user', 'kasir'), (req, res) => {
    updateTimestamp('lapak_funds_last_updated', res);
});


// Get a specific setting by key
app.get('/api/settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const sql = "SELECT value FROM settings WHERE `key` = ?";
        const [rows] = await db.query(sql, [key]);
        if (rows.length > 0) {
            res.json({
                "message": "success",
                "data": { "key": key, "value": rows[0].value }
            });
        } else {
            res.status(404).json({ "error": `Setting with key '${key}' not found.` });
        }
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Update master password
app.put("/api/settings/master-password", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { currentMasterPassword, newMasterPassword } = req.body;

        if (!newMasterPassword) {
            return res.status(400).json({ error: "Kata sandi master baru diperlukan" });
        }

        const [masterPassRow] = await db.query('SELECT `value` FROM settings WHERE `key` = ?', ['master_password']);
        const storedMasterPassword = masterPassRow.length > 0 ? masterPassRow[0].value : null;

        // If a master password already exists, we must validate the current one
        if (storedMasterPassword) {
            if (!currentMasterPassword) {
                return res.status(400).json({ error: "Kata sandi master saat ini diperlukan untuk mengubahnya" });
            }

            let isPasswordValid = false;
            const isStoredPassHashed = storedMasterPassword.startsWith('$2a$') || storedMasterPassword.startsWith('$2b$') || storedMasterPassword.startsWith('$2y$');

            if (isStoredPassHashed) {
                // Normal case: stored password is a valid hash
                isPasswordValid = await bcrypt.compare(currentMasterPassword, storedMasterPassword);
            } else {
                // Legacy/broken case: stored password is plain text. Heal on successful change.
                isPasswordValid = (currentMasterPassword === storedMasterPassword);
            }

            if (!isPasswordValid) {
                return res.status(400).json({ error: "Kata sandi master saat ini salah" });
            }
        }

        const hashedNewMasterPassword = await bcrypt.hash(newMasterPassword, 10);

        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        await db.query(sql, ['master_password', hashedNewMasterPassword]);

        res.json({ message: "Master password updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

app.put("/api/settings/registration", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {


        const { enabled } = req.body;
        let booleanEnabled;

        if (typeof enabled === 'boolean') {
            booleanEnabled = enabled;
        } else if (typeof enabled === 'string') {
            if (enabled === 'true') {
                booleanEnabled = true;
            } else if (enabled === 'false') {
                booleanEnabled = false;
            }
        } else {
            return res.status(400).json({ error: "'enabled' must be a boolean or string 'true'/'false'" });
        }

        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['registration_enabled']);

        if (rows.length > 0) {
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [booleanEnabled.toString(), 'registration_enabled']);
        } else {
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['registration_enabled', booleanEnabled.toString()]);
        }
        res.json({ message: "Registration setting updated successfully", data: { enabled: booleanEnabled } });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update a specific setting by key
app.put('/api/settings/:key', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        if (value === undefined || value === null || value.toString().trim() === '') {
            return res.status(400).json({ "error": "Value is required" });
        }

        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        const [result] = await db.query(sql, [key, value.toString()]);

        // If initial_capital is updated, also update initial_capital_date
        if (key === 'initial_capital') {
            const now = new Date().toISOString();
            const dateSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
            await db.query(dateSql, ['initial_capital_date', now]);
        }

        res.json({ message: "Setting updated successfully", data: { key, value } });

    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Update logo_url setting
app.post('/api/settings/logo', authenticateToken, authorizeRoles('admin'), upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ "error": "No logo file uploaded." });
        }
        const logoUrl = `/public/uploads/${req.file.filename}`;

        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        await db.query(sql, ['logo_url', logoUrl]);

        res.json({
            message: 'Logo updated successfully!',
            data: { logo_url: logoUrl }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Delete logo_url setting
app.delete('/api/settings/logo', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        // Get current logo URL from settings
        const [rows] = await db.query("SELECT value FROM settings WHERE `key` = ?", ['logo_url']);
        const currentLogoPath = rows.length > 0 ? rows[0].value : null;

        if (currentLogoPath && currentLogoPath.startsWith('/public/uploads/')) {
            const filePath = path.join(__dirname, currentLogoPath);
            // Check if file exists before attempting to delete
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // Delete the file
            }
        }

        // Update database to remove logo_url
        const sql = 'DELETE FROM settings WHERE `key` = ?';
        await db.query(sql, ['logo_url']);

        res.json({ message: 'Logo deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
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

// --- Restaurant Settings Endpoints ---

// Get restaurant settings (public)
app.get('/api/restaurant-settings', async (req, res) => {
    try {
        const sql = "SELECT restaurant_name, restaurant_slogan FROM app_settings ORDER BY id LIMIT 1";
        const [rows] = await db.query(sql);
        if (rows.length > 0) {
            res.json({
                "message": "success",
                "data": rows[0]
            });
        } else {
            // Return default values if no settings found
            res.json({
                "message": "success",
                "data": { restaurant_name: 'Trz Kasir Apps', restaurant_slogan: 'Aplikasi kasir modern cepat dan keren' }
            });
        }
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Update restaurant settings (admin only)
app.put('/api/restaurant-settings', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { restaurant_name, restaurant_slogan } = req.body;
        if (!restaurant_name || !restaurant_slogan) {
            return res.status(400).json({ "error": "Restaurant name and slogan are required." });
        }

        const sql = `UPDATE app_settings SET restaurant_name = ?, restaurant_slogan = ? WHERE id = (SELECT id FROM (SELECT id FROM app_settings ORDER BY id LIMIT 1) as t)`;
        const params = [restaurant_name, restaurant_slogan];
        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            // If no rows were affected, it might mean no settings exist yet. Insert them.
            const insertSql = 'INSERT INTO app_settings (restaurant_name, restaurant_slogan) VALUES (?, ?)';
            await db.query(insertSql, params);
            res.json({ message: "Restaurant settings inserted successfully!", data: { restaurant_name, restaurant_slogan } });
        } else {
            res.json({ message: "Restaurant settings updated successfully!", data: { restaurant_name, restaurant_slogan } });
        }

    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// --- App Settings (Open Graph) Endpoints ---

// Get app settings (public)
app.get('/api/app-settings', async (req, res) => {
    try {
        const sql = "SELECT og_title, og_description, og_image_url FROM app_settings ORDER BY id LIMIT 1";
        const [rows] = await db.query(sql);
        if (rows.length > 0) {
            res.json({
                "message": "success",
                "data": rows[0]
            });
        } else {
            // This case should not happen if the database is seeded correctly
            res.status(404).json({ "error": "App settings not found." });
        }
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Update app settings (admin only)
app.post('/api/app-settings', authenticateToken, authorizeRoles('admin'), upload.single('og_image'), async (req, res) => {
    try {
        const { og_title, og_description } = req.body;
        const og_image_url = req.file ? `/public/uploads/${req.file.filename}` : null;

        let sql;
        let params;

        if (og_image_url) {
            // If a new image is uploaded, update all fields
            sql = `UPDATE app_settings SET og_title = ?, og_description = ?, og_image_url = ? WHERE id = (SELECT id FROM (SELECT id FROM app_settings ORDER BY id LIMIT 1) as t)`;
            params = [og_title, og_description, og_image_url];
        } else {
            // If no new image, only update text fields
            sql = `UPDATE app_settings SET og_title = ?, og_description = ? WHERE id = (SELECT id FROM (SELECT id FROM app_settings ORDER BY id LIMIT 1) as t)`;
            params = [og_title, og_description];
        }

        const [result] = await db.query(sql, params);
        res.json({ message: "App settings updated successfully!", changes: result.affectedRows });

    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});


// --- Transaction Endpoints ---

// Get all transactions with pagination
app.get("/api/transactions", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir'), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const { startDate, endDate, paymentMethod } = req.query; // Extract paymentMethod
        const offset = (page - 1) * limit;

        let whereClauses = ['t.deleted_at IS NULL'];
        let queryParams = [];

        if (startDate) {
            whereClauses.push('t.timestamp >= ?');
            queryParams.push(startDate);
        }
        if (endDate) {
            // Adjust the end date to include the entire day
            whereClauses.push('t.timestamp <= ?');
            queryParams.push(`${endDate} 23:59:59`);
        }

        if (paymentMethod && paymentMethod !== 'all') {
            if (paymentMethod === 'Makan Karyawan') {
                // Handle Employee Meal special case
                whereClauses.push('(t.isEmployeeMeal = 1 OR t.payment_method = "employee_meal")');
            } else {
                whereClauses.push('t.payment_method = ?');
                queryParams.push(paymentMethod);
            }
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // Query to get total count of transactions
        const countSql = `SELECT COUNT(*) as totalItems FROM transactions t ${whereSql}`;
        const [countRows] = await db.query(countSql, queryParams);
        const totalItems = countRows[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        // Query to get paginated transactions
        const dataSql = `
            SELECT 
                t.*, 
                u.username AS cashier_name
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            ${whereSql}
            ORDER BY t.timestamp DESC
            LIMIT ?
            OFFSET ?
        `;
        const [rows] = await db.query(dataSql, [...queryParams, limit, offset]);

        const transactions = rows.map(row => ({
            ...row,
            isEmployeeMeal: row.isEmployeeMeal === 1,
        }));

        res.json({
            "message": "success",
            "data": transactions,
            "pagination": {
                "currentPage": page,
                "totalPages": totalPages,
                "totalItems": totalItems,
                "limit": limit
            }
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get all transactions without pagination (for all-time metrics)
app.get("/api/transactions/all", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'owner'), async (req, res, next) => {
    try {
        const { startDate, endDate, paymentMethod } = req.query; // Extract startDate and endDate and paymentMethod

        let whereClauses = ['t.deleted_at IS NULL'];
        let queryParams = [];

        if (startDate) {
            whereClauses.push('t.timestamp >= ?');
            queryParams.push(startDate);
        }
        if (endDate) {
            // Adjust the end date to include the entire day
            whereClauses.push('t.timestamp <= ?');
            queryParams.push(`${endDate} 23:59:59`); // Assuming endDate is 'YYYY-MM-DD'
        }

        if (paymentMethod && paymentMethod !== 'all') {
            if (paymentMethod === 'Makan Karyawan') {
                // Handle Employee Meal special case
                whereClauses.push('(t.isEmployeeMeal = 1 OR t.payment_method = "employee_meal")');
            } else {
                whereClauses.push('t.payment_method = ?');
                queryParams.push(paymentMethod);
            }
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        const sql = `
            SELECT
                t.id,
                DATE_FORMAT(t.timestamp, '%Y-%m-%d %H:%i:%s+07:00') AS timestamp,
                t.items,
                t.total,
                t.ppn,
                t.isEmployeeMeal,
                t.payment_method,
                t.cash_paid,
                t.change,
                t.order_id,
                t.user_id,
                t.manual_discount,
                u.username AS cashier_name
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            ${whereSql}
            ORDER BY t.timestamp DESC
        `;
        const [rows] = await db.query(sql, queryParams); // Pass queryParams here

        const transactions = rows.map(row => ({
            ...row,
            isEmployeeMeal: row.isEmployeeMeal === 1,
            // Parse items JSON if needed (it's already parsed in the /api/transactions endpoint)
            items: JSON.parse(row.items || '[]')
        }));

        res.json({
            "message": "success",
            "data": transactions
        });
    } catch (err) {
        console.error("Error fetching all transactions:", err); // Add more specific error logging
        res.status(500).json({ "error": err.message, "stack": err.stack });
    }
});

// Get daily transaction recap
app.get("/api/transactions/daily-recap", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'owner'), async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ "error": "Date parameter is required" });
        }

        const sql = `
            SELECT
                COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' OR payment_method IS NULL THEN total ELSE 0 END), 0) as total_tunai,
                COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'transfer' THEN total ELSE 0 END), 0) as total_transfer,
                COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'gojek' THEN total ELSE 0 END), 0) as total_gojek,
                COALESCE(SUM(CASE WHEN isEmployeeMeal = 1 OR LOWER(payment_method) = 'employee_meal' THEN total ELSE 0 END), 0) as total_makan_karyawan,
                COALESCE(SUM(total), 0) as grand_total
            FROM transactions
            WHERE DATE(timestamp) = ? AND deleted_at IS NULL
        `;

        const [rows] = await db.query(sql, [date]);

        res.json({
            "message": "success",
            "data": rows[0] // The query returns a single row with the totals
        });

    } catch (err) {
        console.error("Error fetching daily transaction recap:", err);
        res.status(500).json({ "error": err.message, "stack": err.stack });
    }
});

// Get trashed transactions
app.get("/api/transactions/trash", authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const sql = `
            SELECT
                t.*,
                u.username AS cashier_name
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.deleted_at IS NOT NULL
            ORDER BY t.deleted_at DESC
        `;
        const [rows] = await db.query(sql);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});


// Get a single transaction by id
app.get("/api/transactions/:id", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir'), async (req, res, next) => {
    try {
        const sql = "select * from transactions where id = ? AND deleted_at IS NULL";
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
app.post("/api/transactions/", authenticateToken, authorizeRoles('user', 'admin', 'kasir'), async (req, res, next) => {
    try {
        const { items, total: frontendTotal, ppn: frontendPpn, ignoreStock, cashPaid, change, isEmployeeMeal, payment_method, manual_discount } = req.body;
        const errors = [];
        if (!items) {
            errors.push("No items specified");
        }
        if (errors.length) {
            res.status(400).json({ "error": errors.join(",") });
            return;
        }

        if (!ignoreStock) {
            // --- STOCK VALIDATION BEFORE TRANSACTION ---
            for (const cartItem of items) {
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
        }

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
                newTransactionId = 'TRZ001';
            }
        } else {
            newTransactionId = 'TRZ001';
        }
        // --- End Generate New Transaction ID ---

        // Backend calculation for reference or fallback
        let calculatedSubtotal = 0;
        const itemsWithDiscount = items.map(item => {
            const discountedPrice = item.price; // item.price is already the final price after item-level discount from frontend
            calculatedSubtotal += discountedPrice * item.quantity;
            return { ...item, price: discountedPrice };
        });

        const [ppnSetting] = await db.query("SELECT value FROM settings WHERE `key` = 'ppn'");
        const ppnRate = ppnSetting.length > 0 ? parseFloat(ppnSetting[0].value) : 0.11;
        const calculatedPpn = calculatedSubtotal * ppnRate;
        const calculatedTotal = calculatedSubtotal + calculatedPpn;

        // Use frontend's total if provided, otherwise use backend's calculation
        const finalTotal = frontendTotal !== undefined ? frontendTotal : calculatedTotal;
        // The stored PPN should reflect the calculated amount based on items, even if total is overridden.
        const finalPpnAmount = calculatedPpn;


        const data = {
            id: newTransactionId,
            timestamp: new Date(),
            items: JSON.stringify(itemsWithDiscount),
            total: finalTotal,
            ppn: finalPpnAmount,
            isEmployeeMeal: isEmployeeMeal ? 1 : 0,
            payment_method: payment_method || 'Tunai', // Reintroduce fallback
            ignore_stock: ignoreStock ? 1 : 0,
            cash_paid: cashPaid || 0,
            change: change || 0,
            user_id: req.user.userId,
            manual_discount: manual_discount || 0
        };
        const sql = 'INSERT INTO transactions (id, timestamp, items, total, ppn, isEmployeeMeal, payment_method, ignore_stock, cash_paid, `change`, user_id, manual_discount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';

        const params = [data.id, data.timestamp, data.items, data.total, data.ppn, data.isEmployeeMeal, data.payment_method, data.ignore_stock, data.cash_paid, data.change, data.user_id, data.manual_discount];
        const [result] = await db.query(sql, params);

        if (!ignoreStock) {
            // --- STOCK REDUCTION LOGIC --- 
            for (const item of req.body.items) {
                const updateStockSql = 'UPDATE menu_items SET stock = stock - ? WHERE id = ?';
                await db.query(updateStockSql, [item.quantity, item.id]);
            }
        }

        const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [data.id]);
        if (rows.length > 0) {
            const newTransaction = {
                ...rows[0],
                items: JSON.parse(rows[0].items || '[]') // Ensure items is an array
            };
            res.json({
                "message": "success",
                "data": newTransaction,
                "id": data.id
            });
        } else {
            // This case should ideally not be reached
            res.status(404).json({ "error": "Failed to retrieve the newly created transaction." });
        }
    } catch (err) {
        res.status(400).json({ "error": err.message, "stack": err.stack });
    }
});

// Update a transaction
app.put("/api/transactions/:id", authenticateToken, authorizeRoles('user', 'admin', 'kasir'), async (req, res, next) => {
    try {
        const { total, ppn, isEmployeeMeal, payment_method, timestamp, manual_discount } = req.body;
        console.log(`[UPDATE TRANSACTION] ID: ${req.params.id}`, req.body); // Debug log
        const { id } = req.params;

        const sql = `UPDATE transactions SET 
           total = COALESCE(?, total), 
           ppn = COALESCE(?, ppn), 
           isEmployeeMeal = COALESCE(?, isEmployeeMeal), 
           payment_method = COALESCE(?, payment_method),
           timestamp = COALESCE(?, timestamp),
           manual_discount = COALESCE(?, manual_discount) 
           WHERE id = ? AND deleted_at IS NULL`;
        const params = [total, ppn, isEmployeeMeal ? 1 : 0, payment_method, timestamp ? new Date(timestamp) : null, manual_discount, id];
        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Transaction not found" });
        }

        res.json({ message: "success", data: req.body, changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message, "stack": err.stack });
    }
});

// Soft delete a transaction
app.delete("/api/transactions/:id", authenticateToken, authorizeRoles('user', 'admin', 'kasir'), async (req, res, next) => {
    try {
        const sql = 'UPDATE transactions SET deleted_at = ? WHERE id = ?';
        const [result] = await db.query(sql, [new Date(), req.params.id]);
        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Restore a soft-deleted transaction
app.put("/api/transactions/:id/restore", authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const sql = 'UPDATE transactions SET deleted_at = NULL WHERE id = ?';
        const [result] = await db.query(sql, [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Transaction not found in trash" });
        }
        res.json({ "message": "restored", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Permanently delete a transaction
app.delete("/api/transactions/:id/permanent", authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const sql = 'DELETE FROM transactions WHERE id = ?';
        const [result] = await db.query(sql, [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Transaction not found" });
        }
        res.json({ "message": "permanently deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Soft delete all transactions
app.delete("/api/transactions", authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const sql = 'UPDATE transactions SET deleted_at = ? WHERE deleted_at IS NULL';
        const [result] = await db.query(sql, [new Date()]);
        res.json({ "message": "all deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Create a new simplified transaction (V2)
app.post("/api/v2/transactions", authenticateToken, authorizeRoles('user', 'admin', 'kasir', 'owner'), async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const { items, total_amount, payment_method, cash_paid, change_given } = req.body;
        const user_id = req.user.userId;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Transaction must include at least one item." });
        }
        if (!total_amount || !payment_method) {
            return res.status(400).json({ error: "Total amount and payment method are required." });
        }

        // 1. Insert into simple_transactions table
        const transactionSql = 'INSERT INTO simple_transactions (user_id, total_amount, payment_method, cash_paid, change_given) VALUES (?, ?, ?, ?, ?)';
        const transactionParams = [user_id, total_amount, payment_method, cash_paid, change_given];
        const [transactionResult] = await connection.query(transactionSql, transactionParams);
        const simple_transaction_id = transactionResult.insertId;

        // 2. Insert into simple_transaction_items table
        const itemsSql = 'INSERT INTO simple_transaction_items (simple_transaction_id, menu_item_id, item_name, quantity, price_per_item, total_price) VALUES ?';
        const itemValues = items.map(item => [
            simple_transaction_id,
            item.id,
            item.name,
            item.quantity,
            item.price,
            item.quantity * item.price
        ]);
        await connection.query(itemsSql, [itemValues]);

        await connection.commit();

        res.status(201).json({
            message: "Simple transaction created successfully",
            data: {
                id: simple_transaction_id,
                ...req.body
            }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Error creating simple transaction:", err);
        res.status(500).json({ error: "Failed to create simple transaction.", details: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// --- Expense Endpoints ---

// Get all expenses without pagination
app.get("/api/expenses/all", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'owner'), async (req, res) => {
    try {
        const dataSql = `
            SELECT 
                e.id,
                e.name,
                e.amount,
                e.category,
                DATE_FORMAT(e.date, '%Y-%m-%d %H:%i:%s+07:00') AS date,
                e.notes,
                e.user_id,
                u.username AS recorded_by
            FROM expenses e
            LEFT JOIN users u ON e.user_id = u.id
            ORDER BY e.date DESC
        `;
        const [rows] = await db.query(dataSql);

        res.json({
            "message": "success",
            "data": rows,
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get all expenses with pagination and date range filtering
app.get("/api/expenses", authenticateToken, authorizeRoles('user', 'admin', 'guest'), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const { startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let whereClauses = [];
        let queryParams = [];

        if (startDate) {
            whereClauses.push('e.date >= ?');
            queryParams.push(startDate);
        }
        if (endDate) {
            whereClauses.push('e.date <= ?');
            queryParams.push(endDate);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query to get total count
        const countSql = `SELECT COUNT(*) as totalItems FROM expenses e ${whereSql}`;
        const [countRows] = await db.query(countSql, queryParams);
        const totalItems = countRows[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        // Query to get paginated data
        const dataSql = `
            SELECT 
                e.*, 
                u.username AS recorded_by
            FROM expenses e
            LEFT JOIN users u ON e.user_id = u.id
            ${whereSql}
            ORDER BY e.date DESC
            LIMIT ?
            OFFSET ?
        `;
        const [rows] = await db.query(dataSql, [...queryParams, limit, offset]);

        res.json({
            "message": "success",
            "data": rows,
            "pagination": {
                "currentPage": page,
                "totalPages": totalPages,
                "totalItems": totalItems,
                "limit": limit
            }
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
        const sql = 'INSERT INTO expenses (name, amount, category, date, notes, user_id) VALUES (?,?,?,?,?,?)';
        const params = [name, amount, category, date, notes, req.user.userId];
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

// Delete all expenses (with master password confirmation)
app.delete("/api/expenses/all", authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Master password is required for this action." });
        }

        // Fetch the stored master password hash from the settings table
        const [masterPassRow] = await db.query('SELECT `value` FROM settings WHERE `key` = ?', ['master_password']);
        const storedMasterPassword = masterPassRow.length > 0 ? masterPassRow[0].value : null;

        // Check if master password exists and if the provided password is valid
        if (!storedMasterPassword || !(await bcrypt.compare(password, storedMasterPassword))) {
            return res.status(401).json({ error: "Kata sandi master salah. Silakan coba lagi." });
        }

        // If password is valid, proceed with deletion
        const sql = 'TRUNCATE TABLE expenses';
        await db.query(sql);
        res.json({ message: "all deleted" });

    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
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


// --- Account Endpoints for Deposit and Expenses ---

// Helper to get account ID by name and authorize
const getAccountAndAuthorize = async (req, res, accountName, allowedRoles) => {
    const [accountRows] = await db.query('SELECT * FROM accounts WHERE name = ?', [accountName]);
    if (accountRows.length === 0) {
        res.status(404).json({ error: "Account not found" });
        return null;
    }
    const account = accountRows[0];

    // Check if the user has the necessary role for this account type
    const userRole = req.user.role;
    // console.log(`DEBUG: Account name: ${accountName}, User Role: '${userRole}', Allowed Roles: ${JSON.stringify(allowedRoles)}`); // ADDED DEBUG LOG

    if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ error: "Forbidden: Insufficient permissions for this account" });
        return null;
    }
    return account;
};

// GET Account Balance and Transactions
app.get("/api/accounts/:accountName", authenticateToken, async (req, res) => {
    try {
        const { accountName } = req.params;
        let allowedRoles;

        if (accountName === 'lapak_deposit') {
            allowedRoles = ['admin', 'user', 'kasir', 'owner']; // Owner can also view lapak deposit
        } else if (accountName === 'owner_deposit') {
            allowedRoles = ['admin', 'owner'];
        } else {
            return res.status(400).json({ error: "Invalid account name" });
        }

        const account = await getAccountAndAuthorize(req, res, accountName, allowedRoles);
        if (!account) return; // Response already sent by helper

        // Fetch transactions for this account
        const [transactions] = await db.query(
            `SELECT at.*, u.username as created_by_username 
             FROM account_transactions at 
             JOIN users u ON at.created_by_user_id = u.id 
             WHERE at.account_id = ? ORDER BY at.created_at DESC`,
            [account.id]
        );

        res.json({
            message: "success",
            data: {
                account: {
                    id: account.id,
                    name: account.name,
                    balance: account.balance,
                    type: account.type,
                    updated_at: account.updated_at
                },
                transactions: transactions
            }
        });

    } catch (err) {
        console.error('Error fetching account data:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});


// POST Deposit to Account
app.post("/api/accounts/deposit", authenticateToken, async (req, res) => {
    let connection;
    try {
        const { account_name, amount, description } = req.body;
        const created_by_user_id = req.user.userId;

        if (!account_name || !amount || amount <= 0) {
            return res.status(400).json({ error: "Account name and a positive amount are required." });
        }

        let allowedRoles;
        if (account_name === 'lapak_deposit') {
            allowedRoles = ['admin', 'user', 'kasir'];
        } else if (account_name === 'owner_deposit') {
            allowedRoles = ['admin', 'owner'];
        } else {
            return res.status(400).json({ error: "Invalid account name" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const account = await getAccountAndAuthorize({ ...req, connection }, res, account_name, allowedRoles);
        if (!account) {
            await connection.rollback();
            return;
        }

        // Update account balance
        await connection.query(
            'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [amount, account.id]
        );

        // Record transaction
        await connection.query(
            'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id) VALUES (?, ?, ?, ?, ?)',
            [account.id, 'deposit', amount, description, created_by_user_id]
        );

        await connection.commit();

        res.status(201).json({
            message: "Deposit successful",
            data: { account_name, amount, description }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error processing deposit:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    } finally {
        if (connection) connection.release();
    }
});

// POST Expense from Account
app.post("/api/accounts/expense", authenticateToken, async (req, res) => {
    let connection;
    try {
        const { account_name, amount, description } = req.body;
        const created_by_user_id = req.user.userId;

        if (!account_name || !amount || amount <= 0) {
            return res.status(400).json({ error: "Account name and a positive amount are required." });
        }

        let allowedRoles;
        if (account_name === 'lapak_deposit') {
            allowedRoles = ['admin', 'user', 'kasir'];
        } else if (account_name === 'owner_deposit') {
            allowedRoles = ['admin', 'owner'];
        } else {
            return res.status(400).json({ error: "Invalid account name" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const account = await getAccountAndAuthorize({ ...req, connection }, res, account_name, allowedRoles);
        if (!account) {
            await connection.rollback();
            return;
        }

        // Check if sufficient balance
        if (account.balance < amount) {
            await connection.rollback();
            return res.status(400).json({ error: "Insufficient balance in account" });
        }

        // Update account balance
        await connection.query(
            'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [amount, account.id]
        );

        // Record transaction
        await connection.query(
            'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id) VALUES (?, ?, ?, ?, ?)',
            [account.id, 'expense', amount, description, created_by_user_id]
        );

        await connection.commit();

        res.status(201).json({
            message: "Expense recorded successfully",
            data: { account_name, amount, description }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error processing expense:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    } finally {
        if (connection) connection.release();
    }
});


// PUT Update Account Transaction (only description)
app.put("/api/accounts/transactions/:id", authenticateToken, async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { description } = req.body;
        const userId = req.user.userId;

        if (!description || description.trim() === '') {
            return res.status(400).json({ error: "Description is required and cannot be empty" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Get transaction details
        const [transRows] = await connection.query('SELECT * FROM account_transactions WHERE id = ?', [id]);
        if (transRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Transaction not found" });
        }
        const transaction = transRows[0];

        // Check ownership or admin role
        if (transaction.created_by_user_id !== userId && req.user.role !== 'admin') {
            await connection.rollback();
            return res.status(403).json({ error: "Forbidden: You are not authorized to edit this transaction" });
        }

        await connection.query('UPDATE account_transactions SET description = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?', [description, id]);

        await connection.commit();
        res.json({ message: "Transaction updated successfully", data: { id, description } });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error updating account transaction:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE Account Transaction
app.delete("/api/accounts/transactions/:id", authenticateToken, async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Get transaction details
        const [transRows] = await connection.query('SELECT * FROM account_transactions WHERE id = ? FOR UPDATE', [id]);
        if (transRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Transaction not found" });
        }
        const transaction = transRows[0];

        // Check ownership or admin role
        if (transaction.created_by_user_id !== userId && req.user.role !== 'admin') {
            await connection.rollback();
            return res.status(403).json({ error: "Forbidden: You are not authorized to delete this transaction" });
        }

        // Revert balance based on transaction type
        if (transaction.type === 'deposit') {
            await connection.query(
                'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [transaction.amount, transaction.account_id]
            );
        } else if (transaction.type === 'expense') {
            await connection.query(
                'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [transaction.amount, transaction.account_id]
            );
        } else {
            await connection.rollback();
            return res.status(500).json({ error: "Unknown transaction type" });
        }

        // Delete transaction record
        await connection.query('DELETE FROM account_transactions WHERE id = ?', [id]);

        await connection.commit();
        res.json({ message: "Transaction deleted successfully", data: { id } });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error deleting account transaction:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    } finally {
        if (connection) connection.release();
    }
});


// --- Notes Endpoints ---

// Get all notes for all users
app.get("/api/notes", authenticateToken, async (req, res) => {
    try {
        const sql = `
            SELECT 
                n.id, 
                n.title, 
                n.content, 
                n.user_id, 
                u.username as author,
                n.created_at, 
                n.updated_at
            FROM notes n
            JOIN users u ON n.user_id = u.id
            ORDER BY n.updated_at DESC
        `;
        const [rows] = await db.query(sql);
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
        const userId = req.user.userId;

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        // First, get the note to check ownership
        const [noteRows] = await db.query('SELECT user_id FROM notes WHERE id = ?', [id]);

        if (noteRows.length === 0) {
            return res.status(404).json({ error: "Note not found" });
        }

        const note = noteRows[0];
        if (note.user_id !== userId) {
            return res.status(403).json({ error: "Forbidden: You are not the author of this note" });
        }

        // If ownership is verified, update the note
        const sql = 'UPDATE notes SET title = ?, content = ? WHERE id = ?';
        const [result] = await db.query(sql, [title, content, id]);

        if (result.affectedRows > 0) {
            res.json({ message: "Note updated successfully" });
        } else {
            // This case should ideally not be reached due to the checks above
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
        const userId = req.user.userId;

        // First, get the note to check ownership
        const [noteRows] = await db.query('SELECT user_id FROM notes WHERE id = ?', [id]);

        if (noteRows.length === 0) {
            return res.status(404).json({ error: "Note not found" });
        }

        const note = noteRows[0];
        if (note.user_id !== userId) {
            return res.status(403).json({ error: "Forbidden: You are not the author of this note" });
        }

        // If ownership is verified, delete the note
        const sql = 'DELETE FROM notes WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows > 0) {
            res.json({ message: "Note deleted successfully" });
        } else {
            // This case should ideally not be reached due to the checks above
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
        const { customer_name, customer_address, items } = req.body; // 'total' will be calculated on backend
        if (!customer_name || !items || items.length === 0) {
            return res.status(400).json({ error: "Missing required fields: customer_name, items" });
        }

        let calculatedTotal = 0;
        const orderItemsWithDetails = [];

        for (const item of items) {
            const [menuItemRows] = await db.query('SELECT id, name, price, discount FROM menu_items WHERE id = ?', [item.id]);
            if (menuItemRows.length === 0) {
                return res.status(400).json({ error: `Menu item with ID ${item.id} not found.` });
            }
            const menuItem = menuItemRows[0];
            const itemPrice = parseFloat(menuItem.price);
            const itemDiscount = parseFloat(menuItem.discount || 0); // Ensure discount is a number, default to 0

            const discountedPrice = itemPrice * (1 - itemDiscount);
            const itemSubtotal = discountedPrice * item.quantity;
            calculatedTotal += itemSubtotal;

            orderItemsWithDetails.push({
                id: menuItem.id,
                name: menuItem.name,
                price: itemPrice, // Store original price
                discount: itemDiscount, // Store discount applied
                quantity: item.quantity,
                subtotal: itemSubtotal // Store subtotal after discount
            });
        }

        const sql = 'INSERT INTO orders (customer_name, customer_address, items, total, status) VALUES (?, ?, ?, ?, ?)';
        const params = [customer_name, customer_address, JSON.stringify(orderItemsWithDetails), calculatedTotal, 'pending'];
        const [result] = await db.query(sql, params);

        res.status(201).json({
            message: "Order created successfully and is pending verification.",
            data: { id: result.insertId, customer_name, customer_address, items: orderItemsWithDetails, total: calculatedTotal, status: 'pending' }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});
// Get all orders with pagination and status filtering
app.get("/api/orders", authenticateToken, authorizeRoles('admin', 'user'), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const status = req.query.status;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let queryParams = [];
        if (status) {
            whereClause = 'WHERE status = ?';
            queryParams.push(status);
        }

        // Query to get total count
        const countSql = `SELECT COUNT(*) as totalItems FROM orders ${whereClause}`;
        const [countRows] = await db.query(countSql, queryParams);
        const totalItems = countRows[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        // Query to get paginated data
        const dataSql = `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        const [rows] = await db.query(dataSql, [...queryParams, limit, offset]);

        res.json({
            "message": "success",
            "data": rows,
            "pagination": {
                "currentPage": page,
                "totalPages": totalPages,
                "totalItems": totalItems,
                "limit": limit,
                "status": status || null
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an order's status (admin only)

app.put("/api/orders/:id/status", authenticateToken, authorizeRoles('admin', 'user', 'kasir'), async (req, res) => {

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



            const missingItemIds = [];



            const insufficientStockItems = [];







            for (const item of items) {



                const [menuItemRows] = await connection.query('SELECT name, stock FROM menu_items WHERE id = ?', [item.id]);



                if (menuItemRows.length === 0) {



                    missingItemIds.push(item.id);



                } else if (menuItemRows[0].stock < item.quantity) {



                    insufficientStockItems.push(`${menuItemRows[0].name} (Tersedia: ${menuItemRows[0].stock}, Diminta: ${item.quantity})`);



                }



            }







            if (missingItemIds.length > 0 || insufficientStockItems.length > 0) {



                await connection.rollback();



                let errorMessage = "Pesanan tidak dapat diterima karena masalah stok:\n";



                if (missingItemIds.length > 0) {



                    errorMessage += `- Item menu tidak ditemukan: ${missingItemIds.join(', ')}.\n`;



                }



                if (insufficientStockItems.length > 0) {



                    errorMessage += `- Stok tidak mencukupi untuk: ${insufficientStockItems.join('; ')}.\n`;



                }



                return res.status(400).json({ error: errorMessage.trim() });



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

                payment_method: 'Tunai',
                order_id: id

            };

            await connection.query('INSERT INTO transactions (id, timestamp, items, total, ppn, isEmployeeMeal, payment_method, order_id) VALUES (?,?,?,?,?,?,?,?)', Object.values(transactionData));



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



// Delete a single order by ID

app.delete("/api/orders/:id", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Get the full order details
        const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);

        if (orderRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Order not found." });
        }

        const order = orderRows[0];
        const orderStatus = order.status;

        // If the order was accepted, we need to reverse the stock reduction and delete the transaction
        if (orderStatus === 'accepted') {
            const items = JSON.parse(order.items);

            // Restore stock
            for (const item of items) {
                await connection.query('UPDATE menu_items SET stock = stock + ? WHERE id = ?', [item.quantity, item.id]);
            }

            // Delete the associated transaction
            await connection.query('DELETE FROM transactions WHERE order_id = ?', [id]);
        }

        // Finally, delete the order itself
        const sql = 'DELETE FROM orders WHERE id = ?';
        const [result] = await connection.query(sql, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            // This case should ideally not be reached if the first query found the order
            return res.status(404).json({ "error": "Order not found during deletion" });
        }

        await connection.commit();
        res.json({ "message": "Order deleted successfully", changes: result.affectedRows });

    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message, stack: err.stack });
    } finally {
        connection.release();
    }
});



// Delete all orders by status

app.delete("/api/orders/status/:status", authenticateToken, authorizeRoles('admin'), async (req, res) => {

    const { status } = req.params;

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();



        if (!['pending', 'rejected'].includes(status)) {

            await connection.rollback();

            return res.status(400).json({ error: "Invalid status for bulk deletion. Only 'pending' or 'rejected' orders can be bulk deleted." });

        }



        const sql = 'DELETE FROM orders WHERE status = ?';

        const [result] = await connection.query(sql, [status]);



        await connection.commit();

        res.json({ "message": `${result.affectedRows} orders with status '${status}' deleted successfully`, changes: result.affectedRows });

    } catch (err) {

        await connection.rollback();

        res.status(500).json({ error: err.message, stack: err.stack });

    } finally {

        connection.release();

    }

});



// --- Auth Endpoints ---

// --- Employee Endpoints ---

// Get all employees
app.get("/api/employees", authenticateToken, authorizeRoles('user', 'admin'), async (req, res) => {
    try {
        const sql = "SELECT * FROM employees ORDER BY id DESC";
        const [rows] = await db.query(sql);
        res.json({
            "message": "success",
            "data": rows
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Add a new employee
app.post("/api/employees", authenticateToken, authorizeRoles('admin'), upload.single('avatar'), async (req, res) => {
    try {
        const { name, position, phone, email } = req.body;
        const avatar = req.file ? `/public/uploads/${req.file.filename}` : null;

        const sql = 'INSERT INTO employees (name, position, avatar, phone, email) VALUES (?,?,?,?,?)';
        const params = [name, position, avatar, phone, email];
        const [result] = await db.query(sql, params);
        res.json({
            "message": "success",
            "data": { ...req.body, avatar },
            "id": result.insertId
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Update an employee
app.put("/api/employees/:id", authenticateToken, authorizeRoles('admin'), upload.single('avatar'), async (req, res) => {
    try {
        const { name, position, phone, email } = req.body;
        const avatar = req.file ? `/public/uploads/${req.file.filename}` : null;

        const sql = `UPDATE employees set 
           name = COALESCE(?,name), 
           position = COALESCE(?,position), 
           avatar = COALESCE(?,avatar), 
           phone = COALESCE(?,phone), 
           email = COALESCE(?,email) 
           WHERE id = ?`;
        const params = [name, position, avatar, phone, email, req.params.id];
        const [result] = await db.query(sql, params);
        res.json({ message: "success", data: req.body, changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Delete an employee
app.delete("/api/employees/:id", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const sql = 'DELETE FROM employees WHERE id = ?';
        const [result] = await db.query(sql, [req.params.id]);
        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
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

        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

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
app.get("/api/all-settings", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'owner', 'kasir'), async (req, res) => {
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

// Update last_monthly_reset_date setting
app.put('/api/settings/last_monthly_reset_date', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { value } = req.body;
        if (!value) {
            return res.status(400).json({ "error": "Value is required" });
        }

        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        await db.query(sql, ['last_monthly_reset_date', value]);

        res.json({ message: "Last monthly reset date updated successfully", data: { last_monthly_reset_date: value } });

    } catch (err) {
        res.status(500).json({ "error": err.message, stack: err.stack });
    }
});





// Enable/disable registration
app.put("/api/settings/registration", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log('req.body:', req.body);
        const { enabled } = req.body;
        let booleanEnabled;

        if (typeof enabled === 'boolean') {
            booleanEnabled = enabled;
        } else if (typeof enabled === 'string') {
            if (enabled === 'true') {
                booleanEnabled = true;
            } else if (enabled === 'false') {
                booleanEnabled = false;
            } else {
                return res.status(400).json({ error: "'enabled' must be a boolean or string 'true'/'false'" });
            }
        } else {
            return res.status(400).json({ error: "'enabled' must be a boolean or string 'true'/'false'" });
        }

        const selectSql = 'SELECT * FROM settings WHERE `key` = ?';
        const [rows] = await db.query(selectSql, ['registration_enabled']);

        if (rows.length > 0) {
            const updateSql = 'UPDATE settings SET `value` = ? WHERE `key` = ?';
            await db.query(updateSql, [booleanEnabled.toString(), 'registration_enabled']);
        } else {
            const insertSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?)';
            await db.query(insertSql, ['registration_enabled', booleanEnabled.toString()]);
        }
        res.json({ message: "Registration setting updated successfully", data: { enabled: booleanEnabled } });
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

        if (!newRole || !['admin', 'user', 'kasir', 'guest'].includes(newRole)) {
            return res.status(400).json({ error: "Invalid role specified. Must be 'admin', 'user', 'kasir', or 'guest'." });
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
    const connection = await db.getConnection();
    try {
        const { masterPassword } = req.body;
        if (!masterPassword) {
            return res.status(400).json({ error: "Master password is required" });
        }

        const [masterPassRow] = await connection.query('SELECT value FROM settings WHERE `key` = ?', ['master_password']);
        const storedMasterPassword = masterPassRow.length > 0 ? masterPassRow[0].value : null;

        if (!storedMasterPassword || !(await bcrypt.compare(masterPassword, storedMasterPassword))) {
            return res.status(401).json({ error: "Kata sandi master salah" });
        }

        await connection.beginTransaction();
        await connection.query('TRUNCATE TABLE transactions');
        await connection.query('TRUNCATE TABLE expenses');
        await connection.query('UPDATE menu_items SET stock = 0'); // Reset stock
        await connection.commit();

        res.json({ message: "All transactions, expenses, and menu item stock have been cleared." });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message, stack: err.stack });
    } finally {
        connection.release();
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
app.get("/api/user/profile", authenticateToken, async (req, res) => {
    try {
        const sql = 'SELECT id, username, role, avatar_url FROM users WHERE id = ?';
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

// Upload User Avatar
app.post("/api/user/profile/avatar", authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No avatar file uploaded." });
        }
        const avatarUrl = `/public/uploads/${req.file.filename}`;

        const sql = 'UPDATE users SET avatar_url = ? WHERE id = ?';
        await db.query(sql, [avatarUrl, req.user.userId]);

        res.json({
            message: 'Avatar updated successfully!',
            data: { avatar_url: avatarUrl }
        });
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



// --- Comprehensive Report Endpoint ---
app.get("/api/laporan-lengkap", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const hasDateFilter = startDate && endDate;

        // Base queries
        let transactionsQuery = `SELECT * FROM transactions ORDER BY timestamp DESC`;
        let expensesQuery = `SELECT * FROM expenses ORDER BY date DESC`;
        let lapakAccountQuery = `SELECT at.*, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'lapak_deposit' ORDER BY at.created_at DESC`;
        let ownerAccountQuery = `SELECT at.*, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'owner_deposit' ORDER BY at.created_at DESC`;
        const menuStockQuery = `SELECT id, name, stock, category, price, hpp FROM menu_items ORDER BY name ASC`;
        const rawMaterialStockQuery = `SELECT id, name, current_stock, unit, price_per_item FROM raw_materials ORDER BY name ASC`;

        const queryParams = hasDateFilter ? [startDate, `${endDate} 23:59:59`] : [];

        if (hasDateFilter) {
            transactionsQuery = `SELECT * FROM transactions WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC`;
            expensesQuery = `SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC`;
            lapakAccountQuery = `SELECT at.*, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'lapak_deposit' AND at.created_at BETWEEN ? AND ? ORDER BY at.created_at DESC`;
            ownerAccountQuery = `SELECT at.*, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'owner_deposit' AND at.created_at BETWEEN ? AND ? ORDER BY at.created_at DESC`;
        }

        const queries = [
            db.query(transactionsQuery, hasDateFilter ? queryParams : []),
            db.query(expensesQuery, hasDateFilter ? queryParams : []),
            db.query(lapakAccountQuery, hasDateFilter ? queryParams : []),
            db.query(ownerAccountQuery, hasDateFilter ? queryParams : []),
            db.query(menuStockQuery), // No params
            db.query(rawMaterialStockQuery) // No params
        ];

        const [
            [transactions],
            [expenses],
            [lapakAccountTransactions],
            [ownerAccountTransactions],
            [menuStock],
            [rawMaterialStock]
        ] = await Promise.all(queries);

        res.json({
            message: "success",
            data: {
                transactions,
                expenses,
                lapakAccountTransactions,
                ownerAccountTransactions,
                menuStock,
                rawMaterialStock
            }
        });

    } catch (err) {
        console.error("Error fetching comprehensive report:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});


// Public API to get all menu items for guest users (no authentication required)
app.get("/api/guest/menu-items", async (req, res) => {
    try {
        const sql = "SELECT id, name, price, stock, category, image_url, discount FROM menu_items";
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
app.use(function (req, res) {
    res.status(404).send();
});
