import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { motion, AnimatePresence } from 'framer-motion';

const DesktopPromo = () => {
    const navigate = useNavigate();
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPromo, setSelectedPromo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/customer/promos`);
            const result = await response.json();
            if (result.data) setPromos(result.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openModal = (promo) => {
        setSelectedPromo(promo);
        setIsModalOpen(true);
        setCopied(false);
    };

    return (
        <div className="min-h-screen bg-transparent pb-20">
            <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
                {/* Promo Header */}
                <div className="bg-slate-900 dark:bg-slate-900 rounded-[3rem] p-16 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="space-y-6 flex-1">
                            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                                <Icon name="Gift" className="text-amber-400" size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Penawaran Khusus</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tight leading-none">Pesta <span className="text-green-500">Promo Berkah88</span> Menanti Anda!</h1>
                            <p className="text-slate-300 text-lg font-medium max-w-xl">Dapatkan potongan harga spesial, poin berlebih, dan voucer menarik untuk melengkapi petualangan rasa Anda hari ini.</p>
                            <button onClick={() => navigate('/customer/menu')} className="bg-green-600 hover:bg-green-700 text-white font-black px-10 py-5 rounded-[2rem] shadow-xl shadow-green-600/20 transition-all flex items-center gap-3 active:scale-95">
                                MULAI PESAN SEKARANG
                                <Icon name="ArrowRight" size={20} />
                            </button>
                        </div>
                        <div className="w-80 h-80 bg-gradient-to-tr from-green-500 to-emerald-300 rounded-[4rem] rotate-6 shadow-2xl flex items-center justify-center relative group overflow-hidden">
                            <Icon name="Ticket" size={120} className="text-white drop-shadow-2xl group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                    {/* Background elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20" />
                </div>

                {/* Promo Grid */}
                {loading ? (
                    <div className="grid grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-8">
                        {promos.map((promo) => (
                            <motion.div
                                key={promo.id}
                                whileHover={{ y: -10 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col hover:shadow-2xl transition-all"
                            >
                                <div className="h-40 relative group overflow-hidden">
                                    {promo.image_url ? (
                                        <img src={promo.image_url.startsWith('http') ? promo.image_url : `${API_URL}${promo.image_url}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white" style={{ backgroundColor: promo.color || '#059669' }}>
                                            <Icon name={promo.icon || 'Ticket'} size={64} className="opacity-30" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl font-black text-slate-800 text-[10px] shadow-lg">
                                        {promo.code ? 'VOUCER' : 'KAMPANYE'}
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <h3 className="font-black text-2xl text-slate-900 dark:text-white leading-tight">{promo.title}</h3>
                                        <span className="shrink-0 text-green-600 font-black text-xl tracking-tighter">
                                            {promo.discount_type === 'percentage' ? `${parseFloat(promo.discount_value).toFixed(0)}%` : `Rp ${parseFloat(promo.discount_value).toLocaleString('id-ID')}`}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 font-medium text-sm mb-10 line-clamp-3">{promo.description}</p>
                                    <div className="mt-auto flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-6">
                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            <Icon name="Clock" size={14} />
                                            {promo.expiry || 'Limited Time'}
                                        </div>
                                        <button
                                            onClick={() => promo.code ? openModal(promo) : navigate('/customer/menu')}
                                            className="bg-slate-900 dark:bg-slate-800 text-white font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-green-600 transition-all"
                                        >
                                            {promo.code ? 'CEK KODE' : 'LIHAT MENU'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal for Promo Desktop */}
            <AnimatePresence>
                {isModalOpen && selectedPromo && (
                    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-950 rounded-[4rem] p-16 shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full text-center relative overflow-hidden">
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-4 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400 hover:text-red-500 transition-all active:scale-90"><Icon name="X" /></button>
                            <div className="w-24 h-24 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
                                <Icon name="Gift" size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{selectedPromo.title}</h2>
                            <p className="text-slate-400 font-medium mb-10 lg:px-20">Gunakan kode di bawah ini saat checkout untuk mendapatkan potongan harga spesial Berkah88.</p>

                            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 flex items-center justify-between gap-6 mb-10">
                                <span className="text-4xl font-black text-slate-800 dark:text-white tracking-[0.3em] font-mono ml-4">{selectedPromo.code}</span>
                                <button
                                    onClick={() => handleCopyCode(selectedPromo.code)}
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${copied ? 'bg-green-600 shadow-xl shadow-green-600/20' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-green-600 hover:border-green-100 border border-slate-100 dark:border-slate-700'}`}
                                >
                                    {copied ? <Icon name="Check" className="text-white" size={28} /> : <Icon name="Copy" size={28} />}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-10 text-left">
                                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-50 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Maksual Diskon</p>
                                    <p className="text-xl font-black text-slate-800 dark:text-white">{selectedPromo.discount_type === 'percentage' ? `${selectedPromo.discount_value}%` : `Rp ${parseFloat(selectedPromo.discount_value).toLocaleString('id-ID')}`}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-50 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Min. Belanja</p>
                                    <p className="text-xl font-black text-slate-800 dark:text-white">Rp {parseFloat(selectedPromo.min_purchase).toLocaleString('id-ID')}</p>
                                </div>
                            </div>

                            <button onClick={() => setIsModalOpen(false)} className="w-full bg-slate-900 dark:bg-green-600 text-white font-black py-6 rounded-[2rem] shadow-xl hover:-translate-y-1 active:scale-95 transition-all text-sm uppercase tracking-widest">Selesai, Siapkan Rasa!</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DesktopPromo;
