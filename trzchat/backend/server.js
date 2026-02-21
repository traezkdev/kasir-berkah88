const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { initDB, pool } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5000;

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-chat', (chatId) => {
        const roomName = `chat_${chatId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id} (Reason: ${reason})`);
    });
});

// Initialize Database
initDB();

app.use(cors());
app.use(express.json());

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, fullName, phone } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, fullName, phone]
        );
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Server error' });
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

// Get User's Chats
app.get('/api/chats', authenticateToken, async (req, res) => {
    try {
        // Query to get chats where the user is a participant
        // For private chats, we also want the other participant's info
        const query = `
            SELECT c.*, 
            JSON_OBJECT('id', u.id, 'name', u.full_name, 'avatar', u.avatar, 'online', u.status) as otherUser
            FROM chats c
            JOIN chat_participants cp1 ON c.id = cp1.chat_id
            JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id != cp1.user_id
            JOIN users u ON cp2.user_id = u.id
            WHERE cp1.user_id = ?
            ORDER BY c.last_message_time DESC
        `;
        const [rows] = await pool.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
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

app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    try {
        const [messages] = await pool.query(
            'SELECT m.*, IF(m.sender_id = ?, "me", "them") as sender FROM messages m WHERE m.chat_id = ? ORDER BY m.created_at DESC',
            [req.user.id, chatId]
        );
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { chatId, text } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)',
            [chatId, req.user.id, text]
        );

        // Update last message in chat
        await pool.query(
            'UPDATE chats SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?',
            [text, chatId]
        );

        // Emit real-time message to the room
        io.to(`chat_${chatId}`).emit('new-message', {
            id: result.insertId,
            chat_id: chatId,
            text,
            sender_id: req.user.id,
            created_at: new Date().toISOString(),
            sender: 'them' // For other users it will be 'them'
        });

        res.status(201).json({ id: result.insertId, text, sender: 'me' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

server.listen(PORT, () => {
    console.log(`Server TrzChat running on port ${PORT}`);
});
