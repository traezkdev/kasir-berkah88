import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import MetricsCard from '../main-dashboard/components/MetricsCard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import authFetch from '../../utils/authFetch';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import LoadingScreen from '../../components/ui/LoadingScreen';
import AdminMobileHeader from '../../components/ui/AdminMobileHeader';
import MobileBottomNav from '../../components/ui/MobileBottomNav';
import { exportToExcel, exportAuditorToPdf, prepareAuditDataForExport } from '../../utils/exportUtils';


const apiUrl = import.meta.env.VITE_API_URL;

export default function AuditorPage() {
    const { theme } = useTheme();
    const { toggleSidebar } = useAppSettings();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const getJakartaDate = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).split(' ')[0];
    const getJakartaNow = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(getJakartaDate());
    const [isSavingDefault, setIsSavingDefault] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role);
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        }
    }, []);

    const fetchData = async (currentStart, currentEnd) => {
        // Jakarta date as default fallback for end
        const today = getJakartaDate();

        // Safeguard against objects (like React events) being passed as arguments
        const start = typeof currentStart === 'string' ? currentStart : startDate;
        const end = typeof currentEnd === 'string' ? currentEnd : (endDate || today);

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);
            params.append('filterClosed', 'true');
            const queryString = params.toString() ? `?${params.toString()}` : '';

            const [allTransRes, menuRes, expenseRes, settingsRes, ownerAccountRes, lapakAccountRes, rawMaterialsRes, unitsRes, precisionRes] = await Promise.all([
                authFetch(`${apiUrl}/api/transactions/all${queryString}`),
                authFetch(`${apiUrl}/api/menu-items/all`),
                authFetch(`${apiUrl}/api/expenses/all${queryString}`),
                authFetch(`${apiUrl}/api/all-settings`),
                authFetch(`${apiUrl}/api/accounts/owner_deposit`),
                authFetch(`${apiUrl}/api/accounts/lapak_deposit`),
                authFetch(`${apiUrl}/api/raw-materials`),
                authFetch(`${apiUrl}/api/units`),
                authFetch(`${apiUrl}/api/audit/calculate-accuracy${queryString}`)
            ]);

            const [
                allTransactions,
                menuItems,
                expenses,
                settings,
                ownerAccount,
                lapakAccount,
                rawMaterials,
                units,
                precisionData
            ] = await Promise.all([
                allTransRes.json(),
                menuRes.json(),
                expenseRes.json(),
                settingsRes.json(),
                ownerAccountRes.json(),
                lapakAccountRes.json(),
                rawMaterialsRes.json(),
                unitsRes.json(),
                precisionRes.json()
            ]);

            // Auto-initialize dates from settings on first load
            if (!isInitialized) {
                setIsInitialized(true);

                // Priority 1: Specifically saved audit start date
                // Priority 2: Master initial capital date (KEEP FULL TIMESTAMP)
                const auditStart = settings.data?.audit_start_date;
                const capitalStart = settings.data?.initial_capital_date || null;
                const defaultStartDate = auditStart || capitalStart;

                if (defaultStartDate && !startDate && !currentStart) {
                    setStartDate(defaultStartDate);
                    // Re-fetch immediately with the default dates (start from settings, end is today)
                    return fetchData(defaultStartDate, end);
                }
            }

            processAuditData({
                transactions: allTransactions.data || [],
                menuItems: menuItems.data || [],
                expenses: expenses.data || [],
                settings: settings.data || {},
                ownerBalance: ownerAccount.data?.account?.balance || 0,
                lapakBalance: lapakAccount.data?.account?.balance || 0,
                rawMaterials: rawMaterials.data || [],
                units: units.data || [],
                precision: precisionData.data || {}
            });
        } catch (error) {
            console.error("Audit fetch error:", error);
            toast.error("Gagal memuat data audit");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAsDefault = async () => {
        if (!startDate) {
            toast.error("Silakan pilih tanggal mulai terlebih dahulu");
            return;
        }
        setIsSavingDefault(true);
        try {
            const res = await authFetch(`${apiUrl}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audit_start_date: startDate })
            });
            if (res.ok) {
                toast.success("Tanggal audit default disimpan");
            } else {
                throw new Error("Gagal menyimpan");
            }
        } catch (error) {
            toast.error("Gagal menyimpan pengaturan default");
        } finally {
            setIsSavingDefault(false);
        }
    };

    const processAuditData = (raw) => {
        // High Precision Metrics from Backend
        const precision = raw.precision || {};
        const masterInitialCapital = parseFloat(raw.settings.initial_capital) || 0;
        const periodOpeningBalance = precision.openingBalance !== undefined ? precision.openingBalance : masterInitialCapital;

        // Revenue logic (exclude employee meals and non-monetary)
        const totalRevenue = precision.periodRevenue !== undefined ? precision.periodRevenue : raw.transactions
            .filter(t => t.payment_method !== 'employee_meal')
            .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

        const totalExpenses = precision.periodExpenses !== undefined ? precision.periodExpenses : raw.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        // Expected Cash Formula (Based on Period Data)
        const expectedCash = precision.expectedClosingBalance || (periodOpeningBalance + totalRevenue - totalExpenses);

        // Physical Cash (Bank + Cash as of the END of period)
        const physicalCash = precision.physicalCashAtEnd !== undefined ? precision.physicalCashAtEnd : (parseFloat(raw.ownerBalance) + parseFloat(raw.lapakBalance));
        const finalOwnerBalance = precision.currentOwnerBalance !== undefined ? precision.currentOwnerBalance : raw.ownerBalance;
        const finalLapakBalance = precision.currentLapakBalance !== undefined ? precision.currentLapakBalance : raw.lapakBalance;

        const cashDifference = physicalCash - expectedCash;

        // Stock Values
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

        // Business Equity (Real Wealth)
        const netProfit = totalRevenue - totalExpenses;
        const targetEquity = expectedCash + stockValue;
        const currentEquity = physicalCash + stockValue;
        const equityDifference = currentEquity - targetEquity;

        // Anomalies
        const anomalies = [];
        if (Math.abs(cashDifference) > 1000) {
            anomalies.push({
                title: "Selisih Uang Signifikan",
                desc: `Terdapat selisih Rp ${formatCurrency(Math.abs(cashDifference))} antara uang fisik dan catatan.`,
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

        const highDiscountTrans = raw.transactions.filter(t => {
            const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
            return items.some(i => i.discount > 0.5); // More than 50% discount
        });
        if (highDiscountTrans.length > 0) {
            anomalies.push({
                title: "Diskon Tidak Wajar",
                desc: `Ditemukan ${highDiscountTrans.length} transaksi dengan diskon di atas 50%.`,
                type: "warning"
            });
        }

        setData({
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

    const handleExportExcel = () => {
        if (!data) return;
        const sections = prepareAuditDataForExport(data);
        const filename = `Audit_Laporan_${startDate || 'Awal'}_sd_${endDate || 'Hari_Ini'}`;
        exportToExcel(sections, filename);
        toast.success("Laporan Excel sedang diunduh");
    };

    const handleExportPdf = async () => {
        if (!data) return;
        const filename = `Audit_Laporan_${startDate || 'Awal'}_sd_${endDate || 'Hari_Ini'}`;
        const dateRange = { startDate, endDate };

        // Ambil template dari settings
        let template = {};
        try {
            const res = await authFetch(`${apiUrl}/api/all-settings`);
            const settingsData = await res.json();
            if (res.ok && settingsData.data) {
                Object.keys(settingsData.data).forEach(key => {
                    if (key.startsWith('audit_pdf_')) {
                        const templateKey = key.replace('audit_pdf_', '');
                        template[templateKey] = settingsData.data[key];
                    }
                });
            }
        } catch (e) {
            console.warn('Gagal memuat template PDF, menggunakan default.', e);
        }

        exportAuditorToPdf(data, filename, dateRange, template);
        toast.success("Laporan PDF sedang diunduh");
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const formatCurrency = (num) => {
        return 'Rp ' + formatNumber(num);
    };

    if (loading || !data) {
        return <LoadingScreen message="Menganalisis Data Keuangan" submessage="Melakukan kalkulasi aset dan transaksi" />;
    }

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50' : 'bg-transparent'} pb-20 lg:pb-0`}>
            {/* Mobile-Only Premium Header */}
            <AdminMobileHeader
                title="Sistem Audit"
                subtitle="Data Konsolidasi"
                badgeText="Keamanan & Transparansi"
                decorativeIcon="ShieldCheck"
                stickyTitle="Audit Sistem"
                actions={[
                    {
                        label: 'Refresh Data',
                        icon: 'RefreshCw',
                        onClick: () => fetchData()
                    }
                ]}
            />

            {theme === 'default' && (
                <div className="hidden lg:block">
                    {userRole === 'owner' ? (
                        <OwnerNavigationHeader
                            onToggleSidebar={toggleSidebar}
                            headerTitle="Sistem Audit"
                        />
                    ) : (
                        <NavigationHeader
                            onToggleSidebar={toggleSidebar}
                            headerTitle="Sistem Audit"
                        />
                    )}
                </div>
            )}

            <main className={`${theme === 'default' ? 'w-full px-4 lg:px-8 pt-6 lg:pt-16 pb-12' : 'p-0'}`}>
                <div className="hidden lg:block pt-2">
                    <BreadcrumbNavigation
                        customPath={[
                            { label: userRole === 'owner' ? 'Dashboard Owner' : 'Dashboard', path: userRole === 'owner' ? '/owner-dashboard' : '/main-dashboard', isActive: false },
                            { label: 'Audit', path: '/auditor', isActive: true }
                        ]}
                    />
                </div>

                <header className="hidden lg:block mb-8 lg:mb-6">
                    <h1 className="text-2xl lg:text-3xl font-black text-text-primary mt-4 tracking-tighter uppercase lg:normal-case">
                        Pusat Audit Data
                    </h1>
                    <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 lg:hidden"></div>
                    <p className="text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
                        Laporan transparansi keuangan dan validasi akurasi sistem.
                    </p>
                </header>

                {/* Audit Status Bar - Premium Redesign */}
                <div className={`mb-10 lg:!mt-0 -mt-24 relative z-20 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white dark:border-slate-800`}>
                    <div className="flex flex-col md:flex-row items-stretch">
                        {/* Status Accent Side */}
                        <div className={`w-2 shrink-0 ${Math.abs(data.metrics.cashDifference) <= 100 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                        <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-7">
                                {/* Icon container without colored shadows */}
                                <div className="relative">
                                    <div className={`relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${Math.abs(data.metrics.cashDifference) <= 100 ? 'bg-emerald-500' : 'bg-rose-500'} text-white shadow-xl`}>
                                        <Icon name={Math.abs(data.metrics.cashDifference) <= 100 ? 'CheckCircle' : 'AlertTriangle'} size={32} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                        Status Integritas Data
                                        <span className={`inline-block w-2 h-2 rounded-full animate-ping ${Math.abs(data.metrics.cashDifference) <= 100 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    </h2>
                                    <div className="flex flex-col">
                                        <p className={`text-sm font-black uppercase tracking-widest ${Math.abs(data.metrics.cashDifference) <= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {Math.abs(data.metrics.cashDifference) <= 100
                                                ? 'Sangat Akurat (100%)'
                                                : `Peringatan: Selisih Rp ${formatNumber(Math.abs(data.metrics.cashDifference))}`
                                            }
                                        </p>
                                        <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tight mt-1">
                                            {Math.abs(data.metrics.cashDifference) <= 100
                                                ? 'Catatan kasir & uang fisik di bank/laci saat ini sinkron.'
                                                : 'Ditemukan ketidakcocokan antara uang fisik dan catatan sistem.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <Button
                                    onClick={() => fetchData()}
                                    variant="ghost"
                                    className="h-14 px-8 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-white font-black text-xs uppercase tracking-[0.2em] transition-all border border-gray-100 dark:border-slate-700 flex items-center gap-3 active:scale-95"
                                >
                                    <Icon name="RefreshCw" size={16} className={loading ? 'animate-spin' : ''} />
                                    Audit Ulang
                                </Button>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2">
                                    Update: {new Date().toLocaleTimeString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Filters & Configuration section */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Mulai Tanggal</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full h-10 px-4 rounded-xl bg-gray-50 dark:bg-slate-800 border-none text-sm font-bold text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        />
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full h-10 px-4 rounded-xl bg-gray-50 dark:bg-slate-800 border-none text-sm font-bold text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => fetchData()}
                            variant="primary"
                            className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Icon name="Search" size={16} />
                            Filter Audit
                        </Button>
                    </div>
                    {userRole === 'admin' || userRole === 'owner' ? (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleSaveAsDefault}
                                disabled={isSavingDefault || !startDate}
                                variant="ghost"
                                className="flex-1 h-14 rounded-2xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 text-purple-600 font-black text-[10px] uppercase tracking-widest border border-purple-100 dark:border-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Icon name={isSavingDefault ? "Loader2" : "Save"} size={16} severity={isSavingDefault ? "animate-spin" : ""} />
                                {isSavingDefault ? "Menyimpan..." : "Set Sebagai Default"}
                            </Button>
                        </div>
                    ) : null}
                </div>

                {/* Export Buttons Section - Cool UI */}
                <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={handleExportPdf}
                        className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 p-px transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <div className="relative flex items-center gap-5 bg-white dark:bg-slate-900 px-8 py-6 rounded-[1.45rem] transition-colors group-hover:bg-transparent">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white transition-transform group-hover:scale-110 group-hover:rotate-3">
                                <Icon name="FileText" size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider group-hover:text-white transition-colors">Export Laporan PDF</h4>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-white/80 transition-colors">Dokumen resmi & Arsip Digital</p>
                            </div>
                            <div className="h-8 w-8 rounded-full border border-gray-100 dark:border-slate-800 flex items-center justify-center group-hover:border-white/30 group-hover:text-white transition-all">
                                <Icon name="Download" size={14} />
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={handleExportExcel}
                        className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-px transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <div className="relative flex items-center gap-5 bg-white dark:bg-slate-900 px-8 py-6 rounded-[1.45rem] transition-colors group-hover:bg-transparent">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white transition-transform group-hover:scale-110 group-hover:-rotate-3">
                                <Icon name="FileSpreadsheet" size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider group-hover:text-white transition-colors">Export Laporan Excel</h4>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-white/80 transition-colors">Analisis Data Lanjutan (XLSX)</p>
                            </div>
                            <div className="h-8 w-8 rounded-full border border-gray-100 dark:border-slate-800 flex items-center justify-center group-hover:border-white/30 group-hover:text-white transition-all">
                                <Icon name="Download" size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== RINGKASAN KARTU AUDIT ===== */}
                <div className="mb-4">
                    <h3 className="text-sm font-black text-text-primary tracking-widest uppercase flex items-center gap-2">
                        <Icon name="BarChart3" size={16} />
                        Ringkasan Data Keuangan
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">Data berikut diambil berdasarkan rentang tanggal yang dipilih. Semua angka mengacu pada catatan transaksi di sistem.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">

                    {/* Modal Awal */}
                    {(() => {
                        const capitalGrowth = data.metrics.physicalCash - data.metrics.masterInitialCapital;
                        const capitalGrowthPercent = data.metrics.masterInitialCapital > 0
                            ? ((capitalGrowth / data.metrics.masterInitialCapital) * 100).toFixed(1)
                            : 0;
                        return (
                            <div className="p-5 rounded-2xl border border-border bg-purple-500/10 transition-all hover:shadow-md flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                                            <Icon name="PiggyBank" size={18} />
                                        </div>
                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Modal Awal</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${capitalGrowth >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {capitalGrowth >= 0 ? `▲ +${capitalGrowthPercent}%` : `▼ ${capitalGrowthPercent}%`}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-2xl font-mono font-black text-purple-500 tracking-tight">{formatCurrency(data.metrics.masterInitialCapital)}</p>
                                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                        Modal awal utama yang terdaftar di pengaturan sistem.
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-purple-500/20">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">
                                        Analisis Pertumbuhan Modal
                                    </p>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[11px] font-black uppercase tracking-tight ${capitalGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {capitalGrowth >= 0 ? '💰 Uang Mengembang' : '📉 Uang Menyusut'}
                                            </span>
                                            <span className={`text-xs font-mono font-black ${capitalGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {capitalGrowth >= 0 ? '+' : ''}{formatCurrency(capitalGrowth)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-text-secondary leading-relaxed opacity-80">
                                            {capitalGrowth >= 0
                                                ? `Total kas saat ini lebih besar dari modal awal sistem.`
                                                : `Total kas saat ini lebih kecil dari modal awal sistem.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Total Pendapatan */}
                    <div className="p-5 rounded-2xl border border-border bg-indigo-500/10 transition-all hover:shadow-md flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-500">
                                <Icon name="TrendingUp" size={18} />
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Pendapatan</span>
                        </div>
                        <div>
                            <p className="text-2xl font-mono font-black text-indigo-500 tracking-tight">{formatCurrency(data.metrics.totalRevenue)}</p>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Total uang masuk dari semua penjualan yang tercatat di sistem pada periode ini. Ini adalah <strong>pemasukan kotor</strong> sebelum dikurangi pengeluaran.</p>
                        </div>
                        <div className="pt-3 border-t border-indigo-500/20">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Catatan</p>
                            <p className="text-xs text-text-secondary">Transaksi dengan metode pembayaran <em>"Makan Karyawan"</em> tidak dihitung karena bukan pemasukan tunai.</p>
                        </div>
                    </div>

                    {/* Total Pengeluaran */}
                    <div className="p-5 rounded-2xl border border-border bg-rose-500/10 transition-all hover:shadow-md flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500">
                                <Icon name="TrendingDown" size={18} />
                            </div>
                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Total Pengeluaran</span>
                        </div>
                        <div>
                            <p className="text-2xl font-mono font-black text-rose-500 tracking-tight">{formatCurrency(data.metrics.totalExpenses)}</p>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Total uang keluar yang dicatat sebagai pengeluaran pada periode ini. Ini mencakup belanja bahan, biaya operasional, dan semua pengeluaran lainnya.</p>
                        </div>
                        <div className="pt-3 border-t border-rose-500/20">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Catatan</p>
                            <p className="text-xs text-text-secondary">Pastikan semua bon belanja sudah dicatat. Pengeluaran yang tidak tercatat akan menyebabkan selisih audit.</p>
                        </div>
                    </div>

                    {/* Laba Bersih */}
                    <div className={`p-5 rounded-2xl border border-border transition-all hover:shadow-md flex flex-col gap-3 ${data.metrics.netProfit >= 0 ? 'bg-emerald-600/10' : 'bg-rose-600/10'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${data.metrics.netProfit >= 0 ? 'bg-emerald-600/20 text-emerald-600' : 'bg-rose-600/20 text-rose-600'}`}>
                                    <Icon name="ChartColumn" size={18} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${data.metrics.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>Laba Bersih</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${data.metrics.netProfit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {data.metrics.netProfit >= 0 ? 'Untung' : 'Rugi'}
                            </span>
                        </div>
                        <div>
                            <p className={`text-2xl font-mono font-black tracking-tight ${data.metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(data.metrics.netProfit)}</p>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                {data.metrics.netProfit >= 0
                                    ? 'Bisnis menghasilkan keuntungan pada periode ini. Uang yang dihasilkan melebihi biaya yang dikeluarkan.'
                                    : 'Bisnis mengalami kerugian pada periode ini. Biaya yang dikeluarkan melebihi pendapatan yang masuk.'}
                            </p>
                        </div>
                        <div className={`pt-3 border-t ${data.metrics.netProfit >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5">Cara Hitung</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-mono bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded text-indigo-600 font-bold">{formatCurrency(data.metrics.totalRevenue)}</span>
                                <span className="text-xs text-text-secondary font-bold">−</span>
                                <span className="text-[11px] font-mono bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded text-rose-500 font-bold">{formatCurrency(data.metrics.totalExpenses)}</span>
                                <span className="text-xs text-text-secondary font-bold">=</span>
                                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-black ${data.metrics.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{formatCurrency(data.metrics.netProfit)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Nilai Stok */}
                    <div className="p-5 rounded-2xl border border-border bg-blue-600/10 transition-all hover:shadow-md flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-600">
                                <Icon name="Package" size={18} />
                            </div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Nilai Stok Barang</span>
                        </div>
                        <div>
                            <p className="text-2xl font-mono font-black text-blue-600 tracking-tight">{formatCurrency(data.metrics.stockValue)}</p>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Modal bisnis yang saat ini <strong>tidak berbentuk uang tunai</strong>, melainkan tersimpan dalam bentuk bahan baku dan stok menu yang siap jual.</p>
                        </div>
                        <div className="pt-3 border-t border-blue-500/20">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Artinya</p>
                            <p className="text-xs text-text-secondary">Jika semua stok terjual / dipakai, nilainya akan berubah menjadi kas. Stok yang terlalu besar bisa menandakan pembelian berlebih.</p>
                        </div>
                    </div>

                    {/* Kas Aktual */}
                    <div className="p-5 rounded-2xl border border-border bg-teal-500/10 transition-all hover:shadow-md flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-500">
                                <Icon name="Wallet" size={18} />
                            </div>
                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Kas Aktual (Uang Nyata)</span>
                        </div>
                        <div>
                            <p className="text-2xl font-mono font-black text-teal-500 tracking-tight">{formatCurrency(data.metrics.physicalCash)}</p>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                {endDate && new Date(endDate).toDateString() !== new Date().toDateString()
                                    ? `Estimasi total uang yang ada di tangan pada tanggal ${new Date(endDate).toLocaleDateString('id-ID')} berdasarkan histori saldo.`
                                    : "Total uang yang benar-benar ada secara fisik saat ini (Gabungan Owner + Lapak)."
                                }
                            </p>
                        </div>
                        <div className="pt-3 border-t border-teal-500/20 space-y-2">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                                {endDate && new Date(endDate).toDateString() !== new Date().toDateString()
                                    ? `Rincian Saldo Per ${new Date(endDate).toLocaleDateString('id-ID')}`
                                    : "Rincian Saldo Sekarang"
                                }
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-text-secondary flex items-center gap-1.5"><Icon name="CreditCard" size={11} /> Saldo Transfer (Bank)</span>
                                <span className="text-xs font-black text-teal-600 font-mono">{formatCurrency(data.metrics.ownerBalance)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-text-secondary flex items-center gap-1.5"><Icon name="Wallet" size={11} /> Saldo Tunai (Lapak)</span>
                                <span className="text-xs font-black text-teal-600 font-mono">{formatCurrency(data.metrics.lapakBalance)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-teal-500/20">
                                <span className="text-xs font-black text-text-primary">Total</span>
                                <span className="text-xs font-black text-teal-500 font-mono">{formatCurrency(data.metrics.physicalCash)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Hasil Audit — Full Width */}
                    <div className={`lg:col-span-3 p-6 rounded-2xl border-2 transition-all shadow-sm ${data.metrics.cashDifference < 0 ? 'bg-red-500/10 border-red-500/30' : data.metrics.cashDifference > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${data.metrics.cashDifference < 0 ? 'bg-red-500/20 text-red-500' : data.metrics.cashDifference > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                    <Icon name={data.metrics.cashDifference === 0 ? 'CheckCircle' : 'AlertTriangle'} size={22} />
                                </div>
                                <div>
                                    <p className={`text-sm font-black uppercase tracking-widest ${data.metrics.cashDifference < 0 ? 'text-red-500' : data.metrics.cashDifference > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>Hasil Audit Kas</p>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Perbandingan Uang Nyata vs Catatan Sistem</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${data.metrics.cashDifference < 0 ? 'bg-red-500/10 text-red-500 border-red-500/30' : data.metrics.cashDifference > 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}>
                                {data.metrics.cashDifference < 0 ? '⚠ Uang Kurang' : data.metrics.cashDifference > 0 ? '↑ Uang Lebih' : '✓ Pas / Akurat'}
                            </span>
                        </div>

                        {/* Nilai Selisih Besar */}
                        <div className="mb-6">
                            <p className={`text-4xl font-mono font-black tracking-tighter ${data.metrics.cashDifference < 0 ? 'text-red-500' : data.metrics.cashDifference > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {data.metrics.cashDifference > 0 ? '+' : ''}{formatCurrency(data.metrics.cashDifference)}
                            </p>
                            <p className="text-sm text-text-secondary mt-1">
                                {data.metrics.cashDifference < 0
                                    ? `Uang yang ada di tangan kurang ${formatCurrency(Math.abs(data.metrics.cashDifference))} dari yang seharusnya ada berdasarkan catatan transaksi.`
                                    : data.metrics.cashDifference > 0
                                        ? `Uang yang ada di tangan lebih ${formatCurrency(data.metrics.cashDifference)} dari catatan sistem. Kemungkinan ada transaksi yang belum tercatat.`
                                        : 'Uang yang ada di tangan sama persis dengan catatan sistem. Audit dinyatakan berhasil.'}
                            </p>
                        </div>

                        {/* Alur Kalkulasi Step by Step */}
                        <div className="mb-5">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3">📊 Alur Kalkulasi (Langkah demi Langkah)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Kolom Kiri: Kas yang Seharusnya Ada */}
                                <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">💡 Kas yang Seharusnya Ada</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">Saldo Awal (Baseline)</span>
                                        <span className="text-xs font-black font-mono text-purple-500">{formatCurrency(data.metrics.periodOpeningBalance)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">+ Pendapatan masuk</span>
                                        <span className="text-xs font-black font-mono text-indigo-500">+{formatCurrency(data.metrics.totalRevenue)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">− Pengeluaran keluar</span>
                                        <span className="text-xs font-black font-mono text-rose-500">-{formatCurrency(data.metrics.totalExpenses)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-border">
                                        <span className="text-xs font-black text-text-primary">= Seharusnya Ada</span>
                                        <span className="text-xs font-black font-mono text-blue-600">{formatCurrency(data.metrics.expectedCash)}</span>
                                    </div>
                                </div>
                                {/* Kolom Kanan: Kas Aktual */}
                                <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">💵 Kas yang Benar-Benar Ada</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">Saldo Transfer (Bank)</span>
                                        <span className="text-xs font-black font-mono text-teal-500">{formatCurrency(data.metrics.ownerBalance)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">+ Saldo Tunai (Lapak)</span>
                                        <span className="text-xs font-black font-mono text-teal-500">+{formatCurrency(data.metrics.lapakBalance)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-border">
                                        <span className="text-xs font-black text-text-primary">= Kas Aktual</span>
                                        <span className="text-xs font-black font-mono text-teal-600">{formatCurrency(data.metrics.physicalCash)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kesimpulan */}
                        <div className={`flex items-start gap-3 p-4 rounded-xl ${data.metrics.cashDifference < 0 ? 'bg-red-500/10' : data.metrics.cashDifference > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                            <Icon name={data.metrics.cashDifference === 0 ? 'CheckCircle' : 'Info'} size={16} className={data.metrics.cashDifference < 0 ? 'text-red-500 mt-0.5 shrink-0' : data.metrics.cashDifference > 0 ? 'text-amber-500 mt-0.5 shrink-0' : 'text-emerald-500 mt-0.5 shrink-0'} />
                            <p className="text-xs text-text-secondary leading-relaxed">
                                <strong>Formula Audit:</strong> Kas Aktual ({formatCurrency(data.metrics.physicalCash)}) − Seharusnya ({formatCurrency(data.metrics.expectedCash)}) = <strong className={data.metrics.cashDifference < 0 ? 'text-red-500' : data.metrics.cashDifference > 0 ? 'text-amber-500' : 'text-emerald-500'}>{formatCurrency(data.metrics.cashDifference)}</strong>.
                                {data.metrics.cashDifference < 0 && ' (Peringatan: Selisih ini mengacu pada uang yang hilang dari catatan, bukan karena penyusutan modal oleh biaya operasional).'}
                                {data.metrics.cashDifference > 0 && ' Kemungkinan ada pemasukan yang belum dicatat di sistem.'}
                                {data.metrics.cashDifference === 0 && ' Semua catatan transaksi sudah sinkron dengan uang fisik yang ada.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Anomalies & Alerts */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-sm font-black text-gray-900 tracking-widest uppercase">Validasi & Anomali Data</h3>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black ${data.anomalies.length === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                            }`}>
                            {data.anomalies.length} Temuan
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {data.anomalies.length > 0 ? (
                            data.anomalies.map((anom, idx) => (
                                <div key={idx} className={`p-6 rounded-2xl border-2 shadow-sm flex items-start gap-4 ${anom.type === 'danger' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                                    }`}>
                                    <div className={`mt-1 ${anom.type === 'danger' ? 'text-rose-500' : 'text-amber-500'}`}>
                                        <Icon name={anom.type === 'danger' ? 'AlertTriangle' : 'Info'} size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 leading-tight mb-1">{anom.title}</h4>
                                        <p className="text-xs text-gray-600 font-medium">{anom.desc}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 bg-white rounded-3xl border-2 border-dashed border-emerald-100 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                    <Icon name="SearchCheck" size={32} />
                                </div>
                                <h4 className="text-lg font-black text-emerald-700 leading-none mb-2">Audit Sempurna!</h4>
                                <p className="text-sm text-emerald-500/80 font-bold uppercase tracking-widest">Tidak ditemukan anomali data pada sistem.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Panduan Investigasi Selisih */}
                <section className={`mb-12 p-8 rounded-3xl border-2 transition-all duration-500 ${Math.abs(data.metrics.cashDifference) > 100
                    ? 'bg-indigo-50 border-indigo-100 shadow-xl shadow-indigo-900/5'
                    : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}>
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${Math.abs(data.metrics.cashDifference) > 100 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            <Icon name="ListChecks" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Panduan Investigasi Selisih</h3>
                            <p className="text-sm text-gray-500 font-medium">Langkah-langkah untuk menemukan penyebab ketidakcocokan data.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">1</div>
                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Arus Kas Fisik</h4>
                            </div>
                            <ul className="text-xs text-gray-600 font-medium space-y-3 list-none">
                                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0"></div> Pastikan saldo di laci kasir benar-benar sesuai dengan angka "Saldo Lapak".</li>
                                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0"></div> Periksa apakah ada uang yang diambil Owner namun belum dicatat di sistem.</li>
                                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0"></div> Verifikasi "Modal Awal" di Pengaturan sudah sesuai dengan kenyataan.</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">2</div>
                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Pencatatan Transaksi</h4>
                            </div>
                            <ul className="text-xs text-gray-600 font-medium space-y-3 list-none">
                                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0"></div> Cek "Riwayat Transaksi", pastikan tidak ada pesanan manual yang lupa diinput.</li>
                                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0"></div> Periksa kemungkinan kesalahan input nominal atau metode pembayaran (Tunai vs QRIS).</li>
                                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0"></div> Cari transaksi yang dibatalkan atau diedit tanpa persetujuan.</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">3</div>
                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Pengeluaran & Belanja</h4>
                            </div>
                            <ul className="text-xs text-gray-600 font-medium space-y-3 list-none">
                                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0"></div> Kumpulkan bon belanja hari ini, pastikan semua sudah masuk di "Catat Pengeluaran".</li>
                                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0"></div> Cek pengeluaran kecil (parkir, tips, bensin) yang sering terlupa dicatat.</li>
                                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0"></div> Pastikan Dana Lapak tidak tercampur dengan uang pribadi karyawan.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Detailed Metrics Reference */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Owner</p>
                        <p className="text-lg font-black text-gray-900">{formatCurrency(data.metrics.ownerBalance)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Lapak</p>
                        <p className="text-lg font-black text-gray-900">{formatCurrency(data.metrics.lapakBalance)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Stok</p>
                        <p className="text-lg font-black text-gray-900">{formatCurrency(data.metrics.stockValue)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Laba Bersih</p>
                        <p className="text-lg font-black text-emerald-500">+{formatCurrency(data.metrics.netProfit)}</p>
                    </div>
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
}
