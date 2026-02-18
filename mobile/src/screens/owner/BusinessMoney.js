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
    Clock,
    User
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
                    {item.type === 'deposit' ? 'Deposit Masuk' : 'Pengeluaran Owner'}
                </Text>
                <View style={styles.dateTimeRow}>
                    <View style={styles.dateTimeItem}>
                        <Calendar size={10} color="#94A3B8" />
                        <Text style={styles.transactionDate}>
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                    <View style={styles.dateTimeItem}>
                        <Clock size={10} color="#94A3B8" />
                        <Text style={styles.transactionDate}>
                            {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
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
            <User size={10} color="#94A3B8" />
            <Text style={styles.recordedByText}>Dicatat oleh: {item.created_by_username || 'Admin'}</Text>
        </View>
    </View>
));

const BusinessMoney = ({ navigation }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { refreshTrigger } = useOrderNotification();
    const abortControllerRef = useRef(null);

    // Helper for local date string YYYY-MM-DD
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
    const [ownerAccount, setOwnerAccount] = useState(null);
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
    const [transactionToEdit, setTransactionToEdit] = useState(null);

    // Filter & Search States
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState({
        type: 'all',
        period: 'all',
        startDate: '',
        endDate: '',
    });

    const [localFilters, setLocalFilters] = useState({
        type: 'all',
        period: 'all',
        startDate: '',
        endDate: '',
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

    // Memoized Currency Formatter
    const currencyFormatter = useMemo(() => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }), []);

    const formatCurrency = useCallback((val) => {
        return currencyFormatter.format(Number(val) || 0);
    }, [currencyFormatter]);

    // Fetch All Data (Owner and Lapak)
    const fetchAllData = useCallback(async (isInitialLoad = false, signal = null) => {
        if (isInitialLoad) setLoading(true);
        else setIsFilteringLoading(true);

        try {
            const params = new URLSearchParams();
            if (filters.type && filters.type !== 'all') params.append('type', filters.type);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (debouncedSearch) params.append('search', debouncedSearch);

            const [ownerRes, lapakRes] = await Promise.all([
                apiService.get(`/api/accounts/owner_deposit?${params.toString()}`, { signal }),
                apiService.get(`/api/accounts/lapak_deposit`, { signal })
            ]);

            if (ownerRes.data && ownerRes.data.message === 'success') {
                setOwnerAccount(ownerRes.data.data);
            }
            if (lapakRes.data && lapakRes.data.message === 'success') {
                setLapakAccount(lapakRes.data.data);
            }
            setHasError(false);
        } catch (error) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') return;
            console.error("Error fetching business money data:", error);
            setHasError(true);
            showToast('Gagal mengambil data keuangan', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsFilteringLoading(false);
        }
    }, [filters, debouncedSearch, showToast]);

    useEffect(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timer = setTimeout(() => {
            fetchAllData(true, controller.signal);
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [filters, debouncedSearch, fetchAllData, refreshTrigger]);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllData();
    }, [fetchAllData]);

    const handleApplyFilter = useCallback(() => {
        setFilters(localFilters);
        setShowFilterModal(false);
    }, [localFilters]);

    const handleResetFilter = useCallback(() => {
        const resetValues = { type: 'all', period: 'all', startDate: '', endDate: '' };
        setLocalFilters(resetValues);
        setFilters(resetValues);
        setSearchInput('');
        setShowFilterModal(false);
    }, []);

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
                            fetchAllData();
                        } catch (error) {
                            showToast('Gagal menghapus transaksi', 'error');
                        }
                    }
                }
            ]
        );
    }, [formatCurrency, fetchAllData, showToast]);

    const handleSaveDeposit = async () => {
        if (!formData.amount || !formData.description) {
            showToast('Harap isi jumlah dan deskripsi', 'error');
            return;
        }

        try {
            setLoading(true);
            const selectedDate = new Date(formData.date);
            const now = new Date();
            selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const hours = String(selectedDate.getHours()).padStart(2, '0');
            const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
            const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
            const localDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            await apiService.post('/api/accounts/deposit', {
                account_name: 'owner_deposit',
                amount: parseFloat(formData.amount),
                description: formData.description,
                created_at: localDateTime
            });
            showToast('Deposit owner berhasil ditambahkan', 'success');
            setIsDepositModalOpen(false);
            fetchAllData();
        } catch (error) {
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
            const selectedDate = new Date(formData.date);
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
                account_name: 'owner_deposit',
                amount: parseFloat(formData.amount),
                description: formData.description,
                created_at: localDateTime
            });
            showToast('Pengeluaran owner berhasil dicatat', 'success');
            setIsExpenseModalOpen(false);
            fetchAllData();
        } catch (error) {
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
            await apiService.put(`/api/accounts/transactions/${transactionToEdit.id}`, {
                amount: formData.amount,
                description: formData.description,
                date: formData.date
            });
            showToast('Transaksi berhasil diperbarui', 'success');
            setIsEditModalOpen(false);
            fetchAllData();
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

    if (loading && !ownerAccount) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <ActivityIndicator size="large" color="#349BE5" />
                <Text style={styles.loadingText}>Memuat Data Bisnis...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Premium Fixed Header Section */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerFullTitle}>Uang Bisnis</Text>
                    </View>
                    <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
                        {isFilteringLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <MoreHorizontal size={24} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Overlapping Stats Card (Fixed) */}
                <View style={styles.statsCardContainer}>
                    <View style={styles.statsCard}>
                        <View style={styles.statsHeader}>
                            <View style={styles.walletIconBg}>
                                <Wallet size={18} color="#349BE5" />
                            </View>
                            <Text style={styles.statsTitle}>Total Kas Tersedia</Text>
                        </View>

                        <View style={styles.saldoGrid}>
                            <View style={styles.saldoItem}>
                                <Text style={styles.saldoLabel}>SALDO OWNER</Text>
                                <Text style={[styles.saldoValue, { color: '#10B981' }]}>
                                    {formatCurrency(ownerAccount?.account?.balance || 0)}
                                </Text>
                            </View>
                            <View style={styles.saldoDivider} />
                            <View style={styles.saldoItem}>
                                <Text style={styles.saldoLabel}>SALDO LAPAK</Text>
                                <Text style={[styles.saldoValue, { color: '#349BE5' }]}>
                                    {formatCurrency(lapakAccount?.account?.balance || 0)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.actionBtnMain} onPress={handleAddDeposit}>
                                <View style={[styles.actionIconBg, { backgroundColor: '#ECFDF5' }]}>
                                    <Plus size={16} color="#10B981" />
                                </View>
                                <Text style={[styles.actionText, { color: '#065F46' }]}>Deposit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtnMain} onPress={handleRecordExpense}>
                                <View style={[styles.actionIconBg, { backgroundColor: '#FEF2F2' }]}>
                                    <TrendingDown size={16} color="#EF4444" />
                                </View>
                                <Text style={[styles.actionText, { color: '#991B1B' }]}>Keluar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Scrollable Content */}
            <View style={styles.contentContainer}>
                <FlatList
                    data={ownerAccount?.transactions || []}
                    ListHeaderComponent={(
                        <View style={styles.filterSection}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
                                    <Text style={styles.sectionSubtitle}>Catatan dana owner</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.filterBtn, (filters.startDate || filters.endDate || filters.type !== 'all') && styles.filterBtnActive]}
                                    onPress={() => {
                                        setLocalFilters(filters);
                                        setShowFilterModal(true);
                                    }}
                                >
                                    <Filter size={18} color={(filters.startDate || filters.endDate || filters.type !== 'all') ? "#FFFFFF" : "#64748B"} />
                                </TouchableOpacity>
                            </View>

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
                        </View>
                    )}
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
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#349BE5']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBg}>
                                <Inbox size={48} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
                            <Text style={styles.emptySubtitle}>Silakan tambah deposit atau catat pengeluaran</Text>
                        </View>
                    }
                />
            </View>

            {/* Modals */}
            <BottomModalTemplate
                visible={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                title="Tambah Deposit Owner"
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
                        placeholder="Misal: Modal tambahan owner"
                        value={formData.description}
                        onChangeText={text => setFormData({ ...formData, description: text })}
                    />
                    <Text style={styles.inputLabel}>Tanggal</Text>
                    {renderDateInput(formData.date, (val) => setFormData({ ...formData, date: val }), showDatePicker, setShowDatePicker)}
                </View>
            </BottomModalTemplate>

            <BottomModalTemplate
                visible={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title="Catat Pengeluaran Owner"
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
                        placeholder="Misal: Bayar sewa gedung"
                        value={formData.description}
                        onChangeText={text => setFormData({ ...formData, description: text })}
                    />
                    <Text style={styles.inputLabel}>Tanggal</Text>
                    {renderDateInput(formData.date, (val) => setFormData({ ...formData, date: val }), showDatePicker, setShowDatePicker)}
                </View>
            </BottomModalTemplate>

            <BottomModalTemplate
                visible={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Transaksi Owner"
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
                    <Text style={styles.inputLabel}>Periode Waktu</Text>
                    <View style={styles.typeSelector}>
                        {['all', 'today', 'yesterday'].map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={[styles.typeOption, localFilters.period === r && styles.typeOptionActive]}
                                onPress={() => {
                                    const todayStr = getLocalDateString();
                                    if (r === 'all') {
                                        setLocalFilters({ ...localFilters, period: r, startDate: '', endDate: '' });
                                    } else if (r === 'today') {
                                        setLocalFilters({ ...localFilters, period: r, startDate: todayStr, endDate: todayStr });
                                    } else if (r === 'yesterday') {
                                        const yesterday = getLocalDateString(1);
                                        setLocalFilters({ ...localFilters, period: r, startDate: yesterday, endDate: yesterday });
                                    }
                                }}
                            >
                                <Text style={[styles.typeOptionText, localFilters.period === r && styles.typeOptionTextActive]}>
                                    {r === 'all' ? 'Semua' : r === 'today' ? 'Hari Ini' : 'Kemarin'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

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
                    {renderDateInput(localFilters.startDate, (val) => setLocalFilters({ ...localFilters, startDate: val }), showStartDatePicker, setShowStartDatePicker, 'Pilih Tanggal Mulai')}

                    <Text style={styles.inputLabel}>Sampai Tanggal</Text>
                    {renderDateInput(localFilters.endDate, (val) => setLocalFilters({ ...localFilters, endDate: val }), showEndDatePicker, setShowEndDatePicker, 'Pilih Tanggal Selesai')}
                </View>
            </BottomModalTemplate>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#349BE5',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 55,
        paddingBottom: 100,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    backBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerFullTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
    },
    refreshBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsCardContainer: {
        position: 'absolute',
        bottom: -90,
        left: 20,
        right: 20,
    },
    statsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        ...Platform.select({
            web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.08)' },
            android: { elevation: 8 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 15 }
        }),
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    walletIconBg: {
        width: 28,
        height: 28,
        backgroundColor: '#E1F5FE',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    saldoGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    saldoItem: {
        flex: 1,
    },
    saldoLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    saldoValue: {
        fontSize: 15,
        fontWeight: '900',
    },
    saldoDivider: {
        width: 1,
        height: 25,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    actionBtnMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        gap: 6,
    },
    actionIconBg: {
        width: 26,
        height: 26,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '800',
    },
    contentContainer: {
        flex: 1,
        marginTop: 105, // Jarak agar tidak tertutup kartu saldo yang fixed
    },
    filterSection: {
        marginBottom: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    sectionSubtitle: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 1,
    },
    filterBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    filterBtnActive: {
        backgroundColor: '#349BE5',
        borderColor: '#349BE5',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    transactionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.02)' },
            android: { elevation: 2 }
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 10,
    },
    transactionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    dateTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    dateTimeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    transactionDate: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '700',
    },
    cardActions: {
        flexDirection: 'row',
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
        paddingTop: 10,
        paddingBottom: 6,
    },
    descriptionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        maxWidth: '65%',
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginRight: 5,
    },
    descriptionText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: '900',
    },
    recordedByBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
        paddingLeft: 2,
    },
    recordedByText: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyIconBg: {
        width: 64,
        height: 64,
        backgroundColor: '#F1F5F9',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#475569',
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
        fontWeight: '600',
    },
    formContainer: {
        paddingVertical: 5,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    inputDate: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    submitBtn: {
        backgroundColor: '#349BE5',
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    filterFooter: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5,
    },
    resetBtn: {
        width: 90,
        height: 50,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetBtnText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '800',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    typeOption: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    typeOptionActive: {
        backgroundColor: '#349BE5',
        borderColor: '#349BE5',
    },
    typeOptionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    typeOptionTextActive: {
        color: '#FFFFFF',
    }
});

export default BusinessMoney;
