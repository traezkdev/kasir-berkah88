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

// Helper: Hitung ulang used_amount budget berdasarkan total transaksi expense pada kategori tersebut
const recalculateBudgetUsed = async (userId, category) => {
    try {
        const [result] = await pool.query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND category = ?",
            [userId, category]
        );
        const total = result[0].total || 0;
        await pool.query(
            "UPDATE budgets SET used_amount = ? WHERE user_id = ? AND category = ?",
            [total, userId, category]
        );
    } catch (err) {
        console.error('Gagal recalculate budget:', err.message);
    }
};

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
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC", 
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
        if (!date || !type || !category || !amount) return res.status(400).json({ message: "Semua field wajib diisi" });

        const userId = req.user.id;

        // VALIDASI SALDO: Jika pengeluaran, cek apakah saldo cukup
        if (type === 'expense') {
            const [income] = await pool.query("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income'", [userId]);
            const [expense] = await pool.query("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense'", [userId]);
            
            const currentBalance = (income[0].total || 0) - (expense[0].total || 0);
            if (Number(amount) > currentBalance) {
                return res.status(400).json({ message: `Saldo Anda tidak cukup! Sisa saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}` });
            }
        }

        const [result] = await pool.query(
            "INSERT INTO transactions (user_id, date, type, category, amount, note) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, date, type, category, amount, note]
        );
        const [newRow] = await pool.query("SELECT * FROM transactions WHERE id = ?", [result.insertId]);
        
        // Auto-update budget jika transaksi expense
        if (type === 'expense') {
            await recalculateBudgetUsed(userId, category);
        }
        res.status(201).json(newRow[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal mencatat transaksi", error: error.message });
    }
});

// UPDATE Transaksi
app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
    try {
        const { date, type, category, amount, note } = req.body;
        const userId = req.user.id;
        const [check] = await pool.query("SELECT * FROM transactions WHERE id = ? AND user_id = ?", [req.params.id, userId]);
        if (check.length === 0) return res.status(404).json({ message: "Transaksi tidak ditemukan" });

        const oldTransaction = check[0];

        // VALIDASI SALDO: Jika berubah jadi expense atau nominal expense bertambah
        if (type === 'expense') {
            const [income] = await pool.query("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income'", [userId]);
            const [expense] = await pool.query("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense'", [userId]);
            
            // Saldo sebelum transaksi ini dihitung
            const currentTotalExpenseExcludingThis = (expense[0].total || 0) - (oldTransaction.type === 'expense' ? oldTransaction.amount : 0);
            const currentBalance = (income[0].total || 0) - currentTotalExpenseExcludingThis;

            if (Number(amount) > currentBalance) {
                return res.status(400).json({ message: `Saldo tidak mencukupi untuk update ini! Sisa saldo tersedia: Rp ${currentBalance.toLocaleString('id-ID')}` });
            }
        }

        await pool.query(
            "UPDATE transactions SET date = ?, type = ?, category = ?, amount = ?, note = ? WHERE id = ? AND user_id = ?",
            [date, type, category, amount, note, req.params.id, userId]
        );
        const [updated] = await pool.query("SELECT * FROM transactions WHERE id = ?", [req.params.id]);

        // Auto-update budget: recalculate kategori lama dan/atau baru
        const categoriesToRecalculate = new Set();
        if (oldTransaction.type === 'expense') categoriesToRecalculate.add(oldTransaction.category);
        if (type === 'expense') categoriesToRecalculate.add(category);
        for (const cat of categoriesToRecalculate) {
            await recalculateBudgetUsed(userId, cat);
        }

        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengupdate transaksi", error: error.message });
    }
});

// DELETE Transaksi
app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
    try {
        const [check] = await pool.query("SELECT * FROM transactions WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Transaksi tidak ditemukan" });

        const oldTransaction = check[0];
        await pool.query("DELETE FROM transactions WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);

        // Auto-update budget jika transaksi expense
        if (oldTransaction.type === 'expense') {
            await recalculateBudgetUsed(req.user.id, oldTransaction.category);
        }

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

// --- BILLS ROUTES ---

app.get('/api/bills', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC", [req.user.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil tagihan", error: error.message });
    }
});

