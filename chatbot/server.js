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

        // Trigger keywords - Added modal/saldo/owner/kas
        if (lowerMessage.includes('jual') || lowerMessage.includes('sales') || lowerMessage.includes('laporan') || lowerMessage.includes('pendapatan') || lowerMessage.includes('uang') || lowerMessage.includes('transaksi') || lowerMessage.includes('revenue') || lowerMessage.includes('income') || lowerMessage.includes('modal') || lowerMessage.includes('saldo') || lowerMessage.includes('owner') || lowerMessage.includes('kas')) {
            console.log("[DEBUG] Keyword keuangan terdeteksi. Mencoba akses database...");
            try {
                const axios = require('axios');
                const path = require('path');
                const fs = require('fs');
                const mysql = require('mysql2/promise');

                // Load backend env
                const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
                console.log(`[DEBUG] Path .env backend: ${backendEnvPath}`);

                let dbConfig = {};
                if (fs.existsSync(backendEnvPath)) {
                    const envFile = fs.readFileSync(backendEnvPath, 'utf8');
                    const envConfig = {};
                    envFile.split('\n').forEach(line => {
                        const [key, val] = line.split('=');
                        if (key && val) envConfig[key.trim()] = val.trim();
                    });

                    dbConfig = {
                        host: envConfig.DB_HOST || 'localhost',
                        user: envConfig.DB_USER || 'root',
                        password: envConfig.DB_PASSWORD || '',
                        database: envConfig.DB_DATABASE || 'kasir_berkah88',
                        port: envConfig.DB_PORT || 3306
                    };
                    console.log("[DEBUG] Konfigurasi DB dimuat:", { ...dbConfig, password: '***' });
                } else {
                    console.error("[DEBUG] File .env backend TIDAK DITEMUKAN!");
                }

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
                    const [rowsAccounts] = await connection.execute(
                        `SELECT name, balance, type FROM accounts`
                    );

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

        // 3. System Prompt (Indonesian)
        const systemPrompt = `
Anda adalah asisten AI cerdas untuk aplikasi "Kasir Berkah88".
Tugas Anda adalah membantu pemilik toko dengan informasi seputar aplikasi dan data penjualan.

ATURAN PENTING:
1. Jawablah HANYA berdasarkan KONTEKS yang diberikan di bawah.
2. Jika ada [DATA REAL-TIME], prioritaskan data tersebut untuk menjawab pertanyaan tentang penjualan/pendapatan.
3. Gunakan Bahasa Indonesia yang santai, luwes, dan tidak kaku (boleh sedikit humor profesional).
4. Jika konteks tidak memuat jawaban, katakan dengan sopan bahwa Anda belum tahu hal itu.

KONTEKS:
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
