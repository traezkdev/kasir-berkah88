import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { useTheme } from '../../contexts/ThemeContext';

const AllFeatures = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const allFeatures = [
        // Transaksi & Kasir
        {
            title: 'Proses Penjualan',
            description: 'Buat transaksi baru',
            icon: 'ShoppingCart',
            route: '/transaksi',
            color: 'primary',
            category: 'Utama'
        },
        {
            title: 'Transaksi Sederhana',
            description: 'Kasir mode cepat',
            icon: 'Zap',
            route: '/transaksi-sederhana',
            color: 'primary',
            category: 'Utama'
        },
        {
            title: 'Riwayat Transaksi',
            description: 'Lihat data penjualan',
            icon: 'History',
            route: '/transaction-history',
            color: 'success',
            category: 'Utama'
        },

        // Manajemen Produk & Stok
        {
            title: 'Kelola Menu',
            description: 'Atur daftar produk',
            icon: 'UtensilsCrossed',
            route: '/menu-management',
            color: 'warning',
            category: 'Produk'
        },
        {
            title: 'Stok Bahan',
            description: 'Inventory bahan baku',
            icon: 'Package',
            route: '/raw-material-stock',
            color: 'warning',
            category: 'Produk'
        },
        {
            title: 'Stok Kritis',
            description: 'Peringatan stok menipis',
            icon: 'AlertTriangle',
            route: '/main-critical-stock',
            color: 'destructive',
            category: 'Produk'
        },
        {
            title: 'Kalkulator HPP',
            description: 'Hitung modal produk',
            icon: 'Calculator',
            route: '/hpp',
            color: 'warning',
            category: 'Produk'
        },

        // Keuangan & Laporan
        {
            title: 'Catat Pengeluaran',
            description: 'Input biaya operasional',
            icon: 'Receipt',
            route: '/expense-tracking',
            color: 'destructive',
            category: 'Keuangan'
        },
        {
            title: 'Uang Bisnis',
            description: 'Kelola kas & modal',
            icon: 'Wallet',
            route: '/admin-uang-bisnis',
            color: 'success',
            category: 'Keuangan'
        },
        {
            title: 'Rekonsiliasi Kas',
            description: 'Cocokkan data fisik',
            icon: 'Scale', // Or ClipboardCheck
            route: '/cash-reconciliation',
            color: 'success',
            category: 'Keuangan'
        },
        {
            title: 'Laporan Bisnis',
            description: 'Ringkasan performa',
            icon: 'FileText',
            route: '/laporan',
            color: 'info',
            category: 'Keuangan'
        },
        {
            title: 'Laporan Lengkap',
            description: 'Analisis detail',
            icon: 'BarChart2',
            route: '/laporan-lengkap',
            color: 'info',
            category: 'Keuangan'
        },
        {
            title: 'Analisis Data',
            description: 'Insight mendalam',
            icon: 'PieChart',
            route: '/analisis-data',
            color: 'info',
            category: 'Keuangan'
        },
        {
            title: 'Dashboard Statistik',
            description: 'Visualisasi data V2',
            icon: 'LayoutDashboard',
            route: '/dashboard-v2',
            color: 'info',
            category: 'Keuangan'
        },

        // Manajemen & Utilitas
        {
            title: 'Daftar Karyawan',
            description: 'Data staf & gaji',
            icon: 'Users',
            route: '/employee-list',
            color: 'secondary',
            category: 'Manajemen'
        },
        {
            title: 'Catatan',
            description: 'Buat catatan kecil',
            icon: 'StickyNote',
            route: '/notes',
            color: 'secondary',
            category: 'Manajemen'
        },
        {
            title: 'Utang Piutang',
            description: 'Catat bon pelanggan',
            icon: 'Book',
            route: '/credits',
            color: 'destructive',
            category: 'Manajemen'
        },
        {
            title: 'Kalkulator',
            description: 'Alat hitung cepat',
            icon: 'Divide', // Or Calculator
            route: '/calculator',
            color: 'secondary',
            category: 'Manajemen'
        },
        {
            title: 'Cetak Struk',
            description: 'Reprint struk transaksi',
            icon: 'Printer',
            route: '/receipt',
            color: 'secondary',
            category: 'Manajemen'
        },
        {
            title: 'AI Assistant',
            description: 'Tanya BerkahBot',
            icon: 'Bot',
            route: '/chatbot',
            color: 'primary',
            category: 'Manajemen'
        },

        // Pengaturan
        {
            title: 'Pengaturan',
            description: 'Konfigurasi sistem',
            icon: 'Settings',
            route: '/settings',
            color: 'slate',
            category: 'System'
        },
        {
            title: 'Database',
            description: 'Backup & Restore',
            icon: 'Database',
            route: '/settings/database',
            color: 'slate',
            category: 'System'
        },
        {
            title: 'Tong Sampah',
            description: 'Data terhapus',
            icon: 'Trash2',
            route: '/transaction-trash',
            color: 'destructive',
            category: 'System'
        },
    ];

    const getColorClass = (color) => {
        switch (color) {
            case 'primary': return 'bg-blue-50 text-blue-600 shadow-blue-100';
            case 'success': return 'bg-emerald-50 text-emerald-600 shadow-emerald-100';
            case 'warning': return 'bg-amber-50 text-amber-600 shadow-amber-100';
            case 'destructive': return 'bg-rose-50 text-rose-600 shadow-rose-100';
            case 'info': return 'bg-cyan-50 text-cyan-600 shadow-cyan-100';
            case 'secondary': return 'bg-purple-50 text-purple-600 shadow-purple-100';
            case 'slate': return 'bg-slate-100 text-slate-600 shadow-slate-200';
            case 'accent': return 'bg-indigo-50 text-indigo-600 shadow-indigo-100';
            default: return 'bg-gray-50 text-gray-600 shadow-gray-100';
        }
    };

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50' : 'bg-transparent'}`}>
            {theme === 'default' && (
                <NavigationHeader onToggleSidebar={() => { }} headerTitle="Semua Layanan" />
            )}

            <main className={`${theme === 'default' ? 'pt-20 lg:pt-16' : ''} pb-24 lg:pb-8`}>
                <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 pt-8 space-y-8" : "space-y-6"}>

                    <div className="mb-6 hidden md:block">
                        <BreadcrumbNavigation paths={[{ name: 'Beranda', path: '/main-dashboard' }, { name: 'Semua Layanan', path: '/all-features' }]} />
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Semua Fitur Kasir</h1>
                        <p className="text-sm text-gray-500 font-medium mt-2">Akses cepat ke seluruh layanan aplikasi</p>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-8">
                        {allFeatures.map((feature, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col items-center gap-3 group cursor-pointer"
                                onClick={() => navigate(feature.route)}
                            >
                                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.2rem] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-active:scale-95 shadow-xl shadow-current/5 border border-white/50 ${getColorClass(feature.color)}`}>
                                    <Icon name={feature.icon} size={28} />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-gray-600 text-center leading-tight max-w-[80px]">
                                    {feature.title}
                                </span>
                            </div>
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AllFeatures;
