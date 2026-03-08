import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform,
    StatusBar,
    RefreshControl,
    Alert,
} from 'react-native';
import {
    ChevronLeft,
    Calendar,
    ShieldCheck,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Wallet,
    Info,
    RefreshCw,
    FileText,
    FileSpreadsheet,
    PiggyBank,
    BarChart3,
    ArrowRight,
    Search,
    Save
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const AuditorScreen = ({ navigation }) => {
    const { showToast } = useToast();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSavingDefault, setIsSavingDefault] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Jakarta date helpers
    const getJakartaDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(getJakartaDate());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const [auditData, setAuditData] = useState(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const fetchData = useCallback(async (currentStart, currentEnd) => {
        const start = currentStart || startDate;
        const end = currentEnd || endDate;

        setLoading(true);
        try {
            const queryString = `?startDate=${start}&endDate=${end}&filterClosed=true`;

            const [allTransRes, menuRes, expenseRes, settingsRes, ownerAccountRes, lapakAccountRes, rawMaterialsRes, unitsRes, precisionRes] = await Promise.all([
                apiService.get(`/api/transactions/all${queryString}`),
                apiService.get('/api/menu-items/all'),
                apiService.get(`/api/expenses/all${queryString}`),
                apiService.get('/api/all-settings'),
                apiService.get('/api/accounts/owner_deposit'),
                apiService.get('/api/accounts/lapak_deposit'),
                apiService.get('/api/raw-materials'),
                apiService.get('/api/units'),
                apiService.get(`/api/audit/calculate-accuracy${queryString}`)
            ]);

            const settings = settingsRes.data.data || {};

            // Auto-initialize dates from settings on first load
            if (!isInitialized) {
                setIsInitialized(true);
                const auditStart = settings.audit_start_date;
                const capitalStart = settings.initial_capital_date;
                const defaultStartDate = auditStart || capitalStart;

                if (defaultStartDate && !startDate && !currentStart) {
                    setStartDate(defaultStartDate);
                    return fetchData(defaultStartDate, end);
                }
            }

            processAuditData({
                transactions: allTransRes.data.data || [],
                menuItems: menuRes.data.data || [],
                expenses: expenseRes.data.data || [],
                settings: settings,
                ownerBalance: ownerAccountRes.data.data?.account?.balance || 0,
                lapakBalance: lapakAccountRes.data.data?.account?.balance || 0,
                rawMaterials: rawMaterialsRes.data.data || [],
                units: unitsRes.data.data || [],
                precision: precisionRes.data.data || {}
            });
        } catch (error) {
            console.error("Audit fetch error:", error);
            showToast("Gagal memuat data audit", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [startDate, endDate, isInitialized, showToast]);

    const processAuditData = (raw) => {
        const precision = raw.precision || {};
        const masterInitialCapital = parseFloat(raw.settings.initial_capital) || 0;
        const periodOpeningBalance = precision.openingBalance !== undefined ? precision.openingBalance : masterInitialCapital;

        const totalRevenue = precision.periodRevenue !== undefined ? precision.periodRevenue : raw.transactions
            .filter(t => t.payment_method !== 'employee_meal')
            .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

        const totalExpenses = precision.periodExpenses !== undefined ? precision.periodExpenses : raw.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const expectedCash = precision.expectedClosingBalance || (periodOpeningBalance + totalRevenue - totalExpenses);

        const physicalCash = precision.physicalCashAtEnd !== undefined ? precision.physicalCashAtEnd : (parseFloat(raw.ownerBalance) + parseFloat(raw.lapakBalance));
        const finalOwnerBalance = precision.currentOwnerBalance !== undefined ? precision.currentOwnerBalance : raw.ownerBalance;
        const finalLapakBalance = precision.currentLapakBalance !== undefined ? precision.currentLapakBalance : raw.lapakBalance;

        const cashDifference = physicalCash - expectedCash;

        const stockValue = raw.rawMaterials.reduce((sum, m) => {
            const unitDef = raw.units.find(u => u.name.toLowerCase() === (m.unit || '').toLowerCase());
            const isCalculable = unitDef ? (unitDef.is_calculable === 1 || unitDef.is_calculable === true) : true;
            const currentStock = parseFloat(m.current_stock || 0);
            const menuStock = parseFloat(m.menu_stock || 0);
            const pricePerItem = parseFloat(m.price_per_item || 0);
            const rawStockPrice = parseFloat(m.raw_stock_price || 0);

            if (isCalculable) {
                return sum + (currentStock * rawStockPrice) + (menuStock * pricePerItem);
            } else {
                return sum + (currentStock > 0 ? rawStockPrice : 0) + (menuStock > 0 ? pricePerItem : 0);
            }
        }, 0);

        const netProfit = totalRevenue - totalExpenses;
        const targetEquity = expectedCash + stockValue;
        const currentEquity = physicalCash + stockValue;
        const equityDifference = currentEquity - targetEquity;

        // Anomalies
        const anomalies = [];
        if (Math.abs(cashDifference) > 1000) {
            anomalies.push({
                title: "Selisih Uang Signifikan",
                desc: `Terdapat selisih ${formatCurrency(Math.abs(cashDifference))} antara uang fisik dan catatan.`,
                type: "danger"
            });
        }

        const negativeStockItems = raw.menuItems.filter(i => i.stock < 0);
        if (negativeStockItems.length > 0) {
            anomalies.push({
                title: "Stok Menu Negatif",
                desc: `${negativeStockItems.length} menu memiliki stok di bawah nol.`,
                type: "warning"
            });
        }

        setAuditData({
            metrics: {
                masterInitialCapital,
                periodOpeningBalance,
                totalRevenue,
                totalExpenses,
                expectedCash,
                physicalCash,
                cashDifference,
                stockValue,
                netProfit,
                targetEquity,
                currentEquity,
                equityDifference,
                ownerBalance: finalOwnerBalance,
                lapakBalance: finalLapakBalance
            },
            anomalies
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleSaveAsDefault = async () => {
        if (!startDate) {
            showToast("Pilih tanggal mulai!", "info");
            return;
        }
        setIsSavingDefault(true);
        try {
            const res = await apiService.post('/api/settings', { audit_start_date: startDate });
            if (res.status === 200) {
                showToast("Default disimpan", "success");
            }
        } catch (error) {
            showToast("Gagal menyimpan", "error");
        } finally {
            setIsSavingDefault(false);
        }
    };

    const exportToPdf = async () => {
        if (!auditData) return;
        setLoading(true);
        try {
            const m = auditData.metrics;
            const html = `
                <html>
                <body style="font-family: Arial; padding: 20px;">
                    <h1 style="text-align: center; color: #1E40AF;">LAPORAN AUDIT SISTEM</h1>
                    <p style="text-align: center;">Periode: ${startDate || 'Awal'} s/d ${endDate || 'Hari Ini'}</p>
                    <hr/>
                    <h3>Ringkasan Keuangan</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td>Pendapatan Periode</td><td style="text-align: right;">${formatCurrency(m.totalRevenue)}</td></tr>
                        <tr><td>Pengeluaran Periode</td><td style="text-align: right;">${formatCurrency(m.totalExpenses)}</td></tr>
                        <tr><td>Laba Bersih</td><td style="text-align: right;">${formatCurrency(m.netProfit)}</td></tr>
                        <tr style="font-weight: bold; background: #f0f0f0;"><td>Hasil Audit (Selisih)</td><td style="text-align: right;">${formatCurrency(m.cashDifference)}</td></tr>
                    </table>
                    <h3>Detail Aset</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td>Kas di Bank</td><td style="text-align: right;">${formatCurrency(m.ownerBalance)}</td></tr>
                        <tr><td>Kas di Lapak</td><td style="text-align: right;">${formatCurrency(m.lapakBalance)}</td></tr>
                        <tr><td>Total Kas Fisik</td><td style="text-align: right;">${formatCurrency(m.physicalCash)}</td></tr>
                        <tr><td>Nilai Stok Barang</td><td style="text-align: right;">${formatCurrency(m.stockValue)}</td></tr>
                        <tr style="font-weight: bold; background: #e0f0ff;"><td>Total Ekuitas</td><td style="text-align: right;">${formatCurrency(m.currentEquity)}</td></tr>
                    </table>
                </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            showToast("Gagal export PDF", "error");
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = async () => {
        if (!auditData) return;
        setLoading(true);
        try {
            const m = auditData.metrics;
            let csv = "LAPORAN AUDIT SISTEM\n";
            csv += `Periode;${startDate};s/d;${endDate}\n\n`;
            csv += "KETERANGAN;NILAI\n";
            csv += `Total Pendapatan;${m.totalRevenue}\n`;
            csv += `Total Pengeluaran;${m.totalExpenses}\n`;
            csv += `Laba Bersih;${m.netProfit}\n`;
            csv += `Selisih Kas;${m.cashDifference}\n`;
            csv += `Saldo Bank;${m.ownerBalance}\n`;
            csv += `Saldo Lapak;${m.lapakBalance}\n`;
            csv += `Nilai Stok;${m.stockValue}\n`;
            csv += `Total Kekayaan;${m.currentEquity}\n`;

            const filename = `Audit_${startDate}_${endDate}.csv`;
            const fileUri = FileSystem.documentDirectory + filename;
            await FileSystem.writeAsStringAsync(fileUri, csv);
            await Sharing.shareAsync(fileUri);
        } catch (error) {
            showToast("Gagal export CSV", "error");
        } finally {
            setLoading(false);
        }
    };

    // UI Components
    const StatCard = ({ title, value, icon: Icon, color, desc }) => (
        <View style={[styles.statCard]}>
            <View style={styles.statCardHeader}>
                <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
                    <Icon size={18} color={color} />
                </View>
                <Text style={styles.statLabel}>{title}</Text>
            </View>
            <Text style={[styles.statValue, { color: color }]}>{formatCurrency(value)}</Text>
            {desc && <Text style={styles.statDesc}>{desc}</Text>}
        </View>
    );

    if (!auditData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E40AF" />
                <Text style={styles.loadingText}>Menyiapkan Data...</Text>
            </View>
        );
    }

    const { metrics, anomalies } = auditData;
    const isAccurate = Math.abs(metrics.cashDifference) <= 100;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: '#1E40AF' }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Sistem Audit</Text>
                        <Text style={styles.headerSubtitle}>Integritas & Transparansi</Text>
                    </View>
                    <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
                        <RefreshCw size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* Date Filters */}
                <View style={styles.filterSection}>
                    <View style={styles.dateRow}>
                        <TouchableOpacity style={styles.dateBox} onPress={() => setShowStartDatePicker(true)}>
                            <Text style={styles.dateLabel}>Mulai</Text>
                            <View style={styles.dateInput}>
                                <Calendar size={14} color="#1E40AF" />
                                <Text style={styles.dateText}>{startDate || 'Pilih...'}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dateBox} onPress={() => setShowEndDatePicker(true)}>
                            <Text style={styles.dateLabel}>Sampai</Text>
                            <View style={styles.dateInput}>
                                <Calendar size={14} color="#1E40AF" />
                                <Text style={styles.dateText}>{endDate}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.filterActions}>
                        <TouchableOpacity style={styles.searchBtn} onPress={() => fetchData()}>
                            <Search size={16} color="#FFFFFF" />
                            <Text style={styles.searchBtnText}>FILTER DATA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveDefaultBtn, (!startDate || isSavingDefault) && { opacity: 0.5 }]}
                            onPress={handleSaveAsDefault}
                            disabled={!startDate || isSavingDefault}
                        >
                            <Save size={16} color="#1E40AF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Accuracy Card */}
                <View style={[styles.accuracyCard, { borderLeftColor: isAccurate ? '#10B981' : '#EF4444' }]}>
                    <View style={styles.accuracyHeader}>
                        <View style={[styles.accuracyIcon, { backgroundColor: isAccurate ? '#D1FAE5' : '#FEE2E2' }]}>
                            {isAccurate ? <CheckCircle size={32} color="#10B981" /> : <AlertTriangle size={32} color="#EF4444" />}
                        </View>
                        <View style={styles.accuracyText}>
                            <Text style={styles.accuracyTitle}>Status Integritas</Text>
                            <Text style={[styles.accuracyStatus, { color: isAccurate ? '#10B981' : '#EF4444' }]}>
                                {isAccurate ? 'DATA AKURAT 100%' : `SELISIH: ${formatCurrency(metrics.cashDifference)}`}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.accuracyDesc}>
                        {isAccurate
                            ? 'Uang fisik dan catatan sistem sudah sinkron dengan sempurna.'
                            : 'Ditemukan perbedaan antara uang fisik dan catatan transaksi sistem.'}
                    </Text>
                </View>

                {/* Exports */}
                <View style={styles.exportRow}>
                    <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#FEE2E2' }]} onPress={exportToPdf}>
                        <FileText size={20} color="#EF4444" />
                        <Text style={[styles.exportText, { color: '#EF4444' }]}>Export PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#D1FAE5' }]} onPress={exportToExcel}>
                        <FileSpreadsheet size={20} color="#10B981" />
                        <Text style={[styles.exportText, { color: '#10B981' }]}>Export Excel</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <Text style={styles.sectionTitle}>RINGKASAN DATA</Text>
                <View style={styles.statsGrid}>
                    <StatCard title="Modal Awal" value={metrics.masterInitialCapital} icon={PiggyBank} color="#8B5CF6" desc="Modal awal sistem" />
                    <StatCard title="Pendapatan" value={metrics.totalRevenue} icon={TrendingUp} color="#10B981" desc="Total penjualan bersih" />
                    <StatCard title="Pengeluaran" value={metrics.totalExpenses} icon={TrendingDown} color="#EF4444" desc="Total biaya & belanja" />
                    <StatCard title="Laba Bersih" value={metrics.netProfit} icon={DollarSign} color="#3B82F6" desc="Hasil operasional" />
                    <StatCard title="Nilai Stok" value={metrics.stockValue} icon={Package} color="#F59E0B" desc="Aset dlm bentuk barang" />
                    <StatCard title="Kas Aktual" value={metrics.physicalCash} icon={Wallet} color="#06B6D4" desc="Uang nyata (Bank+Laci)" />
                </View>

                {/* Calculation Flow */}
                <Text style={styles.sectionTitle}>ALUR KALKULASI</Text>
                <View style={styles.flowCard}>
                    <View style={styles.flowItem}>
                        <View style={styles.flowDot} />
                        <Text style={styles.flowLabel}>Saldo Awal Baseline</Text>
                        <Text style={styles.flowValue}>{formatCurrency(metrics.periodOpeningBalance)}</Text>
                    </View>
                    <View style={styles.flowItem}>
                        <View style={[styles.flowDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.flowLabel}>+ Total Pendapatan</Text>
                        <Text style={[styles.flowValue, { color: '#10B981' }]}>+{formatCurrency(metrics.totalRevenue)}</Text>
                    </View>
                    <View style={styles.flowItem}>
                        <View style={[styles.flowDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.flowLabel}>- Total Pengeluaran</Text>
                        <Text style={[styles.flowValue, { color: '#EF4444' }]}>-{formatCurrency(metrics.totalExpenses)}</Text>
                    </View>
                    <View style={styles.flowDivider} />
                    <View style={styles.flowItem}>
                        <View style={[styles.flowDot, { backgroundColor: '#3B82F6' }]} />
                        <Text style={styles.flowLabelBold}>Seharusnya Ada</Text>
                        <Text style={styles.flowValueBold}>{formatCurrency(metrics.expectedCash)}</Text>
                    </View>
                    <View style={styles.flowItem}>
                        <View style={[styles.flowDot, { backgroundColor: '#06B6D4' }]} />
                        <Text style={styles.flowLabelBold}>Kas Aktual (Fisik)</Text>
                        <Text style={styles.flowValueBold}>{formatCurrency(metrics.physicalCash)}</Text>
                    </View>
                    <View style={[styles.flowResult, { backgroundColor: isAccurate ? '#10B98120' : '#EF444420' }]}>
                        <Text style={[styles.resultLabel, { color: isAccurate ? '#059669' : '#B91C1C' }]}>KESIMPULAN AUDIT</Text>
                        <Text style={[styles.resultValue, { color: isAccurate ? '#059669' : '#B91C1C' }]}>
                            {isAccurate ? '✓ Sesuai' : `⚠ Selisih ${formatCurrency(metrics.cashDifference)}`}
                        </Text>
                    </View>
                </View>

                {/* Anomalies */}
                {anomalies.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>TEMUAN & ANOMALI</Text>
                        {anomalies.map((anom, idx) => (
                            <View key={idx} style={[styles.anomalyCard, { backgroundColor: anom.type === 'danger' ? '#FEF2F2' : '#FFFBEB' }]}>
                                <View style={styles.anomalyIcon}>
                                    <AlertTriangle size={20} color={anom.type === 'danger' ? '#EF4444' : '#F59E0B'} />
                                </View>
                                <View style={styles.anomalyContent}>
                                    <Text style={styles.anomalyTitle}>{anom.title}</Text>
                                    <Text style={styles.anomalyDesc}>{anom.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                <View style={{ height: 40 }} />

                {/* Date Pickers */}
                {showStartDatePicker && (
                    <DateTimePicker
                        value={startDate ? new Date(startDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowStartDatePicker(false);
                            if (selectedDate) {
                                const y = selectedDate.getFullYear();
                                const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const d = String(selectedDate.getDate()).padStart(2, '0');
                                setStartDate(`${y}-${m}-${d}`);
                            }
                        }}
                    />
                )}
                {showEndDatePicker && (
                    <DateTimePicker
                        value={new Date(endDate)}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowEndDatePicker(false);
                            if (selectedDate) {
                                const y = selectedDate.getFullYear();
                                const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const d = String(selectedDate.getDate()).padStart(2, '0');
                                setEndDate(`${y}-${m}-${d}`);
                            }
                        }}
                    />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 12,
        color: '#1E40AF',
        fontWeight: 'bold',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 10,
        color: '#E1F5FE',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 2,
        opacity: 0.9,
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    filterSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
    },
    dateBox: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 14,
        gap: 10,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    filterActions: {
        flexDirection: 'row',
        gap: 10,
    },
    searchBtn: {
        flex: 1,
        backgroundColor: '#1E40AF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 10,
    },
    searchBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    saveDefaultBtn: {
        width: 50,
        height: 50,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    accuracyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 6,
        elevation: 4,
    },
    accuracyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 12,
    },
    accuracyIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accuracyText: {
        flex: 1,
    },
    accuracyTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    accuracyStatus: {
        fontSize: 18,
        fontWeight: '900',
    },
    accuracyDesc: {
        fontSize: 11,
        color: '#94A3B8',
        lineHeight: 16,
    },
    exportRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 25,
    },
    exportBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 18,
        gap: 10,
    },
    exportText: {
        fontSize: 12,
        fontWeight: '800',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: 1,
        marginBottom: 15,
        paddingLeft: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 25,
    },
    statCard: {
        width: (width - 52) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        elevation: 2,
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    statIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    statValue: {
        fontSize: 15,
        fontWeight: '900',
        marginBottom: 4,
    },
    statDesc: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '500',
    },
    flowCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
        elevation: 3,
    },
    flowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    flowDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#8B5CF6',
        marginRight: 12,
    },
    flowLabel: {
        flex: 1,
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    flowValue: {
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },
    flowDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    flowLabelBold: {
        flex: 1,
        fontSize: 12,
        color: '#1E293B',
        fontWeight: '900',
    },
    flowValueBold: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E293B',
    },
    flowResult: {
        marginTop: 15,
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 4,
    },
    resultValue: {
        fontSize: 16,
        fontWeight: '900',
    },
    anomalyCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        alignItems: 'center',
        gap: 15,
    },
    anomalyIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    anomalyContent: {
        flex: 1,
    },
    anomalyTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1E293B',
    },
    anomalyDesc: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    }
});

export default AuditorScreen;
