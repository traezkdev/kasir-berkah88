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
import DateRangeSelector from '../business-reports/components/DateRangeSelector'; // Import DateRangeSelector
import { formatInTimeZone } from 'date-fns-tz'; // Import formatInTimeZone

const apiUrl = import.meta.env.VITE_API_URL;

const OwnerDashboard = ({ headerTitle }) => {
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

    // New states for Business Reports
    const [selectedDateRange, setSelectedDateRange] = useState({
        startDate: new Date(),
        endDate: new Date(),
        range: 'today'
    });
    const [transactions, setTransactions] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [settings, setSettings] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [isLoadingReport, setIsLoadingReport] = useState(true);

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

        // Fetch data for business reports
        const fetchReportInitialData = async () => {
            setIsLoadingReport(true);
            const token = localStorage.getItem('token');
            if (!token) {
                // console.log("DEBUG OwnerDashboard: Token Missing for fetchReportInitialData. Skipping fetch.");
                setIsLoadingReport(false);
                return;
            }
            try {
                // console.log("DEBUG OwnerDashboard: Token before fetchReportInitialData calls:", token ? "Present" : "Missing");
                const [transRes, menuRes, expenseRes, settingsRes] = await Promise.all([
                    authFetch(`${apiUrl}/api/transactions/all`),
                    authFetch(`${apiUrl}/api/menu-items/all`),
                    authFetch(`${apiUrl}/api/expenses/all`),
                    authFetch(`${apiUrl}/api/all-settings`)
                ]);

                // Check responses for errors immediately
                if (!transRes.ok) {
                    const errData = await transRes.json();
                    throw new Error(errData.error || `Failed to fetch transactions. Status: ${transRes.status}`);
                }
                if (!menuRes.ok) {
                    const errData = await menuRes.json();
                    throw new Error(errData.error || `Failed to fetch menu items. Status: ${menuRes.status}`);
                }
                if (!expenseRes.ok) {
                    const errData = await expenseRes.json();
                    throw new Error(errData.error || `Failed to fetch expenses. Status: ${expenseRes.status}`);
                }
                if (!settingsRes.ok) {
                    const errData = await settingsRes.json();
                    throw new Error(errData.error || `Failed to fetch settings. Status: ${settingsRes.status}`);
                }

                const transData = await transRes.json();
                const menuData = await menuRes.json();
                const expenseData = await expenseRes.json();
                const settingsData = await settingsRes.json();

                if (transData.message === 'success') {
                    setTransactions(transData.data.map(t => ({ ...t, timestamp: new Date(t.timestamp) })));
                }
                if (menuData.message === 'success') {
                    setMenuItems(menuData.data);
                }
                if (expenseData.message === 'success') {
                    setExpenses(expenseData.data.map(e => ({ ...e, date: new Date(e.date) })));
                }
                if (settingsData.message === 'success') {
                    setSettings(settingsData.data);
                }
            } catch (error) {
                console.error("Failed to fetch report initial data:", error);
            } finally {
                setIsLoadingReport(false);
            }
        };
        fetchReportInitialData();
    }, []);

    useEffect(() => {
        if (isLoadingReport || loading) return; // Don't process until all initial data is loaded

        const processReportData = () => {
            const filterByDate = (item) => {
                const itemDate = new Date(item.timestamp || item.date);
                const startDate = new Date(selectedDateRange.startDate);
                const endDate = new Date(selectedDateRange.endDate);

                const formattedItemDate = formatInTimeZone(itemDate, 'Asia/Jakarta', 'yyyy-MM-dd');
                const formattedStartDate = formatInTimeZone(startDate, 'Asia/Jakarta', 'yyyy-MM-dd');
                const formattedEndDate = formatInTimeZone(endDate, 'Asia/Jakarta', 'yyyy-MM-dd');

                return formattedItemDate >= formattedStartDate && formattedItemDate <= formattedEndDate;
            };

            const filteredTransactions = transactions.filter(filterByDate);
            const filteredExpenses = expenses.filter(filterByDate);

            // Sales Report Data
            const totalRevenue = filteredTransactions.filter(t => t.payment_method !== 'Makan Karyawan').reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
            const totalTransactions = filteredTransactions.length;
            const averageOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

            const topItems = filteredTransactions
                .flatMap(t => {
                    try {
                        const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
                        return Array.isArray(items) ? items : [];
                    } catch (e) {
                        console.error("Failed to parse transaction items:", e);
                        return [];
                    }
                })
                .reduce((acc, item) => {
                    const existing = acc.find(i => i.name === item.name);
                    const itemPrice = parseFloat(item.price || 0);
                    if (existing) {
                        existing.sold += item.quantity;
                        existing.revenue += item.quantity * itemPrice;
                    } else {
                        acc.push({ name: item.name, sold: item.quantity, revenue: item.quantity * itemPrice });
                    }
                    return acc;
                }, [])
                .sort((a, b) => b.revenue - a.revenue);

            // Expense Report Data
            const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

            // Combined Analytics Data
            const initialCapital = parseFloat(settings?.initial_capital || 0);
            const netProfit = totalRevenue - totalExpenses;
            const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
            const capitalGrowth = initialCapital > 0 ? (netProfit / initialCapital) * 100 : 0;

            setReportData({
                sales: {
                    totalRevenue,
                    totalTransactions,
                    averageOrder,
                    topItems,
                    initialCapital,
                },
                expenses: {
                    summary: {
                        totalExpenses,
                    },
                },
                combined: {
                    netProfit,
                    profitMargin,
                    capitalGrowth,
                }
            });
        };

        processReportData();
    }, [transactions, menuItems, expenses, settings, selectedDateRange, isLoadingReport, loading]);


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
                    account_name: 'owner_deposit',
                    amount: amount,
                    description: description,
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

    const handleSaveExpense = async (amount, description) => {
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

    const handleSaveEditedDescription = async (id, newDescription) => {
        try {
            const response = await authFetch(`${apiUrl}/api/accounts/transactions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ description: newDescription }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal mengedit deskripsi transaksi');
            }
            showToast('Deskripsi transaksi berhasil diperbarui!', 'success');
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

    const handleDateRangeChange = (dateRange) => {
        setSelectedDateRange(dateRange);
    };

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
            <OwnerNavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle || 'Dashboard Owner'} />
            <main className={`pb-20 lg:pb-8 pt-16`}>
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="mb-6 mt-4">
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                            Dashboard Owner
                        </h1>
                        <p className="text-text-secondary mt-1">
                            Cash flow Kerongkongan berkah 88
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
                        {/* Other owner-specific metrics can go here */}
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

                    {/* Report Section */}
                    <div className="mt-8 bg-card p-4 rounded-md shadow">
                        <h2 className="text-xl font-semibold text-text-primary mb-4">Laporan & Analisis Bisnis</h2>

                        <div className="mb-6">
                            <DateRangeSelector
                                onDateRangeChange={handleDateRangeChange}
                                selectedRange={selectedDateRange?.range}
                            />
                        </div>

                        {(isLoadingReport || !reportData) ? (
                            <div className="text-center py-8">
                                <p className="text-text-secondary">Memuat data laporan...</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Sales Report Section */}
                                <div className="bg-background rounded-md p-4 border border-border">
                                    <div className="flex items-center mb-4">
                                        <Icon name="TrendingUp" className="text-success mr-2 h-5 w-5" />
                                        <h3 className="text-lg font-semibold text-text-primary">Laporan Penjualan</h3>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-4">Analisis pendapatan dan tren penjualan</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-card p-3 rounded-md border border-border">
                                            <p className="text-xs text-text-secondary">Total Penjualan</p>
                                            <p className="text-lg font-bold text-text-primary">
                                                {formatCurrency(reportData.sales.totalRevenue)}
                                            </p>
                                        </div>
                                        <div className="bg-card p-3 rounded-md border border-border">
                                            <p className="text-xs text-text-secondary">Total Transaksi</p>
                                            <p className="text-lg font-bold text-text-primary">
                                                {reportData.sales.totalTransactions}
                                            </p>
                                        </div>
                                        <div className="bg-card p-3 rounded-md border border-border">
                                            <p className="text-xs text-text-secondary">Rata-rata Order</p>
                                            <p className="text-lg font-bold text-text-primary">
                                                {formatCurrency(reportData.sales.averageOrder)}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-md font-medium text-text-primary flex items-center mb-3">
                                            <Icon name="Star" className="text-accent mr-2 h-4 w-4" />
                                            Menu Terlaris
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th className="text-left py-2 text-text-secondary font-medium">Nama Menu</th>
                                                        <th className="text-right py-2 text-text-secondary font-medium">Terjual</th>
                                                        <th className="text-right py-2 text-text-secondary font-medium">Pendapatan</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.sales.topItems && reportData.sales.topItems.map((item, index) => (
                                                        <tr key={index} className="border-b border-border-light">
                                                            <td className="py-2 text-text-primary">{item.name}</td>
                                                            <td className="py-2 text-right font-mono text-text-primary">{item.sold}</td>
                                                            <td className="py-2 text-right font-mono text-text-primary">{formatCurrency(item.revenue)}</td>
                                                        </tr>
                                                    ))}
                                                    {(!reportData.sales.topItems || reportData.sales.topItems.length === 0) && (
                                                        <tr>
                                                            <td colSpan="3" className="text-center py-4 text-text-secondary">Tidak ada data penjualan pada periode ini.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Combined Analytics Section */}
                                <div className="bg-background rounded-md p-4 border border-border">
                                    <div className="flex items-center mb-4">
                                        <Icon name="BarChart3" className="text-accent mr-2 h-5 w-5" />
                                        <h3 className="text-lg font-semibold text-text-primary">Analisis Gabungan</h3>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-4">Ringkasan performa bisnis dan indikator kunci</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-card p-3 rounded-md border border-border">
                                            <p className="text-xs text-text-secondary">Laba Bersih</p>
                                            <p className="text-lg font-bold text-text-primary">
                                                {formatCurrency(reportData.combined.netProfit)}
                                            </p>
                                        </div>
                                        <div className="bg-card p-3 rounded-md border border-border">
                                            <p className="text-xs text-text-secondary">Margin Keuntungan</p>
                                            <p className="text-lg font-bold text-text-primary">
                                                {reportData.combined.profitMargin.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="bg-card p-3 rounded-md border border-border">
                                            <p className="text-xs text-text-secondary">Pertumbuhan Modal</p>
                                            <p className="text-lg font-bold text-text-primary">
                                                {reportData.combined.capitalGrowth.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-md font-medium text-text-primary flex items-center mb-3">
                                            <Icon name="Wallet" className="text-primary mr-2 h-4 w-4" />
                                            Ringkasan Arus Kas
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { type: 'Modal Awal', amount: formatCurrency(reportData.sales.initialCapital || 0), icon: 'Landmark', color: 'text-info', bgColor: 'bg-blue-100 dark:bg-blue-900' },
                                                { type: 'Pemasukan', amount: formatCurrency(reportData.sales.totalRevenue), icon: 'TrendingUp', color: 'text-success', bgColor: 'bg-green-100 dark:bg-green-900' },
                                                { type: 'Pengeluaran', amount: formatCurrency(reportData.expenses.summary.totalExpenses), icon: 'TrendingDown', color: 'text-destructive', bgColor: 'bg-red-100 dark:bg-red-900' },
                                                { type: 'Laba Bersih', amount: formatCurrency(reportData.combined.netProfit), icon: 'DollarSign', color: 'text-primary', bgColor: 'bg-purple-100 dark:bg-purple-900' }
                                            ].map((item, index) => (
                                                <div key={index} className={`${item.bgColor} p-3 rounded-md border border-border`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Icon name={item.icon} className={`${item.color} h-4 w-4`} />
                                                        <span className={`text-xs font-medium ${item.color}`}>{item.type}</span>
                                                    </div>
                                                    <p className={`text-lg font-mono font-semibold ${item.color}`}>
                                                        {item.amount}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
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

export default OwnerDashboard;
