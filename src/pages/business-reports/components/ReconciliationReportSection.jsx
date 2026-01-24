import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ReconciliationReportSection = ({ reconciliations = [] }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const totalPages = Math.ceil(reconciliations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = reconciliations.slice(startIndex, startIndex + itemsPerPage);

    const getStatus = (variance) => {
        if (variance === 0) return { label: 'PAS', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', dotColor: 'bg-emerald-500' };
        if (variance > 0) return { label: 'KURANG', color: 'text-rose-600', bgColor: 'bg-rose-50 dark:bg-rose-900/20', dotColor: 'bg-rose-500' };
        return { label: 'LEBIH', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', dotColor: 'bg-amber-500' };
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100/50 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-300 overflow-hidden group">
            {/* Header Section */}
            <div className="p-7 lg:p-8 border-b border-gray-50 dark:border-slate-700/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-2xl border border-primary/10 dark:border-primary/20 transition-transform group-hover:scale-110 duration-300">
                        <Icon name="History" size={24} strokeWidth={2.5} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">Riwayat Rekonsiliasi Kas</h2>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">Log Selisih Keuangan Lapak</p>
                    </div>
                </div>
            </div>

            <div className="">
                {reconciliations.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
                            <Icon name="FileText" size={24} className="text-gray-300 dark:text-slate-600" />
                        </div>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Belum ada data rekonsiliasi kas pada periode ini.</p>
                    </div>
                ) : (
                    <>
                        {/* Table View (Desktop) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-50/50 dark:bg-slate-900/30 text-gray-400 dark:text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-gray-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-8 py-5">Tanggal</th>
                                        <th className="px-6 py-5">Admin/Kasir</th>
                                        <th className="px-6 py-5 text-right">Tunai (Act)</th>
                                        <th className="px-6 py-5 text-right">Transfer (Act)</th>
                                        <th className="px-6 py-5 text-right">Selisih</th>
                                        <th className="px-6 py-5 text-center">Status</th>
                                        <th className="px-8 py-5 text-right">Opsi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                    {paginatedItems.map((item) => {
                                        const totalVariance = (parseFloat(item.variance_tunai) || 0) +
                                            (parseFloat(item.variance_transfer) || 0) +
                                            (parseFloat(item.variance_gojek) || 0);
                                        const status = getStatus(totalVariance);

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-gray-900 dark:text-white tracking-tight">
                                                            {new Date(item.date).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(item.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-gray-500">
                                                            {(item.reconciled_by || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-gray-700 dark:text-slate-300">
                                                            {item.reconciled_by || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right font-black text-gray-900 dark:text-white tracking-tighter">
                                                    Rp {(item.actual_tunai || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right font-black text-gray-900 dark:text-white tracking-tighter">
                                                    Rp {(item.actual_transfer || 0).toLocaleString()}
                                                </td>
                                                <td className={`px-6 py-5 whitespace-nowrap text-right font-black tracking-tighter ${status.color}`}>
                                                    Rp {Math.abs(totalVariance).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status.bgColor} ${status.color} border border-transparent group-hover:border-current/10 transition-colors`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${status.dotColor} animate-pulse`}></div>
                                                        {status.label}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-xl" title={item.notes || 'Tidak ada catatan'}>
                                                        <Icon name="MessageCircle" size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Card View (Mobile) */}
                        <div className="md:hidden">
                            <div className="p-6 space-y-4">
                                {paginatedItems.map((item) => {
                                    const totalVariance = (parseFloat(item.variance_tunai) || 0) +
                                        (parseFloat(item.variance_transfer) || 0) +
                                        (parseFloat(item.variance_gojek) || 0);
                                    const status = getStatus(totalVariance);

                                    return (
                                        <div key={item.id} className="bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl p-5 border border-gray-100/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-all border-l-4" style={{ borderColor: status.color === 'text-emerald-600' ? '#10b981' : status.color === 'text-rose-600' ? '#f43f5e' : '#f59e0b' }}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                                        {new Date(item.date).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Oleh: {item.reconciled_by || 'Unknown'}</p>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${status.bgColor} ${status.color}`}>
                                                    {status.label}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100/50 dark:border-slate-700">
                                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Aktual Tunai</p>
                                                    <p className="font-black text-gray-900 dark:text-white tracking-tighter">Rp {(item.actual_tunai || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100/50 dark:border-slate-700">
                                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Selisih Kas</p>
                                                    <p className={`font-black tracking-tighter ${status.color}`}>Rp {Math.abs(totalVariance).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {item.notes && (
                                                <div className="mt-4 flex gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                                                    <Icon name="MessageSquare" size={14} className="text-gray-400 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed italic">"{item.notes}"</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pagination Section */}
                        {totalPages > 1 && (
                            <div className="px-8 py-6 bg-gray-50/30 dark:bg-slate-900/10 border-t border-gray-50 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                    Halaman <span className="text-primary">{currentPage}</span> Dari <span className="text-primary">{totalPages}</span>
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <Icon name="ChevronLeft" size={16} strokeWidth={3} />
                                        <span>Sebelumnya</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <span>Selanjutnya</span>
                                        <Icon name="ChevronRight" size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ReconciliationReportSection;
