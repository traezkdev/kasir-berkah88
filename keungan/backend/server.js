import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool, { initDB } from './database.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Inisialisasi Database
initDB();

// --- AUTH ROUTES ---

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );
        
        res.status(201).json({ message: "User berhasil didaftarkan", userId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: "Gagal mendaftar", error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        
        if (rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) return res.status(401).json({ message: "Password salah" });
        
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Seeding kategori default jika user belum punya kategori
        const [existingCats] = await pool.query("SELECT id FROM categories WHERE user_id = ? LIMIT 1", [user.id]);
        if (existingCats.length === 0) {
            const defaults = [
                ['Gaji', 'income'], ['Bonus', 'income'], ['Investasi', 'income'], ['Freelance', 'income'],
                ['Makan', 'expense'], ['Transport', 'expense'], ['Belanja', 'expense'],
                ['Tagihan', 'expense'], ['Hiburan', 'expense'], ['Kesehatan', 'expense']
            ];
            for (const [name, type] of defaults) {
                await pool.query("INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)", [user.id, name, type]);
            }
        }

        res.json({ 
            token, 
            user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } 
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal login", error: error.message });
    }
});

// --- CATEGORIES ROUTES ---

// GET all categories user
app.get('/api/categories', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM categories WHERE user_id = ? ORDER BY type ASC, name ASC",
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil kategori", error: error.message });
    }
});

// POST - Tambah kategori baru
app.post('/api/categories', authMiddleware, async (req, res) => {
    try {
        const { name, type } = req.body;
        if (!name || !type) return res.status(400).json({ message: "Nama dan tipe kategori wajib diisi" });
        const [result] = await pool.query(
            "INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)",
            [req.user.id, name, type]
        );
        const [newRow] = await pool.query("SELECT * FROM categories WHERE id = ?", [result.insertId]);
        res.status(201).json(newRow[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah kategori", error: error.message });
    }
});

// DELETE - Hapus kategori
app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
    try {
        const [check] = await pool.query("SELECT id FROM categories WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Kategori tidak ditemukan" });
        await pool.query("DELETE FROM categories WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        res.json({ message: "Kategori berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus kategori", error: error.message });
    }
});

// --- TRANSACTION ROUTES ---

app.get('/api/transactions', authMiddleware, async (req, res) => {
    try {
        // Hanya ambil data milik user yang sedang login
        const [rows] = await pool.query(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC", 
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data", error: error.message });
    }
});

app.post('/api/transactions', authMiddleware, async (req, res) => {
    try {
        const { date, type, category, amount, note } = req.body;
        const [result] = await pool.query(
            "INSERT INTO transactions (user_id, date, type, category, amount, note) VALUES (?, ?, ?, ?, ?, ?)",
            [req.user.id, date, type, category, amount, note]
        );
        const [newRow] = await pool.query("SELECT * FROM transactions WHERE id = ?", [result.insertId]);
        res.status(201).json(newRow[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal mencatat transaksi", error: error.message });
    }
});

// UPDATE Transaksi
app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
    try {
        const { date, type, category, amount, note } = req.body;
        const [check] = await pool.query("SELECT id FROM transactions WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Transaksi tidak ditemukan" });

        await pool.query(
            "UPDATE transactions SET date = ?, type = ?, category = ?, amount = ?, note = ? WHERE id = ? AND user_id = ?",
            [date, type, category, amount, note, req.params.id, req.user.id]
        );
        const [updated] = await pool.query("SELECT * FROM transactions WHERE id = ?", [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengupdate transaksi", error: error.message });
    }
});

// DELETE Transaksi
app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
    try {
        const [check] = await pool.query("SELECT id FROM transactions WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Transaksi tidak ditemukan" });

        await pool.query("DELETE FROM transactions WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        res.json({ message: "Transaksi berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus transaksi", error: error.message });
    }
});

// --- DEBTS ROUTES ---

// GET semua utang/piutang user
app.get('/api/debts', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM debts WHERE user_id = ? ORDER BY created_at DESC",
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data utang", error: error.message });
    }
});

// POST - Tambah utang/piutang baru
app.post('/api/debts', authMiddleware, async (req, res) => {
    try {
        const { name, amount, date, due_date, status, note } = req.body;
        const [result] = await pool.query(
            "INSERT INTO debts (user_id, name, amount, date, due_date, status, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [req.user.id, name, amount, date, due_date || null, status, note || null]
        );
        const [newRow] = await pool.query("SELECT * FROM debts WHERE id = ?", [result.insertId]);
        res.status(201).json(newRow[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah utang", error: error.message });
    }
});

// PUT - Update utang/piutang
app.put('/api/debts/:id', authMiddleware, async (req, res) => {
    try {
        const { name, amount, date, due_date, status, note } = req.body;
        const [check] = await pool.query("SELECT id FROM debts WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Catatan tidak ditemukan" });

        await pool.query(
            "UPDATE debts SET name = ?, amount = ?, date = ?, due_date = ?, status = ?, note = ? WHERE id = ? AND user_id = ?",
            [name, amount, date, due_date || null, status, note || null, req.params.id, req.user.id]
        );
        const [updated] = await pool.query("SELECT * FROM debts WHERE id = ?", [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengupdate utang", error: error.message });
    }
});

// DELETE - Hapus utang/piutang
app.delete('/api/debts/:id', authMiddleware, async (req, res) => {
    try {
        const [check] = await pool.query("SELECT id FROM debts WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Catatan tidak ditemukan" });

        await pool.query("DELETE FROM debts WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        res.json({ message: "Catatan berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus utang", error: error.message });
    }
});

// --- DASHBOARD STATS ---
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [income] = await pool.query("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income'", [userId]);
        const [expense] = await pool.query("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense'", [userId]);
        const [debt] = await pool.query("SELECT SUM(amount) as total FROM debts WHERE user_id = ? AND status = 'utang'", [userId]);
        
        const totalIncome = income[0].total || 0;
        const totalExpense = expense[0].total || 0;
        const totalBalance = totalIncome - totalExpense;
        
        res.json({
            totalBalance,
            monthlyIncome: totalIncome,
            monthlyExpense: totalExpense,
            totalDebt: debt[0].total || 0
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil statistik", error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server trzfinance berjalan di port ${PORT}`);
});
