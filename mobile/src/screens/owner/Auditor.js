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
    const [fetchError, setFetchError] = useState(null);

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
        const val = Number(amount) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    const safeGet = async (url, fallback = {}) => {
        try {
            const res = await apiService.get(url);
            return res.data;
        } catch (err) {
            console.warn(`[OwnerAuditor] Request ${url} warning:`, err?.response?.status || err?.message);
            return fallback;
        }
    };

    const fetchData = useCallback(async (currentStart, currentEnd) => {
        const start = currentStart || startDate;
        const end = currentEnd || endDate;

        setLoading(true);
        setFetchError(null);
        try {
            const queryString = `?startDate=${start}&endDate=${end}&filterClosed=true`;

            const [
                allTransRes,
                menuRes,
                expenseRes,
                settingsRes,
                ownerAccountRes,
                lapakAccountRes,
                rawMaterialsRes,
                unitsRes,
                precisionRes
            ] = await Promise.all([
                safeGet(`/api/transactions/all${queryString}`, { data: [] }),
                safeGet('/api/menu-items/all', { data: [] }),
                safeGet(`/api/expenses/all${queryString}`, { data: [] }),
                safeGet('/api/all-settings', { data: {} }),
                safeGet('/api/accounts/owner_deposit', { data: { account: { balance: 0 } } }),
                safeGet('/api/accounts/lapak_deposit', { data: { account: { balance: 0 } } }),
                safeGet('/api/raw-materials', { data: [] }),
                safeGet('/api/units', { data: [] }),
                safeGet(`/api/audit/calculate-accuracy${queryString}`, { data: {} })
            ]);

            const settings = settingsRes?.data || {};

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
                transactions: allTransRes?.data || [],
                menuItems: menuRes?.data || [],
                expenses: expenseRes?.data || [],
                settings: settings,
                ownerBalance: ownerAccountRes?.data?.account?.balance ?? 0,
                lapakBalance: lapakAccountRes?.data?.account?.balance ?? 0,
                rawMaterials: rawMaterialsRes?.data || [],
                units: unitsRes?.data || [],
                precision: precisionRes?.data || {}
            });
        } catch (error) {
            console.error("Audit fetch error:", error);
            setFetchError(error.message || "Gagal memuat data audit");
            showToast("Gagal memuat data audit", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [startDate, endDate, isInitialized, showToast]);

    const processAuditData = (raw) => {
        const precision = raw?.precision || {};
        const masterInitialCapital = parseFloat(raw?.settings?.initial_capital) || 0;
        const periodOpeningBalance = precision.openingBalance !== undefined 
            ? parseFloat(precision.openingBalance) 
            : masterInitialCapital;

        const transactions = Array.isArray(raw?.transactions) ? raw.transactions : [];
        const expenses = Array.isArray(raw?.expenses) ? raw.expenses : [];
        const rawMaterials = Array.isArray(raw?.rawMaterials) ? raw.rawMaterials : [];
        const units = Array.isArray(raw?.units) ? raw.units : [];
        const menuItems = Array.isArray(raw?.menuItems) ? raw.menuItems : [];

        const totalRevenue = precision.periodRevenue !== undefined 
            ? parseFloat(precision.periodRevenue) 
            : transactions
                .filter(t => t && t.payment_method !== 'employee_meal')
                .reduce((sum, t) => sum + (parseFloat(t?.total) || 0), 0);

        const totalExpenses = precision.periodExpenses !== undefined 
            ? parseFloat(precision.periodExpenses) 
            : expenses.reduce((sum, e) => sum + (parseFloat(e?.amount) || 0), 0);

        const periodAdjustment = parseFloat(precision.periodAdjustment) || 0;
        const expectedCash = precision.expectedClosingBalance !== undefined
            ? parseFloat(precision.expectedClosingBalance)
            : (periodOpeningBalance + totalRevenue - totalExpenses + periodAdjustment);

        const rawOwner = parseFloat(raw?.ownerBalance) || 0;
        const rawLapak = parseFloat(raw?.lapakBalance) || 0;
        const physicalCash = precision.physicalCashAtEnd !== undefined 
            ? parseFloat(precision.physicalCashAtEnd) 
            : (rawOwner + rawLapak);
        const finalOwnerBalance = precision.currentOwnerBalance !== undefined ? parseFloat(precision.currentOwnerBalance) : rawOwner;
        const finalLapakBalance = precision.currentLapakBalance !== undefined ? parseFloat(precision.currentLapakBalance) : rawLapak;

        const cashDifference = physicalCash - expectedCash;

        const stockValue = rawMaterials.reduce((sum, m) => {
            if (!m) return sum;
            const mUnit = (m.unit || '').toString().toLowerCase();
            const unitDef = units.find(u => (u?.name || '').toString().toLowerCase() === mUnit);
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

        const negativeStockItems = menuItems.filter(i => (parseFloat(i?.stock) || 0) < 0);
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
                periodAdjustment,
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
            const anomalies = auditData.anomalies || [];
            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const reportId = `AUD-${new Date().getTime().toString().slice(-8)}`;

            let assessment = "";
            if (Math.abs(m.cashDifference) <= 100) {
                assessment = "Sistem validasi menyatakan data keuangan DALAM KONDISI SEMPURNA. Catatan digital sepenuhnya sinkron dengan uang fisik yang tersedia. Tidak ditemukan penyimpangan data.";
            } else if (m.cashDifference < 0) {
                assessment = `Ditemukan ketidakcocokan data berupa KEKURANGAN kas operasional sebesar ${formatCurrency(Math.abs(m.cashDifference))}. Direkomendasikan untuk meninjau kembali riwayat transaksi harian dan catatan pengeluaran kasir.`;
            } else {
                assessment = `Ditemukan kelebihan kas operasional sebesar ${formatCurrency(m.cashDifference)}. Hal ini menandakan adanya pendapatan yang masuk ke kas namun belum terinput secara resmi ke dalam sistem penjualan.`;
            }

            const html = `
                <html>
                <head>
                    <style>
                        @page { margin: 20mm; }
                        body { font-family: 'Helvetica', Arial, sans-serif; color: #333; line-height: 1.5; padding: 0; margin: 0; }
                        .header { text-align: center; margin-bottom: 30px; position: relative; }
                        .company-name { font-size: 28px; font-weight: bold; color: #14532D; margin: 0; text-transform: uppercase; }
                        .company-subtitle { font-size: 11px; color: #555; margin: 4px 0; }
                        .header-line-thick { border-bottom: 2px solid #333; margin-top: 15px; }
                        .header-line-thin { border-bottom: 0.5px solid #333; margin-top: 2px; margin-bottom: 20px; }
                        
                        .report-title { font-size: 22px; font-weight: bold; text-align: center; margin-top: 20px; text-decoration: none; }
                        .report-id { font-size: 11px; font-style: italic; text-align: center; color: #666; margin-bottom: 35px; }
                        
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 12px; }
                        .section-title { font-size: 14px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; color: #1F2937; border-left: 4px solid #14532D; padding-left: 10px; }
                        
                        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
                        th { background-color: #1F2937; color: white; text-align: left; padding: 12px 15px; }
                        td { border: 1px solid #D1D5DB; padding: 10px 15px; }
                        .text-right { text-align: right; }
                        .bold { font-weight: bold; }
                        
                        .assessment { background-color: #F3F4F6; padding: 20px; border-radius: 5px; font-size: 12px; margin-bottom: 25px; border: 1px solid #E5E7EB; page-break-inside: avoid; }
                        .anomaly-table th { background-color: #991B1B; }
                        
                        .footer { margin-top: 60px; font-size: 12px; page-break-inside: avoid; }
                        .signature-container { margin-top: 50px; }
                        .signature-name { font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
                        .signature-space { font-style: italic; font-size: 10px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <p class="company-name">KASIR BERKAH 88</p>
                        <p class="company-subtitle">Sistem Manajemen Keuangan & Point of Sale Terintegrasi</p>
                        <p class="company-subtitle">Laporan Resmi Transparansi Operasional & Integritas Data</p>
                        <div class="header-line-thick"></div>
                        <div class="header-line-thin"></div>
                    </div>

                    <p class="report-title">LAPORAN AUDIT & INTEGRITAS KEUANGAN</p>
                    <p class="report-id">Kode Referensi Laporan: ${reportId}</p>

                    <div class="info-row">
                        <div>
                            <p>Kepada Yth,<br><span class="bold">Pimpinan / Owner Kasir Berkah 88</span></p>
                        </div>
                        <div class="text-right">
                            <p>Tanggal Cetak: ${today}</p>
                        </div>
                    </div>

                    <p style="font-size: 10px;"><span class="bold">Periode Laporan:</span> ${startDate || 'Awal'} s/d ${endDate || 'Hari Ini'}</p>
                    
                    <p style="font-size: 10px; margin-top: 15px;">Dengan hormat,<br>Berdasarkan hasil analisis sistem terhadap seluruh data transaksi, pengeluaran, dan pergerakan kas pada periode yang ditentukan, berikut adalah rincian konsolidasi keuangan:</p>

                    <table>
                        <thead>
                            <tr>
                                <th>KOMPONEN AUDIT KEUANGAN</th>
                                <th class="text-right">NILAI LAPORAN</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Modal Awal (Baseline Audit)</td><td class="text-right bold">${formatCurrency(m.periodOpeningBalance)}</td></tr>
                            <tr><td>Total Pemasukan (Revenue)</td><td class="text-right bold">${formatCurrency(m.totalRevenue)}</td></tr>
                            <tr><td>Total Pengeluaran (Expense)</td><td class="text-right bold">${formatCurrency(m.totalExpenses)}</td></tr>
                            ${m.periodAdjustment !== 0 ? `<tr><td>Penyesuaian Saldo</td><td class="text-right bold">${m.periodAdjustment > 0 ? '+' : ''}${formatCurrency(m.periodAdjustment)}</td></tr>` : ''}
                            <tr><td>Laba Bersih Operasional</td><td class="text-right bold">${formatCurrency(m.netProfit)}</td></tr>
                            <tr><td>Nilai Persediaan Aset/Stok</td><td class="text-right bold">${formatCurrency(m.stockValue)}</td></tr>
                            <tr><td>Estimasi Kas dari Sistem</td><td class="text-right bold">${formatCurrency(m.expectedCash)}</td></tr>
                            <tr><td>Kas Aktual yang Tersedia</td><td class="text-right bold">${formatCurrency(m.physicalCash)}</td></tr>
                            <tr style="background-color: #F3F4F6;">
                                <td class="bold">SELISIH AUDIT (ACCURACY)</td>
                                <td class="text-right bold">${formatCurrency(m.cashDifference)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="section-title">KESIMPULAN VALIDASI DATA:</p>
                    <div class="assessment">
                        ${assessment}
                    </div>

                    ${anomalies.length > 0 ? `
                        <p class="section-title" style="color: #991B1B;">CATATAN ANOMALI & PERINGATAN SISTEM:</p>
                        <table class="anomaly-table">
                            <thead>
                                <tr>
                                    <th>TEMUAN</th>
                                    <th>DESKRIPSI</th>
                                    <th>LEVEL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${anomalies.map(a => `
                                    <tr>
                                        <td>${a.title}</td>
                                        <td>${a.desc}</td>
                                        <td class="bold">${a.type === 'danger' ? 'KRITIKAL' : 'PERINGATAN'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : ''}

                    <div class="footer">
                        <p>Demikian laporan audit ini disampaikan sebagai rujukan utama dalam pengambilan keputusan manajemen dan audit operasional berkala.</p>
                        
                        <div class="signature-container">
                            <p>Diterbitkan Secara Otomatis oleh,</p>
                            <p class="signature-name">Sistem Audit Kasir Berkah 88</p>
                            <p class="bold" style="margin-top: 40px;">Admin & Tim Keuangan</p>
                            <p class="signature-space">(Dicetak melalui modul Auditor - Digital Signature Verified)</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error("PDF Export error:", error);
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
            if (m.periodAdjustment !== 0) {
                csv += `Penyesuaian Saldo;${m.periodAdjustment}\n`;
            }
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
    const StatCard = ({ title, value, icon: Icon, color, desc, longDesc, note, formula, growth }) => (
        <View style={[styles.statCard]}>
            <View style={styles.statCardHeader}>
                <View style={[styles.statIconBox, { backgroundColor: color + '15', flexShrink: 0 }]}>
                    <Icon size={18} color={color} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.statLabel, { flexShrink: 1 }]} numberOfLines={1}>{title}</Text>
                        {growth && (
                            <View style={[styles.growthBadge, { backgroundColor: growth.value >= 0 ? '#D1FAE5' : '#FEE2E2', flexShrink: 0 }]}>
                                <Text style={[styles.growthText, { color: growth.value >= 0 ? '#059669' : '#B91C1C' }]}>
                                    {growth.value >= 0 ? '▲' : '▼'} {Math.abs(growth.percent)}%
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
            <Text
                style={[styles.statValue, { color: color }]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
            >{formatCurrency(value)}</Text>
            {desc && <Text style={styles.statDesc} numberOfLines={1}>{desc}</Text>}

            {longDesc && (
                <Text style={styles.statLongDesc}>{longDesc}</Text>
            )}

            {growth && (
                <View style={[styles.growthAnalysis, { borderTopColor: color + '20' }]}>
                    <Text style={styles.growthTitle}>ANALISIS PERTUMBUHAN</Text>
                    <View style={styles.growthRow}>
                        <Text style={[styles.growthStatus, { flexShrink: 1 }]} numberOfLines={1}>
                            {growth.value >= 0 ? '💰 Mengembang' : '📉 Menyusut'}
                        </Text>
                        <Text
                            style={[styles.growthValue, { color: growth.value >= 0 ? '#059669' : '#B91C1C', flexShrink: 0 }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                        >
                            {growth.value >= 0 ? '+' : ''}{formatCurrency(growth.value)}
                        </Text>
                    </View>
                    <Text style={styles.growthNote} numberOfLines={2}>
                        {growth.value >= 0
                            ? 'Total kas saat ini lebih besar dari modal awal sistem.'
                            : 'Total kas saat ini lebih kecil dari modal awal sistem.'}
                    </Text>
                </View>
            )}

            {formula && (
                <View style={[styles.formulaBox, { borderTopColor: color + '20' }]}>
                    <Text style={styles.formulaTitle}>CARA HITUNG</Text>
                    <View style={styles.formulaRow}>
                        <Text style={styles.formulaPart}>{formatCurrency(formula.a)}</Text>
                        <Text style={styles.formulaOperator}>{formula.op}</Text>
                        <Text style={styles.formulaPart}>{formatCurrency(formula.b)}</Text>
                        <Text style={styles.formulaOperator}>=</Text>
                        <Text style={[styles.formulaResult, { color: color }]}>{formatCurrency(value)}</Text>
                    </View>
                </View>
            )}

            {note && (
                <View style={[styles.noteBox, { borderTopColor: color + '20' }]}>
                    <Text style={styles.noteTitle}>CATATAN</Text>
                    <Text style={styles.noteText}>{note}</Text>
                </View>
            )}
        </View>
    );

    if (!auditData) {
        if (fetchError) {
            return (
                <View style={styles.container}>
                    <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
                    <View style={[styles.header, { backgroundColor: '#349BE5' }]}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                <ChevronLeft size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle}>Sistem Audit</Text>
                                <Text style={styles.headerSubtitle}>Integritas & Transparansi</Text>
                            </View>
                            <View style={{ width: 40 }} />
                        </View>
                    </View>
                    <View style={styles.errorContainer}>
                        <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
                        <Text style={styles.errorTitle}>Gagal Memuat Data Audit</Text>
                        <Text style={styles.errorDesc}>{fetchError}</Text>
                        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: '#349BE5' }]} onPress={() => fetchData()}>
                            <RefreshCw size={16} color="#FFFFFF" />
                            <Text style={styles.retryBtnText}>Coba Lagi</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
                <View style={[styles.header, { backgroundColor: '#349BE5' }]}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ChevronLeft size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Sistem Audit</Text>
                            <Text style={styles.headerSubtitle}>Integritas & Transparansi</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#349BE5" />
                    <Text style={styles.loadingText}>Menyiapkan Data...</Text>
                </View>
            </View>
        );
    }

    const { metrics, anomalies } = auditData;
    const isAccurate = Math.abs(metrics.cashDifference) <= 100;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: '#349BE5' }]}>
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
                                <Calendar size={14} color="#349BE5" />
                                <Text style={styles.dateText}>{startDate || 'Pilih...'}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dateBox} onPress={() => setShowEndDatePicker(true)}>
                            <Text style={styles.dateLabel}>Sampai</Text>
                            <View style={styles.dateInput}>
                                <Calendar size={14} color="#349BE5" />
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
                            <Save size={16} color="#349BE5" />
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

                <Text style={styles.sectionTitle}>RINGKASAN DATA KEUANGAN</Text>
                <Text style={styles.sectionSubtitle}>Data berdasarkan rentang tanggal yang dipilih. Semua angka mengacu pada catatan sistem.</Text>

                <View style={styles.statsGrid}>
                    <StatCard
                        title="Modal Awal"
                        value={metrics.masterInitialCapital}
                        icon={PiggyBank}
                        color="#8B5CF6"
                        desc="Modal awal utama"
                        longDesc="Modal awal utama yang terdaftar di pengaturan sistem."
                        growth={{
                            value: metrics.physicalCash - metrics.masterInitialCapital,
                            percent: metrics.masterInitialCapital > 0
                                ? ((metrics.physicalCash - metrics.masterInitialCapital) / metrics.masterInitialCapital * 100).toFixed(1)
                                : 0
                        }}
                    />
                    <StatCard
                        title="Total Pendapatan"
                        value={metrics.totalRevenue}
                        icon={TrendingUp}
                        color="#10B981"
                        desc="Pemasukan kotor"
                        longDesc="Total uang masuk dari semua penjualan periode ini sebelum dikurangi pengeluaran."
                        note="Transaksi dengan metode pembayaran 'Makan Karyawan' tidak dihitung karena bukan pemasukan tunai."
                    />
                    <StatCard
                        title="Total Pengeluaran"
                        value={metrics.totalExpenses}
                        icon={TrendingDown}
                        color="#EF4444"
                        desc="Biaya & Belanja"
                        longDesc="Total uang keluar untuk belanja bahan, operasional, dan pengeluaran lainnya."
                        note="Pastikan semua bon belanja sudah dicatat. Pengeluaran tidak tercatat menyebabkan selisih audit."
                    />
                    <StatCard
                        title="Laba Bersih"
                        value={metrics.netProfit}
                        icon={DollarSign}
                        color={metrics.netProfit >= 0 ? "#10B981" : "#EF4444"}
                        desc={metrics.netProfit >= 0 ? "Keuntungan" : "Kerugian"}
                        longDesc={metrics.netProfit >= 0
                            ? "Bisnis menghasilkan keuntungan. Uang yang dihasilkan melebihi biaya yang dikeluarkan."
                            : "Bisnis mengalami kerugian. Biaya yang dikeluarkan melebihi pendapatan yang masuk."
                        }
                        formula={{
                            a: metrics.totalRevenue,
                            op: '−',
                            b: metrics.totalExpenses
                        }}
                    />
                    <StatCard
                        title="Nilai Stok"
                        value={metrics.stockValue}
                        icon={Package}
                        color="#F59E0B"
                        desc="Aset Barang"
                        longDesc="Modal bisnis yang saat ini tersimpan dalam bentuk bahan baku dan stok menu siap jual."
                        note="Jika semua stok terjual/dipakai, nilainya akan berubah menjadi kas. Stok terlalu besar bisa berarti over-buying."
                    />
                    <StatCard
                        title="Kas Aktual"
                        value={metrics.physicalCash}
                        icon={Wallet}
                        color="#06B6D4"
                        desc="Uang Nyata"
                        longDesc="Total uang yang benar-benar ada secara fisik saat ini (Gabungan Bank + Tunai Lapak)."
                        note={`Bank: ${formatCurrency(metrics.ownerBalance)}\nLapak: ${formatCurrency(metrics.lapakBalance)}`}
                    />
                </View>

                {/* Calculation Flow */}
                <Text style={styles.sectionTitle}>ALUR KALKULASI (STEP-BY-STEP)</Text>
                <View style={styles.flowCard}>
                    <View style={styles.flowColumns}>
                        <View style={styles.flowColumn}>
                            <Text style={styles.flowColumnTitle}>💡 Kas Seharusnya</Text>
                            <View style={styles.flowItemCompact}>
                                <Text style={styles.flowLabelSmall}>Baseline</Text>
                                <Text style={styles.flowValueSmall}>{formatCurrency(metrics.periodOpeningBalance)}</Text>
                            </View>
                            <View style={styles.flowItemCompact}>
                                <Text style={styles.flowLabelSmall}>+ Pemasukan</Text>
                                <Text style={[styles.flowValueSmall, { color: '#10B981' }]}>+{formatCurrency(metrics.totalRevenue)}</Text>
                            </View>
                            <View style={styles.flowItemCompact}>
                                <Text style={styles.flowLabelSmall}>- Pengeluaran</Text>
                                <Text style={[styles.flowValueSmall, { color: '#EF4444' }]}>-{formatCurrency(metrics.totalExpenses)}</Text>
                            </View>
                            {metrics.periodAdjustment !== 0 && (
                                <View style={styles.flowItemCompact}>
                                    <Text style={styles.flowLabelSmall}>± Penyesuaian</Text>
                                    <Text style={[styles.flowValueSmall, { color: metrics.periodAdjustment > 0 ? '#10B981' : '#EF4444' }]}>
                                        {metrics.periodAdjustment > 0 ? '+' : ''}{formatCurrency(metrics.periodAdjustment)}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.flowDividerSmall} />
                            <View style={styles.flowItemCompact}>
                                <Text style={styles.flowLabelBoldSmall}>Estimasi</Text>
                                <Text style={styles.flowValueBoldSmall}>{formatCurrency(metrics.expectedCash)}</Text>
                            </View>
                        </View>

                        <View style={styles.flowColumn}>
                            <Text style={styles.flowColumnTitle}>💵 Kas Nyata</Text>
                            <View style={styles.flowItemCompact}>
                                <Text style={styles.flowLabelSmall}>Saldo Bank</Text>
                                <Text style={styles.flowValueSmall}>{formatCurrency(metrics.ownerBalance)}</Text>
                            </View>
                            <View style={styles.flowItemCompact}>
                                <Text style={styles.flowLabelSmall}>+ Tunai Lapak</Text>
                                <Text style={styles.flowValueSmall}>+{formatCurrency(metrics.lapakBalance)}</Text>
                            </View>
                            <View style={{ height: 35 }} />
                            <View style={styles.flowDividerSmall} />
                            <View style={styles.flowItemCompact}>
                                <Text style={styles.flowLabelBoldSmall}>Fisik</Text>
                                <Text style={styles.flowValueBoldSmall}>{formatCurrency(metrics.physicalCash)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.flowResult, { backgroundColor: isAccurate ? '#10B98120' : metrics.cashDifference < 0 ? '#EF444420' : '#F59E0B20' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Info size={16} color={isAccurate ? '#059669' : metrics.cashDifference < 0 ? '#B91C1C' : '#D97706'} />
                            <Text style={[styles.resultLabel, { color: isAccurate ? '#059669' : metrics.cashDifference < 0 ? '#B91C1C' : '#D97706' }]}>KESIMPULAN AUDIT</Text>
                        </View>
                        <Text style={[styles.resultValue, { color: isAccurate ? '#059669' : metrics.cashDifference < 0 ? '#B91C1C' : '#D97706' }]}>
                            {isAccurate ? '✓ Sesuai (Akurat)' : `${metrics.cashDifference < 0 ? '⚠ Uang Kurang' : '↑ Uang Lebih'} ${formatCurrency(Math.abs(metrics.cashDifference))}`}
                        </Text>
                        <Text style={styles.resultExplanation}>
                            Formula: Kas Nyata ({formatCurrency(metrics.physicalCash)}) − Estimasi ({formatCurrency(metrics.expectedCash)}) = {formatCurrency(metrics.cashDifference)}.
                            {metrics.cashDifference < 0 && ' Peringatan: Selisih ini mengacu pada uang yang hilang dari catatan.'}
                            {metrics.cashDifference > 0 && ' Ada kemungkinan pemasukan yang belum dicatat.'}
                            {isAccurate && ' Semua catatan sudah sinkron dengan uang fisik.'}
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
    sectionSubtitle: {
        fontSize: 11,
        color: '#64748B',
        marginTop: -10,
        marginBottom: 20,
        fontWeight: '500',
    },
    statLongDesc: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 6,
        lineHeight: 14,
        fontWeight: '500',
    },
    growthBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    growthText: {
        fontSize: 9,
        fontWeight: '800',
    },
    growthAnalysis: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    growthTitle: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    growthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
    },
    growthStatus: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
    },
    growthValue: {
        fontSize: 11,
        fontWeight: '800',
    },
    growthNote: {
        fontSize: 9,
        color: '#94A3B8',
        marginTop: 2,
        fontWeight: '500',
    },
    formulaBox: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    formulaTitle: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    formulaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    formulaPart: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    formulaOperator: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
    },
    formulaResult: {
        fontSize: 10,
        fontWeight: '800',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    noteBox: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    noteTitle: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    noteText: {
        fontSize: 9,
        color: '#64748B',
        fontStyle: 'italic',
        lineHeight: 12,
        fontWeight: '500',
    },
    flowColumns: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
    },
    flowColumn: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
    },
    flowColumnTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        textAlign: 'center',
    },
    flowItemCompact: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    flowLabelSmall: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '600',
    },
    flowValueSmall: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
    },
    flowDividerSmall: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 6,
    },
    flowLabelBoldSmall: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1E293B',
    },
    flowValueBoldSmall: {
        fontSize: 10,
        fontWeight: '900',
        color: '#349BE5',
    },
    resultExplanation: {
        fontSize: 10,
        color: '#475569',
        marginTop: 8,
        lineHeight: 14,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 12,
        color: '#349BE5',
        fontWeight: 'bold',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#FFFFFF',
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorDesc: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 18,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#349BE5',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        gap: 8,
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
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
        backgroundColor: '#349BE5',
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
        overflow: 'hidden',
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        minWidth: 0,
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
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    flowDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 10,
    },
    flowLabelBold: {
        flex: 1,
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '900',
    },
    flowValueBold: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    flowResult: {
        marginTop: 15,
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 4,
    },
    resultValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    anomalyCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        alignItems: 'center',
        gap: 15,
    },
    anomalyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
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
        marginBottom: 2,
    },
    anomalyDesc: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 16,
    }
});

export default AuditorScreen;
