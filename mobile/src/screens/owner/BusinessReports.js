import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
    TrendingUp,
    Package,
    ShoppingCart,
    DollarSign,
    Receipt,
    Wallet,
    Info,
    ChevronDown,
    ChevronUp,
    BarChart3,
    Filter,
    Share2,
    Calculator,
    ArrowRight,
    Search,
    ChevronRight,
    FileText,
    Briefcase
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import ViewShot from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- Optimized Components with React.memo ---

const StatCard = memo(({ title, value, icon: Icon, color, subValue }) => (
    <View style={[styles.statCard, { borderColor: color + '20' }]}>
        <View style={[styles.statIcon, { backgroundColor: color + '10' }]}>
            <Icon size={20} color={color} />
        </View>
        <View style={styles.statInfo}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={[styles.statValue, { color: '#1E293B' }]}>{value}</Text>
            {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
        </View>
    </View>
));

const ReportSection = memo(({ title, icon: Icon, color, expanded, onToggle, children, count, showMore, onShowMore }) => (
    <View style={styles.sectionContainer}>
        <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
            <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIconWrap, { backgroundColor: color + '15' }]}>
                    <Icon size={20} color={color} />
                </View>
                <View>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    {count !== undefined && <Text style={styles.sectionCount}>{count} Data</Text>}
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {expanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
            </View>
        </TouchableOpacity>
        {expanded && (
            <View style={styles.sectionContent}>
                {children}
                {showMore && (
                    <TouchableOpacity style={styles.showMoreBtn} onPress={onShowMore}>
                        <Text style={[styles.showMoreText, { color: color }]}>Tampilkan Lebih Banyak</Text>
                        <ChevronDown size={14} color={color} />
                    </TouchableOpacity>
                )}
            </View>
        )}
    </View>
));

const SimpleProgressBar = memo(({ label, value, maxValue, color }) => {
    const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
        <View style={styles.progressItem}>
            <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>{label}</Text>
                <Text style={styles.progressValue}>{value}</Text>
            </View>
            <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
});

// --- Main Component ---

