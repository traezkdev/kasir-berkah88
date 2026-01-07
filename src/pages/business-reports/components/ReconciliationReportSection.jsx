import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';

const ReconciliationReportSection = ({ reconciliations = [] }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(reconciliations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = reconciliations.slice(startIndex, startIndex + itemsPerPage);

    const getStatus = (variance) => {
        if (variance === 0) return { label: 'PAS', color: 'text-green-600', bgColor: 'bg-green-50' };
        if (variance > 0) return { label: 'KURANG', color: 'text-red-600', bgColor: 'bg-red-50' };
        return { label: 'LEBIH', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    };

    return (
        <Card className="overflow-hidden">
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                        <path d="M12 7v5l4 2"></path>
                    </svg>
                    <h2 className="text-xl font-bold text-text-primary">Riwayat Rekonsiliasi Kas</h2>
                </div>
            </div>

            <div className="">
                {reconciliations.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                        <p>Belum ada data rekonsiliasi kas pada periode ini.</p>
                    </div>
                ) : (
                    <>
                        {/* Table View (Desktop) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-background text-text-secondary uppercase text-xs font-medium border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Tanggal</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4 text-right">Tunai (Act)</th>
                                        <th className="px-6 py-4 text-right">Transfer (Act)</th>
                                        <th className="px-6 py-4 text-right">Gojek (Act)</th>
                                        <th className="px-6 py-4 text-right">Total Selisih</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paginatedItems.map((item) => {
                                        const totalVariance = (parseFloat(item.variance_tunai) || 0) +
                                            (parseFloat(item.variance_transfer) || 0) +
                                            (parseFloat(item.variance_gojek) || 0);
                                        const status = getStatus(totalVariance);

                                        return (
                                            <tr key={item.id} className="hover:bg-background/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
                                                    {new Date(item.date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                                    {item.reconciled_by || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-text-primary">
                                                    Rp {(item.actual_tunai || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-text-primary">
                                                    Rp {(item.actual_transfer || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-text-primary">
                                                    Rp {(item.actual_gojek || 0).toLocaleString()}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${status.color}`}>
                                                    Rp {Math.abs(totalVariance).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <div className="truncate text-text-secondary" title={item.notes || ''}>
                                                        {item.notes || '-'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Card View (Mobile) */}
                        <div className="md:hidden divide-y divide-border">
                            {paginatedItems.map((item) => {
                                const totalVariance = (parseFloat(item.variance_tunai) || 0) +
                                    (parseFloat(item.variance_transfer) || 0) +
                                    (parseFloat(item.variance_gojek) || 0);
                                const status = getStatus(totalVariance);

                                return (
                                    <div key={item.id} className="p-4 space-y-3 hover:bg-background/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-text-primary">
                                                    {new Date(item.date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-xs text-text-secondary mt-0.5">Oleh: {item.reconciled_by || '-'}</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bgColor} ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-lg border border-border/50">
                                            <div>
                                                <p className="text-[10px] text-text-secondary uppercase tracking-wider font-medium">Tunai (Act)</p>
                                                <p className="font-mono text-text-primary">Rp {(item.actual_tunai || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-secondary uppercase tracking-wider font-medium">Transfer (Act)</p>
                                                <p className="font-mono text-text-primary">Rp {(item.actual_transfer || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-secondary uppercase tracking-wider font-medium">Gojek (Act)</p>
                                                <p className="font-mono text-text-primary">Rp {(item.actual_gojek || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-secondary uppercase tracking-wider font-medium font-bold">Selisih</p>
                                                <p className={`font-mono font-bold ${status.color}`}>Rp {Math.abs(totalVariance).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {item.notes && (
                                            <div className="flex gap-2 items-start mt-2 p-2 bg-blue-50/30 dark:bg-blue-900/10 rounded border border-blue-100/50 dark:border-blue-900/20">
                                                <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                </svg>
                                                <p className="text-xs text-text-secondary italic">"{item.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                                <span className="text-sm text-text-secondary">
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="btn btn-sm btn-outline disabled:opacity-50 h-9 px-3 text-xs"
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="btn btn-sm btn-outline disabled:opacity-50 h-9 px-3 text-xs"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
};

export default ReconciliationReportSection;
