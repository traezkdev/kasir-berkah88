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
    TrendingDown,
    FileText,
    X,
    ChevronDown
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import BottomModalTemplate from '../../components/templates/BottomModalTemplate';

const { width } = Dimensions.get('window');

// Memoized Card Component for performance
const ExpenseCard = React.memo(({ item, handleEditExpense, handleDeleteExpense, formatCurrency, getCategoryColor }) => (
    <View style={styles.expenseCard}>
        <View style={styles.cardHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) + '15' }]}>
                <TrendingDown size={20} color={getCategoryColor(item.category)} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.expenseName}>{item.name}</Text>
                <Text style={styles.expenseDate}>{item.date.split(' ')[0]}</Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEditExpense(item)} style={styles.actionBtn}>
                    <Edit3 size={18} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteExpense(item.id)} style={[styles.actionBtn, { marginLeft: 8 }]}>
                    <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
        <View style={styles.cardFooter}>
            <View style={styles.categoryBadge}>
                <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>{item.category}</Text>
            </View>
            <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        {!!item.notes && (
            <View style={styles.notesBox}>
                <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
            </View>
        )}
        <View style={styles.recordedByBox}>
            <Text style={styles.recordedByText}>Oleh: {item.recorded_by || 'Admin'}</Text>
        </View>
    </View>
));