const BusinessReports = ({ navigation }) => {
    const { showToast } = useToast();
    const { refreshTrigger } = useOrderNotification();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const reportRef = React.useRef();

    // Raw Data States
    const [dataState, setDataState] = useState({
        transactions: [],
        expenses: [],
        menuItems: [],
        rawMaterials: [],
        reconciliations: [],
        balances: { lapakBalance: 0, ownerBalance: 0 }
    });

    // Pagination States (Local/Client-side pagination for smooth performance)
    const [pageLimits, setPageLimits] = useState({
        sales: 10,
        expenses: 10,
        stock: 10,
        employeeMeals: 10,
        reconciliation: 10,
        rawMaterials: 10
    });

    // Filter States
    const getLocalDateString = useCallback((daysAgo = 0) => {
        const date = new Date();
        if (daysAgo !== 0) date.setDate(date.getDate() - daysAgo);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const [selectedRange, setSelectedRange] = useState('today');
    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Section States
    const [expandedSections, setExpandedSections] = useState({
        sales: false,
        stock: false,
        expenses: false,
        employeeMeals: false,
        reconciliation: false,
        rawMaterials: false
    });

    const toggleSection = useCallback((section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    }, []);

    const handleShowMore = useCallback((section) => {
        setPageLimits(prev => ({ ...prev, [section]: prev[section] + 10 }));
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [transRes, menuRes, expenseRes, reconRes, rawRes, accountLapakRes, accountOwnerRes] = await Promise.all([
                apiService.get('/api/transactions/all?filterClosed=true'),
                apiService.get('/api/menu-items/all'),
                apiService.get('/api/expenses/all?filterClosed=true'),
                apiService.get('/api/cash-reconciliation/history?limit=1000'),
                apiService.get('/api/raw-materials'),
                apiService.get('/api/accounts/lapak_deposit'),
                apiService.get('/api/accounts/owner_deposit').catch(() => ({ data: { message: 'not_authorized' } }))
            ]);

            let balances = { lapakBalance: 0, ownerBalance: 0 };
            if (accountLapakRes.data.message === 'success' && accountLapakRes.data.data?.account) {
                balances.lapakBalance = parseFloat(accountLapakRes.data.data.account.balance || 0);
            }
            if (accountOwnerRes.data.message === 'success' && accountOwnerRes.data.data?.account) {
                balances.ownerBalance = parseFloat(accountOwnerRes.data.data.account.balance || 0);
            }

            setDataState({
                transactions: transRes.data.data || [],
                expenses: expenseRes.data.data || [],
                menuItems: menuRes.data.data || [],
                rawMaterials: rawRes.data.data || [],
                reconciliations: reconRes.data.data || [],
                balances
            });

        } catch (error) {
            console.error('Error fetching report data:', error);
            showToast('Gagal memuat data laporan', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showToast]);

    // --- Optimized Data Processing with useMemo ---
    const reports = useMemo(() => {
        if (loading && dataState.transactions.length === 0) return null;

        // Parsing dates securely in local timezone
        const parseLocalDay = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d, 0, 0, 0, 0);
        };

        const start = parseLocalDay(startDate);
        const end = parseLocalDay(endDate);
        end.setHours(23, 59, 59, 999);

        const filterByDate = (item) => {
            const dateStr = item.timestamp || item.date || item.created_at;
            if (!dateStr) return false;

            // Handle the potential space in timestamp and ensure it is parsed as local if offset is missing
            const normalizedDateStr = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
            const itemDate = new Date(normalizedDateStr);

            if (isNaN(itemDate.getTime())) return false;
            return itemDate >= start && itemDate <= end;
        };

        const filteredTransactions = dataState.transactions.filter(filterByDate);
        const filteredExpenses = dataState.expenses.filter(filterByDate);
        const filteredReconciliations = dataState.reconciliations.filter(filterByDate);

        // Revenue
        const totalRevenue = filteredTransactions
            .filter(t => t.payment_method !== 'employee_meal')
            .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

        // Expenses
        const totalExpensesValue = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        // Top Items
        const itemsMap = new Map();
        filteredTransactions.forEach(t => {
            try {
                const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        const existing = itemsMap.get(item.name) || { name: item.name, sold: 0, revenue: 0 };
                        existing.sold += (item.quantity || 0);
                        existing.revenue += (item.quantity || 0) * (item.price || 0);
                        itemsMap.set(item.name, existing);
                    });
                }
            } catch (e) { }
        });
        const allTopItems = Array.from(itemsMap.values()).sort((a, b) => b.revenue - a.revenue);

        // Employee Meals
        const employeeMealsItems = filteredTransactions.filter(t => t.payment_method === 'employee_meal');
        const totalEmployeeMealsValue = employeeMealsItems.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

        // Stock Info
        const lowStockItems = dataState.menuItems.filter(i => (Number(i.stock) || 0) <= 5);

        return {
            summary: {
                totalRevenue,
                totalExpenses: totalExpensesValue,
                netProfit: totalRevenue - totalExpensesValue,
                transactionCount: filteredTransactions.length,
                averageOrder: filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0
            },

            sales: {
                topItems: allTopItems.slice(0, 5),
                allTransactions: filteredTransactions,
                displayTransactions: filteredTransactions.slice(0, pageLimits.sales)
            },
            expenses: {
                totalExpenses: totalExpensesValue,
                items: filteredExpenses,
                displayItems: filteredExpenses.slice(0, pageLimits.expenses)
            },
            employeeMeals: {
                count: employeeMealsItems.length,
                totalValue: totalEmployeeMealsValue,
                items: employeeMealsItems,
                displayItems: employeeMealsItems.slice(0, pageLimits.employeeMeals)
            },
            stock: {
                items: dataState.menuItems,
                displayItems: dataState.menuItems.slice(0, pageLimits.stock)
            },
            reconciliation: {
                items: filteredReconciliations,
                displayItems: filteredReconciliations.slice(0, pageLimits.reconciliation)
            },
            rawMaterials: {
                items: dataState.rawMaterials,
                displayItems: dataState.rawMaterials.slice(0, pageLimits.rawMaterials)
            }
        };
    }, [dataState, startDate, endDate, loading, pageLimits]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
        // Reset page limits on refresh
        setPageLimits({
            sales: 10,
            expenses: 10,
            stock: 10,
            employeeMeals: 10,
            reconciliation: 10,
            rawMaterials: 10
        });
    }, [fetchData]);

    const onRangeChange = useCallback((range) => {
        setSelectedRange(range);
        const todayStr = getLocalDateString();
        if (range === 'today') {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (range === 'yesterday') {
            const yesterday = getLocalDateString(1);
            setStartDate(yesterday);
            setEndDate(yesterday);
        } else if (range === 'thisMonth') {
            const firstDay = todayStr.substring(0, 8) + '01';
            setStartDate(firstDay);
            setEndDate(todayStr);
        }
        // Reset pagination when filter changes
        setPageLimits({
            sales: 10,
            expenses: 10,
            stock: 10,
            employeeMeals: 10,
            reconciliation: 10,
            rawMaterials: 10
        });
    }, [getLocalDateString]);

    const handleShare = useCallback(async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const uri = await reportRef.current.capture();
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                showToast('Sharing tidak tersedia di perangkat ini', 'error');
            }
        } catch (error) {
            console.error('Error sharing report:', error);
            showToast('Gagal membagikan laporan', 'error');
        } finally {
            setIsSharing(false);
        }
    }, [isSharing, showToast]);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }, []);

    const formatCurrencyForExport = useCallback((amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0).replace(/\s/g, '');
    }, []);

    const formatDateTime = useCallback((dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' ' +
            date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    }, []);

    const exportToPdf = useCallback(async () => {
        if (!reports) return;
        setLoading(true);
        try {
            // Prepare Data Sections similar to Website
            const sections = [];

            // 1. Analisis Gabungan (Periode Terpilih)
            const totalRevenue = parseFloat(reports.summary.totalRevenue || 0);
            const totalExpenses = parseFloat(reports.summary.totalExpenses || 0);
            const netProfit = parseFloat(reports.summary.netProfit || 0);
            const totalTransactions = parseInt(reports.summary.transactionCount || 0);
            const averageOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

            sections.push({
                title: 'Analisis Gabungan (Periode Terpilih)',
                headers: ['Keterangan', 'Nilai'],
                rows: [
                    ['Pendapatan Periode', formatCurrencyForExport(totalRevenue)],
                    ['Pengeluaran Periode', formatCurrencyForExport(totalExpenses)],
                    ['Laba Bersih Periode', formatCurrencyForExport(netProfit)],
                    ['Total Transaksi', `${totalTransactions} Transaksi`],
                    ['Rata-rata Order', formatCurrencyForExport(averageOrder)]
                ]
            });

            // 2. Menu Terlaris
            if (reports.sales.topItems && reports.sales.topItems.length > 0) {
                sections.push({
                    title: 'Menu Terlaris',
                    headers: ['Nama Menu', 'Terjual', 'Pendapatan'],
                    rows: reports.sales.topItems.map(item => [
                        item.name,
                        `${item.sold}`,
                        formatCurrencyForExport(item.revenue)
                    ])
                });
            }

            // 3. Detail Pengeluaran
            if (reports.expenses.items && reports.expenses.items.length > 0) {
                sections.push({
                    title: 'Detail Pengeluaran',
                    headers: ['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah'],
                    rows: reports.expenses.items.map(item => [
                        formatDateTime(item.date || new Date()), // Fallback to now if date missing
                        item.description,
                        item.category || '-',
                        formatCurrencyForExport(item.amount)
                    ])
                });
            }

            // 4. Daftar Transaksi (50 Terbaru) - Mobile Only Bonus
            if (reports.sales.allTransactions && reports.sales.allTransactions.length > 0) {
                sections.push({
                    title: 'Daftar Transaksi (50 Terbaru)',
                    headers: ['ID Transaksi', 'Waktu', 'Metode', 'Total'],
                    rows: reports.sales.allTransactions.slice(0, 50).map(t => [
                        `#${t.id.toString().slice(-6).toUpperCase()}`,
                        formatDateTime(t.timestamp),
                        t.payment_method,
                        formatCurrencyForExport(t.total)
                    ])
                });
            }

            // Generate HTML with Loop
            const html = `
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { 
                            font-family: 'Helvetica', 'Arial', sans-serif; 
                            padding: 40px; 
                            color: #333; 
                            background-color: #fff;
                        }
                        .header {
                            margin-bottom: 30px;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 20px;
                        }
                        h1 { 
                            color: #000; 
                            font-size: 24px;
                            margin: 0 0 10px 0;
                            font-weight: bold;
                        }
                        .meta-info {
                            color: #666;
                            font-size: 12px;
                            line-height: 1.5;
                        }
                        .section {
                            margin-bottom: 30px;
                            page-break-inside: avoid;
                        }
                        h2 { 
                            color: #fff; 
                            background-color: #14532d; /* Dark Green like Website header */
                            padding: 8px 12px;
                            font-size: 14px;
                            margin: 0 0 10px 0;
                            font-weight: bold;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            font-size: 10px;
                        }
                        th { 
                            background-color: #14532d; /* Dark Green Header */
                            color: white; 
                            text-align: left; 
                            padding: 8px;
                            font-weight: bold;
                            border: 1px solid #14532d;
                        }
                        td { 
                            border: 1px solid #ddd;
                            padding: 6px 8px;
                            color: #333;
                        }
                        tr:nth-child(even) td {
                            background-color: #f9fafb; /* Light Gray Alternating */
                        }
                        .footer { 
                            margin-top: 50px; 
                            text-align: center; 
                            font-size: 10px; 
                            color: #999;
                            border-top: 1px solid #eee;
                            padding-top: 10px;
                        }
                        .text-right { text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Laporan Bisnis Gabungan</h1>
                        <div class="meta-info">
                            <strong>Periode:</strong> ${startDate} s/d ${endDate}<br>
                            <strong>Tanggal Export:</strong> ${new Date().toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
                        </div>
                    </div>

                    ${sections.map(section => `
                        <div class="section">
                            <h2>${section.title}</h2>
                            <table>
                                <thead>
                                    <tr>
                                        ${section.headers.map(h => `<th>${h}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${section.rows.map(row => `
                                        <tr>
                                            ${row.map(cell => `<td>${cell}</td>`).join('')}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('')}

                    <div class="footer">
                        Sistem Kasir Berkah88 - Mobile App Generator<br>
                        Halaman 1 dari 1
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });

            // Share the PDF file
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf'
                });
            } else {
                showToast('Sharing tidak tersedia', 'error');
            }
        } catch (error) {
            console.error('Error exporting PDF:', error);
            showToast('Gagal mengekspor PDF', 'error');
        } finally {
            setLoading(false);
        }
    }, [reports, startDate, endDate, formatCurrencyForExport, formatDateTime, showToast]);

    const exportToExcel = useCallback(async () => {
        if (!reports) return;
        setLoading(true);
        try {
            // Generate CSV content with proper formatting
            let csv = "LAPORAN BISNIS BERKAH88\n";
            csv += `Periode:;${startDate};s/d;${endDate}\n`;
            csv += `Tanggal Export:;${new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}\n\n`;

            csv += "=== RINGKASAN PERFORMA ===\n";
            csv += `Total Pendapatan:;${formatCurrencyForExport(reports.summary.totalRevenue)}\n`;
            csv += `Total Pengeluaran:;${formatCurrencyForExport(reports.summary.totalExpenses)}\n`;
            csv += `Laba Bersih:;${formatCurrencyForExport(reports.summary.netProfit)}\n`;
            csv += `Total Transaksi:;${reports.summary.transactionCount} Transaksi\n\n`;

            csv += "=== DAFTAR TRANSAKSI (50 TERBARU) ===\n";
            csv += "ID Transaksi;Waktu;Metode Pembayaran;Total\n";
            reports.sales.allTransactions.slice(0, 50).forEach(t => {
                csv += `#${t.id.toString().slice(-6).toUpperCase()};${formatDateTime(t.timestamp)};${t.payment_method};${formatCurrencyForExport(t.total)}\n`;
            });
            csv += "\n";

            csv += "=== MENU TERLARIS ===\n";
            csv += "Nama Menu;Qty Terjual;Total Pendapatan\n";
            reports.sales.topItems.forEach(item => {
                csv += `${item.name};${item.sold} pcs;${formatCurrencyForExport(item.revenue)}\n`;
            });
            csv += "\n";

            csv += "=== DAFTAR PENGELUARAN ===\n";
            csv += "Deskripsi;Kategori;Jumlah\n";
            reports.expenses.items.forEach(e => {
                csv += `${e.description};${e.category || '-'};${formatCurrencyForExport(e.amount)}\n`;
            });
            csv += "\n";
            csv += "===================================\n";
            csv += "Sistem Kasir Berkah88 - Mobile App\n";

            // Save CSV to file
            const filename = `Laporan_Berkah88_${startDate}_${endDate}.csv`;
            const fileUri = FileSystem.documentDirectory + filename;
            await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

            // Share the CSV file
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv'
                });
            } else {
                showToast('Sharing tidak tersedia', 'error');
            }
        } catch (error) {
            console.error('Error exporting Excel/CSV:', error);
            showToast('Gagal mengekspor data', 'error');
        } finally {
            setLoading(false);
        }
    }, [reports, startDate, endDate, formatCurrencyForExport, formatDateTime, showToast]);

    if (loading && dataState.transactions.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#349BE5" />
                <Text style={styles.loadingText}>Menyiapkan Laporan Bisnis...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Laporan Bisnis</Text>
                    <TouchableOpacity onPress={handleShare} style={styles.shareBtn} disabled={isSharing}>
                        {isSharing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Share2 size={20} color="#FFFFFF" />}
                    </TouchableOpacity>
                </View>

                {/* Range Selector */}
                <View style={styles.rangeSelector}>
                    {['today', 'yesterday', 'thisMonth', 'custom'].map((range) => (
                        <TouchableOpacity
                            key={range}
                            style={[styles.rangeBtn, selectedRange === range && styles.rangeBtnActive]}
                            onPress={() => onRangeChange(range)}
                        >
                            <Text style={[styles.rangeText, selectedRange === range && styles.rangeTextActive]}>
                                {range === 'today' ? 'Hari Ini' : range === 'yesterday' ? 'Kemarin' : range === 'thisMonth' ? 'Bulan Ini' : 'Custom'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedRange === 'custom' && (
                    <View style={styles.customDateRow}>
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartDatePicker(true)}>
                            <Calendar size={14} color="#BFDBFE" />
                            <Text style={styles.datePickerText}>{startDate}</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#BFDBFE' }}>s/d</Text>
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndDatePicker(true)}>
                            <Calendar size={14} color="#BFDBFE" />
                            <Text style={styles.datePickerText}>{endDate}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showStartDatePicker && (
                    <DateTimePicker
                        value={new Date(startDate)}
                        mode="date"
                        display="default"
                        onChange={(e, date) => {
                            setShowStartDatePicker(false);
                            if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                setStartDate(`${year}-${month}-${day}`);
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
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                setEndDate(`${year}-${month}-${day}`);
                            }
                        }}
                    />
                )}
            </View>

            <ViewShot ref={reportRef} options={{ format: 'png', quality: 0.9 }} style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#349BE5']} />
                    }
                >
                    {/* Ringkasan Statistik */}
                    <View style={styles.summaryGrid}>
                        <StatCard title="Pendapatan Bruto" value={formatCurrency(reports?.summary?.totalRevenue)} icon={DollarSign} color="#10B981" subValue={`${reports?.summary?.transactionCount} Transaksi`} />
                        <StatCard title="Total Pengeluaran" value={formatCurrency(reports?.summary?.totalExpenses)} icon={TrendingUp} color="#EF4444" subValue="Operasional & Stok" />
                        <StatCard title="Laba Bersih" value={formatCurrency(reports?.summary?.netProfit)} icon={Wallet} color="#3B82F6" subValue="Estimasi Keuntungan" />
                        <StatCard title="Rata-rata Order" value={formatCurrency(reports?.summary?.averageOrder)} icon={ShoppingCart} color="#8B5CF6" subValue="Nilai per Keranjang" />
                    </View>

                    {/* Financial Report Link */}
                    {/* Financial Report Link - Premium Redesign */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('Keuangan')}
                        style={styles.financialCardContainer}
                    >
                        <View
                            style={[styles.financialGradient, { backgroundColor: '#349BE5' }]}
                        >
                            {/* Decorative Elements */}
                            <View style={styles.decorativeCircle1} />
                            <View style={styles.decorativeCircle2} />

                            <View style={styles.financialContent}>
                                <View style={styles.financialIconRow}>
                                    <View style={styles.financialIconBox}>
                                        <Briefcase size={24} color="#349BE5" />
                                    </View>
                                    <View style={styles.financialTitleBox}>
                                        <Text style={[styles.financialTitleText, { color: '#FFFFFF' }]}>Laporan Keuangan & Aset</Text>
                                        <Text style={[styles.financialSubText, { color: '#E1F5FE' }]}>Analisis Laba Rugi & Valuasi Stok</Text>
                                    </View>
                                </View>

                                <View style={styles.financialActionRow}>
                                    <Text style={styles.financialActionText}>Lihat Detail Lengkap</Text>
                                    <View style={styles.financialActionIcon}>
                                        <ArrowRight size={16} color="#349BE5" />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Charts Area */}
                    <View style={styles.chartSection}>
                        <View style={styles.chartHeader}>
                            <BarChart3 size={18} color="#1E293B" />
                            <Text style={styles.chartTitle}>Menu Terlaris (Qty)</Text>
                        </View>
                        <View style={styles.chartBody}>
                            {reports?.sales?.topItems.length > 0 ? (
                                reports.sales.topItems.map((item, idx) => (
                                    <SimpleProgressBar key={idx} label={item.name} value={item.sold} maxValue={reports.sales.topItems[0].sold} color={idx === 0 ? '#10B981' : '#3B82F6'} />
                                ))
                            ) : (
                                <Text style={styles.emptyText}>Tidak ada data penjualan</Text>
                            )}
                        </View>
                    </View>

                    {/* Detailed Sections with Pagination */}

                    {/* 1. Laporan Penjualan Lengkap */}
                    <ReportSection
                        title="Daftar Transaksi"
                        icon={ShoppingCart}
                        color="#3B82F6"
                        expanded={expandedSections.sales}
                        onToggle={() => toggleSection('sales')}
                        count={reports?.sales?.allTransactions?.length}
                        showMore={reports?.sales?.allTransactions?.length > pageLimits.sales}
                        onShowMore={() => handleShowMore('sales')}
                    >
                        {reports?.sales?.displayTransactions?.map((item, idx) => (
                            <View key={idx} style={styles.listRow}>
                                <View style={styles.listRowLeft}>
                                    <Text style={styles.listRowTitle}>#{item.id.toString().slice(-6).toUpperCase()}</Text>
                                    <Text style={styles.listRowSub}>{formatDateTime(item.timestamp)}</Text>
                                </View>
                                <View style={styles.listRowRight}>
                                    <Text style={[styles.listRowValue, { color: '#10B981' }]}>{formatCurrency(item.total)}</Text>
                                    <Text style={styles.listRowInfo}>{item.payment_method?.toUpperCase()}</Text>
                                </View>
                            </View>
                        ))}
                    </ReportSection>

                    {/* 2. Laporan Stok Lengkap */}
                    <ReportSection
                        title="Inventaris Menu"
                        icon={Package}
                        color="#EC4899"
                        expanded={expandedSections.stock}
                        onToggle={() => toggleSection('stock')}
                        count={reports?.stock?.items?.length}
                        showMore={reports?.stock?.items?.length > pageLimits.stock}
                        onShowMore={() => handleShowMore('stock')}
                    >
                        {reports?.stock?.displayItems?.map((item, idx) => (
                            <View key={idx} style={styles.listRow}>
                                <View style={styles.listRowLeft}>
                                    <Text style={styles.listRowTitle}>{item.name}</Text>
                                    <Text style={styles.listRowSub}>{item.category || 'Lainnya'}</Text>
                                </View>
                                <View style={styles.listRowRight}>
                                    <Text style={[styles.listRowValue, { color: Number(item.stock) <= 5 ? '#EF4444' : '#1E293B' }]}>
                                        Stok: {item.stock}
                                    </Text>
                                    <Text style={styles.listRowInfo}>{formatCurrency(item.price)}</Text>
                                </View>
                            </View>
                        ))}
                    </ReportSection>

                    {/* 3. Laporan Pengeluaran Lengkap */}
                    <ReportSection
                        title="Daftar Pengeluaran"
                        icon={TrendingUp}
                        color="#EF4444"
                        expanded={expandedSections.expenses}
                        onToggle={() => toggleSection('expenses')}
                        count={reports?.expenses?.items?.length}
                        showMore={reports?.expenses?.items?.length > pageLimits.expenses}
                        onShowMore={() => handleShowMore('expenses')}
                    >
                        {reports?.expenses?.displayItems?.map((item, idx) => (
                            <View key={idx} style={styles.listRow}>
                                <View style={styles.listRowLeft}>
                                    <Text style={styles.listRowTitle}>{item.description}</Text>
                                    <Text style={styles.listRowSub}>{item.category || 'Umum'} • {formatDateTime(item.date)}</Text>
                                </View>
                                <View style={styles.listRowRight}>
                                    <Text style={[styles.listRowValue, { color: '#EF4444' }]}>-{formatCurrency(item.amount)}</Text>
                                </View>
                            </View>
                        ))}
                    </ReportSection>

                    {/* 4. Laporan Makan Karyawan Lengkap */}
                    <ReportSection
                        title="Detail Bon Karyawan"
                        icon={Receipt}
                        color="#F59E0B"
                        expanded={expandedSections.employeeMeals}
                        onToggle={() => toggleSection('employeeMeals')}
                        count={reports?.employeeMeals?.items?.length}
                        showMore={reports?.employeeMeals?.items?.length > pageLimits.employeeMeals}
                        onShowMore={() => handleShowMore('employeeMeals')}
                    >
                        {reports?.employeeMeals?.displayItems?.map((item, idx) => (
                            <View key={idx} style={styles.listRow}>
                                <View style={styles.listRowLeft}>
                                    <Text style={styles.listRowTitle}>Bon Karyawan</Text>
                                    <Text style={styles.listRowSub}>{formatDateTime(item.timestamp)}</Text>
                                </View>
                                <View style={styles.listRowRight}>
                                    <Text style={styles.listRowValue}>{formatCurrency(item.total)}</Text>
                                </View>
                            </View>
                        ))}
                    </ReportSection>

                    {/* 5. Rekonsiliasi Kas Lengkap */}
                    <ReportSection
                        title="Rekonsiliasi Kas"
                        icon={Calculator}
                        color="#6366F1"
                        expanded={expandedSections.reconciliation}
                        onToggle={() => toggleSection('reconciliation')}
                        count={reports?.reconciliation?.items?.length}
                        showMore={reports?.reconciliation?.items?.length > pageLimits.reconciliation}
                        onShowMore={() => handleShowMore('reconciliation')}
                    >
                        {reports?.reconciliation?.displayItems?.map((item, idx) => (
                            <View key={idx} style={styles.listRow}>
                                <View style={styles.listRowLeft}>
                                    <Text style={styles.listRowTitle}>{item.recorded_by}</Text>
                                    <Text style={styles.listRowSub}>{item.date || item.created_at?.split('T')[0]}</Text>
                                </View>
                                <View style={styles.listRowRight}>
                                    <Text style={[styles.listRowValue, { color: parseFloat(item.variance_total || 0) === 0 ? '#10B981' : '#EF4444' }]}>
                                        Selisih: {formatCurrency(item.variance_total || 0)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ReportSection>

                    {/* 6. Bahan Baku Lengkap */}
                    <ReportSection
                        title="Stok Bahan Baku"
                        icon={Package}
                        color="#06B6D4"
                        expanded={expandedSections.rawMaterials}
                        onToggle={() => toggleSection('rawMaterials')}
                        count={reports?.rawMaterials?.items?.length}
                        showMore={reports?.rawMaterials?.items?.length > pageLimits.rawMaterials}
                        onShowMore={() => handleShowMore('rawMaterials')}
                    >
                        {reports?.rawMaterials?.displayItems?.map((item, idx) => (
                            <View key={idx} style={styles.listRow}>
                                <View style={styles.listRowLeft}>
                                    <Text style={styles.listRowTitle}>{item.name}</Text>
                                    <Text style={styles.listRowSub}>Kategori: {item.category || '-'}</Text>
                                </View>
                                <View style={styles.listRowRight}>
                                    <Text style={styles.listRowValue}>{item.stock} {item.unit}</Text>
                                </View>
                            </View>
                        ))}
                    </ReportSection>

                    {/* Modern Export Center */}
                    <View style={styles.exportSection}>
                        <View style={styles.exportHeader}>
                            <View style={styles.exportIconBox}>
                                <Share2 size={24} color="#349BE5" />
                            </View>
                            <View>
                                <Text style={styles.exportTitle}>Export Center</Text>
                                <Text style={styles.exportSub}>Unduh laporan dalam berbagai format</Text>
                            </View>
                        </View>
                        <View style={styles.exportButtonGrid}>
                            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#349BE5' }]} onPress={exportToExcel}>
                                <Package size={18} color="#FFF" />
                                <Text style={styles.exportBtnText}>Excel (CSV)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#0F172A' }]} onPress={exportToPdf}>
                                <FileText size={18} color="#FFF" />
                                <Text style={styles.exportBtnText}>Dokumen PDF</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </ViewShot>
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
        marginTop: 15,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#349BE5',
        paddingTop: Platform.OS === 'android' && StatusBar ? (StatusBar.currentHeight || 0) + 10 : 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    shareBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rangeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 5,
        borderRadius: 15,
        marginBottom: 15,
    },
    rangeBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 12,
    },
    rangeBtnActive: {
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' },
            android: { elevation: 4 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }
        }),
    },
    rangeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#BFDBFE',
    },
    rangeTextActive: {
        color: '#349BE5',
    },
    customDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
    },
    datePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        padding: 5,
    },
    datePickerText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: (width - 60) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1.5,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statTitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '900',
    },
    statSubValue: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 4,
        fontWeight: '600',
    },
    chartSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    chartBody: {
        gap: 15,
    },
    progressItem: {
        width: '100%',
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
        flex: 1,
    },
    progressValue: {
        fontSize: 12,
        color: '#1E293B',
        fontWeight: '900',
    },
    progressBg: {
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
        paddingVertical: 20,
    },
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionIconWrap: {
        width: 36,
        height: 36,
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    sectionCount: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
    },
    sectionContent: {
        padding: 16,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    listRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    listRowLeft: {
        flex: 1,
    },
    listRowTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    listRowSub: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 2,
    },
    listRowRight: {
        alignItems: 'flex-end',
    },
    historyValue: {
        fontSize: 13,
        fontWeight: '900',
    },
    exportSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 20,
        marginTop: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    exportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 20,
    },
    exportIconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#E1F5FE',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#B3E5FC',
    },
    exportTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    exportSub: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    exportButtonGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    exportBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 15,
        gap: 8,
    },
    exportBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    listRowValue: {
        fontSize: 14,
        fontWeight: '900',
    },
    listRowInfo: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        marginTop: 2,
    },
    showMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        gap: 8,
    },
    showMoreText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '900',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F0F9FF',
        padding: 10,
        borderRadius: 10,
        marginTop: 10,
        gap: 8,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 10,
        color: '#0284C7',
        fontWeight: '600',
        flex: 1,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
    },
    // Financial Link Styles
    // Updated Financial Card Styles
    financialCardContainer: {
        marginHorizontal: 0,
        marginBottom: 25,
        borderRadius: 24,
    },
    financialGradient: {
        borderRadius: 24,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(52, 155, 229, 0.1)', // Blue transparent
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -40,
        left: -20,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(52, 155, 229, 0.05)', // Blue transparent
    },
    financialContent: {
        position: 'relative',
        zIndex: 1,
    },
    financialIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    financialIconBox: {
        width: 50,
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    financialTitleBox: {
        flex: 1,
    },
    financialTitleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    financialSubText: {
        fontSize: 13,
        color: '#BFDBFE',
        fontWeight: '500',
    },
    financialActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    financialActionText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    financialActionIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default BusinessReports;
