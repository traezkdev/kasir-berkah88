import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { motion, AnimatePresence } from 'framer-motion';

const DesktopInformationCenter = () => {
    const navigate = useNavigate();
    const [infos, setInfos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInfo, setSelectedInfo] = useState(null);
    const [showDetailInfo, setShowDetailInfo] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchInfos();
    }, []);

    const fetchInfos = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/information?limit=50`);
            const data = await response.json();
            if (data.data) {
                setInfos(data.data);
                if (data.data.length > 0) {
                    const latestTimestamp = new Date(data.data[0].created_at).getTime();
                    localStorage.setItem('last_seen_info_timestamp', latestTimestamp.toString());
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const handleInfoAction = (info) => {
        setShowDetailInfo(false);
        if (info.link_type === 'product' && info.link_value) {
            navigate(`/customer/menu/${info.link_value}`);
        } else if (info.link_type === 'promo') {
            navigate('/customer/promo');
        }
    };

    return (
        <div className="min-h-screen bg-transparent pb-20 overflow-x-hidden">
            <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-16 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-blue-600 font-black text-xs uppercase tracking-[0.3em]">
                            <Icon name="Rss" size={16} />
                            Latest Updates
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Pusat <span className="text-blue-600">Informasi</span></h1>
                        <p className="text-slate-400 font-medium text-lg">Temukan kabar terbaru, tips kuliner, dan pengumuman spesial dari Berkah88.</p>
                    </div>
                </div>

                {/* Content Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-[400px] bg-white dark:bg-slate-900 rounded-[3rem] animate-pulse" />)}
                    </div>
                ) : infos.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-32 text-center border border-slate-100 dark:border-slate-800">
                        <Icon name="BellOff" size={80} className="text-slate-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Belum ada informasi baru</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-8">
                        {infos.map((info) => (
                            <motion.div
                                key={info.id}
                                whileHover={{ y: -8 }}
                                onClick={() => { setSelectedInfo(info); setShowDetailInfo(true); }}
                                className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col hover:shadow-2xl transition-all cursor-pointer group"
                            >
                                <div className="h-64 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    {info.image_url ? (
                                        <img
                                            src={`${API_URL}${info.image_url}`}
                                            alt={info.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Icon name="Info" size={64} className="opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-6 left-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-lg">
                                        BERITA
                                    </div>
                                </div>
                                <div className="p-10 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                                        <Icon name="Calendar" size={14} />
                                        {formatDate(info.created_at).split(' pukul ')[0]}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">{info.title}</h3>
                                    <p className="text-slate-400 font-medium text-sm line-clamp-3 mb-8 leading-relaxed">{info.content}</p>

                                    <div className="mt-auto flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-8">
                                        <span className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                            Baca Selengkapnya
                                            <Icon name="ArrowRight" size={16} className="group-hover:translate-x-2 transition-transform" />
                                        </span>
                                        {info.link_type !== 'none' && (
                                            <div className={`p-3 rounded-2xl ${info.link_type === 'promo' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                                <Icon name={info.link_type === 'promo' ? 'Tag' : 'ShoppingBag'} size={20} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Detail Modal Desktop */}
            <AnimatePresence>
                {showDetailInfo && selectedInfo && (
                    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-12">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-950 w-full max-w-5xl rounded-[4rem] overflow-hidden shadow-2xl flex border border-slate-200 dark:border-slate-800"
                        >
                            {/* Modal Left: Image */}
                            <div className="w-5/12 bg-slate-50 dark:bg-slate-900 relative">
                                {selectedInfo.image_url ? (
                                    <img src={`${API_URL}${selectedInfo.image_url}`} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200"><Icon name="Image" size={100} /></div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/80 to-transparent">
                                    <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-lg inline-block mb-3">OFFICIAL UPDATE</span>
                                    <p className="text-white/70 font-medium text-sm">{formatDate(selectedInfo.created_at)}</p>
                                </div>
                            </div>

                            {/* Modal Right: Content */}
                            <div className="w-7/12 p-16 flex flex-col relative">
                                <button onClick={() => setShowDetailInfo(false)} className="absolute top-10 right-10 p-4 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400 hover:text-red-500 transition-all active:scale-90"><Icon name="X" /></button>

                                <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                                    <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">{selectedInfo.title}</h2>
                                    <div className="h-1 w-12 bg-blue-600 rounded-full" />
                                    <div className="text-slate-400 dark:text-slate-300 font-medium text-lg leading-relaxed whitespace-pre-line pr-4 pb-8">
                                        {selectedInfo.content}
                                    </div>
                                </div>

                                <div className="mt-auto pt-10 flex gap-4">
                                    {(selectedInfo.link_type === 'product' || selectedInfo.link_type === 'promo') && (
                                        <button
                                            onClick={() => handleInfoAction(selectedInfo)}
                                            className={`flex-1 py-6 rounded-[2rem] font-black text-white flex items-center justify-center gap-3 shadow-2xl hover:-translate-y-1 active:scale-95 transition-all text-sm uppercase tracking-widest ${selectedInfo.link_type === 'promo' ? 'bg-amber-500' : 'bg-green-600'}`}
                                        >
                                            <Icon name={selectedInfo.link_type === 'promo' ? 'Tag' : 'ShoppingBag'} />
                                            {selectedInfo.link_type === 'promo' ? 'LIHAT PROMO SPESIAL' : 'PESAN PRODUK INI'}
                                        </button>
                                    )}
                                    <button onClick={() => setShowDetailInfo(false)} className="px-10 py-6 border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black rounded-[2rem] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-sm uppercase tracking-widest">TUTUP</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DesktopInformationCenter;
