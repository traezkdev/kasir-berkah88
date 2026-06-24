import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    FlatList,
} from 'react-native';
import {
    ChevronLeft,
    Calendar,
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    Smartphone,
    ShoppingCart,
    Utensils,
    Receipt,
    BarChart2,
    FileText,
    FileSpreadsheet,
    Building,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);

const SummaryCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
        <View style={[styles.summaryIconWrap, { backgroundColor: color + '18' }]}>
            <Icon size={22} color={color} />
        </View>
        <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>{title}</Text>
            <Text style={[styles.summaryValue, { color }]}>{value}</Text>
            {subtitle ? <Text style={styles.summarySubtitle}>{subtitle}</Text> : null}
        </View>
    </View>
);

const LaporanHarian = ({ navigation }) => {
    const { showToast } = useToast();

    const getLocalDateString = (date = new Date()) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const [selectedDate, setSelectedDate] = useState(getLocalDateString());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [summaryData, setSummaryData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [totalExpense, setTotalExpense] = useState(0);
    const [lapakDeposit, setLapakDeposit] = useState(0);
    const [ownerDeposit, setOwnerDeposit] = useState(0);

    // Pagination
    const [menuPage, setMenuPage] = useState(1);
    const [expensePage, setExpensePage] = useState(1);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, allTxRes, expenseRes, lapakRes, ownerRes] = await Promise.all([
                apiService.get(`/api/transactions/daily-recap?date=${selectedDate}`),
                apiService.get(`/api/transactions/all?startDate=${selectedDate}&endDate=${selectedDate}&filterClosed=false`),
                apiService.get(`/api/expenses/all?startDate=${selectedDate}&endDate=${selectedDate}&filterClosed=false`),
                apiService.get('/api/accounts/lapak_deposit'),
                apiService.get('/api/accounts/owner_deposit'),
            ]);

            if (summaryRes.data.message === 'success') {
                setSummaryData(summaryRes.data.data);
            }
            if (allTxRes.data.message === 'success') {
                setTransactions(allTxRes.data.data || []);
                setMenuPage(1);
            }
            if (expenseRes.data.message === 'success') {
                const expData = expenseRes.data.data || [];
                setTotalExpense(expData.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0));
                setExpenses(expData);
                setExpensePage(1);
            }
            if (lapakRes.data.message === 'success') {
                setLapakDeposit(lapakRes.data.data?.account?.balance || 0);
            }
            if (ownerRes.data.message === 'success') {
                setOwnerDeposit(ownerRes.data.data?.account?.balance || 0);
            }
        } catch (err) {
            console.error('LaporanHarian fetch error:', err);
            showToast('Gagal memuat data laporan harian', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedDate, showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    // Hourly data
    const hourlyData = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, count: 0 }));
        transactions.forEach(t => {
            const d = new Date(t.timestamp || t.created_at || '');
            if (!isNaN(d.getTime())) hours[d.getHours()].count += 1;
        });
        return hours.filter(h => h.count > 0);
    }, [transactions]);

    // Menu sold data
    const menuSoldStats = useMemo(() => {
        const map = {};
        transactions.forEach(t => {
            let items = [];
            try { items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items; } catch { }
            if (Array.isArray(items)) {
                items.forEach(item => {
                    if (!map[item.name]) map[item.name] = { name: item.name, quantity: 0, revenue: 0 };
                    map[item.name].quantity += item.quantity;
                    map[item.name].revenue += (item.price * item.quantity);
                });
            }
        });
        return Object.values(map).sort((a, b) => b.quantity - a.quantity);
    }, [transactions]);

    // Pagination computed
    const menuTotalPages = Math.max(1, Math.ceil(menuSoldStats.length / ITEMS_PER_PAGE));
    const currentMenus = menuSoldStats.slice((menuPage - 1) * ITEMS_PER_PAGE, menuPage * ITEMS_PER_PAGE);

    const expenseTotalPages = Math.max(1, Math.ceil(expenses.length / ITEMS_PER_PAGE));
    const currentExpenses = expenses.slice((expensePage - 1) * ITEMS_PER_PAGE, expensePage * ITEMS_PER_PAGE);

    // Max hourly count for bar chart
    const maxHourCount = useMemo(() => Math.max(...hourlyData.map(h => h.count), 1), [hourlyData]);

    const exportToPdf = useCallback(async () => {
        if (!summaryData) { showToast('Tidak ada data untuk diekspor', 'error'); return; }
        setLoading(true);
        try {
            const menuRows = menuSoldStats.map((m, i) =>
                `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
                    <td>${i + 1}</td><td>${m.name}</td><td style="text-align:center">${m.quantity}x</td><td style="text-align:right">${formatCurrency(m.revenue)}</td>
                </tr>`).join('');

            const expRows = expenses.map((e, i) => {
                const t = new Date(e.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                return `<tr style="background:${i % 2 === 0 ? '#fff5f5' : '#fff'}">
                    <td>${t}</td><td>${e.name}${e.notes ? `<br><small style="color:#888">${e.notes}</small>` : ''}</td><td>${e.category || 'Lainnya'}</td><td style="text-align:right;color:#dc2626;font-weight:bold">${formatCurrency(e.amount)}</td>
                </tr>`;
            }).join('');

            const html = `<html><head><meta charset="UTF-8"><style>
                body{font-family:Arial,sans-serif;padding:30px;color:#333}
                h1{color:#1e40af;font-size:20px;margin-bottom:4px}
                .meta{color:#666;font-size:12px;margin-bottom:20px}
                h2{color:#fff;background:#1e40af;padding:8px 12px;font-size:13px;margin:20px 0 8px}
                .summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px}
                .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#f8fafc}
                .card-label{font-size:11px;color:#888;margin-bottom:4px}
                .card-value{font-size:16px;font-weight:bold;color:#1e40af}
                .card-expense .card-value{color:#dc2626}
                table{width:100%;border-collapse:collapse;font-size:11px}
                th{background:#1e40af;color:#fff;padding:8px;text-align:left;border:1px solid #1e40af}
                td{border:1px solid #e5e7eb;padding:6px 8px}
                .footer{margin-top:40px;text-align:center;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px}
            </style></head><body>
                <h1>Laporan Penjualan Harian</h1>
                <div class="meta">Tanggal: <strong>${selectedDate}</strong> &nbsp;|&nbsp; Diekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>

                <h2>Ringkasan Pendapatan & Pengeluaran</h2>
                <div class="summary-grid">
                    <div class="card"><div class="card-label">Total Pendapatan</div><div class="card-value">${formatCurrency(summaryData.grand_total)}</div></div>
                    <div class="card card-expense"><div class="card-label">Total Pengeluaran</div><div class="card-value">${formatCurrency(totalExpense)}</div></div>
                    <div class="card"><div class="card-label">Tunai</div><div class="card-value">${formatCurrency(summaryData.total_tunai)}</div></div>
                    <div class="card"><div class="card-label">Transfer / QRIS</div><div class="card-value">${formatCurrency(summaryData.total_transfer)}</div></div>
                    <div class="card"><div class="card-label">Total Transaksi</div><div class="card-value">${transactions.length} Trx</div></div>
                    <div class="card"><div class="card-label">Aplikasi (Gojek dll)</div><div class="card-value">${formatCurrency(summaryData.total_gojek)}</div></div>
                    <div class="card"><div class="card-label">Sisa Deposit Lapak</div><div class="card-value" style="color:#2563eb">${formatCurrency(lapakDeposit)}</div></div>
                    <div class="card"><div class="card-label">Sisa Deposit Transfer</div><div class="card-value" style="color:#4f46e5">${formatCurrency(ownerDeposit)}</div></div>
                </div>

                <h2>Menu Terjual</h2>
                <table><thead><tr><th>No</th><th>Nama Menu</th><th>Terjual</th><th>Pendapatan</th></tr></thead><tbody>
                    ${menuRows || '<tr><td colspan="4" style="text-align:center">Belum ada data</td></tr>'}
                </tbody></table>

                <h2>Detail Pengeluaran</h2>
                <table><thead><tr><th>Waktu</th><th>Deskripsi</th><th>Kategori</th><th>Nominal</th></tr></thead><tbody>
                    ${expRows || '<tr><td colspan="4" style="text-align:center">Tidak ada pengeluaran</td></tr>'}
                </tbody></table>

                <div class="footer">Kasir Berkah88 &mdash; Laporan Harian &mdash; ${selectedDate}</div>
            </body></html>`;

            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                showToast('Sharing tidak tersedia di perangkat ini', 'error');
            }
        } catch (err) {
            console.error('PDF export error:', err);
            showToast('Gagal mengekspor PDF', 'error');
        } finally {
            setLoading(false);
        }
    }, [summaryData, menuSoldStats, expenses, totalExpense, selectedDate, showToast]);

    // Date change handler
    const onDateChange = (event, date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) setSelectedDate(getLocalDateString(date));
    };

    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const formattedDisplayDate = selectedDateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const PT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e40af" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: PT + 12 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Laporan Harian</Text>
                    <Text style={styles.headerSubtitle}>Pantau Penjualan Anda</Text>
                </View>
                <TouchableOpacity onPress={exportToPdf} style={styles.exportBtn}>
                    <FileText size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Date Picker Bar */}
            <View style={styles.dateBar}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                    <Calendar size={16} color="#1e40af" />
                    <Text style={styles.datePickerText}>{formattedDisplayDate}</Text>
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDateObj}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                />
            )}

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1e40af']} />}
                showsVerticalScrollIndicator={false}
            >
                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1e40af" />
                        <Text style={styles.loadingText}>Memuat data laporan...</Text>
                    </View>
                ) : summaryData ? (
                    <>
                        {/* Summary Cards */}
                        <Text style={styles.sectionLabel}>Ringkasan Pendapatan</Text>
                        <View style={styles.cardsGrid}>
                            <SummaryCard
                                title="Total Pendapatan"
                                value={formatCurrency(summaryData.grand_total)}
                                icon={TrendingUp}
                                color="#1e40af"
                                subtitle={`${transactions.length} Transaksi`}
                            />
                            <SummaryCard
                                title="Total Pengeluaran"
                                value={formatCurrency(totalExpense)}
                                icon={TrendingDown}
                                color="#dc2626"
                                subtitle={`${expenses.length} Item`}
                            />
                            <SummaryCard
                                title="Tunai"
                                value={formatCurrency(summaryData.total_tunai)}
                                icon={Wallet}
                                color="#16a34a"
                            />
                            <SummaryCard
                                title="Transfer / QRIS"
                                value={formatCurrency(summaryData.total_transfer)}
                                icon={CreditCard}
                                color="#7c3aed"
                            />
                            <SummaryCard
                                title="Aplikasi (Gojek dll)"
                                value={formatCurrency(summaryData.total_gojek)}
                                icon={Smartphone}
                                color="#ea580c"
                            />
                            <SummaryCard
                                title="Sisa Deposit Lapak"
                                value={formatCurrency(lapakDeposit)}
                                icon={Wallet}
                                color="#2563eb"
                            />
                            <SummaryCard
                                title="Sisa Deposit Transfer"
                                value={formatCurrency(ownerDeposit)}
                                icon={Building}
                                color="#4f46e5"
                            />
                            <SummaryCard
                                title="Total Transaksi"
                                value={`${transactions.length} Trx`}
                                icon={ShoppingCart}
                                color="#0891b2"
                            />
                        </View>

                        {/* Hourly Chart */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: '#dbeafe' }]}>
                                    <BarChart2 size={18} color="#1e40af" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Jam Ramai Transaksi</Text>
                                    <Text style={styles.sectionSubtitle}>Distribusi transaksi per jam</Text>
                                </View>
                            </View>
                            {hourlyData.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartContainer}>
                                    <View style={styles.chartInner}>
                                        {hourlyData.map((h, i) => {
                                            const barH = Math.max(4, (h.count / maxHourCount) * 120);
                                            return (
                                                <View key={i} style={styles.barGroup}>
                                                    <Text style={styles.barCount}>{h.count}</Text>
                                                    <View style={[styles.bar, { height: barH }]} />
                                                    <Text style={styles.barLabel}>{h.hour.split(':')[0]}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>Tidak ada data transaksi</Text>
                                </View>
                            )}
                        </View>

                        {/* Menu Terjual */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: '#fef3c7' }]}>
                                    <Utensils size={18} color="#d97706" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Menu Terjual</Text>
                                    <Text style={styles.sectionSubtitle}>Total: {menuSoldStats.length} item unik</Text>
                                </View>
                            </View>

                            {menuSoldStats.length > 0 ? (
                                <>
                                    {/* Table Header */}
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.th, { flex: 0.5 }]}>No</Text>
                                        <Text style={[styles.th, { flex: 2.5 }]}>Nama Menu</Text>
                                        <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Terjual</Text>
                                        <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Pendapatan</Text>
                                    </View>
                                    {currentMenus.map((item, idx) => (
                                        <View key={idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                                            <View style={[styles.rankBadge, { flex: 0.5 }]}>
                                                <Text style={styles.rankText}>{(menuPage - 1) * ITEMS_PER_PAGE + idx + 1}</Text>
                                            </View>
                                            <Text style={[styles.td, { flex: 2.5, fontWeight: '600', color: '#1e293b' }]} numberOfLines={1}>{item.name}</Text>
                                            <View style={{ flex: 1, alignItems: 'center' }}>
                                                <View style={styles.qtyBadge}>
                                                    <Text style={styles.qtyText}>{item.quantity}x</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.td, { flex: 1.5, textAlign: 'right', color: '#475569' }]}>{formatCurrency(item.revenue)}</Text>
                                        </View>
                                    ))}
                                    {menuTotalPages > 1 && (
                                        <PaginationBar page={menuPage} totalPages={menuTotalPages} onPageChange={setMenuPage} />
                                    )}
                                </>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>Belum ada menu yang terjual</Text>
                                </View>
                            )}
                        </View>

                        {/* Detail Pengeluaran */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: '#fee2e2' }]}>
                                    <Receipt size={18} color="#dc2626" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Detail Pengeluaran</Text>
                                    <Text style={styles.sectionSubtitle}>Total: {expenses.length} transaksi</Text>
                                </View>
                            </View>

                            {expenses.length > 0 ? (
                                <>
                                    {currentExpenses.map((expense, idx) => {
                                        const timeStr = new Date(expense.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                        return (
                                            <View key={expense.id || idx} style={[styles.expenseCard, idx % 2 === 0 && styles.expenseCardAlt]}>
                                                <View style={styles.expenseTop}>
                                                    <Text style={styles.expenseTime}>{timeStr}</Text>
                                                    <View style={styles.categoryBadge}>
                                                        <Text style={styles.categoryText}>{expense.category || 'Lainnya'}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.expenseBottom}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.expenseName} numberOfLines={2}>{expense.name}</Text>
                                                        {expense.notes ? <Text style={styles.expenseNotes} numberOfLines={2}>{expense.notes}</Text> : null}
                                                    </View>
                                                    <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                    {expenseTotalPages > 1 && (
                                        <PaginationBar page={expensePage} totalPages={expenseTotalPages} onPageChange={setExpensePage} />
                                    )}
                                </>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>Tidak ada catatan pengeluaran</Text>
                                </View>
                            )}
                        </View>

                        <View style={{ height: 40 }} />
                    </>
                ) : (
                    <View style={styles.emptyFullScreen}>
                        <TrendingUp size={60} color="#cbd5e1" />
                        <Text style={styles.emptyFullText}>Tidak ada data untuk tanggal ini</Text>
                        <Text style={styles.emptyFullSub}>Coba pilih tanggal lain atau tarik ke bawah untuk menyegarkan halaman.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

// Simple Pagination Component
const PaginationBar = ({ page, totalPages, onPageChange }) => (
    <View style={styles.paginationRow}>
        <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => onPageChange(p => Math.max(1, p - 1))}
            disabled={page === 1}
        >
            <ChevronLeftIcon size={16} color={page === 1 ? '#cbd5e1' : '#1e40af'} />
        </TouchableOpacity>
        <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
        <TouchableOpacity
            style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
            onPress={() => onPageChange(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
        >
            <ChevronRightIcon size={16} color={page === totalPages ? '#cbd5e1' : '#1e40af'} />
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },

    // Header
    header: {
        backgroundColor: '#1e40af',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backBtn: { padding: 6, marginRight: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    exportBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: 8 },

    // Date bar
    dateBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    datePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
        alignSelf: 'flex-start',
    },
    datePickerText: { color: '#1e40af', fontWeight: '600', fontSize: 13 },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { padding: 16, gap: 14 },

    // Loading
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },

    // Section label
    sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: -6 },

    // Summary Cards
    cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderLeftWidth: 4,
        width: (width - 42) / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryIconWrap: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    summaryInfo: { flex: 1 },
    summaryTitle: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 2 },
    summaryValue: { fontSize: 14, fontWeight: '800' },
    summarySubtitle: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

    // Section Card
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    sectionIconWrap: { width: 38, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    sectionSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 1 },

    // Hourly Chart
    chartContainer: { paddingHorizontal: 16, paddingBottom: 16 },
    chartInner: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 16, paddingRight: 32, minHeight: 160 },
    barGroup: { alignItems: 'center', width: 32 },
    bar: { width: 18, backgroundColor: '#3b82f6', borderRadius: 4, borderTopLeftRadius: 6, borderTopRightRadius: 6, marginBottom: 4 },
    barCount: { fontSize: 10, color: '#475569', fontWeight: '600', marginBottom: 2 },
    barLabel: { fontSize: 10, color: '#94a3b8' },

    // Table
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        alignItems: 'center',
    },
    th: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tableRowAlt: { backgroundColor: '#f8fafc' },
    rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
    rankText: { fontSize: 11, fontWeight: '700', color: '#1e40af' },
    td: { fontSize: 13, color: '#334155' },
    qtyBadge: { backgroundColor: '#1e40af', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    qtyText: { fontSize: 11, fontWeight: '700', color: '#fff' },

    // Expense Cards
    expenseCard: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        gap: 8,
    },
    expenseCardAlt: { backgroundColor: '#fafafa' },
    expenseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expenseTime: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
    categoryBadge: {
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    categoryText: { fontSize: 10, color: '#64748b', fontWeight: '600' },
    expenseBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
    expenseName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
    expenseNotes: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    expenseAmount: { fontSize: 14, fontWeight: '800', color: '#dc2626', whiteSpace: 'nowrap' },

    // Pagination
    paginationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    pageBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
    pageBtnDisabled: { borderColor: '#f1f5f9', backgroundColor: '#f8fafc' },
    pageInfo: { fontSize: 13, fontWeight: '600', color: '#475569' },

    // Empty States
    emptyState: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
    emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
    emptyFullScreen: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 30 },
    emptyFullText: { fontSize: 16, fontWeight: '700', color: '#64748b', marginTop: 16, textAlign: 'center' },
    emptyFullSub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default LaporanHarian;
