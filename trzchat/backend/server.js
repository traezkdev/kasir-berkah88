const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { initDB, pool } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true
});
const PORT = process.env.PORT || 5000;

// Helper function for URLs
const getBaseUrl = (req) => {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    return `${protocol}://${req.get('host')}`;
};

// Socket.io Middleware for Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        console.error(`Socket Auth Error: No token provided from ${socket.id}`);
        return next(new Error('Authentication error: No token provided'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error(`Socket Auth Error: Invalid token from ${socket.id}`, err.message);
            return next(new Error('Authentication error: Invalid token'));
        }
        socket.userId = decoded.id;
        next();
    });
});

const onlineUsers = new Map(); // userId -> Set of socketIds

// Socket.io Logic
io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Track user sockets
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
        // First connection for this user - set to online
        try {
            await pool.query('UPDATE users SET status = "online" WHERE id = ?', [userId]);
            io.emit('user-status-changed', { userId, status: 'online' });
        } catch (error) {
            console.error('Error updating user status to online:', error);
        }
    }
    onlineUsers.get(userId).add(socket.id);

    socket.on('join-chat', (chatId) => {
        const roomName = `chat_${chatId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on('mark-as-read', async ({ chatId }) => {
        try {
            // Update semua pesan di chat ini yang dikirim oleh orang lain (sender_id != userId)
            // dan yang statusnya belum 'read'
            await pool.query(
                'UPDATE messages SET status = "read" WHERE chat_id = ? AND sender_id != ? AND status != "read"',
                [chatId, userId]
            );

            // Selalu beritahu semua orang di room ini bahwa pesan telah dibaca (Force Sync)
            io.to(`chat_${chatId}`).emit('messages-read', {
                chatId: String(chatId),
                readerId: userId
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });

    socket.on('message-delivered', async ({ messageId, chatId }) => {
        try {
            await pool.query(
                'UPDATE messages SET status = "delivered" WHERE id = ? AND status = "sent"',
                [messageId]
            );
            io.to(`chat_${chatId}`).emit('message-status-updated', { messageId, status: 'delivered', chatId: String(chatId) });
        } catch (error) {
            console.error('Error marking message as delivered:', error);
        }
    });

    socket.on('error', (err) => {
        console.error(`Socket ${socket.id} error:`, err);
    });

    socket.on('disconnect', async (reason) => {
        console.log(`Socket ${socket.id} disconnected (Reason: ${reason})`);

        if (onlineUsers.has(userId)) {
            onlineUsers.get(userId).delete(socket.id);
            if (onlineUsers.get(userId).size === 0) {
                onlineUsers.delete(userId);
                // No more active sockets for this user - set to offline
                try {
                    await pool.query('UPDATE users SET status = "offline", last_seen = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
                    io.emit('user-status-changed', { userId, status: 'offline', last_seen: new Date().toISOString() });
                } catch (error) {
                    console.error('Error updating user status to offline:', error);
                }
            }
        }
    });
});

// Initialize Database
initDB();

// Ensure uploads directories exist
const uploadDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const audioUploadDir = path.join(__dirname, 'uploads/audio');
if (!fs.existsSync(audioUploadDir)) {
    fs.mkdirSync(audioUploadDir, { recursive: true });
}
const imageUploadDir = path.join(__dirname, 'uploads/images');
if (!fs.existsSync(imageUploadDir)) {
    fs.mkdirSync(imageUploadDir, { recursive: true });
}
const videoUploadDir = path.join(__dirname, 'uploads/videos');
if (!fs.existsSync(videoUploadDir)) {
    fs.mkdirSync(videoUploadDir, { recursive: true });
}
const fileUploadDir = path.join(__dirname, 'uploads/files');
if (!fs.existsSync(fileUploadDir)) {
    fs.mkdirSync(fileUploadDir, { recursive: true });
}

// Multer Storage Configuration - Avatar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Hanya file gambar (jpg, png, webp) yang diperbolehkan!'));
    }
});

// Multer Storage Configuration - Audio
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/audio');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'audio-' + uniqueSuffix + '.m4a');
    }
});

const uploadAudio = multer({
    storage: audioStorage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = /audio\/|video\/mp4|application\/octet-stream/;
        if (allowedMimes.test(file.mimetype)) return cb(null, true);
        const extname = /\.m4a$|\.mp3$|\.aac$|\.wav$|\.ogg$|\.webm$/i.test(file.originalname);
        if (extname) return cb(null, true);
        cb(new Error('Hanya file audio yang diperbolehkan!'));
    }
});

// Multer Storage Configuration - Images
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Hanya file gambar yang diperbolehkan!'));
    }
});

// Multer Storage Configuration - Videos
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/videos');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'vid-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /mp4|mov|avi|mkv|webm/;
        const mimetype = filetypes.test(file.mimetype) || file.mimetype.startsWith('video/');
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Hanya file video yang diperbolehkan!'));
    }
});

// Multer Storage Configuration - Documents
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/files');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadFile = multer({
    storage: fileStorage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
    console.log('--- Register Request Received ---');
    console.log('Data:', req.body);
    const { username, email, password, fullName, phone } = req.body;

    if (!username || !email || !password || !fullName) {
        console.log('Register Failed: Missing required fields');
        return res.status(400).json({ message: 'Data pendaftaran tidak lengkap' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, fullName, phone || null]
        );
        console.log('Register Success for:', username);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration Database Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            const isEmail = error.message.toLowerCase().includes('email');
            return res.status(400).json({
                message: isEmail ? 'Email sudah terdaftar gunakan email lain' : 'Username sudah digunakan pilih yang lain'
            });
        }
        res.status(500).json({ message: 'Terjadi kesalahan sistem coba lagi nanti' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { identity, password } = req.body; // identity can be username or email
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [identity, identity]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username, fullName: user.full_name, avatar: user.avatar, phone: user.phone } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Middleware for JWT Verification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// User Search
app.get('/api/users/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    try {
        const [users] = await pool.query(
            'SELECT id, username, full_name, avatar FROM users WHERE (username LIKE ? OR full_name LIKE ?) AND id != ? LIMIT 10',
            [`%${q}%`, `%${q}%`, req.user.id]
        );
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Current User Profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, full_name, avatar, phone, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update User Profile
app.post('/api/users/profile', authenticateToken, async (req, res) => {
    const { fullName, phone, avatar, username, email } = req.body;
    try {
        await pool.query(
            'UPDATE users SET full_name = ?, phone = ?, avatar = ?, username = ?, email = ? WHERE id = ?',
            [fullName, phone, avatar, username, email, req.user.id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username atau Email sudah digunakan' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload Avatar
app.post('/api/users/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
        }

        const avatarUrl = `${getBaseUrl(req)}/uploads/avatars/${req.file.filename}`;

        // Update database
        await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);

        res.json({
            message: 'Foto profil berhasil diperbarui',
            avatarUrl: avatarUrl
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Gagal mengunggah foto profil' });
    }
});

// Get User's Chats
app.get('/api/chats', authenticateToken, async (req, res) => {
    try {
        // Query to get chats where the user is a participant
        // For private chats, we also want the other participant's info
        const query = `
            SELECT c.*, 
            JSON_OBJECT('id', u.id, 'name', u.full_name, 'avatar', u.avatar, 'online', u.status) as otherUser,
            (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != ? AND m.status != 'read') as unread_count
            FROM chats c
            JOIN chat_participants cp1 ON c.id = cp1.chat_id
            JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id != cp1.user_id
            JOIN users u ON cp2.user_id = u.id
            WHERE cp1.user_id = ?
            GROUP BY c.id
            ORDER BY c.last_message_time DESC
        `;
        const [rows] = await pool.query(query, [req.user.id, req.user.id]);

        // Ensure otherUser is parsed as an object (JSON_OBJECT can return a string in some MySQL versions/drivers)
        const processedRows = rows.map(row => {
            if (typeof row.otherUser === 'string') {
                try {
                    row.otherUser = JSON.parse(row.otherUser);
                } catch (e) { }
            }
            return row;
        });

        res.json(processedRows);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create or Get Private Chat
app.post('/api/chats', authenticateToken, async (req, res) => {
    const { userId } = req.body; // ID user yang ingin diajak chat
    try {
        // Check if private chat already exists
        const checkQuery = `
            SELECT cp1.chat_id 
            FROM chat_participants cp1
            JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
            JOIN chats c ON cp1.chat_id = c.id
            WHERE cp1.user_id = ? AND cp2.user_id = ? AND c.type = 'private'
        `;
        const [existing] = await pool.query(checkQuery, [req.user.id, userId]);

        if (existing.length > 0) {
            return res.json({ chatId: existing[0].chat_id });
        }

        // Create new chat
        const [chatResult] = await pool.query('INSERT INTO chats (type) VALUES ("private")');
        const chatId = chatResult.insertId;

        // Add participants
        await pool.query('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?), (?, ?)',
            [chatId, req.user.id, chatId, userId]);

        res.status(201).json({ chatId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Chat (Hapus Percakapan)
app.delete('/api/chats/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Hapus partisipan saat ini
        await pool.query('DELETE FROM chat_participants WHERE chat_id = ? AND user_id = ?', [id, req.user.id]);

        // Opsional: Jika tidak ada peserta lagi, hapus chat dan pesannya
        const [remaining] = await pool.query('SELECT COUNT(*) as count FROM chat_participants WHERE chat_id = ?', [id]);
        if (remaining[0].count === 0) {
            await pool.query('DELETE FROM messages WHERE chat_id = ?', [id]);
            await pool.query('DELETE FROM chats WHERE id = ?', [id]);
        }

        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        const query = `
            SELECT m.*, 
            IF(m.sender_id = ?, "me", "them") as sender,
            rm.text as reply_text,
            ru.full_name as reply_user
            FROM messages m 
            LEFT JOIN messages rm ON m.reply_to = rm.id
            LEFT JOIN users ru ON rm.sender_id = ru.id
            WHERE m.chat_id = ? 
            AND m.id NOT IN (SELECT message_id FROM message_visibility WHERE user_id = ?)
            ORDER BY m.created_at DESC LIMIT ? OFFSET ?
        `;

        const [messages] = await pool.query(query, [req.user.id, chatId, req.user.id, limit, offset]);
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send Audio Message
app.post('/api/messages/audio', authenticateToken, uploadAudio.single('audio'), async (req, res) => {
    const { chatId, replyToId, duration } = req.body;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file audio yang dikirim' });
        }

        const audioUrl = `${getBaseUrl(req)}/uploads/audio/${req.file.filename}`;
        const audioLabel = `🎤 Pesan Suara${duration ? ` (${duration})` : ''}`;

        const [result] = await pool.query(
            'INSERT INTO messages (chat_id, sender_id, text, audio_url, type, reply_to) VALUES (?, ?, ?, ?, "audio", ?)',
            [chatId, req.user.id, audioLabel, audioUrl, replyToId || null]
        );

        // Update last message in chat
        await pool.query(
            'UPDATE chats SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?',
            [audioLabel, chatId]
        );

        const newMessage = {
            id: result.insertId,
            chat_id: chatId,
            text: audioLabel,
            audio_url: audioUrl,
            type: 'audio',
            reply_to: replyToId || null,
            reply_text: null,
            reply_user: null,
            sender_id: req.user.id,
            created_at: new Date().toISOString(),
            is_edited: false,
            is_deleted: false,
            status: 'sent'
        };

        // Emit real-time message to the room
        io.to(`chat_${chatId}`).emit('new-message', newMessage);

        res.status(201).json({ ...newMessage, sender: 'me' });
    } catch (error) {
        console.error('Error sending audio message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send Image Message
app.post('/api/messages/image', authenticateToken, uploadImage.single('image'), async (req, res) => {
    const { chatId, replyToId, text } = req.body;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file gambar yang dikirim' });
        }

        const imageUrl = `${getBaseUrl(req)}/uploads/images/${req.file.filename}`;
        const imageLabel = text || '📷 Foto';

        const { width, height } = req.body;
        const [result] = await pool.query(
            'INSERT INTO messages (chat_id, sender_id, text, image_url, width, height, type, reply_to) VALUES (?, ?, ?, ?, ?, ?, "image", ?)',
            [chatId, req.user.id, imageLabel, imageUrl, width || null, height || null, replyToId || null]
        );

        // Update last message in chat
        await pool.query(
            'UPDATE chats SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?',
            [imageLabel, chatId]
        );

        const newMessage = {
            id: result.insertId,
            chat_id: chatId,
            text: imageLabel,
            image_url: imageUrl,
            width: width || null,
            height: height || null,
            type: 'image',
            reply_to: replyToId || null,
            reply_text: null,
            reply_user: null,
            sender_id: req.user.id,
            created_at: new Date().toISOString(),
            is_edited: false,
            is_deleted: false,
            status: 'sent'
        };

        // Emit real-time message to the room
        io.to(`chat_${chatId}`).emit('new-message', newMessage);

        res.status(201).json({ ...newMessage, sender: 'me' });
    } catch (error) {
        console.error('Error sending image message:', error);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
});

// Send Video Message
app.post('/api/messages/video', authenticateToken, uploadVideo.single('video'), async (req, res) => {
    const { chatId, replyToId, text } = req.body;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file video yang dikirim' });
        }

        const videoUrl = `${getBaseUrl(req)}/uploads/videos/${req.file.filename}`;
        const videoLabel = text || '🎥 Video';

        const { width, height } = req.body;
        const [result] = await pool.query(
            'INSERT INTO messages (chat_id, sender_id, text, video_url, thumbnail_url, width, height, type, reply_to) VALUES (?, ?, ?, ?, ?, ?, ?, "video", ?)',
            [chatId, req.user.id, videoLabel, videoUrl, req.body.thumbnailUrl || null, width || null, height || null, replyToId || null]
        );

        // Update last message in chat
        await pool.query(
            'UPDATE chats SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?',
            [videoLabel, chatId]
        );

        const newMessage = {
            id: result.insertId,
            chat_id: chatId,
            text: videoLabel,
            video_url: videoUrl,
            thumbnail_url: req.body.thumbnailUrl || null,
            width: width || null,
            height: height || null,
            type: 'video',
            reply_to: replyToId || null,
            reply_text: null,
            reply_user: null,
            sender_id: req.user.id,
            created_at: new Date().toISOString(),
            is_edited: false,
            is_deleted: false,
            status: 'sent'
        };

        io.to(`chat_${chatId}`).emit('new-message', newMessage);
        res.status(201).json({ ...newMessage, sender: 'me' });
    } catch (error) {
        console.error('Error sending video message:', error);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
});

// Send Document/File Message
app.post('/api/messages/file', authenticateToken, uploadFile.single('file'), async (req, res) => {
    const { chatId, replyToId, text } = req.body;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file yang dikirim' });
        }

        const fileUrl = `${getBaseUrl(req)}/uploads/files/${req.file.filename}`;
        const fileName = req.file.originalname;
        const fileLabel = text || `📄 ${fileName}`;

        const [result] = await pool.query(
            'INSERT INTO messages (chat_id, sender_id, text, file_url, file_name, type, reply_to) VALUES (?, ?, ?, ?, ?, "file", ?)',
            [chatId, req.user.id, fileLabel, fileUrl, fileName, replyToId || null]
        );

        // Update last message in chat
        await pool.query(
            'UPDATE chats SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?',
            [fileLabel, chatId]
        );

        const newMessage = {
            id: result.insertId,
            chat_id: chatId,
            text: fileLabel,
            file_url: fileUrl,
            file_name: fileName,
            type: 'file',
            reply_to: replyToId || null,
            reply_text: null,
            reply_user: null,
            sender_id: req.user.id,
            created_at: new Date().toISOString(),
            is_edited: false,
            is_deleted: false,
            status: 'sent'
        };

        io.to(`chat_${chatId}`).emit('new-message', newMessage);
        res.status(201).json({ ...newMessage, sender: 'me' });
    } catch (error) {
        console.error('Error sending file message:', error);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { chatId, text, replyToId } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO messages (chat_id, sender_id, text, reply_to) VALUES (?, ?, ?, ?)',
            [chatId, req.user.id, text, replyToId || null]
        );

        // Get reply info if any
        let replyInfo = null;
        if (replyToId) {
            const [replied] = await pool.query(
                'SELECT m.text, u.full_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?',
                [replyToId]
            );
            if (replied.length > 0) {
                replyInfo = { text: replied[0].text, user: replied[0].full_name };
            }
        }

        // Update last message in chat
        await pool.query(
            'UPDATE chats SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?',
            [text, chatId]
        );

        const newMessage = {
            id: result.insertId,
            chat_id: chatId,
            text,
            reply_to: replyToId || null,
            reply_text: replyInfo?.text,
            reply_user: replyInfo?.user,
            sender_id: req.user.id,
            created_at: new Date().toISOString(),
            is_edited: false,
            is_deleted: false,
            status: 'sent'
        };

        // Emit real-time message to the room
        io.to(`chat_${chatId}`).emit('new-message', newMessage);

        res.status(201).json({ ...newMessage, sender: 'me' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Edit Message
app.put('/api/messages/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    try {
        const [msg] = await pool.query('SELECT * FROM messages WHERE id = ?', [id]);
        if (!msg.length || msg[0].sender_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized or not found' });
        }

        await pool.query('UPDATE messages SET text = ?, is_edited = TRUE WHERE id = ?', [text, id]);

        io.to(`chat_${msg[0].chat_id}`).emit('message-edited', { id, text, chatId: msg[0].chat_id });
        res.json({ message: 'Message edited' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Message
app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // 'pribadi' atau 'semua'

    try {
        const [msg] = await pool.query('SELECT * FROM messages WHERE id = ?', [id]);
        if (!msg.length) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (type === 'semua') {
            // Unsend / Hapus untuk semua orang (Hanya pengirim yang bisa)
            if (msg[0].sender_id !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            await pool.query('UPDATE messages SET is_deleted = TRUE, text = "Pesan ini telah dihapus" WHERE id = ?', [id]);
            io.to(`chat_${msg[0].chat_id}`).emit('message-deleted', { id, chatId: msg[0].chat_id });
        } else {
            // Hapus untuk saya (Semua orang bisa pada bubble masing-masing)
            await pool.query('INSERT IGNORE INTO message_visibility (user_id, message_id) VALUES (?, ?)', [req.user.id, id]);
        }

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

server.listen(PORT, () => {
    console.log(`Server TrzChat running on port ${PORT}`);
});
