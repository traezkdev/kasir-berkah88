import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { useTheme } from '../../contexts/ThemeContext';

const AllFeatures = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const allFeatures = [
        // Transaksi & Kasir
        {
            title: 'Proses Penjualan',
            description: 'Buat transaksi baru dengan scanner atau pencarian manual',
            icon: 'ShoppingCart',
            route: '/transaksi',
            color: 'primary',
            category: 'Penjualan'
        },
        {
            title: 'Transaksi Sederhana',
            description: 'Mode kasir cepat untuk layanan pesanan kilat',
            icon: 'Zap',
            route: '/transaksi-sederhana',
            color: 'primary',
            category: 'Penjualan'
        },
        {
            title: 'Konfirmasi Pesanan',
            description: 'Verifikasi dan proses pesanan yang masuk dari pelanggan',
            icon: 'CheckCircle',
            route: '/order-confirmation',
            color: 'primary',
            category: 'Penjualan'
        },
        {
            title: 'Riwayat Transaksi',
            description: 'Pantau dan cari semua data penjualan yang sudah selesai',
            icon: 'History',
            route: '/transaction-history',
            color: 'success',
            category: 'Penjualan'
        },

        // Manajemen Produk & Stok
        {
            title: 'Kelola Menu',
            description: 'Tambah, edit, atau hapus menu dan atur ketersediaan produk',
            icon: 'UtensilsCrossed',
            route: '/menu-management',
            color: 'warning',
            category: 'Produk'
        },
        {
            title: 'Stok Bahan',
            description: 'Manajemen persediaan bahan baku dan stok awal produksi',
            icon: 'Package',
            route: '/raw-material-stock',
            color: 'warning',
            category: 'Produk'
        },
        {
            title: 'Riwayat Stok',
            description: 'Catatan log perubahan stok masuk dan keluar bahan baku',
            icon: 'ClipboardList',
            route: '/raw-material-stock/history',
            color: 'warning',
            category: 'Produk'
        },
        {
            title: 'Stok Kritis',
            description: 'Daftar bahan yang hampir habis dan butuh pengadaan segera',
            icon: 'AlertTriangle',
            route: '/main-critical-stock',
            color: 'destructive',
            category: 'Produk'
        },
        {
            title: 'Kalkulator HPP',
            description: 'Hitung modal bersih per produk untuk tentukan profit',
            icon: 'Calculator',
            route: '/hpp',
            color: 'warning',
            category: 'Produk'
        },

        // Keuangan & Laporan
        {
            title: 'Catat Pengeluaran',
            description: 'Input pengeluaran harian, gaji, belanja bahan, dll',
            icon: 'Receipt',
            route: '/expense-tracking',
            color: 'destructive',
            category: 'Keuangan'
        },
        {
            title: 'Setoran Lapak',
            description: 'Kelola dana setoran dan saldo operasional lapak',
            icon: 'Banknote',
            route: '/lapak-deposit',
            color: 'success',
            category: 'Keuangan'
        },
        {
            title: 'Modal Awal',
            description: 'Atur saldo awal yang disetor untuk modal operasional',
            icon: 'PiggyBank',
            route: '/settings?modal=initialCapital',
            color: 'success',
            category: 'Keuangan'
        },
        {
            title: 'Uang Bisnis',
            description: 'Informasi saldo owner dan saldo kas lapak saat ini',
            icon: 'Wallet',
            route: '/admin-uang-bisnis',
            color: 'success',
            category: 'Keuangan'
        },
        {
            title: 'Rekonsiliasi Kas',
            description: 'Pencocokan saldo sistem dengan uang tunai di laci',
            icon: 'Scale',
            route: '/cash-reconciliation',
            color: 'success',
            category: 'Keuangan'
        },
        {
            title: 'Laporan Bisnis',
            description: 'Ringkasan performa harian, mingguan, dan bulanan',
            icon: 'FileText',
            route: '/laporan',
            color: 'info',
            category: 'Keuangan'
        },
        {
            title: 'Laporan Lengkap',
            description: 'Analisis laba rugi dan performa bisnis secara detail',
            icon: 'BarChart2',
            route: '/laporan-lengkap',
            color: 'info',
            category: 'Keuangan'
        },
        {
            title: 'Analisis Data',
            description: 'Insight visual untuk bantu pengambilan keputusan',
            icon: 'PieChart',
            route: '/analisis-data',
            color: 'info',
            category: 'Keuangan'
        },
        {
            title: 'Sistem Audit',
            description: 'Monitor integritas data dan deteksi anomali keuangan sistem',
            icon: 'SearchCheck',
            route: '/auditor',
            color: 'secondary',
            category: 'Keuangan'
        },
        {
            title: 'Dashboard V2',
            description: 'Visualisasi data statistik dengan antarmuka modern',
            icon: 'LayoutDashboard',
            route: '/dashboard-v2',
            color: 'info',
            category: 'Keuangan'
        },
        {
            title: 'Arsip Sesi',
            description: 'Lihat kembali data sesi kasir yang sudah ditutup',
            icon: 'Archive',
            route: '/admin/archive',
            color: 'secondary',
            category: 'Keuangan'
        },

        // Manajemen & Utilitas
        {
            title: 'Daftar Karyawan',
            description: 'Kelola data karyawan dan akses kontrol sistem',
            icon: 'Users',
            route: '/employee-list',
            color: 'secondary',
            category: 'Admin'
        },
        {
            title: 'Pelanggan',
            description: 'Manajemen data pelanggan, riwayat belanja, dan loyalitas',
            icon: 'User',
            route: '/customer-management',
            color: 'teal',
            category: 'Admin'
        },
        {
            title: 'Kalkulator Cepat',
            description: 'Alat bantu hitung angka secara instan',
            icon: 'Calculator',
            route: '/calculator',
            color: 'secondary',
            category: 'Admin'
        },
        {
            title: 'Catatan',
            description: 'Buku catatan internal untuk memo atau pengingat',
            icon: 'StickyNote',
            route: '/notes',
            color: 'secondary',
            category: 'Admin'
        },
        {
            title: 'Utang Piutang',
            description: 'Sistem pencatatan bon dan piutang pelanggan',
            icon: 'Book',
            route: '/credits',
            color: 'destructive',
            category: 'Admin'
        },
        {
            title: 'AI Assistant',
            description: 'Konsultasi dan tanya jawab dengan BerkahBot AI',
            icon: 'Bot',
            route: '/chatbot',
            color: 'primary',
            category: 'Smart'
        },
        {
            title: 'Chat Pelanggan',
            description: 'Komunikasi langsung dengan pelanggan lewat sistem chat',
            icon: 'MessageCircle',
            route: '/admin/chat',
            color: 'primary',
            category: 'Smart'
        },
        {
            title: 'Poin & Loyalitas',
            description: 'Kelola sistem reward dan poin belanja pelanggan',
            icon: 'Gift',
            route: '/point-loyalty',
            color: 'warning',
            category: 'Admin'
        },
        // Marketing & Konten
        {
            title: 'Kelola Promo',
            description: 'Atur diskon dan penawaran khusus untuk pelanggan',
            icon: 'Ticket',
            route: '/promos',
            color: 'teal',
            category: 'Marketing'
        },
        {
            title: 'Pop-up Banner',
            description: 'Kelola pengumuman pop-up yang muncul di aplikasi',
            icon: 'MonitorPlay',
            route: '/popups',
            color: 'teal',
            category: 'Marketing'
        },
        {
            title: 'Pusat Informasi',
            description: 'Update berita dan informasi terbaru untuk pengguna',
            icon: 'Info',
            route: '/information',
            color: 'teal',
            category: 'Marketing'
        },

        // Toko Online & Seller
        {
            title: 'Dashboard Penjual',
            description: 'Ringkasan penjualan dan performa toko online anda',
            icon: 'Store',
            route: '/seller/dashboard',
            color: 'primary',
            category: 'Toko Online'
        },
        {
            title: 'Manajemen Banner',
            description: 'Atur banner promosi yang tampil di beranda pelanggan',
            icon: 'Image',
            route: '/seller/banners',
            color: 'primary',
            category: 'Toko Online'
        },
        {
            title: 'Katalog Produk',
            description: 'Kelola produk yang tampil khusus di aplikasi pelanggan',
            icon: 'ShoppingBag',
            route: '/seller/menu-management',
            color: 'primary',
            category: 'Toko Online'
        },
        {
            title: 'Kelola Pesanan',
            description: 'Proses pesanan masuk dari pelanggan online secara real-time',
            icon: 'Clock',
            route: '/seller/orders',
            color: 'primary',
            category: 'Toko Online'
        },

        // Pengaturan
        {
            title: 'Profil Saya',
            description: 'Atur biodata, foto profil, dan keamanan akun',
            icon: 'User',
            route: '/profile',
            color: 'slate',
            category: 'Sistem'
        },
        {
            title: 'Pengaturan',
            description: 'Konfigurasi nama toko, logo, pajak, dan lainnya',
            icon: 'Settings',
            route: '/settings',
            color: 'slate',
            category: 'Sistem'
        },
        {
            title: 'Log Aktivitas',
            description: 'Pantau semua aktivitas pengguna dan perubahan data sistem',
            icon: 'Activity',
            route: '/all-logs',
            color: 'slate',
            category: 'Sistem'
        },
        {
            title: 'Database & Backup',
            description: 'Amankan data Anda dengan fitur backup berkala',
            icon: 'Database',
            route: '/settings/database',
            color: 'slate',
            category: 'Sistem'
        },
        {
            title: 'Tong Sampah',
            description: 'Restore data yang tidak sengaja terhapus',
            icon: 'Trash2',
            route: '/transaction-trash',
            color: 'destructive',
            category: 'Sistem'
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
            case 'teal': return 'bg-teal-50 text-teal-600 shadow-teal-100';
            default: return 'bg-gray-50 text-gray-600 shadow-gray-100';
        }
    };

    const categories = Array.from(new Set(allFeatures.map(f => f.category)));
    const filteredFeatures = allFeatures.filter(f =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50' : 'bg-transparent'}`}>
            {theme === 'default' && (
                <NavigationHeader onToggleSidebar={() => { }} headerTitle="Semua Fitur" />
            )}

            <main className={`${theme === 'default' ? 'pt-24 lg:pt-20' : ''} pb-24 lg:pb-12 h-full`}>
                <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-8" : "w-full p-4 lg:p-6"}>

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                        <div className="space-y-2">
                            <BreadcrumbNavigation paths={[{ name: 'Dashboard', path: '/main-dashboard' }, { name: 'Semua Fitur', path: '/all-features' }]} />
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase lg:normal-case">Eksplorasi Fitur</h1>
                            <p className="text-gray-500 font-medium max-w-md">Pusat kendali seluruh modul dan alat bantu kasir Berkah 88 anda dalam satu halaman.</p>
                        </div>

                        <div className="relative w-full md:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <Icon name="Search" size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari fitur atau kategori..."
                                className="w-full bg-white border border-gray-200 py-3 pl-12 pr-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-700 font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Categorized Layout */}
                    <div className="space-y-12">
                        {categories.map(category => {
                            const featuresInCategory = filteredFeatures.filter(f => f.category === category);
                            if (featuresInCategory.length === 0) return null;

                            return (
                                <section key={category} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">{category}</h2>
                                        <div className="h-[1px] bg-gray-200 flex-1"></div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {featuresInCategory.map((feature, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col items-start gap-4 active:scale-[0.98]"
                                                onClick={() => navigate(feature.route)}
                                            >
                                                {/* Hover effect background icon */}
                                                <div className="absolute -right-4 -bottom-4 text-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -rotate-12">
                                                    <Icon name={feature.icon} size={100} />
                                                </div>

                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${getColorClass(feature.color)}`}>
                                                    <Icon name={feature.icon} size={24} />
                                                </div>

                                                <div className="relative z-10">
                                                    <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                                                    <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed opacity-80">{feature.description}</p>
                                                </div>

                                                <div className="mt-auto pt-2 flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    Buka Fitur <Icon name="ArrowRight" size={12} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>

                    {filteredFeatures.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                <Icon name="Layers" size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Fitur tidak ditemukan</h3>
                            <p className="text-gray-500 font-medium">Coba gunakan kata kunci pencarian lain.</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
                            >
                                Reset Pencarian
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AllFeatures;
