import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MetricsCard from '../main-dashboard/components/MetricsCard'; // Re-use MetricsCard
import DepositModal from '../../components/ui/DepositModal'; // Import DepositModal
import ExpenseModal from '../../components/ui/ExpenseModal'; // Import ExpenseModal

const apiUrl = import.meta.env.VITE_API_URL;

const LapakDeposit = ({ headerTitle }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [lapakAccount, setLapakAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })?.format(amount);
    };

    const fetchLapakAccountData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/lapak_deposit`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch lapak account data');
            }
            const data = await response.json();
            setLapakAccount(data.data);
        } catch (err) {
            console.error("Error fetching lapak account data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLapakAccountData();
    }, []);

    const handleAddDeposit = () => {
        setIsDepositModalOpen(true);
    };

    const handleRecordExpense = () => {
        setIsExpenseModalOpen(true);
    };

    const handleSaveDeposit = async (amount, description) => {
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/deposit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account_name: 'lapak_deposit', // <--- Perubahan di sini
                    amount: amount,
                    description: description,
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal menambahkan deposit');
            }
            alert('Deposit berhasil ditambahkan!');
            setIsDepositModalOpen(false);
            fetchLapakAccountData(); // Refresh data
        } catch (err) {
            alert(`Error: ${err.message}`);
            console.error("Error saving deposit:", err);
        }
    };

    const handleSaveExpense = async (amount, description) => {
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/expense`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account_name: 'lapak_deposit', // <--- Perubahan di sini
                    amount: amount,
                    description: description,
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal mencatat pengeluaran');
            }
            alert('Pengeluaran berhasil dicatat!');
            setIsExpenseModalOpen(false);
            fetchLapakAccountData(); // Refresh data
        } catch (err) {
            alert(`Error: ${err.message}`);
            console.error("Error saving expense:", err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Memuat data lapak...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center p-4">
                    <p className="text-red-500 mb-4">Error: {error}</p>
                    <Button onClick={fetchLapakAccountData}>Coba Lagi</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
            {theme === 'default' && <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle || 'Pengeluaran Lapak'} />}
            <main className={`pb-20 lg:pb-8 ${theme === 'default' ? 'pt-16' : ''}`}>
                <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
                    <div className="mb-6 mt-4">
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                            Pengeluaran Lapak
                        </h1>
                        <p className="text-text-secondary mt-1">
                            Kelola uang masuk dan keluar untuk operasional lapak di sini.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <MetricsCard
                            title="Saldo Lapak"
                            value={formatCurrency(lapakAccount?.account?.balance || 0)}
                            icon="Wallet"
                            color="info"
                            description="Total dana tersedia untuk operasional lapak"
                        />
                        {/* Other lapak-specific metrics can go here */}
                    </div>

                    <div className="flex gap-4 mb-8">
                        <Button variant="primary" iconName="Plus" onClick={handleAddDeposit}>
                            Tambah Deposit
                        </Button>
                        <Button variant="destructive" iconName="Minus" onClick={handleRecordExpense}>
                            Catat Pengeluaran
                        </Button>
                    </div>

                    {/* Transaction List */}
                    <div className="bg-card p-4 rounded-md shadow">
                        <h2 className="text-xl font-semibold text-text-primary mb-4">Riwayat Transaksi Lapak</h2>
                        {lapakAccount?.transactions?.length > 0 ? (
                            <ul className="divide-y divide-border">
                                {lapakAccount.transactions.map((transaction) => (
                                    <li key={transaction.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="text-text-primary font-medium">
                                                {transaction.type === 'deposit' ? 'Deposit masuk' : 'Pengeluaran'}
                                            </p>
                                            <p className="text-sm text-text-secondary">
                                                {transaction.description || 'Tidak ada deskripsi'}
                                            </p>
                                            <p className="text-xs text-text-tertiary">
                                                {new Date(transaction.created_at).toLocaleString()} oleh {transaction.created_by_username}
                                            </p>
                                        </div>
                                        <p className={`font-semibold ${transaction.type === 'deposit' ? 'text-success' : 'text-destructive'}`}>
                                            {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-text-secondary">Belum ada transaksi.</p>
                        )}
                    </div>
                </div>
            </main>

            <DepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                onSave={handleSaveDeposit}
                accountType="lapak"
            />
            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                accountType="lapak"
            />
        </div>
    );
};

export default LapakDeposit;
