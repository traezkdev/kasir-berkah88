
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Pagination from '../../components/ui/Pagination';
import authFetch from '../../utils/authFetch';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../../components/AppIcon';
import AdminMobileHeader from '../../components/ui/AdminMobileHeader';

const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
};

const getActionStyles = (action) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('hapus') || act.includes('delete') || act.includes('reset')) {
        return {
            bg: 'bg-rose-100 dark:bg-rose-500/20',
            text: 'text-rose-600 dark:text-rose-400',
            icon: 'Trash2',
            color: 'error'
        };
    }
    if (act.includes('tambah') || act.includes('add') || act.includes('membuat') || act.includes('masuk') || act.includes('login')) {
        return {
            bg: 'bg-emerald-100 dark:bg-emerald-500/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            icon: 'PlusCircle',
            color: 'success'
        };
    }
    if (act.includes('edit') || act.includes('update') || act.includes('sunting') || act.includes('ubah')) {
        return {
            bg: 'bg-amber-100 dark:bg-amber-500/20',
            text: 'text-amber-600 dark:text-amber-400',
            icon: 'Edit3',
            color: 'warning'
        };
    }
    return {
        bg: 'bg-blue-100 dark:bg-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'Activity',
        color: 'primary'
    };
};

const getTargetIcon = (targetType) => {
    switch (targetType?.toLowerCase()) {
        case 'transaction': return 'Receipt';
        case 'expense': return 'CreditCard';
        case 'note': return 'FileText';
        case 'user': return 'User';
        case 'menu_item': return 'Utensils';
        case 'raw_material': return 'Box';
        case 'unit': return 'Ruler';
        case 'recipe': return 'BookOpen';
        case 'system': return 'Settings';
        case 'order': return 'ShoppingCart';
        case 'notification': return 'Bell';
        default: return 'Target';
    }
};

