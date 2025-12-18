const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const envPath = path.join(__dirname, '.env');

// Import database schema documentation
const { DATABASE_SCHEMA, TABLE_RELATIONSHIPS, COMMON_QUERIES, IMPORTANT_NOTES } = require('./database-schema.js');


console.log(`[DEBUG_STARTUP] Current Dir (__dirname): ${__dirname}`);
console.log(`[DEBUG_STARTUP] VERSION CHECK: v-${Date.now()} (Pastikan kode ini ter-upload)`);
console.log(`[DEBUG_STARTUP] Target .env Path: ${envPath}`);

if (fs.existsSync(envPath)) {
    console.log(`[DEBUG_STARTUP] File .env DITEMUKAN. Mencoba memuat...`);

    // DEBUG: Read raw file content to see what's actually inside
    try {
        const rawEnv = fs.readFileSync(envPath, 'utf8');
        console.log(`[DEBUG_STARTUP] Isi file .env (Masked):`);
        rawEnv.split('\n').forEach(line => {
            if (line.trim().startsWith('DB_PASSWORD')) {
                console.log(`   DB_PASSWORD=**** (Panjang: ${line.split('=')[1]?.trim().length || 0})`);
            } else if (line.trim()) {
                console.log(`   ${line.trim()}`);
            }
        });
    } catch (err) {
        console.error(`[DEBUG_STARTUP] Gagal membaca raw file: ${err.message}`);
    }

    // Force override in case system env vars are set
    const result = require('dotenv').config({ path: envPath, override: true });

    if (result.error) {
        console.error(`[DEBUG_STARTUP] Error parsing .env: ${result.error.message}`);
    } else {
        console.log(`[DEBUG_STARTUP] .env berhasil dimuat via dotenv (Override active).`);
    }
} else {
    console.warn(`[DEBUG_STARTUP] 🔥 File .env TIDAK DITEMUKAN di path tersebut!`);
}

// Log loaded values
console.log(`[DEBUG_STARTUP] FINAL PROCESS.ENV VALUES:`);
console.log(`- DB_HOST: ${process.env.DB_HOST}`);
console.log(`- DB_USER: ${process.env.DB_USER}`);
console.log(`- DB_DATABASE: ${process.env.DB_DATABASE}`);
console.log(`- DB_PORT: ${process.env.DB_PORT}`);

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { pipeline } = require('@xenova/transformers');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files (like widget.js)
app.use(express.static(__dirname));

// --- AI PROVIDER SETUP ---
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq'; // 'groq', 'gemini', 'openai'
console.log(`[DEBUG] AI Provider selected: ${AI_PROVIDER.toUpperCase()}`);

