import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import AppIcon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastNotification';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';

const apiUrl = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 20;

/* ------------------------------------------------------------------ */
/*  Modal Konfirmasi Hapus                                              */
/* ------------------------------------------------------------------ */
const DeleteConfirmModal = ({ session, onConfirm, onCancel, isDeleting }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-card w-full max-w-sm rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Header merah */}
            <div className="relative bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <AppIcon name="Trash2" size={22} />
                    </div>
                    <div>
                        <h2 className="text-base font-black tracking-tight">Hapus Arsip Permanen</h2>
                        <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Sesi #{session.id}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {/* Peringatan */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-wide">⚠ Tindakan ini tidak dapat dibatalkan!</p>
                    <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                        Semua data dalam sesi ini (transaksi, pengeluaran, pesanan, mutasi kas, dll.) akan dihapus <strong>secara permanen</strong> dari database.
                    </p>
                </div>

                {/* Info sesi */}
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Tanggal</span>
                        <span className="text-xs font-bold text-text-primary">
                            {new Date(session.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Ditutup oleh</span>
                        <span className="text-xs font-bold text-text-primary">{session.closed_by_username || 'Admin'}</span>
                    </div>
                </div>

                {/* Tombol */}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-text-secondary text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <AppIcon name="Trash2" size={14} />
                        )}
                        {isDeleting ? 'Menghapus...' : 'Hapus Permanen'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Sub-komponen grid + pagination                                       */
/* ------------------------------------------------------------------ */
const ArchiveGrid = ({ sessions, navigate, formatCurrency, onDelete }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null); // session object
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

    const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedSessions = sessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const resp = await authFetch(`${apiUrl}/api/archive/sessions/${deleteTarget.id}`, { method: 'DELETE' });
            const data = await resp.json();
            if (resp.ok) {
                showToast(data.message, 'success');
                setDeleteTarget(null);
                onDelete(); // refresh list dari parent
            } else {
                showToast(data.error || 'Gagal menghapus arsip', 'error');
            }
        } catch {
            showToast('Kesalahan jaringan', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Modal konfirmasi hapus */}
            {deleteTarget && (
                <DeleteConfirmModal
                    session={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    isDeleting={isDeleting}
                />
            )}

            {/* ---- Grid Kartu Sesi ---- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedSessions.map((session) => (
                    <div
                        key={session.id}
                        onClick={() => navigate(`/admin/archive/${session.id}`)}
                        className="group relative bg-card rounded-2xl p-6 border border-gray-100 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden"
                    >
                        {/* Background Gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <AppIcon name="Calendar" size={24} />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full uppercase tracking-widest">Sesi #{session.id}</span>
                                    <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase opacity-60">
                                        {new Date(session.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 py-2">
                                <div>
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1 opacity-60">Total Omzet</p>
                                    <h3 className="text-xl font-black text-green-600 dark:text-green-400 tracking-tight">{formatCurrency(session.total_sales)}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1 opacity-60">Pengeluaran</p>
                                        <p className="text-sm font-bold text-red-500">{formatCurrency(session.total_expenses)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1 opacity-60">Laba Bersih</p>
                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(session.total_profit)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer card: user + tombol hapus */}
                            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                                        <AppIcon name="User" size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold text-text-secondary">{session.closed_by_username || 'Admin'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Tombol Hapus */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // jangan navigasi ke detail
                                            setDeleteTarget(session);
                                        }}
                                        title="Hapus arsip ini"
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    >
                                        <AppIcon name="Trash2" size={14} />
                                    </button>

                                    <AppIcon name="ChevronRight" size={16} className="text-blue-500 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ---- Kontrol Paginasi ---- */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest opacity-60">
                        Menampilkan {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, sessions.length)} dari {sessions.length} sesi
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 dark:border-slate-700 bg-card text-text-secondary hover:border-blue-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                            aria-label="Halaman sebelumnya"
                        >
                            <AppIcon name="ChevronLeft" size={16} />
                        </button>

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
    );
};

/* ------------------------------------------------------------------ */
/*  Komponen utama halaman Archive                                       */
/* ------------------------------------------------------------------ */
const Archive = () => {
    const { theme, toggleSidebar } = useTheme();
    const { websiteTitle } = useAppSettings();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const resp = await authFetch(`${apiUrl}/api/archive/sessions`);
            const data = await resp.json();
            if (resp.ok) {
                setSessions(data.data);
            } else {
                showToast(data.error || 'Gagal mengambil data arsip', 'error');
            }
        } catch (err) {
            showToast('Kesalahan jaringan', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const breadcrumbs = [
        { name: 'Beranda', path: '/main-dashboard' },
        { name: 'Pengaturan', path: '/settings' },
        { name: 'Arsip Data', path: '/admin/archive' }
    ];

    const formatCurrency = (val) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50' : ''}`}>
            {theme === 'default' && (
                <NavigationHeader onToggleSidebar={toggleSidebar} headerTitle="Arsip Data Tutup Buku" />
            )}

            <main className={`${theme === 'default' ? 'pt-20 pb-24 px-4 lg:px-8' : 'pt-2 pb-12'}`}>
                <div className={`${theme === 'default' ? 'max-w-7xl mx-auto' : 'w-full'} space-y-6`}>
                    <div className="hidden md:block">
                        <BreadcrumbNavigation paths={breadcrumbs} />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-text-primary tracking-tighter uppercase">RIWAYAT TUTUP BUKU</h1>
                            <p className="text-sm text-text-secondary font-bold uppercase tracking-widest opacity-60">Daftar sesi yang telah diarsipkan</p>
                        </div>
                        <Button variant="ghost" className="self-start" onClick={() => navigate('/settings')}>
                            <AppIcon name="ArrowLeft" className="mr-2" size={18} /> Kembali ke Pengaturan
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400">
                                <AppIcon name="Archive" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Belum Ada Arsip</h3>
                            <p className="text-sm text-text-secondary max-w-sm">
                                Data transaksi Anda akan muncul di sini setelah Anda melakukan proses Tutup Buku di halaman Pengaturan.
                            </p>
                            <Button onClick={() => navigate('/settings')}>Ke Pengaturan</Button>
                        </div>
                    ) : (
                        <ArchiveGrid
                            sessions={sessions}
                            navigate={navigate}
                            formatCurrency={formatCurrency}
                            onDelete={fetchSessions}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Archive;
