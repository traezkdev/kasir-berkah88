import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import { useTheme } from '../../contexts/ThemeContext';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MetricsCard from '../main-dashboard/components/MetricsCard'; // Re-use MetricsCard
import DepositModal from '../../components/ui/DepositModal'; // Import DepositModal
import ExpenseModal from '../../components/ui/ExpenseModal'; // Import ExpenseModal
import EditTransactionDescriptionModal from '../../components/ui/EditTransactionDescriptionModal'; // Import EditTransactionDescriptionModal
import ConfirmationModal from '../../components/ui/ConfirmationModal'; // Import ConfirmationModal
import { useToast } from '../../components/ui/ToastNotification'; // <--- Import useToast
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

const apiUrl = import.meta.env.VITE_API_URL;

const UangBisnis = ({ headerTitle }) => {
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

    // State untuk Pagination Transaksi Owner
    const [currentPage, setCurrentPage] = useState(1);
    const [transactionsPerPage] = useState(10); // 10 transaksi per halaman

    const { showToast } = useToast(); // <--- Panggil useToast

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
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Memuat data owner...</p>
                </div>
            </div>
        );
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
            {theme === 'default' && <OwnerNavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle || 'Uang Bisnis'} />}
            <main className={`pb-20 lg:pb-8 ${theme === 'default' ? 'pt-20 lg:pt-16' : ''}`}>
                <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
                    <div className="mb-8 lg:mb-10">
                        <div className="mb-4 hidden md:block">
                            <BreadcrumbNavigation paths={[{ name: 'Beranda Owner', path: '/owner-dashboard' }, { name: 'Uang Bisnis', path: '/uang-bisnis' }]} className="mb-4" />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-black text-text-primary mt-4 tracking-tighter uppercase lg:normal-case">
                            Riwayat Transaksi Owner
                        </h1>
                        <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 lg:hidden"></div>
                        <p className="text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
                            Cash flow Kerongkongan berkah 88
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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

                    <div className="flex flex-wrap justify-start gap-4 mb-8">
                        <Button variant="primary" iconName="Plus" onClick={handleAddDeposit}>
                            Tambah Deposit
                        </Button>
                        <Button variant="destructive" iconName="Minus" onClick={handleRecordExpense}>
                            Catat Pengeluaran
                        </Button>
                    </div>

                    {/* Transaction List */}
                    <div className="bg-card p-4 rounded-md shadow">
                        <h2 className="text-xl font-semibold text-text-primary mb-4">Riwayat Transaksi Owner</h2>
                        {ownerAccount?.transactions?.length > 0 ? (
                            <>
                                <ul className="divide-y divide-border">
                                    {currentTransactions.map((transaction) => (
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
                                            <div className="flex items-center gap-2"> {/* Container for amount and buttons */}
                                                <p className={`font-semibold ${transaction.type === 'deposit' ? 'text-success' : 'text-destructive'}`}>
                                                    {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                                </p>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(transaction)}>
                                                    <Icon name="Edit" className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(transaction)}>
                                                    <Icon name="Trash2" className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {totalPages > 1 && (
                                    <div className="flex justify-between items-center mt-4">
                                        <Button
                                            variant="outline"
                                            onClick={prevPage}
                                            disabled={currentPage === 1}
                                        >
                                            Sebelumnya
                                        </Button>
                                        <span className="text-sm text-text-secondary">
                                            Halaman {currentPage} dari {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            onClick={nextPage}
                                            disabled={currentPage === totalPages}
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                )}
                            </>
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

export default UangBisnis;