let aiClient;
// Initialize specific provider
if (AI_PROVIDER === 'groq') {
    const { Groq } = require('groq-sdk');
    aiClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else if (AI_PROVIDER === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // DEBUG: List available models to find the correct name
    (async () => {
        try {
            // Note: listModels might not be available on the instance directly in some versions, 
            // usually it's genAI.getGenerativeModel... no, usually via API.
            // But let's stick to simple configuration first. 
            // If checking models is hard, we just default to 'gemini-1.5-flash' which SHOULD work.
            console.log("[DEBUG] Gemini Configured. Model: gemini-1.5-flash");
        } catch (e) {
            console.warn("[DEBUG] Gemini Check Error:", e.message);
        }
    })();

    aiClient = { genAI, modelName: process.env.GEMINI_MODEL || 'gemini-1.5-flash' };
} else if (AI_PROVIDER === 'openai') {
    const OpenAI = require('openai');
    aiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const VECTOR_DB_PATH = path.join(__dirname, 'vector_db.json');
let vectorDb = [];
let extractor;

// Helper: Cosine Similarity
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 1. Load Resources
async function loadResources() {
    console.log('Loading AI models and database...');

    // Load Database
    if (fs.existsSync(VECTOR_DB_PATH)) {
        vectorDb = JSON.parse(fs.readFileSync(VECTOR_DB_PATH, 'utf-8'));
    } else {
        console.warn('Warning: vector_db.json not found. Please run "npm run ingest" first.');
        vectorDb = [];
    }

    // Load Embedding Model
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('AI Ready!');
}

loadResources();

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });

        // 1. Embed Query
        const output = await extractor(message, { pooling: 'mean', normalize: true });
        const queryEmbedding = Array.from(output.data);

        // 2. Linear Search (Cosine Similarity)
        // Since we likely have < 1000 chunks, a simple loop is extremely fast (< 10ms)
        const scoredDocs = vectorDb.map(doc => ({
            ...doc,
            score: cosineSimilarity(queryEmbedding, doc.embedding)
        }));

        // Sort by score descending and take top 3
        scoredDocs.sort((a, b) => b.score - a.score);
        const topDocs = scoredDocs.slice(0, 3);

        const contextText = topDocs.map(d => d.content).join('\n---\n');

        // --- HARDCODED KNOWLEDGE BASE (Identity) ---
        const appDescription = `
        TENTANG APLIKASI INI:
        Nama: Kasir Berkah88
        Fungsi: Aplikasi kasir berbasis web untuk manajemen penjualan, stok, dan karyawan.
        Fitur: Transaksi kasir, cetak struk, rekapan harian (tunai/transfer/gojek/makan karyawan), manajemen stok bahan baku, dan manajemen menu.
        Pembuat: Traezkdev (M Alfin Firdaus).
        Alfin di kenal tampan dan baik hati, tidak suka main perempuan dan orang nya setia.
        
        ORANG-ORANG TERKAIT:
        - Wahyu: Jabatan sebagai Tukang Hajar, dijuluki "Pembantai Makanan" karena kemampuannya menghabiskan makanan dalam jumlah banyak. Dikenal suka seleding-an (ngambek/marah-marah) kalau kalah main bola.

        - Fikri muliawan biasa di kenal KEKEW , dia adalah tukang sambal profesional, dia orang nya pendiam, tapi kalo lagi main ML dia suka paling berisik marah2 gak jelas. 

        - Mas bambang : atau biasa di kenal sebagai pak saitama, dia adalah seorang bapak yang suka roko ilegal, dia suka lagu2 galau dan sama seperti wahyu kalo kalah main bola suka sleding'an , cita cita nya ingin menjadi saitama

        - Mang dede : adalah koordinator warung kerongkongan berkah 88, mang dede yang besar di korea dan fasih berbahasa arab dan mongolia, lelaki dengan semangat juang tinggi, rajin bekerja dan dapat di andalkan.

        PEMILIK RESTORAN ATAU BISNIS
        nama : Eko prames swara
        jabatan : owner / pemilik
        Hoby : bulu tangkis
        lainnya : di kenal baik dan ramah dan softspoken

        === PANDUAN LENGKAP FITUR WEBSITE KASIR BERKAH88 ===

        📊 FITUR DASHBOARD:
        1. Dashboard Utama (/main-dashboard):
           - Menampilkan metrik keuangan real-time (saldo lapak, pendapatan, pengeluaran, laba bersih)
           - Statistik hari ini (total transaksi, item terjual, rata-rata order, jam sibuk)
           - Grafik penjualan dan trend
           - Quick Actions untuk akses cepat ke fitur-fitur penting
           - Filter data: Minggu Ini, Bulan Ini, Tahun Ini, Semua Waktu, Custom
           - Data detail lengkap: Modal Awal, Modal Berjalan, Modal Akhir, Total Nilai Stok
           - Status sinkronisasi data (Stok Menu, Bahan Baku, Uang Lapak)

        2. Dashboard Owner (/owner-dashboard):
           - Khusus untuk pemilik bisnis
           - Laporan keuangan komprehensif
           - Monitoring performa bisnis secara keseluruhan

        3. Dashboard Kasir (/cashier-dashboard):
           - Interface sederhana untuk kasir
           - Fokus pada transaksi penjualan

        💰 FITUR TRANSAKSI & PENJUALAN:
        1. Proses Transaksi Penjualan (/sales-transaction-processing):
           - Buat transaksi penjualan baru
           - Pilih menu dari daftar
           - Hitung otomatis total, PPN, kembalian
           - Metode pembayaran: Tunai, Transfer, Gojek
           - Cetak struk otomatis
           - Support transaksi makan karyawan

        2. Transaksi Sederhana (/transaksi-sederhana):
           - Interface lebih simpel untuk transaksi cepat
           - Cocok untuk kasir yang baru belajar

        3. Riwayat Transaksi (/transaction-history):
           - Lihat semua transaksi yang pernah dilakukan
           - Filter berdasarkan tanggal, metode pembayaran
           - Search transaksi
           - Export data
           - Cetak ulang struk
           - Edit atau hapus transaksi (dengan permission)

        4. Konfirmasi Pesanan (/order-confirmation):
           - Konfirmasi pesanan sebelum diproses
           - Review item dan total harga

        🍽️ FITUR MENU & STOK:
        1. Manajemen Menu (/menu-management):
           - Tambah, edit, hapus menu
           - Set harga dan kategori
           - Upload foto menu
           - Kelola stok menu
           - Tandai menu favorit
           - Status ketersediaan (tersedia/habis)

        2. Stok Bahan Mentah (/raw-material-stock):
           - Kelola bahan baku mentah
           - Input pembelian bahan baku
           - Tracking penggunaan bahan
           - Alert stok menipis
           - Konversi satuan (kg, liter, pcs, dll)
           - Hitung nilai stok bahan baku

        3. Stok Kritis (/main-critical-stock atau /critical-stock):
           - Lihat daftar bahan/menu yang stoknya menipis
           - Alert otomatis untuk restock
           - Prioritas pembelian

        4. Kalkulator HPP (/hpp):
           - Hitung Harga Pokok Penjualan
           - Analisis biaya produksi
           - Tentukan harga jual optimal
           - Margin profit calculator

        💸 FITUR KEUANGAN:
        1. Catatan Pengeluaran (/expense-tracking):
           - Catat semua pengeluaran operasional
           - Kategori pengeluaran (bahan baku, gaji, utilitas, dll)
           - Attach bukti/nota
           - Laporan pengeluaran harian/bulanan

        2. Pengeluaran Lapak (/lapak-deposit):
           - Kelola dana lapak
           - Tarik/setor uang lapak
           - History transaksi lapak
           - Saldo real-time

        3. Uang Bisnis (/uang-bisnis atau /admin-uang-bisnis):
           - Manajemen kas bisnis
           - Transfer antar akun
           - Monitoring cash flow

        4. Rekonsiliasi Kas (/cash-reconciliation):
           - Cocokkan uang fisik dengan sistem
           - Input jumlah uang aktual (Tunai, Transfer, Gojek)
           - Hitung selisih otomatis
           - Catat alasan selisih
           - History rekonsiliasi
           - Tampilan card responsive untuk mobile

        📈 FITUR LAPORAN:
        1. Laporan Bisnis (/business-reports):
           - Laporan penjualan harian/bulanan/tahunan
           - Grafik performa
           - Top selling items
           - Analisis trend
           - Export ke PDF/Excel

        2. Laporan Lengkap (/laporan-lengkap):
           - Laporan komprehensif semua aspek bisnis
           - Gabungan semua metrik
           - Cocok untuk review bulanan/tahunan

        👥 FITUR KARYAWAN & TIM:
        1. Daftar Karyawan (/employee-list):
           - Lihat struktur organisasi
           - Data karyawan lengkap
           - Kontak dan posisi
           - Management tim

        ⚙️ FITUR UTILITAS:
        1. Kalkulator (/calculator):
           - Kalkulator cepat untuk hitung-hitungan
           - Akses mudah dari quick actions

        2. Catatan (/notes):
           - Buat catatan penting
           - Reminder
           - To-do list

        3. Pengaturan (/settings):
           - Konfigurasi aplikasi
           - Set modal awal
           - Upload logo
           - Atur tema (Default/Admin)
           - Dark mode toggle
           - Pengaturan printer
           - Backup & restore data

        4. Profil (/profile atau /owner-profile):
           - Edit profil user
           - Ganti password
           - Info akun

        5. AI Assistant (/chatbot):
           - Chat dengan BerkahBot (aku!)
           - Tanya informasi bisnis real-time
           - Bantuan penggunaan fitur
           - Tips & trik

        🗑️ FITUR LAINNYA:
        1. Tempat Sampah Transaksi (/transaction-trash):
           - Lihat transaksi yang dihapus
           - Restore transaksi
           - Hapus permanen

        2. Cetak Struk (/receipt):
           - Preview struk sebelum cetak
           - Support thermal printer 58mm
           - Customizable layout

        === TIPS PENGGUNAAN ===
        
        💡 TIPS UNTUK KASIR:
        - Gunakan /transaksi-sederhana untuk transaksi cepat
        - Selalu cek stok menu sebelum terima pesanan
        - Lakukan rekonsiliasi kas setiap akhir shift
        - Catat semua transaksi makan karyawan

        💡 TIPS UNTUK ADMIN:
        - Review dashboard setiap pagi untuk cek performa
        - Set modal awal di settings untuk tracking akurat
        - Lakukan backup data rutin
        - Monitor stok kritis setiap hari
        - Update harga menu sesuai biaya bahan baku

        💡 TIPS UNTUK OWNER:
        - Cek laporan lengkap setiap akhir bulan
        - Analisis trend penjualan untuk strategi bisnis
        - Monitor margin profit di kalkulator HPP
        - Review pengeluaran vs pendapatan secara berkala

        === CARA AKSES FITUR ===
        
        Semua fitur bisa diakses melalui:
        1. Menu Sidebar (kiri) - untuk desktop
        2. Bottom Navigation (bawah) - untuk mobile
        3. Quick Actions di Dashboard - shortcut fitur penting
        4. Breadcrumb Navigation - navigasi cepat

        === ROLE & PERMISSION ===
        
        - Admin/User: Akses penuh semua fitur
        - Kasir: Akses terbatas (transaksi, riwayat transaksi kasir)
        - Owner: Dashboard owner, laporan bisnis, monitoring

        === INTEGRASI & TEKNOLOGI ===
        
        - Real-time data dari database MySQL
        - Responsive design (mobile & desktop)
        - Dark mode support
        - PWA (Progressive Web App) - bisa diinstall di HP
        - Thermal printer support
        - Cloud backup ready
        - AI Chatbot powered by Groq/Gemini

        === DATABASE SCHEMA ===
        
        Kamu punya akses penuh ke informasi struktur database! Gunakan ini untuk menjawab pertanyaan teknis tentang data.
        
        📋 TABEL UTAMA:
        ${Object.keys(DATABASE_SCHEMA).map(tableName => `- ${tableName}: ${DATABASE_SCHEMA[tableName].description}`).join('\n        ')}
        
        💡 CONTOH QUERY UMUM:
        ${Object.entries(COMMON_QUERIES).map(([desc, query]) => `
        ${desc}:
        ${query.trim()}
        `).join('\n        ')}
        
        ⚠️ CATATAN PENTING DATABASE:
        - Timezone: ${IMPORTANT_NOTES.timezone}
        - Soft Delete: ${IMPORTANT_NOTES.soft_delete}
        - JSON Fields: ${IMPORTANT_NOTES.json_fields}
        - Payment Methods: ${IMPORTANT_NOTES.payment_methods.join(', ')}
        - User Roles: ${IMPORTANT_NOTES.user_roles.join(', ')}
        
        📊 DETAIL TABEL (untuk pertanyaan spesifik):
        Jika user tanya detail kolom tabel tertentu, kamu bisa jelaskan dari DATABASE_SCHEMA.
        Contoh: "Tabel transactions punya kolom: id, timestamp, items (JSON), total, payment_method, dll."
        `;

        // --- DYNAMIC DATA FETCHING ---
        let dynamicContext = "";
        const lowerMessage = message.toLowerCase();

        console.log(`[DEBUG] Menerima pesan: "${message}"`);

        // --- DB CONFIGURATION (Global in Route) ---
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'kasir',
            port: process.env.DB_PORT || 3306,
            timezone: '+07:00' // WIB Timezone
        };

        // Trigger keywords
        // Trigger keywords (Expanded)
        if (lowerMessage.includes('jual') || lowerMessage.includes('sales') || lowerMessage.includes('laporan') ||
            lowerMessage.includes('pendapatan') || lowerMessage.includes('uang') || lowerMessage.includes('transaksi') ||
            lowerMessage.includes('revenue') || lowerMessage.includes('income') || lowerMessage.includes('modal') ||
            lowerMessage.includes('saldo') || lowerMessage.includes('owner') || lowerMessage.includes('kas') ||
            lowerMessage.includes('stok') || lowerMessage.includes('stock') || lowerMessage.includes('bahan') ||
            lowerMessage.includes('menu') || lowerMessage.includes('harga') || lowerMessage.includes('price') ||
            lowerMessage.includes('karyawan') || lowerMessage.includes('pegawai') || lowerMessage.includes('staff') ||
            lowerMessage.includes('belanja') || lowerMessage.includes('expense') || lowerMessage.includes('pengeluaran') ||
            lowerMessage.includes('beli') || lowerMessage.includes('sisa')) {
            console.log("[DEBUG] Keyword keuangan terdeteksi. Mencoba akses database...");
            try {
                // mysql is now global

                // dbConfig is now defined in outer scope

                console.log("[DEBUG] Konfigurasi DB:", { ...dbConfig, password: '***' });

                console.log("[DEBUG] Konfigurasi DB Final:", { ...dbConfig, password: '***' });

                if (dbConfig.database) {
                    const connection = await mysql.createConnection(dbConfig);
                    console.log("[DEBUG] Koneksi DB berhasil. Mengambil data lengkap (Penjualan + Saldo)...");

                    // 1. Query Hari Ini (Penjualan) - WIB Timezone
                    const [rowsToday] = await connection.execute(
                        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue 
                         FROM transactions 
                         WHERE DATE(CONVERT_TZ(timestamp, '+00:00', '+07:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
                         AND deleted_at IS NULL`
                    );

                    // 2. Query Kemarin (Penjualan) - WIB Timezone
                    const [rowsYesterday] = await connection.execute(
                        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue 
                         FROM transactions 
                         WHERE DATE(CONVERT_TZ(timestamp, '+00:00', '+07:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+07:00')) - INTERVAL 1 DAY
                         AND deleted_at IS NULL`
                    );

                    // 3. Query Bulan Ini (Penjualan) - WIB Timezone
                    const [rowsMonth] = await connection.execute(
                        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue 
                         FROM transactions 
                         WHERE MONTH(CONVERT_TZ(timestamp, '+00:00', '+07:00')) = MONTH(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
                         AND YEAR(CONVERT_TZ(timestamp, '+00:00', '+07:00')) = YEAR(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
                         AND deleted_at IS NULL`
                    );

                    // 4. Query Saldo/Modal (Accounts)
                    let rowsAccounts = [];
                    try {
                        const [accRows] = await connection.execute(`SELECT name, balance FROM accounts`);
                        rowsAccounts = accRows;
                    } catch (accErr) {
                        console.warn("[DEBUG] Tabel accounts tidak ditemukan:", accErr.message);
                    }

                    // 5. Query Menu & Stok (Menu Items)
                    const [rowsMenu] = await connection.execute(
                        `SELECT name, price, stock FROM menu_items ORDER BY name ASC`
                    );

                    // 6. Query Bahan Baku Menipis (Raw Materials)
                    const [rowsMaterialsLow] = await connection.execute(
                        `SELECT name, current_stock, unit, stok_minimum 
                         FROM raw_materials 
                         WHERE current_stock <= stok_minimum 
                         ORDER BY current_stock ASC`
                    );

                    // 7. Query Pengeluaran (Expenses) - WIB Timezone
                    const [rowsExpenseToday] = await connection.execute(
                        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
                         WHERE DATE(CONVERT_TZ(date, '+00:00', '+07:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+07:00'))`
                    );
                    const [rowsExpenseMonth] = await connection.execute(
                        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
                         WHERE MONTH(CONVERT_TZ(date, '+00:00', '+07:00')) = MONTH(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
                         AND YEAR(CONVERT_TZ(date, '+00:00', '+07:00')) = YEAR(CONVERT_TZ(NOW(), '+00:00', '+07:00'))`
                    );

                    // 8. Query Karyawan (Employees)
                    let rowsEmployees = [];
                    try {
                        const [empRows] = await connection.execute(`SELECT name, position FROM employees`);
                        rowsEmployees = empRows;
                    } catch (empErr) {
                        console.warn("[DEBUG] Tabel employees tidak ditemukan:", empErr.message);
                    }

                    await connection.end();

                    const today = rowsToday[0];
                    const yesterday = rowsYesterday[0];
                    const month = rowsMonth[0];
                    const expenseToday = rowsExpenseToday[0].total;
                    const expenseMonth = rowsExpenseMonth[0].total;

                    // Format Account (Saldo)
                    let accountsInfo = "";
                    if (rowsAccounts.length > 0) {
                        accountsInfo += "\n=== 💰 SISA SALDO / MODAL ===\n";
                        rowsAccounts.forEach(acc => {
                            const formattedName = acc.name.replace(/_/g, ' ').toUpperCase();
                            accountsInfo += `- ${formattedName}: Rp ${parseInt(acc.balance).toLocaleString('id-ID')}\n`;
                        });
                    }

                    // Format Menu
                    let menuInfo = "\n=== 🍔 DAFTAR MENU & STOK ===\n";
                    if (rowsMenu.length > 0) {
                        rowsMenu.forEach(m => {
                            menuInfo += `- ${m.name}: Rp ${parseInt(m.price).toLocaleString('id-ID')} (Stok: ${m.stock})\n`;
                        });
                    } else {
                        menuInfo += "(Tidak ada data menu)\n";
                    }

                    // Format Low Stock Materials
                    let materialsInfo = "\n=== ⚠️ PERINGATAN STOK BAHAN BAKU (MENIPIS) ===\n";
                    if (rowsMaterialsLow.length > 0) {
                        rowsMaterialsLow.forEach(m => {
                            materialsInfo += `- ${m.name}: Sisa ${parseFloat(m.current_stock)} ${m.unit} (Min: ${parseFloat(m.stok_minimum)})\n`;
                        });
                    } else {
                        materialsInfo += "(Aman! Tidak ada bahan baku yang mendesak)\n";
                    }

                    // Format Employees
                    let employeeInfo = "\n=== 👥 DATA KARYAWAN ===\n";
                    if (rowsEmployees.length > 0) {
                        rowsEmployees.forEach(e => {
                            employeeInfo += `- ${e.name} (${e.position})\n`;
                        });
                    }

                    dynamicContext = `
                    [DATA REAL-TIME DARI DATABASE]
                    
                    === 📊 LAPORAN KEUANGAN ===
                    Hari Ini (${new Date().toLocaleDateString('id-ID')}):
                    - Transaksi Masuk: ${today.count}
                    - Omzet Penjualan: Rp ${parseInt(today.revenue).toLocaleString('id-ID')}
                    - Pengeluaran: Rp ${parseInt(expenseToday).toLocaleString('id-ID')}
                    - Profit Bersih (Est): Rp ${(today.revenue - expenseToday).toLocaleString('id-ID')}
                    
                    Kemarin:
                    - Transaksi: ${yesterday.count}
                    - Omzet: Rp ${parseInt(yesterday.revenue).toLocaleString('id-ID')}
                    
                    Bulan Ini:
                    - Transaksi: ${month.count}
                    - Omzet: Rp ${parseInt(month.revenue).toLocaleString('id-ID')}
                    - Pengeluaran: Rp ${parseInt(expenseMonth).toLocaleString('id-ID')}

                    ${accountsInfo}
                    ${menuInfo}
                    ${materialsInfo}
                    ${employeeInfo}
                    `;
                    console.log("[DEBUG] Context Data Terupdate Lengkap!");
                }
            } catch (err) {
                console.error("[DEBUG] Error fetching dynamic data:", err.message);
                dynamicContext = `[SISTEM INFO] Gagal mengambil data live: ${err.message}`;
            }
        }
        const finalContext = appDescription + "\n\n" + contextText + (dynamicContext ? "\n\n" + dynamicContext : "");

        // 3. System Prompt (Indonesian - GAUL STYLE & FLEXIBLE & ACTION CAPABLE)
        const systemPrompt = `
Anda adalah BerkahBot, asisten AI yang super pintar dan asik untuk aplikasi "Kasir Berkah88".

🎯 IDENTITAS ANDA:
- Nama: BerkahBot
- Kepribadian: Ramah, helpful, cerdas, humoris, dan santai
- Keahlian: Expert dalam semua fitur Kasir Berkah88, analisis bisnis, dan tips operasional

💬 STYLE BICARA:
1. **Santai & Gaul**: Gunakan bahasa percakapan sehari-hari yang luwes (aku/kamu, gue/lo).
2. **Ramah & Helpful**: Selalu berusaha membantu dengan nada positif dan supportif.
3. **Informatif**: Berikan jawaban yang lengkap, detail, dan mudah dipahami.
4. **Humoris**: Boleh bercanda sedikit biar gak kaku, tapi tetap profesional.
5. **Emoji**: Gunakan emoji biar chat terasa hidup dan engaging �✨.

🧠 KEMAMPUAN KHUSUS:

1. **PANDUAN FITUR**:
   Ketika user bertanya tentang cara menggunakan fitur, berikan:
   - Penjelasan fungsi fitur tersebut
   - Langkah-langkah penggunaan yang jelas
   - Tips & trik untuk memaksimalkan fitur
   - Route/URL untuk akses fitur (jika relevan)
   
   Contoh:
   User: "Gimana cara rekonsiliasi kas?"
   Anda: "Rekonsiliasi kas itu buat cocokkin uang fisik sama data di sistem, bro! 💰
   
   Caranya gampang:
   1. Buka menu Rekonsiliasi Kas (/cash-reconciliation)
   2. Hitung uang fisik kamu (Tunai, Transfer, Gojek)
   3. Input jumlahnya di form
   4. Sistem bakal hitung selisihnya otomatis
   5. Kalau ada selisih, tulis alasannya di kolom catatan
   6. Save deh!
   
   💡 Tips: Lakukan rekonsiliasi setiap akhir shift biar gak ribet tracking uangnya!"

2. **ANALISIS DATA REAL-TIME**:
   Prioritaskan data dari [DATA REAL-TIME] untuk menjawab pertanyaan tentang:
   - Stok menu & bahan baku → Cek "DAFTAR MENU & STOK" atau "PERINGATAN STOK BAHAN BAKU"
   - Keuangan & profit → Cek "LAPORAN KEUANGAN"
   - Karyawan → Cek "DATA KARYAWAN"
   - Transaksi → Cek data transaksi hari ini/kemarin/bulan ini
   
   Berikan insight dan rekomendasi berdasarkan data!

3. **REKOMENDASI PROAKTIF**:
   Jika melihat data yang perlu perhatian, berikan saran:
   - Stok menipis → Sarankan restock
   - Penjualan turun → Berikan tips marketing
   - Pengeluaran tinggi → Sarankan review budget
   - Menu tidak laku → Sarankan evaluasi menu

4. **TRANSAKSI VIA CHAT** (FITUR SPESIAL):
   Jika user ingin melakukan transaksi (misal: "Jual 2 Ayam", "Beli es teh 1"), 
   gunakan format JSON berikut:
   \`\`\`json
   {
     "command": "TRANSACTION",
     "items": [
       { "name": "nama menu (sesuaikan dgn database)", "qty": 1 }
     ]
   }
   \`\`\`

5. **TROUBLESHOOTING**:
   Bantu user mengatasi masalah umum:
   - Error saat transaksi
   - Data tidak muncul
   - Printer tidak berfungsi
   - Dll.

📋 ATURAN MENJAWAB:

✅ DO:
- Berikan jawaban yang lengkap dan detail
- Gunakan contoh konkret untuk memperjelas
- Sebutkan route/URL fitur jika relevan
- Berikan tips tambahan yang berguna
- Gunakan formatting (emoji, bullet points) untuk readability
- Jika user bertanya tentang orang (Wahyu, Alfin, dll), jawab dengan info yang ada di knowledge base
- Berikan insight dari data real-time jika tersedia

❌ DON'T:
- Jangan asal jawab kalau data tidak ada
- Jangan terlalu formal atau kaku
- Jangan berikan informasi yang tidak akurat
- Jangan skip detail penting

🎓 KNOWLEDGE BASE:
Anda memiliki pengetahuan lengkap tentang:
- Semua fitur website (Dashboard, Transaksi, Menu, Stok, Keuangan, Laporan, dll)
- Tips penggunaan untuk setiap role (Kasir, Admin, Owner)
- Cara akses fitur (Sidebar, Bottom Nav, Quick Actions)
- Role & Permission system
- Teknologi yang digunakan

📊 KONTEKS & DATA:
${finalContext}

💡 CONTOH INTERAKSI YANG BAIK:

User: "Stok apa aja yang menipis?"
Anda: "Oke bro, aku cek dulu ya... 🔍

[Berdasarkan data real-time]
Stok yang lagi menipis nih:
- Ayam: 5 pcs (batas minimum 10)
- Cabai: 2 kg (batas minimum 5)
- Es Batu: 3 pack (batas minimum 10)

⚠️ Rekomendasi:
1. Prioritas restock: Cabai & Es Batu (udah kritis banget!)
2. Ayam masih aman untuk 1-2 hari
3. Bisa langsung order via menu Stok Bahan Mentah (/raw-material-stock)

Mau aku bantu hitung berapa yang perlu dibeli? 😊"

User: "Gimana cara backup data?"
Anda: "Backup data itu penting banget buat jaga-jaga, bro! 💾

Caranya gampang:
1. Buka menu Pengaturan (/settings)
2. Scroll ke bagian 'Backup & Restore Data'
3. Klik tombol 'Backup Now'
4. File backup akan otomatis download
5. Simpan file backup di tempat aman (Google Drive, external disk, dll)

💡 Tips Pro:
- Lakukan backup minimal seminggu sekali
- Backup sebelum update sistem
- Simpan backup di 2 tempat berbeda buat extra safety

Kalau mau restore data, tinggal upload file backup-nya di menu yang sama! 👍"

Sekarang, jawab pertanyaan user dengan style yang sama! 🚀
`;

        // 4. Call AI Wrapper
        const reply = await callAI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ], { temperature: 0.7 });

        // --- CHECK FOR TRANSACTION COMMAND (JSON) ---
        if (reply.includes('"command": "TRANSACTION"')) {
            try {
                // Extract JSON from potential markdown blocks
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const commandObj = JSON.parse(jsonMatch[0]);
                    console.log("[DEBUG] Mendeteksi Command Transaksi:", commandObj);

                    if (commandObj.command === 'TRANSACTION') {
                        // Process the transaction
                        const result = await processTransaction(commandObj.items, dbConfig);

                        // Ask AI to confirm the result to the user
                        const confirmationCtx = `
                        [SYSTEM RESULT]
                        Status: ${result.status}
                        Detail: ${result.message}
                        Total: Rp ${result.total ? result.total.toLocaleString('id-ID') : 0}
                        Items: ${JSON.stringify(result.items)}
                        `;

                        const confirmReply = await callAI([
                            { role: 'system', content: systemPrompt + "\n\n" + confirmationCtx },
                            { role: 'user', content: "Berikan konfirmasi ke user berdasarkan [SYSTEM RESULT] di atas dengan gaya santai." }
                        ], { temperature: 0.7 });

                        // Use the confirmation reply instead of the JSON command
                        if (confirmReply) {
                            // Creating a fake object structure to match previous logic logic if needed, 
                            // OR just updating 'reply' variable directly since we send res.json({ reply })
                            // The previous code updated 'reply' variable.
                            // Let's stick to updating 'reply' variable.
                            const finalReply = confirmReply;
                            res.json({ reply: finalReply });
                            return;
                        }
                    }
                }
            } catch (e) {
                console.error("[DEBUG] Gagal memproses JSON transaksi:", e);
                res.json({ reply: "Waduh, aku bingung bacanya bro. Coba lagi ya!" });
                return;
            }
        }

        res.json({ reply });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- UNIFIED AI CALLER FUNCTION ---
async function callAI(messages, config = {}) {
    const temperature = config.temperature !== undefined ? config.temperature : 0.7; // Default to 0.7 if not provided
    const maxTokens = config.max_tokens || 500;

    try {
        // 1. GROQ IMPLEMENTATION
        if (AI_PROVIDER === 'groq') {
            const completion = await aiClient.chat.completions.create({
                messages: messages, // Standard format: [{role, content}]
                model: 'llama-3.3-70b-versatile',
                temperature: temperature,
                max_tokens: maxTokens,
            });
            return completion.choices[0]?.message?.content || "";
        }

        // 2. GEMINI IMPLEMENTATION
        else if (AI_PROVIDER === 'gemini') {
            const model = aiClient.genAI.getGenerativeModel({ model: aiClient.modelName });

            // Map messages to simple prompt string for Gemini Flash
            // Ideally we use startChat but for stateless request this is fine
            const systemMsg = messages.find(m => m.role === 'system')?.content || "";
            const userMsg = messages.find(m => m.role === 'user')?.content || "";

            const prompt = `${systemMsg}\n\nUser Question: ${userMsg}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        }

        // 3. OPENAI IMPLEMENTATION
        else if (AI_PROVIDER === 'openai') {
            const completion = await aiClient.chat.completions.create({
                messages: messages,
                model: 'gpt-4o-mini',
                temperature: temperature,
                max_tokens: maxTokens,
            });
            return completion.choices[0]?.message?.content || "";
        }
    } catch (err) {
        console.error(`[AI ERROR] Provider: ${AI_PROVIDER}`, err);
        return `Maaf bos, AI lagi pusing (${AI_PROVIDER} Error). Coba cek log.`;
    }

    return "Error: Unknown AI Provider configuration";
}


// --- HELPER FUNCTION: Process Transaction ---
async function processTransaction(itemsRequested, config) {
    const connection = await mysql.createConnection(config);
    let totalTransaction = 0;
    let successItems = [];
    let failedItems = [];

    try {
        await connection.beginTransaction();

        // 1. Get All Menu Items for matching
        const [menuRows] = await connection.execute('SELECT * FROM menu_items');

        for (const reqItem of itemsRequested) {
            // Simple Fuzzy Match (Case insensitive check)
            const matchedMenu = menuRows.find(m => m.name.toLowerCase().includes(reqItem.name.toLowerCase()));

            if (matchedMenu) {
                const qty = parseInt(reqItem.qty) || 1;
                const price = parseFloat(matchedMenu.price);
                const subtotal = price * qty;

                // Update Stock
                // NOTE: In strict logic we check stock first. For prototype we allow negative for now 
                // or we can implement strict check. Let's do simple deduction.
                await connection.execute('UPDATE menu_items SET stock = stock - ? WHERE id = ?', [qty, matchedMenu.id]);

                totalTransaction += subtotal;
                successItems.push({
                    id: matchedMenu.id,
                    name: matchedMenu.name,
                    price: price,
                    quantity: qty,
                    category: matchedMenu.category,
                    image_url: matchedMenu.image_url
                });
            } else {
                failedItems.push(reqItem.name);
            }
        }

        if (successItems.length > 0) {
            // Create Transaction Record
            const txnId = `TXN${Date.now()}`;
            const txnDate = new Date(); // Local time will be used by DB or adjusted

            // Insert into 'transactions' TABLE
            // Structure: id, timestamp, items (JSON), total, ppn, isEmployeeMeal, payment_method, cash_paid, change
            await connection.execute(
                `INSERT INTO transactions (id, timestamp, items, total, ppn, isEmployeeMeal, payment_method, cash_paid, \`change\`) 
                 VALUES (?, NOW(), ?, ?, 0, 0, 'Tunai', ?, 0)`,
                [txnId, JSON.stringify(successItems), totalTransaction, totalTransaction]
            );

            await connection.commit();
            return {
                status: 'SUCCESS',
                message: failedItems.length > 0 ? `Transaksi berhasil sebagian. Item tidak ditemukan: ${failedItems.join(', ')}` : 'Transaksi Berhasil!',
                total: totalTransaction,
                items: successItems
            };
        } else {
            await connection.rollback();
            return { status: 'FAILED', message: 'Tidak ada menu yang cocok ditemukan.' };
        }

    } catch (err) {
        await connection.rollback();
        console.error("Transaction Error:", err);
        return { status: 'ERROR', message: err.message };
    } finally {
        await connection.end();
    }
}


app.listen(PORT, () => {
    console.log(`Chatbot Server running on port ${PORT}`);
});
