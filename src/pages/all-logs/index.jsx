
import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Pagination from '../../components/ui/Pagination';
import authFetch from '../../utils/authFetch';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../../components/AppIcon';

const formatDateTime = (dateString) => {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

const AllLogs = () => {
    const { theme } = useTheme();
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        targetType: '',
        startDate: '',
        endDate: ''
    });

    const fetchLogs = async (page = 1) => {
        setIsLoading(true);
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
        }
    };

    useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset to first page on filter change
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
        <div className={`min-h-screen ${theme === 'admin' ? 'bg-gray-50' : 'bg-background'} pb-20`}>
            {theme !== 'admin' && <NavigationHeader title="Semua Log Aktivitas" />}

            <div className={`${theme === 'admin' ? 'w-full px-4 mt-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 md:mt-4'}`}>
                <BreadcrumbNavigation
                    title="Log Aktivitas Sistem"
                    items={[
                        { label: 'Dashboard', href: theme === 'admin' ? '/main-dashboard' : '/owner-dashboard' },
                        { label: 'Semua Log', href: '/all-logs' }
                    ]}
                />

                {/* Filters Panel */}
                {/* Filters Panel with Enhanced UI */}
                <div className={`mt-6 p-6 rounded-2xl border transition-all duration-300 ${theme === 'admin'
                    ? 'bg-white shadow-sm border-gray-200'
                    : 'bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg'
                    }`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-lg ${theme === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-primary/20 text-primary'}`}>
                            <Icon name="Filter" className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${theme === 'admin' ? 'text-gray-900' : 'text-text-primary'}`}>Filter Log Aktivitas</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Saring data log berdasarkan kriteria tertentu</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Search Action */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                Pencarian Aksi
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icon name="Search" className={`w-4 h-4 ${theme === 'admin' ? 'text-gray-400 group-focus-within:text-indigo-500' : 'text-muted-foreground group-focus-within:text-primary'}`} />
                                </div>
                                <input
                                    type="text"
                                    name="action"
                                    value={filters.action}
                                    onChange={handleFilterChange}
                                    placeholder="Cari aksi (cth: login)..."
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border transition-all duration-200 focus:ring-2 focus:ring-offset-0 ${theme === 'admin'
                                        ? 'bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                                        : 'bg-background/50 border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Target Type Select */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                Tipe Objek
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icon name="Layers" className={`w-4 h-4 ${theme === 'admin' ? 'text-gray-400 group-focus-within:text-indigo-500' : 'text-muted-foreground group-focus-within:text-primary'}`} />
                                </div>
                                <select
                                    name="targetType"
                                    value={filters.targetType}
                                    onChange={handleFilterChange}
                                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border appearance-none transition-all duration-200 focus:ring-2 focus:ring-offset-0 ${theme === 'admin'
                                        ? 'bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                                        : 'bg-background/50 border-border focus:border-primary focus:ring-primary/20 text-foreground'
                                        }`}
                                >
                                    <option value="">Semua Tipe</option>
                                    <option value="transaction">Transaksi</option>
                                    <option value="expense">Pengeluaran</option>
                                    <option value="note">Catatan</option>
                                    <option value="user">User</option>
                                    <option value="system">Sistem</option>
                                    <option value="order">Pesanan</option>
                                    <option value="menu_item">Menu</option>
                                    <option value="raw_material">Bahan Baku</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Icon name="ChevronDown" className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                Dari Tanggal
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icon name="Calendar" className={`w-4 h-4 ${theme === 'admin' ? 'text-gray-400 group-focus-within:text-indigo-500' : 'text-muted-foreground group-focus-within:text-primary'}`} />
                                </div>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border transition-all duration-200 focus:ring-2 focus:ring-offset-0 ${theme === 'admin'
                                        ? 'bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                                        : 'bg-background/50 border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* End Date & Reset */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                Sampai Tanggal
                            </label>
                            <div className="flex gap-2">
                                <div className="relative group flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Icon name="Calendar" className={`w-4 h-4 ${theme === 'admin' ? 'text-gray-400 group-focus-within:text-indigo-500' : 'text-muted-foreground group-focus-within:text-primary'}`} />
                                    </div>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border transition-all duration-200 focus:ring-2 focus:ring-offset-0 ${theme === 'admin'
                                            ? 'bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                                            : 'bg-background/50 border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50'
                                            }`}
                                    />
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className={`px-3 rounded-xl border transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 ${theme === 'admin'
                                        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
                                        }`}
                                    title="Reset Filter"
                                >
                                    <Icon name="RotateCcw" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logs List/Table */}
                <div className={`mt-6 rounded-2xl overflow-hidden ${theme === 'admin' ? 'bg-white shadow-sm border border-gray-100' : 'bg-card border border-border shadow-sm'}`}>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`${theme === 'admin' ? 'bg-gray-50 text-gray-600' : 'bg-muted text-muted-foreground'} text-xs uppercase tracking-widest font-bold`}>
                                    <th className="px-6 py-4">Waktu</th>
                                    <th className="px-6 py-4">Pengguna</th>
                                    <th className="px-6 py-4">Aksi</th>
                                    <th className="px-6 py-4">Target</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-6 py-8">
                                                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium opacity-80">{formatDateTime(log.created_at)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${log.role === 'admin' ? 'bg-blue-100 text-blue-600' :
                                                        log.role === 'owner' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {log.username ? log.username.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-semibold">{log.username || 'System'}</span>
                                                        <span className={`block text-[10px] uppercase tracking-wider font-bold ${log.role === 'admin' ? 'text-blue-500' :
                                                            log.role === 'owner' ? 'text-purple-500' :
                                                                'text-muted-foreground'
                                                            }`}>{log.role || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider leading-normal ${log.action?.includes('Hapus') || log.action?.includes('RESET')
                                                    ? 'bg-destructive/10 text-destructive'
                                                    : log.action?.includes('Tambah') || log.action?.includes('Membuat') || log.action?.includes('Masuk')
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-primary/10 text-primary'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm opacity-60 italic">
                                                {log.target_type && `${log.target_type} #${log.target_id || '-'}`}
                                                {!log.target_type && '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm max-w-xs truncate md:max-w-md" title={log.details}>
                                                {log.details || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center opacity-40">
                                                <Icon name="Inbox" className="w-16 h-16 mb-4" />
                                                <p className="text-lg font-medium">Belum ada data log aktivitas.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        {isLoading ? (
                            <div className="p-4 space-y-4">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="animate-pulse h-32 bg-muted rounded-xl"></div>
                                ))}
                            </div>
                        ) : logs.length > 0 ? (
                            <div className="divide-y divide-border/50">
                                {logs.map((log) => (
                                    <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${log.role === 'admin' ? 'bg-blue-100 text-blue-600' :
                                                    log.role === 'owner' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {log.username ? log.username.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-semibold">{log.username || 'System'}</span>
                                                    <span className={`block text-[10px] uppercase tracking-wider font-bold ${log.role === 'admin' ? 'text-blue-500' :
                                                        log.role === 'owner' ? 'text-purple-500' :
                                                            'text-muted-foreground'
                                                        }`}>{log.role || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                                        </div>

                                        <div className="mb-2">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${log.action?.includes('Hapus') || log.action?.includes('RESET')
                                                ? 'bg-destructive/10 text-destructive'
                                                : log.action?.includes('Tambah') || log.action?.includes('Membuat') || log.action?.includes('Masuk')
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-primary/10 text-primary'
                                                }`}>
                                                {log.action}
                                            </span>
                                            <p className="text-sm text-foreground">{log.details || '-'}</p>
                                        </div>

                                        <div className="text-xs text-muted-foreground italic flex items-center gap-1">
                                            <Icon name="Target" className="w-3 h-3" />
                                            <span>Target: {log.target_type ? `${log.target_type} #${log.target_id || '-'}` : '-'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-10 text-center flex flex-col items-center opacity-40">
                                <Icon name="Inbox" className="w-12 h-12 mb-3" />
                                <p className="text-sm font-medium">Belum ada data log aktivitas.</p>
                            </div>
                        )}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-border/50">
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
