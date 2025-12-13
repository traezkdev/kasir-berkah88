const fs = require('fs');
const path = require('path');
const { pipeline } = require('@xenova/transformers');

// Use a simple JSON file as our database
const VECTOR_DB_PATH = path.join(__dirname, 'vector_db.json');
// Point to the main src directory (assuming chatbot is in /chatbot)
const SRC_DIR = path.join(__dirname, '..', 'src');

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

// Helper: Recursively get all files
function getFiles(dir, fileList = []) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                getFiles(filePath, fileList);
            } else {
                if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
                    fileList.push(filePath);
                }
            }
        }
    } catch (e) {
        console.warn(`Skipping directory ${dir}: ${e.message}`);
    }
    return fileList;
}

// Helper: Chunk text
function chunkText(text, size, overlap) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size - overlap) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}

// Helper: Clean content from code files
function extractTextFromCode(content) {
    // Very basic extraction: remove import statements, console.logs, and excess whitespace
    let text = content
        .replace(/import .* from .*/g, '')
        .replace(/console\.log\(.*\);/g, '')
        .replace(/<[^>]*>/g, ' ') // Strip JSX tags potentially
        .replace(/\s+/g, ' ')
        .trim();
    return text;
}

async function main() {
    console.log(`Scanning source files in: ${SRC_DIR}`);
    const files = getFiles(SRC_DIR);
    console.log(`Found ${files.length} source files.`);

    let docs = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const cleanText = extractTextFromCode(content);

        if (cleanText.length > 50) { // Only process meaningful files
            const relativePath = path.relative(path.join(__dirname, '..'), file);
            const chunks = chunkText(cleanText, CHUNK_SIZE, CHUNK_OVERLAP);
            chunks.forEach(chunk => {
                docs.push({ text: chunk, source: relativePath });
            });
        }
    }

    console.log(`Total chunks created: ${docs.length}`);

    if (docs.length === 0) {
        console.warn("No content found in src directory!");
        return;
    }

    // Generate Embeddings
    console.log('Loading embedding model...');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    console.log('Generating embeddings...');
    const db = [];

    let count = 0;
    for (const doc of docs) {
        const output = await extractor(doc.text, { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data);

        db.push({
            content: doc.text,
            metadata: { source: doc.source },
            embedding: embedding
        });

        count++;
        if (count % 10 === 0) process.stdout.write('.');
    }
    console.log('');

    // Save to JSON
    fs.writeFileSync(VECTOR_DB_PATH, JSON.stringify(db, null, 2));
    console.log(`Ingestion complete. Saved to vector_db.json`);
}

main();
