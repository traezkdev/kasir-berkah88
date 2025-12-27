import React, { useState, useEffect, useCallback } from 'react';
import { getPendingTransactions, markTransactionAsSynced, getPendingExpenses, markExpenseAsSynced } from '../utils/offlinePersistence';
import authFetch from '../utils/authFetch';
import AppIcon from './AppIcon';
import { useToast } from './ui/ToastNotification';

const apiUrl = import.meta.env.VITE_API_URL;

const OfflineSyncManager = () => {
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const { showToast } = useToast();

    const updatePendingCount = useCallback(async () => {
        const transactions = await getPendingTransactions();
        const expenses = await getPendingExpenses();
        setPendingCount(transactions.length + expenses.length);
    }, []);

    const syncData = useCallback(async () => {
        if (isSyncing || !navigator.onLine) return;

        const transactions = await getPendingTransactions();
        const expenses = await getPendingExpenses();

        if (transactions.length === 0 && expenses.length === 0) return;

        setIsSyncing(true);
        let successCount = 0;
        let failedCount = 0;

        // Sync Transactions
        for (const item of transactions) {
            try {
                const response = await authFetch(`${apiUrl}/api/transactions/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.data),
                });

                if (response.ok) {
                    await markTransactionAsSynced(item.id);
                    successCount++;
                } else {
                    failedCount++;
                }
            } catch (err) {
                console.error('Failed to sync transaction:', err);
                failedCount++;
            }
        }

        // Sync Expenses
        for (const item of expenses) {
            try {
                const response = await authFetch(`${apiUrl}/api/expenses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.data),
                });

                if (response.ok) {
                    await markExpenseAsSynced(item.id);
                    successCount++;
                } else {
                    failedCount++;
                }
            } catch (err) {
                console.error('Failed to sync expense:', err);
                failedCount++;
            }
        }

        setIsSyncing(false);
        updatePendingCount();

        if (successCount > 0) {
            showToast(`${successCount} data berhasil disinkronisasi!`, 'success');
        }
        if (failedCount > 0) {
            showToast(`${failedCount} data gagal disinkronisasi. Akan dicoba lagi nanti.`, 'error');
        }
    }, [isSyncing, updatePendingCount, showToast]);

    useEffect(() => {
        updatePendingCount();

        // Check for sync when online
        window.addEventListener('online', syncData);

        // Periodic check
        const interval = setInterval(() => {
            updatePendingCount();
            if (navigator.onLine) syncData();
        }, 30000); // Every 30 seconds

        return () => {
            window.removeEventListener('online', syncData);
            clearInterval(interval);
        };
    }, [syncData, updatePendingCount]);

    if (pendingCount === 0) return null;

    return (
        <div className="fixed bottom-20 right-4 z-[9999] md:bottom-8">
            <button
                onClick={syncData}
                disabled={isSyncing || !navigator.onLine}
                className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${!navigator.onLine
                        ? 'bg-gray-500 text-white cursor-not-allowed'
                        : 'bg-primary text-white hover:scale-105 active:scale-95'
                    }`}
            >
                <AppIcon
                    name="RefreshCw"
                    className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                />
                <span className="text-sm font-bold">
                    {isSyncing ? 'Menyinkronkan...' : `${pendingCount} Data Tertunda`}
                    {!navigator.onLine && ' (Offline)'}
                </span>
            </button>
        </div>
    );
};

export default OfflineSyncManager;
