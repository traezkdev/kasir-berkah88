import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authFetch from '../utils/authFetch';
import { useTheme } from '../contexts/ThemeContext';
import NavigationHeader from '../components/ui/NavigationHeader';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import MetricsCard from './main-dashboard/components/MetricsCard'; // Re-use MetricsCard
import DepositModal from '../components/ui/DepositModal'; // Import DepositModal
import ExpenseModal from '../components/ui/ExpenseModal'; // Import ExpenseModal
import EditTransactionDescriptionModal from '../components/ui/EditTransactionDescriptionModal'; // Import EditTransactionDescriptionModal
import ConfirmationModal from '../components/ui/ConfirmationModal'; // Import ConfirmationModal
import AdminMobileHeader from '../components/ui/AdminMobileHeader';
import { useToast } from '../components/ui/ToastNotification';
import BreadcrumbNavigation from '../components/ui/BreadcrumbNavigation';
import LoadingScreen from '../components/ui/LoadingScreen';
import { jwtDecode } from 'jwt-decode';

const apiUrl = import.meta.env.VITE_API_URL;

const AdminUangBisnis = ({ headerTitle }) => { // Changed component name
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [ownerAccount, setOwnerAccount] = useState(null);
    const [lapakAccount, setLapakAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State untuk modal edit
    const [transactionToEdit, setTransactionToEdit] = useState(null); // State untuk transaksi yang diedit
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false); // State untuk konfirmasi hapus
    const [transactionToDelete, setTransactionToDelete] = useState(null); // State untuk transaksi yang dihapus
    const [userRole, setUserRole] = useState(null); // State for user role

    // State untuk Pagination Transaksi Owner
    const [currentPage, setCurrentPage] = useState(1);
    const [transactionsPerPage] = useState(10); // 10 transaksi per halaman

    const { showToast } = useToast(); // <--- Panggil useToast

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUserRole(decodedToken.role.trim()); // Trim whitespace
            } catch (error) {
                console.error("Error decoding token in AdminUangBisnis:", error);
                setUserRole(null); // Clear role if decoding fails
            }
        }
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })?.format(amount);
    };

    const fetchOwnerAccountData = async () => {
        setError(null); // Clear previous errors
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/owner_deposit`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Failed to fetch owner account data. Status: ${response.status}`);
            }
            const data = await response.json();
            setOwnerAccount(data.data);
        } catch (err) {
            console.error("Error fetching owner account data:", err.message);
            setError(err.message);
        }
    };

    const fetchLapakAccountData = async () => {
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/lapak_deposit`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Failed to fetch lapak account data for owner dashboard. Status: ${response.status}`);
            }
            const data = await response.json();
            setLapakAccount(data.data);
        } catch (err) {
            console.error("Error fetching lapak account data for owner dashboard:", err.message);
            // We don't set global error state here as owner dashboard should still load even if lapak fails
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            await Promise.all([
                fetchOwnerAccountData(),
                fetchLapakAccountData()
            ]);
            setLoading(false);
        };
        fetchAllData();
    }, []);


    const handleAddDeposit = () => {
        setIsDepositModalOpen(true);
    };

    const handleRecordExpense = () => {
        setIsExpenseModalOpen(true);
    };

    const handleSaveDeposit = async (amount, description, date) => {
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/deposit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account_name: 'owner_deposit',
                    amount: amount,
                    description: description,
                    created_at: date // Pass user's local date
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal menambahkan deposit');
            }
            showToast('Deposit berhasil ditambahkan!', 'success');
            setIsDepositModalOpen(false);
            fetchOwnerAccountData(); // Refresh data
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            console.error("Error saving deposit:", err);
        }
    };

    const handleSaveExpense = async (amount, description, date) => {
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/expense`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account_name: 'owner_deposit',
                    amount: amount,
                    description: description,
                    created_at: date // Pass user's local date
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal mencatat pengeluaran');
            }
            showToast('Pengeluaran berhasil dicatat!', 'success');
            setIsExpenseModalOpen(false);
            fetchOwnerAccountData(); // Refresh data
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            console.error("Error saving expense:", err);
        }
    };

    // --- Edit and Delete Transaction Handlers ---
    const handleEditClick = (transaction) => {
        setTransactionToEdit(transaction);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (transaction) => {
        setTransactionToDelete(transaction);
        setIsDeleteConfirmOpen(true);
    };

    const handleSaveEditedDescription = async (id, newDescription, newAmount, newDate) => {
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/transactions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: newDescription,
                    amount: newAmount,
                    date: newDate
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal mengedit transaksi');
            }
            showToast('Transaksi berhasil diperbarui!', 'success');
            setIsEditModalOpen(false);
            setTransactionToEdit(null);
            fetchOwnerAccountData(); // Refresh data
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            console.error("Error editing transaction:", err);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/transactions/${transactionToDelete.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal menghapus transaksi');
            }
            showToast('Transaksi berhasil dihapus!', 'success');
            setIsDeleteConfirmOpen(false);
            setTransactionToDelete(null);
            fetchOwnerAccountData(); // Refresh data
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            console.error("Error deleting transaction:", err);
        }
    };
    // --- End Edit and Delete Transaction Handlers ---

    // Logika Pagination
    const indexOfLastTransaction = currentPage * transactionsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
    const currentTransactions = ownerAccount?.transactions?.slice(indexOfFirstTransaction, indexOfLastTransaction) || [];
    const totalPages = Math.ceil((ownerAccount?.transactions?.length || 0) / transactionsPerPage);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    if (loading) {
        return <LoadingScreen message="Memuat Saldo & Transaksi" submessage="Menyinkronkan data keuangan owner dan lapak" />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center p-4">
                    <p className="text-red-500 mb-4">Error: {error}</p>
                    <Button onClick={fetchOwnerAccountData}>Coba Lagi</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
            {theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle || 'Uang Bisnis'} hideMobileHeader={true} />}
            <main className={`pb-20 lg:pb-8 ${theme === 'default' ? 'pt-0 lg:pt-16' : ''}`}>
                {theme === 'default' && (
                    <AdminMobileHeader
                        title="Uang Bisnis"
                        subtitle="Cash Flow Warung"
                        badgeText="Keuangan Bisnis"
                        stickyTitle={headerTitle || 'Uang Bisnis'}
                        decorativeIcon="Wallet"
                        actions={userRole === 'owner' ? [
                            { label: 'Tambah Deposit', icon: 'Plus', onClick: handleAddDeposit },
                            { label: 'Catat Keluar', icon: 'Minus', onClick: handleRecordExpense }
                        ] : []}
                    />
                )}

                <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
                    <div className={`mb-8 lg:mb-10 ${theme === 'default' ? 'mt-4' : ''} hidden lg:block`}>
                        <div className="mb-4 hidden md:block">
                            <BreadcrumbNavigation />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                            Riwayat Transaksi Owner
                        </h1>
                        <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 lg:hidden"></div>
                        <p className="text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
                            Cash flow Kerongkongan berkah 88
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 -mt-12 lg:mt-0 relative z-20">
                        <MetricsCard
                            title="Saldo Owner"
                            value={formatCurrency(ownerAccount?.account?.balance || 0)}
                            icon="Wallet"
                            color="success"
                            description="Total dana tersedia untuk owner"
                        />
                        <MetricsCard
                            title="Saldo Lapak"
                            value={formatCurrency(lapakAccount?.account?.balance || 0)}
                            icon="Wallet"
                            color="info"
                            description="Total dana tersedia untuk operasional lapak"
                        />
                    </div>

                    {userRole === 'owner' && (
                        <div className="hidden lg:flex flex-wrap justify-start gap-4 mb-8">
                            <Button variant="primary" iconName="Plus" onClick={handleAddDeposit}>
                                Tambah Deposit
                            </Button>
                            <Button variant="destructive" iconName="Minus" onClick={handleRecordExpense}>
                                Catat Pengeluaran
                            </Button>
                        </div>
                    )}

                    {/* Transaction List */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Riwayat Transaksi Owner</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Catatan dana keluar masuk owner</p>
                            </div>
                        </div>

                        <div className="relative min-h-[400px]">
                            {ownerAccount?.transactions?.length > 0 ? (
                                <>
                                    <ul className="space-y-4">
                                        {currentTransactions.map((transaction) => (
                                            <li key={transaction.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md group">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${transaction.type === 'deposit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                            <Icon name={transaction.type === 'deposit' ? 'TrendingUp' : 'TrendingDown'} size={24} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight truncate">
                                                                {transaction.type === 'deposit' ? 'Deposit Masuk' : 'Pengeluaran Owner'}
                                                            </h4>
                                                            {/* Premium Record Badge */}
                                                            <div className={`mt-2 px-3 py-2 rounded-xl border flex items-center gap-2.5 ${transaction.type === 'deposit' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/20' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/20'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${transaction.type === 'deposit' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                                                                <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${transaction.type === 'deposit' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                                                    {transaction.description || 'Tanpa Catatan'}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50">
                                                                    <Icon name="Calendar" size={12} className="text-gray-400" />
                                                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                                                        {new Date(transaction.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50">
                                                                    <Icon name="Clock" size={12} className="text-gray-400" />
                                                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                                                        {new Date(transaction.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                                                    • {transaction.created_by_username}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-6 pl-16 sm:pl-0 border-t border-gray-50 dark:border-slate-800 pt-3 sm:pt-0 sm:border-t-0">
                                                        <div className="text-right">
                                                            <p className={`text-lg font-black tracking-tighter ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                                            </p>
                                                        </div>
                                                        {userRole === 'owner' && (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEditClick(transaction)}
                                                                    className="h-9 w-9 p-0 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 rounded-xl transition-all"
                                                                >
                                                                    <Icon name="Edit" size={16} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteClick(transaction)}
                                                                    className="h-9 w-9 p-0 bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 rounded-xl transition-all"
                                                                >
                                                                    <Icon name="Trash2" size={16} />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Premium Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4 px-2">
                                            <div className="flex items-center gap-2 order-2 sm:order-1">
                                                <Button
                                                    onClick={prevPage}
                                                    disabled={currentPage === 1}
                                                    variant="ghost"
                                                    className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 group"
                                                >
                                                    <Icon name="ChevronLeft" size={16} className="transition-transform group-hover:-translate-x-1" />
                                                    Sebelumnya
                                                </Button>
                                                <Button
                                                    onClick={nextPage}
                                                    disabled={currentPage === totalPages}
                                                    variant="ghost"
                                                    className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 group"
                                                >
                                                    Berikutnya
                                                    <Icon name="ChevronRight" size={16} className="transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-3 order-1 sm:order-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    Halaman
                                                </span>
                                                <div className="flex items-center justify-center h-8 px-4 rounded-lg bg-blue-600 text-white font-mono font-black text-sm shadow-lg shadow-blue-500/30">
                                                    {currentPage}
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    Dari {totalPages}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
                                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-6">
                                        <Icon name="Inbox" size={40} className="text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Belum Ada Transaksi</h3>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 text-center max-w-[280px]">
                                        Silakan tambah deposit atau catat pengeluaran untuk melihat riwayat.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <DepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                onSave={handleSaveDeposit}
                accountType="owner"
            />
            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                accountType="owner"
            />
            <EditTransactionDescriptionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveEditedDescription}
                transaction={transactionToEdit}
            />
            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Transaksi"
                message={`Apakah Anda yakin ingin menghapus transaksi "${transactionToDelete?.description || transactionToDelete?.type}" senilai ${formatCurrency(transactionToDelete?.amount || 0)}?`}
                confirmText="Hapus"
                isDestructive={true}
            />
        </div>
    );
};

export default AdminUangBisnis;
