import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    TextInput,
    Alert,
    Platform,
    StatusBar,
    RefreshControl,
    Dimensions,
    ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    ChevronLeft,
    Plus,
    Search,
    Calendar,
    Filter,
    MoreHorizontal,
    Trash2,
    Edit3,
    ArrowRight,
    Wallet,
    TrendingUp,
    TrendingDown,
    FileText,
    X,
    ChevronDown,
    Inbox,
    History
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';
import BottomModalTemplate from '../../components/templates/BottomModalTemplate';

const { width } = Dimensions.get('window');

// Memoized Card Component for performance
const TransactionCard = React.memo(({ item, handleEdit, handleDelete, formatCurrency }) => (
    <View style={styles.transactionCard}>
        <View style={styles.cardHeader}>
            <View style={[styles.typeIcon, { backgroundColor: item.type === 'deposit' ? '#10B98115' : '#EF444415' }]}>
                {item.type === 'deposit' ? (
                    <TrendingUp size={20} color="#10B981" />
                ) : (
                    <TrendingDown size={20} color="#EF4444" />
                )}
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.transactionTitle}>
                    {item.type === 'deposit' ? 'Uang Masuk / Deposit' : 'Pengeluaran Lapak'}
                </Text>
                <Text style={styles.transactionDate}>
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                    <Edit3 size={18} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.actionBtn, { marginLeft: 8 }]}>
                    <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.cardBody}>
            <View style={[styles.descriptionBadge, { backgroundColor: item.type === 'deposit' ? '#10B98108' : '#EF444408', borderColor: item.type === 'deposit' ? '#10B98120' : '#EF444420' }]}>
                <View style={[styles.statusDot, { backgroundColor: item.type === 'deposit' ? '#10B981' : '#EF4444' }]} />
                <Text style={[styles.descriptionText, { color: item.type === 'deposit' ? '#065F46' : '#991B1B' }]}>
                    {item.description || 'Tanpa Catatan'}
                </Text>
            </View>
            <Text style={[styles.transactionAmount, { color: item.type === 'deposit' ? '#10B981' : '#EF4444' }]}>
                {item.type === 'deposit' ? '+' : '-'} {formatCurrency(item.amount)}
            </Text>
        </View>

        <View style={styles.recordedByBox}>
            <Text style={styles.recordedByText}>Oleh: {item.created_by_username || 'Admin'}</Text>
        </View>
    </View>
));

