import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    RefreshControl,
    Dimensions,
    KeyboardAvoidingView,
    FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    ChevronLeft,
    Calendar,
    RefreshCw,
    Database,
    Wallet,
    Calculator,
    Save,
    RotateCcw,
    History as HistoryIcon,
    Trash2,
    CheckCircle,
    AlertCircle,
    Info,
    Search,
    XCircle,
    ArrowRightLeft,
    TrendingUp,
    TrendingDown,
    Plus,
    LayoutGrid,
    Clock
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';

const { width } = Dimensions.get('window');

// Helper functions (Moved outside to prevent re-renders)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/\./g, ''));
};

const getVarianceStatus = (varianceValue) => {
    if (varianceValue === 0) return { label: 'PAS', color: '#10B981', bgColor: '#ECFDF5', icon: CheckCircle };
    if (varianceValue > 0) return { label: 'KURANG', color: '#EF4444', bgColor: '#FEF2F2', icon: AlertCircle };
    return { label: 'LEBIH', color: '#F59E0B', bgColor: '#FFFBEB', icon: Info };
};

// Sub-components (Moved outside to prevent focus loss during renders)
const ComparisonCard = React.memo(({ title, expectedVal, actualState, setActualState, subText, color, icon: Icon }) => {
    const diff = expectedVal - parseNumber(actualState);
    const status = getVarianceStatus(diff);
    const IconStatus = status.icon;

    return (
        <View style={styles.compCard}>
            <View style={[styles.compCardSide, { backgroundColor: color }]}>
                <Icon color="#FFFFFF" size={20} />
            </View>
            <View style={styles.compCardContent}>
                <View style={styles.compHeader}>
                    <Text style={styles.compTitle}>{title}</Text>
                    <View style={[styles.statusMiniBadge, { backgroundColor: status.bgColor }]}>
                        <IconStatus size={10} color={status.color} />
                        <Text style={[styles.statusMiniText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.compGrid}>
                    <View style={styles.compSection}>
                        <Text style={styles.compLabel}>Sistem</Text>
                        <Text style={styles.compValExpected}>{formatCurrency(expectedVal)}</Text>
                        <Text style={styles.compSub}>{subText}</Text>
                    </View>

                    <ArrowRightLeft size={16} color="#CBD5E1" style={styles.arrowIcon} />

                    <View style={styles.compSection}>
                        <Text style={styles.compLabel}>Fisik (Input)</Text>
                        <View style={styles.inputMiniWrap}>
                            <TextInput
                                style={styles.inputMini}
                                value={actualState}
                                onChangeText={(val) => setActualState(formatNumber(val.replace(/[^0-9]/g, '')))}
                                placeholder="0"
                                keyboardType="numeric"
                                paddingVertical={0}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.diffBar}>
                    <Text style={styles.calcLabel}>Selisih:</Text>
                    <Text style={[styles.calcVal, { color: status.color }]}>
                        {diff === 0 ? 'Pas' : `${diff > 0 ? '-' : '+'}${formatCurrency(Math.abs(diff))}`}
                    </Text>
                </View>
            </View>
        </View>
    );
});

