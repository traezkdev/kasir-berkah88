require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback';

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Register
app.post('/api/register', async (req, res) => {
    const { username, password, nama_lengkap, role, nisn_nik, email, wa_number } = req.body;

    // Proteksi: Larang pendaftaran Admin secara publik
    if (role === 'admin') {
        return res.status(403).json({ error: "Pendaftaran Admin tidak diizinkan melalui jalur ini." });
    }

    try {
        if (!username || !password || !role) {
            return res.status(400).json({ error: "Username, password, and role are required" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (username, password, nama_lengkap, role, nisn_nik, email, wa_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(sql, [username, hashedPassword, nama_lengkap, role, nisn_nik, email, wa_number]);

        res.status(201).json({ message: "Registration successful" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Username already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid username, role, or password" });
        }

        const user = rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                nama_lengkap: user.nama_lengkap,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 3. Simple Auth Check (Middleware example)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, nama_lengkap, role FROM users WHERE id = ?', [req.user.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// --- ADMIN MANAGEMENT ROUTES ---

// Middleware: Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Akses ditolak. Anda bukan Admin." });
    }
};

// Get Users by Role (Siswa, Guru, etc)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.query;
        let sql = 'SELECT id, username, nama_lengkap, role, nisn_nik, email, wa_number, created_at FROM users';
        let params = [];

        if (role) {
            sql += ' WHERE role = ?';
            params.push(role);
        }

        sql += ' ORDER BY created_at DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengambil data user." });
    }
});

// Delete User
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: "User berhasil dihapus." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal menghapus user." });
    }
});

// Update User
app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_lengkap, nisn_nik, email, wa_number, role } = req.body;

        const sql = `
            UPDATE users 
            SET nama_lengkap = ?, nisn_nik = ?, email = ?, wa_number = ?, role = ?
            WHERE id = ?
        `;
        await db.query(sql, [nama_lengkap, nisn_nik, email, wa_number, role, id]);
        res.json({ message: "Data user berhasil diperbarui." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal memperbarui data user." });
    }
});

app.listen(PORT, () => {
    console.log(`SIAS PRO Backend running on http://localhost:${PORT}`);
});
