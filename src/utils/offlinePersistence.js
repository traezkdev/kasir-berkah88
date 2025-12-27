import Dexie from 'dexie';

// Initialize Dexie database
export const db = new Dexie('Berkah88OfflineDB');
db.version(1).stores({
    pendingTransactions: '++id, timestamp, status',
    pendingExpenses: '++id, date, status'
});

/**
 * Save a transaction to IndexedDB when offline
 * @param {Object} transaction - The transaction object
 */
export const savePendingTransaction = async (transaction) => {
    try {
        const id = await db.pendingTransactions.add({
            data: transaction,
            status: 'pending',
            timestamp: new Date().toISOString()
        });
        console.log('Transaction saved to offline storage, ID:', id);
        return id;
    } catch (error) {
        console.error('Error saving transaction to IndexedDB:', error);
        throw error;
    }
};

/**
 * Get all pending transactions that haven't been synced
 */
export const getPendingTransactions = async () => {
    return await db.pendingTransactions.where('status').equals('pending').toArray();
};

/**
 * Mark a transaction as synced
 * @param {number} id - The IndexedDB internal ID
 */
export const markTransactionAsSynced = async (id) => {
    return await db.pendingTransactions.update(id, { status: 'synced' });
};

/**
 * Save an expense to IndexedDB when offline
 * @param {Object} expense - The expense object
 */
export const savePendingExpense = async (expense) => {
    try {
        const id = await db.pendingExpenses.add({
            data: expense,
            status: 'pending',
            timestamp: new Date().toISOString()
        });
        console.log('Expense saved to offline storage, ID:', id);
        return id;
    } catch (error) {
        console.error('Error saving expense to IndexedDB:', error);
        throw error;
    }
};

/**
 * Get all pending expenses
 */
export const getPendingExpenses = async () => {
    return await db.pendingExpenses.where('status').equals('pending').toArray();
};

/**
 * Mark an expense as synced
 */
export const markExpenseAsSynced = async (id) => {
    return await db.pendingExpenses.update(id, { status: 'synced' });
};

export default {
    db,
    savePendingTransaction,
    getPendingTransactions,
    markTransactionAsSynced,
    savePendingExpense,
    getPendingExpenses,
    markExpenseAsSynced
};