const CashReconciliation = ({ navigation }) => {
    const { showToast } = useToast();
    const { refreshTrigger } = useOrderNotification();

    // Helper for local date string YYYY-MM-DD to avoid timezone issues
    const getLocalDateString = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper for formatting display date from YYYY-MM-DD without timezone shift
    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // States
    const [activeTab, setActiveTab] = useState('reconcile'); // 'reconcile' or 'history'
    const [selectedDate, setSelectedDate] = useState(getLocalDateString());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Expected values from system
    const [expected, setExpected] = useState({
        tunai: 0,
        transfer: 0,
        gojek: 0,
        total: 0
    });

    const [transactionCount, setTransactionCount] = useState({
        tunai: 0,
        transfer: 0,
        gojek: 0,
        total: 0
    });

    // Actual values (input by user)
    const [actualTunai, setActualTunai] = useState('');
    const [actualTransfer, setActualTransfer] = useState('');
    const [actualGojek, setActualGojek] = useState('');
    const [notes, setNotes] = useState('');

    // History data
    const [history, setHistory] = useState([]);
    const [historyStartDate, setHistoryStartDate] = useState('');
    const [historyEndDate, setHistoryEndDate] = useState('');
    const [showHistStartDatePicker, setShowHistStartDatePicker] = useState(false);
    const [showHistEndDatePicker, setShowHistEndDatePicker] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalPages: 1,
        totalItems: 0,
        limit: 10
    });
    const [isRefreshing, setIsRefreshing] = useState(false);


    // Calculated values
    const actualTotal = useMemo(() => {
        return parseNumber(actualTunai) + parseNumber(actualTransfer) + parseNumber(actualGojek);
    }, [actualTunai, actualTransfer, actualGojek]);

    const variance = useMemo(() => {
        const vTunai = expected.tunai - parseNumber(actualTunai);
        const vTransfer = expected.transfer - parseNumber(actualTransfer);
        const vGojek = expected.gojek - parseNumber(actualGojek);
        return {
            tunai: vTunai,
            transfer: vTransfer,
            gojek: vGojek,
            total: vTunai + vTransfer + vGojek
        };
    }, [expected, actualTunai, actualTransfer, actualGojek]);

    // API calls with useCallback for optimization
    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiService.get(`/api/cash-reconciliation/summary?date=${selectedDate}`);
            if (response.data.message === 'success') {
                setExpected(response.data.data.expected);
                setTransactionCount(response.data.data.transactionCount);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
            showToast('Gagal memuat data transaksi', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedDate, showToast]);

    const fetchHistory = useCallback(async (page = 1) => {
        try {
            const response = await apiService.get(`/api/cash-reconciliation/history?page=${page}&limit=10&startDate=${historyStartDate}&endDate=${historyEndDate}`);
            if (response.data.message === 'success') {
                if (page === 1) {
                    setHistory(response.data.data);
                } else {
                    setHistory(prev => [...prev, ...response.data.data]);
                }
                if (response.data.pagination) {
                    setPagination(response.data.pagination);
                }
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    }, [historyStartDate, historyEndDate]);

    useEffect(() => {
        fetchSummary();
        fetchHistory(1);
    }, [selectedDate, refreshTrigger]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        if (activeTab === 'reconcile') {
            await fetchSummary();
        } else {
            setCurrentPage(1);
            await fetchHistory(1);
        }
        setIsRefreshing(false);
    }, [activeTab, fetchSummary, fetchHistory]);

    const handleSave = useCallback(async () => {
        if (!actualTunai && !actualTransfer && !actualGojek) {
            showToast('Mohon isi minimal satu metode pembayaran', 'error');
            return;
        }

        setSaving(true);
        try {
            const response = await apiService.post('/api/cash-reconciliation/save', {
                date: selectedDate,
                actual_tunai: parseNumber(actualTunai),
                actual_transfer: parseNumber(actualTransfer),
                actual_gojek: parseNumber(actualGojek),
                notes: notes
            });

            if (response.data.message === 'success') {
                showToast('Rekonsiliasi berhasil disimpan', 'success');
                setCurrentPage(1);
                fetchHistory(1);
                setActualTunai('');
                setActualTransfer('');
                setActualGojek('');
                setNotes('');
                setActiveTab('history');
            } else {
                showToast('Gagal menyimpan rekonsiliasi', 'error');
            }
        } catch (error) {
            console.error('Error saving reconciliation:', error);
            showToast('Gagal menyimpan rekonsiliasi', 'error');
        } finally {
            setSaving(false);
        }
    }, [actualTunai, actualTransfer, actualGojek, notes, selectedDate, showToast, fetchHistory]);

    const handleReset = useCallback(() => {
        setActualTunai('');
        setActualTransfer('');
        setActualGojek('');
        setNotes('');
    }, []);

    const handleDelete = useCallback((id) => {
        Alert.alert(
            'Hapus Rekonsiliasi',
            'Apakah Anda yakin ingin menghapus data rekonsiliasi ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiService.delete(`/api/cash-reconciliation/${id}`);
                            if (response.data.message === 'success') {
                                showToast('Data rekonsiliasi berhasil dihapus', 'success');
                                fetchHistory(1);
                                fetchSummary();
                            }
                        } catch (error) {
                            console.error('Error deleting:', error);
                            showToast('Gagal menghapus data', 'error');
                        }
                    }
                }
            ]
        );
    }, [showToast, fetchHistory, fetchSummary]);


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* NEW PREMIUM HEADER */}
            <View style={styles.headerPremium}>
                <View style={styles.headerNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>Rekonsiliasi</Text>
                    <TouchableOpacity onPress={handleRefresh} style={styles.navBtn}>
                        {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <RefreshCw size={20} color="#FFFFFF" />}
                    </TouchableOpacity>
                </View>

                <View style={styles.headerSummary}>
                    <View>
                        <Text style={styles.sumLabel}>Total Selisih Hari Ini</Text>
                        <Text style={[styles.sumValue, { color: getVarianceStatus(variance.total).color === '#10B981' ? '#FFFFFF' : getVarianceStatus(variance.total).color }]}>
                            {formatCurrency(Math.abs(variance.total))}
                        </Text>
                    </View>
                    <View style={[styles.sumBadge, { backgroundColor: getVarianceStatus(variance.total).bgColor }]}>
                        <Text style={[styles.sumBadgeText, { color: getVarianceStatus(variance.total).color }]}>
                            {getVarianceStatus(variance.total).label}
                        </Text>
                    </View>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'reconcile' && styles.tabActive]}
                        onPress={() => setActiveTab('reconcile')}
                    >
                        <LayoutGrid size={18} color={activeTab === 'reconcile' ? '#0F172A' : '#FFFFFF'} />
                        <Text style={[styles.tabBtnText, activeTab === 'reconcile' && styles.tabActiveText]}>Rekonsiliasi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'history' && styles.tabActive]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Clock size={18} color={activeTab === 'history' ? '#0F172A' : '#FFFFFF'} />
                        <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabActiveText]}>Riwayat</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* TAB CONTENT: RECONCILE */}
            {activeTab === 'reconcile' ? (
                <ScrollView
                    style={styles.mainContent}
                    contentContainerStyle={styles.scrollMain}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#349BE5']} />
                    }
                >
                    {/* Step 1: Date */}
                    <View style={styles.sectionHeaderLine}>
                        <Text style={styles.sectionStep}>01</Text>
                        <Text style={styles.sectionTitleStyle}>Pilih Tanggal</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.modernDateBtn}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <View style={styles.dateIconBox}>
                            <Calendar size={22} color="#0F172A" />
                        </View>
                        <View>
                            <Text style={styles.dateLabelSmall}>Tanggal Yang Dicek</Text>
                            <Text style={styles.dateTextBig}>
                                {formatDisplayDate(selectedDate)}
                            </Text>
                        </View>
                        <View style={styles.chevronBox}>
                            <Plus size={16} color="#64748B" />
                        </View>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={new Date(selectedDate)}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, date) => {
                                setShowDatePicker(false);
                                if (date) {
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    setSelectedDate(`${year}-${month}-${day}`);
                                }
                            }}
                        />
                    )}

                    {/* Step 2: Comparisons */}
                    <View style={styles.sectionHeaderLine}>
                        <Text style={styles.sectionStep}>02</Text>
                        <Text style={styles.sectionTitleStyle}>Perbandingan Kas</Text>
                    </View>

                    <ComparisonCard
                        title="Uang Tunai"
                        expectedVal={expected.tunai}
                        actualState={actualTunai}
                        setActualState={setActualTunai}
                        subText={`${transactionCount.tunai} Transaksi Tunai`}
                        color="#10B981"
                        icon={Wallet}
                    />

                    <ComparisonCard
                        title="Uang Transfer"
                        expectedVal={expected.transfer}
                        actualState={actualTransfer}
                        setActualState={setActualTransfer}
                        subText={`${transactionCount.transfer} Transaksi Transfer`}
                        color="#3B82F6"
                        icon={Database}
                    />

                    <ComparisonCard
                        title="OVO/Gojek/Lainnya"
                        expectedVal={expected.gojek}
                        actualState={actualGojek}
                        setActualState={setActualGojek}
                        subText={`${transactionCount.gojek} Transaksi Online`}
                        color="#8B5CF6"
                        icon={RefreshCw}
                    />

                    {/* Step 3: Notes & Save */}
                    <View style={styles.sectionHeaderLine}>
                        <Text style={styles.sectionStep}>03</Text>
                        <Text style={styles.sectionTitleStyle}>Finalisasi</Text>
                    </View>

                    <View style={styles.finalCard}>
                        <View style={styles.totalCompareRow}>
                            <View>
                                <Text style={styles.totalCompareLabel}>Total Sistem</Text>
                                <Text style={styles.totalCompareVal}>{formatCurrency(expected.total)}</Text>
                            </View>
                            <View style={styles.vLine} />
                            <View>
                                <Text style={styles.totalCompareLabel}>Total Fisik</Text>
                                <Text style={[styles.totalCompareVal, { color: '#1E40AF' }]}>{formatCurrency(actualTotal)}</Text>
                            </View>
                        </View>

                        <Text style={styles.notesLabelStyle}>Catatan Tambahan</Text>
                        <TextInput
                            style={styles.modernNotesInput}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Alasan jika ada selisih..."
                            multiline
                        />

                        <View style={styles.saveActionRow}>
                            <TouchableOpacity style={styles.resetBtnStyle} onPress={handleReset}>
                                <RotateCcw size={20} color="#64748B" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtnStyle, saving && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.saveBtnTextStyle}>Simpan Rekonsiliasi</Text>
                                        <ChevronLeft size={20} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            ) : (
                /* TAB CONTENT: HISTORY */
                <View style={styles.historyContainer}>
                    <View style={styles.historyFilterBar}>
                        <View style={styles.miniDateRow}>
                            <TouchableOpacity
                                style={styles.filterDateBtn}
                                onPress={() => setShowHistStartDatePicker(true)}
                            >
                                <Calendar size={14} color="#64748B" />
                                <Text style={styles.filterDateText}>{historyStartDate || 'Mulai'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.dash}>-</Text>
                            <TouchableOpacity
                                style={styles.filterDateBtn}
                                onPress={() => setShowHistEndDatePicker(true)}
                            >
                                <Calendar size={14} color="#64748B" />
                                <Text style={styles.filterDateText}>{historyEndDate || 'Selesai'}</Text>
                            </TouchableOpacity>
                            {(historyStartDate || historyEndDate) && (
                                <TouchableOpacity
                                    onPress={() => { setHistoryStartDate(''); setHistoryEndDate(''); }}
                                    style={styles.clearMini}
                                >
                                    <XCircle size={16} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity style={styles.goBtn} onPress={() => fetchHistory(1)}>
                            <Search size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {showHistStartDatePicker && (
                        <DateTimePicker
                            value={historyStartDate ? new Date(historyStartDate) : new Date()}
                            mode="date"
                            onChange={(event, date) => {
                                setShowHistStartDatePicker(false);
                                if (date) setHistoryStartDate(date.toISOString().split('T')[0]);
                            }}
                        />
                    )}
                    {showHistEndDatePicker && (
                        <DateTimePicker
                            value={historyEndDate ? new Date(historyEndDate) : new Date()}
                            mode="date"
                            onChange={(event, date) => {
                                setShowHistEndDatePicker(false);
                                if (date) setHistoryEndDate(date.toISOString().split('T')[0]);
                            }}
                        />
                    )}

                    <FlatList
                        data={history}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => {
                            const totalVar = parseFloat(item.variance_tunai) + parseFloat(item.variance_transfer) + parseFloat(item.variance_gojek);
                            const status = getVarianceStatus(totalVar);
                            const IconStat = status.icon;

                            return (
                                <View style={styles.histItemPremium}>
                                    <View style={[styles.histStatusStrip, { backgroundColor: status.color }]} />
                                    <View style={styles.histMain}>
                                        <View style={styles.histTop}>
                                            <View>
                                                <Text style={styles.histDateText}>
                                                    {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </Text>
                                                <Text style={styles.histUserText}>Rekon oleh: {item.reconciled_by}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteCircle}>
                                                <Trash2 size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.histStatsRow}>
                                            <View style={styles.histStatBox}>
                                                <Text style={styles.histStatLbl}>Fisik</Text>
                                                <Text style={styles.histStatVal}>
                                                    {formatCurrency(parseFloat(item.actual_tunai))}
                                                </Text>
                                            </View>
                                            <View style={styles.histStatBox}>
                                                <Text style={styles.histStatLbl}>Transfer</Text>
                                                <Text style={styles.histStatVal}>
                                                    {formatCurrency(parseFloat(item.actual_transfer))}
                                                </Text>
                                            </View>
                                            <View style={styles.histStatBox}>
                                                <Text style={styles.histStatLbl}>Selisih</Text>
                                                <View style={styles.varRow}>
                                                    <IconStat size={12} color={status.color} />
                                                    <Text style={[styles.histStatVal, { color: status.color, marginLeft: 4 }]}>
                                                        {formatCurrency(Math.abs(totalVar))}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {item.notes ? (
                                            <View style={styles.histNoteWrap}>
                                                <Info size={12} color="#94A3B8" />
                                                <Text style={styles.histNoteText} numberOfLines={1}>"{item.notes}"</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            );
                        }}
                        contentContainerStyle={styles.histListScroll}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#349BE5']} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Calculator size={48} color="#E2E8F0" />
                                <Text style={styles.emptyTextLarge}>Belum Ada Riwayat</Text>
                                <Text style={styles.emptyTextSmall}>Hasil rekonsiliasi yang Anda simpan akan muncul di sini.</Text>
                            </View>
                        }
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        initialNumToRender={10}
                    />
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    // HEADER STYLES
    headerPremium: {
        backgroundColor: '#349BE5',
        paddingTop: Platform.OS === 'android' && StatusBar ? (StatusBar.currentHeight || 0) + 10 : 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        ...Platform.select({
            android: { elevation: 10 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 }
        })
    },
    headerNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    navBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navTitle: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    headerSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    sumLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    sumValue: {
        fontSize: 28,
        fontWeight: '900',
    },
    sumBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    sumBadgeText: {
        fontSize: 12,
        fontWeight: '900',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 5,
        borderRadius: 15,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
    },
    tabActiveText: {
        color: '#349BE5',
    },
    tabBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // RECONCILE STYLES
    mainContent: {
        flex: 1,
    },
    scrollMain: {
        padding: 20,
        paddingBottom: 100,
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    sectionStep: {
        fontSize: 24,
        fontWeight: '900',
        color: '#E2E8F0',
        marginRight: 10,
    },
    sectionTitleStyle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#334155',
    },
    modernDateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    dateIconBox: {
        width: 45,
        height: 45,
        backgroundColor: '#EFF6FF',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    dateLabelSmall: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    dateTextBig: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: '800',
    },
    chevronBox: {
        flex: 1,
        alignItems: 'flex-end',
    },

    // COMPARISON CARD STYLES
    compCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 12,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    compCardSide: {
        width: 42,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
    },
    compCardContent: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    compHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    compTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    statusMiniBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    statusMiniText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    compGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    compSection: {
        flex: 1,
    },
    compLabel: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    compValExpected: {
        color: '#334155',
        fontSize: 14,
        fontWeight: '700',
    },
    compSub: {
        color: '#CBD5E1',
        fontSize: 9,
    },
    arrowIcon: {
        marginHorizontal: 8,
    },
    inputMiniWrap: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 8,
    },
    inputMini: {
        height: 32,
        paddingVertical: 0,
        fontSize: 13,
        fontWeight: '900',
        color: '#D97706',
    },
    diffBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
    },
    calcLabel: {
        fontSize: 11,
        color: '#64748B',
        marginRight: 5,
        fontWeight: 'bold',
    },
    calcVal: {
        fontSize: 13,
        fontWeight: '900',
    },

    // FINAL CARD STYLE
    finalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    totalCompareRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: 15,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 20,
    },
    totalCompareLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    totalCompareVal: {
        fontSize: 16,
        fontWeight: '900',
        color: '#334155',
        textAlign: 'center',
    },
    vLine: {
        width: 1,
        height: '80%',
        backgroundColor: '#E2E8F0',
    },
    notesLabelStyle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 5,
    },
    modernNotesInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        height: 80,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#1E293B',
        marginBottom: 20,
    },
    saveActionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    resetBtnStyle: {
        width: 55,
        height: 55,
        backgroundColor: '#F1F5F9',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    saveBtnStyle: {
        flex: 1,
        height: 55,
        backgroundColor: '#0F172A', // Owner Dark
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    saveBtnTextStyle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },

    // HISTORY STYLES
    historyContainer: {
        flex: 1,
    },
    historyFilterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 15,
        gap: 10,
    },
    miniDateRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    filterDateBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    filterDateText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: 'bold',
    },
    dash: {
        marginHorizontal: 8,
        color: '#CBD5E1',
    },
    goBtn: {
        width: 48,
        height: 48,
        backgroundColor: '#0F172A', // Owner Dark
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearMini: {
        marginLeft: 5,
    },
    histListScroll: {
        padding: 20,
        paddingBottom: 50,
    },
    histItemPremium: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        marginBottom: 15,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    histStatusStrip: {
        width: 12,
    },
    histMain: {
        flex: 1,
        padding: 15,
    },
    histTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    histDateText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    histUserText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginTop: 2,
    },
    deleteCircle: {
        width: 32,
        height: 32,
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    histStatsRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
        gap: 15,
    },
    histStatBox: {
        flex: 1,
    },
    histStatLbl: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    histStatVal: {
        fontSize: 13,
        fontWeight: '800',
        color: '#334155',
    },
    varRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    histNoteWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
        backgroundColor: '#FFFBEB',
        padding: 8,
        borderRadius: 8,
    },
    histNoteText: {
        fontSize: 11,
        fontStyle: 'italic',
        color: '#B45309',
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyTextLarge: {
        fontSize: 18,
        fontWeight: '900',
        color: '#334155',
        marginTop: 20,
    },
    emptyTextSmall: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    }
});

export default CashReconciliation;