const OwnerExpenseManagement = ({ navigation }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
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
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    // UI States
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [originalFullDate, setOriginalFullDate] = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Filter & Search States
    const [searchInput, setSearchInput] = useState(''); // Live search input
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // DatePicker States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);

    // Filter States
    const [filters, setFilters] = useState({
        startDate: today,
        endDate: today,
        category: ''
    });

    // Local filters for modal (draft mode)
    const [localFilters, setLocalFilters] = useState({
        startDate: today,
        endDate: today,
        category: ''
    });

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        category: 'Operasional',
        notes: '',
        date: today
    });

    const [categories, setCategories] = useState(['Bahan Baku & Supplies', 'Listrik & Air', 'Pembelian Stok', 'Peralatan', 'Perawatan & Perbaikan', 'Transportasi', 'Promosi & Marketing', 'Operasional Lainnya', 'Lain-lain', 'Gaji']);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await apiService.get('/api/expense-categories');
            if (response.data && response.data.message === 'success') {
                const rawData = response.data.data;
                // Pastikan kita mendapatkan array string
                const processedCategories = Array.isArray(rawData)
                    ? rawData.map(item => typeof item === 'object' ? item.name : item)
                    : [];

                if (processedCategories.length > 0) {
                    setCategories(processedCategories);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    // Helper to render date input based on platform
    const renderDateInput = (value, onDateChange, showPickerState, setShowPickerState, placeholder = 'Pilih Tanggal') => {
        if (Platform.OS === 'web') {
            return (
                <View style={[styles.input, styles.dateInput]}>
                    <Calendar size={18} color="#94A3B8" />
                    <TextInput
                        style={{ flex: 1, marginLeft: 10, padding: 0, color: '#1E293B', fontWeight: '600' }}
                        type="date"
                        value={value}
                        onChangeText={onDateChange}
                    />
                </View>
            );
        }
        return (
            <View style={{ width: '100%' }}>
                <TouchableOpacity
                    style={[styles.input, styles.dateInput]}
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

    const fetchData = useCallback(async (pageNum = 1, isRefresh = false, signal = null) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const params = new URLSearchParams({
                page: pageNum.toString(),
                limit: '15'
            });

            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.category) params.append('category', filters.category);
            if (debouncedSearch) params.append('search', debouncedSearch);

            const response = await apiService.get(`/api/expenses?${params.toString()}`, { signal });
            if (response.data && response.data.message === 'success') {
                const newData = response.data.data;
                if (pageNum === 1) {
                    setExpenses(newData);
                } else {
                    setExpenses(prev => [...prev, ...newData]);
                }
                setTotalPages(response.data.pagination.totalPages);
                setTotalItems(response.data.pagination.totalItems);
                setTotalAmount(Number(response.data.totalAmount) || 0);
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') return;
            console.error('Error fetching expenses:', error);
            showToast('Gagal mengambil data pengeluaran', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showToast, filters, debouncedSearch]);

    // Initial load
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Search Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Main fetch effect
    useEffect(() => {
        setPage(1);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        fetchData(1, false, controller.signal);

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [filters, debouncedSearch, fetchData]);

    const handleApplyFilter = () => {
        setFilters(localFilters);
        setShowFilterModal(false);
        setPage(1);
    };

    const handleResetFilter = () => {
        const resetValues = {
            startDate: today,
            endDate: today,
            category: ''
        };
        setLocalFilters(resetValues);
        setFilters(resetValues);
        setSearchInput('');
        setShowFilterModal(false);
        setPage(1);
    };

    const handleRefresh = () => {
        setPage(1);
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        fetchData(1, true, controller.signal);
    };

    const handleLoadMore = () => {
        if (page < totalPages && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchData(nextPage);
        }
    };

    const handleAddExpense = () => {
        setIsEditing(false);
        setIsAddingCustomCategory(false);
        setFormData({
            name: '',
            amount: '',
            category: 'Operasional',
            notes: '',
            date: getLocalDateString()
        });
        setShowModal(true);
    };

    const handleEditExpense = (item) => {
        setSelectedExpense(item);
        setIsEditing(true);
        // Check if the current category is in the fetched list
        const isKnownCategory = categories && categories.length > 0 ? categories.includes(item.category) : true;
        setIsAddingCustomCategory(!isKnownCategory);

        setOriginalFullDate(item.date); // Simpan tanggal & waktu lengkap asli (misal: 2024-02-07 15:30:00)

        setFormData({
            name: item.name,
            amount: item.amount.toString(),
            category: item.category,
            notes: item.notes || '',
            date: item.date.split(' ')[0]
        });
        setShowModal(true);
    };

    const handleDeleteExpense = async (id) => {
        const accepted = await confirm({
            title: 'Hapus Catatan',
            message: 'Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus catatan pengeluaran ini?',
            confirmText: 'Ya, Hapus',
            type: 'danger'
        });

        if (accepted) {
            try {
                await apiService.delete(`/api/expenses/${id}`);
                showToast('Pengeluaran berhasil dihapus', 'success');
                handleRefresh();
            } catch (error) {
                showToast('Gagal menghapus pengeluaran', 'error');
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.amount || !formData.date) {
            showToast('Harap isi semua field wajib', 'error');
            return;
        }

        try {
            let finalData = { ...formData };

            // Handle DateTime for backend (YYYY-MM-DD HH:mm:ss Local)
            if (formData.date) {
                const selectedDate = new Date(formData.date);
                // Default to current time if creating new or if date changed
                const now = new Date();
                let hours = String(now.getHours()).padStart(2, '0');
                let minutes = String(now.getMinutes()).padStart(2, '0');
                let seconds = String(now.getSeconds()).padStart(2, '0');

                // If editing and date hasn't changed, try to preserve original time
                if (isEditing && originalFullDate) {
                    const originalDatePart = originalFullDate.split(' ')[0];
                    if (formData.date === originalDatePart) {
                        // Extract time part and remove timezone suffix if exists (e.g. +07:00)
                        const rawTimePart = originalFullDate.split(' ')[1] || '00:00:00';
                        const originalTimePart = rawTimePart.split('+')[0].split('Z')[0];

                        const timeSegments = originalTimePart.split(':');
                        hours = timeSegments[0] || '00';
                        minutes = timeSegments[1] || '00';
                        seconds = timeSegments[2] || '00';
                    }
                }

                finalData.date = `${formData.date} ${hours}:${minutes}:${seconds}`;
            }

            if (isEditing) {
                await apiService.put(`/api/expenses/${selectedExpense.id}`, finalData);
                showToast('Pengeluaran berhasil diperbarui', 'success');
            } else {
                await apiService.post('/api/expenses', finalData);
                showToast('Pengeluaran berhasil ditambahkan', 'success');
            }
            setShowModal(false);
            handleRefresh();
        } catch (error) {
            console.error('Submit error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Gagal menyimpan data';
            showToast(errorMsg, 'error');
        }
    };

    const formatDateShort = (dateStr) => {
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
            }
            return dateStr;
        } catch (e) {
            return dateStr;
        }
    };

    const formatCurrency = useCallback((val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(Number(val) || 0);
    }, []);

    const getCategoryColor = useCallback((cat) => {
        const pieColors = [
            '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
            '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
        ];

        const categoryMap = {
            'Bahan Baku & Supplies': pieColors[0],
            'Listrik & Air': pieColors[1],
            'Pembelian Stok': pieColors[2],
            'Peralatan': pieColors[3],
            'Perawatan & Perbaikan': pieColors[4],
            'Transportasi': pieColors[5],
            'Promosi & Marketing': pieColors[6],
            'Operasional Lainnya': pieColors[7],
            'Lain-lain': pieColors[8],
            'Gaji': pieColors[9],
        };

        return categoryMap[cat] || '#64748B';
    }, []);

    const renderItem = useCallback(({ item }) => (
        <ExpenseCard
            item={item}
            handleEditExpense={handleEditExpense}
            handleDeleteExpense={handleDeleteExpense}
            formatCurrency={formatCurrency}
            getCategoryColor={getCategoryColor}
        />
    ), [handleEditExpense, handleDeleteExpense, formatCurrency, getCategoryColor]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Premium Header - Owner Theme */}
            <View
                style={styles.headerGradient}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerSubtitle}>Manajemen</Text>
                        <Text style={styles.headerFullTitle}>Pengeluaran</Text>
                    </View>
                    <TouchableOpacity onPress={handleAddExpense} style={styles.plusBtnHeader}>
                        <View style={[styles.plusIconBg, { backgroundColor: '#E1F5FE' }]}>
                            <Plus size={20} color="#349BE5" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Floating Search Bar (Overlap) */}
                <View style={styles.searchBoxContainer}>
                    <View style={styles.searchBox}>
                        <Search size={18} color="#94A3B8" />
                        <TextInput
                            placeholder="Cari pengeluaran atau catatan..."
                            style={styles.searchInput}
                            value={searchInput}
                            onChangeText={setSearchInput}
                            placeholderTextColor="#94A3B8"
                        />
                        {searchInput.length > 0 ? (
                            <TouchableOpacity onPress={() => setSearchInput('')}>
                                <X size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </View>

            {/* Content with Padding Top for SearchBox Offset */}
            <View style={styles.contentWrapper}>
                {/* Summary Section */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryCardPremium}>
                        <View style={styles.summaryHeader}>
                            <Text style={styles.summaryTag}>
                                {filters.startDate === today && filters.endDate === today && !filters.category && !debouncedSearch
                                    ? 'HARI INI'
                                    : (filters.startDate === getLocalDateString(1) && filters.endDate === getLocalDateString(1) && !filters.category && !debouncedSearch
                                        ? 'KEMARIN'
                                        : (filters.startDate === (today.substring(0, 8) + '01') && filters.endDate === today && !filters.category && !debouncedSearch
                                            ? 'BULAN INI'
                                            : (!filters.startDate && !filters.endDate && !filters.category && !debouncedSearch
                                                ? 'SEMUA DATA'
                                                : (filters.startDate || filters.endDate || filters.category || debouncedSearch ? 'DIFILTER' : 'KESELURUHAN'))))}
                            </Text>
                            <TouchableOpacity style={styles.filterBtnMini} onPress={() => {
                                setLocalFilters(filters);
                                setShowFilterModal(true);
                            }}>
                                <Filter size={16} color={filters.startDate || filters.endDate || filters.category ? "#349BE5" : "#64748B"} />
                                <Text style={[styles.filterBtnMiniText, (!!filters.startDate || !!filters.endDate || !!filters.category) && { color: '#349BE5' }]}>Filter</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.summaryAmountPremium}>{formatCurrency(totalAmount)}</Text>
                        <View style={styles.summaryFooter}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabelText}>Transaksi</Text>
                                <Text style={styles.summaryValueText}>{totalItems}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={[styles.summaryItem, { flex: 2 }]}>
                                <Text style={styles.summaryLabelText}>Periode</Text>
                                <Text style={styles.summaryValueText} numberOfLines={1}>
                                    {filters.startDate ? formatDateShort(filters.startDate) : 'Awal'} - {filters.endDate ? formatDateShort(filters.endDate) : 'Hari Ini'}
                                </Text>
                            </View>
                        </View>
                        {!!filters.category && (
                            <View style={styles.activeFilterBadge}>
                                <Text style={styles.activeFilterText}>Kategori: {filters.category}</Text>
                                <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, category: '' }))}>
                                    <X size={12} color="#349BE5" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Section Header */}
                <View style={styles.listHeaderSection}>
                    <Text style={styles.listTitle}>Riwayat Transaksi</Text>
                    {loading ? <ActivityIndicator size="small" color="#349BE5" /> : null}
                </View>

                {/* List */}
                <FlatList
                    data={expenses}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#349BE5']} />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS !== 'web'}
                    ListFooterComponent={
                        loading && page > 1 ? (
                            <ActivityIndicator size="small" color="#349BE5" style={{ marginVertical: 20 }} />
                        ) : <View style={{ height: 100 }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconBg, { backgroundColor: '#E1F5FE' }]}>
                                <TrendingDown size={40} color="#349BE5" />
                            </View>
                            <Text style={styles.emptyTitle}>Data Tidak Ditemukan</Text>
                            <Text style={styles.emptySubtitle}>Tidak ada pengeluaran untuk kriteria ini</Text>
                        </View>
                    }
                />
            </View>




            {/* Add/Edit Modal */}
            <BottomModalTemplate
                visible={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
                footer={(
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                        <Text style={styles.submitBtnText}>
                            {isEditing ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
                        </Text>
                    </TouchableOpacity>
                )}
            >
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nama Pengeluaran *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Contoh: Listrik Bulanan"
                            value={formData.name}
                            onChangeText={text => setFormData({ ...formData, name: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Jumlah (Rp) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="numeric"
                            value={formData.amount}
                            onChangeText={text => setFormData({ ...formData, amount: text.replace(/[^0-9]/g, '') })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Kategori</Text>
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            <Text style={styles.dropdownTriggerText}>
                                {formData.category || 'Pilih Kategori'}
                            </Text>
                            <ChevronDown size={20} color="#64748B" />
                        </TouchableOpacity>

                        {showCategoryDropdown ? (
                            <View style={styles.dropdownMenu}>
                                <ScrollView nestedScrollEnabled={true}>
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.dropdownItem,
                                                formData.category === cat && styles.dropdownItemSelected
                                            ]}
                                            onPress={() => {
                                                setFormData({ ...formData, category: cat });
                                                setIsAddingCustomCategory(false);
                                                setShowCategoryDropdown(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                formData.category === cat && styles.dropdownItemTextSelected
                                            ]}>{cat}</Text>
                                            {formData.category === cat ? <View style={styles.selectedDot} /> : null}
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={[
                                            styles.dropdownItem,
                                            isAddingCustomCategory && styles.dropdownItemSelected
                                        ]}
                                        onPress={() => {
                                            setIsAddingCustomCategory(true);
                                            setFormData({ ...formData, category: '' });
                                            setShowCategoryDropdown(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.dropdownItemText,
                                            isAddingCustomCategory && styles.dropdownItemTextSelected
                                        ]}>+ Kategori Baru</Text>
                                        {isAddingCustomCategory ? <View style={styles.selectedDot} /> : null}
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        ) : null}
                    </View>

                    {isAddingCustomCategory ? (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Masukkan Kategori Baru</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Misal: Listrik, Air, dll"
                                value={formData.category}
                                onChangeText={text => setFormData({ ...formData, category: text })}
                            />
                        </View>
                    ) : null}

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Tanggal *</Text>
                        {renderDateInput(formData.date, (val) => setFormData({ ...formData, date: val }), showDatePicker, setShowDatePicker)}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Catatan (Opsional)</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                            placeholder="Masukkan catatan..."
                            multiline
                            value={formData.notes}
                            onChangeText={text => setFormData({ ...formData, notes: text })}
                        />
                    </View>
                </View>
            </BottomModalTemplate>

            {/* Filter Modal */}
            <BottomModalTemplate
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                title="Filter Pengeluaran"
                footer={(
                    <View style={styles.filterActionRow}>
                        <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilter}>
                            <Text style={styles.resetBtnText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.submitBtn, { flex: 1, marginTop: 0 }]} onPress={handleApplyFilter}>
                            <Text style={styles.submitBtnText}>Terapkan Filter</Text>
                        </TouchableOpacity>
                    </View>
                )}
            >
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
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
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
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
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Dari Tanggal</Text>
                        {renderDateInput(localFilters.startDate, (val) => setLocalFilters({ ...localFilters, startDate: val }), showStartDatePicker, setShowStartDatePicker, 'Pilih Tanggal Mulai')}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Sampai Tanggal</Text>
                        {renderDateInput(localFilters.endDate, (val) => setLocalFilters({ ...localFilters, endDate: val }), showEndDatePicker, setShowEndDatePicker, 'Pilih Tanggal Selesai')}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Kategori</Text>
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                        >
                            <Text style={styles.dropdownTriggerText}>
                                {localFilters.category || 'Semua Kategori'}
                            </Text>
                            <ChevronDown size={20} color="#64748B" />
                        </TouchableOpacity>

                        {showFilterDropdown ? (
                            <View style={styles.dropdownMenu}>
                                <ScrollView nestedScrollEnabled={true}>
                                    <TouchableOpacity
                                        style={[
                                            styles.dropdownItem,
                                            localFilters.category === '' && styles.dropdownItemSelected
                                        ]}
                                        onPress={() => {
                                            setLocalFilters({ ...localFilters, category: '' });
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.dropdownItemText,
                                            localFilters.category === '' && styles.dropdownItemTextSelected
                                        ]}>Semua Kategori</Text>
                                        {localFilters.category === '' ? <View style={styles.selectedDot} /> : null}
                                    </TouchableOpacity>
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.dropdownItem,
                                                localFilters.category === cat && styles.dropdownItemSelected
                                            ]}
                                            onPress={() => {
                                                setLocalFilters({ ...localFilters, category: cat });
                                                setShowFilterDropdown(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                localFilters.category === cat && styles.dropdownItemTextSelected
                                            ]}>{cat}</Text>
                                            {localFilters.category === cat ? <View style={styles.selectedDot} /> : null}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : null}
                    </View>
                </View>
            </BottomModalTemplate>

            {/* Floating Action Button for Add */}
            <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
                <Plus size={30} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerGradient: {
        backgroundColor: '#349BE5',
        paddingTop: Platform.OS === 'android' && StatusBar ? (StatusBar.currentHeight || 0) + 10 : 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
    },
    backBtnHeader: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#E1F5FE',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerFullTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    plusBtnHeader: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusIconBg: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBoxContainer: {
        position: 'absolute',
        bottom: -25,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 15,
        height: 54,
        borderWidth: 1,
        borderColor: '#E2E8F0', // Add explicit border for visibility sans shadow
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    contentWrapper: {
        flex: 1,
        marginTop: 10, // Adjusted for search box overlap
    },
    summarySection: {
        marginTop: 35,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    summaryCardPremium: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryTag: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    filterBtnMini: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    filterBtnMiniText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
        marginLeft: 4,
    },
    summaryAmountPremium: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 15,
    },
    summaryFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
    },
    summaryItem: {
        flex: 1,
    },
    summaryLabelText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    summaryValueText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 15,
    },
    activeFilterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#349BE515',
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 6,
    },
    activeFilterText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#349BE5',
    },
    listHeaderSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    expenseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    expenseName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    expenseDate: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 2,
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
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    categoryBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '900',
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '900',
        color: '#EF4444',
    },
    notesBox: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
    },
    notesText: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    recordedByBox: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    recordedByText: {
        fontSize: 10,
        color: '#CBD5E1',
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 25,
        backgroundColor: '#E1F5FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#64748B',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    formContainer: {
        paddingVertical: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
    },
    categoryPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#F1F5F9',
    },
    categoryItemText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    submitBtn: {
        backgroundColor: '#349BE5', // Owner Blue
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
        ...Platform.select({
            android: { elevation: 4 },
            ios: { shadowColor: '#349BE5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
        })
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
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
        backgroundColor: '#349BE5', // Owner Blue
        borderColor: '#349BE5',
    },
    quickFilterText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    quickFilterTextActive: {
        color: '#FFFFFF',
    },
    filterActionRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    resetBtn: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetBtnText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#64748B',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        backgroundColor: '#349BE5', // Owner Blue
        width: 65,
        height: 65,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            android: { elevation: 6 },
            ios: { shadowColor: '#349BE5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }
        })
    },
    // Dropdown Styles
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    dropdownTriggerText: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
    },
    dropdownMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        maxHeight: 250,
        ...Platform.select({
            android: { elevation: 4 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
        })
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '600',
    },
    dropdownItemSelected: {
        backgroundColor: '#F59E0B15', // Gold
    },
    dropdownItemTextSelected: {
        color: '#F59E0B',
        fontWeight: '900',
    },
    selectedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
    },
});

export default OwnerExpenseManagement;
