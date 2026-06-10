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
const crypto = require('crypto');
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
const sendEmail = require('./utils/mailer');
const { sendOrderEmailNotification, sendNewsBroadcastEmail } = require('./utils/orderEmails');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    },
    pingTimeout: 30000,
    pingInterval: 10000
});
app.set('io', io);

// Socket.io Connection Logic
const onlineUsers = new Map(); // userId -> { role, sockets: Set<socketId> }
const activeCalls = new Map(); // callerId (customer) -> acceptorId (seller) — track panggilan yang sudah diangkat
const ringingCalls = new Map(); // callerId -> { callerName, type, targetId } — track panggilan yang masih berdering

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('user_connected', (userData) => {
        console.log('Received user_connected:', userData);
        if (!userData || !userData.userId) return;
        const { userId, role } = userData;

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, {
                role,
                name: userData.name || 'Pelanggan',
                sockets: new Set()
            });
        } else {
            // Update role/name if changed
            const existing = onlineUsers.get(userId);
            existing.role = role;
            if (userData.name) existing.name = userData.name;
        }
        onlineUsers.get(userId).sockets.add(socket.id);

        // Join user-specific room for targeted notifications
        socket.join(`user_${userId}`);

        // Join sellers room if applicable
        const sellerRoles = ['admin', 'owner', 'penjual', 'kasir'];
        if (sellerRoles.includes(role)) {
            socket.join('sellers');
        }

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

        // --- PERSISTENCE CALL (Membantu UI Muncul saat Klik Notifikasi) ---
        if (sellerRoles.includes(role)) {
            for (let [callerId, callData] of ringingCalls) {
                const targetIdStr = String(callData.targetId);
                // Jika targetId adalah user ini sendiri ATAU targetId adalah '3' (Grup Seller)
                if (targetIdStr === String(userId) || targetIdStr === '3') {
                    socket.emit('incoming_call', {
                        callerId: callerId,
                        callerName: callData.callerName,
                        type: callData.type,
                        isGroupCall: true,
                        targetId: callData.targetId
                    });
                    console.log(`[Socket] Persistence call sent to reconnected seller ${userId}`);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        const userId = socket.userId;

        if (userId && onlineUsers.has(userId)) {
            const userData = onlineUsers.get(userId);
            userData.sockets.delete(socket.id);

            if (userData.sockets.size === 0) {
                const role = userData.role;
                onlineUsers.delete(userId);
                io.emit('user_status', { userId: userId, role, status: 'offline' });

                // --- CLEANUP CALLS ON DISCONNECT ---
                const uIdStr = String(userId);

                // 1. Jika user yang disconnect adalah PEMANGGIL (Caller)
                if (activeCalls.has(uIdStr)) {
                    const acceptorId = activeCalls.get(uIdStr);
                    activeCalls.delete(uIdStr);
                    io.to(`user_${acceptorId}`).emit('call_ended');
                    console.log(`[Socket] Cleanup active call: Caller ${uIdStr} disconnected`);
                }

                // 2. Jika user yang disconnect adalah PENERIMA (Acceptor) - Perlu cari di values
                for (let [callerId, acceptorId] of activeCalls.entries()) {
                    if (String(acceptorId) === uIdStr) {
                        activeCalls.delete(callerId);
                        io.to(`user_${callerId}`).emit('call_ended');
                        console.log(`[Socket] Cleanup active call: Acceptor ${uIdStr} disconnected`);
                    }
                }

                // 3. Jika user yang disconnect sedang memanggil (Ringing)
                if (ringingCalls.has(uIdStr)) {
                    const callData = ringingCalls.get(uIdStr);
                    ringingCalls.delete(uIdStr);
                    io.to('sellers').emit('call_handled', { by: 'disconnect', callerId: uIdStr });
                    io.to(`user_${callData.targetId}`).emit('call_ended');
                    console.log(`[Socket] Cleanup ringing call: Caller ${uIdStr} disconnected`);
                }

                // 4. Jika user adalah seller yang mungkin sedang dituju panggilan ringing
                // Beritahu sistem jika perlu, tapi biasanya handled oleh filter availableSellers
            }
        }
    });

    // --- Video/Voice Call Signaling ---
    socket.on('start_call', async (data) => {
        const { to, from, callerName, type } = data;
        const cName = callerName || (onlineUsers.get(from)?.name) || "Pelanggan";

        // Cek siapa saja yang sedang sibuk (dalam panggilan aktif)
        const busy = new Set();
        for (const [caller, acceptor] of activeCalls) {
            busy.add(String(caller));
            busy.add(String(acceptor));
        }

        // 1. Cek jika si pemanggil sendiri sedang sibuk (mencegah double call)
        if (busy.has(String(from))) {
            console.log(`[Socket] Caller ${from} is already in a call.`);
            socket.emit('call_busy', { to: from, message: 'Anda sedang dalam panggilan lain.' });
            return;
        }

        console.log(`[Socket] Call started from ${from} (${cName}) to ${to} type: ${type}`);

        let targetRole = null;
        const targetInfo = onlineUsers.get(to) || onlineUsers.get(Number(to)) || onlineUsers.get(String(to));

        if (targetInfo) {
            targetRole = targetInfo.role;
        } else {
            try {
                const [rows] = await db.query('SELECT role FROM users WHERE id = ?', [to]);
                if (rows.length > 0) targetRole = rows[0].role;
            } catch (err) {
                console.error('[Socket] Error checking user role:', err);
            }
        }

        const sellerRoles = ['admin', 'owner', 'penjual', 'kasir'];

        // Catat panggilan yang sedang berdering
        ringingCalls.set(String(from), {
            callerName: cName,
            type: type,
            targetId: to
        });

        if (targetRole && sellerRoles.includes(targetRole)) {
            // Panggilan ke tim Seller (Group Call)
            const sellerRoom = io.sockets.adapter.rooms.get('sellers');
            const onlineSellers = sellerRoom ? Array.from(sellerRoom) : [];

            // Filter hanya seller yang TIDAK sedang sibuk melayani orang lain
            const availableSellers = onlineSellers.filter(sId => {
                let uId = null;
                for (let [userId, data] of onlineUsers) {
                    if (data.sockets.has(sId)) {
                        uId = userId;
                        break;
                    }
                }
                return uId && !busy.has(String(uId));
            });

            if (availableSellers.length > 0) {
                // 1. Kirim via Socket (untuk yang sedang buka aplikasi)
                availableSellers.forEach(sId => {
                    io.to(sId).emit('incoming_call', {
                        callerId: from,
                        callerName: cName,
                        type: type,
                        isGroupCall: true,
                        targetId: to
                    });
                });

                // 2. Kirim via Push Notification (BUKAN cuma yang online, tapi SEMUA seller di DB)
                // Kita kirim null sebagai userIds agar sendUniversalNotification melakukan broadcast ke semua seller
                sendUniversalNotification(
                    null, // Pass null to trigger broadcast logic for 'incoming_call'
                    `Ada panggilan ${type === 'video' ? 'Video' : 'Suara'} dari ${cName}`,
                    'Panggilan Masuk 📞',
                    {
                        type: 'incoming_call',
                        callerId: from,
                        callerName: cName,
                        callType: type
                    }
                ).catch(e => console.error('[Call Notify] Error sending push:', e));

                console.log(`[Socket] Broadcasting call and push to sellers`);
            } else {
                // Semua seller online tapi sedang sibuk melayani pelanggan lain
                console.log(`[Socket] All sellers are busy for caller ${from}`);
                socket.emit('call_busy', { to: from, message: 'Semua petugas sedang sibuk melayani panggilan lain.' });
            }
        } else {
            // Panggilan personal 1-to-1
            if (busy.has(String(to))) {
                console.log(`[Socket] Target ${to} is busy.`);
                socket.emit('call_busy', { to: from });
                return;
            }
            io.to(`user_${to}`).emit('incoming_call', {
                callerId: from,
                callerName: cName,
                type: type
            });
        }
    });

    socket.on('accept_call', (data) => {
        const { to } = data; // to = callerId (customer)
        const acceptedBy = socket.userId;
        const acceptedName = onlineUsers.get(acceptedBy)?.name || "Staf Berkah";

        // Tandai call ini sebagai aktif agar seller lain yang menolak tidak memutus panggilan
        activeCalls.set(String(to), String(acceptedBy));
        ringingCalls.delete(String(to)); // Pindah dari ringing ke active
        console.log(`[Socket] Call accepted by ${acceptedBy} (${acceptedName}) for: ${to}. activeCalls size: ${activeCalls.size}`);

        io.to(`user_${to}`).emit('call_accepted', {
            acceptedBy: acceptedBy,
            acceptedName: acceptedName
        });

        // Beritahu seller lain bahwa panggilan ini sudah diambil
        io.to('sellers').emit('call_handled', { by: acceptedBy, callerId: to });
    });

    socket.on('reject_call', (data) => {
        const { to } = data; // to = callerId (customer)
        const callAlreadyActive = activeCalls.has(String(to));

        console.log(`[Socket] Call rejected by ${socket.userId} for: ${to}. Already active: ${callAlreadyActive}`);

        if (!callAlreadyActive) {
            // Panggilan belum diangkat siapapun → kirim penolakan ke customer
            io.to(`user_${to}`).emit('call_rejected');
        } else {
            // Panggilan sudah diangkat seller lain → JANGAN putus, cukup tutup popup si penolak
            console.log(`[Socket] Reject ignored — call already active with ${activeCalls.get(String(to))}`);
        }

        // Selalu beritahu sellers untuk tutup popup berdering
        io.to('sellers').emit('call_handled', { by: socket.userId, callerId: to });
    });

    socket.on('end_call', (data) => {
        const { to } = data;
        console.log(`[Socket] Call ended by ${socket.userId} for: ${to}`);
        io.to(`user_${to}`).emit('call_ended');

        // Bersihkan tracking panggilan aktif dari kedua sisi
        activeCalls.delete(String(socket.userId));
        activeCalls.delete(String(to));
        ringingCalls.delete(String(socket.userId));
        ringingCalls.delete(String(to));

        // Jika pemanggil (customer) menutup, beritahu semua seller agar berhenti berdering
        io.to('sellers').emit('call_handled', { by: 'caller', callerId: socket.userId });
    });

    socket.on('call_busy', (data) => {
        const { to } = data;
        console.log(`[Socket] User busy for: ${to}`);
        io.to(`user_${to}`).emit('call_busy');
    });

    // Event khusus WebRTC (SDP & ICE Candidates)
    socket.on('webrtc_signal', (data) => {
        const { to, signal } = data;
        // Kirim sinyal WebRTC ke target user
        io.to(`user_${to}`).emit('webrtc_signal', {
            from: socket.userId,
            signal: signal
        });
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

const PORT = process.env.PORT || 4000;
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

        if (accountType === 'lapak' && (userRole === 'admin' || userRole === 'user' || userRole === 'kasir' || userRole === 'owner')) {
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
    try {
        let normalizedUserIds = userIds ? (Array.isArray(userIds) ? userIds : [userIds]) : null;
        const type = data.type || 'orders'; // Default type is 'orders'

        // 1. Fetch users and their preferences
        let sql = "SELECT id, role, push_token, notification_settings FROM users WHERE 1=1";
        let params = [];

        if (normalizedUserIds && normalizedUserIds.length > 0) {
            sql += " AND id IN (?)";
            params.push(normalizedUserIds);
        } else {
            // Broadcast case (e.g. for new_order or promos)
            if (type === 'new_order' || type === 'incoming_call' || type === 'call') {
                sql += " AND role IN ('admin', 'penjual', 'owner', 'kasir', 'seller')";
            }
        }

        if (excludedUserId) {
            sql += " AND id != ?";
            params.push(excludedUserId);
        }

        const [users] = await db.query(sql, params);

        if (!users || users.length === 0) return;

        // 2. Filter users based on their notification_settings
        const filteredUsers = users.filter(user => {
            // Default settings
            let settings = { orders: true, chat: true, promo: true };

            if (user.notification_settings) {
                try {
                    const parsed = typeof user.notification_settings === 'string'
                        ? JSON.parse(user.notification_settings)
                        : user.notification_settings;
                    settings = { ...settings, ...parsed };
                } catch (e) {
                    console.error(`Error parsing settings for user ${user.id}:`, e);
                }
            }

            // check specific type settings
            if (type === 'chat') return settings.chat !== false;
            if (type === 'promo') return settings.promo !== false;
            if (type === 'new_order' || type === 'orders') return settings.orders !== false;

            // default to true for other types like daily_summary or stock_alert
            return true;
        });

        if (filteredUsers.length === 0) return;

        const targetExternalIds = filteredUsers.map(u => u.id.toString());
        const expoTokens = filteredUsers.map(u => u.push_token).filter(t => !!t);

        // 3. Send via OneSignal (Web & Mobile SDKs linked by external_id)
        if (targetExternalIds.length > 0) {
            sendPushNotification(message, heading, data, targetExternalIds)
                .catch(e => console.error('OneSignal Notification Error:', e));
        }

        // 4. Send via Expo Push (Native Mobile specific)
        if (expoTokens.length > 0) {
            sendExpoPushNotification(expoTokens, heading, message, data)
                .catch(e => console.error('Expo Push Notification Error:', e));
        }

    } catch (err) {
        console.error('sendUniversalNotification Error:', err);
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

const processBase64Audio = async (base64String, prefix = 'voice') => {
    if (!base64String) return null;

    const isAudio = base64String.startsWith('data:audio') || base64String.startsWith('data:application/octet-stream');
    if (!isAudio) return base64String;

    try {
        // Gunakan indexOf+slice — lebih aman dari regex untuk payload besar
        const commaIndex = base64String.indexOf(',');
        if (commaIndex === -1) {
            console.error('[Audio] Format base64 tidak valid: tidak ada koma pemisah');
            return null;
        }

        const header = base64String.substring(0, commaIndex); // e.g. "data:audio/mp4;base64"
        const rawBase64 = base64String.substring(commaIndex + 1);

        // Ekstrak MIME type dari header
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'audio/m4a';

        // Tentukan extension dari MIME
        let extension = mimeType.split('/')[1] || 'm4a';
        if (extension === 'octet-stream' || extension === 'mpeg') extension = 'm4a';
        if (extension === 'mp4') extension = 'm4a'; // simpan sebagai .m4a untuk konsistensi

        const data = Buffer.from(rawBase64, 'base64');
        const fileName = `${prefix}_${Date.now()}.${extension}`;
        const filePath = path.join(__dirname, 'public', 'uploads', fileName);

        fs.writeFileSync(filePath, data);
        console.log(`[Audio] File suara disimpan: ${fileName} (${(data.length / 1024).toFixed(1)} KB)`);
        return `/public/uploads/${fileName}`;
    } catch (err) {
        console.error('[Audio] Error memproses audio:', err);
        return null;
    }
};

// API Endpoints

// --- TURN Server Credentials Endpoint ---
app.get('/api/turn-credentials', authenticateToken, (req, res) => {
    const turnSecret = process.env.TURN_SECRET;
    const turnHost = process.env.TURN_HOST;

    if (!turnSecret || !turnHost) {
        console.warn('[WebRTC] TURN Config missing in .env');
        return res.status(503).json({ error: 'TURN server belum dikonfigurasi.' });
    }

    try {
        // Credential berlaku selama 24 jam
        const ttl = 24 * 3600;
        const timestamp = Math.floor(Date.now() / 1000) + ttl;
        const username = `${timestamp}:user_${req.user.userId}`;
        const password = crypto.createHmac('sha1', turnSecret).update(username).digest('base64');

        res.json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: `stun:${turnHost}:3478` },
                {
                    urls: [
                        `turn:${turnHost}:3478?transport=udp`,
                        `turn:${turnHost}:3478?transport=tcp`,
                        `turns:${turnHost}:5349?transport=tcp`
                    ],
                    username: username,
                    credential: password
                }
            ]
        });
    } catch (err) {
        console.error('[WebRTC] Error generating TURN credentials:', err);
        res.status(500).json({ error: 'Gagal generate credentials' });
    }
});

// --- Review Management Endpoints ---

// Get all reviews (for management)
// Get all reviews (for management)
app.get("/api/reviews", authenticateToken, authorizeRoles('admin', 'owner', 'kasir', 'penjual'), async (req, res) => {
    try {
        const sql = `
            SELECT r.*, u.username as customer_name, m.name as menu_name 
            FROM menu_reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN menu_items m ON r.menu_item_id = m.id
            ORDER BY r.created_at DESC
        `;
        const [reviews] = await db.query(sql);
        console.log(`[Review] Found ${reviews.length} reviews.`);
        res.json({ message: "success", data: reviews });
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- Test Email Endpoint ---
app.post("/api/test-email", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) {
        return res.status(400).json({ error: "Missing required fields: to, subject, html" });
    }

    const result = await sendEmail(to, subject, html);
    if (result.success) {
        res.json({ message: "Email sent successfully", info: result.info });
    } else {
        res.status(500).json({ error: "Failed to send email", details: result.error });
    }
});


// Delete a review
app.delete("/api/reviews/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "DELETE FROM menu_reviews WHERE id = ?";
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Review not found" });
        }

        await logActivity(req.user.userId, 'Hapus Review', 'review', id, `Review ID ${id} dihapus`);
        res.json({ message: "Review deleted successfully" });
    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update a review
app.put("/api/reviews/:id", authenticateToken, authorizeRoles('admin', 'owner', 'kasir'), async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const sql = "UPDATE menu_reviews SET rating = ?, comment = ? WHERE id = ?";
        const [result] = await db.query(sql, [rating, comment, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Review not found" });
        }

        await logActivity(req.user.userId, 'Edit Review', 'review', id, `Review ID ${id} diedit`);
        res.json({ message: "Review updated successfully" });
    } catch (err) {
        console.error("Error updating review:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get reviews for a specific menu item (public/customer)
app.get("/api/menu-items/:id/reviews", async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT r.*, u.username 
            FROM menu_reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.menu_item_id = ?
            ORDER BY r.created_at DESC
        `;
        const [reviews] = await db.query(sql, [id]);
        res.json({ message: "success", data: reviews });
    } catch (err) {
        console.error("Error fetching menu reviews:", err);
        res.status(500).json({ error: err.message });
    }
});

// Add a review (for customers)
app.post("/api/reviews", authenticateToken, async (req, res) => {
    try {
        const { menu_item_id, rating, comment, order_id } = req.body;
        const user_id = req.user.userId;

        if (!menu_item_id || !rating) {
            return res.status(400).json({ error: "Menu item and rating are required" });
        }

        // Check if user has already reviewed this item
        const checkSql = "SELECT id FROM menu_reviews WHERE user_id = ? AND menu_item_id = ?";
        const [existing] = await db.query(checkSql, [user_id, menu_item_id]);

        if (existing.length > 0) {
            // Update existing review
            const updateSql = "UPDATE menu_reviews SET rating = ?, comment = ?, created_at = NOW() WHERE id = ?";
            await db.query(updateSql, [rating, comment, existing[0].id]);
            await logActivity(user_id, 'Update Review', 'review', existing[0].id, `Update review untuk menu ${menu_item_id}`);
            return res.json({ message: "Review updated successfully", data: { id: existing[0].id } });
        }

        const sql = "INSERT INTO menu_reviews (user_id, menu_item_id, rating, comment, order_id) VALUES (?, ?, ?, ?, ?)";
        const [result] = await db.query(sql, [user_id, menu_item_id, rating, comment, order_id || null]);

        await logActivity(user_id, 'Tambah Review', 'review', result.insertId, `Review untuk menu ${menu_item_id}`);
        res.status(201).json({ message: "Review added successfully", data: { id: result.insertId } });
    } catch (err) {
        console.error("Error adding review:", err);
        res.status(500).json({ error: err.message });
    }
});

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
            AND t.closing_session_id IS NULL
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
            AND closing_session_id IS NULL
            GROUP BY category
        `;
        const [expensesByCategory] = await db.query(expenseSql, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);

        // 4. Get Top Expenses Details
        const topExpensesSql = `
             SELECT name, amount, category, date
             FROM expenses
             WHERE date BETWEEN ? AND ?
             AND closing_session_id IS NULL
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

// --- Financial Report Endpoint ---
app.get("/api/reports/financial-summary", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        let { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "startDate and endDate are required" });
        }

        // 1. Revenue
        const [revenueRows] = await db.query(`
            SELECT SUM(total) as revenue 
            FROM transactions 
            WHERE timestamp BETWEEN ? AND ? 
            AND (payment_method != 'employee_meal' OR payment_method IS NULL)
            AND closing_session_id IS NULL
        `, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);
        const revenue = parseFloat(revenueRows[0].revenue || 0);

        // 2. Expenses
        const [expenseRows] = await db.query(`
            SELECT SUM(amount) as total 
            FROM expenses 
            WHERE date BETWEEN ? AND ?
            AND closing_session_id IS NULL
        `, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);
        const expenses = parseFloat(expenseRows[0].total || 0);

        // 3. COGS (Estimation via Raw Material Expenses for now)
        const [cogsRows] = await db.query(`
            SELECT SUM(amount) as total 
            FROM expenses 
            WHERE date BETWEEN ? AND ? 
            AND (category = 'Bahan Baku' OR category = 'Belanja Pasar' OR category = 'Stok')
            AND closing_session_id IS NULL
        `, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);
        const cogs = parseFloat(cogsRows[0].total || 0);

        // 4. Assets
        // Menu Assets
        const [menuAssetsRows] = await db.query(`
            SELECT SUM(CAST(stock AS DECIMAL(10,2)) * price) as value FROM menu_items
        `);
        const menuAssets = parseFloat(menuAssetsRows[0].value || 0);

        // Raw Material Assets
        // Logic: (current_stock * raw_stock_price) + (menu_stock * price_per_item)
        const [rawAssetsRows] = await db.query(`
            SELECT SUM((current_stock * raw_stock_price) + (menu_stock * price_per_item)) as value 
            FROM raw_materials
        `);
        const rawMaterialAssets = parseFloat(rawAssetsRows[0].value || 0);

        const totalAssets = menuAssets + rawMaterialAssets;

        res.json({
            message: "success",
            data: {
                revenue,
                cogs, // This is just a proxy for now
                grossProfit: revenue - cogs,
                expenses,
                netProfit: revenue - expenses,
                assets: {
                    menu: menuAssets,
                    rawMaterial: rawMaterialAssets,
                    total: totalAssets
                }
            }
        });

    } catch (err) {
        console.error("Error in financial summary:", err);
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
app.get("/api/menu-items", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'pelanggan', 'penjual', 'owner'), async (req, res) => {
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

        // Filter hidden items for non-admin roles (unless specific query param is present, but safety first)
        // If user is NOT admin, owner, or penjual, OR if they are 'pelanggan'/'guest'
        // Actually, let's look at the allowed roles for this endpoint: 'user', 'admin', 'guest', 'kasir', 'pelanggan', 'penjual', 'owner'
        // 'user' is the default role for employees/staff?
        // Let's filter out hidden items for 'pelanggan' and 'guest'.
        if (['pelanggan', 'guest'].includes(req.user.role)) {
            if (whereClause) {
                whereClause += ' AND mi.is_hidden = FALSE';
            } else {
                whereClause = 'WHERE mi.is_hidden = FALSE';
            }
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
            options: JSON.parse(row.options), // No need for ternary, COALESCE guarantees a string
            hpp_details: row.hpp_details ? (typeof row.hpp_details === 'string' ? JSON.parse(row.hpp_details) : row.hpp_details) : []
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
            WHERE mi.is_hidden = FALSE
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
app.post("/api/menu-items", authenticateToken, authorizeRoles('user', 'admin', 'penjual', 'owner', 'kasir'), upload.single('image'), async (req, res, next) => {
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

        const { id, name, price, stock, category, hpp, discount, is_featured, options, description, is_hidden } = itemData;
        const image_url = req.file ? `/public/uploads/${req.file.filename}` : null;
        const final_is_featured = (is_featured == 1 || is_featured == 'true') ? 1 : 0;
        const final_is_hidden = (is_hidden == 1 || is_hidden == 'true') ? 1 : 0;

        const menuItemSql = 'INSERT INTO menu_items (id, name, price, stock, category, image_url, hpp, discount, is_featured, description, is_hidden) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
        const menuItemParams = [id, name, price, stock, category, image_url, hpp, discount, final_is_featured, description || null, final_is_hidden];
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
app.put('/api/menu-items/reorder', authenticateToken, authorizeRoles('admin', 'penjual', 'owner', 'kasir'), async (req, res) => {
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

// Reset all menu stock to 0
app.put('/api/menu-items/reset-stock', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const sql = 'UPDATE menu_items SET stock = 0';
        const [result] = await db.query(sql);
        
        await logActivity(req.user.userId, 'Kosongkan Stok', 'menu_items', null, `Admin mengosongkan stok ${result.affectedRows} menu`);

        res.json({ message: 'success', data: { affectedRows: result.affectedRows } });
    } catch (err) {
        console.error("Error resetting stock:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update a menu item
app.put("/api/menu-items/:id", authenticateToken, authorizeRoles('user', 'admin', 'penjual', 'owner', 'kasir'), upload.single('image'), async (req, res, next) => {
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
        const allowedFields = ['name', 'price', 'stock', 'category', 'hpp', 'hpp_details', 'discount', 'is_featured', 'description', 'is_hidden'];

        allowedFields.forEach(field => {
            if (itemData[field] !== undefined) {
                // Special handling for boolean
                if (field === 'is_featured' || field === 'is_hidden') {
                    updateFields[field] = (itemData[field] == 1 || itemData[field] == 'true') ? 1 : 0;
                } else if (field === 'hpp_details') {
                    updateFields[field] = typeof itemData[field] === 'string' ? itemData[field] : JSON.stringify(itemData[field]);
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
app.delete("/api/menu-items/:id", authenticateToken, authorizeRoles('user', 'admin', 'penjual', 'owner', 'kasir'), async (req, res, next) => {
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
            return res.status(400).json({ error: "ID menu dan rating wajib diisi" });
        }

        // Check for existing review to prevent spam
        const [existing] = await db.query(
            "SELECT id FROM menu_reviews WHERE user_id = ? AND menu_item_id = ?",
            [user_id, menu_item_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                error: "Anda sudah memberikan ulasan untuk menu ini. Silakan gunakan fitur edit jika ingin melakukan perubahan.",
                existing_id: existing[0].id
            });
        }

        // Anti-Spam & Validation: Check if order exists, belongs to user, is completed, AND contains the menu item
        if (order_id) {
            const [orderRows] = await db.query('SELECT items, status, user_id FROM orders WHERE id = ?', [order_id]);
            if (orderRows.length === 0) {
                return res.status(404).json({ error: "Pesanan tidak ditemukan" });
            }
            const order = orderRows[0];
            if (order.user_id !== user_id) {
                return res.status(403).json({ error: "Anda tidak memiliki akses ke pesanan ini" });
            }
            if (order.status !== 'completed') {
                return res.status(400).json({ error: "Anda hanya bisa memberi ulasan pada pesanan yang sudah selesai" });
            }

            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            const hasItem = items.some(item => item.id.toString() === menu_item_id.toString());
            if (!hasItem) {
                return res.status(400).json({ error: "Menu ini tidak ada dalam pesanan Anda" });
            }
        } else {
            // Find if they've ever ordered it
            const [everOrderedRows] = await db.query(`
                SELECT id FROM orders 
                WHERE user_id = ? AND status = 'completed' AND items LIKE ?
            `, [user_id, `%${menu_item_id}%`]);

            if (everOrderedRows.length === 0) {
                return res.status(403).json({ error: "Anda hanya bisa mengulas menu yang pernah Anda pesan" });
            }
        }

        const sql = `
            INSERT INTO menu_reviews (menu_item_id, user_id, order_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [menu_item_id, user_id, order_id || null, rating, comment || null]);

        await logActivity(user_id, 'Beri Ulasan', 'menu_item', menu_item_id, `Rating ${rating} untuk menu ${menu_item_id}`);

        res.status(201).json({ message: "success", data: { id: result.insertId, menu_item_id, rating, comment } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Anda sudah memberikan ulasan untuk menu ini." });
        }
        console.error("Error submitting review:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update an existing review (for customers)
app.put("/api/menu-reviews/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const user_id = req.user.userId;

        // Ensure user owns this review
        const [review] = await db.query("SELECT id, user_id FROM menu_reviews WHERE id = ?", [id]);
        if (review.length === 0) {
            return res.status(404).json({ error: "Ulasan tidak ditemukan" });
        }

        if (review[0].user_id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Anda tidak memiliki izin untuk mengedit ulasan ini" });
        }

        const sql = "UPDATE menu_reviews SET rating = ?, comment = ?, created_at = NOW() WHERE id = ?";
        await db.query(sql, [rating, comment || null, id]);

        await logActivity(user_id, 'Update Ulasan', 'review', id, `Update rating ke ${rating}`);

        res.json({ message: "success", data: { id, rating, comment } });
    } catch (err) {
        console.error("Error updating review:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get reviews for a specific order
app.get("/api/menu-reviews/order/:order_id", authenticateToken, async (req, res) => {
    try {
        const { order_id } = req.params;
        const user_id = req.user.userId;

        const sql = "SELECT * FROM menu_reviews WHERE order_id = ? AND user_id = ?";
        const [reviews] = await db.query(sql, [order_id, user_id]);

        res.json({ message: "success", data: reviews });
    } catch (err) {
        console.error("Error fetching order reviews:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get my reviews for specific items
app.get("/api/my-reviews", authenticateToken, async (req, res) => {
    try {
        const { menu_item_ids } = req.query; // Expecting comma separated IDs
        const user_id = req.user.userId;

        if (!menu_item_ids) {
            return res.json({ message: "success", data: [] });
        }

        const idArray = menu_item_ids.split(',');
        const [rows] = await db.query(
            "SELECT * FROM menu_reviews WHERE user_id = ? AND menu_item_id IN (?)",
            [user_id, idArray]
        );
        res.json({ message: "success", data: rows });
    } catch (err) {
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
app.get("/api/categories", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'pelanggan', 'penjual', 'owner'), async (req, res) => {
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
app.post("/api/categories", authenticateToken, authorizeRoles('user', 'admin', 'penjual'), upload.single('icon'), async (req, res) => {
    try {
        const { name, is_visible } = req.body;
        const icon = req.file ? `/public/uploads/${req.file.filename}` : null;
        // Parse is_visible only if provided (defaults to true in DB, but good to be explicit if passed)
        const isVisibleVal = (is_visible === 'false' || is_visible === false) ? 0 : 1;

        if (!name) {
            return res.status(400).json({ "error": "Category name is required" });
        }
        const sql = 'INSERT INTO categories (name, icon, is_visible) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [name, icon, isVisibleVal]);

        await logActivity(req.user.userId, 'Tambah Kategori', 'category', result.insertId, `Kategori baru: ${name}`);

        res.status(201).json({
            "message": "success",
            "data": { id: result.insertId, name, icon, is_visible: isVisibleVal === 1 },
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Category name already exists" });
        }
        res.status(400).json({ "error": err.message });
    }
});

// Update a category
app.put("/api/categories/:id", authenticateToken, authorizeRoles('user', 'admin', 'penjual'), upload.single('icon'), async (req, res) => {
    try {
        const { name, is_visible } = req.body;
        const { id } = req.params;
        const newIcon = req.file ? `/public/uploads/${req.file.filename}` : null;

        // Parse is_visible if provided. If undefined, we might want to keep it as is, but usually PUT updates all or selective.
        // Let's assume if it's not provided, we don't update it? No, usually with FormData it might be missing if unchecked depending on frontend.
        // But for toggle, it should be sent. Let's check if it exists in body.
        let isVisibleVal;
        if (is_visible !== undefined) {
            isVisibleVal = (is_visible === 'true' || is_visible === true || is_visible === '1' || is_visible === 1) ? 1 : 0;
        }

        if (!name) {
            return res.status(400).json({ "error": "Category name is required" });
        }

        let sql, params;
        // Construct query dynamically based on what's provided/changed
        // But simpler: if newIcon, update icon. Always update name. If isVisibleVal defined, update it.

        let updates = ['name = ?'];
        let values = [name];

        if (newIcon) {
            updates.push('icon = ?');
            values.push(newIcon);
        }

        if (isVisibleVal !== undefined) {
            updates.push('is_visible = ?');
            values.push(isVisibleVal);
        }

        sql = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);

        const [result] = await db.query(sql, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ "error": "Category not found" });
        }
        res.json({
            "message": "success",
            "data": { id, name, icon: newIcon, is_visible: isVisibleVal === 1 },
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
app.get("/api/banners", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'pelanggan', 'penjual', 'owner'), async (req, res) => {
    try {
        const sql = "SELECT * FROM banners WHERE is_active = TRUE ORDER BY created_at DESC";
        const [rows] = await db.query(sql);
        res.json({ "message": "success", "data": rows });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get all banners (for management)
app.get("/api/banners/all", authenticateToken, authorizeRoles('admin', 'penjual', 'owner'), async (req, res) => {
    try {
        const sql = "SELECT * FROM banners ORDER BY created_at DESC";
        const [rows] = await db.query(sql);
        res.json({ "message": "success", "data": rows });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Add a new banner
app.post("/api/banners", authenticateToken, authorizeRoles('admin', 'penjual', 'owner'), upload.single('image'), async (req, res) => {
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

        const { title, subtitle, color_class, icon_name, link_url, is_active, show_text } = bannerData;
        
        // Handle boolean parsing from potentially string values (from FormData)
        const parseBool = (val) => val === true || val === 'true' || val === 1 || val === '1';

        // Validasi field wajib
        if (!title) {
            return res.status(400).json({ "error": "Judul banner (title) wajib diisi" });
        }

        const image_url = req.file ? `/public/uploads/${req.file.filename}` : null;
        const final_is_active = is_active !== undefined ? (parseBool(is_active) ? 1 : 0) : 1;
        const final_show_text = show_text !== undefined ? (parseBool(show_text) ? 1 : 0) : 1;

        const sql = 'INSERT INTO banners (title, subtitle, image_url, color_class, icon_name, link_url, is_active, show_text) VALUES (?,?,?,?,?,?,?,?)';
        const [result] = await db.query(sql, [title, subtitle || '', image_url, color_class, icon_name, link_url || '', final_is_active, final_show_text]);

        await logActivity(req.user.userId, 'Tambah Banner', 'banner', result.insertId, `Banner baru: ${title}`);

        res.status(201).json({
            "message": "success",
            "data": { id: result.insertId, ...bannerData, image_url, is_active: final_is_active, show_text: final_show_text }
        });
    } catch (err) {
        console.error("Error adding banner:", err);
        res.status(400).json({ "error": err.message });
    }
});

// --- Information / Announcements Endpoints ---

// Get all information (Public) with pagination
app.get("/api/information", authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const isSeller = ['admin', 'owner', 'penjual', 'kasir'].includes(req.user.role);
        const whereClause = isSeller ? "" : "WHERE is_active = 1";

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM information ${whereClause}`;
        const [countRows] = await db.query(countSql);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Get paginated data
        const sql = `SELECT * FROM information ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        const [rows] = await db.query(sql, [limit, offset]);

        res.json({
            message: "success",
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: limit
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new information (Seller only)
app.post("/api/information", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir'), async (req, res) => {
    try {
        const { title, content, image_url, link_type, link_value, is_active } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: "Judul dan isi informasi wajib diisi" });
        }

        // Process image if it's base64
        let finalImageUrl = image_url;
        if (image_url && image_url.startsWith('data:image')) {
            finalImageUrl = await processBase64Image(image_url, 'info');
        }

        const activeVal = (is_active === 'false' || is_active === false || is_active === '0' || is_active === 0) ? 0 : 1;
        const sql = 'INSERT INTO information (title, content, image_url, link_type, link_value, is_active) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [title, content, finalImageUrl, link_type || 'none', link_value || null, activeVal]);

        await logActivity(req.user.userId, 'Tambah Informasi', 'information', result.insertId, `Info baru: ${title}`);

        res.status(201).json({
            message: "success",
            data: { id: result.insertId, title, content, image_url: finalImageUrl, link_type, link_value, is_active: activeVal === 1 }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update existing information
app.put("/api/information/:id", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, image_url, link_type, link_value, is_active } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: "Judul dan isi informasi wajib diisi" });
        }

        // Process image if it's base64 (new upload)
        let finalImageUrl = image_url;
        if (image_url && image_url.startsWith('data:image')) {
            finalImageUrl = await processBase64Image(image_url, 'info');
        }

        // Check if is_active is provided, otherwise keep it as is (need to fetch first? No, default to what user sent or if undefined dont update it?
        // Better: if undefined, let's required frontend to send it. Or default 1.
        const activeVal = (is_active === 'false' || is_active === false || is_active === '0' || is_active === 0) ? 0 : 1;

        const sql = 'UPDATE information SET title = ?, content = ?, image_url = ?, link_type = ?, link_value = ?, is_active = ? WHERE id = ?';
        const [result] = await db.query(sql, [title, content, finalImageUrl, link_type || 'none', link_value || null, activeVal, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Informasi tidak ditemukan" });
        }

        await logActivity(req.user.userId, 'Update Informasi', 'information', id, `Info ID ${id} diperbarui: ${title}`);

        res.json({
            message: "success",
            data: { id, title, content, image_url: finalImageUrl, link_type, link_value, is_active: activeVal === 1 }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete information
app.delete("/api/information/:id", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir'), async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM information WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Informasi tidak ditemukan" });
        }

        await logActivity(req.user.userId, 'Hapus Informasi', 'information', id, `Info ID ${id} dihapus`);
        res.json({ message: "success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Broadcast existing information
app.post("/api/information/:id/broadcast", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir'), async (req, res) => {
    try {
        const { id } = req.params;

        // Update created_at so it moves to the top of the feed
        const updateSql = "UPDATE information SET created_at = NOW() WHERE id = ?";
        const [updateResult] = await db.query(updateSql, [id]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "Informasi tidak ditemukan" });
        }

        const infoSql = "SELECT * FROM information WHERE id = ?";
        const [infos] = await db.query(infoSql, [id]);
        const info = infos[0];

        // Get all customers (pelanggan) to send notification
        const customerSql = "SELECT id, email, username FROM users WHERE role = 'pelanggan'";
        const [customers] = await db.query(customerSql);
        const customerIds = customers.map(c => c.id);

        // Send push notification only to customers (pelanggan), exclude the sender
        if (customerIds.length > 0) {
            sendUniversalNotification(
                customerIds, // Only send to customers
                info.content.length > 50 ? info.content.substring(0, 50) + '...' : info.content,
                `📢 ${info.title}`,
                {
                    type: 'info',
                    infoId: id,
                    link_type: info.link_type || 'none',
                    link_value: info.link_value || null
                },
                req.user.userId // Exclude the seller who is broadcasting
            ).catch(e => console.error('Error broadcasting info notification:', e));

            // Kirim Email Broadcast (async)
            sendNewsBroadcastEmail(info, customers)
                .catch(e => console.error('Error broadcasting info email:', e));
        }

        await logActivity(req.user.userId, 'Broadcast Informasi', 'information', id, `Resend & Refresh info: ${info.title}`);

        res.json({ message: "success", info: info.title });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a banner
app.put("/api/banners/:id", authenticateToken, authorizeRoles('admin', 'owner', 'penjual'), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        let bannerData;

        // Use same logic as POST for data parsing
        if (req.body.data) {
            try {
                bannerData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
            } catch (err) {
                bannerData = req.body;
            }
        } else {
            bannerData = req.body;
        }

        const { title, subtitle, color_class, icon_name, link_url, is_active, show_text, remove_image } = bannerData;
        const parseBool = (val) => val === true || val === 'true' || val === 1 || val === '1';

        // Fetch current banner to handle image cleanup
        let params = [title, subtitle || '', color_class, icon_name, link_url || '', final_is_active, final_show_text];

        if (req.file) {
            const image_url = `/public/uploads/${req.file.filename}`;
            sql += ', image_url = ?';
            params.push(image_url);

            // Delete old image if it exists
            if (currentBanner.length > 0 && currentBanner[0].image_url) {
                const oldPath = path.join(__dirname, currentBanner[0].image_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        } else if (remove_image === true || remove_image === 'true') {
            sql += ', image_url = NULL';
            // Delete old image if it exists
            if (currentBanner.length > 0 && currentBanner[0].image_url) {
                const oldPath = path.join(__dirname, currentBanner[0].image_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        }

        sql += ' WHERE id = ?';
        params.push(id);

        await db.query(sql, params);
        await logActivity(req.user.userId, 'Update Banner', 'banner', id, `Banner ID ${id} diperbarui`);
        res.json({
            "message": "success",
            "data": { id, ...bannerData, is_active: final_is_active, show_text: final_show_text }
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

        // Fetch image_url for cleanup
        const [rows] = await db.query('SELECT image_url FROM banners WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].image_url) {
            const imagePath = path.join(__dirname, rows[0].image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const sql = 'DELETE FROM banners WHERE id = ?';
        await db.query(sql, [id]);
        await logActivity(req.user.userId, 'Hapus Banner', 'banner', id, `Banner ID ${id} dihapus`);
        res.json({ "message": "success" });
    } catch (err) {
        console.error("Error deleting banner:", err);
        res.status(400).json({ "error": err.message });
    }
});

// --- Seller Banners Endpoints (Internal Notifications) ---

// Get all active seller banners for mobile
app.get("/api/seller-banners", authenticateToken, authorizeRoles('user', 'admin', 'kasir', 'owner', 'penjual'), async (req, res) => {
    try {
        const sql = "SELECT * FROM seller_banners WHERE is_active = TRUE ORDER BY created_at DESC";
        const [rows] = await db.query(sql);
        res.json({ "message": "success", "data": rows });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get all seller banners (for management)
app.get("/api/seller-banners/all", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const sql = "SELECT * FROM seller_banners ORDER BY created_at DESC";
        const [rows] = await db.query(sql);
        res.json({ "message": "success", "data": rows });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Add a new seller banner
app.post("/api/seller-banners", authenticateToken, authorizeRoles('admin', 'owner'), upload.single('image'), async (req, res) => {
    try {
        const { title, subtitle, link_url, is_active } = req.body;
        
        if (!title) {
            return res.status(400).json({ "error": "Judul (title) wajib diisi" });
        }

        const image_url = req.file ? `/public/uploads/${req.file.filename}` : null;
        const final_is_active = is_active !== undefined ? (is_active === 'true' || is_active === true || is_active === 1 ? 1 : 0) : 1;

        const sql = 'INSERT INTO seller_banners (title, subtitle, image_url, link_url, is_active) VALUES (?,?,?,?,?)';
        const [result] = await db.query(sql, [title, subtitle || '', image_url, link_url || '', final_is_active]);
        
        await logActivity(req.user.userId, 'Tambah Banner Seller', 'seller_banner', result.insertId, `Banner Seller "${title}" ditambahkan`);
        res.json({ "message": "success", "id": result.insertId });
    } catch (err) {
        console.error("Error adding seller banner:", err);
        res.status(400).json({ "error": err.message });
    }
});

// Update a seller banner
app.put("/api/seller-banners/:id", authenticateToken, authorizeRoles('admin', 'owner'), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, link_url, is_active } = req.body;

        const [current] = await db.query('SELECT image_url FROM seller_banners WHERE id = ?', [id]);
        if (current.length === 0) return res.status(404).json({ error: "Banner tidak ditemukan" });

        const image_url = req.file ? `/public/uploads/${req.file.filename}` : current[0].image_url;
        const final_is_active = is_active !== undefined ? (is_active === 'true' || is_active === true || is_active === 1 ? 1 : 0) : 1;

        const sql = 'UPDATE seller_banners SET title = ?, subtitle = ?, image_url = ?, link_url = ?, is_active = ? WHERE id = ?';
        await db.query(sql, [title, subtitle || '', image_url, link_url || '', final_is_active, id]);
        
        await logActivity(req.user.userId, 'Update Banner Seller', 'seller_banner', id, `Banner Seller ID ${id} diperbarui`);
        res.json({ "message": "success" });
    } catch (err) {
        console.error("Error updating seller banner:", err);
        res.status(400).json({ "error": err.message });
    }
});

// Delete a seller banner
app.delete("/api/seller-banners/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;

        // Cleanup image
        const [rows] = await db.query('SELECT image_url FROM seller_banners WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].image_url) {
            const imagePath = path.join(__dirname, rows[0].image_url);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        await db.query('DELETE FROM seller_banners WHERE id = ?', [id]);
        await logActivity(req.user.userId, 'Hapus Banner Seller', 'seller_banner', id, `Banner Seller ID ${id} dihapus`);
        res.json({ "message": "success" });
    } catch (err) {
        console.error("Error deleting seller banner:", err);
        res.status(400).json({ "error": err.message });
    }
});

// --- Expense Categories Endpoints ---

// Get all expense categories
app.get("/api/expense-categories", authenticateToken, authorizeRoles('user', 'admin', 'kasir', 'owner', 'penjual', 'guest'), async (req, res) => {
    try {
        // Get categories from fixed table
        const [categoryRows] = await db.query("SELECT id, name FROM expense_categories ORDER BY name ASC");
        
        // Get categories from expenses table to find ones not in the official list
        const [expenseRows] = await db.query('SELECT DISTINCT category FROM expenses WHERE category IS NOT NULL AND category != ""');
        const categoriesFromExpenses = expenseRows.map(r => r.category);

        // Map to keep track of names we've already included
        const categoriesMap = new Map();
        
        // 1. Add official ones first
        categoryRows.forEach(cat => {
            categoriesMap.set(cat.name, { id: cat.id, name: cat.name });
        });

        // 2. Add unofficial ones found in expenses
        categoriesFromExpenses.forEach(name => {
            if (!categoriesMap.has(name)) {
                // Use a string ID to avoid 'undefined' and distinguish from official ones
                categoriesMap.set(name, { id: `legacy-${name}`, name });
            }
        });

        const finalData = Array.from(categoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

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
app.put("/api/settings/master-password", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
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

// Reset Master Password (without knowing current password) - Admin/Owner Only
app.put("/api/admin/master-password/reset", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { newMasterPassword } = req.body;

        if (!newMasterPassword) {
            return res.status(400).json({ error: "Kata sandi master baru diperlukan" });
        }

        const hashedNewMasterPassword = await bcrypt.hash(newMasterPassword, 10);

        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        await db.query(sql, ['master_password', hashedNewMasterPassword]);

        res.json({ message: "Master password has been reset successfully" });
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
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            return res.status(400).json({ "error": "Value is required" });
        }
        let finalValue = value.toString();

        // Process image if it's popup_promo_image and is base64
        if (key === 'popup_promo_image' && value && value.toString().startsWith('data:image')) {
            const processedPath = await processBase64Image(value.toString(), 'marketing_popup');
            if (processedPath) {
                finalValue = processedPath;
            }
        }

        const sql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
        const [result] = await db.query(sql, [key, finalValue]);

        // If initial_capital is updated, also update initial_capital_date
        if (key === 'initial_capital') {
            const now = new Date().toISOString();
            const dateSql = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';
            await db.query(dateSql, ['initial_capital_date', now]);
        }

        res.json({ message: "Setting updated successfully", data: { key, value: finalValue } });

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
        const sql = "SELECT restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock, store_address, open_time, close_time FROM app_settings ORDER BY id LIMIT 1";
        const [rows] = await db.query(sql);
        if (rows.length > 0) {
            res.json({
                "message": "success",
                "data": {
                    ...rows[0],
                    store_address: rows[0].store_address || 'Indramayu, Jawa Barat',
                    open_time: rows[0].open_time || '08:00',
                    close_time: rows[0].close_time || '22:00'
                }
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
                    ignore_stock: 0,
                    store_address: 'Indramayu, Jawa Barat',
                    open_time: '08:00',
                    close_time: '22:00'
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
        const { restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock, store_address, open_time, close_time } = req.body;
        if (!restaurant_name || !restaurant_slogan) {
            return res.status(400).json({ "error": "Restaurant name and slogan are required." });
        }

        const sql = `UPDATE app_settings SET restaurant_name = ?, restaurant_slogan = ?, restaurant_url = ?, owner_phone = ?, show_stock_alert = ?, is_open = ?, ignore_stock = ?, store_address = ?, open_time = ?, close_time = ? WHERE id = (SELECT id FROM (SELECT id FROM app_settings ORDER BY id LIMIT 1) as t)`;
        const params = [
            restaurant_name,
            restaurant_slogan,
            restaurant_url || 'www.berkah88.id',
            owner_phone || null,
            show_stock_alert !== undefined ? show_stock_alert : 1,
            is_open !== undefined ? is_open : 1,
            ignore_stock !== undefined ? ignore_stock : 0,
            store_address || null,
            open_time || '08:00',
            close_time || '22:00'
        ];
        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            // If no rows were affected, it might mean no settings exist yet. Insert them.
            const insertSql = 'INSERT INTO app_settings (restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock, store_address, open_time, close_time, og_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            await db.query(insertSql, [...params, 'Kasir Berkah 88']);
            res.json({ message: "Restaurant settings inserted successfully!", data: { restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock, store_address, open_time, close_time } });
        } else {
            res.json({ message: "Restaurant settings updated successfully!", data: { restaurant_name, restaurant_slogan, restaurant_url, owner_phone, show_stock_alert, is_open, ignore_stock, store_address, open_time, close_time } });
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

// Update app settings (admin/owner only)
app.post('/api/app-settings', authenticateToken, authorizeRoles('admin', 'owner'), upload.single('og_image'), async (req, res) => {
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

        let whereClauses = ['t.deleted_at IS NULL', 't.closing_session_id IS NULL'];
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

        const filterClosed = req.query.filterClosed === 'true';
        let whereClauses = ['t.deleted_at IS NULL'];
        if (filterClosed) {
            whereClauses.push('t.closing_session_id IS NULL');
        }
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
                t.closing_session_id,
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
app.get("/api/transactions/:id", authenticateToken, authorizeRoles('user', 'admin', 'guest', 'kasir', 'owner'), async (req, res, next) => {
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
        const sql = "SELECT id, username as name, phone, email, points, address FROM users WHERE role = 'pelanggan' AND (username LIKE ? OR phone LIKE ?) LIMIT 10";
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
                u.email, 
                u.address, 
                u.points, 
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.total), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
            ${whereClause}
            GROUP BY u.id, u.username, u.phone, u.email, u.address, u.points
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
        const itemsWithDetails = [];
        for (const item of items) {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            calculatedSubtotal += price * quantity;
            
            // Ambil HPP dan hpp_details saat ini dari database (snapshot)
            const [menuItemRows] = await connection.query('SELECT hpp, hpp_details FROM menu_items WHERE id = ?', [item.id]);
            const hpp = menuItemRows.length > 0 ? parseFloat(menuItemRows[0].hpp || 0) : 0;
            let hpp_details = [];
            if (menuItemRows.length > 0 && menuItemRows[0].hpp_details) {
                hpp_details = typeof menuItemRows[0].hpp_details === 'string'
                    ? JSON.parse(menuItemRows[0].hpp_details)
                    : menuItemRows[0].hpp_details;
            }
            
            itemsWithDetails.push({ ...item, price: price, quantity: quantity, hpp: hpp, hpp_details: hpp_details });
        }

        // Ensure manual_discount is treated as a number
        const manualDiscountVal = parseFloat(manual_discount || 0);
        const subtotalAfterManualDiscount = Math.max(0, calculatedSubtotal - manualDiscountVal);

        const [ppnSetting] = await connection.query("SELECT value FROM settings WHERE `key` = ?", ['ppn']);
        const ppnRate = ppnSetting.length > 0 ? parseFloat(ppnSetting[0].value) : 0.12;

        // PPN is calculated after manual discount
        const calculatedPpn = subtotalAfterManualDiscount * ppnRate;
        // Calculate Point & Promo Discounts
        const finalPointsUsed = parseFloat(pointsUsed || 0);
        const promoDiscountVal = parseFloat(req.body.promo_discount || 0);

        // Adjust calculatedTotal to include all discounts
        const calculatedTotal = (subtotalAfterManualDiscount + calculatedPpn) - finalPointsUsed - promoDiscountVal;

        // Determine finalTotal: Trust frontendTotal if provided (e.g. from Website/SimpleTransaction), 
        // otherwise use our carefully calculatedTotal (e.g. from App/standard flow)
        const finalTotal = (frontendTotal !== undefined && frontendTotal !== null && !isNaN(parseFloat(frontendTotal)))
            ? parseFloat(frontendTotal)
            : Math.max(0, calculatedTotal);

        const finalPpnAmount = isNaN(calculatedPpn) ? 0 : calculatedPpn;

        const timestamp = new Date();
        const serializedItems = JSON.stringify(itemsWithDetails);
        const finalIsEmployeeMeal = isEmployeeMeal ? 1 : 0;
        const finalIgnoreStock = effectivelyIgnoreStock ? 1 : 0;
        const finalPaymentMethod = payment_method || 'tunai';
        const finalUserId = req.user ? req.user.userId : null;

        // --- Points Logic ---
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

            // Points deduction already handled in total calculation above,
            // now we just update the user's balance.
            if (finalPointsUsed > 0) {
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

        // --- NEW: Sync Transaction to Account Balance ---
        try {
            if (!isEmployeeMeal) {
                // Determine which account to update
                // tunai/cash -> lapak_deposit
                // transfer/gojek/shopee/etc -> owner_deposit
                const accountName = (finalPaymentMethod.toLowerCase() === 'tunai' || finalPaymentMethod.toLowerCase() === 'cash')
                    ? 'lapak_deposit'
                    : 'owner_deposit';

                const [accRows] = await connection.query("SELECT id, balance FROM accounts WHERE name = ?", [accountName]);

                if (accRows.length > 0) {
                    const accountId = accRows[0].id;
                    const amountToSync = parseFloat(finalTotal);

                    // 1. Update Account Balance
                    await connection.query(
                        "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        [amountToSync, accountId]
                    );

                    // 2. Record in account_transactions
                    await connection.query(
                        'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                        [accountId, 'deposit', amountToSync, `Penjualan ${newTransactionId}`, finalUserId, timestamp]
                    );

                    console.log(`[SYNC] Transaction ${newTransactionId} synced to ${accountName} (+${amountToSync})`);
                }
            }
        } catch (syncError) {
            console.error(`[SYNC] Failed to sync transaction to account:`, syncError);
            // We don't rollback here because the transaction itself is more important, 
            // but in a strict system we might want to.
        }
        // --- End Sync ---

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
            const socketTimestamp = new Date().toISOString();
            io.emit('new_order', {
                id: newTransactionId,
                customer_name: customer_name || 'Pelanggan POS',
                total: finalTotal,
                created_at: socketTimestamp,
                timestamp: socketTimestamp,
                items: itemsWithDetails,
                status: 'completed', // Transactions are instantly completed
                payment_method: finalPaymentMethod,
                is_transaction: true, // Marker so frontend knows it's a direct transaction
                user_id: finalUserId
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
    let connection;
    try {
        const { total, ppn, isEmployeeMeal, payment_method, timestamp, manual_discount, catatan, items, customer_name, customer_phone, customer_address } = req.body;
        const { id } = req.params;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Get OLD transaction data to calculate balance difference
        const [oldTransRows] = await connection.query("SELECT total, payment_method, isEmployeeMeal FROM transactions WHERE id = ?", [id]);
        if (oldTransRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ "error": "Transaction not found" });
        }
        const oldTrans = oldTransRows[0];

        // --- Proses Items untuk Memastikan HPP Tidak Hilang ---
        let processedItems = items ? (typeof items === 'string' ? items : JSON.stringify(items)) : null;
        if (items) {
            let parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
            const itemsWithDetails = [];
            for (const item of parsedItems) {
                let hpp = parseFloat(item.hpp);
                let hpp_details = item.hpp_details;

                if (isNaN(hpp) || hpp === 0 || !hpp_details) {
                    const [menuItemRows] = await connection.query('SELECT hpp, hpp_details FROM menu_items WHERE id = ?', [item.id]);
                    if (menuItemRows.length > 0) {
                        hpp = parseFloat(menuItemRows[0].hpp || 0);
                        hpp_details = typeof menuItemRows[0].hpp_details === 'string'
                            ? JSON.parse(menuItemRows[0].hpp_details)
                            : menuItemRows[0].hpp_details;
                    } else {
                        hpp = 0;
                        hpp_details = [];
                    }
                }
                
                itemsWithDetails.push({ ...item, hpp: hpp, hpp_details: hpp_details });
            }
            processedItems = JSON.stringify(itemsWithDetails);
        }
        // --- Akhir Proses Items ---

        // 2. Perform the update
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
            processedItems,
            req.body.cash_paid !== undefined ? parseFloat(req.body.cash_paid) : null,
            req.body.change !== undefined ? parseFloat(req.body.change) : null,
            customer_name !== undefined ? customer_name : null,
            customer_phone !== undefined ? customer_phone : null,
            customer_address !== undefined ? customer_address : null,
            req.body.customerId !== undefined ? req.body.customerId : (req.body.customer_id !== undefined ? req.body.customer_id : null),
            id
        ];

        const [result] = await connection.query(sql, params);

        // 3. SYNC BALANCE IF TOTAL OR PAYMENT METHOD CHANGED
        // We only sync if it's NOT an employee meal
        if (!oldTrans.isEmployeeMeal && (isEmployeeMeal === undefined || !isEmployeeMeal)) {
            // Ensure we calculate the most accurate new total 
            // If total is provided, trust it. Otherwise, use existing total.
            const newTotal = total !== undefined ? parseFloat(total) : parseFloat(oldTrans.total);
            const oldTotal = parseFloat(oldTrans.total);
            const newPaymentMethod = payment_method || oldTrans.payment_method;
            const oldPaymentMethod = oldTrans.payment_method;

            const isOldTunai = (oldPaymentMethod.toLowerCase() === 'tunai' || oldPaymentMethod.toLowerCase() === 'cash');
            const isNewTunai = (newPaymentMethod.toLowerCase() === 'tunai' || newPaymentMethod.toLowerCase() === 'cash');

            const oldAccountName = isOldTunai ? 'lapak_deposit' : 'owner_deposit';
            const newAccountName = isNewTunai ? 'lapak_deposit' : 'owner_deposit';

            if (oldAccountName === newAccountName) {
                // Same account, just update the difference
                const diff = newTotal - oldTotal;
                if (diff !== 0) {
                    const [accRows] = await connection.query("SELECT id FROM accounts WHERE name = ?", [newAccountName]);
                    if (accRows.length > 0) {
                        const accountId = accRows[0].id;
                        await connection.query("UPDATE accounts SET balance = balance + ? WHERE id = ?", [diff, accountId]);
                        await connection.query(
                            'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id) VALUES (?, ?, ?, ?, ?)',
                            [accountId, diff > 0 ? 'deposit' : 'expense', Math.abs(diff), `Penyesuaian Transaksi ${id}`, req.user.userId]
                        );
                    }
                }
            } else {
                // Account changed (e.g. from Tunai to Transfer)
                // 1. Remove from old account
                const [oldAccRows] = await connection.query("SELECT id FROM accounts WHERE name = ?", [oldAccountName]);
                if (oldAccRows.length > 0) {
                    const oldAccountId = oldAccRows[0].id;
                    await connection.query("UPDATE accounts SET balance = balance - ? WHERE id = ?", [oldTotal, oldAccountId]);
                    await connection.query(
                        'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id) VALUES (?, ?, ?, ?, ?)',
                        [oldAccountId, 'expense', oldTotal, `Koreksi Metode Pembayaran ${id} (Pindah)`, req.user.userId]
                    );
                }
                // 2. Add to new account
                const [newAccRows] = await connection.query("SELECT id FROM accounts WHERE name = ?", [newAccountName]);
                if (newAccRows.length > 0) {
                    const newAccountId = newAccRows[0].id;
                    await connection.query("UPDATE accounts SET balance = balance + ? WHERE id = ?", [newTotal, newAccountId]);
                    await connection.query(
                        'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id) VALUES (?, ?, ?, ?, ?)',
                        [newAccountId, 'deposit', newTotal, `Koreksi Metode Pembayaran ${id} (Masuk)`, req.user.userId]
                    );
                }
            }
        }

        await connection.commit();
        await logActivity(req.user.userId, 'Sunting Transaksi', 'transaction', id, `Transaksi ${id} diperbarui. Total: Rp ${parseFloat(total || oldTrans.total).toLocaleString('id-ID')}`);

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
        if (connection) await connection.rollback();
        res.status(400).json({ "error": err.message, "stack": err.stack });
    } finally {
        if (connection) connection.release();
    }
});

// Soft delete a transaction
app.delete("/api/transactions/:id", authenticateToken, authorizeRoles('user', 'admin', 'kasir'), async (req, res, next) => {
    try {
        // --- NEW: Reverse Account Balance on Delete ---
        let connection;
        let affectedRows = 0;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            const [transRows] = await connection.query("SELECT total, payment_method, isEmployeeMeal FROM transactions WHERE id = ?", [req.params.id]);
            if (transRows.length > 0 && !transRows[0].isEmployeeMeal) {
                const trans = transRows[0];
                const accountName = (trans.payment_method.toLowerCase() === 'tunai' || trans.payment_method.toLowerCase() === 'cash')
                    ? 'lapak_deposit'
                    : 'owner_deposit';

                const [accRows] = await connection.query("SELECT id FROM accounts WHERE name = ?", [accountName]);
                if (accRows.length > 0) {
                    const accountId = accRows[0].id;
                    const amountToReverse = parseFloat(trans.total);

                    // 1. Deduct from account
                    await connection.query(
                        "UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        [amountToReverse, accountId]
                    );

                    // 2. Record reversal
                    await connection.query(
                        'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                        [accountId, 'expense', amountToReverse, `Pembatalan Transaksi ${req.params.id}`, req.user.userId, new Date()]
                    );

                    console.log(`[SYNC-DELETE] Transaction ${req.params.id} reversed from ${accountName} (-${amountToReverse})`);
                }
            }

            const sql = 'UPDATE transactions SET deleted_at = ? WHERE id = ?';
            const [result] = await connection.query(sql, [new Date(), req.params.id]);
            affectedRows = result.affectedRows;

            await connection.commit();
        } catch (error) {
            if (connection) await connection.rollback();
            console.error("Error deleting transaction and syncing account:", error);
            // It's better to let the outer catch handle the response to keep it consistent
            throw error;
        } finally {
            if (connection) connection.release();
        }

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

        res.json({ "message": "deleted", changes: affectedRows });
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

        // --- NEW: Sync Simplified Transaction to Account Balance ---
        try {
            // Determine which account to update
            const accountName = (payment_method.toLowerCase() === 'tunai' || payment_method.toLowerCase() === 'cash')
                ? 'lapak_deposit'
                : 'owner_deposit';

            const [accRows] = await connection.query("SELECT id FROM accounts WHERE name = ?", [accountName]);

            if (accRows.length > 0) {
                const accountId = accRows[0].id;
                const amountToSync = parseFloat(total_amount);

                // 1. Update Account Balance
                await connection.query(
                    "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    [amountToSync, accountId]
                );

                // 2. Record in account_transactions
                await connection.query(
                    'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [accountId, 'deposit', amountToSync, `Penjualan V2 #${simple_transaction_id}`, user_id, new Date()]
                );

                console.log(`[SYNC-V2] Transaction #${simple_transaction_id} synced to ${accountName} (+${amountToSync})`);
            }
        } catch (syncError) {
            console.error(`[SYNC-V2] Failed to sync transaction to account:`, syncError);
        }
        // --- End Sync ---

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
app.get("/api/expenses/all", authenticateToken, authorizeRoles('admin', 'owner', 'kasir', 'penjual', 'seller', 'user', 'guest'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const [closingRow] = await db.query("SELECT value FROM settings WHERE `key` = 'last_closing_date'");
        const lastClosingDate = closingRow.length > 0 ? closingRow[0].value : null;

        // Default filterClosed to true if not provided
        const filterClosed = req.query.filterClosed === undefined ? true : req.query.filterClosed === 'true';
        let whereClauses = [];
        if (filterClosed) {
            whereClauses.push('e.closing_session_id IS NULL');
        }
        let queryParams = [];

        if (startDate) {
            whereClauses.push('e.date >= ?');
            queryParams.push(startDate);
        }

        if (endDate) {
            whereClauses.push('e.date <= ?');
            queryParams.push(`${endDate} 23:59:59`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const dataSql = `
            SELECT 
                e.id,
                e.name,
                e.amount,
                e.category,
                DATE_FORMAT(e.date, '%Y-%m-%d %H:%i:%s+07:00') AS date,
                e.notes,
                e.user_id,
                e.closing_session_id,
                u.username AS recorded_by
            FROM expenses e
            LEFT JOIN users u ON e.user_id = u.id
            ${whereSql}
            ORDER BY e.date DESC
        `;
        const [rows] = await db.query(dataSql, queryParams);

        res.json({
            "message": "success",
            "data": rows,
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Get all expenses with pagination and date range filtering
app.get("/api/expenses", authenticateToken, authorizeRoles('admin', 'owner', 'kasir', 'penjual', 'seller', 'user', 'guest'), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const { startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let whereClauses = ['e.closing_session_id IS NULL'];
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
                e.closing_session_id,
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
app.post("/api/expenses", authenticateToken, authorizeRoles('admin', 'owner', 'kasir', 'penjual', 'seller', 'user'), async (req, res, next) => {
    let connection;
    try {
        const { name, amount, category, date, notes, account_name = 'lapak_deposit' } = req.body;
        if (!name || !amount || !date) {
            return res.status(400).json({ "error": "Missing required fields: name, amount, date" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Get account ID
        const [accRows] = await connection.query("SELECT id, balance FROM accounts WHERE name = ?", [account_name]);
        if (accRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ "error": `Account '${account_name}' not found.` });
        }
        const accountId = accRows[0].id;
        const amountToDeduct = parseFloat(amount) || 0;

        // 2. Insert into expenses table
        const sql = 'INSERT INTO expenses (name, amount, category, date, notes, user_id, account_id) VALUES (?,?,?,?,?,?,?)';
        const cleanDate = date ? date.split('+')[0].split('Z')[0].replace('T', ' ') : null;
        const params = [name, amountToDeduct, category, cleanDate, notes, req.user.userId, accountId];
        const [result] = await connection.query(sql, params);
        const expenseId = result.insertId;

        // 3. Update Account Balance
        await connection.query(
            "UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [amountToDeduct, accountId]
        );

        // 4. Record in account_transactions
        await connection.query(
            'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, created_at, expense_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [accountId, 'expense', amountToDeduct, `Pengeluaran: ${name}`, req.user.userId, cleanDate || new Date(), expenseId]
        );

        await connection.commit();
        await logActivity(req.user.userId, 'Tambah Pengeluaran', 'expense', expenseId, `Pengeluaran baru: ${name} sebesar Rp ${amountToDeduct.toLocaleString('id-ID')}`);

        console.log(`[SYNC-EXPENSE] Expense ${expenseId} synced to ${account_name} (-${amountToDeduct})`);

        res.json({
            "message": "success",
            "data": { id: expenseId, ...req.body },
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error adding expense:', err);
        res.status(400).json({ "error": err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Update an expense
app.put("/api/expenses/:id", authenticateToken, authorizeRoles('admin', 'owner', 'kasir', 'penjual', 'seller', 'user'), async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const { name, amount, category, date, notes } = req.body;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Get existing expense
        const [oldRows] = await connection.query("SELECT * FROM expenses WHERE id = ?", [id]);
        if (oldRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ "error": "Expense not found" });
        }
        const oldExpense = oldRows[0];
        const oldAmount = parseFloat(oldExpense.amount);
        const accountId = oldExpense.account_id;

        const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;
        const cleanDate = date ? date.split('+')[0].split('Z')[0].replace('T', ' ') : null;

        // 2. Update expenses table
        const sql = `UPDATE expenses set 
           name = COALESCE(?, name), 
           amount = ?, 
           category = COALESCE(?, category), 
           date = COALESCE(?, date), 
           notes = COALESCE(?, notes) 
           WHERE id = ?`;
        const params = [name, newAmount, category, cleanDate, notes, id];
        const [result] = await connection.query(sql, params);

        // 3. Sync with Account Balance & Transactions
        if (accountId) {
            const diffAmount = newAmount - oldAmount;
            if (diffAmount !== 0) {
                // Adjust balance (deduct the difference)
                // If newAmount > oldAmount, diff is positive, balance decreases more
                // If newAmount < oldAmount, diff is negative, balance increases (refund)
                await connection.query(
                    "UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    [diffAmount, accountId]
                );
            }

            // Update linked account transaction
            await connection.query(
                "UPDATE account_transactions SET amount = ?, description = COALESCE(?, description), created_at = COALESCE(?, created_at) WHERE expense_id = ?",
                [newAmount, name ? `Pengeluaran: ${name}` : null, cleanDate, id]
            );
        }

        await connection.commit();
        await logActivity(req.user.userId, 'Update Pengeluaran', 'expense', id, `Pengeluaran ID ${id} diupdate: ${name || oldExpense.name} sebesar Rp ${newAmount.toLocaleString('id-ID')}`);

        res.json({
            "message": "success",
            "data": req.body,
            "changes": result.affectedRows
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error updating expense:', err);
        res.status(400).json({ "error": err.message });
    } finally {
        if (connection) connection.release();
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
app.delete("/api/expenses/:id", authenticateToken, authorizeRoles('admin', 'owner', 'kasir', 'penjual', 'seller', 'user'), async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Get existing expense
        const [oldRows] = await connection.query("SELECT * FROM expenses WHERE id = ?", [id]);
        if (oldRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ "error": "Expense not found" });
        }
        const oldExpense = oldRows[0];
        const oldAmount = parseFloat(oldExpense.amount);
        const accountId = oldExpense.account_id;

        // 2. Refund balance
        if (accountId) {
            await connection.query(
                "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [oldAmount, accountId]
            );
            // Note: account_transactions with expense_id will be deleted automatically 
            // because of ON DELETE CASCADE on the foreign key (if it was added correctly).
            // To be safe, let's also delete it explicitly if cascade is not certain.
            await connection.query("DELETE FROM account_transactions WHERE expense_id = ?", [id]);
        }

        // 3. Delete expense
        const sql = 'DELETE FROM expenses WHERE id = ?';
        const [result] = await connection.query(sql, [id]);

        await connection.commit();
        await logActivity(req.user.userId, 'Hapus Pengeluaran', 'expense', id, `Pengeluaran ID ${id} dihapus, saldo sebesar Rp ${oldAmount.toLocaleString('id-ID')} dikembalikan`);

        res.json({ "message": "deleted", changes: result.affectedRows });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error deleting expense:', err);
        res.status(400).json({ "error": err.message });
    } finally {
        if (connection) connection.release();
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
            allowedRoles = ['admin', 'owner', 'kasir', 'user', 'penjual', 'seller']; // Expanded roles for Owner account as requested
        } else {
            return res.status(400).json({ error: "Invalid account name" });
        }

        const account = await getAccountAndAuthorize(req, res, accountName, allowedRoles);
        if (!account) return; // Response already sent by helper

        // Fetch transactions for this account with filtering
        const { type, startDate, endDate, search } = req.query;
        let whereClauses = ['at.account_id = ?', 'at.closing_session_id IS NULL'];
        let queryParams = [account.id];

        const [closingRow] = await db.query("SELECT value FROM settings WHERE `key` = 'last_closing_date'");
        const lastClosingDate = closingRow.length > 0 ? closingRow[0].value : null;

        if (type && type !== 'all') {
            whereClauses.push('at.type = ?');
            queryParams.push(type);
        }

        if (startDate) {
            // User requested a specific start date. Honor it strictly (00:00:00)
            whereClauses.push('at.created_at >= ?');
            queryParams.push(startDate.includes(':') ? startDate : `${startDate} 00:00:00`);
        }

        if (endDate) {
            whereClauses.push('at.created_at <= ?');
            queryParams.push(endDate.includes(':') ? endDate : `${endDate} 23:59:59`);
        }

        if (search) {
            whereClauses.push('at.description LIKE ?');
            queryParams.push(`%${search}%`);
        }

        const whereSql = whereClauses.join(' AND ');

        // Return the actual account balance for the header card
        let displayedBalance = account.balance;

        // Optionally calculate period balance if needed, but for now stick to account.balance
        // which matches high-level financial tracking expectation for 'Lapak Deposit'

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
            allowedRoles = ['admin', 'user', 'kasir', 'owner'];
        } else if (account_name === 'owner_deposit') {
            allowedRoles = ['admin', 'owner', 'kasir', 'user', 'penjual', 'seller'];
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
            allowedRoles = ['admin', 'user', 'kasir', 'owner'];
        } else if (account_name === 'owner_deposit') {
            allowedRoles = ['admin', 'owner', 'kasir', 'user', 'penjual', 'seller'];
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

        // Check ownership or admin/authorized roles
        const authorizedRoles = ['admin', 'owner', 'kasir', 'user', 'penjual', 'seller'];
        if (transaction.created_by_user_id !== userId && !authorizedRoles.includes(req.user.role)) {
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

        // Check ownership or admin/authorized roles
        const authorizedRoles = ['admin', 'owner', 'kasir', 'user', 'penjual', 'seller'];
        if (transaction.created_by_user_id !== userId && !authorizedRoles.includes(req.user.role)) {
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
        if (transaction.expense_id) {
            // Bugfix Auditor: Jika transaksi berasal dari pengeluaran, hapus data pengeluaran utama.
            // Relasi ON DELETE CASCADE akan otomatis menghapus record di account_transactions ini.
            await connection.query('DELETE FROM expenses WHERE id = ?', [transaction.expense_id]);
        } else {
            // Jika transaksi manual biasa
            await connection.query('DELETE FROM account_transactions WHERE id = ?', [id]);
        }

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
            const [menuItemRows] = await db.query('SELECT id, name, price, discount, stock, hpp, hpp_details FROM menu_items WHERE id = ?', [item.id]);
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

            // Parse hpp_details snapshot
            let hppDetails = [];
            if (menuItem.hpp_details) {
                hppDetails = typeof menuItem.hpp_details === 'string'
                    ? JSON.parse(menuItem.hpp_details)
                    : menuItem.hpp_details;
            }

            orderItemsWithDetails.push({
                id: menuItem.id,
                name: menuItem.name,
                price: itemPrice,
                discount: itemDiscount,
                hpp: parseFloat(menuItem.hpp || 0),
                hpp_details: hppDetails,
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

            // Kirim Email Notifikasi Pesanan Baru (async)
            sendOrderEmailNotification(orderId, 'new_order')
                .catch(err => console.error('Email notification error:', err));
        });

        // Realtime Update via Socket.io (instant)
        const socketTimestamp = new Date().toISOString();
        req.app.get('io').emit('new_order', {
            id: orderId,
            customer_name,
            total: calculatedTotal,
            promo_discount: finalPromoDiscount,
            status: 'pending',
            created_at: socketTimestamp,
            timestamp: socketTimestamp,
            user_id: userId
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

        // Always hide soft-deleted orders and archived orders
        whereClauses.push('deleted_at IS NULL');
        whereClauses.push('closing_session_id IS NULL');

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query to get total count
        const countSql = `SELECT COUNT(*) as totalItems FROM orders ${whereClause}`;
        const [countRows] = await db.query(countSql, queryParams);
        const totalItems = countRows[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        // Query to get paginated data
        const dataSql = `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        const [rows] = await db.query(dataSql, [...queryParams, limit, offset]);

        // Fix timezone for production: MySQL DATETIME is timezone-naive
        // Historical data was stored when server was in GMT+1 (Europe)
        // Now server is in GMT+7 (WIB), so we need to add 6 hours offset to old data
        // CUTOFF DATE: 2026-02-17 00:00:00 WIB (when timezone was fixed)
        const TIMEZONE_MIGRATION_DATE = new Date('2026-02-17T23:30:00+07:00');

        const formattedRows = rows.map(order => {
            let isoDate = null;
            if (order.created_at) {
                const mysqlDateStr = order.created_at;
                let dateObj = null;

                // If it's already a Date object
                if (mysqlDateStr instanceof Date) {
                    dateObj = mysqlDateStr;
                } else if (typeof mysqlDateStr === 'string') {
                    // MySQL DATETIME format: "YYYY-MM-DD HH:MM:SS"
                    dateObj = new Date(mysqlDateStr);
                }

                if (dateObj && !isNaN(dateObj.getTime())) {
                    // Only apply offset to data created BEFORE timezone migration
                    if (dateObj < TIMEZONE_MIGRATION_DATE) {
                        // Old data: Add 6 hours offset to compensate (GMT+1 → GMT+7 = +6 hours)
                        const offsetMs = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
                        const correctedDate = new Date(dateObj.getTime() + offsetMs);
                        isoDate = correctedDate.toISOString();
                    } else {
                        // New data: Already stored with correct timezone, no offset needed
                        isoDate = dateObj.toISOString();
                    }
                }
            }
            return {
                ...order,
                created_at: isoDate,
                timestamp: isoDate // Add timestamp field for consistency
            };
        });

        res.json({
            "message": "success",
            "data": formattedRows,
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

// Soft delete ALL orders (Management only)
app.delete("/api/orders/delete-all/confirm", authenticateToken, authorizeRoles('admin', 'owner', 'kasir'), async (req, res) => {
    try {
        // Only delete active orders (not already deleted)
        const sql = 'UPDATE orders SET deleted_at = NOW() WHERE deleted_at IS NULL';
        const [result] = await db.query(sql);

        if (result.affectedRows > 0) {
            await logActivity(req.user.userId, 'Menghapus Semua Pesanan', 'order', null, `Semua pesanan (${result.affectedRows} item) dipindahkan ke sampah`);

            // Emit Socket Update to refresh all clients
            const io = req.app.get('io');
            if (io) {
                // Determine a special status or just trigger a refresh
                io.emit('order_update', { status: 'bulk_deleted' });
            }
        }

        res.json({ message: "deleted_all", count: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Soft delete single order (Management only)
app.delete("/api/orders/:id", authenticateToken, authorizeRoles('admin', 'user', 'penjual', 'kasir', 'owner'), async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Get the full order details for side-effect handling
        const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);

        if (orderRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Order not found or already deleted." });
        }

        const order = orderRows[0];

        // Side-effect: If the order was accepted, reverse stock and delete transaction
        if (order.status === 'accepted' || order.status === 'completed') {
            let items = [];
            try {
                items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            } catch (e) {
                console.error("Error parsing items for stock restoration:", e);
            }

            // Restore stock if it was an active order
            if (Array.isArray(items)) {
                for (const item of items) {
                    const itemId = item.id || item.menu_item_id;
                    const qty = parseInt(item.qty || item.quantity || 0);
                    if (itemId && qty > 0) {
                        await connection.query('UPDATE menu_items SET stock = stock + ? WHERE id = ?', [qty, itemId]);
                    }
                }
            }

            // Delete the associated transaction to maintain financial accuracy
            await connection.query('DELETE FROM transactions WHERE order_id = ?', [id]);
        }

        // Soft delete: update deleted_at
        const sql = 'UPDATE orders SET deleted_at = NOW() WHERE id = ?';
        const [result] = await connection.query(sql, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Order not found during deletion update." });
        }

        await connection.commit();

        await logActivity(req.user.userId, 'Menghapus Pesanan', 'order', id, `Pesanan #${id} dipindahkan ke sampah`);

        // Emit Socket Update
        const io = req.app.get('io');
        if (io) {
            io.emit('order_update', { id, status: 'deleted' });
        }

        res.json({ message: "deleted" });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Order deletion error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// --- Order Trash Management ---

// Get trashed orders (Management only)
app.get("/api/orders/trash", authenticateToken, authorizeRoles('admin', 'owner', 'kasir', 'penjual'), async (req, res) => {
    try {
        const sql = 'SELECT * FROM orders WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC';
        const [rows] = await db.query(sql);

        const formattedRows = rows.map(order => {
            let isoDate = null;
            if (order.created_at) {
                isoDate = new Date(order.created_at).toISOString();
            }
            let deletedAtIso = null;
            if (order.deleted_at) {
                deletedAtIso = new Date(order.deleted_at).toISOString();
            }
            return {
                ...order,
                created_at: isoDate,
                deleted_at: deletedAtIso,
                timestamp: isoDate
            };
        });

        res.json({ message: "success", data: formattedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Restore order from trash
app.put("/api/orders/:id/restore", authenticateToken, authorizeRoles('admin', 'owner', 'kasir', 'penjual'), async (req, res) => {
    const { id } = req.params;
    try {
        const sql = 'UPDATE orders SET deleted_at = NULL WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Pesanan tidak ditemukan di tempat sampah." });
        }

        await logActivity(req.user.userId, 'Memulihkan Pesanan', 'order', id, `Pesanan #${id} dipulihkan dari sampah`);

        const io = req.app.get('io');
        if (io) {
            io.emit('order_update', { id, status: 'restored' });
        }

        res.json({ message: "restored" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Permanent delete order
app.delete("/api/orders/:id/permanent", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const { id } = req.params;
    try {
        const sql = 'DELETE FROM orders WHERE id = ? AND deleted_at IS NOT NULL';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Pesanan tidak ditemukan atau bukan di tempat sampah." });
        }

        await logActivity(req.user.userId, 'Hapus Permanen Pesanan', 'order', id, `Pesanan #${id} dihapus permanen dari sistem`);

        res.json({ message: "permanently_deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single order by ID
app.get("/api/orders/:id", authenticateToken, authorizeRoles('admin', 'user', 'pelanggan', 'penjual', 'kasir', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const isManagement = ['admin', 'user', 'kasir', 'penjual', 'owner'].includes(req.user.role);

        let sql = 'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL';
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

        // Fix timezone: ensure created_at is sent in ISO format
        if (order.created_at) {
            const d = new Date(order.created_at);
            if (!isNaN(d.getTime())) {
                order.created_at = d.toISOString();
            }
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
                    sendUniversalNotification([order.user_id], statusMsg, title, { orderId: id, status, type: 'orders' })
                        .catch(err => console.error('Push notification error:', err));

                    // Kirim Email Notifikasi Update Status ke Pelanggan (async)
                    sendOrderEmailNotification(id, 'status_update', status)
                        .catch(err => console.error('Email status update error:', err));
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
                            { itemId: item.id, type: 'stock_alert' }
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

            // --- NEW: Sync Transaction to Account Balance for Orders ---
            try {
                // Determine which account to update
                const accountName = (transactionData.payment_method.toLowerCase() === 'tunai' || transactionData.payment_method.toLowerCase() === 'cash')
                    ? 'lapak_deposit'
                    : 'owner_deposit';

                const [accRows] = await connection.query("SELECT id, balance FROM accounts WHERE name = ?", [accountName]);

                if (accRows.length > 0) {
                    const accountId = accRows[0].id;
                    const amountToSync = parseFloat(transactionData.total);

                    // 1. Update Account Balance
                    await connection.query(
                        "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        [amountToSync, accountId]
                    );

                    // 2. Record in account_transactions
                    await connection.query(
                        'INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                        [accountId, 'deposit', amountToSync, `Penjualan ${newTransactionId} (Order #${id})`, req.user.userId, transactionData.timestamp]
                    );

                    console.log(`[SYNC-ORDER] Order #${id} synced to ${accountName} (+${amountToSync})`);
                }
            } catch (syncError) {
                console.error(`[SYNC-ORDER] Failed to sync order to account:`, syncError);
                // We don't rollback here because the transaction itself is more important
            }
            // --- End Sync ---

            // 5. Update the order status to 'accepted'
            await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['accepted', id]);

            // Kirim Notifikasi ke Pelanggan - Pesanan Diterima (async)
            if (order.user_id) {
                setImmediate(() => {
                    sendUniversalNotification(
                        [order.user_id],
                        'Pesanan Anda telah diterima dan sedang diproses!',
                        'Pesanan Diterima! ✅',
                        { orderId: id, status: 'accepted', type: 'orders' }
                    ).catch(err => console.error('Push notification error:', err));

                    // Kirim Email Notifikasi Pesanan Diterima ke Pelanggan (async)
                    sendOrderEmailNotification(id, 'status_update', 'accepted')
                        .catch(err => console.error('Email accepted notification error:', err));
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
        const { username, password, phone, address, email } = req.body;
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
        const sql = 'INSERT INTO users (username, password, role, phone, address, email) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [username, hashedPassword, 'pelanggan', phone || null, address || null, email || null]);

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

// Forgot Password
app.post("/api/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email wajib diisi" });
        }

        // Cari user berdasarkan email
        const [rows] = await db.query('SELECT id, username, email FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            // Demi keamanan, tetap kirim respons sukses meski email tidak ditemukan
            return res.json({ message: "Jika email terdaftar, link reset password telah dikirim." });
        }

        const user = rows[0];

        // Generate token acak
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam dari sekarang

        // Simpan token ke database
        await db.query(
            'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
            [token, expires, user.id]
        );

        // Buat link reset password
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        // Kirim email
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">Reset Kata Sandi</h2>
                <p>Halo, <strong>${user.username}</strong>!</p>
                <p>Kami menerima permintaan untuk mereset kata sandi akun Anda. Klik tombol di bawah ini untuk melanjutkan:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                        Reset Kata Sandi
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">Link ini akan kedaluwarsa dalam <strong>1 jam</strong>.</p>
                <p style="color: #666; font-size: 14px;">Jika Anda tidak meminta reset kata sandi, abaikan email ini.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">Kasir Berkah 88</p>
            </div>
        `;

        const emailResult = await sendEmail(email, 'Reset Kata Sandi - Kasir Berkah 88', html);
        if (!emailResult.success) {
            console.error('Failed to send reset password email:', emailResult.error);
            return res.status(500).json({ error: "Gagal mengirim email. Coba lagi nanti." });
        }

        await logActivity(user.id, 'Permintaan Reset Password', 'user', user.id, `Reset password diminta untuk ${email}`);
        res.json({ message: "Jika email terdaftar, link reset password telah dikirim." });

    } catch (err) {
        console.error("Error forgot-password:", err);
        res.status(500).json({ error: err.message });
    }
});

// Reset Password
app.post("/api/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token dan kata sandi baru wajib diisi" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Kata sandi minimal 6 karakter" });
        }

        // Cari user berdasarkan token yang masih valid
        const [rows] = await db.query(
            'SELECT id, username FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: "Token tidak valid atau sudah kedaluwarsa. Silakan minta link reset baru." });
        }

        const user = rows[0];

        // Hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password dan hapus token
        await db.query(
            'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        await logActivity(user.id, 'Reset Password Berhasil', 'user', user.id, `Password user ${user.username} berhasil direset`);
        res.json({ message: "Kata sandi berhasil diubah. Silakan login dengan kata sandi baru Anda." });

    } catch (err) {
        console.error("Error reset-password:", err);
        res.status(500).json({ error: err.message });
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
    if (key === 'dashboard_running_text') dbKey = 'dashboard_running_text';
    if (key === 'dashboard_running_text_enabled') dbKey = 'dashboard_running_text_enabled';
    if (key === 'dashboard_watermark_enabled') dbKey = 'dashboard_watermark_enabled';
    if (key === 'daily_welcome_enabled') dbKey = 'daily_welcome_enabled';

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

// Upload Dashboard Watermark
app.post('/api/settings/dashboard-watermark', authenticateToken, authorizeRoles('admin'), upload.single('watermark'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No watermark file uploaded.' });
        }
        const watermarkUrl = `/public/uploads/${req.file.filename}`;

        const sql = 'INSERT INTO settings (`key`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)';
        await db.query(sql, ['dashboard_watermark_url', watermarkUrl]);

        res.json({ message: 'Watermark updated successfully!', data: { dashboard_watermark_url: watermarkUrl } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Dashboard Watermark
app.delete('/api/settings/dashboard-watermark', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const sql = 'UPDATE settings SET `value` = NULL WHERE `key` = ?';
        await db.query(sql, ['dashboard_watermark_url']);
        res.json({ message: 'Watermark removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Dashboard Watermark specifically
app.get('/api/settings/dashboard-watermark', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT value FROM settings WHERE `key` = ?', ['dashboard_watermark_url']);
        const watermarkUrl = rows.length > 0 ? rows[0].value : null;
        res.json({ message: 'success', data: { dashboard_watermark_url: watermarkUrl } });
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
app.delete("/api/admin/data/all", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { masterPassword } = req.body;
        if (!masterPassword) {
            return res.status(400).json({ error: "Master password is required" });
        }

        const [masterPassRow] = await connection.query('SELECT value FROM settings WHERE `key` = ?', ['master_password']);
        const storedMasterPassword = masterPassRow.length > 0 ? masterPassRow[0].value : null;

        if (!storedMasterPassword) {
            return res.status(401).json({ error: "Kata sandi master belum diatur. Silakan atur di Pengaturan." });
        }

        let isPasswordValid = false;
        const isStoredPassHashed = storedMasterPassword.startsWith('$2a$') || storedMasterPassword.startsWith('$2b$') || storedMasterPassword.startsWith('$2y$');

        if (isStoredPassHashed) {
            isPasswordValid = await bcrypt.compare(masterPassword, storedMasterPassword);
        } else {
            isPasswordValid = (masterPassword === storedMasterPassword);
        }

        if (!isPasswordValid) {
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
        const sql = 'SELECT id, username, email, role, avatar_url, phone, address, points FROM users WHERE id = ?';
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
        const { email, phone, address } = req.body;

        // Check if user exists first
        const [userCheck] = await db.query('SELECT id FROM users WHERE id = ?', [req.user.userId]);
        if (userCheck.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const sql = 'UPDATE users SET email = ?, phone = ?, address = ? WHERE id = ?';
        await db.query(sql, [email || null, phone || null, address || null, req.user.userId]);

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

            transactionsQuery = `SELECT id, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s+07:00') AS timestamp, items, total, ppn, isEmployeeMeal, payment_method, cash_paid, \`change\`, order_id, user_id, manual_discount, catatan, deleted_at FROM transactions WHERE timestamp ${dateClause} AND closing_session_id IS NULL ORDER BY timestamp DESC, id DESC`;
            expensesQuery = `SELECT id, name, amount, category, DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s+07:00') AS date, notes, user_id FROM expenses WHERE date ${dateClause} AND closing_session_id IS NULL ORDER BY date DESC, id DESC`;
            lapakAccountQuery = `SELECT at.id, at.account_id, at.type, at.amount, at.description, at.created_by_user_id, DATE_FORMAT(at.created_at, '%Y-%m-%d %H:%i:%s+07:00') AS created_at, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'lapak_deposit' AND at.created_at ${dateClause} AND at.closing_session_id IS NULL ORDER BY at.created_at DESC, at.id DESC`;
            ownerAccountQuery = `SELECT at.id, at.account_id, at.type, at.amount, at.description, at.created_by_user_id, DATE_FORMAT(at.created_at, '%Y-%m-%d %H:%i:%s+07:00') AS created_at, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id JOIN accounts a ON at.account_id = a.id WHERE a.name = 'owner_deposit' AND at.created_at ${dateClause} AND at.closing_session_id IS NULL ORDER BY at.created_at DESC, at.id DESC`;

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
            AND closing_session_id IS NULL
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
            AND closing_session_id IS NULL
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

            // Format dates to local string to prevent UTC conversion in JSON.stringify
            const formattedRows = rows.map(row => {
                const newRow = { ...row };
                for (const key in newRow) {
                    if (newRow[key] instanceof Date) {
                        // Offset by 7 hours for WIB and format as YYYY-MM-DD HH:mm:ss
                        const d = newRow[key];
                        const offsetDate = new Date(d.getTime() + (7 * 60 * 60 * 1000));
                        newRow[key] = offsetDate.toISOString().replace('T', ' ').substring(0, 19);
                    }
                }
                return newRow;
            });

            backupData.data[tableName] = formattedRows;
            backupData.summary[tableName] = rows.length;
        }

        // Use res.json instead of res.write for better stability and automatic headers
        res.json(backupData);
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
            console.error("[Database Restore] No file uploaded");
            return res.status(400).json({ error: "No backup file uploaded." });
        }

        console.log(`[Database Restore] Starting restore from file: ${req.file.originalname}`);

        // Ensure we can read the file
        const backupContent = fs.readFileSync(req.file.path, 'utf8');
        const backupData = JSON.parse(backupContent);

        if (!backupData.data || typeof backupData.data !== 'object') {
            console.error("[Database Restore] Invalid backup file format - no data object found");
            return res.status(400).json({ error: "Invalid backup file format." });
        }

        connection = await db.getConnection();

        // Increase timeout for this connection if possible to handle large restore operations
        await connection.query("SET SESSION wait_timeout = 600");
        await connection.query("SET SESSION interactive_timeout = 600");

        await connection.beginTransaction();
        console.log("[Database Restore] Database transaction started");

        // 1. Disable foreign key checks for this session
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");
        console.log("[Database Restore] FOREIGN_KEY_CHECKS set to 0");

        // 2. Clear and Insert data for each table
        const tablesToRestore = Object.entries(backupData.data);
        console.log(`[Database Restore] Found ${tablesToRestore.length} tables to restore`);

        for (const [tableName, rows] of tablesToRestore) {
            if (!Array.isArray(rows)) {
                console.log(`[Database Restore] Skipping table ${tableName} as rows is not an array`);
                continue;
            }

            console.log(`[Database Restore] Restoring table: ${tableName} (${rows.length} rows)`);

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

                        // Handle ISO Date strings for MySQL DATETIME columns
                        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
                            // If it's UTC (ends with Z), convert to local WIB (+7)
                            if (val.endsWith('Z')) {
                                const d = new Date(val);
                                // Format to MySQL DATETIME string in local time
                                return new Date(d.getTime() + (7 * 60 * 60 * 1000)).toISOString().replace('T', ' ').substring(0, 19);
                            }
                            // If already formatted as local, just cleanup T
                            return val.replace('T', ' ').split('.')[0];
                        }

                        return val;
                    });
                });

                // Execute Bulk Insert (much faster)
                await connection.query(sql, [values]);
            }
        }

        // 3. Commit the transaction first while foreign key checks are still disabled to tolerate references inconsistency in backups
        await connection.commit();
        console.log("[Database Restore] Database transaction committed successfully");

        // 4. Re-enable foreign key checks after commit
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log("[Database Restore] FOREIGN_KEY_CHECKS re-enabled to 1");

        // Cleanup the uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        await logActivity(req.user.userId, 'RUBAH DATABASE (RESTORE)', 'system', 'backup', 'Admin melakukan restore database dari file cadangan.');
        console.log("[Database Restore] Database restore completed successfully!");
        res.json({ message: "Database restored successfully!" });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
                console.log("[Database Restore] Transaction rolled back due to error");
                await connection.query("SET FOREIGN_KEY_CHECKS = 1");
            } catch (rollbackErr) {
                console.error("[Database Restore] Rollback error:", rollbackErr);
            }
        }
        console.error("[Database Restore] Error restoring database:", err);
        
        // Log to error.log
        const errorLog = `\n--- DATABASE RESTORE ERROR ---\nTime: ${new Date().toISOString()}\nError: ${err.message}\nStack: ${err.stack}\n---------------------\n`;
        try {
            fs.appendFileSync(path.join(__dirname, 'error.log'), errorLog);
        } catch (e) { }

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
        const sql = "SELECT * FROM employee_credits WHERE closing_session_id IS NULL ORDER BY credit_date DESC";
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
            "SELECT SUM(total) as total_sales, COUNT(*) as total_transactions FROM transactions WHERE DATE(timestamp) = ? AND closing_session_id IS NULL",
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
        const { receiver_id, message, order_id, image_url, audio_url } = req.body;
        const sender_id = req.user.userId;

        if (!receiver_id || (!message && !image_url && !audio_url)) {
            return res.status(400).json({ error: "Receiver ID dan pesan/gambar/suara wajib diisi" });
        }

        // Process image/audio if it's base64
        const processedImageUrl = await processBase64Image(image_url, 'chat');
        const processedAudioUrl = await processBase64Audio(audio_url, 'voice');

        const now = new Date();
        const sql = "INSERT INTO messages (sender_id, receiver_id, message, order_id, image_url, audio_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const [result] = await db.query(sql, [sender_id, receiver_id, message || '', order_id || null, processedImageUrl || null, processedAudioUrl || null, now]);

        // Kirim Notifikasi Push
        const [receiverRows] = await db.query("SELECT role FROM users WHERE id = ?", [receiver_id]);
        const receiverRole = receiverRows[0]?.role;
        const sellerRoles = ['admin', 'owner', 'penjual', 'kasir', 'seller'];

        let targetUserIds = [receiver_id];

        if (sellerRoles.includes(receiverRole)) {
            const [allSellers] = await db.query("SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')");
            targetUserIds = allSellers.map(s => s.id);
        }

        // Tentukan label notifikasi
        let notifLabel = message;
        if (!notifLabel && processedAudioUrl) notifLabel = '🎤 Pesan Suara';
        if (!notifLabel && processedImageUrl) notifLabel = '📷 Gambar';
        if (!notifLabel) notifLabel = '[Pesan]';

        sendUniversalNotification(
            targetUserIds,
            notifLabel,
            `Pesan dari ${req.user.username}`,
            { type: 'chat', senderId: sender_id, orderId: order_id, hasImage: !!processedImageUrl, hasAudio: !!processedAudioUrl },
            sender_id
        );

        const io = req.app.get('io');
        const messageData = {
            id: result.insertId,
            sender_id,
            receiver_id,
            message,
            order_id,
            image_url: processedImageUrl,
            audio_url: processedAudioUrl,
            created_at: now,
            sender_role: req.user.role,
            receiver_role: receiverRole,
            sender_name: req.user.username || 'User'
        };

        // Emit to specific rooms
        io.to(`user_${receiver_id}`).emit('new_message', messageData);
        io.to(`user_${sender_id}`).emit('new_message', messageData);

        if (sellerRoles.includes(receiverRole) || sellerRoles.includes(req.user.role)) {
            io.to('sellers').emit('new_message', messageData);
        }

        res.status(201).json({
            message: "Pesan terkirim",
            data: messageData
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

// Edit Pesan Individual
app.put("/api/messages/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const userId = req.user.userId;

        if (!message) {
            return res.status(400).json({ error: "Pesan tidak boleh kosong" });
        }

        // Pastikan hanya pengirim yang bisa mengedit pesannya sendiri
        const [rows] = await db.query("SELECT sender_id FROM messages WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Pesan tidak ditemukan" });
        }

        if (rows[0].sender_id !== userId) {
            return res.status(403).json({ error: "Anda tidak memiliki izin untuk mengedit pesan ini" });
        }

        await db.query("UPDATE messages SET message = ?, is_edited = 1 WHERE id = ?", [message, id]);

        const io = req.app.get('io');
        // Beritahu semua client yang terlibat bahwa pesan telah diupdate
        io.emit('message_edited', { id: parseInt(id), message });

        res.json({ message: "Pesan berhasil diupdate" });
    } catch (err) {
        console.error("Error editing message:", err);
        res.status(500).json({ error: err.message });
    }
});

// Hapus Pesan Individual
app.delete("/api/messages/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Pastikan hanya pengirim yang bisa menghapus pesannya sendiri
        const [rows] = await db.query("SELECT sender_id FROM messages WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Pesan tidak ditemukan" });
        }

        if (rows[0].sender_id !== userId) {
            return res.status(403).json({ error: "Anda tidak memiliki izin untuk menghapus pesan ini" });
        }

        // Gunakan hard delete sesuai pola penghapusan riwayat chat di atas
        await db.query("DELETE FROM messages WHERE id = ?", [id]);

        const io = req.app.get('io');
        // Beritahu semua client yang terlibat bahwa pesan telah dihapus
        io.emit('message_deleted', { id: parseInt(id) });

        res.json({ message: "Pesan berhasil dihapus" });
    } catch (err) {
        console.error("Error deleting message:", err);
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
                WHERE (m.sender_id = ? AND m.receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')))
                   OR (m.sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')) AND m.receiver_id = ?)
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
                WHERE (m.sender_id = ? AND m.receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')))
                   OR (m.sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')) AND m.receiver_id = ?)
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
        const sellerRoles = ['admin', 'owner', 'penjual', 'kasir', 'seller'];
        const isSeller = sellerRoles.includes(myRole);

        // Target user ID adalah pelanggan (jika saya seller, itu otherUserId. Jika saya pelanggan, itu myId)
        const targetCustomerId = isSeller ? otherUserId : myId;

        // Hapus SEMUA pesan antara pelanggan tersebut dengan SELURUH Tim Seller
        // Gunakan hard delete sesuai kode asli agar benar-benar hilang dari DB
        const sql = `
            DELETE FROM messages 
            WHERE (sender_id = ? AND receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')))
               OR (sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')) AND receiver_id = ?)
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
        const sellerRoles = ['admin', 'owner', 'penjual', 'kasir', 'seller'];
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
                    CASE
                        WHEN m.audio_url IS NOT NULL AND m.audio_url != '' THEN '🎤 Pesan Suara'
                        WHEN m.image_url IS NOT NULL AND m.image_url != '' AND (m.message IS NULL OR m.message = '') THEN '📷 Gambar'
                        WHEN m.message IS NOT NULL AND m.message != '' THEN m.message
                        ELSE 'Mulai percakapan...'
                    END as last_message, 
                    m.created_at as last_message_time,
                    (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')) AND is_read = 0) as unread_count
                FROM users u
                JOIN messages m ON m.id = (
                    SELECT MAX(id) 
                    FROM messages 
                    WHERE (sender_id = u.id AND receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')))
                       OR (sender_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')) AND receiver_id = u.id)
                )
                WHERE u.role NOT IN ('admin', 'owner', 'penjual', 'kasir', 'seller')
                ORDER BY m.created_at DESC
            `;
            params = [];
        } else {
            // Query Super Akurat (Tanpa Cache) - Untuk Pelanggan
            sql = `
                SELECT 
                    SQL_NO_CACHE
                    COALESCE((SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller') LIMIT 1), 1) as user_id, 
                    'Pusat Bantuan (Toko)' as username, 
                    'admin' as role,
                    (
                        SELECT CASE
                            WHEN audio_url IS NOT NULL AND audio_url != '' THEN '🎤 Pesan Suara'
                            WHEN image_url IS NOT NULL AND image_url != '' AND (message IS NULL OR message = '') THEN '📷 Gambar'
                            WHEN message IS NOT NULL AND message != '' THEN message
                            ELSE 'Mulai percakapan...'
                        END
                        FROM messages WHERE (sender_id = ? OR receiver_id = ?) ORDER BY id DESC LIMIT 1
                    ) as last_message,
                    (SELECT created_at FROM messages WHERE (sender_id = ? OR receiver_id = ?) ORDER BY id DESC LIMIT 1) as last_message_time,
                    COALESCE((SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = 0), 0) as unread_count
            `;
            params = [myId, myId, myId, myId, myId];
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
        const isSeller = ['admin', 'owner', 'penjual', 'kasir', 'seller'].includes(myRole);

        let sql;
        if (isSeller) {
            // Jika dibaca oleh salah satu SELLER, tandai pesan dari PELANGGAN ini (senderId) sudah dibaca oleh TIM SELLER
            sql = "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id IN (SELECT id FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')) AND is_read = 0";
            await db.query(sql, [senderId]);
        } else {
            // Jika dibaca oleh PELANGGAN, tandai SEMUA pesan ke Pelanggan ini sebagai sudah dibaca (Sapu bersih)
            sql = "UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND is_read = 0";
            await db.query(sql, [myId]);
        }

        const io = req.app.get('io');
        io.emit('messages_read', {
            readerId: myId,
            senderId: senderId,
            isSeller: isSeller
        });

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
            // Pelanggan/User/Keluarga hanya bisa melihat Admin, Owner, Penjual, Kasir, dan Seller
            sql = "SELECT id, username, role, avatar_url FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir', 'seller')";
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

        const defaultSettings = {
            orders: true,
            chat: true,
            promo: false
        };

        let settings = defaultSettings;
        if (rows[0].notification_settings) {
            try {
                settings = typeof rows[0].notification_settings === 'string'
                    ? JSON.parse(rows[0].notification_settings)
                    : rows[0].notification_settings;
            } catch (e) {
                console.error('Error parsing notification settings:', e);
                settings = defaultSettings;
            }
        }

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
app.get("/api/promos", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir'), async (req, res) => {
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
app.post("/api/promos", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir'), async (req, res) => {
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
app.put("/api/promos/:id", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir'), async (req, res) => {
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
app.delete("/api/promos/:id", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir'), async (req, res) => {
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

// --- Financial Report Endpoint ---
app.get("/api/reports/financial-summary", authenticateToken, authorizeRoles('admin', 'owner', 'penjual'), async (req, res) => {
    try {
        let { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "StartDate and EndDate are required" });
        }

        // 1. Get Transactions (Omzet)
        const transSql = `
            SELECT t.total
            FROM transactions t
            WHERE t.timestamp BETWEEN ? AND ?
            AND (t.payment_method != 'employee_meal' OR t.payment_method IS NULL)
            AND t.closing_session_id IS NULL
        `;
        const [transactions] = await db.query(transSql, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);

        let totalRevenue = 0;
        transactions.forEach(t => {
            totalRevenue += parseFloat(t.total || 0);
        });

        // 2. Get Lapak Depot Data (Combined Real-Time Balances)
        // Revised: Sum of Saldo Lapak + Saldo Owner
        const [accountRows] = await db.query(
            "SELECT SUM(balance) as total_balance FROM accounts WHERE name IN ('lapak_deposit', 'owner_deposit')"
        );
        const totalBalances = parseFloat(accountRows[0]?.total_balance || 0);
        console.log(`[DEBUG] Financial Summary - Combined Balances: ${totalBalances}`);

        // 3. Get Expenses (Operational Costs)
        const expSql = `
            SELECT SUM(amount) as total
            FROM expenses
            WHERE (date BETWEEN ? AND ?)
            AND closing_session_id IS NULL
        `;
        const [expRows] = await db.query(expSql, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);
        const totalExpenses = parseFloat(expRows[0]?.total || 0);

        // 4. Asset Value (Inventory)
        const [menuItems] = await db.query("SELECT id, name, hpp, stock FROM menu_items");
        let totalMenuAsset = 0;
        menuItems.forEach(m => {
            const stock = parseFloat(m.stock || 0);
            if (stock > 0) {
                totalMenuAsset += (stock * parseFloat(m.hpp || 0));
            }
        });

        const [rawMaterials] = await db.query("SELECT current_stock, price_per_item FROM raw_materials");
        let totalRawMaterialAsset = 0;
        rawMaterials.forEach(r => {
            const stock = parseFloat(r.current_stock || 0);
            if (stock > 0) {
                totalRawMaterialAsset += (stock * parseFloat(r.price_per_item || 0));
            }
        });

        // CORRECTED FORMULAS (Lapak Depot is current balance info, not a cost)
        const grossProfit = totalRevenue;               // Laba Kotor = Omzet
        const netProfit = totalRevenue - totalExpenses; // Laba Bersih = Omzet - Biaya Operasional

        res.json({
            message: "success",
            data: {
                period: { startDate, endDate },
                revenue: totalRevenue,              // Pemasukan (Omzet)
                lapakDepot: totalBalances,           // Lapak Depot (Saldo Lapak + Owner)
                grossProfit: grossProfit,           // Laba Kotor
                expenses: totalExpenses,            // Pengeluaran Ops.
                netProfit: netProfit,               // LABA BERSIH
                assets: {
                    menu: totalMenuAsset,
                    rawMaterial: totalRawMaterialAsset,
                    total: totalMenuAsset + totalRawMaterialAsset
                }
            }
        });

    } catch (err) {
        console.error("Error financial summary:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- Popup Management Endpoints ---

// Get all popups (for seller/admin management)
app.get("/api/popups", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir', 'seller'), async (req, res) => {
    try {
        const sql = `
            SELECT * FROM popups 
            ORDER BY priority DESC, created_at DESC
        `;
        const [rows] = await db.query(sql);

        res.json({
            message: "success",
            data: rows.map(row => {
                let show_on_pages = [];
                if (row.show_on_pages) {
                    try {
                        show_on_pages = typeof row.show_on_pages === 'string' ? JSON.parse(row.show_on_pages) : row.show_on_pages;
                        // Handle potential double stringify
                        if (typeof show_on_pages === 'string') {
                            show_on_pages = JSON.parse(show_on_pages);
                        }
                    } catch (e) {
                        console.error(`Error parsing show_on_pages for popup ${row.id}:`, e);
                        show_on_pages = [];
                    }
                }
                return {
                    ...row,
                    show_on_pages: Array.isArray(show_on_pages) ? show_on_pages : [],
                    is_active: row.is_active === 1
                };
            })
        });
    } catch (err) {
        console.error("Error fetching popups:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get active popups for customer (filtered by page)
app.get("/api/popups/active", async (req, res) => {
    try {
        const { page } = req.query; // e.g., 'dashboard', 'menu', 'cart', 'profile'

        let sql = `
            SELECT id, title, image_url, link_type, link_value, show_on_pages, priority, last_pushed_at
            FROM popups 
            WHERE is_active = 1
        `;

        const [rows] = await db.query(sql);

        // Filter out popups with missing images
        const existingPopups = rows.filter(popup => {
            if (!popup.image_url) return true;
            try {
                const filePath = path.join(__dirname, popup.image_url);
                return fs.existsSync(filePath);
            } catch (err) {
                return false;
            }
        });

        // Filter by page if specified
        let filteredPopups = existingPopups;
        if (page) {
            filteredPopups = rows.filter(popup => {
                if (!popup.show_on_pages) return true; // Show on all pages if not specified
                try {
                    let pages = typeof popup.show_on_pages === 'string'
                        ? JSON.parse(popup.show_on_pages)
                        : popup.show_on_pages;

                    // Handle potential double stringify
                    if (typeof pages === 'string') {
                        pages = JSON.parse(pages);
                    }

                    return !pages || (Array.isArray(pages) && pages.length === 0) || (Array.isArray(pages) && pages.includes(page));
                } catch (e) {
                    console.error(`Error parsing show_on_pages in filter for popup ${popup.id}:`, e);
                    return true; // Fallback to showing it
                }
            });
        }

        // Sort by priority
        filteredPopups.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        res.json({
            message: "success",
            data: filteredPopups.map(row => {
                let show_on_pages = [];
                if (row.show_on_pages) {
                    try {
                        show_on_pages = typeof row.show_on_pages === 'string' ? JSON.parse(row.show_on_pages) : row.show_on_pages;
                        // Handle potential double stringify
                        if (typeof show_on_pages === 'string') {
                            show_on_pages = JSON.parse(show_on_pages);
                        }
                    } catch (e) {
                        show_on_pages = [];
                    }
                }
                return {
                    ...row,
                    show_on_pages: Array.isArray(show_on_pages) ? show_on_pages : []
                };
            })
        });
    } catch (err) {
        console.error("Error fetching active popups:", err);
        res.status(500).json({ error: err.message });
    }
});

// Create new popup
app.post("/api/popups", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir', 'seller'), upload.single('image'), async (req, res) => {
    try {
        let popupData;

        if (req.body.data) {
            try {
                popupData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
            } catch (err) {
                console.error("Failed to parse req.body.data:", err);
                popupData = req.body;
            }
        } else {
            popupData = req.body;
        }

        const { title, link_type, link_value, show_on_pages, priority, is_active } = popupData;

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        const image_url = req.file ? `/public/uploads/${req.file.filename}` : null;

        // Fix double stringify bug
        let pages_json;
        if (typeof show_on_pages === 'string') {
            pages_json = show_on_pages; // Already a string from client
        } else {
            pages_json = JSON.stringify(show_on_pages || []);
        }

        const final_is_active = is_active !== undefined ? (is_active == 'true' || is_active === true || is_active == 1 ? 1 : 0) : 1;
        const final_priority = priority !== undefined ? parseInt(priority) : 0;

        const sql = `
            INSERT INTO popups (title, image_url, link_type, link_value, show_on_pages, priority, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            title,
            image_url,
            link_type || 'none',
            link_value || null,
            pages_json,
            final_priority,
            final_is_active
        ]);

        await logActivity(req.user.userId, 'Tambah Popup', 'popup', result.insertId, `Popup baru: ${title}`);

        res.status(201).json({
            message: "success",
            data: {
                id: result.insertId,
                title,
                image_url,
                link_type: link_type || 'none',
                link_value: link_value || null,
                show_on_pages: show_on_pages || [],
                priority: final_priority,
                is_active: final_is_active
            }
        });
    } catch (err) {
        console.error("Error creating popup:", err);
        res.status(400).json({ error: err.message });
    }
});

// Update popup
app.put("/api/popups/:id", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir', 'seller'), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        let popupData;

        if (req.body.data) {
            try {
                popupData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
            } catch (err) {
                console.error("Failed to parse req.body.data:", err);
                popupData = req.body;
            }
        } else {
            popupData = req.body;
        }

        const { title, link_type, link_value, show_on_pages, priority, is_active, remove_image } = popupData;

        // Fetch current popup for image cleanup
        const [currentPopup] = await db.query('SELECT image_url FROM popups WHERE id = ?', [id]);

        if (currentPopup.length === 0) {
            return res.status(404).json({ error: "Popup not found" });
        }

        let sql = 'UPDATE popups SET title = ?, link_type = ?, link_value = ?, show_on_pages = ?, priority = ?, is_active = ?';

        // Fix double stringify bug
        let pages_json;
        if (typeof show_on_pages === 'string') {
            pages_json = show_on_pages; // Already a string from client
        } else {
            pages_json = JSON.stringify(show_on_pages || []);
        }

        const final_is_active = is_active !== undefined ? (is_active == 'true' || is_active === true || is_active == 1 ? 1 : 0) : 1;
        const final_priority = priority !== undefined ? parseInt(priority) : 0;

        let params = [
            title,
            link_type || 'none',
            link_value || null,
            pages_json,
            final_priority,
            final_is_active
        ];

        if (req.file) {
            const image_url = `/public/uploads/${req.file.filename}`;
            sql += ', image_url = ?';
            params.push(image_url);

            // Delete old image
            if (currentPopup[0].image_url) {
                const oldPath = path.join(__dirname, currentPopup[0].image_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        } else if (remove_image === true || remove_image === 'true') {
            sql += ', image_url = NULL';
            // Delete old image
            if (currentPopup[0].image_url) {
                const oldPath = path.join(__dirname, currentPopup[0].image_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        }

        sql += ' WHERE id = ?';
        params.push(id);

        await db.query(sql, params);
        await logActivity(req.user.userId, 'Update Popup', 'popup', id, `Popup ID ${id} diperbarui`);

        res.json({
            message: "success",
            data: { id, ...popupData, is_active: final_is_active, priority: final_priority }
        });
    } catch (err) {
        console.error("Error updating popup:", err);
        res.status(400).json({ error: err.message });
    }
});

// Delete popup
app.delete("/api/popups/:id", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir', 'seller'), async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch image_url for cleanup
        const [rows] = await db.query('SELECT image_url FROM popups WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].image_url) {
            const imagePath = path.join(__dirname, rows[0].image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const sql = 'DELETE FROM popups WHERE id = ?';
        await db.query(sql, [id]);
        await logActivity(req.user.userId, 'Hapus Popup', 'popup', id, `Popup ID ${id} dihapus`);

        res.json({ message: "success" });
    } catch (err) {
        console.error("Error deleting popup:", err);
        res.status(400).json({ error: err.message });
    }
});

// Push popup (update last_pushed_at and send real push notification)
app.post("/api/popups/:id/push", authenticateToken, authorizeRoles('admin', 'owner', 'penjual', 'kasir', 'seller'), async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch popup details first to get the title for notification
        const [popupRows] = await db.query('SELECT title, image_url FROM popups WHERE id = ?', [id]);

        if (popupRows.length === 0) {
            return res.status(404).json({ error: "Popup tidak ditemukan" });
        }

        const popup = popupRows[0];

        // 2. Update last_pushed_at in DB
        const sql = 'UPDATE popups SET last_pushed_at = NOW() WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Gagal memperbarui popup" });
        }

        await logActivity(req.user.userId, 'Push Popup', 'popup', id, `Popup ID ${id} (${popup.title}) di-push ulang`);

        // 3. Send real push notification to all customers
        // null means broadcast to all users
        const io = req.app.get('io');
        setImmediate(() => {
            sendUniversalNotification(
                null,
                `Ada promo/informasi menarik: ${popup.title}`,
                'Info Baru untuk Anda! 📢',
                {
                    popupId: id,
                    type: 'promo',
                    image: popup.image_url
                }
            ).catch(err => console.error('Push notification error:', err));

            // Realtime Update via Socket.io
            if (io) {
                io.emit('popup_push', { id, title: popup.title, last_pushed_at: new Date() });
            }
        });

        res.json({
            message: "Popup berhasil di-push ke semua customer",
            data: { id, last_pushed_at: new Date(), title: popup.title }
        });
    } catch (err) {
        console.error("Error pushing popup:", err);
        res.status(400).json({ error: err.message });
    }
});

// Track popup view
app.post("/api/popups/:id/view", async (req, res) => {
    try {
        const { id } = req.params;

        const sql = 'UPDATE popups SET view_count = view_count + 1 WHERE id = ?';
        await db.query(sql, [id]);

        res.json({ message: "success" });
    } catch (err) {
        console.error("Error tracking popup view:", err);
        res.status(400).json({ error: err.message });
    }
});

// Track popup click
app.post("/api/popups/:id/click", async (req, res) => {
    try {
        const { id } = req.params;

        const sql = 'UPDATE popups SET click_count = click_count + 1 WHERE id = ?';
        await db.query(sql, [id]);

        res.json({ message: "success" });
    } catch (err) {
        console.error("Error tracking popup click:", err);
        res.status(400).json({ error: err.message });
    }
});

// Get popup statistics
app.get("/api/popups/:id/stats", authenticateToken, authorizeRoles('admin', 'penjual', 'seller'), async (req, res) => {
    try {
        const { id } = req.params;

        const sql = 'SELECT view_count, click_count, last_pushed_at FROM popups WHERE id = ?';
        const [rows] = await db.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Popup not found" });
        }

        const stats = rows[0];
        const ctr = stats.view_count > 0 ? (stats.click_count / stats.view_count * 100).toFixed(2) : 0;

        res.json({
            message: "success",
            data: {
                view_count: stats.view_count,
                click_count: stats.click_count,
                ctr: parseFloat(ctr),
                last_pushed_at: stats.last_pushed_at
            }
        });
    } catch (err) {
        console.error("Error fetching popup stats:", err);
        res.status(500).json({ error: err.message });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    // If headers are already sent, delegate to the default Express error handler to avoid write-after-end crashes
    if (res.headersSent) {
        return next(err);
    }
    
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

// Capture uncaught exceptions to prevent server crash in production
process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
    // Write to error.log
    const errorLog = `\n--- UNCAUGHT EXCEPTION ---\nTime: ${new Date().toISOString()}\nError: ${err.message}\nStack: ${err.stack}\n---------------------\n`;
    try {
        fs.appendFileSync(path.join(__dirname, 'error.log'), errorLog);
    } catch (e) { }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
    // Write to error.log
    const errorLog = `\n--- UNHANDLED REJECTION ---\nTime: ${new Date().toISOString()}\nReason: ${reason?.message || reason}\nStack: ${reason?.stack}\n---------------------\n`;
    try {
        fs.appendFileSync(path.join(__dirname, 'error.log'), errorLog);
    } catch (e) { }
});

// Get accurate audit calculation for a specific period
app.get("/api/audit/calculate-accuracy", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const parseDateTime = (d, isEnd) => {
            if (!d) return null;
            // Handle ISO strings with T or space
            let cleaned = d.replace('T', ' ').split('.')[0];
            if (cleaned.length <= 10) {
                return isEnd ? `${cleaned} 23:59:59` : `${cleaned} 00:00:00`;
            }
            return cleaned;
        };

        const periodStartRaw = parseDateTime(startDate, false);
        const periodEndRaw = parseDateTime(endDate, true);

        // 1. Get Initial Capital Baseline
        const [capitalSetting] = await db.query("SELECT value FROM settings WHERE `key` = 'initial_capital'");
        const [capitalDateSetting] = await db.query("SELECT value FROM settings WHERE `key` = 'initial_capital_date'");

        const initialCapital = parseFloat(capitalSetting[0]?.value || 0);
        const initialCapitalDate = capitalDateSetting[0]?.value ? capitalDateSetting[0].value.replace('T', ' ').split('.')[0] : '1970-01-01 00:00:00';

        // 2. Calculate Opening Balance (Balance right before startDate)
        // --- NEW: Better Opening balance logic (includes V1, V2, and Expenses) ---
        let openingBalance = parseFloat(initialCapital);
        if (periodStartRaw) {
            // Revenue BEFORE startDate (V1 & V2)
            // If periodStartRaw is earlier than initialCapitalDate, we'll get inaccurate results 
            // but for current session it works.
            const [revBeforeV1] = await db.query(
                "SELECT SUM(total) as total FROM transactions WHERE timestamp >= ? AND timestamp < ? AND isEmployeeMeal = 0 AND deleted_at IS NULL AND closing_session_id IS NULL",
                [initialCapitalDate, periodStartRaw]
            );
            const [revBeforeV2] = await db.query(
                "SELECT SUM(total_amount) as total FROM simple_transactions WHERE created_at >= ? AND created_at < ? AND closing_session_id IS NULL",
                [initialCapitalDate, periodStartRaw]
            );
            const totalRevBefore = parseFloat(revBeforeV1[0].total || 0) + parseFloat(revBeforeV2[0].total || 0);

            // Expenses BEFORE startDate
            const [expBefore] = await db.query(
                "SELECT SUM(amount) as total FROM expenses WHERE date >= ? AND date < ? AND closing_session_id IS NULL",
                [initialCapitalDate, periodStartRaw]
            );

            // Manual Account adjustments BEFORE startDate
            const [accBefore] = await db.query(
                `SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as total 
                 FROM account_transactions 
                 WHERE created_at >= ? AND created_at < ? 
                 AND LOWER(description) NOT LIKE 'penjualan%' 
                 AND LOWER(description) NOT LIKE 'pengeluaran:%' 
                 AND LOWER(description) NOT LIKE 'pembatalan transaksi%'
                 AND LOWER(description) NOT LIKE 'penyesuaian transaksi%'
                 AND LOWER(description) NOT LIKE 'koreksi metode pembayaran%'
                 AND LOWER(description) NOT LIKE 'modal awal%'
                 AND LOWER(description) NOT LIKE 'reset saldo%'
                 AND LOWER(description) NOT LIKE 'saldo awal%'
                 AND closing_session_id IS NULL`,
                [initialCapitalDate, periodStartRaw]
            );

            openingBalance = parseFloat(initialCapital) + totalRevBefore - parseFloat(expBefore[0].total || 0) + parseFloat(accBefore[0].total || 0);
        }

        // 3. Current Physical status
        const [accounts] = await db.query("SELECT id, name, balance FROM accounts");
        const physicalCashNow = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
        const lapakBalanceNow = parseFloat(accounts.find(a => a.name === 'lapak_deposit')?.balance || 0);
        const ownerBalanceNow = parseFloat(accounts.find(a => a.name === 'owner_deposit')?.balance || 0);

        // 4. Calculate backtracked balances as of endDate (if endDate is in the past)
        let lapakAtEnd = lapakBalanceNow;
        let ownerAtEnd = ownerBalanceNow;
        let physicalCashAtEnd = physicalCashNow;

        if (periodEndRaw) {
            const now = new Date();
            const end = new Date(periodEndRaw);

            if (end < now) {
                // IMPORTANT: To backtrack correctly to the past, WE MUST summation ALL transactions 
                // including archived ones (the reset/clearing transactions).
                const [lapakAfter] = await db.query(
                    `SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as total 
                     FROM account_transactions 
                     WHERE created_at > ? 
                     AND account_id = (SELECT id FROM accounts WHERE name = 'lapak_deposit')`,
                    [periodEndRaw]
                );
                lapakAtEnd = lapakBalanceNow - parseFloat(lapakAfter[0].total || 0);

                const [ownerAfter] = await db.query(
                    `SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as total 
                     FROM account_transactions 
                     WHERE created_at > ? 
                     AND account_id = (SELECT id FROM accounts WHERE name = 'owner_deposit')`,
                    [periodEndRaw]
                );
                ownerAtEnd = ownerBalanceNow - parseFloat(ownerAfter[0].total || 0);

                physicalCashAtEnd = lapakAtEnd + ownerAtEnd;
            }
        }

        // 5. Period performance
        const pStart = periodStartRaw || initialCapitalDate;
        const pEnd = periodEndRaw || new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace('T', ' ').split('.')[0];

        // Period Revenue (V1 + V2)
        const [periodRevV1] = await db.query(
            "SELECT SUM(total) as total FROM transactions WHERE timestamp >= ? AND timestamp <= ? AND isEmployeeMeal = 0 AND deleted_at IS NULL AND closing_session_id IS NULL",
            [pStart, pEnd]
        );
        const [periodRevV2] = await db.query(
            "SELECT SUM(total_amount) as total FROM simple_transactions WHERE created_at >= ? AND created_at <= ? AND closing_session_id IS NULL",
            [pStart, pEnd]
        );
        const totalPeriodRev = parseFloat(periodRevV1[0].total || 0) + parseFloat(periodRevV2[0].total || 0);

        const [periodExp] = await db.query(
            "SELECT SUM(amount) as total FROM expenses WHERE date >= ? AND date <= ? AND closing_session_id IS NULL",
            [pStart, pEnd]
        );

        // Period Manual Adjustments (excluding automated syncs)
        const [accPeriod] = await db.query(
            `SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as total 
             FROM account_transactions 
             WHERE created_at >= ? AND created_at <= ? 
             AND LOWER(description) NOT LIKE 'penjualan%' 
             AND LOWER(description) NOT LIKE 'pengeluaran:%' 
             AND LOWER(description) NOT LIKE 'pembatalan transaksi%'
             AND LOWER(description) NOT LIKE 'penyesuaian transaksi%'
             AND LOWER(description) NOT LIKE 'koreksi metode pembayaran%'
             AND LOWER(description) NOT LIKE 'modal awal%'
             AND LOWER(description) NOT LIKE 'reset saldo%'
             AND LOWER(description) NOT LIKE 'saldo awal%'
             AND closing_session_id IS NULL`,
            [pStart, pEnd]
        );
        const periodAdjustment = parseFloat(accPeriod[0].total || 0);

        const expectedClosingBalance = openingBalance + totalPeriodRev - parseFloat(periodExp[0].total || 0) + periodAdjustment;
        const gap = physicalCashAtEnd - expectedClosingBalance;
        const accuracy = expectedClosingBalance === 0
            ? (physicalCashAtEnd === 0 ? 100 : 0)
            : Math.max(0, Math.min(100, (1 - Math.abs(gap) / expectedClosingBalance) * 100));

        const [accountSyncRows] = await db.query(`
            SELECT a.name, a.balance, 
            (SELECT SUM(CASE WHEN at.type = 'deposit' THEN at.amount ELSE -at.amount END) 
             FROM account_transactions at WHERE at.account_id = a.id) as trans_sum
            FROM accounts a
        `);
        const isSynced = accountSyncRows.every(r => Math.abs(parseFloat(r.balance) - parseFloat(r.trans_sum || 0)) < 0.01);

        res.json({
            message: "success",
            data: {
                openingBalance,
                periodRevenue: totalPeriodRev,
                periodExpenses: parseFloat(periodExp[0].total || 0),
                periodAdjustment,
                expectedClosingBalance,
                physicalCashAtEnd,
                currentLapakBalance: lapakAtEnd,
                currentOwnerBalance: ownerAtEnd,
                auditStartDate: pStart,
                auditEndDate: pEnd,
                gap: parseFloat(gap.toFixed(2)),
                accuracy: parseFloat(accuracy.toFixed(2)),
                isAccurate: accuracy >= 99,
                isSynced: isSynced // Jika false, berarti ada error di database (seperti kasus 45rb kemarin)
            }
        });

    } catch (err) {
        console.error("Audit precision calculation error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * NEW: Verify if account balances match the sum of their transactions (Audit Protection)
 */
app.get("/api/audit/verify-sync", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const [accounts] = await db.query("SELECT id, name, balance FROM accounts");
        const results = [];

        for (const acc of accounts) {
            const [at] = await db.query(
                "SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as total FROM account_transactions WHERE account_id = ?",
                [acc.id]
            );
            const sumTransactions = parseFloat(at[0].total || 0);
            const currentBalance = parseFloat(acc.balance);
            const diff = currentBalance - sumTransactions;

            results.push({
                accountId: acc.id,
                accountName: acc.name,
                currentBalance,
                transactionSum: sumTransactions,
                difference: parseFloat(diff.toFixed(2)),
                isSynced: Math.abs(diff) < 0.01
            });
        }

        const overallSynced = results.every(r => r.isSynced);

        res.json({
            message: overallSynced ? "All accounts are synced." : "Desync detected!",
            isSynced: overallSynced,
            data: results
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * NEW: Force synchronize account balance to match transaction history
 */
app.post("/api/audit/repair-sync", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    let connection;
    try {
        const { masterPassword } = req.body;

        // 1. Verify Master Password
        const [masterPwdRow] = await db.query("SELECT value FROM settings WHERE `key` = 'master_password'");
        const storedMasterPassword = masterPwdRow.length > 0 ? masterPwdRow[0].value : '123456';
        let isPasswordValid = false;
        
        const isStoredPassHashed = storedMasterPassword.startsWith('$2a$') || storedMasterPassword.startsWith('$2b$') || storedMasterPassword.startsWith('$2y$');
        if (isStoredPassHashed) {
            isPasswordValid = await bcrypt.compare(masterPassword, storedMasterPassword);
        } else {
            isPasswordValid = (masterPassword === storedMasterPassword);
        }

        if (!isPasswordValid) {
            return res.status(403).json({ error: "Master password salah!" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [accounts] = await connection.query("SELECT id, name, balance FROM accounts");
        const fixes = [];

        for (const acc of accounts) {
            const [at] = await connection.query(
                "SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as total FROM account_transactions WHERE account_id = ?",
                [acc.id]
            );
            const sumTransactions = parseFloat(at[0].total || 0);
            
            if (Math.abs(parseFloat(acc.balance) - sumTransactions) > 0.01) {
                await connection.query("UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [sumTransactions, acc.id]);
                fixes.push({ name: acc.name, from: acc.balance, to: sumTransactions });
            }
        }

        await connection.commit();
        await logActivity(req.user.userId, 'Repair Sync', 'system', 0, `Sinkronisasi saldo dilakukan untuk ${fixes.length} akun.`);

        res.json({
            message: "Sinkronisasi saldo berhasil!",
            fixes
        });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Process Tutup Buku
app.post("/api/settings/close-book", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const { masterPassword, notes, initialCapitalNextDay } = req.body;
    let connection;

    try {
        // 1. Verify Master Password
        const [masterPwdRow] = await db.query("SELECT value FROM settings WHERE `key` = 'master_password'");
        const storedMasterPassword = masterPwdRow.length > 0 ? masterPwdRow[0].value : '123456';

        let isPasswordValid = false;
        const isStoredPassHashed = storedMasterPassword.startsWith('$2a$') || storedMasterPassword.startsWith('$2b$') || storedMasterPassword.startsWith('$2y$');

        if (isStoredPassHashed) {
            isPasswordValid = await bcrypt.compare(masterPassword, storedMasterPassword);
        } else {
            isPasswordValid = (masterPassword === storedMasterPassword);
        }

        if (!isPasswordValid) {
            return res.status(403).json({ error: "Master password salah!" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 2. Calculate summary for the closing session (Active data only)
        const [salesRow] = await connection.query("SELECT SUM(total) as total FROM transactions WHERE closing_session_id IS NULL AND deleted_at IS NULL");
        const totalSales = parseFloat(salesRow[0].total || 0);

        const [expensesRow] = await connection.query("SELECT SUM(amount) as total FROM expenses WHERE closing_session_id IS NULL");
        const totalExpenses = parseFloat(expensesRow[0].total || 0);

        const [lapakAccount] = await connection.query("SELECT id, balance FROM accounts WHERE name = 'lapak_deposit'");
        const [ownerAccount] = await connection.query("SELECT id, balance FROM accounts WHERE name = 'owner_deposit'");

        const lapakBalance = lapakAccount.length > 0 ? parseFloat(lapakAccount[0].balance) : 0;
        const ownerBalance = ownerAccount.length > 0 ? parseFloat(ownerAccount[0].balance) : 0;

        // 3. Create Closing Session Record
        const insertSessionSql = `
            INSERT INTO closing_sessions 
            (closed_by_user_id, total_sales, total_expenses, total_profit, lapak_balance_at_closing, owner_balance_at_closing, initial_capital_next_day, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [sessionResult] = await connection.query(insertSessionSql, [
            req.user.userId,
            totalSales,
            totalExpenses,
            totalSales - totalExpenses,
            lapakBalance,
            ownerBalance,
            parseFloat(initialCapitalNextDay || 0),
            notes || ''
        ]);
        const sessionId = sessionResult.insertId;

        // 4. Archive all active data
        const tablesToArchive = [
            'transactions',
            'orders',
            'expenses',
            'account_transactions',
            'simple_transactions',
            'simple_transaction_items',
            'cash_reconciliations',
            'employee_credits',
            'raw_material_stock_history'
        ];

        for (const tableName of tablesToArchive) {
            await connection.query(`UPDATE ${tableName} SET closing_session_id = ? WHERE closing_session_id IS NULL`, [sessionId]);
        }

        // 5. Reset Accounts & Set Initial Capital
        if (lapakAccount.length > 0) {
            // First, clear the previous session balance history (Withdrawal transaction for old balance)
            await connection.query(
                "INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, closing_session_id) VALUES (?, ?, ?, ?, ?, ?)",
                [lapakAccount[0].id, 'withdrawal', parseFloat(lapakAccount[0].balance), 'Kliring Saldo Lama Pasca Tutup Buku', req.user.userId, sessionId]
            );

            // Reset balance to the new initial capital in accounts table
            await connection.query("UPDATE accounts SET balance = ? WHERE id = ?", [parseFloat(initialCapitalNextDay || 0), lapakAccount[0].id]);

            // Record this as the first transaction of the new session (Deposit transaction with NULL sessionId)
            await connection.query(
                "INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, closing_session_id) VALUES (?, ?, ?, ?, ?, NULL)",
                [lapakAccount[0].id, 'deposit', parseFloat(initialCapitalNextDay || 0), 'Modal Awal Pasca Tutup Buku', req.user.userId]
            );
        }

        if (ownerAccount.length > 0) {
            // Catat transaksi clearing agar history balance tetap sinkron dan TERARSIP ke sesi lama
            // Kita gunakan sessionId (bukan NULL) agar transaksi ini tidak muncul di periode baru
            await connection.query(
                "INSERT INTO account_transactions (account_id, type, amount, description, created_by_user_id, closing_session_id) VALUES (?, ?, ?, ?, ?, ?)",
                [ownerAccount[0].id, 'withdrawal', parseFloat(ownerAccount[0].balance), 'Reset Saldo Owner Pasca Tutup Buku', req.user.userId, sessionId]
            );

            // Reset balance Uang Transfer (Owner) ke 0 di database
            await connection.query("UPDATE accounts SET balance = 0 WHERE id = ?", [ownerAccount[0].id]);
        }

        // 6. Update initial_capital & initial_capital_date in settings
        //    sehingga laporan audit periode berikutnya menggunakan modal awal yang benar
        const newCapitalStr = String(parseFloat(initialCapitalNextDay || 0));
        const nowStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T');

        await connection.query(
            "INSERT INTO settings (`key`, `value`) VALUES ('initial_capital', ?) ON DUPLICATE KEY UPDATE `value` = ?",
            [newCapitalStr, newCapitalStr]
        );
        await connection.query(
            "INSERT INTO settings (`key`, `value`) VALUES ('initial_capital_date', ?) ON DUPLICATE KEY UPDATE `value` = ?",
            [nowStr, nowStr]
        );

        // Update last_closing_date in settings
        await connection.query("INSERT INTO settings (`key`, `value`) VALUES ('last_closing_date', ?) ON DUPLICATE KEY UPDATE `value` = ?", [nowStr, nowStr]);

        await connection.commit();
        await logActivity(req.user.userId, 'Tutup Buku', 'closing_session', sessionId, `Tutup buku berhasil. Sesi #${sessionId}. Omzet: Rp ${totalSales.toLocaleString('id-ID')}`);

        res.json({ message: "Tutup buku berhasil!", sessionId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error in Tutup Buku:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Get all closing sessions (Archive List)
app.get("/api/archive/sessions", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT cs.*, u.username as closed_by_username 
            FROM closing_sessions cs
            LEFT JOIN users u ON cs.closed_by_user_id = u.id
            ORDER BY cs.timestamp DESC
        `);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get detail of a specific session summary
app.get("/api/archive/sessions/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT cs.*, u.username as closed_by_username 
            FROM closing_sessions cs
            LEFT JOIN users u ON cs.closed_by_user_id = u.id
            WHERE cs.id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ error: "Sesi arsip tidak ditemukan" });
        res.json({ message: "success", data: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get archived records by type and session
app.get("/api/archive/sessions/:id/data/:type", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const { id, type } = req.params;
    try {
        let sql = "";
        switch (type) {
            case 'transactions':
                sql = "SELECT t.*, u.username as cashier_name FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE t.closing_session_id = ? ORDER BY t.timestamp DESC";
                break;
            case 'expenses':
                sql = "SELECT e.*, u.username as recorded_by FROM expenses e LEFT JOIN users u ON e.user_id = u.id WHERE e.closing_session_id = ? ORDER BY e.date DESC";
                break;
            case 'orders':
                sql = "SELECT * FROM orders WHERE closing_session_id = ? ORDER BY created_at DESC";
                break;
            case 'account_transactions':
                sql = "SELECT at.*, u.username as created_by_username FROM account_transactions at JOIN users u ON at.created_by_user_id = u.id WHERE at.closing_session_id = ? ORDER BY at.created_at DESC";
                break;
            case 'credits':
                sql = "SELECT * FROM employee_credits WHERE closing_session_id = ? ORDER BY credit_date DESC";
                break;
            default:
                return res.status(400).json({ error: "Tipe data arsip tidak valid" });
        }

        const [rows] = await db.query(sql, [id]);
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Preview jumlah data yang akan di-restore (GET)
app.get("/api/archive/sessions/:id/restore/preview", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    try {
        const buildDateFilter = (dateCol) => {
            if (startDate && endDate) return ` AND DATE(\`${dateCol}\`) BETWEEN ? AND ?`;
            if (startDate) return ` AND DATE(\`${dateCol}\`) >= ?`;
            if (endDate) return ` AND DATE(\`${dateCol}\`) <= ?`;
            return '';
        };
        const dateParams = [];
        if (startDate) dateParams.push(startDate);
        if (endDate) dateParams.push(endDate);

        const countTable = async (table, dateCol) => {
            const filter = buildDateFilter(dateCol);
            const sql = `SELECT COUNT(*) as total FROM ${table} WHERE closing_session_id = ?${filter}`;
            const [rows] = await db.query(sql, [id, ...dateParams]);
            return rows[0].total;
        };

        const [transactions, expenses, orders, account_transactions, credits] = await Promise.all([
            countTable('transactions', 'timestamp'),
            countTable('expenses', 'date'),
            countTable('orders', 'created_at'),
            countTable('account_transactions', 'created_at'),
            countTable('employee_credits', 'credit_date'),
        ]);

        const total = transactions + expenses + orders + account_transactions + credits;

        res.json({
            message: "success",
            data: { transactions, expenses, orders, account_transactions, credits, total }
        });
    } catch (err) {
        console.error("Error restore preview:", err);
        res.status(500).json({ error: err.message });
    }
});

// Eksekusi Restore (POST) - kembalikan data arsip ke live
app.post("/api/archive/sessions/:id/restore", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.body;
    let connection;

    try {
        const buildDateFilter = (dateCol) => {
            if (startDate && endDate) return ` AND DATE(\`${dateCol}\`) BETWEEN ? AND ?`;
            if (startDate) return ` AND DATE(\`${dateCol}\`) >= ?`;
            if (endDate) return ` AND DATE(\`${dateCol}\`) <= ?`;
            return '';
        };
        const dateParams = [];
        if (startDate) dateParams.push(startDate);
        if (endDate) dateParams.push(endDate);

        // Validasi sesi ada
        const [sessionRows] = await db.query("SELECT id FROM closing_sessions WHERE id = ?", [id]);
        if (sessionRows.length === 0) {
            return res.status(404).json({ error: "Sesi arsip tidak ditemukan" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Tabel dan kolom tanggalnya
        const tables = [
            { table: 'transactions', dateCol: 'timestamp' },
            { table: 'expenses', dateCol: 'date' },
            { table: 'orders', dateCol: 'created_at' },
            { table: 'account_transactions', dateCol: 'created_at' },
            { table: 'simple_transactions', dateCol: 'created_at' },
            { table: 'employee_credits', dateCol: 'credit_date' },
            { table: 'cash_reconciliations', dateCol: 'created_at' },
        ];

        let totalRestored = 0;
        const detail = {};

        for (const { table, dateCol } of tables) {
            const filter = buildDateFilter(dateCol);
            const sql = `UPDATE ${table} SET closing_session_id = NULL WHERE closing_session_id = ?${filter}`;
            const [result] = await connection.query(sql, [id, ...dateParams]);
            detail[table] = result.affectedRows;
            totalRestored += result.affectedRows;
        }

        // Jika semua data pada sesi ini sudah di-restore, hapus sesi closing-nya
        const [remaining] = await connection.query(
            "SELECT COUNT(*) as cnt FROM transactions WHERE closing_session_id = ?",
            [id]
        );
        if (remaining[0].cnt === 0 && !startDate && !endDate) {
            await connection.query("DELETE FROM closing_sessions WHERE id = ?", [id]);
        }

        // ── Recalculate account balances ──────────────────────────────────
        // Setelah account_transactions di-restore (closing_session_id = NULL),
        // hitung ulang balance setiap akun dari semua transaksinya agar
        // card "Saldo Lapak" & "Saldo Owner" menampilkan nilai yang benar.
        const [accountBalances] = await connection.query(`
            SELECT
                account_id,
                SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) AS calculated_balance
            FROM account_transactions
            GROUP BY account_id
        `);
        for (const row of accountBalances) {
            await connection.query(
                "UPDATE accounts SET balance = ? WHERE id = ?",
                [parseFloat(row.calculated_balance) || 0, row.account_id]
            );
        }
        // ─────────────────────────────────────────────────────────────────

        await connection.commit();


        const filterDesc = startDate || endDate
            ? ` (filter: ${startDate || '?'} s/d ${endDate || '?'})`
            : ' (semua data)';
        await logActivity(req.user.userId, 'Restore Arsip', 'closing_session', id,
            `Restore sesi #${id}${filterDesc}. Total: ${totalRestored} record.`);

        res.json({
            message: `Berhasil merestore ${totalRestored} data dari sesi #${id}`,
            data: { restored: totalRestored, detail }
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error restore archive:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Hapus permanen satu sesi arsip beserta semua datanya
app.delete("/api/archive/sessions/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        const [sessionRows] = await db.query("SELECT id FROM closing_sessions WHERE id = ?", [id]);
        if (sessionRows.length === 0) {
            return res.status(404).json({ error: "Sesi arsip tidak ditemukan" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Hapus semua record di tabel yang berelasi dengan sesi ini
        const tables = [
            'raw_material_stock_history',
            'cash_reconciliations',
            'simple_transaction_items',
            'simple_transactions',
            'employee_credits',
            'account_transactions',
            'expenses',
            'orders',
            'transactions',
        ];

        let totalDeleted = 0;
        for (const table of tables) {
            const [result] = await connection.query(
                `DELETE FROM ${table} WHERE closing_session_id = ?`, [id]
            );
            totalDeleted += result.affectedRows;
        }

        // Hapus record closing_sessions itu sendiri
        await connection.query("DELETE FROM closing_sessions WHERE id = ?", [id]);

        await connection.commit();
        await logActivity(req.user.userId, 'Hapus Arsip', 'closing_session', id,
            `Sesi arsip #${id} dihapus permanen. Total data dihapus: ${totalDeleted} record.`);

        res.json({
            message: `Sesi arsip #${id} berhasil dihapus permanen`,
            data: { deleted: totalDeleted }
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error delete archive session:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// --- HPP INGREDIENTS API ---
app.get("/api/hpp-ingredients", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hpp_ingredients ORDER BY name ASC');
        res.json({ message: "success", data: rows });
    } catch (err) {
        console.error("Error fetching hpp ingredients:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/api/hpp-ingredients", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Nama bahan diperlukan" });
        }
        
        const [result] = await db.query('INSERT INTO hpp_ingredients (name) VALUES (?)', [name]);
        res.json({ message: "success", data: { id: result.insertId, name } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Bahan dengan nama ini sudah ada" });
        }
        console.error("Error creating hpp ingredient:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/api/hpp-ingredients/:id", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM hpp_ingredients WHERE id = ?', [id]);
        res.json({ message: "success" });
    } catch (err) {
        console.error("Error deleting hpp ingredient:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// --- HPP Report Endpoint ---
app.get("/api/reports/hpp", authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilterOrders = "";
        let dateFilterTrans = "";
        const queryParams = [];

        if (startDate && endDate) {
            dateFilterOrders = " AND DATE(created_at) BETWEEN ? AND ?";
            dateFilterTrans = " AND DATE(timestamp) BETWEEN ? AND ?";
            queryParams.push(startDate, endDate);
        } else if (startDate) {
            dateFilterOrders = " AND DATE(created_at) >= ?";
            dateFilterTrans = " AND DATE(timestamp) >= ?";
            queryParams.push(startDate);
        } else if (endDate) {
            dateFilterOrders = " AND DATE(created_at) <= ?";
            dateFilterTrans = " AND DATE(timestamp) <= ?";
            queryParams.push(endDate);
        }

        // Fetch Completed Orders
        const ordersSql = `SELECT items, promo_discount FROM orders WHERE status = 'completed' AND deleted_at IS NULL ${dateFilterOrders}`;
        const [ordersRows] = await db.query(ordersSql, queryParams);

        // Fetch POS Transactions (Assuming all in 'transactions' table are completed)
        const transSql = `SELECT items, manual_discount, promo_discount FROM transactions WHERE deleted_at IS NULL ${dateFilterTrans}`;
        const [transRows] = await db.query(transSql, queryParams);

        let totalRevenue = 0;
        let totalHpp = 0;
        let netProfit = 0;
        const itemBreakdown = {};
        const globalIngredients = {};

        const processItems = (itemsJson, totalDiscount = 0) => {
            if (!itemsJson) return;
            let items = [];
            try {
                items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            } catch (e) { return; }

            // Hitung total kotor untuk menentukan proporsi diskon
            let totalSubtotal = 0;
            items.forEach(item => {
                const qty = parseInt(item.quantity) || 0;
                let itemRev = parseFloat(item.subtotal) || 0;
                if (!itemRev && item.price) {
                     itemRev = parseFloat(item.price) * qty;
                }
                totalSubtotal += itemRev;
            });

            const discountToApply = parseFloat(totalDiscount) || 0;

            items.forEach(item => {
                const qty = parseInt(item.quantity) || 0;
                const hpp = parseFloat(item.hpp) || 0;
                
                // For subtotal, we use item.subtotal (from orders) or calculate it (from POS transactions)
                let itemRevenue = parseFloat(item.subtotal) || 0;
                if (!itemRevenue && item.price) {
                     itemRevenue = parseFloat(item.price) * qty;
                }

                // Terapkan diskon secara proporsional ke item ini
                if (discountToApply > 0 && totalSubtotal > 0) {
                    const proportion = itemRevenue / totalSubtotal;
                    itemRevenue = Math.max(0, itemRevenue - (discountToApply * proportion));
                }

                const itemTotalHpp = hpp * qty;
                const itemProfit = itemRevenue - itemTotalHpp;

                totalRevenue += itemRevenue;
                totalHpp += itemTotalHpp;
                netProfit += itemProfit;

                if (!itemBreakdown[item.id]) {
                    itemBreakdown[item.id] = {
                        id: item.id,
                        name: item.name || 'Unknown',
                        quantitySold: 0,
                        totalRevenue: 0,
                        totalHpp: 0,
                        netProfit: 0,
                        components: {} // untuk breakdown detail komponen HPP
                    };
                }
                itemBreakdown[item.id].quantitySold += qty;
                itemBreakdown[item.id].totalRevenue += itemRevenue;
                itemBreakdown[item.id].totalHpp += itemTotalHpp;
                itemBreakdown[item.id].netProfit += itemProfit;

                // Akumulasi komponen HPP per menu item
                if (item.hpp_details && Array.isArray(item.hpp_details)) {
                    item.hpp_details.forEach(comp => {
                        const compName = comp.name || 'Lainnya';
                        const compCost = parseFloat(comp.cost) || 0;
                        const totalCompCost = compCost * qty;

                        // Per menu
                        if (!itemBreakdown[item.id].components[compName]) {
                            itemBreakdown[item.id].components[compName] = 0;
                        }
                        itemBreakdown[item.id].components[compName] += totalCompCost;

                        // Global (Lintas Menu)
                        if (!globalIngredients[compName]) {
                            globalIngredients[compName] = {
                                name: compName,
                                totalCost: 0,
                                usedInMenus: new Set()
                            };
                        }
                        globalIngredients[compName].totalCost += totalCompCost;
                        if (qty > 0) {
                            globalIngredients[compName].usedInMenus.add(item.name);
                        }
                    });
                }
            });
        };

        ordersRows.forEach(row => {
            const totalDisc = parseFloat(row.promo_discount) || 0;
            processItems(row.items, totalDisc);
        });
        transRows.forEach(row => {
            const totalDisc = (parseFloat(row.manual_discount) || 0) + (parseFloat(row.promo_discount) || 0);
            processItems(row.items, totalDisc);
        });

        // Convert components object to array for easier frontend use
        const breakdownArray = Object.values(itemBreakdown).sort((a, b) => b.quantitySold - a.quantitySold).map(item => ({
            ...item,
            components: Object.entries(item.components).map(([name, totalCost]) => ({ name, totalCost }))
        }));

        const globalIngredientsArray = Object.values(globalIngredients)
            .sort((a, b) => b.totalCost - a.totalCost)
            .map(ing => ({
                name: ing.name,
                totalCost: ing.totalCost,
                usedInMenus: Array.from(ing.usedInMenus)
            }));

        res.json({
            message: "success",
            data: {
                summary: {
                    totalRevenue,
                    totalHpp,
                    netProfit
                },
                breakdown: breakdownArray,
                globalIngredients: globalIngredientsArray
            }
        });

    } catch (err) {
        console.error("Error fetching HPP report:", err);
        res.status(500).json({ error: err.message });
    }
});

// Default response for any other request
app.use(function (req, res) {
    res.status(404).send();
});
