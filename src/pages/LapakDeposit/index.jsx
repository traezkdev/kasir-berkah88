import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MetricsCard from '../main-dashboard/components/MetricsCard'; // Re-use MetricsCard
import DepositModal from '../../components/ui/DepositModal'; // Import DepositModal
import ExpenseModal from '../../components/ui/ExpenseModal'; // Import ExpenseModal
import EditTransactionDescriptionModal from '../../components/ui/EditTransactionDescriptionModal'; // Import EditTransactionDescriptionModal
import ConfirmationModal from '../../components/ui/ConfirmationModal'; // Import ConfirmationModal
import { useToast } from '../../components/ui/ToastNotification';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { jwtDecode } from 'jwt-decode';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import AdminMobileHeader from '../../components/ui/AdminMobileHeader';

const apiUrl = import.meta.env.VITE_API_URL;

const LapakDeposit = ({ headerTitle }) => {
    const { theme } = useTheme();
    const { toggleSidebar } = useAppSettings();
    const navigate = useNavigate();
    const [lapakAccount, setLapakAccount] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFilteringLoading, setIsFilteringLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [mode, setMode] = useState('lapak'); // 'lapak' or 'owner'
    const [filters, setFilters] = useState({
        type: 'all',
        startDate: '',
        endDate: '',
        search: ''
    });
    const [isFilterOpen, setIsFilterOpen] = useState(window.innerWidth >= 1024);
    const [logoUrl, setLogoUrl] = useState('');

    const { showToast } = useToast();

    const currentAccountName = mode === 'lapak' ? 'lapak_deposit' : 'owner_deposit';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })?.format(amount);
    };

    const fetchLapakAccountData = async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        else setIsFilteringLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.search) queryParams.append('search', filters.search);

            const response = await authFetch(`${apiUrl}/api/accounts/${currentAccountName}?${queryParams.toString()}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch account data');
            }
            const data = await response.json();
            setLapakAccount(data.data);
        } catch (err) {
            console.error("Error fetching account data:", err);
            setError(err.message);
        } finally {
            if (isInitialLoad) setLoading(false);
            setIsFilteringLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLapakAccountData();
        }, 300);

        return () => clearTimeout(timer);
    }, [filters, mode]); // Add mode to dependencies

    useEffect(() => {
        fetchLapakAccountData(true);

        const fetchLogo = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/settings/logo`);
                const data = await response.json();
                if (response.ok && typeof data.data.logo_url === 'string' && data.data.logo_url.length > 0) {
                    if (data.data.logo_url.startsWith('/public')) {
                        setLogoUrl(`${apiUrl}${data.data.logo_url}`);
                    } else {
                        setLogoUrl(data.data.logo_url);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch logo:', error);
            }
        };

        const fetchRole = () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    setUserRole(decoded.role.trim());
                } catch (e) {
                    console.error("Failed to decode token", e);
                }
            }
        };

        fetchLogo();
        fetchRole();
    }, []);

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setFilters({
            type: 'all',
            startDate: '',
            endDate: '',
            search: ''
        });
        setCurrentPage(1);
    };

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
                    account_name: currentAccountName,
                    amount: amount,
                    description: description,
                    created_at: date
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal menambahkan deposit');
            }
            showToast('Deposit berhasil ditambahkan!', 'success');
            setIsDepositModalOpen(false);
            fetchLapakAccountData();
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
                    account_name: currentAccountName,
                    amount: amount,
                    description: description,
                    created_at: date
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal mencatat pengeluaran');
            }
            showToast('Pengeluaran berhasil dicatat!', 'success');
            setIsExpenseModalOpen(false);
            fetchLapakAccountData();
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            console.error("Error saving expense:", err);
        }
    };

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
            fetchLapakAccountData();
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
            fetchLapakAccountData();
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            console.error("Error deleting transaction:", err);
        }
    };

    if (loading && !lapakAccount) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center p-4">
                    <p className="text-red-500 mb-4">Error: {error}</p>
                    <Button onClick={() => fetchLapakAccountData(true)}>Coba Lagi</Button>
                </div>
            </div>
        );
    }

    const mobileActions = [
        {
            label: 'Tambah Deposit',
            icon: 'Plus',
            onClick: handleAddDeposit
        },
        {
            label: 'Catat Pengeluaran',
            icon: 'Minus',
            onClick: handleRecordExpense
        }
    ];

    const pageTitle = mode === 'lapak' ? 'Uang Tunai' : 'Uang Transfer';
    const pageSubtitle = mode === 'lapak' ? 'Deposit & Pengeluaran Tunai' : 'Kas & Pengeluaran Transfer';

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50 lg:bg-background' : 'bg-transparent'}`}>
            {theme === 'default' && (
                userRole === 'owner' ? (
                    <OwnerNavigationHeader
                        onToggleSidebar={toggleSidebar}
                        headerTitle={headerTitle || pageTitle}
                        hideMobileHeader={true}
                    />
                ) : (
                    <NavigationHeader
                        onToggleSidebar={toggleSidebar}
                        headerTitle={headerTitle || pageTitle}
                        hideMobileHeader={true}
                    />
                )
            )}
            <main className={`${theme === 'default' ? 'pt-0 lg:pt-16' : ''} pb-24 lg:pb-8`}>
                {theme === 'default' && (
                    <AdminMobileHeader
                        title={pageTitle}
                        subtitle={pageSubtitle}
                        badgeText={mode === 'lapak' ? "Uang Tunai" : "Uang Transfer"}
                        stickyTitle={headerTitle || pageTitle}
                        actions={mobileActions}
                        decorativeIcon={mode === 'lapak' ? "Wallet" : "User"}
                    />
                )}
                <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 py-4 md:py-6" : ""}>
                    {/* Desktop Header Content */}
                    <div className="hidden lg:flex mb-8 justify-between items-end gap-6">
                        <div>
                            <BreadcrumbNavigation />
                            <div className="mt-4">
                                <h1 className="text-2xl lg:text-4xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">{pageTitle}</h1>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                    <span className={`w-8 h-[2px] ${mode === 'lapak' ? 'bg-blue-600' : 'bg-purple-600'} rounded-full`}></span>
                                    {mode === 'lapak' ? 'Kelola dana tunai bisnis' : 'Kelola dana transfer bisnis'}
                                </p>
                            </div>
                        </div>

                        {/* Mode Toggle for Desktop */}
                        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-1 h-fit">
                            <button
                                onClick={() => setMode('lapak')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'lapak'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Icon name="Store" size={14} strokeWidth={3} />
                                <span>Uang Tunai</span>
                            </button>
                            <button
                                onClick={() => setMode('owner')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'owner'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Icon name="User" size={14} strokeWidth={3} />
                                <span>Uang Transfer</span>
                            </button>
                        </div>
                    </div>

                    <div className="!-mt-20 lg:!mt-0 relative z-30">
                        {/* Mode Toggle for Mobile - Visible on mobile only */}
                        <div className="lg:hidden mb-6 flex justify-start">
                            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-1 w-full sm:w-auto">
                                <button
                                    onClick={() => setMode('lapak')}
                                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'lapak'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    <Icon name="Store" size={14} strokeWidth={3} />
                                    <span>Tunai</span>
                                </button>
                                <button
                                    onClick={() => setMode('owner')}
                                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'owner'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    <Icon name="User" size={14} strokeWidth={3} />
                                    <span>Transfer</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            <MetricsCard
                                title={mode === 'lapak' ? "Uang Tunai" : "Uang Transfer"}
                                value={formatCurrency(lapakAccount?.account?.balance || 0)}
                                icon={mode === 'lapak' ? "Wallet" : "User"}
                                color="white"
                                description={mode === 'lapak' ? "Total dana tersedia dalam bentuk tunai" : "Total dana tersedia dalam bentuk transfer"}
                            />
                        </div>

                        <div className="hidden lg:flex flex-wrap justify-start gap-4 mb-8">
                            <Button
                                variant={mode === 'lapak' ? "primary" : "info"}
                                iconName="Plus"
                                onClick={handleAddDeposit}
                                className={mode === 'owner' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
                            >
                                Tambah {mode === 'lapak' ? 'Deposit' : 'Tabungan'}
                            </Button>
                            <Button variant="destructive" iconName="Minus" onClick={handleRecordExpense}>
                                Catat Pengeluaran
                            </Button>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-8 overflow-hidden border border-gray-100 dark:border-slate-800 transition-all duration-300">
                        <div
                            className={`p-5 flex flex-row items-center justify-between cursor-pointer ${mode === 'lapak' ? 'bg-[#118eea] lg:bg-white lg:dark:bg-slate-900' : 'bg-[#9333ea] lg:bg-white lg:dark:bg-slate-900'} border-b border-gray-50 dark:border-slate-800 transition-all relative overflow-hidden group`}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all lg:hidden"></div>

                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`p-2 rounded-xl transition-colors ${isFilterOpen
                                    ? `bg-white/20 lg:bg-${mode === 'lapak' ? 'blue' : 'purple'}-50 lg:dark:bg-${mode === 'lapak' ? 'blue' : 'purple'}-900/20 text-white lg:text-${mode === 'lapak' ? 'blue' : 'purple'}-600`
                                    : 'bg-black/10 lg:bg-gray-100 lg:dark:bg-slate-800 text-white/80 lg:text-gray-400'}`}>
                                    <Icon name="Filter" className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm lg:text-base font-black text-white lg:text-gray-800 lg:dark:text-white uppercase tracking-tight">
                                        Filter Transaksi
                                    </h2>
                                    <p className="text-[10px] font-bold text-white/70 lg:text-gray-400 uppercase tracking-widest leading-none mt-1">
                                        {isFilterOpen ? 'Klik untuk menutup' : 'Cari berdasarkan tipe & tanggal'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleResetFilters();
                                    }}
                                    className="h-8 px-3 rounded-lg bg-white/10 lg:bg-gray-100 lg:dark:bg-slate-800 text-white lg:text-gray-600 lg:dark:text-gray-400 hover:bg-white/20 lg:hover:bg-gray-200 lg:dark:hover:bg-slate-700 font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 lg:border-gray-200 lg:dark:border-slate-700"
                                >
                                    Reset
                                </Button>
                                <Icon
                                    name={isFilterOpen ? "ChevronUp" : "ChevronDown"}
                                    className={`h-5 w-5 transition-transform duration-500 ${isFilterOpen ? `rotate-180 text-white lg:text-${mode === 'lapak' ? 'blue' : 'purple'}-500` : 'text-white/50 lg:text-gray-400'}`}
                                />
                            </div>
                        </div>

                        <div className={`transition-all duration-300 ease-in-out border-t border-gray-50 dark:border-slate-800 ${isFilterOpen ? 'max-h-[1000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tipe</label>
                                    <Select
                                        value={filters.type}
                                        onChange={(value) => handleFilterChange('type', value)}
                                        options={[
                                            { label: 'Semua Tipe', value: 'all' },
                                            { label: 'Deposit', value: 'deposit' },
                                            { label: 'Pengeluaran', value: 'expense' },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Cari Deskripsi</label>
                                    <Input
                                        placeholder="Cari..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        rightIcon={<Icon name="Search" className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Dari Tanggal</label>
                                    <Input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Sampai Tanggal</label>
                                    <Input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight text-stroke-1">Riwayat Transaksi</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Catatan dana {mode === 'lapak' ? 'tunai' : 'transfer'}</p>
                            </div>
                        </div>

                        <div className="relative min-h-[400px]">
                            {isFilteringLoading && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px] z-30 flex items-center justify-center rounded-3xl transition-all duration-300">
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-gray-100 dark:border-slate-700">
                                        <div className={`w-12 h-12 border-4 ${mode === 'lapak' ? 'border-blue-600' : 'border-purple-600'} border-t-transparent rounded-full animate-spin`}></div>
                                        <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] animate-pulse">Memperbarui Data...</span>
                                    </div>
                                </div>
                            )}

                            {lapakAccount?.transactions?.length > 0 ? (
                                <>
                                    <ul className="space-y-4">
                                        {lapakAccount.transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((transaction) => (
                                            <li key={transaction.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md group">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${transaction.type === 'deposit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                            <Icon name={transaction.type === 'deposit' ? 'TrendingUp' : 'TrendingDown'} size={24} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight truncate">
                                                                {transaction.type === 'deposit' ? (mode === 'lapak' ? 'Uang Tunai Masuk' : 'Uang Transfer Masuk') : (mode === 'lapak' ? 'Pengeluaran Tunai' : 'Pengeluaran Transfer')}
                                                            </h4>
                                                            <div className={`mt-2 px-3 py-2 rounded-xl border flex items-center gap-2.5 ${transaction.type === 'deposit' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/20' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/20'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${transaction.type === 'deposit' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                                                                <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${transaction.type === 'deposit' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                                                    {transaction.description || 'Tanpa Catatan'}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    {new Date(transaction.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} • {transaction.created_by_username}
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
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4 px-2">
                                        <div className="flex items-center gap-2 order-2 sm:order-1">
                                            <Button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                variant="ghost"
                                                className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 group"
                                            >
                                                <Icon name="ChevronLeft" size={16} className="transition-transform group-hover:-translate-x-1" />
                                                Sebelumnya
                                            </Button>
                                            <Button
                                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(lapakAccount.transactions.length / itemsPerPage), prev + 1))}
                                                disabled={currentPage === Math.ceil(lapakAccount.transactions.length / itemsPerPage)}
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
                                            <div className={`flex items-center justify-center h-8 px-4 rounded-lg ${mode === 'lapak' ? 'bg-blue-600' : 'bg-purple-600'} text-white font-mono font-black text-sm shadow-lg`}>
                                                {currentPage}
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                Dari {Math.ceil(lapakAccount.transactions.length / itemsPerPage)}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
                                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-6">
                                        <Icon name="Inbox" size={40} className="text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Belum Ada Transaksi</h3>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 text-center max-w-[280px]">
                                        Silakan tambah {mode === 'lapak' ? 'uang tunai' : 'uang transfer'} atau catat pengeluaran untuk melihat riwayat.
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
                accountType={mode === 'lapak' ? 'lapak' : 'owner'}
                title={mode === 'lapak' ? 'Tambah Uang Tunai' : 'Tambah Uang Transfer'}
            />
            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                accountType={mode === 'lapak' ? 'lapak' : 'owner'}
                title={mode === 'lapak' ? 'Catat Pengeluaran Tunai' : 'Catat Pengeluaran Transfer'}
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

export default LapakDeposit;