app.post('/api/bills', authMiddleware, async (req, res) => {
    try {
        const { name, amount, due_date, status } = req.body;
        const [result] = await pool.query(
            "INSERT INTO bills (user_id, name, amount, due_date, status) VALUES (?, ?, ?, ?, ?)",
            [req.user.id, name, amount, due_date, status || 'unpaid']
        );
        const [newRow] = await pool.query("SELECT * FROM bills WHERE id = ?", [result.insertId]);
        res.status(201).json(newRow[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah tagihan", error: error.message });
    }
});

app.put('/api/bills/:id', authMiddleware, async (req, res) => {
    try {
        const { name, amount, due_date, status } = req.body;
        const [check] = await pool.query("SELECT id FROM bills WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Tagihan tidak ditemukan" });

        await pool.query(
            "UPDATE bills SET name = ?, amount = ?, due_date = ?, status = ? WHERE id = ? AND user_id = ?",
            [name, amount, due_date, status, req.params.id, req.user.id]
        );
        const [updated] = await pool.query("SELECT * FROM bills WHERE id = ?", [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengupdate tagihan", error: error.message });
    }
});

// PATCH - Tandai lunas / belum bayar
app.patch('/api/bills/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const [check] = await pool.query("SELECT id, name, amount, paid_amount FROM bills WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Tagihan tidak ditemukan" });

        const bill = check[0];
        // Jika ditandai lunas manual, sisa yang belum dibayar dicatat ke transaksi
        if (status === 'paid' && bill.status !== 'paid') {
            const remainingToPay = bill.amount - (bill.paid_amount || 0);
            if (remainingToPay > 0) {
                await pool.query(
                    "INSERT INTO transactions (user_id, type, category, amount, note, date) VALUES (?, 'expense', 'Tagihan', ?, ?, CURDATE())",
                    [req.user.id, remainingToPay, `Pelunasan Tagihan: ${bill.name}`]
                );
            }
        }

        const paidAmount = status === 'paid' ? bill.amount : 0;
        await pool.query("UPDATE bills SET status = ?, paid_amount = ? WHERE id = ? AND user_id = ?", [status, paidAmount, req.params.id, req.user.id]);
        
        const [updated] = await pool.query("SELECT * FROM bills WHERE id = ?", [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal update status tagihan", error: error.message });
    }
});

// PATCH - Cicil / Bayar sebagian
app.patch('/api/bills/:id/pay', authMiddleware, async (req, res) => {
    try {
        const { amount_to_pay } = req.body;
        if (!amount_to_pay || amount_to_pay <= 0) return res.status(400).json({ message: "Jumlah bayar harus lebih dari 0" });

        const [check] = await pool.query("SELECT * FROM bills WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Tagihan tidak ditemukan" });

        const bill = check[0];
        const newPaidAmount = Number(bill.paid_amount || 0) + Number(amount_to_pay);
        const newStatus = newPaidAmount >= bill.amount ? 'paid' : 'unpaid';

        // Update Tagihan
        await pool.query(
            "UPDATE bills SET paid_amount = ?, status = ? WHERE id = ? AND user_id = ?",
            [newPaidAmount, newStatus, req.params.id, req.user.id]
        );

        // OTOMATIS: Catat ke Transaksi sebagai Pengeluaran
        await pool.query(
            "INSERT INTO transactions (user_id, type, category, amount, note, date) VALUES (?, 'expense', 'Tagihan', ?, ?, CURDATE())",
            [req.user.id, amount_to_pay, `Pembayaran Tagihan: ${bill.name}`]
        );

        const [updated] = await pool.query("SELECT * FROM bills WHERE id = ?", [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal mencatat pembayaran", error: error.message });
    }
});

app.delete('/api/bills/:id', authMiddleware, async (req, res) => {
    try {
        const [check] = await pool.query("SELECT id FROM bills WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Tagihan tidak ditemukan" });

        await pool.query("DELETE FROM bills WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        res.json({ message: "Tagihan berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus tagihan", error: error.message });
    }
});

// --- BUDGETS ROUTES ---

// GET semua budget user
app.get('/api/budgets', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC",
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data budget", error: error.message });
    }
});

// POST - Tambah budget baru
app.post('/api/budgets', authMiddleware, async (req, res) => {
    try {
        const { category, limit_amount, used_amount } = req.body;
        if (!category || !limit_amount) return res.status(400).json({ message: "Kategori dan limit wajib diisi" });
        const [result] = await pool.query(
            "INSERT INTO budgets (user_id, category, limit_amount, used_amount) VALUES (?, ?, ?, ?)",
            [req.user.id, category, limit_amount, used_amount || 0]
        );
        const [newRow] = await pool.query("SELECT * FROM budgets WHERE id = ?", [result.insertId]);
        res.status(201).json(newRow[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah budget", error: error.message });
    }
});

// PUT - Update budget
app.put('/api/budgets/:id', authMiddleware, async (req, res) => {
    try {
        const { category, limit_amount, used_amount } = req.body;
        const [check] = await pool.query("SELECT id FROM budgets WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Budget tidak ditemukan" });

        await pool.query(
            "UPDATE budgets SET category = ?, limit_amount = ?, used_amount = ? WHERE id = ? AND user_id = ?",
            [category, limit_amount, used_amount, req.params.id, req.user.id]
        );
        const [updated] = await pool.query("SELECT * FROM budgets WHERE id = ?", [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengupdate budget", error: error.message });
    }
});

// DELETE - Hapus budget
app.delete('/api/budgets/:id', authMiddleware, async (req, res) => {
    try {
        const [check] = await pool.query("SELECT id FROM budgets WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Budget tidak ditemukan" });

        await pool.query("DELETE FROM budgets WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        res.json({ message: "Budget berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus budget", error: error.message });
    }
});

// --- SAVINGS ROUTES ---

// GET semua tabungan user
app.get('/api/savings', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM savings WHERE user_id = ? ORDER BY created_at DESC",
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data tabungan", error: error.message });
    }
});

// POST - Tambah target tabungan baru
app.post('/api/savings', authMiddleware, async (req, res) => {
    try {
        const { name, target_amount, current_amount } = req.body;
        if (!name || !target_amount) return res.status(400).json({ message: "Nama dan target tabungan wajib diisi" });
        
        const [result] = await pool.query(
            "INSERT INTO savings (user_id, name, target_amount, current_amount) VALUES (?, ?, ?, ?)",
            [req.user.id, name, target_amount, current_amount || 0]
        );
        
        // Jika saldo awal tabungan > 0, catat sebagai pengeluaran di transaksi
        if (current_amount > 0) {
            await pool.query(
                "INSERT INTO transactions (user_id, type, category, amount, note, date) VALUES (?, 'expense', 'Tabungan', ?, ?, CURDATE())",
                [req.user.id, current_amount, `Setoran Awal Tabungan: ${name}`]
            );
        }

        const [newRow] = await pool.query("SELECT * FROM savings WHERE id = ?", [result.insertId]);
        res.status(201).json(newRow[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah tabungan", error: error.message });
    }
});

// PUT - Update target tabungan
app.put('/api/savings/:id', authMiddleware, async (req, res) => {
    try {
        const { name, target_amount } = req.body;
        const [check] = await pool.query("SELECT id FROM savings WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Tabungan tidak ditemukan" });

        await pool.query(
            "UPDATE savings SET name = ?, target_amount = ? WHERE id = ? AND user_id = ?",
            [name, target_amount, req.params.id, req.user.id]
        );
        const [updated] = await pool.query("SELECT * FROM savings WHERE id = ?", [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengupdate tabungan", error: error.message });
    }
});

// PATCH - Tambah setoran tabungan
app.patch('/api/savings/:id/add', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ message: "Jumlah setoran harus lebih dari 0" });

        const [check] = await pool.query("SELECT * FROM savings WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Tabungan tidak ditemukan" });

        const saving = check[0];
        const newCurrentAmount = Number(saving.current_amount) + Number(amount);

        // Update saldo tabungan
        await pool.query(
            "UPDATE savings SET current_amount = ? WHERE id = ? AND user_id = ?",
            [newCurrentAmount, req.params.id, req.user.id]
        );

        // OTOMATIS: Catat ke Transaksi sebagai Pengeluaran
        await pool.query(
            "INSERT INTO transactions (user_id, type, category, amount, note, date) VALUES (?, 'expense', 'Tabungan', ?, ?, CURDATE())",
            [req.user.id, amount, `Setoran Tabungan: ${saving.name}`]
        );

        const [updated] = await pool.query("SELECT * FROM savings WHERE id = ?", [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah setoran", error: error.message });
    }
});

// DELETE - Hapus target tabungan
app.delete('/api/savings/:id', authMiddleware, async (req, res) => {
    try {
        const [check] = await pool.query("SELECT id FROM savings WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (check.length === 0) return res.status(404).json({ message: "Tabungan tidak ditemukan" });

        await pool.query("DELETE FROM savings WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        res.json({ message: "Tabungan berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus tabungan", error: error.message });
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