const LogItem = React.memo(({ log, theme }) => {
    const styles = useMemo(() => getActionStyles(log.action), [log.action]);
    const targetIcon = useMemo(() => getTargetIcon(log.target_type), [log.target_type]);

    return (
        <div className="group relative">
            {/* Desktop View Row */}
            <div className="hidden md:grid md:grid-cols-[1.2fr,1.2fr,1fr,0.8fr,2fr] items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {formatDateTime(log.created_at).split(',')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {formatDateTime(log.created_at).split(',')[1]}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 ${log.role === 'admin' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' :
                        log.role === 'owner' ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white' :
                            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                        {log.username ? log.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{log.username || 'System'}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${log.role === 'admin' ? 'text-blue-500' :
                            log.role === 'owner' ? 'text-purple-500' :
                                'text-slate-400'
                            }`}>{log.role || 'System'}</span>
                    </div>
                </div>

                <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles.bg} ${styles.text}`}>
                        <Icon name={styles.icon} size={14} strokeWidth={2.5} />
                        {log.action}
                    </span>
                </div>

                <div className="flex items-center gap-2 opacity-60">
                    <Icon name={targetIcon} size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                        {log.target_type || '-'}
                    </span>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 group-hover:line-clamp-none transition-all duration-300" title={log.details}>
                    {log.details || '-'}
                </div>
            </div>

            {/* Mobile View Card */}
            <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm ${log.role === 'admin' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' :
                            log.role === 'owner' ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white' :
                                'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                            {log.username ? log.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold dark:text-slate-100">{log.username || 'System'}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{log.role || 'System'}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {formatDateTime(log.created_at).split(',')[0]}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 italic">
                            {formatDateTime(log.created_at).split(',')[1]}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles.bg} ${styles.text}`}>
                        <Icon name={styles.icon} size={12} strokeWidth={3} />
                        {log.action}
                    </span>
                    {log.target_type && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Icon name={targetIcon} size={12} />
                            {log.target_type}
                        </span>
                    )}
                </div>

                <div className="relative pl-3 border-l-2 border-slate-200 dark:border-slate-700 py-1">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium capitalize">
                        {log.details || '-'}
                    </p>
                </div>
            </div>
        </div>
    );
});

const AllLogs = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        action: '',
        targetType: '',
        startDate: '',
        endDate: ''
    });

    const fetchLogs = useCallback(async (page = 1, showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const params = new URLSearchParams({
                page,
                limit: 20,
                ...filters
            });
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/activity-logs?${params.toString()}`);
            const result = await response.json();
            if (result.message === 'success') {
                setLogs(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage, fetchLogs]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            action: '',
            targetType: '',
            startDate: '',
            endDate: ''
        });
        setCurrentPage(1);
    };

    return (
        <div className={`min-h-screen ${theme === 'admin' ? 'bg-slate-50 dark:bg-slate-950' : 'bg-background'} pb-24 overflow-x-hidden`}>
            {/* Mobile Header */}
            <div className="block lg:hidden">
                <AdminMobileHeader
                    title="Log Aktivitas"
                    subtitle="Monitoring Sistem"
                    badgeText="Real-time"
                    decorativeIcon="Activity"
                    stickyTitle="Aktivitas Sistem"
                    actions={[
                        {
                            label: "Refresh",
                            icon: "RefreshCw",
                            color: "primary",
                            onClick: () => fetchLogs(currentPage, true)
                        },
                        {
                            label: "Reset",
                            icon: "RotateCcw",
                            color: "warning",
                            onClick: clearFilters
                        }
                    ]}
                />
            </div>

            {/* Navigation Header (Provides Bottom Bar on Mobile) */}
            <div className={theme === 'admin' ? 'lg:hidden' : ''}>
                <NavigationHeader
                    title="Semua Log Aktivitas"
                    hideMobileHeader={true}
                />
            </div>

            <div className={`${theme === 'admin' ? 'w-full px-4 lg:px-8 mt-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 lg:mt-6'}`}>
                <div className="hidden lg:block">
                    <BreadcrumbNavigation
                        title="Database Activity Insights"
                        items={[
                            { label: 'Dashboard', href: theme === 'admin' ? '/main-dashboard' : '/owner-dashboard' },
                            { label: 'Log Aktivitas', href: '/all-logs' }
                        ]}
                    />
                </div>

                {/* Filters Panel - Modernized */}
                <div className={`-mt-36 lg:mt-0 p-6 rounded-2xl border overflow-hidden relative transition-all duration-300 ${theme === 'admin'
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl'
                    : 'bg-card border-border shadow-2xl'
                    }`}>
                    {/* Decorative Background for filter */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${theme === 'admin' ? 'bg-indigo-600 text-white' : 'bg-primary text-primary-foreground'
                                }`}>
                                <Icon name="Filter" size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl tracking-tight dark:text-white">Smart Filter</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Temukan Aktivitas Spesifik</p>
                            </div>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95"
                        >
                            <Icon name="RotateCcw" size={14} />
                            Reset Filter
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cari Aksi</label>
                            <div className="relative">
                                <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    name="action"
                                    value={filters.action}
                                    onChange={handleFilterChange}
                                    placeholder="Contoh: Tambah Menu..."
                                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm font-semibold bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipe Objek</label>
                            <div className="relative">
                                <Icon name="Layers" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    name="targetType"
                                    value={filters.targetType}
                                    onChange={handleFilterChange}
                                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl text-sm font-semibold bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 border appearance-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                >
                                    <option value="">Semua Data</option>
                                    <optgroup label="Core Business">
                                        <option value="transaction">Transaksi</option>
                                        <option value="order">Pesanan</option>
                                        <option value="expense">Pengeluaran</option>
                                        <option value="credit">Kasbon</option>
                                    </optgroup>
                                    <optgroup label="Inventory \u0026 Menu">
                                        <option value="menu_item">Daftar Menu</option>
                                        <option value="raw_material">Bahan Baku</option>
                                        <option value="unit">Satuan Barang</option>
                                        <option value="recipe">Resep Menu</option>
                                    </optgroup>
                                    <optgroup label="System \u0026 Users">
                                        <option value="user">Profil User</option>
                                        <option value="note">Catatan Sistem</option>
                                        <option value="system">Keamanan/System</option>
                                        <option value="notification">Notifikasi</option>
                                        <option value="cash_reconciliation">Rekon Kas</option>
                                    </optgroup>
                                </select>
                                <Icon name="ChevronDown" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dari Tanggal</label>
                            <div className="relative">
                                <Icon name="Calendar" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm font-semibold bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Hingga Tanggal</label>
                            <div className="relative">
                                <Icon name="Calendar" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm font-semibold bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logs Table Container */}
                <div className={`mt-8 rounded-2xl overflow-hidden border transition-all duration-500 ${theme === 'admin'
                    ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl'
                    : 'bg-card border-border shadow-2xl'
                    }`}>
                    {/* PC Table Header */}
                    <div className="hidden md:grid md:grid-cols-[1.2fr,1.2fr,1fr,0.8fr,2fr] bg-slate-100/50 dark:bg-slate-800/50 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operator</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aksi</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detail Aktivitas</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Menghubungkan ke Server...</span>
                            </div>
                        ) : logs.length > 0 ? (
                            logs.map((log) => (
                                <LogItem key={log.id} log={log} theme={theme} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[400px] opacity-30 italic">
                                <Icon name="Inbox" size={64} strokeWidth={1} />
                                <p className="mt-4 font-bold uppercase tracking-widest text-sm">Tidak Ada Jejak Aktivitas</p>
                            </div>
                        )}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

export default AllLogs;