const LapakDeposit = ({ navigation }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { refreshTrigger } = useOrderNotification();
    const abortControllerRef = useRef(null);

    // Helper for local date string YYYY-MM-DD to avoid timezone issues
    const getLocalDateString = (daysAgo = 0) => {
        const date = new Date();
        if (daysAgo !== 0) {
            date.setDate(date.getDate() - daysAgo);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = getLocalDateString();

    // Data States
    const [lapakAccount, setLapakAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isFilteringLoading, setIsFilteringLoading] = useState(false);

    // UI States
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyLapak, setHistoryLapak] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [historyFilters, setHistoryFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Awal bulan ini
        endDate: new Date().toISOString().split('T')[0] // Hari ini
    });
    const [showHistoryStartDate, setShowHistoryStartDate] = useState(false);
    const [showHistoryEndDate, setShowHistoryEndDate] = useState(false);

    // Filter & Search States
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState({
        type: 'all',
        startDate: getLocalDateString(),
        endDate: getLocalDateString(),
    });

    const [localFilters, setLocalFilters] = useState({
        type: 'all',
        startDate: getLocalDateString(),
        endDate: getLocalDateString(),
    });

    // Form States
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        date: getLocalDateString()
    });

    // DatePicker States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Memoized Currency Formatter to avoid creating object on every call
    const currencyFormatter = useMemo(() => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }), []);

    const formatCurrency = useCallback((val) => {
        return currencyFormatter.format(Number(val) || 0);
    }, [currencyFormatter]);

    // Optimization: Memoize Summary Stats
    const statsSummary = useMemo(() => {
        if (!lapakAccount?.transactions) return { deposit: 0, expense: 0 };
        return lapakAccount.transactions.reduce((acc, curr) => {
            if (curr.type === 'deposit') acc.deposit += Number(curr.amount);
            else acc.expense += Number(curr.amount);
            return acc;
        }, { deposit: 0, expense: 0 });
    }, [lapakAccount]);

    const fetchLapakAccountData = useCallback(async (isInitialLoad = false, signal = null) => {
        if (isInitialLoad) setLoading(true);
        else setIsFilteringLoading(true);

        try {
            const params = new URLSearchParams();
            if (filters.type && filters.type !== 'all') params.append('type', filters.type);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (debouncedSearch) params.append('search', debouncedSearch);

            const response = await apiService.get(`/api/accounts/lapak_deposit?${params.toString()}`, { signal });
            if (response.data && response.data.message === 'success') {
                setLapakAccount(response.data.data);
                setHasError(false);
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') return;
            console.error("Error fetching lapak account data:", error);
            setHasError(true);
            showToast('Gagal mengambil data lapak', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsFilteringLoading(false);
        }
    }, [filters, debouncedSearch, showToast]);

    // Initial load, filter change, or socket refresh trigger
    useEffect(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timer = setTimeout(() => {
            fetchLapakAccountData(true, controller.signal);
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [filters, debouncedSearch, fetchLapakAccountData, refreshTrigger]);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLapakAccountData();
    }, [fetchLapakAccountData]);

    const handleApplyFilter = useCallback(() => {
        setFilters(localFilters);
        setShowFilterModal(false);
    }, [localFilters]);

    const handleResetFilter = useCallback(() => {
        const resetValues = { type: 'all', startDate: today, endDate: today };
        setLocalFilters(resetValues);
        setFilters(resetValues);
        setSearchInput('');
        setShowFilterModal(false);
    }, [today]);

    const fetchHistoryLapak = useCallback(async (isLoadMore = false) => {
        if (loadingHistory) return;

        const currentPage = isLoadMore ? historyPage + 1 : 1;
        setLoadingHistory(true);

        try {
            const params = new URLSearchParams();
            params.append('startDate', historyFilters.startDate);
            params.append('endDate', historyFilters.endDate);
            // Tambahkan limit/offset jika backend mendukung, jika tidak kita proses semua untuk periode tersebut

            const response = await apiService.get(`/api/accounts/lapak_deposit?${params.toString()}`);
            if (response.data && response.data.message === 'success') {
                const transactions = response.data.data.transactions || [];
                const currentAccountBalance = Number(response.data.data.account?.balance || 0);

                // Group by date and calculate running balance
                const grouped = {};
                let runningBalance = currentAccountBalance;

                // Jika ingin benar-benar akurat dengan periode lampau, 
                // idealnya backend mengirimkan balance per tanggal. 
                // Sementara kita asumsikan perhitungan mundur dari balance sekarang.

                transactions.forEach((curr) => {
                    const date = curr.created_at.split(' ')[0];
                    const amount = Number(curr.amount) || 0;
                    const type = String(curr.type).toLowerCase();

                    if (!grouped[date]) {
                        grouped[date] = {
                            date,
                            dateLabel: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                            totalIncome: 0,
                            totalOutcome: 0,
                            transactionCount: 0,
                            endBalance: runningBalance
                        };
                    }

                    if (type === 'deposit') {
                        grouped[date].totalIncome += amount;
                    } else {
                        grouped[date].totalOutcome += amount;
                    }
                    grouped[date].transactionCount += 1;

                    if (type === 'deposit') {
                        runningBalance -= amount;
                    } else {
                        runningBalance += amount;
                    }
                });

                const historyArray = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
                setHistoryLapak(historyArray);
                setHistoryPage(currentPage);
                // Untuk sementara kita tampilkan semua yang dalam range tanggal
                setHasMoreHistory(false);
            }
        } catch (error) {
            console.error("Error fetching history lapak:", error);
            showToast('Gagal mengambil history lapak', 'error');
        } finally {
            setLoadingHistory(false);
        }
    }, [historyFilters, historyPage, loadingHistory, showToast]);

    const handleOpenHistory = useCallback(() => {
        setIsHistoryModalOpen(true);
        // Reset ke default bulan ini setiap kali buka? 
        // Atau biarkan filter terakhir. Mari gunakan filter terakhir.
        fetchHistoryLapak();
    }, [fetchHistoryLapak]);


    const handleAddDeposit = useCallback(() => {
        setFormData({
            amount: '',
            description: '',
            date: getLocalDateString()
        });
        setIsDepositModalOpen(true);
    }, []);

    const handleRecordExpense = useCallback(() => {
        setFormData({
            amount: '',
            description: '',
            date: getLocalDateString()
        });
        setIsExpenseModalOpen(true);
    }, []);

    const handleEditClick = useCallback((transaction) => {
        setTransactionToEdit(transaction);
        setFormData({
            amount: transaction.amount.toString(),
            description: transaction.description || '',
            date: transaction.created_at.split(' ')[0]
        });
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((transaction) => {
        Alert.alert(
            'Hapus Transaksi',
            `Apakah Anda yakin ingin menghapus transaksi "${transaction.description || transaction.type}" senilai ${formatCurrency(transaction.amount)}?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.delete(`/api/accounts/transactions/${transaction.id}`);
                            showToast('Transaksi berhasil dihapus', 'success');
                            fetchLapakAccountData();
                        } catch (error) {
                            showToast('Gagal menghapus transaksi', 'error');
                        }
                    }
                }
            ]
        );
    }, [formatCurrency, fetchLapakAccountData, showToast]);

    const handleSaveDeposit = async () => {
        if (!formData.amount || !formData.description) {
            showToast('Harap isi jumlah dan deskripsi', 'error');
            return;
        }

        try {
            setLoading(true); // Prevent double submit
            // Ensure date includes time component for proper ordering
            // Fix: Construct date using local components to avoid timezone shifts
            // formData.date is YYYY-MM-DD
            const [yearP, monthP, dayP] = formData.date.split('-').map(Number);
            const selectedDate = new Date(yearP, monthP - 1, dayP);
            const now = new Date();

            // Set time to current time ONLY if it's the same day, otherwise mid-day to be safe
            // Actually, keep current time but ensure we stay on the selected day
            selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

            // Format as local YYYY-MM-DD HH:mm:ss to prevent backend UTC conversion issues
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const hours = String(selectedDate.getHours()).padStart(2, '0');
            const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
            const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
            const localDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            await apiService.post('/api/accounts/deposit', {
                account_name: 'lapak_deposit',
                amount: parseFloat(formData.amount),
                description: formData.description,
                created_at: localDateTime
            });
            showToast('Deposit berhasil ditambahkan', 'success');
            setIsDepositModalOpen(false);
            fetchLapakAccountData();
        } catch (error) {
            console.error('Error saving deposit:', error.response?.data || error.message);
            showToast(error.response?.data?.error || 'Gagal menambahkan deposit', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExpense = async () => {
        if (!formData.amount || !formData.description) {
            showToast('Harap isi jumlah dan deskripsi', 'error');
            return;
        }

        try {
            setLoading(true);
            const [yearP, monthP, dayP] = formData.date.split('-').map(Number);
            const selectedDate = new Date(yearP, monthP - 1, dayP);
            const now = new Date();
            selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const hours = String(selectedDate.getHours()).padStart(2, '0');
            const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
            const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
            const localDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            await apiService.post('/api/accounts/expense', {
                account_name: 'lapak_deposit',
                amount: parseFloat(formData.amount),
                description: formData.description,
                created_at: localDateTime
            });
            showToast('Pengeluaran berhasil dicatat', 'success');
            setIsExpenseModalOpen(false);
            fetchLapakAccountData();
        } catch (error) {
            console.error('Error saving expense:', error.response?.data || error.message);
            showToast(error.response?.data?.error || 'Gagal mencatat pengeluaran', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!formData.amount || !formData.description) {
            showToast('Harap isi jumlah dan deskripsi', 'error');
            return;
        }

        try {
            // Fix: Construct robust local date string
            const [yearP, monthP, dayP] = formData.date.split(' ')[0].split('-').map(Number);
            const selectedDate = new Date(yearP, monthP - 1, dayP);
            const now = new Date();

            // Set to current time ONLY if it's the same day, otherwise mid-day or midnight
            const todayStr = getLocalDateString();
            if (formData.date.split(' ')[0] === todayStr) {
                selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                selectedDate.setHours(0, 0, 1);
            }

            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const hours = String(selectedDate.getHours()).padStart(2, '0');
            const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
            const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
            const localDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            await apiService.put(`/api/accounts/transactions/${transactionToEdit.id}`, {
                amount: formData.amount,
                description: formData.description,
                date: localDateTime
            });
            showToast('Transaksi berhasil diperbarui', 'success');
            setIsEditModalOpen(false);
            fetchLapakAccountData();
        } catch (error) {
            showToast('Gagal memperbarui transaksi', 'error');
        }
    };

    const renderDateInput = (value, onDateChange, showPickerState, setShowPickerState, placeholder = 'Pilih Tanggal') => {
        return (
            <View style={{ width: '100%' }}>
                <TouchableOpacity
                    style={styles.inputDate}
                    onPress={() => setShowPickerState(true)}
                >
                    <Calendar size={18} color="#94A3B8" />
                    <Text style={{ flex: 1, marginLeft: 10, color: value ? '#1E293B' : '#94A3B8', fontWeight: '600' }}>
                        {value || placeholder}
                    </Text>
                </TouchableOpacity>
                {showPickerState && (
                    <DateTimePicker
                        value={value ? new Date(value) : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowPickerState(false);
                            if (selectedDate) {
                                // Use local time components to avoid timezone shifts
                                const year = selectedDate.getFullYear();
                                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const day = String(selectedDate.getDate()).padStart(2, '0');
                                onDateChange(`${year}-${month}-${day}`);
                            }
                        }}
                    />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Premium Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerSubtitle}>Atur Lapak</Text>
                        <Text style={styles.headerFullTitle}>Lapak Deposit</Text>
                    </View>
                    <TouchableOpacity onPress={handleOpenHistory} style={styles.refreshBtn}>
                        <History size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceInfo}>
                        <View style={styles.walletIconBg}>
                            <Wallet size={24} color="#1E40AF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={styles.periodTag}>
                                    {filters.startDate === today && filters.endDate === today && filters.type === 'all' && !debouncedSearch
                                        ? 'HARI INI'
                                        : (filters.startDate === getLocalDateString(1) && filters.endDate === getLocalDateString(1) && filters.type === 'all' && !debouncedSearch
                                            ? 'KEMARIN'
                                            : (filters.startDate === (today.substring(0, 8) + '01') && filters.endDate === today && filters.type === 'all' && !debouncedSearch
                                                ? 'BULAN INI'
                                                : (!filters.startDate && !filters.endDate && filters.type === 'all' && !debouncedSearch
                                                    ? 'SEMUA DATA'
                                                    : 'DIFILTER')))}
                                </Text>
                            </View>
                            <Text style={styles.balanceLabel}>Saldo Lapak</Text>
                            <Text style={styles.balanceAmount}>{formatCurrency(lapakAccount?.account?.balance || 0)}</Text>
                        </View>
                    </View>

                    {/* Stats Summary Row */}
                    <View style={styles.statsSummaryRow}>
                        <View style={styles.statMini}>
                            <TrendingUp size={14} color="#10B981" />
                            <Text style={styles.statMiniValue}>{formatCurrency(statsSummary.deposit)}</Text>
                            <Text style={styles.statMiniLabel}>Masuk</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statMini}>
                            <TrendingDown size={14} color="#EF4444" />
                            <Text style={styles.statMiniValue}>{formatCurrency(statsSummary.expense)}</Text>
                            <Text style={styles.statMiniLabel}>Keluar</Text>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionBtnMain} onPress={handleAddDeposit}>
                            <View style={styles.actionIconBg}>
                                <Plus size={18} color="#1E40AF" />
                            </View>
                            <Text style={styles.actionText}>Deposit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtnMain, { backgroundColor: '#FEE2E2' }]} onPress={handleRecordExpense}>
                            <View style={[styles.actionIconBg, { backgroundColor: '#FCA5A5' }]}>
                                <TrendingDown size={18} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.actionText, { color: '#B91C1C' }]}>Pengeluaran</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* List & Search */}
            <View style={styles.contentWrapper}>
                <View style={styles.searchAndFilter}>
                    <View style={styles.searchBox}>
                        <Search size={18} color="#94A3B8" />
                        <TextInput
                            placeholder="Cari transaksi..."
                            style={styles.searchInput}
                            value={searchInput}
                            onChangeText={setSearchInput}
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.filterBtn, (filters.startDate || filters.endDate || filters.type !== 'all') && styles.filterBtnActive]}
                        onPress={() => {
                            setLocalFilters(filters);
                            setShowFilterModal(true);
                        }}
                    >
                        <Filter size={20} color={(filters.startDate || filters.endDate || filters.type !== 'all') ? "#FFFFFF" : "#64748B"} />
                    </TouchableOpacity>
                </View>

                {loading && !lapakAccount ? (
                    <View style={styles.centerPadding}>
                        <ActivityIndicator size="large" color="#1E40AF" />
                        <Text style={styles.loadingText}>Memuat data...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={lapakAccount?.transactions || []}
                        renderItem={({ item }) => (
                            <TransactionCard
                                item={item}
                                handleEdit={handleEditClick}
                                handleDelete={handleDeleteClick}
                                formatCurrency={formatCurrency}
                            />
                        )}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                        // Performance Props
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={Platform.OS === 'android'}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBg}>
                                    <Inbox size={48} color={hasError ? "#EF4444" : "#CBD5E1"} />
                                </View>
                                <Text style={styles.emptyTitle}>
                                    {hasError ? 'Gagal Memuat Data' : 'Belum Ada Transaksi'}
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {hasError ? 'Pastikan koneksi internet aktif' : 'Data tidak ditemukan untuk kriteria ini'}
                                </Text>
                                {hasError && (
                                    <TouchableOpacity
                                        style={[styles.submitBtn, { paddingHorizontal: 30, height: 45, marginTop: 15 }]}
                                        onPress={() => fetchLapakAccountData(true)}
                                    >
                                        <Text style={styles.submitBtnText}>Coba Lagi</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />
                )}
            </View>

            {/* Deposit Modal */}
            <BottomModalTemplate
                visible={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                title="Tambah Deposit"
                footer={(
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSaveDeposit}>
                        <Text style={styles.submitBtnText}>Simpan Deposit</Text>
                    </TouchableOpacity>
                )}
            >
                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Jumlah Deposit (Rp) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={formData.amount}
                        onChangeText={text => setFormData({ ...formData, amount: text.replace(/[^0-9]/g, '') })}
                    />
                    <Text style={styles.inputLabel}>Deskripsi / Catatan *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Misal: Sisa uang belanja kemaren"
                        value={formData.description}
                        onChangeText={text => setFormData({ ...formData, description: text })}
                    />
                    <Text style={styles.inputLabel}>Tanggal</Text>
                    {renderDateInput(formData.date, (val) => setFormData({ ...formData, date: val }), showDatePicker, setShowDatePicker)}
                </View>
            </BottomModalTemplate>

            {/* Expense Modal */}
            <BottomModalTemplate
                visible={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title="Catat Pengeluaran"
                footer={(
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#EF4444' }]} onPress={handleSaveExpense}>
                        <Text style={styles.submitBtnText}>Simpan Pengeluaran</Text>
                    </TouchableOpacity>
                )}
            >
                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Jumlah Pengeluaran (Rp) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={formData.amount}
                        onChangeText={text => setFormData({ ...formData, amount: text.replace(/[^0-9]/g, '') })}
                    />
                    <Text style={styles.inputLabel}>Deskripsi / Catatan *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Misal: Bayar parkir pasar"
                        value={formData.description}
                        onChangeText={text => setFormData({ ...formData, description: text })}
                    />
                    <Text style={styles.inputLabel}>Tanggal</Text>
                    {renderDateInput(formData.date, (val) => setFormData({ ...formData, date: val }), showDatePicker, setShowDatePicker)}
                </View>
            </BottomModalTemplate>

            {/* Edit Modal */}
            <BottomModalTemplate
                visible={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Transaksi"
                footer={(
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit}>
                        <Text style={styles.submitBtnText}>Simpan Perubahan</Text>
                    </TouchableOpacity>
                )}
            >
                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Jumlah (Rp) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={formData.amount}
                        onChangeText={text => setFormData({ ...formData, amount: text.replace(/[^0-9]/g, '') })}
                    />
                    <Text style={styles.inputLabel}>Deskripsi / Catatan *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Deskripsi transaksi"
                        value={formData.description}
                        onChangeText={text => setFormData({ ...formData, description: text })}
                    />
                    <Text style={styles.inputLabel}>Tanggal</Text>
                    {renderDateInput(formData.date, (val) => setFormData({ ...formData, date: val }), showDatePicker, setShowDatePicker)}
                </View>
            </BottomModalTemplate>

            {/* Filter Modal */}
            <BottomModalTemplate
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                title="Filter Transaksi"
                footer={(
                    <View style={styles.filterFooter}>
                        <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilter}>
                            <Text style={styles.resetBtnText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.submitBtn, { flex: 1, marginTop: 0 }]} onPress={handleApplyFilter}>
                            <Text style={styles.submitBtnText}>Terapkan</Text>
                        </TouchableOpacity>
                    </View>
                )}
            >
                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Filter Cepat</Text>
                    <View style={styles.quickFilterRow}>
                        <TouchableOpacity
                            style={[styles.quickFilterBtn, localFilters.startDate === today && localFilters.endDate === today && styles.quickFilterBtnActive]}
                            onPress={() => setLocalFilters({ ...localFilters, startDate: today, endDate: today })}
                        >
                            <Text style={[styles.quickFilterText, localFilters.startDate === today && localFilters.endDate === today && styles.quickFilterTextActive]}>Hari Ini</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.quickFilterBtn, localFilters.startDate === getLocalDateString(1) && localFilters.endDate === getLocalDateString(1) && styles.quickFilterBtnActive]}
                            onPress={() => setLocalFilters({ ...localFilters, startDate: getLocalDateString(1), endDate: getLocalDateString(1) })}
                        >
                            <Text style={[styles.quickFilterText, localFilters.startDate === getLocalDateString(1) && localFilters.endDate === getLocalDateString(1) && styles.quickFilterTextActive]}>Kemarin</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.quickFilterRow, { marginTop: 10 }]}>
                        <TouchableOpacity
                            style={[styles.quickFilterBtn, localFilters.startDate === (today.substring(0, 8) + '01') && localFilters.endDate === today && styles.quickFilterBtnActive]}
                            onPress={() => setLocalFilters({ ...localFilters, startDate: today.substring(0, 8) + '01', endDate: today })}
                        >
                            <Text style={[styles.quickFilterText, localFilters.startDate === (today.substring(0, 8) + '01') && localFilters.endDate === today && styles.quickFilterTextActive]}>Bulan Ini</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.quickFilterBtn, localFilters.startDate === '' && localFilters.endDate === '' && styles.quickFilterBtnActive]}
                            onPress={() => setLocalFilters({ ...localFilters, startDate: '', endDate: '' })}
                        >
                            <Text style={[styles.quickFilterText, localFilters.startDate === '' && localFilters.endDate === '' && styles.quickFilterTextActive]}>Semua Data</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 20 }} />

                    <Text style={styles.inputLabel}>Tipe Transaksi</Text>
                    <View style={styles.typeSelector}>
                        {['all', 'deposit', 'expense'].map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.typeOption, localFilters.type === t && styles.typeOptionActive]}
                                onPress={() => setLocalFilters({ ...localFilters, type: t })}
                            >
                                <Text style={[styles.typeOptionText, localFilters.type === t && styles.typeOptionTextActive]}>
                                    {t === 'all' ? 'Semua' : t === 'deposit' ? 'Deposit' : 'Pengeluaran'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.inputLabel}>Dari Tanggal</Text>
                    {renderDateInput(localFilters.startDate, (val) => setLocalFilters({ ...localFilters, startDate: val }), showStartDatePicker, setShowStartDatePicker, 'Mulai Tanggal')}

                    <Text style={styles.inputLabel}>Sampai Tanggal</Text>
                    {renderDateInput(localFilters.endDate, (val) => setLocalFilters({ ...localFilters, endDate: val }), showEndDatePicker, setShowEndDatePicker, 'Sampai Tanggal')}
                </View>
            </BottomModalTemplate>

            {/* History Lapak Modal */}
            <BottomModalTemplate
                visible={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title="History Lapak"
            >
                <View style={styles.formContainer}>
                    <View style={styles.historyFilterContainer}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.inputLabel, { marginBottom: 4 }]}>Mulai</Text>
                            <TouchableOpacity
                                style={styles.historyDateInput}
                                onPress={() => setShowHistoryStartDate(true)}
                            >
                                <Calendar size={14} color="#64748B" />
                                <Text style={styles.historyDateInputValue}>
                                    {new Date(historyFilters.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.inputLabel, { marginBottom: 4 }]}>Sampai</Text>
                            <TouchableOpacity
                                style={styles.historyDateInput}
                                onPress={() => setShowHistoryEndDate(true)}
                            >
                                <Calendar size={14} color="#64748B" />
                                <Text style={styles.historyDateInputValue}>
                                    {new Date(historyFilters.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.historySearchBtn}
                            onPress={() => fetchHistoryLapak(false)}
                        >
                            <Search size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {loadingHistory ? (
                        <View style={[styles.centerPadding, { height: 150 }]}>
                            <ActivityIndicator size="large" color="#1E40AF" />
                        </View>
                    ) : (
                        <>
                            {historyLapak.length > 0 ? (
                                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                                    {historyLapak.map((day, index) => (
                                        <View key={index} style={styles.historyCard}>
                                            <View style={styles.historyCardHeader}>
                                                <View style={styles.historyDateBox}>
                                                    <Calendar size={14} color="#1E40AF" />
                                                    <Text style={styles.historyDateText}>{day.dateLabel}</Text>
                                                </View>
                                                <View style={styles.historyBadge}>
                                                    <Text style={styles.historyBadgeText}>{day.transactionCount} Transaksi</Text>
                                                </View>
                                            </View>

                                            <View style={[styles.statsSummaryRow, { marginBottom: 0, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9' }]}>
                                                <View style={styles.statMini}>
                                                    <TrendingUp size={14} color="#10B981" />
                                                    <Text style={styles.statMiniValue}>{formatCurrency(day.totalIncome)}</Text>
                                                    <Text style={styles.statMiniLabel}>Masuk</Text>
                                                </View>
                                                <View style={styles.statDivider} />
                                                <View style={styles.statMini}>
                                                    <TrendingDown size={14} color="#EF4444" />
                                                    <Text style={styles.statMiniValue}>{formatCurrency(day.totalOutcome)}</Text>
                                                    <Text style={styles.statMiniLabel}>Keluar</Text>
                                                </View>
                                            </View>

                                            <View style={styles.historyCardFooter}>
                                                <Text style={styles.historyFooterLabel}>Uang Lapak Tersisa:</Text>
                                                <Text style={styles.historyFooterValue}>{formatCurrency(day.endBalance)}</Text>
                                            </View>
                                        </View>
                                    ))}
                                    <View style={{ height: 20 }} />
                                </ScrollView>
                            ) : (
                                <View style={styles.emptyContainerSmall}>
                                    <Inbox size={40} color="#CBD5E1" />
                                    <Text style={styles.emptyTextSmall}>Tidak ada data untuk periode ini</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Date Pickers for History */}
                {showHistoryStartDate && (
                    <DateTimePicker
                        value={new Date(historyFilters.startDate)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowHistoryStartDate(false);
                            if (selectedDate) {
                                setHistoryFilters({ ...historyFilters, startDate: selectedDate.toISOString().split('T')[0] });
                            }
                        }}
                    />
                )}
                {showHistoryEndDate && (
                    <DateTimePicker
                        value={new Date(historyFilters.endDate)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowHistoryEndDate(false);
                            if (selectedDate) {
                                setHistoryFilters({ ...historyFilters, endDate: selectedDate.toISOString().split('T')[0] });
                            }
                        }}
                    />
                )}
            </BottomModalTemplate>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#1E40AF',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
        paddingBottom: 170,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        zIndex: 10, // Ensure balance card stays on top of content
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    headerFullTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
    },
    refreshBtn: {
        padding: 8,
        width: 40,
        alignItems: 'center',
    },
    balanceCard: {
        position: 'absolute',
        bottom: -115,
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    balanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    walletIconBg: {
        width: 48,
        height: 48,
        backgroundColor: '#E0F2FE',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    balanceLabel: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    balanceAmount: {
        color: '#1E293B',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    statsSummaryRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    statMini: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    statMiniValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1E293B',
    },
    statMiniLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 25,
        backgroundColor: '#E2E8F0',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    periodTag: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    quickFilterRow: {
        flexDirection: 'row',
        gap: 10,
    },
    quickFilterBtn: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    quickFilterBtnActive: {
        backgroundColor: '#1E40AF',
        borderColor: '#1E40AF',
    },
    quickFilterText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    quickFilterTextActive: {
        color: '#FFFFFF',
    },
    actionBtnMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0F2FE',
        paddingVertical: 10,
        borderRadius: 14,
        gap: 8,
    },
    actionIconBg: {
        width: 28,
        height: 28,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: '#1E40AF',
        fontSize: 13,
        fontWeight: '800',
    },
    contentWrapper: {
        flex: 1,
        paddingTop: 130,
        paddingHorizontal: 20,
    },
    searchAndFilter: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        height: 48,
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    filterBtn: {
        width: 48,
        height: 48,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterBtnActive: {
        backgroundColor: '#1E40AF',
        borderColor: '#1E40AF',
    },
    centerPadding: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 20,
    },
    transactionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    transactionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.3,
    },
    transactionDate: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
    },
    actionBtn: {
        width: 32,
        height: 32,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 14,
    },
    descriptionBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 10,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    descriptionText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '900',
    },
    recordedByBox: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    recordedByText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#CBD5E1',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        backgroundColor: '#F1F5F9',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#475569',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
        marginTop: 5,
    },
    formContainer: {
        padding: 5,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingHorizontal: 15,
        height: 50,
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    inputDate: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingHorizontal: 15,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    submitBtn: {
        backgroundColor: '#1E40AF',
        height: 55,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    filterFooter: {
        flexDirection: 'row',
        gap: 12,
    },
    resetBtn: {
        paddingHorizontal: 20,
        height: 55,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetBtnText: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '800',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    typeOption: {
        flex: 1,
        height: 45,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeOptionActive: {
        backgroundColor: '#1E40AF',
    },
    typeOptionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    typeOptionTextActive: {
        color: '#FFFFFF',
    },
    // History Modal Styles
    historyCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    historyCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historyDateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    historyDateText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    historyBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    historyBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1E40AF',
        textTransform: 'uppercase',
    },
    emptyContainerSmall: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyTextSmall: {
        marginTop: 10,
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    historyCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingHorizontal: 5,
    },
    historyFooterLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    historyFooterValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E40AF',
    },
    historyFilterContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    historyDateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
    },
    historyDateInputValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    historySearchBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#1E40AF',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    }
});

export default LapakDeposit;
