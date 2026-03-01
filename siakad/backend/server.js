require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback';

app.use(cors());
app.use(express.json());

// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/profiles';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const prefix = req.path.includes('logo') ? 'logo-' : 'profile-';
        cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. Register
app.post('/api/register', async (req, res) => {
    const { username, password, nama_lengkap, role, jenis_kelamin, nisn_nik, email, wa_number } = req.body;

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
            INSERT INTO users (username, password, nama_lengkap, role, jenis_kelamin, nisn_nik, email, wa_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(sql, [username, hashedPassword, nama_lengkap, role, jenis_kelamin, nisn_nik, email, wa_number]);

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

        // Check Account Status
        if (user.status === 'nonaktif') {
            return res.status(403).json({ error: "Akun Anda telah dinonaktifkan. Silakan hubungi Admin." });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                nama_lengkap: user.nama_lengkap,
                role: user.role,
                profile_photo: user.profile_photo
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

    if (!token) {
        return res.status(401).json({ error: "Token tidak ditemukan. Silakan login kembali." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: "Sesi Anda telah berakhir (Token Expired). Silakan login kembali.",
                    expired: true
                });
            }
            return res.status(403).json({ error: "Token tidak valid atau telah dimodifikasi." });
        }
        req.user = user;
        next();
    });
};

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, nama_lengkap, role, profile_photo FROM users WHERE id = ?', [req.user.id]);
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
        let sql = 'SELECT id, username, nama_lengkap, role, jenis_kelamin, profile_photo, nisn_nik, email, wa_number, status, created_at FROM users';
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
        const { nama_lengkap, nisn_nik, email, wa_number, role, jenis_kelamin, status } = req.body;

        const sql = `
            UPDATE users 
            SET nama_lengkap = ?, nisn_nik = ?, email = ?, wa_number = ?, role = ?, jenis_kelamin = ?, status = ?
            WHERE id = ?
        `;
        await db.query(sql, [nama_lengkap, nisn_nik, email, wa_number, role, jenis_kelamin, status || 'aktif', id]);
        res.json({ message: "Data user berhasil diperbarui." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal memperbarui data user." });
    }
});

// ==========================================
// 4. MATA PELAJARAN MANAGEMENT
// ==========================================

