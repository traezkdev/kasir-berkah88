require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const db = require('./database.js'); // db is now the promisePool
const bcrypt = require('bcryptjs'); // Import bcryptjs
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const helmet = require('helmet'); // Security headers
const rateLimit = require('express-rate-limit'); // Rate limiting
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
const { sendPushNotification } = require('./utils/oneSignal');
const { sendExpoPushNotification } = require('./utils/expoPush');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});
app.set('io', io);

// Socket.io Connection Logic
// Socket.io Connection Logic
const onlineUsers = new Map(); // userId -> { role, sockets: Set<socketId> }

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('user_connected', (userData) => {
        console.log('Received user_connected:', userData);
        if (!userData || !userData.userId) return;
        const { userId, role } = userData;

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, { role, sockets: new Set() });
        }
        onlineUsers.get(userId).sockets.add(socket.id);

        // Broadcast to all that this user is online (including role)
        io.emit('user_status', { userId, role, status: 'online' });

        // Send current online users list to this client
        const onlineList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
            userId: id,
            role: data.role
        }));
        socket.emit('online_users', onlineList);

        // Store on socket for disconnect handling
        socket.userId = userId;
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.userId && onlineUsers.has(socket.userId)) {
            const userData = onlineUsers.get(socket.userId);
            userData.sockets.delete(socket.id);
            if (userData.sockets.size === 0) {
                const role = userData.role;
                onlineUsers.delete(socket.userId);
                io.emit('user_status', { userId: socket.userId, role, status: 'offline' });
            }
        }
    });
});

app.set('trust proxy', 1); // Trust first proxy (fix for express-rate-limit behind proxy)

// Ensure uploads directory exists
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1. CORS (Must be first to handle preflight requests)
app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins in development
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        // In production, allow origins from FRONTEND_URL in .env
        const frontendUrlEnv = process.env.FRONTEND_URL || '';
        const rawOrigins = frontendUrlEnv.split(',').map(url => url.trim()).filter(Boolean);
        const allowedOrigins = rawOrigins.map(o => o.replace(/\/$/, ""));

        if (!origin || allowedOrigins.includes(origin) || rawOrigins.length === 0) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
    optionsSuccessStatus: 204
}));

// Explicitly handle OPTIONS requests for all routes
app.options('*', cors());

// 2. Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 3. Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false // Deactivate for easier resource sharing
}));

// Rate Limiting to prevent brute force
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiter to auth routes AFTER cors
app.use('/api/login', apiLimiter);
app.use('/api/register', apiLimiter);
// Error handling for JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads'), {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Increased to 10MB Limit for large JSON
    },
    fileFilter: (req, file, cb) => {
        // Special case for database restore endpoint
        if (req.path === '/api/database/restore' || file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
            return cb(null, true);
        }

        const allowedTypes = /jpeg|jpg|png|webp|gif|svg|ico/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file gambar (jpg, png, webp, gif, svg, ico) dan file JSON yang diizinkan!'));
        }
    }
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error("FATAL ERROR: JWT_SECRET is not defined.");
    } else {
        console.warn("WARNING: JWT_SECRET is not defined. Using insecure fallback for development.");
    }
}
const ACTUAL_JWT_SECRET = JWT_SECRET || 'supersecretjwtkey';

