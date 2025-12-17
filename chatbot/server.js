require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('@xenova/transformers');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files (like widget.js)
app.use(express.static(__dirname));

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

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
        `;

        // --- DYNAMIC DATA FETCHING ---
        let dynamicContext = "";
        const lowerMessage = message.toLowerCase();

        console.log(`[DEBUG] Menerima pesan: "${message}"`);

        // Trigger keywords
        if (lowerMessage.includes('jual') || lowerMessage.includes('sales') || lowerMessage.includes('laporan') || lowerMessage.includes('pendapatan') || lowerMessage.includes('uang') || lowerMessage.includes('transaksi') || lowerMessage.includes('revenue') || lowerMessage.includes('income') || lowerMessage.includes('modal') || lowerMessage.includes('saldo') || lowerMessage.includes('owner') || lowerMessage.includes('kas')) {
            console.log("[DEBUG] Keyword keuangan terdeteksi. Mencoba akses database...");
            try {
                const axios = require('axios');
                const path = require('path');
                const fs = require('fs');
                const mysql = require('mysql2/promise');

                // --- DB CONFIGURATION STRATEGY ---
                // 1. Try to read credentials from Standard Environment Variables (Process.env)
                // 2. Fallback to reading ../backend/.env file (Local Dev)

                let dbConfig = {
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_DATABASE,
                    port: process.env.DB_PORT
                };

                // Helper to safely parse env lines
                const parseEnvLine = (line) => {
                    const idx = line.indexOf('=');
                    if (idx === -1) return null;
                    const key = line.substring(0, idx).trim();
                    const val = line.substring(idx + 1).trim();
                    return { key, val };
                };

                // If any Env var is missing, try to load from backend .env
                if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
                    const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
                    console.log(`[DEBUG] Process Env belum lengkap. Mencoba fallback ke file: ${backendEnvPath}`);

                    if (fs.existsSync(backendEnvPath)) {
                        try {
                            const envFile = fs.readFileSync(backendEnvPath, 'utf8');
                            const envConfig = {};
                            envFile.split('\n').forEach(line => {
                                const parsed = parseEnvLine(line);
                                if (parsed) envConfig[parsed.key] = parsed.val;
                            });

                            // Merge File Config with existing config (Process Env wins if present)
                            dbConfig.host = dbConfig.host || envConfig.DB_HOST || 'localhost';
                            dbConfig.user = dbConfig.user || envConfig.DB_USER || 'root';
                            dbConfig.password = dbConfig.password || envConfig.DB_PASSWORD || '';
                            dbConfig.database = dbConfig.database || envConfig.DB_DATABASE || 'kasir';
                            dbConfig.port = dbConfig.port || envConfig.DB_PORT || 3306;

                            console.log("[DEBUG] Berhasil memuat credential dari file .env backend.");
                        } catch (e) {
                            console.warn("[DEBUG] Gagal membaca ../backend/.env", e.message);
                        }
                    } else {
                        console.warn("[DEBUG] File .env backend TIDAK DITEMUKAN dan Env Vars tidak lengkap.");
                    }
                }

                // Final check before connection
                dbConfig.host = dbConfig.host || 'localhost';
                dbConfig.user = dbConfig.user || 'root';
                dbConfig.password = dbConfig.password || '';
                dbConfig.database = dbConfig.database || 'kasir';
                dbConfig.port = dbConfig.port || 3306;

                console.log("[DEBUG] Konfigurasi DB Final:", { ...dbConfig, password: '***' });

                if (dbConfig.database) {
                    const connection = await mysql.createConnection(dbConfig);
                    console.log("[DEBUG] Koneksi DB berhasil. Mengambil data lengkap (Penjualan + Saldo)...");

                    // 1. Query Hari Ini
                    const [rowsToday] = await connection.execute(
                        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue 
                         FROM transactions WHERE DATE(timestamp) = CURDATE() AND deleted_at IS NULL`
                    );

                    // 2. Query Kemarin
                    const [rowsYesterday] = await connection.execute(
                        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue 
                         FROM transactions WHERE DATE(timestamp) = CURDATE() - INTERVAL 1 DAY AND deleted_at IS NULL`
                    );

                    // 3. Query Bulan Ini
                    const [rowsMonth] = await connection.execute(
                        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue 
                         FROM transactions 
                         WHERE MONTH(timestamp) = MONTH(CURDATE()) 
                         AND YEAR(timestamp) = YEAR(CURDATE()) 
                         AND deleted_at IS NULL`
                    );

                    // 4. Query Saldo/Modal (Accounts)
                    let rowsAccounts = [];
                    try {
                        const [accRows] = await connection.execute(`SELECT name, balance FROM accounts`);
                        rowsAccounts = accRows;
                    } catch (accErr) {
                        console.warn("[DEBUG] Tabel accounts tidak ditemukan atau error:", accErr.message);
                    }

                    await connection.end();

                    const today = rowsToday[0];
                    const yesterday = rowsYesterday[0];
                    const month = rowsMonth[0];

                    // Format Account Data
                    let accountsInfo = "";
                    if (rowsAccounts.length > 0) {
                        accountsInfo += "\n=== SISA SALDO / MODAL ===\n";
                        rowsAccounts.forEach(acc => {
                            const formattedName = acc.name.replace(/_/g, ' ').toUpperCase();
                            accountsInfo += `- ${formattedName}: Rp ${parseInt(acc.balance).toLocaleString('id-ID')}\n`;
                        });
                    }

                    dynamicContext = `
                    [DATA REAL-TIME DARI DATABASE]
                    
                    === LAPORAN PENJUALAN ===
                    Hari Ini (${new Date().toLocaleDateString('id-ID')}):
                    - Transaksi: ${today.count}
                    - Pendapatan: Rp ${parseInt(today.revenue).toLocaleString('id-ID')}
                    
                    Kemarin:
                    - Transaksi: ${yesterday.count}
                    - Pendapatan: Rp ${parseInt(yesterday.revenue).toLocaleString('id-ID')}
                    
                    Bulan Ini:
                    - Transaksi: ${month.count}
                    - Pendapatan: Rp ${parseInt(month.revenue).toLocaleString('id-ID')}
                    ${accountsInfo}
                    `;
                    console.log("[DEBUG] Context Data Terupdate:", dynamicContext);
                }
            } catch (err) {
                console.error("[DEBUG] Error fetching dynamic data:", err.message);
                dynamicContext = `[SISTEM INFO] Gagal mengambil data live: ${err.message}`;
            }
        }

        const finalContext = appDescription + "\n\n" + contextText + (dynamicContext ? "\n\n" + dynamicContext : "");

        // 3. System Prompt (Indonesian - GAUL STYLE)
        const systemPrompt = `
Anda adalah asisten AI yang asik dan cerdas untuk aplikasi "Kasir Berkah88".
Nama panggilan Anda: "BerkahBot".

STYLE BICARA:
1.  **Santai & Gaul**: Jangan kaku kayak robot. Pake bahasa percakapan sehari-hari (gue/lo boleh, aku/kamu boleh, tergantung user).
2.  **Ramah & Helpful**: Jawab dengan nada membantu tapi tetep santuy.
3.  **To The Point**: Gak usah bertele-tele, tapi tetep jelas.
4.  **Emoji**: Pake emoji secukupnya biar seru 😉.

TUGAS UTAMA:
- Bantuin owner toko ngecek laporan penjualan.
- Jelasin fitur aplikasi kalo ada yang nanya.

SUMBER DATA:
- Gunakan [DATA REAL-TIME] di bawah untuk jawab pertanyaan soal "berapa omzet", "laporan hari ini", dsb.
- Jika data 0 atau tidak ada, bilang aja "Belum ada transaksi nih hari ini, semangat bos!" atau sejenisnya.

KONTEKS PENGETAHUAN & DATA:
${finalContext}
`;

        // 4. Call Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 500,
        });

        const reply = chatCompletion.choices[0]?.message?.content || "Maaf, terjadi kesalahan.";
        res.json({ reply });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Chatbot Server running on port ${PORT}`);
});
