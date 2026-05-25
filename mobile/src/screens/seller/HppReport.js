import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Platform,
} from 'react-native';
import {
    ChevronLeft,
    Calendar,
    ChevronDown,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Box,
    Sparkles,
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const HppReport = ({ navigation }) => {
    const { showToast } = useToast();
    
    // Date states
    const getLocalDateString = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateString();
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Data states
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    
    // Pagination for ingredients
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchReport = useCallback(async (sd = startDate, ed = endDate) => {
        setLoading(true);
        setExpandedRows({});
        try {
            let query = '';
            if (sd && ed) query = `?startDate=${sd}&endDate=${ed}`;
            else if (sd) query = `?startDate=${sd}`;
            else if (ed) query = `?endDate=${ed}`;

            const response = await apiService.get(`/api/reports/hpp${query}`);
            if (response.data.message === 'success') {
                setReportData(response.data.data);
                setCurrentPage(1);
            } else {
                showToast('Gagal memuat laporan HPP.', 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan jaringan.', 'error');
            console.error('Fetch HPP Report Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [startDate, endDate, showToast]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchReport();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const applyPreset = (preset) => {
        const now = new Date();
        let sd = todayStr;
        let ed = todayStr;

        if (preset === 'week') {
            const d = new Date(now);
            d.setDate(d.getDate() - 6);
            sd = getLocalDateString(d);
        } else if (preset === 'month') {
            sd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        }

        setStartDate(sd);
        setEndDate(ed);
        fetchReport(sd, ed);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Laporan HPP & Laba</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Date Picker Section */}
                <View style={styles.dateFilterContainer}>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDatePicker(true)}>
                        <Calendar size={16} color="#FFFFFF" />
                        <Text style={styles.dateText}>{startDate}</Text>
                    </TouchableOpacity>
                    <Text style={styles.dateSeparator}>s/d</Text>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndDatePicker(true)}>
                        <Calendar size={16} color="#FFFFFF" />
                        <Text style={styles.dateText}>{endDate}</Text>
                    </TouchableOpacity>
                </View>

                {/* Preset Buttons */}
                <View style={styles.presetsContainer}>
                    {[
                        { label: 'Hari Ini', preset: 'today' },
                        { label: '7 Hari Terakhir', preset: 'week' },
                        { label: 'Bulan Ini', preset: 'month' },
                    ].map(({ label, preset }) => (
                        <TouchableOpacity
                            key={preset}
                            onPress={() => applyPreset(preset)}
                            style={styles.presetBtn}
                        >
                            <Text style={styles.presetText}>{label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* DateTimePickers */}
            {showStartDatePicker && (
                <DateTimePicker
                    value={new Date(startDate)}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                        setShowStartDatePicker(false);
                        if (date) {
                            const newSd = getLocalDateString(date);
                            setStartDate(newSd);
                            fetchReport(newSd, endDate);
                        }
                    }}
                />
            )}
            {showEndDatePicker && (
                <DateTimePicker
                    value={new Date(endDate)}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                        setShowEndDatePicker(false);
                        if (date) {
                            const newEd = getLocalDateString(date);
                            setEndDate(newEd);
                            fetchReport(startDate, newEd);
                        }
                    }}
                />
            )}

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1E40AF']} />}
            >
                {loading && !reportData ? (
                    <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 50 }} />
                ) : reportData ? (
                    <>
                        {/* Summary Cards */}
                        <View style={styles.summarySection}>
                            {/* Total Penjualan */}
                            <View style={styles.summaryCard}>
                                <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
                                    <DollarSign size={20} color="#2563EB" />
                                </View>
                                <View style={styles.summaryInfo}>
                                    <Text style={styles.summaryLabel}>Total Penjualan</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(reportData.summary.totalRevenue)}</Text>
                                </View>
                            </View>

                            {/* Total Modal */}
                            <View style={styles.summaryCard}>
                                <View style={[styles.iconWrap, { backgroundColor: '#FFF7ED' }]}>
                                    <TrendingDown size={20} color="#EA580C" />
                                </View>
                                <View style={styles.summaryInfo}>
                                    <Text style={styles.summaryLabel}>Total Modal (HPP)</Text>
                                    <Text style={[styles.summaryValue, { color: '#EA580C' }]}>
                                        {formatCurrency(reportData.summary.totalHpp)}
                                    </Text>
                                </View>
                            </View>

                            {/* Laba Bersih */}
                            <View style={[styles.summaryCard, { borderLeftWidth: 4, borderLeftColor: reportData.summary.netProfit >= 0 ? '#10B981' : '#EF4444' }]}>
                                <View style={[styles.iconWrap, { backgroundColor: reportData.summary.netProfit >= 0 ? '#ECFDF5' : '#FEF2F2' }]}>
                                    <TrendingUp size={20} color={reportData.summary.netProfit >= 0 ? '#10B981' : '#EF4444'} />
                                </View>
                                <View style={styles.summaryInfo}>
                                    <Text style={styles.summaryLabel}>Laba Bersih</Text>
                                    <Text style={[styles.summaryValue, { color: reportData.summary.netProfit >= 0 ? '#10B981' : '#EF4444' }]}>
                                        {formatCurrency(reportData.summary.netProfit)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Breakdown per Menu */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Box size={20} color="#1E40AF" />
                                <Text style={styles.sectionTitle}>Rincian per Menu</Text>
                            </View>
                            <View style={styles.divider} />

                            {reportData.breakdown.length === 0 ? (
                                <Text style={styles.emptyText}>Tidak ada data penjualan pada rentang tanggal ini.</Text>
                            ) : (
                                reportData.breakdown.map((item) => {
                                    const isExpanded = !!expandedRows[item.id];
                                    const hasComponents = item.components && item.components.length > 0;
                                    
                                    return (
                                        <View key={item.id} style={styles.itemRow}>
                                            <TouchableOpacity
                                                onPress={() => hasComponents && toggleRow(item.id)}
                                                style={styles.itemHeader}
                                                activeOpacity={hasComponents ? 0.7 : 1}
                                            >
                                                <View style={styles.itemHeaderLeft}>
                                                    {hasComponents ? (
                                                        isExpanded ? <ChevronDown size={18} color="#2563EB" /> : <ChevronRight size={18} color="#94A3B8" />
                                                    ) : (
                                                        <View style={{ width: 18 }} />
                                                    )}
                                                    <View style={{ marginLeft: 6, flex: 1 }}>
                                                        <Text style={styles.itemName}>{item.name}</Text>
                                                        <Text style={styles.itemQty}>Terjual: {item.quantitySold} porsi</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.itemHeaderRight}>
                                                    <Text style={[styles.itemProfit, { color: item.netProfit >= 0 ? '#10B981' : '#EF4444' }]}>
                                                        {formatCurrency(item.netProfit)}
                                                    </Text>
                                                    <Text style={styles.itemLabel}>Laba</Text>
                                                </View>
                                            </TouchableOpacity>

                                            {/* Details inside row */}
                                            <View style={styles.itemQuickStats}>
                                                <View style={styles.statCol}>
                                                    <Text style={styles.statLabel}>Penjualan</Text>
                                                    <Text style={styles.statVal}>{formatCurrency(item.totalRevenue)}</Text>
                                                </View>
                                                <View style={styles.statCol}>
                                                    <Text style={styles.statLabel}>Total Modal</Text>
                                                    <Text style={[styles.statVal, { color: '#EA580C' }]}>{formatCurrency(item.totalHpp)}</Text>
                                                </View>
                                            </View>

                                            {isExpanded && hasComponents && (
                                                <View style={styles.componentsContainer}>
                                                    <Text style={styles.componentHeader}>Detail Komponen Modal:</Text>
                                                    {item.components.map((comp, idx) => (
                                                        <View key={idx} style={styles.componentItem}>
                                                            <Text style={styles.componentName}>{comp.name}</Text>
                                                            <View style={styles.componentCostContainer}>
                                                                <Text style={styles.componentCost}>{formatCurrency(comp.totalCost)}</Text>
                                                                <Text style={styles.componentCostDetail}>
                                                                    ({formatCurrency(comp.totalCost / item.quantitySold)} × {item.quantitySold})
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                            
                                            <View style={styles.rowDivider} />
                                        </View>
                                    );
                                })
                            )}
                        </View>

                        {/* Rekap Total Pengeluaran per Bahan */}
                        {reportData.globalIngredients && reportData.globalIngredients.length > 0 && (
                            <View style={[styles.sectionCard, { marginTop: 20 }]}>
                                <View style={styles.sectionHeader}>
                                    <Sparkles size={20} color="#EA580C" />
                                    <Text style={styles.sectionTitle}>Total Pengeluaran per Bahan</Text>
                                </View>
                                <View style={styles.divider} />

                                {reportData.globalIngredients
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((ing, idx) => (
                                        <View key={idx} style={styles.ingRow}>
                                            <View style={styles.ingInfo}>
                                                <Text style={styles.ingName}>{ing.name}</Text>
                                                <Text style={styles.ingMenus} numberOfLines={1}>
                                                    Menu: {ing.usedInMenus.join(', ')}
                                                </Text>
                                            </View>
                                            <Text style={styles.ingCost}>{formatCurrency(ing.totalCost)}</Text>
                                        </View>
                                    ))
                                }

                                {/* Pagination Controls */}
                                {reportData.globalIngredients.length > itemsPerPage && (
                                    <View style={styles.paginationContainer}>
                                        <TouchableOpacity
                                            disabled={currentPage === 1}
                                            onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                                        >
                                            <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>
                                                Seblmnya
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.pageIndicator}>
                                            {currentPage} / {Math.ceil(reportData.globalIngredients.length / itemsPerPage)}
                                        </Text>
                                        <TouchableOpacity
                                            disabled={currentPage === Math.ceil(reportData.globalIngredients.length / itemsPerPage)}
                                            onPress={() => setCurrentPage(p => Math.min(Math.ceil(reportData.globalIngredients.length / itemsPerPage), p + 1))}
                                            style={[styles.pageBtn, currentPage === Math.ceil(reportData.globalIngredients.length / itemsPerPage) && styles.pageBtnDisabled]}
                                        >
                                            <Text style={[styles.pageBtnText, currentPage === Math.ceil(reportData.globalIngredients.length / itemsPerPage) && styles.pageBtnTextDisabled]}>
                                                Selanjutnya
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={styles.ingFooter}>
                                    <Text style={styles.ingFooterLabel}>Total Semua Bahan</Text>
                                    <Text style={styles.ingFooterCost}>
                                        {formatCurrency(reportData.globalIngredients.reduce((sum, ing) => sum + ing.totalCost, 0))}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </>
                ) : (
                    <Text style={styles.emptyText}>Data tidak tersedia</Text>
                )}
            </ScrollView>
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateFilterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        padding: 8,
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    dateSeparator: {
        color: '#FFFFFF',
        marginHorizontal: 15,
    },
    presetsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 12,
    },
    presetBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    presetText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    summarySection: {
        gap: 12,
        marginBottom: 20,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 1,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryInfo: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2563EB',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#64748B',
        paddingVertical: 20,
        fontSize: 14,
    },
    itemRow: {
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    itemHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    itemQty: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    itemHeaderRight: {
        alignItems: 'flex-end',
    },
    itemProfit: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    itemLabel: {
        fontSize: 10,
        color: '#94A3B8',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginTop: 2,
    },
    itemQuickStats: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
        gap: 15,
    },
    statCol: {
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        color: '#64748B',
        marginBottom: 2,
    },
    statVal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    componentsContainer: {
        marginTop: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    componentHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1E40AF',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    componentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#DBEAFE',
    },
    componentName: {
        fontSize: 12,
        color: '#1E293B',
        fontWeight: '500',
        flex: 1,
    },
    componentCostContainer: {
        alignItems: 'flex-end',
    },
    componentCost: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#EA580C',
    },
    componentCostDetail: {
        fontSize: 9,
        color: '#64748B',
        marginTop: 1,
    },
    rowDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginTop: 16,
    },
    ingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    ingInfo: {
        flex: 1,
        marginRight: 10,
    },
    ingName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    ingMenus: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    ingCost: {
        fontSize: 13,
        fontWeight: '700',
        color: '#EA580C',
    },
    ingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        borderRadius: 10,
        padding: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    ingFooterLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#9A3412',
    },
    ingFooterCost: {
        fontSize: 14,
        fontWeight: '800',
        color: '#C2410C',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 4,
    },
    pageBtn: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pageBtnDisabled: {
        opacity: 0.5,
    },
    pageBtnText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
    },
    pageBtnTextDisabled: {
        color: '#94A3B8',
    },
    pageIndicator: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: 'bold',
    },
});

export default HppReport;
