import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import MetricsCard from '../main-dashboard/components/MetricsCard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import authFetch from '../../utils/authFetch';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const apiUrl = import.meta.env.VITE_API_URL;

export default function AuditorPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allTransRes, menuRes, expenseRes, settingsRes, ownerAccountRes, lapakAccountRes, rawMaterialsRes, unitsRes] = await Promise.all([
                authFetch(`${apiUrl}/api/transactions/all`),
                authFetch(`${apiUrl}/api/menu-items/all`),
                authFetch(`${apiUrl}/api/expenses/all`),
                authFetch(`${apiUrl}/api/all-settings`),
                authFetch(`${apiUrl}/api/accounts/owner_deposit`),
                authFetch(`${apiUrl}/api/accounts/lapak_deposit`),
                authFetch(`${apiUrl}/api/raw-materials`),
                authFetch(`${apiUrl}/api/units`)
            ]);

            const [
                allTransactions,
                menuItems,
                expenses,
                settings,
                ownerAccount,
                lapakAccount,
                rawMaterials,
                units
            ] = await Promise.all([
                allTransRes.json(),
                menuRes.json(),
                expenseRes.json(),
                settingsRes.json(),
                ownerAccountRes.json(),
                lapakAccountRes.json(),
                rawMaterialsRes.json(),
                unitsRes.json()
            ]);

            processAuditData({
                transactions: allTransactions.data || [],
                menuItems: menuItems.data || [],
                expenses: expenses.data || [],
                settings: settings.data || {},
                ownerBalance: ownerAccount.data?.account?.balance || 0,
                lapakBalance: lapakAccount.data?.account?.balance || 0,
                rawMaterials: rawMaterials.data || [],
                units: units.data || []
            });
        } catch (error) {
            console.error("Audit fetch error:", error);
            toast.error("Gagal memuat data audit");
        } finally {
            setLoading(false);
        }
    };

    const processAuditData = (raw) => {
        const initialCapital = parseFloat(raw.settings.initial_capital) || 0;

        // Revenue logic (exclude employee meals and non-monetary)
        const totalRevenue = raw.transactions
            .filter(t => t.payment_method !== 'employee_meal')
            .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

        const totalExpenses = raw.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        // Expected Cash Formula
        const expectedCash = initialCapital + totalRevenue - totalExpenses;

        // Physical Cash (Bank + Cash)
        const physicalCash = parseFloat(raw.ownerBalance) + parseFloat(raw.lapakBalance);

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
        const targetEquity = initialCapital + netProfit;
        const currentEquity = physicalCash + stockValue;
        const equityDifference = currentEquity - targetEquity;

        // Anomalies
        const anomalies = [];
        if (Math.abs(cashDifference) > 1000) {
            anomalies.push({
                title: "Selisih Uang Signifikan",
                desc: `Terdapat selisih Rp ${formatNumber(Math.abs(cashDifference))} antara uang fisik dan catatan.`,
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
                initialCapital,
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
                ownerBalance: raw.ownerBalance,
                lapakBalance: raw.lapakBalance
            },
            anomalies
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatNumber = (num) => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const formatCurrency = (num) => {
        return 'Rp ' + formatNumber(num);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-gray-500 animate-pulse">Menghitung Audit Sistem...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50' : 'bg-transparent'} pb-20`}>
            {theme === 'default' && <NavigationHeader headerTitle="Sistem Audit" />}

            <main className={`max-w-7xl mx-auto ${theme === 'default' ? 'px-4 lg:px-6 pt-28 lg:pt-24 pb-12' : 'p-0'}`}>
                <BreadcrumbNavigation customPath={[{ label: 'Audit', path: '/auditor', isActive: true }]} />

                <header className="mb-8 mt-4">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2">Pusat Audit Data</h1>
                    <p className="text-gray-500 font-medium">Laporan transparansi keuangan dan validasi akurasi sistem.</p>
                </header>

                {/* Audit Status Bar */}
                <div className={`mb-8 p-6 rounded-[2rem] border-2 flex flex-col md:flex-row items-center justify-between gap-6 ${Math.abs(data.metrics.cashDifference) <= 100
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-rose-50 border-rose-100'
                    }`}>
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${Math.abs(data.metrics.cashDifference) <= 100 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            } shadow-lg shadow-current/20`}>
                            <Icon name={Math.abs(data.metrics.cashDifference) <= 100 ? 'CheckCircle' : 'AlertCircle'} size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Status Integritas Data</h2>
                            <p className={`font-bold ${Math.abs(data.metrics.cashDifference) <= 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {Math.abs(data.metrics.cashDifference) <= 100
                                    ? 'Sangat Akurat: Catatan sistem sesuai dengan uang fisik.'
                                    : `Ditemukan Selisih: Rp ${formatNumber(data.metrics.cashDifference)}`
                                }
                            </p>
                        </div>
                    </div>
                    <Button onClick={fetchData} variant="outline" iconName="RefreshCw">Refresh Data</Button>
                </div>

                {/* Main Audit Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Section 1: Cash Reconciliation */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Icon name="Wallet" size={24} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Rekonsiliasi Kas (Uang)</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                <span className="text-sm font-bold text-gray-500">Uang Fisik (Lapak + Owner)</span>
                                <span className="text-lg font-black text-gray-900">{formatCurrency(data.metrics.physicalCash)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                <span className="text-sm font-bold text-gray-500">Estimasi Sistem (Target)</span>
                                <span className="text-lg font-black text-blue-600">{formatCurrency(data.metrics.expectedCash)}</span>
                            </div>
                            <div className="h-[2px] bg-gray-100 mx-4"></div>
                            <div className={`flex justify-between items-center p-4 rounded-2xl ${data.metrics.cashDifference >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
                                }`}>
                                <span className="text-sm font-black uppercase tracking-widest">Selisih Kas</span>
                                <span className={`text-xl font-black ${data.metrics.cashDifference >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                    }`}>
                                    {data.metrics.cashDifference > 0 ? '+' : ''}{formatCurrency(data.metrics.cashDifference)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Breakdown Target Kas</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Modal Awal</p>
                                    <p className="text-xs font-black text-gray-900">{formatCurrency(data.metrics.initialCapital)}</p>
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Penjualan</p>
                                    <p className="text-xs font-black text-emerald-600">+{formatCurrency(data.metrics.totalRevenue)}</p>
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] font-bold text-rose-400 uppercase mb-1">Pengeluaran</p>
                                    <p className="text-xs font-black text-rose-600">-{formatCurrency(data.metrics.totalExpenses)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Business Wealth (Equity) */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <Icon name="ShieldCheck" size={24} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Kekayaan Bisnis (Equity)</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                <span className="text-sm font-bold text-gray-500">Nilai Aset (Kas + Stok)</span>
                                <span className="text-lg font-black text-gray-900">{formatCurrency(data.metrics.currentEquity)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                <span className="text-sm font-bold text-gray-500">Target Kekayaan (Sistem)</span>
                                <span className="text-lg font-black text-purple-600">{formatCurrency(data.metrics.targetEquity)}</span>
                            </div>
                            <div className="h-[2px] bg-gray-100 mx-4"></div>
                            <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-2xl">
                                <span className="text-sm font-black uppercase tracking-widest">Kesehatan Bisnis</span>
                                <span className="text-xl font-black text-indigo-600">
                                    {((data.metrics.currentEquity / data.metrics.targetEquity) * 100).toFixed(1)}% <span className="text-xs">Sesuai</span>
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Metode Perhitungan</h4>
                            <p className="text-[11px] text-gray-500 font-medium italic">
                                Kekayaan real saat ini adalah total uang fisik di semua akun ditambah dengan nilai stok barang yang ada di gudang. Dibandingkan dengan modal awal ditambah keuntungan/kerugian bersih.
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
                                <div key={idx} className={`p-6 rounded-[2rem] border-2 shadow-sm flex items-start gap-4 ${anom.type === 'danger' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
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
                            <div className="col-span-full py-12 bg-white rounded-[2.5rem] border-2 border-dashed border-emerald-100 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                    <Icon name="SearchCheck" size={32} />
                                </div>
                                <h4 className="text-lg font-black text-emerald-700 leading-none mb-2">Audit Sempurna!</h4>
                                <p className="text-sm text-emerald-500/80 font-bold uppercase tracking-widest">Tidak ditemukan anomali data pada sistem.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Detailed Metrics Reference */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Owner</p>
                        <p className="text-lg font-black text-gray-900">{formatCurrency(data.metrics.ownerBalance)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Lapak</p>
                        <p className="text-lg font-black text-gray-900">{formatCurrency(data.metrics.lapakBalance)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Stok</p>
                        <p className="text-lg font-black text-gray-900">{formatCurrency(data.metrics.stockValue)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Laba Bersih</p>
                        <p className="text-lg font-black text-emerald-500">+{formatCurrency(data.metrics.netProfit)}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
