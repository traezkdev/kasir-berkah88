const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixProductionBalance() {
    console.log('--- STARTING PRODUCTION BALANCE REPAIR ---');
    
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT || 3306
    });

    try {
        const [accounts] = await pool.query("SELECT id, name, balance FROM accounts");
        
        for (const acc of accounts) {
            console.log(`Checking account: ${acc.name} (Current reported balance: ${acc.balance})`);
            
            // Hitung total asli dari riwayat transaksi
            const [at] = await pool.query(
                "SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as total FROM account_transactions WHERE account_id = ?",
                [acc.id]
            );
            
            const transactionSum = parseFloat(at[0].total || 0);
            const currentBalance = parseFloat(acc.balance);
            
            if (Math.abs(currentBalance - transactionSum) > 0.01) {
                console.log(`[!!!] DISCREPANCY FOUND in ${acc.name}!`);
                console.log(`    System Balance: ${currentBalance}`);
                console.log(`    Transaction Sum: ${transactionSum}`);
                console.log(`    Difference: ${currentBalance - transactionSum}`);
                
                // Eksekusi perbaikan
                await pool.query("UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [transactionSum, acc.id]);
                console.log(`    SUCCESS: Adjusted ${acc.name} balance to match transaction history.`);
            } else {
                console.log(`    [OK] ${acc.name} is already synced.`);
            }
        }
        
        console.log('--- REPAIR COMPLETE ---');
    } catch (error) {
        console.error('ERROR during repair:', error);
    } finally {
        await pool.end();
    }
}

fixProductionBalance();