// Get all mapel
app.get('/api/admin/mapel', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT mp.*, u.nama_lengkap as nama_guru 
            FROM mata_pelajaran mp
            LEFT JOIN users u ON mp.guru_id = u.id
            ORDER BY mp.nama_mapel ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper: Get Teacher List for Select In Mapel Form
app.get('/api/admin/guru-list', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, nama_lengkap FROM users WHERE role = 'guru' ORDER BY nama_lengkap ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add mapel
app.post('/api/admin/mapel', authenticateToken, isAdmin, async (req, res) => {
    let { kode_mapel, nama_mapel, kategori, guru_id, deskripsi } = req.body;
    if (guru_id === '') guru_id = null;
    try {
        const sql = `INSERT INTO mata_pelajaran (kode_mapel, nama_mapel, kategori, guru_id, deskripsi) VALUES (?, ?, ?, ?, ?)`;
        await db.query(sql, [kode_mapel, nama_mapel, kategori, guru_id, deskripsi]);
        res.status(201).json({ message: "Mata pelajaran berhasil ditambahkan." });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Kode Mata Pelajaran sudah digunakan." });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update mapel
app.put('/api/admin/mapel/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    let { kode_mapel, nama_mapel, kategori, guru_id, deskripsi } = req.body;
    if (guru_id === '') guru_id = null;
    try {
        const sql = `UPDATE mata_pelajaran SET kode_mapel = ?, nama_mapel = ?, kategori = ?, guru_id = ?, deskripsi = ? WHERE id = ?`;
        await db.query(sql, [kode_mapel, nama_mapel, kategori, guru_id, deskripsi, id]);
        res.status(200).json({ message: "Mata pelajaran berhasil diperbarui." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete mapel
app.delete('/api/admin/mapel/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM mata_pelajaran WHERE id = ?", [id]);
        res.status(200).json({ message: "Mata pelajaran berhasil dihapus." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. JADWAL PELAJARAN MANAGEMENT
// ==========================================

// Get all jadwal with details
app.get('/api/admin/jadwal', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT j.*, k.nama_kelas, mp.nama_mapel, u.nama_lengkap as nama_guru
            FROM jadwal_pelajaran j
            JOIN kelas k ON j.kelas_id = k.id
            JOIN mata_pelajaran mp ON j.mapel_id = mp.id
            LEFT JOIN users u ON mp.guru_id = u.id
            ORDER BY j.hari ASC, j.jam_mulai ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper: Get Class List
app.get('/api/admin/kelas-list', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, nama_kelas FROM kelas ORDER BY nama_kelas ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add jadwal
app.post('/api/admin/jadwal', authenticateToken, isAdmin, async (req, res) => {
    const { kelas_id, mapel_id, hari, jam_mulai, jam_selesai, ruangan } = req.body;
    try {
        const sql = `INSERT INTO jadwal_pelajaran (kelas_id, mapel_id, hari, jam_mulai, jam_selesai, ruangan) VALUES (?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [kelas_id, mapel_id, hari, jam_mulai, jam_selesai, ruangan]);
        res.status(201).json({ message: "Jadwal berhasil ditambahkan." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update jadwal
app.put('/api/admin/jadwal/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { kelas_id, mapel_id, hari, jam_mulai, jam_selesai, ruangan } = req.body;
    try {
        const sql = `UPDATE jadwal_pelajaran SET kelas_id = ?, mapel_id = ?, hari = ?, jam_mulai = ?, jam_selesai = ?, ruangan = ? WHERE id = ?`;
        await db.query(sql, [kelas_id, mapel_id, hari, jam_mulai, jam_selesai, ruangan, id]);
        res.status(200).json({ message: "Jadwal berhasil diperbarui." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete jadwal
app.delete('/api/admin/jadwal/:id', authenticateToken, isAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        await db.query("DELETE FROM jadwal_pelajaran WHERE id = ?", [id]);
        res.status(200).json({ message: "Jadwal berhasil dihapus." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 6. MANAJEMEN KELAS (ADMIN)
// ==========================================

// Get all kelas with wali kelas
app.get('/api/admin/kelas', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT k.*, u.nama_lengkap as nama_wali 
            FROM kelas k
            LEFT JOIN users u ON k.wali_kelas_id = u.id
            ORDER BY k.tingkat ASC, k.nama_kelas ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add kelas
app.post('/api/admin/kelas', authenticateToken, isAdmin, async (req, res) => {
    const { nama_kelas, tingkat, wali_kelas_id, keterangan } = req.body;
    try {
        const sql = `INSERT INTO kelas (nama_kelas, tingkat, wali_kelas_id, keterangan) VALUES (?, ?, ?, ?)`;
        await db.query(sql, [nama_kelas, tingkat, wali_kelas_id, keterangan]);
        res.status(201).json({ message: "Kelas berhasil ditambahkan." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update kelas
app.put('/api/admin/kelas/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nama_kelas, tingkat, wali_kelas_id, keterangan } = req.body;
    try {
        const sql = `UPDATE kelas SET nama_kelas = ?, tingkat = ?, wali_kelas_id = ?, keterangan = ? WHERE id = ?`;
        await db.query(sql, [nama_kelas, tingkat, wali_kelas_id, keterangan, id]);
        res.status(200).json({ message: "Kelas berhasil diperbarui." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete kelas
app.delete('/api/admin/kelas/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM kelas WHERE id = ?", [id]);
        res.status(200).json({ message: "Kelas berhasil dihapus." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 7. GENERAL SETTINGS
// ==========================================

// Get all settings (Public)
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT setting_key, setting_value FROM settings");
        // Convert to key-value object
        const settingsMap = rows.reduce((acc, current) => {
            acc[current.setting_key] = current.setting_value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update settings (Admin only)
app.post('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
    const settingsUpdates = req.body; // Expecting { key: value, key2: value2 }
    try {
        for (const [key, value] of Object.entries(settingsUpdates)) {
            await db.query(
                "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
                [key, value, value]
            );
        }
        res.status(200).json({ message: "Pengaturan berhasil diperbarui." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Institution Logo
app.post('/api/admin/settings/logo', authenticateToken, isAdmin, upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "File tidak ditemukan." });

        // Ensure directory exists
        const dir = './uploads/logos';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Move file if needed or just use the path if multer destination was already set.
        // Current multer dest is ./uploads/profiles. Let's fix that.
        const logoPath = `/uploads/logos/${req.file.filename}`;

        // Move file from profiles to logos if we want separate folders
        const oldPath = path.join(__dirname, 'uploads/profiles', req.file.filename);
        const newPath = path.join(__dirname, 'uploads/logos', req.file.filename);

        fs.renameSync(oldPath, newPath);

        await db.query(
            "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            ['institution_logo', logoPath, logoPath]
        );

        res.json({
            message: "Logo institusi berhasil diperbarui.",
            logoUrl: logoPath
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengunggah logo." });
    }
});

// Delete Institution Logo
app.delete('/api/admin/settings/logo', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'institution_logo'");
        if (rows.length > 0 && rows[0].setting_value) {
            const oldFilePath = path.join(__dirname, rows[0].setting_value);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
        await db.query(
            "INSERT INTO settings (setting_key, setting_value) VALUES ('institution_logo', NULL) ON DUPLICATE KEY UPDATE setting_value = NULL"
        );
        res.json({ message: "Logo institusi berhasil dihapus." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal menghapus logo." });
    }
});

// ==========================================
// 8. MANAJEMEN NILAI (ADMIN)
// ==========================================

// Get all nilai with details
app.get('/api/admin/nilai', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT n.*, u.nama_lengkap as nama_siswa, mp.nama_mapel, k.nama_kelas, gu.nama_lengkap as nama_guru
            FROM nilai n
            JOIN users u ON n.siswa_id = u.id
            JOIN mata_pelajaran mp ON n.mapel_id = mp.id
            JOIN kelas k ON n.kelas_id = k.id
            JOIN users gu ON n.guru_id = gu.id
            ORDER BY k.tingkat ASC, k.nama_kelas ASC, u.nama_lengkap ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add nilai
app.post('/api/admin/nilai', authenticateToken, isAdmin, async (req, res) => {
    const { siswa_id, mapel_id, guru_id, kelas_id, nilai_uh, nilai_uts, nilai_uas, semester, tahun_ajaran, keterangan } = req.body;

    // Calculate nilai_akhir (simple average or weight)
    const n_akhir = (parseFloat(nilai_uh || 0) + parseFloat(nilai_uts || 0) + parseFloat(nilai_uas || 0)) / 3;

    try {
        const sql = `
            INSERT INTO nilai (siswa_id, mapel_id, guru_id, kelas_id, nilai_uh, nilai_uts, nilai_uas, nilai_akhir, semester, tahun_ajaran, keterangan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [siswa_id, mapel_id, guru_id, kelas_id, nilai_uh, nilai_uts, nilai_uas, n_akhir, semester, tahun_ajaran, keterangan]);
        res.status(201).json({ message: "Nilai berhasil ditambahkan." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update nilai
app.put('/api/admin/nilai/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { siswa_id, mapel_id, guru_id, kelas_id, nilai_uh, nilai_uts, nilai_uas, semester, tahun_ajaran, keterangan } = req.body;

    const n_akhir = (parseFloat(nilai_uh || 0) + parseFloat(nilai_uts || 0) + parseFloat(nilai_uas || 0)) / 3;

    try {
        const sql = `
            UPDATE nilai 
            SET siswa_id = ?, mapel_id = ?, guru_id = ?, kelas_id = ?, nilai_uh = ?, nilai_uts = ?, nilai_uas = ?, nilai_akhir = ?, semester = ?, tahun_ajaran = ?, keterangan = ?
            WHERE id = ?
        `;
        await db.query(sql, [siswa_id, mapel_id, guru_id, kelas_id, nilai_uh, nilai_uts, nilai_uas, n_akhir, semester, tahun_ajaran, keterangan, id]);
        res.status(200).json({ message: "Nilai berhasil diperbarui." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete nilai
app.delete('/api/admin/nilai/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM nilai WHERE id = ?", [id]);
        res.status(200).json({ message: "Nilai berhasil dihapus." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 9. DASHBOARD STATS
// ==========================================

app.get('/api/admin/dashboard-stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        // 1. Total Siswa
        const [siswaRow] = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'siswa'");

        // 2. Total Guru
        const [guruRow] = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'guru'");

        // 3. Mata Pelajaran
        const [mapelRow] = await db.query("SELECT COUNT(*) as total FROM mata_pelajaran");

        // 4. Pertemuan Hari Ini
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = days[new Date().getDay()];
        const [jadwalRow] = await db.query("SELECT COUNT(*) as total FROM jadwal_pelajaran WHERE hari = ?", [today]);

        // 5. Recent Siswa (Optional but good for completeness)
        const [recentSiswa] = await db.query(`
            SELECT nama_lengkap as name, 'X MIPA 1' as class, DATE_FORMAT(created_at, '%d %b %Y') as date 
            FROM users 
            WHERE role = 'siswa' 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        // 6. Recent Agenda (Upcoming)
        const [recentAgenda] = await db.query(`
            SELECT id, title, DATE_FORMAT(tanggal, '%d') as day, DATE_FORMAT(tanggal, '%b') as month, type 
            FROM agenda 
            WHERE tanggal >= CURDATE()
            ORDER BY tanggal ASC 
            LIMIT 3
        `);

        res.json({
            totalSiswa: siswaRow[0].total,
            totalGuru: guruRow[0].total,
            totalMapel: mapelRow[0].total,
            pertemuanHariIni: jadwalRow[0].total,
            recentSiswa: recentSiswa,
            recentAgenda: recentAgenda
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 10. AGENDA MANAGEMENT (ADMIN)
// ==========================================

// Get all agenda
app.get('/api/admin/agenda', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM agenda ORDER BY tanggal ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add agenda
app.post('/api/admin/agenda', authenticateToken, isAdmin, async (req, res) => {
    const { title, tanggal, type, keterangan } = req.body;
    try {
        const sql = `INSERT INTO agenda (title, tanggal, type, keterangan) VALUES (?, ?, ?, ?)`;
        await db.query(sql, [title, tanggal, type, keterangan]);
        res.status(201).json({ message: "Agenda berhasil ditambahkan." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update agenda
app.put('/api/admin/agenda/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, tanggal, type, keterangan } = req.body;
    try {
        const sql = `UPDATE agenda SET title = ?, tanggal = ?, type = ?, keterangan = ? WHERE id = ?`;
        await db.query(sql, [title, tanggal, type, keterangan, id]);
        res.status(200).json({ message: "Agenda berhasil diperbarui." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete agenda
app.delete('/api/admin/agenda/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM agenda WHERE id = ?", [id]);
        res.status(200).json({ message: "Agenda berhasil dihapus." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 11. PROFILE MANAGEMENT (GENERAL)
// ==========================================

// Get Current User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, username, nama_lengkap, role, jenis_kelamin, profile_photo, nisn_nik, email, wa_number, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: "User tidak ditemukan." });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Gagal mengambil data profil." });
    }
});

// Update Current User Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { id } = req.user;
        const { nama_lengkap, email, wa_number, jenis_kelamin, password } = req.body;

        let sql = 'UPDATE users SET nama_lengkap = ?, email = ?, wa_number = ?, jenis_kelamin = ?';
        let params = [nama_lengkap, email, wa_number, jenis_kelamin];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql += ', password = ?';
            params.push(hashedPassword);
        }

        sql += ' WHERE id = ?';
        params.push(id);

        await db.query(sql, params);
        res.json({ message: "Profil berhasil diperbarui." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal memperbarui profil." });
    }
});

// Upload Profile Photo
app.post('/api/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "File tidak ditemukan." });

        const photoPath = `/uploads/profiles/${req.file.filename}`;
        await db.query('UPDATE users SET profile_photo = ? WHERE id = ?', [photoPath, req.user.id]);

        res.json({
            message: "Foto profil berhasil diunggah.",
            photoUrl: photoPath
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengunggah foto." });
    }
});

app.listen(PORT, () => {
    console.log(`SIAS PRO Backend running on http://localhost:${PORT}`);
});