// Auth Middleware
const authenticateToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        console.log('Authentication token missing');
        return res.status(401).json({ error: "Authentication token required" });
    }

    jwt.verify(token, ACTUAL_JWT_SECRET, (err, user) => {
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
            console.log('❌ Forbidden: Insufficient permissions for user:', req.user ? req.user.username : 'N/A', 'Role:', req.user?.role);
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

// --- LOGGING HELPER ---
const logActivity = async (userId, action, targetType = null, targetId = null, details = null) => {
    try {
        const sql = 'INSERT INTO activity_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)';
        const params = [userId, action, targetType, targetId, details ? (typeof details === 'object' ? JSON.stringify(details) : details) : null];
        await db.query(sql, params);
    } catch (err) {
        console.error('FAILED TO LOG ACTIVITY:', err.message);
        // We don't want to crash the request if logging fails, but we should know about it.
    }
};

// --- NOTIFICATION HELPER ---
/**
 * Mengirim notifikasi ke user tertentu via OneSignal dan Expo Push
 * @param {Array|number|null} userIds - ID user (atau null untuk semua)
 * @param {string} message - Isi pesan
 * @param {string} heading - Judul
 * @param {object} data - Data tambahan
 */
const sendUniversalNotification = async (userIds, message, heading, data = {}, excludedUserId = null) => {
    // 1. OneSignal (Existing)
    let normalizedUserIds = userIds ? (Array.isArray(userIds) ? userIds : [userIds]) : null;

    // Filter out the excluded user
    if (normalizedUserIds && excludedUserId) {
        normalizedUserIds = normalizedUserIds.filter(id => id.toString() !== excludedUserId.toString());
    }

    // Don't send if no targets left
    if (normalizedUserIds !== null && normalizedUserIds.length === 0) return;

    sendPushNotification(message, heading, data, normalizedUserIds).catch(e => console.error('OneSignal Error:', e));

    // 2. Expo Push
    try {
        let pushTokens = [];
        if (normalizedUserIds && normalizedUserIds.length > 0) {
            // Ambil token dari DB untuk user ID tertentu
            const [rows] = await db.query('SELECT push_token FROM users WHERE id IN (?) AND push_token IS NOT NULL', [normalizedUserIds]);
            pushTokens = rows.map(r => r.push_token);
        } else {
            // Ambil semua token jika userIds null (Broadcast)
            let sql = "SELECT push_token FROM users WHERE push_token IS NOT NULL";
            let params = [];

            if (data.type === 'new_order') {
                sql = "SELECT push_token FROM users WHERE role IN ('admin', 'penjual', 'owner', 'kasir') AND push_token IS NOT NULL";
            }

            if (excludedUserId) {
                sql += (sql.includes('WHERE') ? ' AND ' : ' WHERE ') + "id != ?";
                params.push(excludedUserId);
            }

            const [rows] = await db.query(sql, params);
            pushTokens = rows.map(r => r.push_token);
        }

        if (pushTokens.length > 0) {
            await sendExpoPushNotification(pushTokens, heading, message, data);
        }
    } catch (e) {
        console.error('Expo Push Helper Error:', e);
    }
};

// --- HELPER UNTUK BASE64 IMAGE UPLOAD ---
const processBase64Image = async (base64String, prefix = 'promo') => {
    if (!base64String || !base64String.startsWith('data:image')) {
        return base64String; // Return as is if not base64 or already a path
    }

    try {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            console.error('Invalid base64 string format');
            return null;
        }

        const extension = matches[1].split('/')[1]; // e.g. 'jpeg', 'png'
        const data = Buffer.from(matches[2], 'base64');
        const fileName = `${prefix}_${Date.now()}.${extension}`;
        const filePath = path.join(__dirname, 'public', 'uploads', fileName);

        fs.writeFileSync(filePath, data);
        return `/public/uploads/${fileName}`;
    } catch (err) {
        console.error('Error processing base64 image:', err);
        return null;
    }
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
        const { name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, purchase_buffer_amount, menu_stock, raw_stock_price } = req.body;
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
            parseFloat(menu_stock) || 0,
            parseFloat(raw_stock_price) || 0 // New field
        );

        // Asumsi result mengandung insertId jika berhasil
        await logActivity(req.user.userId, 'Tambah Bahan', 'raw_material', result.insertId, `Bahan baru: ${name}`);
        res.status(201).json({
            message: "Raw material added successfully",
            data: { id: result.insertId, name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, menu_stock, raw_stock_price },
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
        const { name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, suggestion_purchase_quantity, current_stock, menu_stock, purchase_buffer_amount, raw_stock_price } = req.body;

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
            parseFloat(menu_stock) || 0,
            parseFloat(raw_stock_price) || 0 // New field
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Raw material not found" });
        }
        await logActivity(req.user.userId, 'Suntung Bahan', 'raw_material', id, `Bahan ID ${id} (${name}) diperbarui`);
        res.json({ message: "success", data: { id, name, unit, custom_unit, stok_minimum, price_per_item, standard_stock_per_day, suggestion_purchase_quantity, current_stock, menu_stock, raw_stock_price } });
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
        await logActivity(req.user.userId, 'Hapus Bahan', 'raw_material', id, `Bahan ID ${id} dihapus`);
        res.json({ message: "Raw material and its history deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all material units
app.get("/api/units", authenticateToken, authorizeRoles('admin', 'owner', 'user', 'kasir'), async (req, res) => {
    try {
        const sql = "SELECT * FROM material_units ORDER BY name ASC";
        const [rows] = await db.query(sql);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new material unit
app.post("/api/units", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Unit name is required" });
        }
        const sql = 'INSERT INTO material_units (name) VALUES (?)';
        const [result] = await db.query(sql, [name]);
        await logActivity(req.user.userId, 'Tambah Satuan', 'unit', result.insertId, `Satuan baru: ${name}`);
        res.status(201).json({
            message: "Unit added successfully",
            data: { id: result.insertId, name, is_calculable: true } // Default is true
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Unit name already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update unit calculable status
app.put("/api/units/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const { is_calculable } = req.body;

        const sql = 'UPDATE material_units SET is_calculable = ? WHERE id = ?';
        const [result] = await db.query(sql, [is_calculable, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Unit not found" });
        }

        await logActivity(req.user.userId, 'Update Satuan', 'unit', id, `Status kalkulasi satuan ID ${id} diubah ke ${is_calculable}`);
        res.json({ message: "Unit updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a unit
app.delete("/api/units/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM material_units WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Unit not found" });
        }
        await logActivity(req.user.userId, 'Hapus Satuan', 'unit', id, `Satuan ID ${id} dihapus`);
        res.json({ message: "Unit deleted successfully" });
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

// --- Analytics Breakdown Endpoint ---
app.get("/api/analytics/breakdown", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        let { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "startDate and endDate are required" });
        }

        const [closingRow] = await db.query("SELECT value FROM settings WHERE `key` = 'last_closing_date'");
        const lastClosingDate = closingRow.length > 0 ? closingRow[0].value : null;

        // If lastClosingDate exists and is later than startDate, clamp startDate to it
        if (lastClosingDate) {
            const closingTime = new Date(lastClosingDate).getTime();
            const startReqTime = new Date(`${startDate} 00:00:00`).getTime();
            if (closingTime > startReqTime) {
                startDate = lastClosingDate.split('T')[0];
            }
        }

        // 1. Get Transactions
        const transactionSql = `
            SELECT t.id, t.timestamp, t.items, t.total
            FROM transactions t
            WHERE t.timestamp BETWEEN ? AND ?
            AND (t.payment_method != 'employee_meal' OR t.payment_method IS NULL)
            ORDER BY t.timestamp DESC
        `;
        const [transactions] = await db.query(transactionSql, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);

        // 2. Process Transactions for Item Breakdown
        const itemSales = {}; // { itemId: { name, quantity, revenue } }
        let totalRevenue = 0;

        transactions.forEach(t => {
            totalRevenue += parseFloat(t.total);
            let items = [];
            try {
                // Handle different storage formats just in case
                items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
            } catch (e) {
                console.error("Error parsing items JSON for transaction", t.id, e);
            }

            if (Array.isArray(items)) {
                items.forEach(item => {
                    // Item structure check: usually { id, name, qty, price ... }
                    const id = item.id || item.name; // Fallback to name if id missing
                    const name = item.name;
                    const qty = parseInt(item.qty || item.quantity || 0);
                    const price = parseFloat(item.price || 0);
                    const total = qty * price;

                    if (!itemSales[id]) {
                        itemSales[id] = { name, quantity: 0, revenue: 0 };
                    }
                    itemSales[id].quantity += qty;
                    itemSales[id].revenue += total;
                });
            }
        });

        // Convert object to sorted array
        const topSellingItems = Object.values(itemSales)
            .sort((a, b) => b.quantity - a.quantity); // Sort by quantity desc

        // 3. Get Expenses Aggregated by Category
        const expenseSql = `
            SELECT category, SUM(amount) as total
            FROM expenses
            WHERE date BETWEEN ? AND ?
            GROUP BY category
        `;
        const [expensesByCategory] = await db.query(expenseSql, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);

        // 4. Get Top Expenses Details
        const topExpensesSql = `
             SELECT name, amount, category, date
             FROM expenses
             WHERE date BETWEEN ? AND ?
             ORDER BY amount DESC
             LIMIT 10
        `;
        const [topExpenses] = await db.query(topExpensesSql, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);

        const totalExpense = expensesByCategory.reduce((sum, item) => sum + parseFloat(item.total), 0);

        // 5. Calculate Payment Method Stats (Initiative)
        const paymentMethodSql = `
            SELECT payment_method, COUNT(*) as count, SUM(total) as total
            FROM transactions
            WHERE timestamp BETWEEN ? AND ?
            GROUP BY payment_method
        `;
        const [paymentMethods] = await db.query(paymentMethodSql, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);


        res.json({
            message: "success",
            data: {
                period: { startDate, endDate },
                summary: {
                    totalRevenue,
                    totalExpense,
                    netIncome: totalRevenue - totalExpense
                },
                sales: {
                    topSellingItems,
                    totalTransactions: transactions.length,
                    paymentMethods
                },
                expenses: {
                    byCategory: expensesByCategory,
                    topExpenses,
                    total: totalExpense
                }
            }
        });

    } catch (err) {
        console.error("Error in analytics breakdown:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- Cash Reconciliations Endpoints ---
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
        await logActivity(req.user.userId, 'Tambah Resep', 'recipe', result.insertId, `Tambah bahan mentah ID ${raw_material_id} ke menu ${menu_item_id}`);
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
        await logActivity(req.user.userId, 'Hapus Resep', 'recipe', id, `Resep ID ${id} dihapus`);
        res.json({ message: "Menu recipe deleted successfully" });
    } catch (err) {
        console.error("Error deleting menu recipe:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- Menu Items Endpoints ---

// Get all menu items with pagination and category filtering
app.get("/api/menu-items", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'pelanggan', 'penjual'), async (req, res) => {
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
                ) AS options,
                (SELECT COALESCE(AVG(rating), 0) FROM menu_reviews WHERE menu_item_id = mi.id) as average_rating,
                (SELECT COUNT(*) FROM menu_reviews WHERE menu_item_id = mi.id) as total_reviews
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
app.get("/api/menu-items/all", authenticateToken, authorizeRoles('user', 'admin', 'kasir', 'owner', 'penjual'), async (req, res) => {
    try {
        const sql = `
            SELECT 
                mi.*,
                COALESCE(opt.options_json, '[]') AS options,
                COALESCE(rev.average_rating, 0) AS average_rating,
                COALESCE(rev.total_reviews, 0) AS total_reviews
            FROM menu_items mi
            LEFT JOIN (
                SELECT 
                    menu_item_id, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', id, 
                            'name', name, 
                            'price_adjustment', price_adjustment
                        )
                    ) AS options_json
                FROM menu_item_options
                GROUP BY menu_item_id
            ) opt ON mi.id = opt.menu_item_id
            LEFT JOIN (
                SELECT 
                    menu_item_id, 
                    AVG(rating) as average_rating, 
                    COUNT(*) as total_reviews 
                FROM menu_reviews 
                GROUP BY menu_item_id
            ) rev ON mi.id = rev.menu_item_id
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

// PUBLIC: Get all menu items for landing page (No Auth)
app.get("/api/public/menu-items", async (req, res) => {
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
                ) AS options,
                (SELECT COALESCE(AVG(rating), 0) FROM menu_reviews WHERE menu_item_id = mi.id) as average_rating,
                (SELECT COUNT(*) FROM menu_reviews WHERE menu_item_id = mi.id) as total_reviews
            FROM menu_items mi
            ORDER BY mi.order_index ASC;
        `;
        const [rows] = await db.query(sql);

        // Parse the options string for each item
        const data = rows.map(row => ({
            ...row,
            options: JSON.parse(row.options)
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
app.post("/api/menu-items", authenticateToken, authorizeRoles('user', 'admin', 'penjual'), upload.single('image'), async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let itemData;
        // Handle both JSON and FormData formats
        if (req.body.data) {
            itemData = JSON.parse(req.body.data);
        } else {
            itemData = req.body;
        }

        const { id, name, price, stock, category, hpp, discount, is_featured, options, description } = itemData;
        const image_url = req.file ? `/public/uploads/${req.file.filename}` : null;
        const final_is_featured = is_featured ? 1 : 0;

        const menuItemSql = 'INSERT INTO menu_items (id, name, price, stock, category, image_url, hpp, discount, is_featured, description) VALUES (?,?,?,?,?,?,?,?,?,?)';
        const menuItemParams = [id, name, price, stock, category, image_url, hpp, discount, final_is_featured, description || null];
        const [rows] = await connection.query(menuItemSql, menuItemParams); // Need result for consistency, although ID is manually provided in this app logic usually

        if (options && Array.isArray(options) && options.length > 0) {
            const optionSql = 'INSERT INTO menu_item_options (menu_item_id, name, price_adjustment) VALUES ?';
            const optionValues = options.map(opt => [id, opt.name, opt.price_adjustment || 0]);
            await connection.query(optionSql, [optionValues]);
        }

        await connection.commit();

        await logActivity(req.user.userId, 'Tambah Menu', 'menu_item', id, `Menu baru: ${name}`);

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
app.put('/api/menu-items/reorder', authenticateToken, authorizeRoles('admin', 'penjual'), async (req, res) => {
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
app.put("/api/menu-items/:id", authenticateToken, authorizeRoles('user', 'admin', 'penjual'), upload.single('image'), async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();
        await connection.beginTransaction();

        let itemData;
        let new_image_url = null;

        // Handle both JSON and FormData formats
        if (req.body.data) {
            itemData = JSON.parse(req.body.data);
        } else {
            itemData = req.body;
        }

        if (req.file) {
            new_image_url = `/public/uploads/${req.file.filename}`;
        }

        // Dynamically build the update query
        const updateFields = {};
        const params = [];

        // List of allowed fields to update
        const allowedFields = ['name', 'price', 'stock', 'category', 'hpp', 'discount', 'is_featured', 'description'];

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

        await logActivity(req.user.userId, 'Edit Menu', 'menu_item', id, `Menu ID ${id} diperbarui`);

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
app.delete("/api/menu-items/:id", authenticateToken, authorizeRoles('user', 'admin', 'penjual'), async (req, res, next) => {
    try {
        const sql = 'DELETE FROM menu_items WHERE id = ?';
        const [result] = await db.query(sql, [req.params.id]);

        await logActivity(req.user.userId, 'Hapus Menu', 'menu_item', req.params.id, `Menu ID ${req.params.id} dihapus`);

        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// --- Menu Reviews Endpoints ---
app.post("/api/menu-reviews", authenticateToken, authorizeRoles('pelanggan', 'user', 'admin'), async (req, res) => {
    try {
        const { menu_item_id, order_id, rating, comment } = req.body;
        const user_id = req.user.userId;

        if (!menu_item_id || !rating) {
            return res.status(400).json({ error: "menu_item_id and rating are required" });
        }

        const sql = `
            INSERT INTO menu_reviews (menu_item_id, user_id, order_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)
        `;

        await db.query(sql, [menu_item_id, user_id, order_id || null, rating, comment || null]);

        await logActivity(user_id, 'Beri Ulasan', 'menu_item', menu_item_id, `Rating ${rating} untuk menu ${menu_item_id}`);

        res.status(201).json({ message: "success", data: { menu_item_id, rating, comment } });
    } catch (err) {
        console.error("Error submitting review:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get reviews for a specific menu item
app.get("/api/menu-reviews/:menu_item_id", async (req, res) => {
    try {
        const { menu_item_id } = req.params;
        const sql = `
            SELECT r.*, u.username 
            FROM menu_reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.menu_item_id = ?
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.query(sql, [menu_item_id]);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Categories Endpoints ---
app.get("/api/categories", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'pelanggan', 'penjual'), async (req, res) => {
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
app.post("/api/categories", authenticateToken, authorizeRoles('user', 'admin', 'penjual'), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ "error": "Category name is required" });
        }
        const sql = 'INSERT INTO categories (name) VALUES (?)';
        const [result] = await db.query(sql, [name]);

        await logActivity(req.user.userId, 'Tambah Kategori', 'category', result.insertId, `Kategori baru: ${name}`);

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
app.put("/api/categories/:id", authenticateToken, authorizeRoles('user', 'admin', 'penjual'), async (req, res) => {
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
app.delete("/api/categories/:id", authenticateToken, authorizeRoles('user', 'admin', 'penjual'), async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Get the category name before deleting it
        const [categoryRows] = await connection.query('SELECT name FROM categories WHERE id = ?', [id]);
        if (categoryRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ "error": "Category not found" });
        }
        const categoryName = categoryRows[0].name;

        // 2. Update all menu items that use this category to "Lainnya"
        await connection.query('UPDATE menu_items SET category = ? WHERE category = ?', ['Lainnya', categoryName]);

        // 3. Delete the category
        const [result] = await connection.query('DELETE FROM categories WHERE id = ?', [id]);

        await connection.commit();
        res.json({ message: "deleted", changes: result.affectedRows, affectedMenuItems: true });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(400).json({ "error": err.message });
    } finally {
        if (connection) connection.release();
    }
});

// --- Banners Endpoints ---

// Get all active banners
app.get("/api/banners", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'pelanggan', 'penjual'), async (req, res) => {
    try {
        const sql = "SELECT * FROM banners WHERE is_active = TRUE ORDER BY created_at DESC";
        const [rows] = await db.query(sql);
        res.json({ "message": "success", "data": rows });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get all banners (for management)
app.get("/api/banners/all", authenticateToken, authorizeRoles('admin', 'penjual'), async (req, res) => {
    try {
        const sql = "SELECT * FROM banners ORDER BY created_at DESC";
        const [rows] = await db.query(sql);
        res.json({ "message": "success", "data": rows });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Add a new banner
app.post("/api/banners", authenticateToken, authorizeRoles('admin', 'penjual'), upload.single('image'), async (req, res) => {
    try {
        let bannerData;

        // Selalu prioritaskan field 'data' jika ada, karena Frontend mengirim FormData dengan JSON string di dalamnya
        if (req.body.data) {
            try {
                bannerData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
            } catch (err) {
                console.error("Gagal parse req.body.data:", err);
                bannerData = req.body;
            }
        } else {
            bannerData = req.body;
        }

        const { title, subtitle, color_class, icon_name, link_url, is_active } = bannerData;

        // Validasi field wajib
        if (!title) {
            return res.status(400).json({ "error": "Judul banner (title) wajib diisi" });
        }

        const image_url = req.file ? `/public/uploads/${req.file.filename}` : null;
        const final_is_active = is_active !== undefined ? (is_active ? 1 : 0) : 1;

        const sql = 'INSERT INTO banners (title, subtitle, image_url, color_class, icon_name, link_url, is_active) VALUES (?,?,?,?,?,?,?)';
        const [result] = await db.query(sql, [title, subtitle || '', image_url, color_class, icon_name, link_url || '', final_is_active]);

        await logActivity(req.user.userId, 'Tambah Banner', 'banner', result.insertId, `Banner baru: ${title}`);

        res.status(201).json({
            "message": "success",
            "data": { id: result.insertId, ...bannerData, image_url, is_active: final_is_active }
        });
    } catch (err) {
        console.error("Error adding banner:", err);
        res.status(400).json({ "error": err.message });
    }
});

// Update a banner
app.put("/api/banners/:id", authenticateToken, authorizeRoles('admin', 'penjual'), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        let bannerData;

        // Use same logic as POST for data parsing
        if (req.body.data) {
            try {
                bannerData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
            } catch (err) {
                console.error("Gagal parse req.body.data in PUT:", err);
                bannerData = req.body;
            }
        } else {
            bannerData = req.body;
        }

        const { title, subtitle, color_class, icon_name, link_url, is_active } = bannerData;
        const final_is_active = is_active !== undefined ? (is_active ? 1 : 0) : 1;

        let sql = 'UPDATE banners SET title = ?, subtitle = ?, color_class = ?, icon_name = ?, link_url = ?, is_active = ?';
        let params = [title, subtitle || '', color_class, icon_name, link_url || '', final_is_active];

        if (req.file) {
            const image_url = `/public/uploads/${req.file.filename}`;
            sql += ', image_url = ?';
            params.push(image_url);
        }

        sql += ' WHERE id = ?';
        params.push(id);

        await db.query(sql, params);
        await logActivity(req.user.userId, 'Update Banner', 'banner', id, `Banner ID ${id} diperbarui`);
        res.json({
            "message": "success",
            "data": { id, ...bannerData, is_active: final_is_active }
        });
    } catch (err) {
        console.error("Error updating banner:", err);
        res.status(400).json({ "error": err.message });
    }
});

// Delete a banner
app.delete("/api/banners/:id", authenticateToken, authorizeRoles('admin', 'penjual'), async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM banners WHERE id = ?';
        await db.query(sql, [id]);
        await logActivity(req.user.userId, 'Hapus Banner', 'banner', id, `Banner ID ${id} dihapus`);
        res.json({ "message": "success" });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// --- Expense Categories Endpoints ---

// Get all expense categories
app.get("/api/expense-categories", authenticateToken, authorizeRoles('user', 'admin', 'kasir', 'owner', 'penjual', 'guest'), async (req, res) => {
    try {
        // Get categories from fixed table
        const [categoryRows] = await db.query("SELECT name FROM expense_categories ORDER BY name ASC");
        let categoriesFromTable = categoryRows.map(r => r.name);

        // Get categories from expenses table
        const [expenseRows] = await db.query('SELECT DISTINCT category FROM expenses WHERE category IS NOT NULL AND category != ""');
        let categoriesFromExpenses = expenseRows.map(r => r.category);

        // Merge and unique
        const allUniqueNames = [...new Set([...categoriesFromTable, ...categoriesFromExpenses])].sort();

        // Convert back to object format for web compatibility
        const finalData = allUniqueNames.map(name => ({ name }));

        res.json({
            "message": "success",
            "data": finalData
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Add a new expense category
app.post("/api/expense-categories", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ "error": "Expense Category name is required" });
        }
        const sql = 'INSERT INTO expense_categories (name) VALUES (?)';
        const [result] = await db.query(sql, [name]);
        await logActivity(req.user.userId, 'Tambah Kategori Biaya', 'category', result.insertId, `Kategori biaya baru: ${name}`);
        res.status(201).json({
            "message": "success",
            "data": { id: result.insertId, name },
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Expense Category name already exists" });
        }
        res.status(400).json({ "error": err.message });
    }
});

// Update an expense category
app.put("/api/expense-categories/:id", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;
        if (!name) {
            return res.status(400).json({ "error": "Expense Category name is required" });
        }
        const sql = 'UPDATE expense_categories SET name = ? WHERE id = ?';
        const [result] = await db.query(sql, [name, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Expense Category not found" });
        }
        await logActivity(req.user.userId, 'Update Kategori Biaya', 'category', id, `Kategori biaya ID ${id} diubah ke ${name}`);
        res.json({
            "message": "success",
            "data": { id, name },
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Expense Category name already exists" });
        }
        res.status(400).json({ "error": err.message });
    }
});

// Delete an expense category
app.delete("/api/expense-categories/:id", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Get the category name before deleting it
        const [categoryRows] = await connection.query('SELECT name FROM expense_categories WHERE id = ?', [id]);
        if (categoryRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ "error": "Expense Category not found" });
        }
        const categoryName = categoryRows[0].name;

        // 2. Update all expenses that use this category to "Tanpa Kategori"
        await connection.query('UPDATE expenses SET category = ? WHERE category = ?', ['Tanpa Kategori', categoryName]);

        // 3. Delete the category from expense_categories
        const [deleteResult] = await connection.query('DELETE FROM expense_categories WHERE id = ?', [id]);

        await connection.commit();
        await logActivity(req.user.userId, 'Hapus Kategori Biaya', 'category', id, `Kategori biaya ID ${id} dihapus`);
        res.json({ message: "success", deletedId: id, affectedExpenses: true });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(400).json({ "error": err.message });
    } finally {
        if (connection) connection.release();
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
app.put('/api/settings/:key', authenticateToken, authorizeRoles('admin', 'user', 'owner', 'kasir'), async (req, res) => {
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
        const sql = "SELECT restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock FROM app_settings ORDER BY id LIMIT 1";
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
                "data": {
                    restaurant_name: 'Trz Kasir Apps',
                    restaurant_slogan: 'Aplikasi kasir modern cepat dan keren',
                    restaurant_url: 'www.berkah88.id',
                    owner_phone: null,
                    show_stock_alert: 1,
                    is_open: 1,
                    ignore_stock: 0
                }
            });
        }
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Update restaurant settings (admin only)
app.put('/api/restaurant-settings', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock } = req.body;
        if (!restaurant_name || !restaurant_slogan) {
            return res.status(400).json({ "error": "Restaurant name and slogan are required." });
        }

        const sql = `UPDATE app_settings SET restaurant_name = ?, restaurant_slogan = ?, restaurant_url = ?, owner_phone = ?, show_stock_alert = ?, is_open = ?, ignore_stock = ? WHERE id = (SELECT id FROM (SELECT id FROM app_settings ORDER BY id LIMIT 1) as t)`;
        const params = [
            restaurant_name,
            restaurant_slogan,
            restaurant_url || 'www.berkah88.id',
            owner_phone || null,
            show_stock_alert !== undefined ? show_stock_alert : 1,
            is_open !== undefined ? is_open : 1,
            ignore_stock !== undefined ? ignore_stock : 0
        ];
        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            // If no rows were affected, it might mean no settings exist yet. Insert them.
            const insertSql = 'INSERT INTO app_settings (restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock, og_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            await db.query(insertSql, [...params, 'Kasir Berkah 88']);
            res.json({ message: "Restaurant settings inserted successfully!", data: { restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock } });
        } else {
            res.json({ message: "Restaurant settings updated successfully!", data: { restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock } });
        }

    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Toggle Ignore Stock status (admin)
app.patch('/api/restaurant-settings/ignore-stock', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { ignore_stock } = req.body;
        if (ignore_stock === undefined) {
            return res.status(400).json({ error: "ignore_stock status is required" });
        }

        const sql = `UPDATE app_settings SET ignore_stock = ? WHERE id = (SELECT id FROM (SELECT id FROM app_settings ORDER BY id LIMIT 1) as t)`;
        await db.query(sql, [ignore_stock ? 1 : 0]);

        res.json({ message: `Abaikan Stok berhasil ${ignore_stock ? 'diaktifkan' : 'dinonaktifkan'}`, data: { ignore_stock } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Shop Open/Close status (admin or penjual)
app.patch('/api/restaurant-settings/status', authenticateToken, authorizeRoles('admin', 'penjual'), async (req, res) => {
    try {
        const { is_open } = req.body;
        if (is_open === undefined) {
            return res.status(400).json({ error: "is_open status is required" });
        }

        const sql = `UPDATE app_settings SET is_open = ? WHERE id = (SELECT id FROM (SELECT id FROM app_settings ORDER BY id LIMIT 1) as t)`;
        await db.query(sql, [is_open ? 1 : 0]);

        res.json({ message: `Shop successfully ${is_open ? 'opened' : 'closed'}`, data: { is_open } });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
app.get("/api/transactions", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'owner', 'penjual'), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const { startDate, endDate, paymentMethod, minTotal, maxTotal, search } = req.query; // Extract paymentMethod and Amount Range
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
            if (paymentMethod === 'employee_meal') {
                // Handle Employee Meal special case
                whereClauses.push('(t.isEmployeeMeal = 1 OR t.payment_method = "employee_meal")');
            } else if (paymentMethod.toLowerCase() === 'tunai' || paymentMethod.toLowerCase() === 'cash') {
                // Handle Tunai/Cash unification
                whereClauses.push('LOWER(t.payment_method) IN ("cash", "tunai")');
            } else {
                whereClauses.push('t.payment_method = ?');
                queryParams.push(paymentMethod);
            }
        }

        // Amount Filtering
        if (minTotal) {
            whereClauses.push('t.total >= ?');
            queryParams.push(minTotal);
        }
        if (maxTotal) {
            whereClauses.push('t.total <= ?');
            queryParams.push(maxTotal);
        }

        // Search Filtering
        if (search) {
            whereClauses.push('(t.id LIKE ? OR t.items LIKE ? OR t.customer_name LIKE ? OR t.customer_phone LIKE ? OR t.customer_address LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // Query to get total count and total amount
        const countSql = `SELECT COUNT(*) as totalItems, SUM(total) as totalAmount FROM transactions t ${whereSql}`;
        const [countRows] = await db.query(countSql, queryParams);
        const totalItems = countRows[0].totalItems;
        const totalAmount = countRows[0].totalAmount || 0;
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
                "totalAmount": totalAmount,
                "limit": limit
            }
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get all transactions without pagination (for all-time metrics)
app.get("/api/transactions/all", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'owner', 'penjual'), async (req, res, next) => {
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
            } else if (paymentMethod.toLowerCase() === 'tunai' || paymentMethod.toLowerCase() === 'cash') {
                // Handle Tunai/Cash unification
                whereClauses.push('LOWER(t.payment_method) IN ("cash", "tunai")');
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
app.get("/api/transactions/daily-recap", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'owner', 'penjual'), async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ "error": "Date parameter is required" });
        }

        const startDate = `${date} 00:00:00`;
        const endDate = `${date} 23:59:59`;

        const sql = `
            SELECT
                COALESCE(SUM(CASE WHEN LOWER(payment_method) IN ('cash', 'tunai') OR payment_method IS NULL THEN total ELSE 0 END), 0) as total_tunai,
                COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'transfer' THEN total ELSE 0 END), 0) as total_transfer,
                COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'gojek' THEN total ELSE 0 END), 0) as total_gojek,
                COALESCE(SUM(CASE WHEN isEmployeeMeal = 1 OR LOWER(payment_method) IN ('employee_meal', 'makan karyawan') THEN total ELSE 0 END), 0) as total_makan_karyawan,
                COALESCE(SUM(total), 0) as grand_total
            FROM transactions
            WHERE timestamp >= ? AND timestamp <= ? AND deleted_at IS NULL
        `;

        const [rows] = await db.query(sql, [startDate, endDate]);

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



// Search customers for POS
app.get("/api/customers/search", authenticateToken, authorizeRoles('user', 'admin', 'kasir', 'owner'), async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json({ message: "success", data: [] });

        // Search by name or phone
        const sql = "SELECT id, username as name, phone, points, address FROM users WHERE role = 'pelanggan' AND (username LIKE ? OR phone LIKE ?) LIMIT 10";
        const [rows] = await db.query(sql, [`%${query}%`, `%${query}%`]);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all customers with stats
app.get("/api/customers", authenticateToken, authorizeRoles('user', 'admin', 'kasir', 'owner', 'penjual'), async (req, res) => {
    try {
        const { search, limit = 50, offset = 0 } = req.query;

        let conditions = ["u.role = 'pelanggan'"];
        const params = [];

        if (search) {
            conditions.push("(u.username LIKE ? OR u.phone LIKE ?)");
            params.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";

        // Query with subqueries/joins can be tricky depending on MySQL version for aggregate + limit.
        // Using a simpler approach:
        const sql = `
            SELECT 
                u.id, 
                u.username, 
                u.phone, 
                u.address, 
                u.points, 
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.total), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
            ${whereClause}
            GROUP BY u.id, u.username, u.phone, u.address, u.points
            ORDER BY u.id DESC 
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(sql, params);
        res.json({ message: "success", data: rows });
    } catch (err) {
        console.error("Error fetching customers:", err);
        res.status(500).json({ error: err.message });
    }
});


// Create a new transaction
app.post("/api/transactions", authenticateToken, authorizeRoles('user', 'admin', 'kasir', 'pelanggan', 'owner', 'penjual'), async (req, res, next) => {
    let connection;
    try {
        const { items, total: frontendTotal, ppn: frontendPpn, cashPaid, change, isEmployeeMeal, payment_method, manual_discount, catatan, customer_name, customer_phone, customer_address, customerId, pointsUsed } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ "error": "No items specified" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const { ignoreStock: reqIgnoreStock } = req.body;

        // Get global ignore_stock setting as fallback
        const [settingsRows] = await connection.query('SELECT ignore_stock FROM app_settings ORDER BY id LIMIT 1');
        const globalIgnoreStock = settingsRows.length > 0 ? !!settingsRows[0].ignore_stock : false;

        // If ignoreStock is passed in body, it takes precedence, otherwise use global setting.
        const effectivelyIgnoreStock = reqIgnoreStock !== undefined ? reqIgnoreStock : globalIgnoreStock;

        if (!effectivelyIgnoreStock) {
            // --- STOCK VALIDATION BEFORE TRANSACTION (WITH LOCK) ---
            for (const cartItem of items) {
                const [rows] = await connection.query('SELECT stock FROM menu_items WHERE id = ? FOR UPDATE', [cartItem.id]);
                if (rows.length === 0) {
                    await connection.rollback();
                    return res.status(400).json({ "error": `Item with ID ${cartItem.id} not found.` });
                }
                const currentStock = rows[0].stock;
                if (cartItem.quantity > currentStock) {
                    await connection.rollback();
                    return res.status(400).json({ "error": `Insufficient stock for item ${cartItem.id}. Available: ${currentStock}, Requested: ${cartItem.quantity}` });
                }
            }
        }

        // --- Generate New Transaction ID (INSIDE TRANSACTION) ---
        let newTransactionId;
        const [lastTransactionRows] = await connection.query("SELECT id FROM transactions WHERE id LIKE 'TRZ%' ORDER BY id DESC LIMIT 1 FOR UPDATE");

        if (lastTransactionRows && lastTransactionRows.length > 0) {
            const lastId = lastTransactionRows[0].id;
            const lastNumber = parseInt(lastId.substring(3), 10);
            if (!isNaN(lastNumber)) {
                newTransactionId = 'TRZ' + (lastNumber + 1).toString().padStart(3, '0');
            } else {
                newTransactionId = 'TRZ001';
            }
        } else {
            newTransactionId = 'TRZ001';
        }

        let calculatedSubtotal = 0;
        const itemsWithDetails = items.map(item => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            calculatedSubtotal += price * quantity;
            return { ...item, price: price, quantity: quantity };
        });

        // Ensure manual_discount is treated as a number
        const manualDiscountVal = parseFloat(manual_discount || 0);
        const subtotalAfterManualDiscount = Math.max(0, calculatedSubtotal - manualDiscountVal);

        const [ppnSetting] = await connection.query("SELECT value FROM settings WHERE `key` = ?", ['ppn']);
        const ppnRate = ppnSetting.length > 0 ? parseFloat(ppnSetting[0].value) : 0.12;

        // PPN is calculated after manual discount
        const calculatedPpn = subtotalAfterManualDiscount * ppnRate;
        const calculatedTotal = subtotalAfterManualDiscount + calculatedPpn;

        const finalTotal = (frontendTotal !== undefined && frontendTotal !== null && !isNaN(parseFloat(frontendTotal)))
            ? parseFloat(frontendTotal)
            : calculatedTotal;

        const finalPpnAmount = isNaN(calculatedPpn) ? 0 : calculatedPpn;

        const timestamp = new Date();
        const serializedItems = JSON.stringify(itemsWithDetails);
        const finalIsEmployeeMeal = isEmployeeMeal ? 1 : 0;
        const finalIgnoreStock = effectivelyIgnoreStock ? 1 : 0;
        const finalPaymentMethod = payment_method || 'tunai';
        const finalUserId = req.user ? req.user.userId : null;

        // --- Points Logic ---
        let finalPointsUsed = 0;
        let finalPointsEarned = 0;
        let finalCustomerId = null;

        if (customerId) {
            // Validate customer exists and lock row
            const [userRows] = await connection.query("SELECT id, points FROM users WHERE id = ? FOR UPDATE", [customerId]);
            if (userRows.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: "Customer not found." });
            }

            finalCustomerId = userRows[0].id;
            const currentPoints = parseFloat(userRows[0].points || 0);

            // Deduct points if used
            if (pointsUsed && pointsUsed > 0) {
                finalPointsUsed = parseFloat(pointsUsed);
                if (currentPoints < finalPointsUsed) {
                    await connection.rollback();
                    return res.status(400).json({ error: "Insufficient points balance." });
                }
            }

            // Calculate Earned Points (1% of Total - Discount + PPN, basically Amount Paid)
            // Or usually points logic is based on Subtotal before tax, or Grand Total.
            // Let's use Grand Total minus Points Used (Amount actually paid in cash/transfer).
            const amountPaidCompatible = finalTotal - finalPointsUsed;
            // 1% cashback
            finalPointsEarned = Math.floor(amountPaidCompatible * 0.01);

            const newBalance = currentPoints - finalPointsUsed + finalPointsEarned;

            // Update User Points
            await connection.query("UPDATE users SET points = ? WHERE id = ?", [newBalance, finalCustomerId]);
        }

        const promoDiscountVal = parseFloat(req.body.promo_discount || 0);

        const sql = 'INSERT INTO transactions (id, timestamp, items, total, ppn, isEmployeeMeal, payment_method, ignore_stock, cash_paid, `change`, user_id, manual_discount, catatan, customer_name, customer_phone, customer_address, customer_id, points_used, points_earned, promo_discount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
        const params = [
            newTransactionId,
            timestamp,
            serializedItems,
            finalTotal.toFixed(2),
            finalPpnAmount.toFixed(2),
            finalIsEmployeeMeal,
            finalPaymentMethod,
            finalIgnoreStock,
            parseFloat(cashPaid || 0).toFixed(2),
            parseFloat(change || 0).toFixed(2),
            finalUserId,
            parseFloat(manual_discount || 0).toFixed(2),
            catatan || null,
            customer_name || null,
            customer_phone || null,
            customer_address || null,
            finalCustomerId,
            finalPointsUsed.toFixed(2),
            finalPointsEarned.toFixed(2),
            promoDiscountVal
        ];

        await connection.query(sql, params);

        // Stock should always be reduced, even if ignoring stock for validation
        for (const item of itemsWithDetails) {
            await connection.query('UPDATE menu_items SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
        }

        // --- Points Awarding Logic ---
        // Award points to the user who made the transaction (if they are a customer)
        try {
            const [pointSettingRows] = await connection.query("SELECT value FROM settings WHERE `key` = 'point_system_enabled'");
            const pointSystemEnabled = pointSettingRows.length > 0 ? pointSettingRows[0].value === '1' : true;

            if (pointSystemEnabled) {
                let pointsAwarded = false;

                // Priority 1: Check if logged-in user is a customer
                if (finalUserId) {
                    console.log(`[POINTS] Checking points for logged-in user ID: ${finalUserId}`);

                    const [userRows] = await connection.query('SELECT id, points, username, role FROM users WHERE id = ?', [finalUserId]);

                    if (userRows.length > 0 && userRows[0].role === 'pelanggan') {
                        const customerId = userRows[0].id;
                        const customerName = userRows[0].username;
                        console.log(`[POINTS] ✓ User is a customer: ${customerName} (ID: ${customerId})`);

                        const [pointsSetting] = await connection.query("SELECT value FROM settings WHERE `key` = ?", ['points_per_item']);
                        const pointsPerItem = pointsSetting.length > 0 ? parseFloat(pointsSetting[0].value) : 100;

                        const totalItemsCount = itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);
                        const pointsEarned = totalItemsCount * pointsPerItem;

                        console.log(`[POINTS] Calculation: ${totalItemsCount} items × ${pointsPerItem} = ${pointsEarned} points`);

                        if (pointsEarned > 0) {
                            await connection.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsEarned, customerId]);
                            await connection.query(
                                'INSERT INTO points_history (user_id, transaction_id, amount, type, description) VALUES (?, ?, ?, ?, ?)',
                                [customerId, newTransactionId, pointsEarned, 'earn', `Beli ${totalItemsCount} item`]
                            );
                            console.log(`[POINTS] ✅ Awarded ${pointsEarned} points to ${customerName}`);
                            pointsAwarded = true;
                        }
                    } else if (userRows.length > 0) {
                        console.log(`[POINTS] ⚠️ User is not a customer (role: ${userRows[0].role})`);
                    }
                }

                // Priority 2: If no points awarded yet and customer_phone provided, try to find customer by phone
                if (!pointsAwarded && customer_phone) {
                    console.log(`[POINTS] Checking customer by phone: ${customer_phone}`);

                    const [customerRows] = await connection.query('SELECT id, points, username, role FROM users WHERE phone = ? AND role = "pelanggan"', [customer_phone]);

                    if (customerRows.length > 0) {
                        const customerId = customerRows[0].id;
                        const customerName = customerRows[0].username;
                        console.log(`[POINTS] ✓ Found customer by phone: ${customerName} (ID: ${customerId})`);

                        const [pointsSetting] = await connection.query("SELECT value FROM settings WHERE `key` = ?", ['points_per_item']);
                        const pointsPerItem = pointsSetting.length > 0 ? parseFloat(pointsSetting[0].value) : 100;

                        const totalItemsCount = itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);
                        const pointsEarned = totalItemsCount * pointsPerItem;

                        console.log(`[POINTS] Calculation: ${totalItemsCount} items × ${pointsPerItem} = ${pointsEarned} points`);

                        if (pointsEarned > 0) {
                            await connection.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsEarned, customerId]);
                            await connection.query(
                                'INSERT INTO points_history (user_id, transaction_id, amount, type, description) VALUES (?, ?, ?, ?, ?)',
                                [customerId, newTransactionId, pointsEarned, 'earn', `Beli ${totalItemsCount} item`]
                            );
                            console.log(`[POINTS] ✅ Awarded ${pointsEarned} points to ${customerName} (via phone)`);
                            pointsAwarded = true;
                        }
                    } else {
                        console.log(`[POINTS] ⚠️ No customer found with phone: ${customer_phone}`);
                    }
                }

                if (!pointsAwarded) {
                    console.log(`[POINTS] ℹ️ No points awarded for this transaction`);
                }
            } else {
                console.log(`[POINTS] ℹ️ Point system is DISABLED`);
            }
        } catch (pointsError) {
            console.error(`[POINTS] ❌ Error in points logic:`, pointsError);
            // Don't fail the transaction if points fail - just log the error
        }
        // --- End Points Logic ---

        await connection.commit();

        await logActivity(finalUserId, 'Membuat Transaksi', 'transaction', newTransactionId, `Transaksi baru ${newTransactionId} senilai Rp ${parseFloat(finalTotal).toLocaleString('id-ID')}`);

        // Emit Socket Event for Real-time Updates
        const io = req.app.get('io');
        if (io) {
            io.emit('new_order', {
                id: newTransactionId,
                total: finalTotal,
                timestamp: timestamp,
                items: itemsWithDetails,
                status: 'completed', // Transactions are instantly completed
                payment_method: finalPaymentMethod,
                is_transaction: true // Marker so frontend knows it's a direct transaction
            });
        }

        res.json({
            "message": "success",
            "data": {
                id: newTransactionId,
                timestamp,
                items: itemsWithDetails,
                total: finalTotal,
                payment_method: finalPaymentMethod,
                cash_paid: parseFloat(cashPaid || 0),
                change: parseFloat(change || 0),
                manual_discount: parseFloat(manual_discount || 0),
                catatan: catatan || null
            },
            "id": newTransactionId
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Transaction Error:", err);
        const errorLog = `\n--- TRANSACTION ERROR ---\nTime: ${new Date().toISOString()}\nError: ${err.message}\nStack: ${err.stack}\n-------------------------\n`;
        try {
            fs.appendFileSync(path.join(__dirname, 'error.log'), errorLog);
        } catch (e) { }
        res.status(400).json({ "error": err.message });
    } finally {
        if (connection) connection.release();
    }
});

// --- Point Settings Endpoints ---
app.get("/api/point-settings", authenticateToken, authorizeRoles('admin', 'owner', 'penjual'), async (req, res) => {
    try {
        const [rows] = await db.query("SELECT `key`, `value` FROM settings WHERE `key` IN ('points_per_item', 'point_system_enabled')");
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json({ message: "success", data: settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/point-settings", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { points_per_item, point_system_enabled } = req.body;

        if (points_per_item !== undefined) {
            await db.query("INSERT INTO settings (`key`, `value`) VALUES ('points_per_item', ?) ON DUPLICATE KEY UPDATE `value` = ?", [points_per_item.toString(), points_per_item.toString()]);
        }

        if (point_system_enabled !== undefined) {
            await db.query("INSERT INTO settings (`key`, `value`) VALUES ('point_system_enabled', ?) ON DUPLICATE KEY UPDATE `value` = ?", [point_system_enabled ? '1' : '0', point_system_enabled ? '1' : '0']);
        }

        await logActivity(req.user.userId, 'Update Pengaturan Poin', 'settings', 'points', `Mengubah pengaturan poin: Aktif=${point_system_enabled}, Poin per item=${points_per_item}`);

        res.json({ message: "Pengaturan poin berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Customer Points Endpoints ---
app.get("/api/customer/points", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT points FROM users WHERE id = ?", [req.user.userId]);
        if (rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "success", data: { points: rows[0].points || 0 } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Update a transaction
app.put("/api/transactions/:id", authenticateToken, authorizeRoles('user', 'admin', 'kasir'), async (req, res, next) => {
    try {
        const { total, ppn, isEmployeeMeal, payment_method, timestamp, manual_discount, catatan, items, customer_name, customer_phone, customer_address } = req.body;
        const { id } = req.params;

        const sql = `UPDATE transactions SET 
           \`total\` = COALESCE(?, \`total\`), 
           \`ppn\` = COALESCE(?, \`ppn\`), 
           \`isEmployeeMeal\` = COALESCE(?, \`isEmployeeMeal\`), 
           \`payment_method\` = COALESCE(?, \`payment_method\`),
           \`timestamp\` = COALESCE(?, \`timestamp\`),
           \`manual_discount\` = COALESCE(?, \`manual_discount\`),
           \`catatan\` = COALESCE(?, \`catatan\`),
           \`items\` = COALESCE(?, \`items\`),
           \`cash_paid\` = COALESCE(?, \`cash_paid\`),
           \`change\` = COALESCE(?, \`change\`),
           \`customer_name\` = COALESCE(?, \`customer_name\`),
           \`customer_phone\` = COALESCE(?, \`customer_phone\`),
           \`customer_address\` = COALESCE(?, \`customer_address\`),
           \`customer_id\` = COALESCE(?, \`customer_id\`)
           WHERE id = ? AND deleted_at IS NULL`;

        const params = [
            total,
            ppn,
            isEmployeeMeal !== undefined ? (isEmployeeMeal ? 1 : 0) : null,
            payment_method,
            timestamp ? timestamp : null,
            manual_discount,
            catatan,
            items ? (typeof items === 'string' ? items : JSON.stringify(items)) : null,
            req.body.cash_paid !== undefined ? parseFloat(req.body.cash_paid) : null,
            req.body.change !== undefined ? parseFloat(req.body.change) : null,
            customer_name !== undefined ? customer_name : null,
            customer_phone !== undefined ? customer_phone : null,
            customer_address !== undefined ? customer_address : null,
            req.body.customerId !== undefined ? req.body.customerId : (req.body.customer_id !== undefined ? req.body.customer_id : null),
            id
        ];

        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Transaction not found" });
        }

        await logActivity(req.user.userId, 'Sunting Transaksi', 'transaction', id, `Transaksi ${id} diperbarui. Total: Rp ${parseFloat(total).toLocaleString('id-ID')}`);

        // Emit Socket Update
        const io = req.app.get('io');
        if (io) {
            io.emit('order_update', {
                id: id,
                status: 'updated',
                is_transaction: true
            });
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

        await logActivity(req.user.userId, 'Menghapus Transaksi', 'transaction', req.params.id, `Transaksi ${req.params.id} dipindahkan ke sampah`);

        // Emit Socket Update
        const io = req.app.get('io');
        if (io) {
            io.emit('order_update', {
                id: req.params.id,
                status: 'deleted',
                is_transaction: true
            });
        }

        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// --- Points System Endpoints ---

// Get current user's points (Pelanggan)
app.get("/api/customer/points", authenticateToken, authorizeRoles('pelanggan', 'user', 'admin'), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT points FROM users WHERE id = ?', [req.user.userId]);
        if (rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "success", data: { points: rows[0].points } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get current user's point history (Pelanggan)
app.get("/api/customer/points/history", authenticateToken, authorizeRoles('pelanggan', 'user', 'admin'), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // Count total items for pagination
        const [countRows] = await db.query('SELECT COUNT(*) as total FROM points_history WHERE user_id = ?', [req.user.userId]);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Get paginated data
        const [rows] = await db.query(
            'SELECT * FROM points_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [req.user.userId, limit, offset]
        );

        res.json({
            message: "success",
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limit
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all customers with points (Seller/Admin)
app.get("/api/points/customers", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir'), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, name, phone, points FROM users WHERE role = "pelanggan" ORDER BY points DESC');
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Top up points manually (Seller/Admin)
app.post("/api/points/topup", authenticateToken, authorizeRoles('admin', 'owner', 'penjual'), async (req, res) => {
    let connection;
    try {
        const { userId, amount, description } = req.body;
        if (!userId || !amount) {
            return res.status(400).json({ error: "userId and amount are required" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Update user's points
        await connection.query('UPDATE users SET points = points + ? WHERE id = ?', [amount, userId]);

        // Log to points_history
        await connection.query(
            'INSERT INTO points_history (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
            [userId, amount, 'earn', description || 'Top up manual oleh seller']
        );

        await connection.commit();
        await logActivity(req.user.userId, 'Top Up Poin', 'user', userId, `Top up poin sebesar ${amount} untuk user ID ${userId}`);

        res.json({ message: "Points topped up successfully", data: { userId, amount } });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Get points setting
app.get("/api/points/settings", authenticateToken, authorizeRoles('admin', 'owner', 'penjual'), async (req, res) => {
    try {
        const [rows] = await db.query("SELECT value FROM settings WHERE `key` = 'points_per_item'");
        const pointsPerItem = rows.length > 0 ? parseFloat(rows[0].value) : 500;
        res.json({ message: "success", data: { points_per_item: pointsPerItem } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update points setting
app.post("/api/points/settings", authenticateToken, authorizeRoles('admin', 'owner', 'penjual'), async (req, res) => {
    try {
        const { points_per_item } = req.body;
        if (points_per_item === undefined) {
            return res.status(400).json({ error: "points_per_item is required" });
        }

        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        await db.query(sql, ['points_per_item', points_per_item.toString()]);

        await logActivity(req.user.userId, 'Update Pengaturan Poin', 'settings', null, `Mengubah poin per menu menjadi ${points_per_item}`);
        res.json({ message: "Points setting updated successfully", data: { points_per_item } });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        await logActivity(req.user.userId, 'Hapus Transaksi Permanen', 'transaction', req.params.id, `Transaksi ${req.params.id} dihapus dari sistem`);
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
        await logActivity(req.user.userId, 'Kosongkan Sampah', 'transaction', 'all', `Admin memindahkan ${result.affectedRows} transaksi ke sampah`);
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
        await logActivity(user_id, 'Membuat Transaksi V2', 'transaction', simple_transaction_id, `Transaksi V2 senilai Rp ${parseFloat(total_amount).toLocaleString('id-ID')}`);
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
        const [closingRow] = await db.query("SELECT value FROM settings WHERE `key` = 'last_closing_date'");
        const lastClosingDate = closingRow.length > 0 ? closingRow[0].value : null;

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
            ${lastClosingDate ? 'WHERE e.date >= ?' : ''}
            ORDER BY e.date DESC
        `;
        const [rows] = await db.query(dataSql, lastClosingDate ? [lastClosingDate] : []);

        res.json({
            "message": "success",
            "data": rows,
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get all expenses with pagination and date range filtering
app.get("/api/expenses", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'owner'), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const { startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let whereClauses = [];
        let queryParams = [];

        const [closingRow] = await db.query("SELECT value FROM settings WHERE `key` = 'last_closing_date'");
        const lastClosingDate = closingRow.length > 0 ? closingRow[0].value : null;

        if (startDate) {
            whereClauses.push('e.date >= ?');
            queryParams.push(startDate.includes(':') ? startDate : `${startDate} 00:00:00`);
        } else if (lastClosingDate) {
            whereClauses.push('e.date >= ?');
            queryParams.push(lastClosingDate);
        }
        if (endDate) {
            whereClauses.push('e.date <= ?');
            const effectiveEndDate = endDate.includes(':') ? endDate : `${endDate} 23:59:59`;
            queryParams.push(effectiveEndDate);
        }
        if (req.query.category) {
            whereClauses.push('e.category = ?');
            queryParams.push(req.query.category);
        }
        if (req.query.search) {
            whereClauses.push('(e.name LIKE ? OR e.notes LIKE ?)');
            queryParams.push(`%${req.query.search}%`, `%${req.query.search}%`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query to get total count and sum
        const statsSql = `SELECT COUNT(*) as totalItems, IFNULL(SUM(amount), 0) as totalAmount FROM expenses e ${whereSql}`;
        const [statsRows] = await db.query(statsSql, queryParams);
        const totalItems = statsRows[0].totalItems;
        const totalAmount = statsRows[0].totalAmount;
        const totalPages = Math.ceil(totalItems / limit);

        // Query to get paginated data
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
            ${whereSql}
            ORDER BY e.date DESC
            LIMIT ?
            OFFSET ?
        `;
        const [rows] = await db.query(dataSql, [...queryParams, limit, offset]);

        res.json({
            "message": "success",
            "data": rows,
            "totalAmount": totalAmount,
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

        await logActivity(req.user.userId, 'Tambah Pengeluaran', 'expense', result.insertId, `Pengeluaran baru: ${name} sebesar Rp ${parseFloat(amount).toLocaleString('id-ID')}`);

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
        const params = [name, amount, category, date ? date.replace('T', ' ') : null, notes, req.params.id];
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

        await logActivity(req.user.userId, 'Hapus Pengeluaran', 'expense', req.params.id, `Pengeluaran ID ${req.params.id} dihapus`);

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

        // Fetch transactions for this account with filtering
        const { type, startDate, endDate, search } = req.query;
        let whereClauses = ['at.account_id = ?'];
        let queryParams = [account.id];

        const [closingRow] = await db.query("SELECT value FROM settings WHERE `key` = 'last_closing_date'");
        const lastClosingDate = closingRow.length > 0 ? closingRow[0].value : null;

        if (type && type !== 'all') {
            whereClauses.push('at.type = ?');
            queryParams.push(type);
        }

        if (startDate) {
            let effectiveStartDate = startDate;
            if (lastClosingDate) {
                const closingTime = new Date(lastClosingDate).getTime();
                const startReqTime = startDate.includes(':') ? new Date(startDate).getTime() : new Date(`${startDate} 00:00:00`).getTime();
                if (closingTime > startReqTime) {
                    effectiveStartDate = lastClosingDate;
                }
            }
            whereClauses.push('at.created_at >= ?');
            queryParams.push(effectiveStartDate);
        } else if (lastClosingDate) {
            whereClauses.push('at.created_at >= ?');
            queryParams.push(lastClosingDate);
        }
        if (endDate) {
            whereClauses.push('at.created_at <= ?');
            queryParams.push(`${endDate} 23:59:59`);
        }
        if (search) {
            whereClauses.push('at.description LIKE ?');
            queryParams.push(`%${search}%`);
        }

        const whereSql = whereClauses.join(' AND ');

        // Calculate displayed balance (if lastClosingDate exists and no startDate provided, show current period balance)
        let displayedBalance = account.balance;
        if (lastClosingDate && !startDate) {
            const [sumResult] = await db.query(
                "SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as current_balance FROM account_transactions WHERE account_id = ? AND created_at >= ?",
                [account.id, lastClosingDate]
            );
            displayedBalance = sumResult[0].current_balance || 0;
        }

        const [transactions] = await db.query(
            `SELECT 
                at.id,
                at.account_id,
                at.type,
                at.amount,
                at.description,
                at.created_by_user_id,
                DATE_FORMAT(at.created_at, '%Y-%m-%d %H:%i:%s+07:00') AS created_at,
                u.username as created_by_username 
             FROM account_transactions at 
             JOIN users u ON at.created_by_user_id = u.id 
             WHERE ${whereSql} ORDER BY at.created_at DESC, at.id DESC`,
            queryParams
        );

        res.json({
            message: "success",
            data: {
                account: {
                    id: account.id,
                    name: account.name,
                    balance: displayedBalance,
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
        const { account_name, amount, description, created_at } = req.body;
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
            'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [account.id, 'deposit', amount, description, created_by_user_id, created_at || new Date()]
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
        const { account_name, amount, description, created_at } = req.body;
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
            'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [account.id, 'expense', amount, description, created_by_user_id, created_at || new Date()]
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


// PUT Update Account Transaction (description and amount)
app.put("/api/accounts/transactions/:id", authenticateToken, async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { description, amount, date } = req.body;
        const userId = req.user.userId;

        if (!description || description.trim() === '') {
            return res.status(400).json({ error: "Description is required and cannot be empty" });
        }

        const newAmount = parseFloat(amount);
        if (isNaN(newAmount) || newAmount < 0) {
            return res.status(400).json({ error: "Valid amount is required" });
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
        const oldAmount = parseFloat(transaction.amount);
        const accountId = transaction.account_id;
        const type = transaction.type; // 'deposit' or 'expense'

        // Check ownership or admin role
        if (transaction.created_by_user_id !== userId && req.user.role !== 'admin') {
            await connection.rollback();
            return res.status(403).json({ error: "Forbidden: You are not authorized to edit this transaction" });
        }

        // Calculate balance difference
        // If deposit: increase by (newAmount - oldAmount)
        // If expense: decrease by (newAmount - oldAmount)
        let balanceDiff = 0;
        if (type === 'deposit') {
            balanceDiff = newAmount - oldAmount;
        } else if (type === 'expense') {
            balanceDiff = -(newAmount - oldAmount);
        }

        // Update transaction - use provided date or keep existing one if not provided
        const finalDate = date ? date.replace('T', ' ') : transaction.created_at;
        await connection.query('UPDATE account_transactions SET description = ?, amount = ?, created_at = ? WHERE id = ?', [description, newAmount, finalDate, id]);

        // Update account balance
        if (balanceDiff !== 0) {
            await connection.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [balanceDiff, accountId]);
        }

        await connection.commit();
        res.json({ message: "Transaction updated successfully", data: { id, description, amount: newAmount, created_at: finalDate } });

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

        await logActivity(req.user.userId, 'Tambah Catatan', 'note', result.insertId, `Catatan baru: ${title}`);

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
            await logActivity(req.user.userId, 'Hapus Catatan', 'note', id, `Catatan ID ${id} dihapus`);
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

// Create a new pending order (authenticated or public)
app.post("/api/orders", (req, res, next) => {
    // Optional authentication: if token exists, verify it, but don't fail if it doesn't
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        jwt.verify(token, ACTUAL_JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = { userId: user.userId, username: user.username, role: user.role.trim() };
            }
            next();
        });
    } else {
        next();
    }
}, async (req, res) => {
    try {
        const { customer_name, customer_address, customer_phone, items, payment_method, note, notes, pointsUsed, promoId } = req.body; // 'total' will be calculated on backend
        if (!customer_name || !items || items.length === 0) {
            return res.status(400).json({ error: "Missing required fields: customer_name, items" });
        }

        let calculatedTotal = 0;
        const orderItemsWithDetails = [];

        // Get global ignore_stock setting
        const [settingsRows] = await db.query('SELECT ignore_stock FROM app_settings ORDER BY id LIMIT 1');
        const globalIgnoreStock = settingsRows.length > 0 ? !!settingsRows[0].ignore_stock : false;

        for (const item of items) {
            const [menuItemRows] = await db.query('SELECT id, name, price, discount, stock FROM menu_items WHERE id = ?', [item.id]);
            if (menuItemRows.length === 0) {
                return res.status(400).json({ error: `Menu item with ID ${item.id} not found.` });
            }
            const menuItem = menuItemRows[0];

            // Stock validation if NOT ignoring stock
            if (!globalIgnoreStock && menuItem.stock !== null && menuItem.stock < item.quantity) {
                return res.status(400).json({ error: `Stok tidak mencukupi untuk ${menuItem.name}. (Tersedia: ${menuItem.stock})` });
            }

            const itemPrice = parseFloat(menuItem.price);
            const itemDiscount = parseFloat(menuItem.discount || 0);

            let effectiveDiscount = itemDiscount;
            if (itemDiscount > 1) {
                effectiveDiscount = itemDiscount / 100;
            }

            const priceAfterDiscount = itemPrice * (1 - effectiveDiscount);

            // Handle Options
            let optionsTotal = 0;
            let validOptions = [];
            if (item.options && Array.isArray(item.options) && item.options.length > 0) {
                const optionIds = item.options.map(o => o.id);
                if (optionIds.length > 0) {
                    // Verify options belong to this menu item and get real prices
                    const [optRows] = await db.query('SELECT id, name, price_adjustment FROM menu_item_options WHERE id IN (?) AND menu_item_id = ?', [optionIds, item.id]);

                    // We use the prices from DB, ignoring what frontend sent
                    optionsTotal = optRows.reduce((sum, opt) => sum + parseFloat(opt.price_adjustment), 0);
                    validOptions = optRows;
                }
            }

            const itemSubtotal = (priceAfterDiscount + optionsTotal) * item.quantity;
            calculatedTotal += itemSubtotal;

            orderItemsWithDetails.push({
                id: menuItem.id,
                name: menuItem.name,
                price: itemPrice,
                discount: itemDiscount,
                quantity: item.quantity,
                options: validOptions,
                subtotal: itemSubtotal
            });
        }

        const userId = req.user ? req.user.userId : null;
        const paymentMethodValue = payment_method || 'Tunai';
        const orderNote = note || notes || null;

        let finalPointsUsed = 0;
        // Validate and Deduct Points
        if (userId && pointsUsed && pointsUsed > 0) {
            // Check user points balance
            const [userRows] = await db.query('SELECT points FROM users WHERE id = ?', [userId]);
            if (userRows.length > 0) {
                const currentPoints = parseFloat(userRows[0].points || 0);
                if (currentPoints >= pointsUsed) {
                    // Check if pointsUsed exceeds total order amount
                    if (pointsUsed > calculatedTotal) {
                        return res.status(400).json({ error: "Points used cannot exceed order total." });
                    }

                    // Deduct points
                    await db.query('UPDATE users SET points = points - ? WHERE id = ?', [pointsUsed, userId]);
                    await db.query(
                        'INSERT INTO points_history (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
                        [userId, pointsUsed, 'redeem', `Digunakan untuk Order`]
                    );
                    finalPointsUsed = parseFloat(pointsUsed);
                    calculatedTotal -= finalPointsUsed; // Apply discount
                } else {
                    return res.status(400).json({ error: "Insufficient points balance." });
                }
            }
        }

        // --- Promo Deduction Logic ---
        let finalPromoDiscount = 0;
        if (promoId) {
            const [promoRows] = await db.query('SELECT * FROM promos WHERE id = ? AND is_active = 1', [promoId]);
            if (promoRows.length > 0) {
                const promo = promoRows[0];

                // Check if one-time use per user is enabled
                if (promo.is_one_time && userId) {
                    const [usageRows] = await db.query(
                        "SELECT id FROM orders WHERE user_id = ? AND promo_id = ? AND status NOT IN ('cancelled', 'rejected') LIMIT 1",
                        [userId, promoId]
                    );
                    if (usageRows.length > 0) {
                        return res.status(400).json({ error: "Anda sudah menggunakan kupon ini sebelumnya. Kupon ini hanya berlaku 1x per pengguna." });
                    }
                }

                const promoMinPurchase = parseFloat(promo.min_purchase || 0);
                const subtotalForPromo = calculatedTotal + finalPointsUsed;

                if (subtotalForPromo >= promoMinPurchase) {
                    if (promo.discount_type === 'percentage') {
                        finalPromoDiscount = (subtotalForPromo * parseFloat(promo.discount_value)) / 100;
                    } else {
                        finalPromoDiscount = parseFloat(promo.discount_value);
                    }
                    calculatedTotal -= finalPromoDiscount;
                } else {
                    console.log(`[Order] Promo ${promo.code} rejected: Subtotal ${subtotalForPromo} < Min ${promoMinPurchase}`);
                }
            }
        }
        // Ensure total doesn't go below 0
        if (calculatedTotal < 0) calculatedTotal = 0;

        const sql = 'INSERT INTO orders (user_id, customer_name, customer_address, customer_phone, items, total, points_used, promo_discount, status, payment_method, note, promo_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [userId, customer_name, customer_address, customer_phone || null, JSON.stringify(orderItemsWithDetails), calculatedTotal, finalPointsUsed, finalPromoDiscount, 'pending', paymentMethodValue, orderNote, promoId || null];
        const [result] = await db.query(sql, params);

        const orderId = result.insertId;

        // --- Points Awarding Logic for Orders moved to status update 'completed' ---

        // Kirim Notifikasi Push (async, tidak menunggu selesai agar response cepat)
        setImmediate(() => {
            sendUniversalNotification(
                null, // Kirim ke admin/penjual/kasir (ditentukan di helper untuk new_order)
                `Pesanan baru dari ${customer_name} sebesar Rp ${calculatedTotal.toLocaleString('id-ID')}`,
                'Pesanan Masuk! 🔔',
                { orderId, type: 'new_order' }
            ).catch(err => console.error('Push notification error:', err));
        });

        // Realtime Update via Socket.io (instant)
        req.app.get('io').emit('new_order', {
            id: orderId,
            customer_name,
            total: calculatedTotal,
            promo_discount: finalPromoDiscount,
            status: 'pending',
            created_at: new Date()
        });

        res.status(201).json({
            message: "Order created successfully and is pending verification.",
            data: {
                id: result.insertId,
                user_id: userId,
                customer_name,
                customer_address,
                items: orderItemsWithDetails,
                total: calculatedTotal,
                points_used: finalPointsUsed,
                promo_discount: finalPromoDiscount,
                status: 'pending',
                payment_method: paymentMethodValue
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});
// Get orders (Admin/User: all, Pelanggan: their own)
app.get("/api/orders", authenticateToken, authorizeRoles('admin', 'user', 'pelanggan', 'penjual', 'kasir', 'owner'), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const status = req.query.status;
        const offset = (page - 1) * limit;

        const isManagement = ['admin', 'user', 'kasir', 'penjual', 'owner'].includes(req.user.role);
        let whereClauses = [];
        let queryParams = [];

        if (!isManagement) {
            whereClauses.push('user_id = ?');
            queryParams.push(req.user.userId);
        }

        if (status) {
            whereClauses.push('status = ?');
            queryParams.push(status);
        }

        const { search } = req.query;
        if (search) {
            whereClauses.push('(customer_name LIKE ? OR customer_phone LIKE ? OR customer_address LIKE ? OR items LIKE ?)');
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

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

// Get a single order by ID
app.get("/api/orders/:id", authenticateToken, authorizeRoles('admin', 'user', 'pelanggan', 'penjual', 'kasir', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const isManagement = ['admin', 'user', 'kasir', 'penjual', 'owner'].includes(req.user.role);

        let sql = 'SELECT * FROM orders WHERE id = ?';
        let queryParams = [id];

        if (!isManagement) {
            sql += ' AND user_id = ?';
            queryParams.push(req.user.userId);
        }

        const [rows] = await db.query(sql, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Order not found or unauthorized access." });
        }

        const order = rows[0];
        // Parse items JSON string
        try {
            order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (e) {
            console.error("Error parsing order items:", e);
        }

        res.json({
            message: "success",
            data: order
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an order's status
app.put("/api/orders/:id/status", authenticateToken, authorizeRoles('admin', 'user', 'kasir', 'penjual', 'pelanggan', 'owner'), async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !['accepted', 'rejected', 'cancelled', 'completed'].includes(status)) {
        console.error(`[Order] Invalid status update attempt: ${status} for ID ${id}`);
        return res.status(400).json({ error: "Invalid status provided. Must be 'accepted', 'rejected', 'cancelled', or 'completed'." });
    }

    // If role is pelanggan, they can only set to 'cancelled' and only if it's their own order
    if (req.user.role === 'pelanggan' && status !== 'cancelled') {
        return res.status(403).json({ error: "Pelanggan hanya diperbolehkan membatalkan pesanan." });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get the order to check ownership and current status
        const [orderRows] = await connection.query('SELECT user_id, status, customer_name, customer_address, customer_phone, items, total, payment_method, note, points_used, promo_discount FROM orders WHERE id = ? FOR UPDATE', [id]);

        if (orderRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Order not found." });
        }

        const order = orderRows[0];

        // Security check for pelanggan
        if (req.user.role === 'pelanggan') {
            if (order.user_id !== req.user.userId) {
                await connection.rollback();
                return res.status(403).json({ error: "Unauthorized: You don't own this order." });
            }
            if (order.status !== 'pending') {
                await connection.rollback();
                return res.status(400).json({ error: "Pesanan tidak dapat dibatalkan karena sudah diproses." });
            }
        }

        // Handle 'rejected', 'cancelled', or 'completed' status: just update and finish
        if (status === 'rejected' || status === 'cancelled' || status === 'completed') {
            const updateSql = 'UPDATE orders SET status = ? WHERE id = ?';
            await connection.query(updateSql, [status, id]);

            // --- REFUND POINTS if Rejected or Cancelled ---
            if ((status === 'rejected' || status === 'cancelled') && order.points_used > 0 && order.user_id) {
                await connection.query('UPDATE users SET points = points + ? WHERE id = ?', [order.points_used, order.user_id]);
                await connection.query(
                    'INSERT INTO points_history (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
                    [order.user_id, order.points_used, 'refund', `Refund poin dari Order #${id} (${status})`]
                );
                console.log(`[Order] Refunded ${order.points_used} points to user ${order.user_id} for order ${id}`);
            }
            // --- End Refund Logic ---

            // --- Points Awarding Logic for Completed Orders ---
            if (status === 'completed' && order.user_id) {
                console.log(`[POINTS-ORDER] Order #${id} completed, checking points for user ID: ${order.user_id}`);

                try {
                    const [pointSettingRows] = await connection.query("SELECT value FROM settings WHERE `key` = 'point_system_enabled'");
                    const pointSystemEnabled = pointSettingRows.length > 0 ? pointSettingRows[0].value === '1' : true;

                    if (pointSystemEnabled) {
                        const [userRows] = await connection.query('SELECT id, points, username, role FROM users WHERE id = ?', [order.user_id]);

                        if (userRows.length > 0 && userRows[0].role === 'pelanggan') {
                            const customerId = userRows[0].id;
                            const customerName = userRows[0].username;
                            console.log(`[POINTS-ORDER] ✓ User is a customer: ${customerName} (ID: ${customerId})`);

                            const [pointsSetting] = await connection.query("SELECT value FROM settings WHERE `key` = ?", ['points_per_item']);
                            const pointsPerItem = pointsSetting.length > 0 ? parseFloat(pointsSetting[0].value) : 100;

                            // Parse items from order
                            const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                            const totalItemsCount = orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
                            const pointsEarned = totalItemsCount * pointsPerItem;

                            console.log(`[POINTS-ORDER] Calculation: ${totalItemsCount} items × ${pointsPerItem} = ${pointsEarned} points`);

                            if (pointsEarned > 0) {
                                await connection.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsEarned, customerId]);

                                // Lookup valid transaction ID for foreign key constraint
                                const [trxRows] = await connection.query('SELECT id FROM transactions WHERE order_id = ? LIMIT 1', [id]);
                                const transactionRefId = trxRows.length > 0 ? trxRows[0].id : null;

                                await connection.query(
                                    'INSERT INTO points_history (user_id, transaction_id, amount, type, description) VALUES (?, ?, ?, ?, ?)',
                                    [customerId, transactionRefId, pointsEarned, 'earn', `Order #${id} selesai (${totalItemsCount} item)`]
                                );
                                console.log(`[POINTS-ORDER] ✅ Awarded ${pointsEarned} points to ${customerName} (Trx: ${transactionRefId})`);
                            }
                        } else if (userRows.length > 0) {
                            console.log(`[POINTS-ORDER] ⚠️ User is not a customer (role: ${userRows[0].role})`);
                        }
                    } else {
                        console.log(`[POINTS-ORDER] ℹ️ Point system is DISABLED`);
                    }
                } catch (pointsError) {
                    console.error(`[POINTS-ORDER] ❌ Error awarding points:`, pointsError);
                    // Don't fail the order update if points fail
                }
            }
            // --- End Points Logic ---

            // Kirim Notifikasi ke Pelanggan (async)
            if (order.user_id) {
                let statusMsg = '';
                let title = 'Update Pesanan 📦';

                if (status === 'rejected') {
                    statusMsg = 'Maaf, pesanan Anda ditolak oleh penjual.';
                } else if (status === 'cancelled') {
                    statusMsg = 'Pesanan Anda telah dibatalkan.';
                } else if (status === 'completed') {
                    statusMsg = 'Pesanan Anda telah selesai. Terima kasih!';
                    title = 'Pesanan Selesai! ✨';
                }

                setImmediate(() => {
                    sendUniversalNotification([order.user_id], statusMsg, title, { orderId: id, status })
                        .catch(err => console.error('Push notification error:', err));
                });
            }

            await connection.commit();

            // Realtime Update via Socket.io (instant)
            req.app.get('io').emit('order_update', { id, status });

            return res.json({ message: `Order ${id} has been ${status}.` });
        }



        // Handle 'accepted' status
        if (status === 'accepted') {
            const { ignoreStock: reqIgnoreStock } = req.body;

            // Get global ignore_stock setting as fallback
            const [settingsRows] = await connection.query('SELECT ignore_stock FROM app_settings ORDER BY id LIMIT 1');
            const globalIgnoreStock = settingsRows.length > 0 ? !!settingsRows[0].ignore_stock : false;

            // If ignoreStock is passed in body, it takes precedence (e.g. from specific SalesPOS action),
            // otherwise use global setting.
            const effectivelyIgnoreStock = reqIgnoreStock !== undefined ? reqIgnoreStock : globalIgnoreStock;

            if (order.status !== 'pending') {
                await connection.rollback();
                return res.status(404).json({ error: "Order not found or not in pending state." });
            }

            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;



            // 2. Stock Validation
            if (!effectivelyIgnoreStock) {



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



                    console.error(`[Order] Stock validation failed for order ${id}: ${errorMessage}`);
                    return res.status(400).json({ error: errorMessage.trim() });



                }
            }

            // 3. Stock Reduction
            for (const item of items) {
                await connection.query('UPDATE menu_items SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);

                // Notifikasi Stok Kritis ke Owner
                const [updatedStock] = await connection.query('SELECT name, stock FROM menu_items WHERE id = ?', [item.id]);
                if (updatedStock.length > 0 && updatedStock[0].stock <= 5) {
                    const [owners] = await connection.query('SELECT id FROM users WHERE role = ?', ['owner']);
                    const ownerIds = owners.map(o => o.id);
                    if (ownerIds.length > 0) {
                        sendUniversalNotification(
                            ownerIds,
                            `Stok ${updatedStock[0].name} hampir habis (Tersisa: ${updatedStock[0].stock})`,
                            'Peringatan Stok! ⚠️',
                            { itemId: item.id }
                        );
                    }
                }
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
                total: totalWithPpn,
                ppn: ppnAmount,
                isEmployeeMeal: 0,
                payment_method: order.payment_method || 'Tunai',
                order_id: id,
                ignore_stock: effectivelyIgnoreStock ? 1 : 0,
                customer_id: order.user_id || null,
                points_used: order.points_used || 0,
                promo_discount: order.promo_discount || 0
            };

            const transactionParams = [
                transactionData.id,
                transactionData.timestamp,
                transactionData.items,
                transactionData.total,
                transactionData.ppn,
                transactionData.isEmployeeMeal,
                transactionData.payment_method,
                transactionData.order_id,
                transactionData.ignore_stock,
                order.customer_name || null,
                order.customer_phone || null,
                order.customer_address || null,
                order.note || null,
                transactionData.customer_id,
                transactionData.points_used,
                order.promo_discount || 0
            ];

            await connection.query('INSERT INTO transactions (id, timestamp, items, total, ppn, isEmployeeMeal, payment_method, order_id, ignore_stock, customer_name, customer_phone, customer_address, catatan, customer_id, points_used, promo_discount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', transactionParams);

            // 5. Update the order status to 'accepted'
            await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['accepted', id]);

            // Kirim Notifikasi ke Pelanggan - Pesanan Diterima (async)
            if (order.user_id) {
                setImmediate(() => {
                    sendUniversalNotification(
                        [order.user_id],
                        'Pesanan Anda telah diterima dan sedang diproses!',
                        'Pesanan Diterima! ✅',
                        { orderId: id, status: 'accepted' }
                    ).catch(err => console.error('Push notification error:', err));
                });
            }

            // 6. Commit the transaction
            await connection.commit();

            // Realtime Update via Socket.io (instant)
            req.app.get('io').emit('order_update', { id, status: 'accepted' });

            res.json({ message: `Order ${id} has been accepted and transaction ${newTransactionId} created.` });

        }
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: "Transaction failed: " + err.message, stack: err.stack });
    } finally {
        if (connection) connection.release();
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
        const { username, password, phone, address } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // --- SECURITY CHECK: Verify if registration is enabled ---
        const [regSetting] = await db.query('SELECT value FROM settings WHERE `key` = ?', ['registration_enabled']);
        const isRegistrationEnabled = regSetting.length > 0 ? (regSetting[0].value === 'true') : false;

        if (!isRegistrationEnabled) {
            return res.status(403).json({ error: "Pendaftaran akun baru saat ini dinonaktifkan oleh Admin." });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash password
        const sql = 'INSERT INTO users (username, password, role, phone, address) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [username, hashedPassword, 'pelanggan', phone || null, address || null]);

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

        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, ACTUAL_JWT_SECRET, { expiresIn: '7d' });

        await logActivity(user.id, 'Masuk Sistem', 'user', user.id, `User ${user.username} berhasil login`);

        res.json({ message: "Login successful", token });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Save User Push Token
app.post("/api/users/push-token", authenticateToken, async (req, res) => {
    try {
        const { pushToken } = req.body;
        const userId = req.user.userId;

        if (!pushToken) {
            return res.status(400).json({ error: "pushToken is required" });
        }

        // 1. Hapus token ini dari user lain agar tidak terjadi duplikasi notifikasi pada satu device
        await db.query("UPDATE users SET push_token = NULL WHERE push_token = ? AND id != ?", [pushToken, userId]);

        // 2. Update token untuk user saat ini
        const sql = 'UPDATE users SET push_token = ? WHERE id = ?';
        await db.query(sql, [pushToken, userId]);

        res.json({ message: "Push token updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Activity Logs Endpoints ---
app.get("/api/activity-logs", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const { action, userId, targetType, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let whereClauses = [];
        let queryParams = [];

        if (action) {
            whereClauses.push('al.action LIKE ?');
            queryParams.push(`%${action}%`);
        }
        if (userId) {
            whereClauses.push('al.user_id = ?');
            queryParams.push(userId);
        }
        if (targetType) {
            whereClauses.push('al.target_type = ?');
            queryParams.push(targetType);
        }
        if (startDate) {
            whereClauses.push('al.created_at >= ?');
            queryParams.push(startDate);
        }
        if (endDate) {
            whereClauses.push('al.created_at <= ?');
            queryParams.push(`${endDate} 23:59:59`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query total count
        const countSql = `SELECT COUNT(*) as total FROM activity_logs al ${whereSql}`;
        const [countRows] = await db.query(countSql, queryParams);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Query logs
        const logsSql = `
            SELECT 
                al.*, 
                u.username,
                u.role
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ${whereSql}
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query(logsSql, [...queryParams, limit, offset]);

        res.json({
            message: "success",
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limit
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Settings Endpoints ---

// Get public settings
app.get("/api/settings", async (req, res) => {
    try {
        const publicSettingsKeys = ['website_title', 'header_title', 'favicon_url', 'registration_enabled', 'web_description', 'cover_image_url', 'auth_ui_version'];
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
app.get("/api/all-settings", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'owner', 'kasir', 'penjual', 'pelanggan'), async (req, res) => {
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

        await logActivity(req.user.userId, 'Update Pengaturan', 'settings', 'all', `Admin memperbarui pengaturan sistem`);

        res.json({ message: "Settings updated successfully", data: settings });

    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// --- NEW SETTING ENDPOINTS ---

// Generic update single setting (used by frontend for various fields dynamically)
app.put("/api/settings/:key", authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { key } = req.params;
    let { value } = req.body;
    let dbKey = key;

    // Mapping key frontend -> key database jika berbeda
    if (key === 'website_title') dbKey = 'website_title';
    if (key === 'header_title') dbKey = 'header_title';
    if (key === 'cashier_dashboard_title') dbKey = 'cashier_dashboard_title';
    if (key === 'web_description') dbKey = 'web_description';

    try {
        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        await db.query(sql, [dbKey, value]);

        await logActivity(req.user.userId, 'Update Pengaturan', 'settings', dbKey, `Mengubah ${dbKey}`);

        res.json({ message: `${dbKey} updated successfully`, data: { value } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Logo
app.post('/api/settings/logo', authenticateToken, authorizeRoles('admin'), upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No logo file uploaded.' });
        }
        const logoUrl = `/public/uploads/${req.file.filename}`;

        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        await db.query(sql, ['logo_url', logoUrl]);

        res.json({ message: 'Logo updated successfully!', data: { logo_url: logoUrl } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Logo
app.delete('/api/settings/logo', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        // Clear DB entry.
        const sql = 'UPDATE settings SET `value` = NULL WHERE `key` = ?';
        await db.query(sql, ['logo_url']);
        res.json({ message: 'Logo removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Logo specifically
app.get('/api/settings/logo', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT value FROM settings WHERE `key` = ?', ['logo_url']);
        const logoUrl = rows.length > 0 ? rows[0].value : null;
        res.json({ message: 'success', data: { logo_url: logoUrl } });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        const sql = 'SELECT id, username, role, phone, address FROM users';
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

        if (!newRole || !['admin', 'user', 'kasir', 'guest', 'pelanggan', 'penjual', 'owner'].includes(newRole)) {
            return res.status(400).json({ error: "Invalid role specified. Must be 'admin', 'user', 'kasir', 'guest', 'pelanggan', 'penjual', or 'owner'." });
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

        // Disable foreign key checks to allow truncating related tables
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Clear transaction and operational data
        await connection.query('TRUNCATE TABLE transactions');
        await connection.query('TRUNCATE TABLE expenses');
        await connection.query('TRUNCATE TABLE orders');
        await connection.query('TRUNCATE TABLE simple_transactions');
        await connection.query('TRUNCATE TABLE simple_transaction_items');
        await connection.query('TRUNCATE TABLE cash_reconciliations');

        await connection.query('TRUNCATE TABLE raw_material_stock_history');
        await connection.query('TRUNCATE TABLE account_transactions');
        await connection.query('TRUNCATE TABLE notes');

        // --- Reset Menu and Material stock instead of deleting them ---
        await connection.query('UPDATE menu_items SET stock = 0');
        await connection.query('UPDATE raw_materials SET current_stock = 0, menu_stock = 0');

        // Reset balances
        await connection.query('UPDATE accounts SET balance = 0');

        // Reset settings related to money/closing
        await connection.query("UPDATE settings SET value = '0' WHERE `key` = 'initial_capital'");
        await connection.query("DELETE FROM settings WHERE `key` = 'last_closing_date'");

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        await connection.commit();

        await logActivity(req.user.userId, 'RESET SEMUA DATA', 'system', 'all', 'Admin melakukan reset total seluruh data transaksi, pengeluaran, dan stok.');

        res.json({ message: "Semua transaksi, pengeluaran, uang bisnis, riwayat stok berhasil dihapus, dan stok telah direset." });
    } catch (err) {
        if (connection) await connection.rollback();
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
        const sql = 'SELECT id, username, role, avatar_url, phone, address, points FROM users WHERE id = ?';
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

// Update Profile Info (Phone & Address)
// Update Profile Info (Phone & Address)
app.put("/api/user/profile", authenticateToken, async (req, res) => {
    try {
        const { phone, address } = req.body;

        // Check if user exists first
        const [userCheck] = await db.query('SELECT id FROM users WHERE id = ?', [req.user.userId]);
        if (userCheck.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const sql = 'UPDATE users SET phone = ?, address = ? WHERE id = ?';
        await db.query(sql, [phone || null, address || null, req.user.userId]);

        // Always return "success" so the frontend can handle it correctly
        // (CustomerProfile.js expects response.data.message === 'success')
        res.json({ message: "success" });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update Username
app.put("/api/user/profile/username", authenticateToken, authorizeRoles('user', 'admin', 'pelanggan', 'kasir', 'penjual', 'owner'), async (req, res) => {
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
app.put("/api/user/profile/password", authenticateToken, authorizeRoles('user', 'admin', 'pelanggan', 'kasir', 'penjual', 'owner'), async (req, res) => {
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
            await logActivity(req.user.userId, 'Ganti Password', 'user', req.user.userId, 'User memperbarui password keamanan');
            res.json({ message: "Password updated successfully" });
        } else {
            res.status(500).json({ error: "Failed to update password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Upload User Avatar
app.post("/api/user/profile/avatar", authenticateToken, authorizeRoles('user', 'admin', 'pelanggan', 'kasir', 'penjual', 'owner'), upload.single('avatar'), async (req, res) => {
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

// Get User App Mode
app.get("/api/user/app-mode", authenticateToken, authorizeRoles('user', 'admin', 'pelanggan', 'kasir', 'penjual', 'owner'), async (req, res) => {
    try {
        const sql = 'SELECT app_mode FROM users WHERE id = ?';
        const [rows] = await db.query(sql, [req.user.userId]);
        if (rows.length > 0) {
            res.json({ message: "success", data: { app_mode: rows[0].app_mode || 'full' } });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Update User App Mode
app.put("/api/user/app-mode", authenticateToken, async (req, res) => {
    try {
        const { app_mode } = req.body;

        if (!app_mode || !['simple', 'full'].includes(app_mode)) {
            return res.status(400).json({ error: "Invalid app_mode. Must be 'simple' or 'full'" });
        }

        const sql = 'UPDATE users SET app_mode = ? WHERE id = ?';
        const [result] = await db.query(sql, [app_mode, req.user.userId]);

        if (result.affectedRows > 0) {
            await logActivity(req.user.userId, 'Ganti Mode App', 'user', req.user.userId, `User mengubah mode aplikasi menjadi ${app_mode}`);
            res.json({ message: "App mode updated successfully", data: { app_mode } });
        } else {
            res.status(404).json({ error: "User not found or app mode not changed" });
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



// --- Comprehensive Report Endpoint ---
app.get("/api/laporan-lengkap", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let hasDateFilter = startDate && endDate;

        const [closingRow] = await db.query("SELECT value FROM settings WHERE `key` = 'last_closing_date'");
        const lastClosingDate = closingRow.length > 0 ? closingRow[0].value : null;

        let effectiveStartDate = startDate;
        let effectiveEndDate = endDate ? `${endDate} 23:59:59` : null;

        if (!effectiveStartDate && lastClosingDate) {
            effectiveStartDate = lastClosingDate;
            hasDateFilter = true; // Use the filter logic
        } else if (effectiveStartDate && lastClosingDate) {
            const closingTime = new Date(lastClosingDate).getTime();
            const startReqTime = effectiveStartDate.includes(':') ? new Date(effectiveStartDate).getTime() : new Date(`${effectiveStartDate} 00:00:00`).getTime();
            if (closingTime > startReqTime) {
                effectiveStartDate = lastClosingDate;
            }
            hasDateFilter = true;
        }

        // Base queries
        let transactionsQuery = `SELECT id, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s+07:00') AS timestamp, items, total, ppn, isEmployeeMeal, payment_method, cash_paid, \`change\`, order_id, user_id, manual_discount, catatan, deleted_at FROM transactions ORDER BY timestamp DESC, id DESC`;
        let expensesQuery = `SELECT id, name, amount, category, DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s+07:00') AS date, notes, user_id FROM expenses ORDER BY date DESC, id DESC`;
        let lapakAccountQuery = `SELECT at.id, at.account_id, at.type, at.amount, at.description, at.created_by_user_id, DATE_FORMAT(at.created_at, '%Y-%m-%d %H:%i:%s+07:00') AS created_at, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'lapak_deposit' ORDER BY at.created_at DESC, at.id DESC`;
        let ownerAccountQuery = `SELECT at.id, at.account_id, at.type, at.amount, at.description, at.created_by_user_id, DATE_FORMAT(at.created_at, '%Y-%m-%d %H:%i:%s+07:00') AS created_at, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'owner_deposit' ORDER BY at.created_at DESC, at.id DESC`;
        const menuStockQuery = `SELECT id, name, stock, category, price, hpp FROM menu_items ORDER BY name ASC`;
        const rawMaterialStockQuery = `SELECT id, name, current_stock, unit, price_per_item FROM raw_materials ORDER BY name ASC`;

        let queryParams = [];
        if (hasDateFilter) {
            const dateClause = effectiveEndDate ? "BETWEEN ? AND ?" : ">= ?";
            const params = effectiveEndDate ? [effectiveStartDate, effectiveEndDate] : [effectiveStartDate];

            transactionsQuery = `SELECT id, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s+07:00') AS timestamp, items, total, ppn, isEmployeeMeal, payment_method, cash_paid, \`change\`, order_id, user_id, manual_discount, catatan, deleted_at FROM transactions WHERE timestamp ${dateClause} ORDER BY timestamp DESC, id DESC`;
            expensesQuery = `SELECT id, name, amount, category, DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s+07:00') AS date, notes, user_id FROM expenses WHERE date ${dateClause} ORDER BY date DESC, id DESC`;
            lapakAccountQuery = `SELECT at.id, at.account_id, at.type, at.amount, at.description, at.created_by_user_id, DATE_FORMAT(at.created_at, '%Y-%m-%d %H:%i:%s+07:00') AS created_at, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'lapak_deposit' AND at.created_at ${dateClause} ORDER BY at.created_at DESC, at.id DESC`;
            ownerAccountQuery = `SELECT at.id, at.account_id, at.type, at.amount, at.description, at.created_by_user_id, DATE_FORMAT(at.created_at, '%Y-%m-%d %H:%i:%s+07:00') AS created_at, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'owner_deposit' AND at.created_at ${dateClause} ORDER BY at.created_at DESC, at.id DESC`;

            queryParams = params;
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


// ===== CASH RECONCILIATION ENDPOINTS =====

// Get cash reconciliation summary for a specific date
app.get("/api/cash-reconciliation/summary", authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: "Date parameter is required" });
        }

        // Get start and end of the day
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        // Query to get transaction summary by payment method
        const sql = `
            SELECT 
                COALESCE(SUM(CASE WHEN LOWER(payment_method) IN ('cash', 'tunai') THEN total ELSE 0 END), 0) as total_tunai,
                COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'transfer' THEN total ELSE 0 END), 0) as total_transfer,
                COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'gojek' THEN total ELSE 0 END), 0) as total_gojek,
                COALESCE(COUNT(CASE WHEN LOWER(payment_method) IN ('cash', 'tunai') THEN 1 END), 0) as count_tunai,
                COALESCE(COUNT(CASE WHEN LOWER(payment_method) = 'transfer' THEN 1 END), 0) as count_transfer,
                COALESCE(COUNT(CASE WHEN LOWER(payment_method) = 'gojek' THEN 1 END), 0) as count_gojek
            FROM transactions
            WHERE timestamp >= ? AND timestamp <= ?
            AND (isEmployeeMeal = 0 OR isEmployeeMeal IS NULL)
        `;

        const [rows] = await db.query(sql, [startDate, endDate]);
        const summary = rows[0];

        res.json({
            message: "success",
            data: {
                date: date,
                expected: {
                    tunai: parseFloat(summary.total_tunai) || 0,
                    transfer: parseFloat(summary.total_transfer) || 0,
                    gojek: parseFloat(summary.total_gojek) || 0,
                    total: (parseFloat(summary.total_tunai) || 0) + (parseFloat(summary.total_transfer) || 0) + (parseFloat(summary.total_gojek) || 0)
                },
                transactionCount: {
                    tunai: parseInt(summary.count_tunai) || 0,
                    transfer: parseInt(summary.count_transfer) || 0,
                    gojek: parseInt(summary.count_gojek) || 0,
                    total: (parseInt(summary.count_tunai) || 0) + (parseInt(summary.count_transfer) || 0) + (parseInt(summary.count_gojek) || 0)
                }
            }
        });

    } catch (err) {
        console.error("Error fetching cash reconciliation summary:", err);
        res.status(500).json({ error: err.message });
    }
});

// Save cash reconciliation
app.post("/api/cash-reconciliation/save", authenticateToken, async (req, res) => {
    try {
        const { date, actual_tunai, actual_transfer, actual_gojek, notes } = req.body;
        const user_id = req.user.userId;

        if (!date) {
            return res.status(400).json({ error: "Date is required" });
        }

        // Get expected values from transactions
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const summarySql = `
            SELECT 
                COALESCE(SUM(CASE WHEN LOWER(payment_method) IN ('cash', 'tunai') THEN total ELSE 0 END), 0) as total_tunai,
                COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'transfer' THEN total ELSE 0 END), 0) as total_transfer,
                COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'gojek' THEN total ELSE 0 END), 0) as total_gojek
            FROM transactions
            WHERE timestamp >= ? AND timestamp <= ?
            AND (isEmployeeMeal = 0 OR isEmployeeMeal IS NULL)
        `;

        const [summaryRows] = await db.query(summarySql, [startDate, endDate]);
        const expected = summaryRows[0];

        const expected_tunai = parseFloat(expected.total_tunai) || 0;
        const expected_transfer = parseFloat(expected.total_transfer) || 0;
        const expected_gojek = parseFloat(expected.total_gojek) || 0;

        const actual_tunai_val = parseFloat(actual_tunai) || 0;
        const actual_transfer_val = parseFloat(actual_transfer) || 0;
        const actual_gojek_val = parseFloat(actual_gojek) || 0;

        // Calculate variance (expected - actual)
        const variance_tunai = expected_tunai - actual_tunai_val;
        const variance_transfer = expected_transfer - actual_transfer_val;
        const variance_gojek = expected_gojek - actual_gojek_val;

        // Insert or update reconciliation
        const sql = `
            INSERT INTO cash_reconciliations 
            (date, expected_tunai, expected_transfer, expected_gojek, 
             actual_tunai, actual_transfer, actual_gojek,
             variance_tunai, variance_transfer, variance_gojek, notes, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                expected_tunai = VALUES(expected_tunai),
                expected_transfer = VALUES(expected_transfer),
                expected_gojek = VALUES(expected_gojek),
                actual_tunai = VALUES(actual_tunai),
                actual_transfer = VALUES(actual_transfer),
                actual_gojek = VALUES(actual_gojek),
                variance_tunai = VALUES(variance_tunai),
                variance_transfer = VALUES(variance_transfer),
                variance_gojek = VALUES(variance_gojek),
                notes = VALUES(notes),
                user_id = VALUES(user_id)
        `;

        await db.query(sql, [
            date, expected_tunai, expected_transfer, expected_gojek,
            actual_tunai_val, actual_transfer_val, actual_gojek_val,
            variance_tunai, variance_transfer, variance_gojek, notes, user_id
        ]);

        await logActivity(user_id, 'Simpan Rekonsiliasi', 'cash_reconciliation', date, `Simpan rekonsiliasi kas tanggal ${date}`);
        res.json({
            message: "success",
            data: {
                date,
                expected: { tunai: expected_tunai, transfer: expected_transfer, gojek: expected_gojek },
                actual: { tunai: actual_tunai_val, transfer: actual_transfer_val, gojek: actual_gojek_val },
                variance: { tunai: variance_tunai, transfer: variance_transfer, gojek: variance_gojek }
            }
        });

    } catch (err) {
        console.error("Error saving cash reconciliation:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get cash reconciliation history with pagination and date filters
app.get("/api/cash-reconciliation/history", authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const offset = (page - 1) * limit;

        let whereClauses = [];
        let queryParams = [];

        if (startDate && startDate !== 'null' && startDate !== '') {
            whereClauses.push("cr.date >= ?");
            queryParams.push(startDate);
        }
        if (endDate && endDate !== 'null' && endDate !== '') {
            whereClauses.push("cr.date <= ?");
            queryParams.push(endDate);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query to get total count
        const countSql = `SELECT COUNT(*) as totalItems FROM cash_reconciliations cr ${whereSql}`;
        const [countRows] = await db.query(countSql, queryParams);
        const totalItems = countRows[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        const sql = `
            SELECT 
                cr.*,
                u.username as reconciled_by
            FROM cash_reconciliations cr
            LEFT JOIN users u ON cr.user_id = u.id
            ${whereSql}
            ORDER BY cr.date DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await db.query(sql, [...queryParams, limit, offset]);

        res.json({
            message: "success",
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limit
            }
        });

    } catch (err) {
        console.error("Error fetching cash reconciliation history:", err);
        res.status(500).json({ error: err.message });
    }
});

// Delete cash reconciliation
app.delete("/api/cash-reconciliation/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const sql = "DELETE FROM cash_reconciliations WHERE id = ?";
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Reconciliation record not found" });
        }

        await logActivity(req.user.userId, 'Hapus Rekonsiliasi', 'cash_reconciliation', id, `Hapus rekonsiliasi kas ID ${id}`);
        res.json({ message: "success", deletedId: id });

    } catch (err) {
        console.error("Error deleting cash reconciliation:", err);
        res.status(500).json({ error: err.message });
    }
});


// --- Database Backup & Restore Endpoints ---

// Backup Database (Export to JSON)
app.get("/api/database/backup", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const [tables] = await db.query("SHOW TABLES");
        const dbName = process.env.DB_DATABASE || 'database';
        const tableNames = tables.map(t => Object.values(t)[0]);

        const backupData = {
            version: "1.1",
            timestamp: new Date().toISOString(),
            database: dbName,
            tableCount: tableNames.length,
            summary: {},
            data: {}
        };

        for (const tableName of tableNames) {
            const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
            backupData.data[tableName] = rows;
            backupData.summary[tableName] = rows.length;
        }

        const fileName = `backup-${dbName}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

        res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-type', 'application/json');
        res.write(JSON.stringify(backupData, null, 2));
        res.end();
    } catch (err) {
        console.error("Error creating database backup:", err);
        res.status(500).json({ error: "Failed to create backup: " + err.message });
    }
});

// Restore Database (Import from JSON)
app.post("/api/database/restore", authenticateToken, authorizeRoles('admin', 'owner'), upload.single('backupFile'), async (req, res) => {
    let connection;
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No backup file uploaded." });
        }

        // Ensure we can read the file
        const backupContent = fs.readFileSync(req.file.path, 'utf8');
        const backupData = JSON.parse(backupContent);

        if (!backupData.data || typeof backupData.data !== 'object') {
            return res.status(400).json({ error: "Invalid backup file format." });
        }

        connection = await db.getConnection();

        // Increase timeout for this connection if possible
        await connection.query("SET SESSION wait_timeout = 600");
        await connection.query("SET SESSION interactive_timeout = 600");

        await connection.beginTransaction();

        // 1. Disable foreign key checks
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");

        // 2. Clear and Insert data for each table
        for (const [tableName, rows] of Object.entries(backupData.data)) {
            if (!Array.isArray(rows)) continue;

            // Clear table
            await connection.query(`DELETE FROM \`${tableName}\``);

            if (rows.length > 0) {
                const columns = Object.keys(rows[0]);
                const sql = `INSERT INTO \`${tableName}\` (\`${columns.join('`,`')}\`) VALUES ?`;

                // Map rows into an array of arrays for bulk insert
                const values = rows.map(row => {
                    return columns.map(col => {
                        let val = row[col];

                        // Handle potential JSON objects
                        if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                            return JSON.stringify(val);
                        }

                        // NEW: Handle ISO Date strings for MySQL DATETIME columns
                        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
                            // Convert '2025-11-21T23:37:58.000Z' to '2025-11-21 23:37:58'
                            return val.replace('T', ' ').split('.')[0].replace('Z', '');
                        }

                        return val;
                    });
                });

                // Execute Bulk Insert (much faster)
                await connection.query(sql, [values]);
            }
        }

        // 3. Re-enable foreign key checks
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");

        await connection.commit();

        // Cleanup the uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        await logActivity(req.user.userId, 'RUBAH DATABASE (RESTORE)', 'system', 'backup', 'Admin melakukan restore database dari file cadangan.');
        res.json({ message: "Database restored successfully!" });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
                await connection.query("SET FOREIGN_KEY_CHECKS = 1");
            } catch (rollbackErr) {
                console.error("Rollback error:", rollbackErr);
            }
        }
        console.error("Error restoring database:", err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: "Failed to restore database: " + err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// --- Manual Point Management Endpoints ---

// Get all customers (simple list for selection)
app.get("/api/customers/simple", authenticateToken, authorizeRoles('admin', 'owner', 'kasir', 'penjual'), async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, username, phone, points FROM users WHERE role = 'pelanggan' ORDER BY username ASC");
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add manual points
app.post("/api/customers/points/manual", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { customer_id, amount, description } = req.body;
        const adminId = req.user.userId;

        if (!customer_id || !amount) {
            return res.status(400).json({ error: "Customer ID and amount are required" });
        }

        await connection.beginTransaction();

        // Update user points
        await connection.query("UPDATE users SET points = points + ? WHERE id = ?", [amount, customer_id]);

        // Record history
        await connection.query(
            "INSERT INTO points_history (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            [customer_id, amount, amount >= 0 ? 'earn' : 'redeem', description || 'Manual adjustment by admin']
        );

        await connection.commit();

        await logActivity(adminId, 'Manual Point Adjustment', 'user', customer_id, `Adjusted points for user ${customer_id} by ${amount}`);

        res.json({ message: "Points updated successfully" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});


// --- Employee Credits Endpoints ---

// Get all credits
app.get("/api/credits", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const sql = "SELECT * FROM employee_credits ORDER BY credit_date DESC";
        const [rows] = await db.query(sql);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new credit
app.post("/api/credits", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { employee_name, amount, description, credit_date, due_date } = req.body;
        if (!employee_name || !amount || !credit_date) {
            return res.status(400).json({ error: "Nama karyawan, jumlah, dan tanggal wajib diisi" });
        }

        const sql = "INSERT INTO employee_credits (employee_name, amount, description, credit_date, due_date, status) VALUES (?, ?, ?, ?, ?, 'unpaid')";
        const [result] = await db.query(sql, [employee_name, amount, description, credit_date, due_date || null]);

        await logActivity(req.user.userId, 'Tambah Kasbon', 'credit', result.insertId, `Kasbon baru: ${employee_name} sebesar Rp ${parseFloat(amount).toLocaleString('id-ID')}`);
        res.status(201).json({ message: "Data kasbon berhasil ditambahkan", data: { id: result.insertId, ...req.body, status: 'unpaid' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update credit (e.g. mark as paid, edit details)
app.put("/api/credits/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_name, amount, description, credit_date, due_date, status } = req.body;

        const sql = "UPDATE employee_credits SET employee_name = ?, amount = ?, description = ?, credit_date = ?, due_date = ?, status = ? WHERE id = ?";
        const [result] = await db.query(sql, [employee_name, amount, description, credit_date, due_date || null, status, id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: "Data tidak ditemukan" });

        await logActivity(req.user.userId, 'Update Kasbon', 'credit', id, `Pembaruan kasbon ID ${id} (${employee_name})`);
        res.json({ message: "Data kasbon berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete credit
app.delete("/api/credits/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "DELETE FROM employee_credits WHERE id = ?";
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: "Data tidak ditemukan" });

        await logActivity(req.user.userId, 'Hapus Kasbon', 'credit', id, `Hapus kasbon ID ${id}`);
        res.json({ message: "Data kasbon berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public API to get all menu items for guest users (no authentication required)
// --- OneSignal Daily Summary ---
app.post("/api/admin/send-daily-summary", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Hitung total penjualan hari ini dari tabel transactions
        const [salesRows] = await db.query(
            "SELECT SUM(total) as total_sales, COUNT(*) as total_transactions FROM transactions WHERE DATE(timestamp) = ?",
            [today]
        );

        const totalSales = salesRows[0].total_sales || 0;
        const totalTransactions = salesRows[0].total_transactions || 0;

        // Cari ID semua owner
        const [owners] = await db.query('SELECT id FROM users WHERE role = ?', ['owner']);
        const ownerIds = owners.map(o => o.id);

        if (ownerIds.length > 0) {
            await sendUniversalNotification(
                ownerIds,
                `Laporan Penjualan Hari Ini (${today}): Rp ${totalSales.toLocaleString('id-ID')} dengan total ${totalTransactions} transaksi.`,
                'Ringkasan Harian 📊',
                { date: today, type: 'daily_summary' }
            );
            await logActivity(req.user.userId, 'Kirim Summary Harian', 'notification', 'all_owners', `Admin mengirim ringkasan harian ke semua owner via push notification`);
            res.json({ message: "Laporan harian berhasil dikirim ke semua Owner." });
        } else {
            res.status(404).json({ error: "Tidak ditemukan user dengan role owner." });
        }
    } catch (err) {
        console.error('Error sending daily summary:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Chat System Endpoints ---

// Kirim Pesan
app.post("/api/messages", authenticateToken, async (req, res) => {
    try {
        const { receiver_id, message, order_id, image_url } = req.body;
        const sender_id = req.user.userId;

        if (!receiver_id || (!message && !image_url)) {
            return res.status(400).json({ error: "Receiver ID dan pesan/gambar wajib diisi" });
        }

        // Process image if it's base64
        const processedImageUrl = await processBase64Image(image_url, 'chat');

        const sql = "INSERT INTO messages (sender_id, receiver_id, message, order_id, image_url) VALUES (?, ?, ?, ?, ?)";
        const [result] = await db.query(sql, [sender_id, receiver_id, message || '', order_id || null, processedImageUrl || null]);

        // Kirim Notifikasi Push
        // 1. Cek peran penerima
        const [receiverRows] = await db.query("SELECT role FROM users WHERE id = ?", [receiver_id]);
        const receiverRole = receiverRows[0]?.role;
        const sellerRoles = ['admin', 'owner', 'penjual', 'kasir'];

        let targetUserIds = [receiver_id];

        // 2. Jika pesan ditujukan ke salah satu tim seller, notifikasi ke SELURUH tim seller
        if (sellerRoles.includes(receiverRole)) {
            const [allSellers] = await db.query("SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')");
            targetUserIds = allSellers.map(s => s.id);
        }

        // 3. Jalankan pengiriman notifikasi (kecuali ke pengirim sendiri)
        sendUniversalNotification(
            targetUserIds,
            message || '[Gambar]',
            `Pesan dari ${req.user.username}`,
            { type: 'chat', senderId: sender_id, orderId: order_id, hasImage: !!processedImageUrl },
            sender_id // excludedUserId
        );

        res.status(201).json({
            message: "Pesan terkirim",
            data: { id: result.insertId, sender_id, receiver_id, message, order_id, image_url: processedImageUrl, created_at: new Date() }
        });
    } catch (err) {
        console.error("Error sending message:", err);
        const errorLog = `\n--- MESSAGE ERROR ---\nTime: ${new Date().toISOString()}\nError: ${err.message}\nStack: ${err.stack}\n---------------------\n`;
        try {
            fs.appendFileSync(path.join(__dirname, 'error.log'), errorLog);
        } catch (e) { }
        res.status(500).json({ error: err.message });
    }
});

// Ambil Riwayat Chat dengan User Tertentu
app.get("/api/messages/history/:otherUserId", authenticateToken, async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const myId = req.user.userId;
        const myRole = req.user.role;
        const sellerRoles = ['admin', 'owner', 'penjual', 'kasir'];
        const isSeller = sellerRoles.includes(myRole);

        let sql;
        let params;

        if (isSeller) {
            // Jika Seller, lihat semua chat antara pelanggan (otherUserId) dengan SELURUH Tim Seller
            sql = `
                SELECT m.*, u.username as sender_name 
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE (m.sender_id = ? AND m.receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')))
                   OR (m.sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')) AND m.receiver_id = ?)
                ORDER BY m.created_at ASC
            `;
            params = [otherUserId, otherUserId];
        } else {
            // Jika Pelanggan, lihat chat antara SAYA dengan SELURUH Tim Seller
            // (Agar balasan dari Kasir/Admin/Owner semuanya muncul di satu layar)
            sql = `
                SELECT m.*, u.username as sender_name 
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE (m.sender_id = ? AND m.receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')))
                   OR (m.sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')) AND m.receiver_id = ?)
                ORDER BY m.created_at ASC
            `;
            params = [myId, myId];
        }

        const [rows] = await db.query(sql, params);
        res.json({ data: rows });
    } catch (err) {
        console.error("Error fetching history:", err);
        res.status(500).json({ error: err.message });
    }
});

// Hapus Riwayat Chat dengan User Tertentu
app.delete("/api/messages/history/:otherUserId", authenticateToken, async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const myId = req.user.userId;
        const myRole = req.user.role;
        const sellerRoles = ['admin', 'owner', 'penjual', 'kasir'];
        const isSeller = sellerRoles.includes(myRole);

        // Target user ID adalah pelanggan (jika saya seller, itu otherUserId. Jika saya pelanggan, itu myId)
        const targetCustomerId = isSeller ? otherUserId : myId;

        // Hapus SEMUA pesan antara pelanggan tersebut dengan SELURUH Tim Seller
        // Gunakan hard delete sesuai kode asli agar benar-benar hilang dari DB
        const sql = `
            DELETE FROM messages 
            WHERE (sender_id = ? AND receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')))
               OR (sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')) AND receiver_id = ?)
        `;
        await db.query(sql, [targetCustomerId, targetCustomerId]);

        // Log aktivitas penghapusan riwayat
        await logActivity(myId, 'Hapus Riwayat Chat', 'chat', targetCustomerId, `Menghapus riwayat chat dengan user ID ${targetCustomerId}`);

        res.json({ message: "Riwayat obrolan tim berhasil dihapus" });
    } catch (err) {
        console.error("Error deleting history:", err);
        res.status(500).json({ error: err.message });
    }
});

// Ambil Daftar Percakapan Aktif (Inbox)
app.get("/api/messages/conversations", authenticateToken, async (req, res) => {
    try {
        const myId = req.user.userId;
        const myRole = req.user.role;
        const sellerRoles = ['admin', 'owner', 'penjual', 'kasir'];
        const isSeller = sellerRoles.includes(myRole);

        let sql;
        let params;

        if (isSeller) {
            // Logika Universal Inbox untuk Tim Seller
            sql = `
                SELECT 
                    u.id as user_id, 
                    u.username, 
                    u.role,
                    u.avatar_url,
                    m.message as last_message, 
                    m.created_at as last_message_time,
                    (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')) AND is_read = 0) as unread_count
                FROM users u
                JOIN messages m ON m.id = (
                    SELECT MAX(id) 
                    FROM messages 
                    WHERE (sender_id = u.id AND receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')))
                       OR (sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')) AND receiver_id = u.id)
                )
                WHERE u.role NOT IN ('admin', 'owner', 'penjual', 'kasir')
                ORDER BY m.created_at DESC
            `;
            params = [];
        } else {
            // Logika Inbox untuk Pelanggan (Hanya menampilkan satu entitas "Toko")
            sql = `
                SELECT 
                    u.id as user_id, 
                    'Pusat Bantuan (Toko)' as username, 
                    u.role,
                    u.avatar_url,
                    m.message as last_message, 
                    m.created_at as last_message_time,
                    (SELECT COUNT(*) FROM messages WHERE sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')) AND receiver_id = ? AND is_read = 0) as unread_count
                FROM users u
                JOIN messages m ON m.id = (
                    SELECT MAX(id) 
                    FROM messages 
                    WHERE (sender_id = ? AND receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')))
                       OR (sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')) AND receiver_id = ?)
                )
                WHERE u.id = m.sender_id OR u.id = m.receiver_id
                LIMIT 1
            `;
            params = [myId, myId, myId];
        }

        const [rows] = await db.query(sql, params);
        res.json({ data: rows });
    } catch (err) {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ error: err.message });
    }
});

// Tandai pesan sudah dibaca
app.put("/api/messages/read/:senderId", authenticateToken, async (req, res) => {
    try {
        const { senderId } = req.params;
        const myId = req.user.userId;
        const myRole = req.user.role;
        const isSeller = ['admin', 'owner', 'penjual', 'kasir'].includes(myRole);

        let sql;
        if (isSeller) {
            // Jika dibaca oleh salah satu SELLER, tandai pesan dari PELANGGAN ini (senderId) sudah dibaca oleh TIM SELLER
            sql = "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')) AND is_read = 0";
            await db.query(sql, [senderId]);
        } else {
            // Jika dibaca oleh PELANGGAN, tandai SEMUA pesan dari SELURUH TIM SELLER ke Pelanggan ini sebagai sudah dibaca
            sql = "UPDATE messages SET is_read = 1 WHERE sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')) AND receiver_id = ? AND is_read = 0";
            await db.query(sql, [myId]);
        }

        res.json({ message: "Pesan ditandai sudah dibaca" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ambil ID Penjual/Admin/Owner yang tersedia untuk dichat oleh pelanggan
app.get("/api/messages/contacts", authenticateToken, async (req, res) => {
    try {
        let sql;
        if (req.user.role === 'pelanggan' || req.user.role === 'user' || req.user.role === 'keluarga') {
            // Pelanggan/User/Keluarga hanya bisa melihat Admin, Owner, Penjual, dan Kasir
            sql = "SELECT id, username, role, avatar_url FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir')";
        } else {
            // Admin/Owner/Penjual/Kasir bisa melihat semua tipe pelanggan
            sql = "SELECT id, username, role, avatar_url FROM users WHERE role IN ('pelanggan', 'user', 'keluarga', 'guest')";
        }
        const [rows] = await db.query(sql);
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ambil Pesanan Aktif untuk disematkan di Chat
app.get("/api/messages/active-order/:userId", authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params; // ID pelanggan
        const sql = `
            SELECT id, total, status, created_at, items
            FROM orders 
            WHERE user_id = ? AND status IN ('pending', 'accepted')
            ORDER BY created_at DESC LIMIT 1
        `;
        const [rows] = await db.query(sql, [userId]);
        res.json({ data: rows[0] || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user notification settings
app.get("/api/user/notification-settings", authenticateToken, async (req, res) => {
    try {
        const sql = 'SELECT notification_settings FROM users WHERE id = ?';
        const [rows] = await db.query(sql, [req.user.userId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Default settings if not set
        const defaultSettings = {
            orders: true,
            chat: true,
            promo: false
        };

        const settings = rows[0].notification_settings
            ? JSON.parse(rows[0].notification_settings)
            : defaultSettings;

        res.json({
            message: "success",
            data: settings
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user notification settings
app.put("/api/user/notification-settings", authenticateToken, async (req, res) => {
    try {
        const { orders, chat, promo } = req.body;

        const settings = {
            orders: orders !== undefined ? orders : true,
            chat: chat !== undefined ? chat : true,
            promo: promo !== undefined ? promo : false
        };

        const sql = 'UPDATE users SET notification_settings = ? WHERE id = ?';
        await db.query(sql, [JSON.stringify(settings), req.user.userId]);

        await logActivity(req.user.userId, 'Update Notification Settings', 'user', req.user.userId, `User mengubah pengaturan notifikasi`);

        res.json({
            message: "success",
            data: settings
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Promo Management Endpoints ---

// Get all promos (Seller/Admin view - including inactive)
app.get("/api/promos", authenticateToken, authorizeRoles('admin', 'owner', 'penjual'), async (req, res) => {
    try {
        const sql = "SELECT * FROM promos ORDER BY created_at DESC";
        const [rows] = await db.query(sql);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get active promos (Public/Customer view)
app.get("/api/customer/promos", async (req, res) => {
    try {
        const sql = "SELECT * FROM promos WHERE is_active = 1 ORDER BY created_at DESC";
        const [rows] = await db.query(sql);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new promo
app.post("/api/promos", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { title, description, code, icon, color, expiry, is_active, discount_value, discount_type, min_purchase, is_hero, image_url, badge_text, is_one_time } = req.body;
        if (!title && !is_hero) { // Title mandatory unless it's a banner (sometimes banners have no title)
            // But let's keep validation simple for now or align with frontend
        }
        if (!title) {
            return res.status(400).json({ error: "Judul promo wajib diisi" });
        }

        // Process image if it's base64
        const processedImageUrl = await processBase64Image(image_url, 'promo');

        const sql = `
            INSERT INTO promos (title, description, code, icon, color, expiry, is_active, discount_value, discount_type, min_purchase, is_hero, image_url, badge_text, is_one_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const cleanMin = min_purchase ? (typeof min_purchase === 'string' ? parseFloat(min_purchase.replace(/[^\d.]/g, '')) : parseFloat(min_purchase)) : 0;
        const params = [
            title,
            description,
            code || null,
            icon || 'Ticket',
            color || '#059669',
            expiry || null,
            is_active === undefined ? 1 : is_active,
            discount_value || 0,
            discount_type || 'fixed',
            cleanMin,
            is_hero ? 1 : 0,
            processedImageUrl || null,
            badge_text || null,
            is_one_time ? 1 : 0
        ];

        const [result] = await db.query(sql, params);

        await logActivity(req.user.userId, 'Tambah Promo', 'promo', result.insertId, `Promo baru: ${title}`);

        res.status(201).json({
            message: "Promo berhasil ditambahkan",
            data: { id: result.insertId, ...req.body, image_url: processedImageUrl }
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Kode promo sudah digunakan" });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update promo
app.put("/api/promos/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, code, icon, color, expiry, is_active, discount_value, discount_type, min_purchase, is_hero, image_url, badge_text, is_one_time } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Judul promo wajib diisi" });
        }

        const cleanMin = min_purchase ? (typeof min_purchase === 'string' ? parseFloat(min_purchase.replace(/[^\d.]/g, '')) : parseFloat(min_purchase)) : 0;

        // Process image if it's base64
        const processedImageUrl = await processBase64Image(image_url, 'promo');

        const sql = `
            UPDATE promos 
            SET title=?, description=?, code=?, icon=?, color=?, expiry=?, is_active=?, discount_value=?, discount_type=?, min_purchase=?, is_hero=?, image_url=?, badge_text=?, is_one_time=?
            WHERE id=?
        `;
        const params = [
            title,
            description,
            code || null,
            icon || 'Ticket',
            color || '#059669',
            expiry || null,
            is_active === undefined ? 1 : is_active,
            discount_value || 0,
            discount_type || 'fixed',
            cleanMin,
            is_hero ? 1 : 0,
            processedImageUrl || null,
            badge_text || null,
            is_one_time ? 1 : 0,
            id
        ];

        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Promo tidak ditemukan" });
        }

        await logActivity(req.user.userId, 'Edit Promo', 'promo', id, `Promo diperbarui: ${title}`);

        res.json({ message: "Promo berhasil diperbarui", image_url: processedImageUrl });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Kode promo sudah digunakan" });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete promo
app.delete("/api/promos/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const [promo] = await db.query("SELECT title FROM promos WHERE id = ?", [id]);

        const sql = "DELETE FROM promos WHERE id = ?";
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Promo tidak ditemukan" });
        }

        await logActivity(req.user.userId, 'Hapus Promo', 'promo', id, `Promo dihapus: ${promo[0]?.title || id}`);

        res.json({ message: "Promo berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Validate promo code
app.post("/api/promos/validate", (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        jwt.verify(token, ACTUAL_JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = { userId: user.userId, username: user.username, role: user.role.trim() };
            }
            next();
        });
    } else {
        next();
    }
}, async (req, res) => {
    try {
        const { code, total } = req.body;
        const userId = req.user ? req.user.userId : null;

        if (!code) {
            return res.status(400).json({ error: "Kode promo harus diisi" });
        }

        const sql = "SELECT * FROM promos WHERE code = ? AND is_active = 1 AND is_hero = 0";
        const [rows] = await db.query(sql, [code]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Kode promo tidak valid atau sudah tidak aktif" });
        }

        const promo = rows[0];

        // Check if one-time use per user is enabled
        if (promo.is_one_time && userId) {
            const [usageRows] = await db.query(
                "SELECT id FROM orders WHERE user_id = ? AND promo_id = ? AND status NOT IN ('cancelled', 'rejected') LIMIT 1",
                [userId, promo.id]
            );
            if (usageRows.length > 0) {
                return res.status(400).json({ error: "Anda sudah menggunakan kupon ini sebelumnya. Kupon ini hanya berlaku 1x per pengguna." });
            }
        }

        const cleanTotal = total !== undefined ? (typeof total === 'string' ? parseFloat(total.replace(/[^\d.]/g, '')) : parseFloat(total)) : undefined;
        const cleanMin = typeof promo.min_purchase === 'string' ? parseFloat(promo.min_purchase.replace(/[^\d.]/g, '')) : parseFloat(promo.min_purchase);

        console.log('Validating promo:', { code, total: cleanTotal, promo_min_purchase: cleanMin });

        // Check minimum purchase if total is provided
        if (cleanTotal !== undefined && cleanTotal < cleanMin) {
            return res.status(400).json({
                error: `Minimal pembelian untuk promo ini adalah Rp ${cleanMin.toLocaleString('id-ID')}`,
                min_purchase: cleanMin
            });
        }

        res.json({
            message: "Promo berhasil diterapkan",
            data: promo
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// Get usage history for a specific promo with pagination
app.get("/api/promos/:id/usage", authenticateToken, authorizeRoles('admin', 'owner', 'penjual'), async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // In the orders table, we have customer_name, customer_phone, customer_address
        const sql = `
            SELECT 
                o.id as order_id,
                o.customer_name,
                o.customer_phone,
                o.total,
                o.promo_discount,
                o.created_at,
                o.status,
                u.username as user_account
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.promo_id = ?
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query(sql, [id, limit, offset]);

        // Also get total count for pagination info
        const [countResult] = await db.query("SELECT COUNT(*) as total FROM orders WHERE promo_id = ?", [id]);
        const totalCount = countResult[0].total;

        res.json({
            message: "success",
            data: rows,
            pagination: {
                total: totalCount,
                page,
                limit,
                hasMore: offset + rows.length < totalCount
            }
        });
    } catch (err) {
        console.error("Error fetching promo usage:", err);
        res.status(500).json({ error: err.message });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

// Default response for any other request
app.use(function (req, res) {
    res.status(404).send();
});
