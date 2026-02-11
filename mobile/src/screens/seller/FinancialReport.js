import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    StatusBar,
    Alert
} from 'react-native';
import {
    ChevronLeft,
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Briefcase,
    PieChart,
    Download,
    Share2,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    CircleDollarSign
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import ViewShot from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const FinancialReport = ({ navigation }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const reportRef = useRef();

    // Date Filter State
    const getLocalDateString = (daysAgo = 0) => {
        const date = new Date();
        if (daysAgo !== 0) date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(getLocalDateString(30)); // Default last 30 days
    const [endDate, setEndDate] = useState(getLocalDateString());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Data State
    const [financialData, setFinancialData] = useState(null);
    const [balances, setBalances] = useState({ lapak: 0, owner: 0 });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Financial Summary
            const summaryRes = await apiService.get(`/api/reports/financial-summary?startDate=${startDate}&endDate=${endDate}`);

            // Fetch Balances (Try reusing existing endpoints)
            const [lapakRes, ownerRes] = await Promise.all([
                apiService.get('/api/accounts/lapak_deposit').catch(() => ({ data: { data: { account: { balance: 0 } } } })),
                apiService.get('/api/accounts/owner_deposit').catch(() => ({ data: { data: { account: { balance: 0 } } } }))
            ]);

            if (summaryRes.data.message === 'success') {
                setFinancialData(summaryRes.data.data);
            }

            setBalances({
                lapak: parseFloat(lapakRes?.data?.data?.account?.balance || 0),
                owner: parseFloat(ownerRes?.data?.data?.account?.balance || 0)
            });

        } catch (error) {
            console.error('Error fetching financial report:', error);
            showToast('Gagal memuat laporan keuangan', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [startDate, endDate, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleExportPDF = async () => {
        if (!financialData) return;
        try {
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                        h1 { color: #1E40AF; text-align: center; }
                        .period { text-align: center; color: #666; margin-bottom: 30px; }
                        .section { margin-bottom: 25px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
                        .section-header { background: #F3F4F6; padding: 10px 15px; font-weight: bold; border-bottom: 1px solid #ddd; }
                        .row { display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #eee; }
                        .row:last-child { border-bottom: none; }
                        .label { color: #555; }
                        .value { font-weight: bold; }
                        .highlight { color: #10B981; }
                        .danger { color: #EF4444; }
                        .total-row { background: #EFF6FF; font-size: 1.1em; }
                    </style>
                </head>
                <body>
                    <h1>Laporan Keuangan & Audit</h1>
                    <div class="period">Periode: ${startDate} s/d ${endDate}</div>

                    <div class="section">
                        <div class="section-header">Laporan Laba Rugi</div>
                        <div class="row">
                            <span class="label">Omzet Penjualan (Revenue)</span>
                            <span class="value">${formatCurrency(financialData.revenue)}</span>
                        </div>
                        <div class="row">
                            <span class="label">Harga Pokok Penjualan (HPP Estimasi)</span>
                            <span class="value danger">(${formatCurrency(financialData.cogs)})</span>
                        </div>
                        <div class="row total-row">
                            <span class="label">Laba Kotor (Gross Profit)</span>
                            <span class="value highlight">${formatCurrency(financialData.grossProfit)}</span>
                        </div>
                        <div class="row">
                            <span class="label">Total Pengeluaran Operasional</span>
                            <span class="value danger">(${formatCurrency(financialData.expenses)})</span>
                        </div>
                        <div class="row total-row" style="background: #ECFDF5;">
                            <span class="label">Laba Bersih (Net Profit)</span>
                            <span class="value highlight" style="font-size: 1.2em;">${formatCurrency(financialData.netProfit)}</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-header">Neraca Aset (Nilai Kekayaan Stok)</div>
                        <div class="row">
                            <span class="label">Stok Barang Jadi (Menu)</span>
                            <span class="value">${formatCurrency(financialData.assets.menu)}</span>
                        </div>
                        <div class="row">
                            <span class="label">Stok Bahan Baku</span>
                            <span class="value">${formatCurrency(financialData.assets.rawMaterial)}</span>
                        </div>
                        <div class="row total-row">
                            <span class="label">Total Nilai Aset</span>
                            <span class="value highlight">${formatCurrency(financialData.assets.total)}</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-header">Posisi Saldo Kas</div>
                        <div class="row">
                            <span class="label">Saldo Lapak Saat Ini</span>
                            <span class="value">${formatCurrency(balances.lapak)}</span>
                        </div>
                        <div class="row">
                            <span class="label">Saldo Owner Saat Ini</span>
                            <span class="value">${formatCurrency(balances.owner)}</span>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 50px; font-size: 0.8em; color: #999;">
                        Dicetak pada: ${new Date().toLocaleString('id-ID')}
                    </div>
                </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('Error', 'Gagal mencetak laporan');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Laporan Keuangan</Text>
                    <TouchableOpacity onPress={handleExportPDF} style={styles.shareBtn}>
                        <Download size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Date Picker */}
                <View style={styles.dateFilterContainer}>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDatePicker(true)}>
                        <Calendar size={16} color="#ffffff" />
                        <Text style={styles.dateText}>{startDate}</Text>
                    </TouchableOpacity>
                    <Text style={styles.dateSeparator}>s/d</Text>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndDatePicker(true)}>
                        <Calendar size={16} color="#ffffff" />
                        <Text style={styles.dateText}>{endDate}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {showStartDatePicker && (
                <DateTimePicker
                    value={new Date(startDate)}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                        setShowStartDatePicker(false);
                        if (date) setStartDate(date.toISOString().split('T')[0]);
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
                        if (date) setEndDate(date.toISOString().split('T')[0]);
                    }}
                />
            )}

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1E40AF']} />}
            >
                {loading && !financialData ? (
                    <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 50 }} />
                ) : financialData ? (
                    <>
                        {/* Laba Rugi Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeaderDecoration} />

                            {/* Header Inside Card */}
                            <View style={styles.cardHeaderInternal}>
                                <Briefcase size={20} color="#1E40AF" />
                                <Text style={styles.cardSectionTitle}>Analisis Laba Rugi</Text>
                            </View>
                            <View style={styles.cardInnerDivider} />

                            <View style={styles.row}>
                                <View style={styles.labelContainer}>
                                    <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                                        <ArrowUpRight size={16} color="#10B981" />
                                    </View>
                                    <Text style={styles.label}>Pemasukan (Omzet)</Text>
                                </View>
                                <Text style={styles.valuePositive}>{formatCurrency(financialData.revenue)}</Text>
                            </View>
                            <View style={styles.separatorWithOffset} />
                            <View style={styles.row}>
                                <View style={styles.labelContainer}>
                                    <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                                        <ArrowDownRight size={16} color="#EF4444" />
                                    </View>
                                    <Text style={styles.label}>HPP (Estimasi Modal)</Text>
                                </View>
                                <Text style={styles.valueNegative}>({formatCurrency(financialData.cogs)})</Text>
                            </View>
                            <View style={styles.separatorWithOffset} />

                            <View style={styles.grossProfitRow}>
                                <Text style={styles.grossProfitLabel}>Laba Kotor</Text>
                                <Text style={styles.grossProfitValue}>{formatCurrency(financialData.grossProfit)}</Text>
                            </View>
                            <View style={styles.separatorWithOffset} />

                            <View style={styles.row}>
                                <View style={styles.labelContainer}>
                                    <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                                        <TrendingDown size={16} color="#F97316" />
                                    </View>
                                    <Text style={styles.label}>Pengeluaran Ops.</Text>
                                </View>
                                <Text style={styles.valueNegative}>({formatCurrency(financialData.expenses)})</Text>
                            </View>
                            <View style={styles.separatorWithOffset} />

                            <View style={styles.netProfitContainer}>
                                <View style={styles.netProfitHeader}>
                                    <Text style={styles.netProfitLabel}>LABA BERSIH</Text>
                                    <CircleDollarSign size={20} color="#FFFFFF" />
                                </View>
                                <Text style={styles.netProfitValue}>{formatCurrency(financialData.netProfit)}</Text>
                                <Text style={styles.netProfitSub}>*Laba Kotor - Pengeluaran</Text>
                            </View>
                        </View>

                        {/* Inventory Value Section */}
                        <View style={[styles.card, { marginTop: 20 }]}>
                            {/* Header Inside Card */}
                            <View style={styles.cardHeaderInternal}>
                                <PieChart size={20} color="#CA8A04" />
                                <Text style={styles.cardSectionTitle}>Nilai Kekayaan (Aset Stok)</Text>
                            </View>
                            <View style={styles.cardInnerDivider} />

                            <View style={styles.row}>
                                <Text style={styles.label}>Stok Barang Jadi (Menu)</Text>
                                <Text style={styles.value}>{formatCurrency(financialData.assets.menu)}</Text>
                            </View>
                            <View style={styles.separatorWithOffset} />
                            <View style={styles.row}>
                                <Text style={styles.label}>Stok Bahan Mentah</Text>
                                <Text style={styles.value}>{formatCurrency(financialData.assets.rawMaterial)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.row}>
                                <Text style={[styles.label, { fontWeight: 'bold' }]}>Total Nilai Aset</Text>
                                <Text style={[styles.value, { color: '#D97706', fontWeight: 'bold' }]}>
                                    {formatCurrency(financialData.assets.total)}
                                </Text>
                            </View>
                        </View>

                        {/* Balance Section */}
                        <View style={[styles.card, { marginTop: 20, paddingBottom: 0 }]}>
                            {/* Header Inside Card */}
                            <View style={styles.cardHeaderInternal}>
                                <Wallet size={20} color="#059669" />
                                <Text style={styles.cardSectionTitle}>Posisi Kas</Text>
                            </View>
                            <View style={styles.cardInnerDivider} />

                            <View style={styles.balanceContainer}>
                                <View style={styles.balanceCard}>
                                    <View style={[styles.balanceIconCircle, { backgroundColor: '#E0F2FE' }]}>
                                        <CreditCard size={20} color="#0284C7" />
                                    </View>
                                    <Text style={styles.balanceLabel}>Saldo Lapak</Text>
                                    <Text style={styles.balanceValue}>{formatCurrency(balances.lapak)}</Text>
                                </View>
                                <View style={[styles.balanceCard, { backgroundColor: '#1E40AF', borderWidth: 0 }]}>
                                    <View style={[styles.balanceIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                        <Wallet size={20} color="#FFFFFF" />
                                    </View>
                                    <Text style={[styles.balanceLabel, { color: '#BFDBFE' }]}>Saldo Owner</Text>
                                    <Text style={[styles.balanceValue, { color: '#FFFFFF' }]}>{formatCurrency(balances.owner)}</Text>
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    <Text style={styles.errorText}>Data tidak tersedia</Text>
                )}
            </ScrollView>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#1E40AF',
        paddingTop: StatusBar.currentHeight + 10,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
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
    shareBtn: {
        padding: 5,
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
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    cardSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#334155',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    cardHeaderDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#3B82F6',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    valuePositive: {
        fontSize: 15,
        fontWeight: '700',
        color: '#10B981',
    },
    valueNegative: {
        fontSize: 15,
        fontWeight: '700',
        color: '#EF4444',
    },
    dashedDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        marginVertical: 12,
        borderRadius: 1,
    },
    grossProfitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    grossProfitLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534',
    },
    grossProfitValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#166534',
    },
    netProfitContainer: {
        backgroundColor: '#1E40AF',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        alignItems: 'center',
    },
    netProfitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    netProfitLabel: {
        color: '#BFDBFE',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    netProfitValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '800',
        marginTop: 4,
    },
    netProfitSub: {
        color: '#93C5FD',
        fontSize: 11,
        marginTop: 4,
    },
    balanceContainer: {
        flexDirection: 'row',
        gap: 15,
    },
    balanceCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    balanceIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    balanceLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
        fontWeight: '500',
    },
    balanceValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    value: { // Kept for other sections
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    divider: { // Kept for other cards
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 10,
    },
    errorText: {
        textAlign: 'center',
        color: '#EF4444',
        marginTop: 20,
    },
    separatorWithOffset: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginLeft: 42, // Align with text start (icon width + gap)
        marginBottom: 16,
    },
    cardHeaderInternal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
        marginTop: 5,
    },
    cardInnerDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: -20, // Stretch full width of card
        marginBottom: 20,
    }
});

export default FinancialReport;
