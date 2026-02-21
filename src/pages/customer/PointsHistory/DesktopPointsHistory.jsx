import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { motion, AnimatePresence } from 'framer-motion';

const DesktopPointsHistory = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [points, setPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL;

    const fetchData = useCallback(async (targetPage = 1) => {
        try {
            if (targetPage === 1) setIsLoading(true);

            // Fetch current points
            if (targetPage === 1) {
                const pointsRes = await authFetch(`${API_URL}/api/customer/points`);
                const pointsData = await pointsRes.json();
                if (pointsData.data) setPoints(pointsData.data.points);
            }

            // Fetch points history
            const historyRes = await authFetch(`${API_URL}/api/customer/points/history?page=${targetPage}&limit=12`);
            const historyData = await historyRes.json();
            const newData = historyData.data || [];

            if (targetPage === 1) setHistory(newData);
            else setHistory(prev => [...prev, ...newData]);

            if (historyData.pagination) {
                setHasMore(historyData.pagination.currentPage < historyData.pagination.totalPages);
                setPage(historyData.pagination.currentPage);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-transparent pb-20 overflow-x-hidden">
            <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
                {/* Hero Points Section */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-[3rem] p-16 shadow-2xl relative overflow-hidden text-white flex items-center justify-between">
                    <div className="space-y-6 relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                            <Icon name="Crown" className="text-yellow-300" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Royal Member</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tight leading-none text-white">Loyalitas <span className="text-green-200">Berkah88</span></h1>
                        <p className="text-green-50 font-medium text-lg max-w-xl">Setiap transaksi Anda adalah bentuk dukungan untuk kami. Kumpulkan poin dan nikmati potongan harga langsung di setiap pesanan.</p>
                        <div className="flex gap-4">
                            <button onClick={() => navigate('/customer/menu')} className="bg-white text-green-700 font-black px-10 py-5 rounded-[2rem] shadow-xl transition-all flex items-center gap-3 active:scale-95">
                                GUNAKAN POIN
                                <Icon name="ArrowRight" size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-[4rem] p-12 border border-white/20 text-center space-y-2 min-w-[320px] relative z-10 shadow-2xl">
                        <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.3em]">Saldo Poin Saat Ini</p>
                        <p className="text-7xl font-black tracking-tighter text-white leading-none">
                            {new Intl.NumberFormat('id-ID').format(points)}
                        </p>
                        <p className="text-xs font-bold text-green-200 uppercase tracking-widest pt-2">Poin Berkah</p>
                    </div>
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20" />
                </div>

                {/* History Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Riwayat <span className="text-green-600">Aktivitas</span></h2>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Masuk</div>
                            <div className="flex items-center gap-1.5 ml-4"><div className="w-2 h-2 rounded-full bg-red-500" /> Keluar</div>
                        </div>
                    </div>

                    {isLoading && page === 1 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse" />)}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-32 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                            <Icon name="Coins" size={80} className="text-slate-100 dark:text-slate-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Belum ada riwayat poin</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {history.map((item) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={item.id}
                                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-xl transition-all group"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${item.type === 'earn' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                                            <Icon name={item.type === 'earn' ? 'ArrowUpRight' : 'ArrowDownRight'} size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 dark:text-white mb-1 group-hover:text-green-600 transition-colors uppercase tracking-tight">{item.description || 'Transaksi Berkah'}</h4>
                                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Icon name="Calendar" size={14} /> {formatDate(item.created_at)}</span>
                                                {item.transaction_id && <span className="flex items-center gap-1.5"><Icon name="Hash" size={14} /> REFF #{item.transaction_id}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-4xl font-black tracking-tighter ${item.type === 'earn' ? 'text-green-600' : 'text-rose-600'}`}>
                                            {item.type === 'earn' ? '+' : '-'}{new Intl.NumberFormat('id-ID').format(item.amount)}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">POIN BERKAH</p>
                                    </div>
                                </motion.div>
                            ))}

                            {hasMore && (
                                <button
                                    onClick={() => fetchData(page + 1)}
                                    className="w-full py-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-slate-400 font-black text-xs uppercase tracking-[0.3em] hover:text-green-600 transition-all uppercase tracking-widest mt-4"
                                >
                                    Muat Riwayat Lainnya
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DesktopPointsHistory;
