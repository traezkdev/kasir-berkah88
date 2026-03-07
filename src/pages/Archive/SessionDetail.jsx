import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import { useNavigate, useParams } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import AppIcon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastNotification';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';

const apiUrl = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 20;

const SessionDetail = () => {
    const { theme, toggleSidebar } = useTheme();
    const { id } = useParams();
    const [session, setSession] = useState(null);
    const [archivedData, setArchivedData] = useState([]);
    const [activeTab, setActiveTab] = useState('transactions');
    const [isLoading, setIsLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchSession();
    }, [id]);

    useEffect(() => {
        if (session) {
            fetchArchivedData(activeTab);
        }
    }, [activeTab, session]);

    /* Reset ke halaman 1 setiap data baru dimuat */
    useEffect(() => {
        setCurrentPage(1);
    }, [archivedData]);

    const fetchSession = async () => {
        setIsLoading(true);
        try {
            const resp = await authFetch(`${apiUrl}/api/archive/sessions/${id}`);
            const data = await resp.json();
            if (resp.ok) {
                setSession(data.data);
            } else {
                showToast(data.error || 'Sesi tidak ditemukan', 'error');
                navigate('/admin/archive');
            }
        } catch (err) {
            showToast('Kesalahan jaringan', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchArchivedData = async (type) => {
        setIsDataLoading(true);
        try {
            const resp = await authFetch(`${apiUrl}/api/archive/sessions/${id}/data/${type}`);
            const data = await resp.json();
            if (resp.ok) {
                setArchivedData(data.data);
            } else {
                showToast(data.error || 'Gagal mengambil data arsip', 'error');
            }
        } catch (err) {
            showToast('Kesalahan jaringan', 'error');
        } finally {
            setIsDataLoading(false);
        }
    };

    /* ---- Kalkulasi paginasi ---- */
    const totalPages = Math.ceil(archivedData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = archivedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const breadcrumbs = [
        { name: 'Beranda', path: '/main-dashboard' },
        { name: 'Pengaturan', path: '/settings' },
        { name: 'Arsip Data', path: '/admin/archive' },
        { name: `Sesi #${id}`, path: `/admin/archive/${id}` }
    ];

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const tabs = [
        { id: 'transactions', label: 'Penjualan', icon: 'ShoppingBag' },
        { id: 'expenses', label: 'Pengeluaran', icon: 'Wallet' },
        { id: 'orders', label: 'Pesanan', icon: 'ClipboardList' },
        { id: 'account_transactions', label: 'Mutasi Kas', icon: 'Repeat' },
        { id: 'credits', label: 'Kasbon', icon: 'UserX' }
    ];

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50' : ''}`}>
            {theme === 'default' && (
                <NavigationHeader onToggleSidebar={toggleSidebar} headerTitle={`Detail Arsip Sesi #${id}`} />
            )}

            <main className={`${theme === 'default' ? 'pt-20 pb-24 px-4 lg:px-8' : 'pt-2 pb-12'}`}>
                <div className={`${theme === 'default' ? 'max-w-7xl mx-auto' : 'w-full'} space-y-8`}>
                    <div className="hidden md:block">
                        <BreadcrumbNavigation paths={breadcrumbs} />
                    </div>

                    {/* Header Summary Card */}
                    <div className="bg-card rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                        <AppIcon name="Archive" size={28} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black text-text-primary tracking-tight">RINGKASAN SESI #{id}</h1>
                                        <p className="text-sm font-bold text-text-secondary opacity-60 uppercase tracking-widest">
                                            Ditutup oleh {session.closed_by_username} pada {new Date(session.timestamp).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>

                                {session.notes && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">Catatan:</p>
                                        <p className="text-sm text-text-primary">{session.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1 opacity-60">Total Omzet</p>
                                    <p className="text-xl font-black text-green-600">{formatCurrency(session.total_sales)}</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1 opacity-60">Total Biaya</p>
                                    <p className="text-xl font-black text-red-500">{formatCurrency(session.total_expenses)}</p>
                                </div>
                                <div className="text-center md:text-left col-span-2 lg:col-span-1">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1 opacity-60">Laba Bersih</p>
                                    <p className="text-xl font-black text-blue-600">{formatCurrency(session.total_profit)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Control */}
                    <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                   flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap
                   ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-card text-text-secondary border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }
                 `}
                            >
                                <AppIcon name={tab.icon} size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Data Table */}
                    <div className="bg-card rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden min-h-[400px]">
                        {isDataLoading ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : archivedData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-96 text-center space-y-4 opacity-40">
                                <AppIcon name="Inbox" size={48} />
                                <p className="text-sm font-bold uppercase tracking-widest">Tidak ada data untuk kategori ini</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                                            <tr>
                                                {activeTab === 'transactions' && (
                                                    <>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Waktu</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">ID</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Pembayaran</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Total</th>
                                                    </>
                                                )}
                                                {activeTab === 'expenses' && (
                                                    <>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Tanggal</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Nama</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Kategori</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Jumlah</th>
                                                    </>
                                                )}
                                                {activeTab === 'orders' && (
                                                    <>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Waktu</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Status</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Total</th>
                                                    </>
                                                )}
                                                {activeTab === 'account_transactions' && (
                                                    <>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Waktu</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Tipe</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Keterangan</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Jumlah</th>
                                                    </>
                                                )}
                                                {activeTab === 'credits' && (
                                                    <>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Tanggal</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Karyawan</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Status</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Jumlah</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {paginatedData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    {activeTab === 'transactions' && (
                                                        <>
                                                            <td className="px-6 py-4 text-xs text-text-secondary">{new Date(row.timestamp).toLocaleTimeString('id-ID')}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-text-primary">#{row.id}</td>
                                                            <td className="px-6 py-4 text-xs">
                                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">{row.payment_method}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-black text-right">{formatCurrency(row.total)}</td>
                                                        </>
                                                    )}
                                                    {activeTab === 'expenses' && (
                                                        <>
                                                            <td className="px-6 py-4 text-xs text-text-secondary">{new Date(row.date).toLocaleDateString('id-ID')}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-text-primary">{row.name}</td>
                                                            <td className="px-6 py-4 text-xs">
                                                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">{row.category}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-black text-right text-red-500">{formatCurrency(row.amount)}</td>
                                                        </>
                                                    )}
                                                    {activeTab === 'orders' && (
                                                        <>
                                                            <td className="px-6 py-4 text-xs text-text-secondary">{new Date(row.created_at).toLocaleString('id-ID')}</td>
                                                            <td className="px-6 py-4 text-xs">
                                                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">{row.status}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-black text-right">{formatCurrency(row.total_amount)}</td>
                                                        </>
                                                    )}
                                                    {activeTab === 'account_transactions' && (
                                                        <>
                                                            <td className="px-6 py-4 text-xs text-text-secondary">{new Date(row.created_at).toLocaleTimeString('id-ID')}</td>
                                                            <td className="px-6 py-4 text-xs">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${row.type === 'deposit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{row.type}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-text-secondary italic">"{row.description}"</td>
                                                            <td className="px-6 py-4 text-xs font-black text-right">{formatCurrency(row.amount)}</td>
                                                        </>
                                                    )}
                                                    {activeTab === 'credits' && (
                                                        <>
                                                            <td className="px-6 py-4 text-xs text-text-secondary">{new Date(row.credit_date).toLocaleDateString('id-ID')}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-text-primary">{row.employee_name}</td>
                                                            <td className="px-6 py-4 text-xs">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${row.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{row.status}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-black text-right text-red-500">{formatCurrency(row.amount)}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ---- Kontrol Paginasi ---- */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
                                        {/* Info jumlah data */}
                                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest opacity-60">
                                            Menampilkan {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, archivedData.length)} dari {archivedData.length} data
                                        </p>

                                        {/* Tombol navigasi */}
                                        <div className="flex items-center gap-1">
                                            {/* Prev */}
                                            <button
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 dark:border-slate-700 bg-card text-text-secondary hover:border-blue-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                                                aria-label="Halaman sebelumnya"
                                            >
                                                <AppIcon name="ChevronLeft" size={16} />
                                            </button>

                                            {/* Nomor halaman */}
                                            {getPageNumbers().map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    aria-label={`Halaman ${page}`}
                                                    aria-current={page === currentPage ? 'page' : undefined}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black border transition-all duration-200 ${page === currentPage
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25'
                                                            : 'border-gray-200 dark:border-slate-700 bg-card text-text-secondary hover:border-blue-500 hover:text-blue-600'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}

                                            {/* Next */}
                                            <button
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 dark:border-slate-700 bg-card text-text-secondary hover:border-blue-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                                                aria-label="Halaman berikutnya"
                                            >
                                                <AppIcon name="ChevronRight" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center">
                        <Button variant="ghost" onClick={() => navigate('/admin/archive')}>
                            <AppIcon name="ArrowLeft" className="mr-2" size={18} /> Kembali ke Daftar Arsip
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SessionDetail;
