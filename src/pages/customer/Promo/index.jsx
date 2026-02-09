import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';

const CustomerPromo = () => {
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
            if (result.data) {
                setPromos(result.data);
            }
        } catch (error) {
            console.error('Error fetching promos:', error);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-medium">Memuat promo terbaru...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-24 max-w-md mx-auto relative overflow-x-hidden">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-md mx-auto">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-50 rounded-full transition-colors">
                    <Icon name="ArrowLeft" size={24} />
                </button>
                <h1 className="text-lg font-black text-gray-900 tracking-tight">Promo & Penawaran</h1>
                <div className="w-10"></div>
            </div>

            <div className="pt-20 px-6 space-y-8">
                {/* Hero section - Slider */}
                {promos.filter(p => p.is_hero && p.image_url).length > 0 && (
                    <div className="relative group">
                        <div className="overflow-x-auto no-scrollbar flex gap-4 snap-x snap-mandatory scroll-smooth" id="hero-promo-slider">
                            {promos.filter(p => p.is_hero && p.image_url).map((hero, idx) => (
                                <div
                                    key={idx}
                                    className="min-w-full snap-center"
                                    onClick={() => hero.code ? openModal(hero) : navigate('/customer/menu')}
                                >
                                    <div className="relative h-48 rounded-[2.5rem] overflow-hidden active:scale-[0.98] transition-all cursor-pointer border border-gray-100">
                                        <img
                                            src={hero.image_url.startsWith('http') ? hero.image_url : `${API_URL}${hero.image_url}`}
                                            alt={hero.title}
                                            className="w-full h-full object-cover transition-transform duration-700"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Pagination Dots */}
                        {promos.filter(p => p.is_hero && p.image_url).length > 1 && (
                            <div className="flex justify-center gap-1.5 mt-4">
                                {promos.filter(p => p.is_hero && p.image_url).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === 0 ? 'bg-green-600 w-4' : 'bg-gray-200'}`}
                                    ></div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Vouchers Section */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-100 p-2 rounded-xl text-green-600">
                            <Icon name="Ticket" size={20} />
                        </div>
                        <h3 className="text-base font-black text-gray-900 tracking-tight">Voucer Berkah88</h3>
                    </div>

                    <div className="space-y-4">
                        {promos.filter(p => p.code && !p.is_hero).length > 0 ? (
                            promos.filter(p => p.code && !p.is_hero).map((promo) => (
                                <div key={promo.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm flex overflow-hidden min-h-[110px] relative">
                                    <div className="w-20 flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: promo.color || '#059669' }}>
                                        <Icon name={promo.icon || 'Ticket'} size={28} className="text-white relative z-10" />
                                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white/10 rounded-full rotate-45"></div>
                                    </div>
                                    <div className="flex-1 p-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h4 className="font-extrabold text-gray-900 text-sm leading-tight truncate">{promo.title}</h4>
                                                <span className="shrink-0 bg-green-50 text-green-600 text-[10px] font-black px-2 py-0.5 rounded-lg border border-green-100">
                                                    {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `Rp ${parseFloat(promo.discount_value).toLocaleString('id-ID')}`}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium line-clamp-2 mb-2">{promo.description}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Icon name="Clock" size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{promo.expiry || 'Tanpa Batas'}</span>
                                            </div>
                                            <button
                                                onClick={() => openModal(promo)}
                                                className="bg-gray-50 border border-gray-200 text-gray-800 text-[9px] font-black px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors uppercase tracking-widest"
                                            >
                                                KODE
                                            </button>
                                        </div>
                                    </div>
                                    {/* Ticket Cuts */}
                                    <div className="absolute left-[72px] -top-2 w-4 h-4 bg-white border border-gray-100 rounded-full"></div>
                                    <div className="absolute left-[72px] -bottom-2 w-4 h-4 bg-white border border-gray-100 rounded-full"></div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-gray-50 rounded-3xl p-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                                <Icon name="Ticket" size={48} className="text-gray-200 mb-3" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Belum ada voucer aktif</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Campaigns Section */}
                <div className="pb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-amber-100 p-2 rounded-xl text-amber-500 shadow-sm shadow-amber-100/50">
                            <Icon name="Zap" size={20} className="fill-current" />
                        </div>
                        <h3 className="text-base font-black text-gray-900 tracking-tight">Kampanye Sedang Berlangsung</h3>
                    </div>

                    <div className="space-y-4">
                        {promos.filter(p => !p.code && !p.is_hero).length > 0 ? (
                            promos.filter(p => !p.code && !p.is_hero).map((campaign) => (
                                <div
                                    key={campaign.id}
                                    onClick={() => navigate('/customer/menu')}
                                    className="p-6 rounded-[2rem] text-white flex items-center gap-5 shadow-xl transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group"
                                    style={{ backgroundColor: campaign.color || '#059669' }}
                                >
                                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                                        <Icon name={campaign.icon || 'Zap'} size={24} className="fill-current" />
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <h4 className="text-lg font-black tracking-tight leading-tight mb-0.5">{campaign.title}</h4>
                                        <p className="text-white/80 text-xs font-medium line-clamp-2 mb-3">{campaign.description}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white px-3 py-1 rounded-full flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: campaign.color || '#059669' }}></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: campaign.color || '#059669' }}>AKTIF</span>
                                            </div>
                                            {campaign.min_purchase > 0 && (
                                                <span className="text-[10px] font-bold opacity-70 italic">
                                                    Min. Rp {parseFloat(campaign.min_purchase).toLocaleString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white w-16 h-16 rounded-full flex flex-col items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                        <span className="text-lg font-black tracking-tighter" style={{ color: campaign.color || '#059669' }}>
                                            {campaign.discount_type === 'percentage' ? `${parseFloat(campaign.discount_value).toFixed(0)}%` : '!!!'}
                                        </span>
                                        <span className="text-[8px] font-black uppercase -mt-1" style={{ color: campaign.color || '#059669' }}>OFF</span>
                                    </div>
                                    {/* Decorative circles */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full"></div>
                                    <div className="absolute -bottom-5 left-20 w-16 h-16 bg-white/5 rounded-full"></div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-gray-50 rounded-3xl p-8 flex flex-col items-center justify-center border border-gray-100">
                                <Icon name="Zap" size={32} className="text-gray-200 mb-2" />
                                <p className="text-xs font-bold text-gray-400 text-center">Belum ada kampanye hari ini</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tips Section */}
                <div className="bg-green-600 rounded-[2.5rem] p-8 text-white flex gap-6 relative overflow-hidden shadow-xl shadow-green-100">
                    <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                        <Icon name="Star" size={32} className="fill-white text-white" />
                    </div>
                    <div className="relative z-10 flex-1">
                        <h4 className="text-xl font-black mb-1">Tips Hemat Berkah!</h4>
                        <p className="text-white/80 text-sm font-medium leading-relaxed mb-4">Kumpulkan poin setiap belanja untuk ditukarkan dengan potongan harga langsung.</p>
                        <button
                            onClick={() => navigate('/customer/points-history')}
                            className="flex items-center gap-2 group"
                        >
                            <span className="text-sm font-black underline underline-offset-4 decoration-2 decoration-white/30 group-hover:decoration-white transition-all">Cek Poin Sekarang</span>
                            <Icon name="ChevronRight" size={16} />
                        </button>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
                    <div className="absolute top-0 right-10 w-20 h-20 bg-white/5 rounded-full"></div>
                </div>
            </div>

            {/* Modal for Promo Code */}
            {isModalOpen && selectedPromo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 animate-in zoom-in-95 duration-300 shadow-2xl relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <Icon name="X" size={18} />
                        </button>

                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: (selectedPromo.color || '#059669') + '15' }}>
                                <Icon name="Gift" size={36} style={{ color: selectedPromo.color || '#059669' }} />
                            </div>

                            <h3 className="text-xl font-black text-gray-900 text-center mb-2">{selectedPromo.title}</h3>
                            <p className="text-sm text-gray-500 text-center leading-relaxed mb-8">Salin kode di bawah ini untuk digunakan saat pembayaran.</p>

                            <div className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex items-center justify-between mb-8">
                                <span className="text-2xl font-black text-gray-900 tracking-[0.2em] ml-2">{selectedPromo.code}</span>
                                <button
                                    onClick={() => handleCopyCode(selectedPromo.code)}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-green-600 shadow-lg shadow-green-200' : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-300'}`}
                                >
                                    {copied ? <Icon name="Check" size={20} className="text-white" /> : <Icon name="Copy" size={20} />}
                                </button>
                            </div>

                            <div className="w-full space-y-3 mb-8 px-2">
                                <div className="flex items-center gap-3 text-gray-500">
                                    <Icon name="Info" size={14} className="opacity-50" />
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        {selectedPromo.discount_type === 'percentage' ? `Diskon ${selectedPromo.discount_value}%` : `Potongan Rp ${parseFloat(selectedPromo.discount_value).toLocaleString('id-ID')}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-500">
                                    <Icon name="ShoppingBag" size={14} className="opacity-50" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Min. Pembelian Rp {parseFloat(selectedPromo.min_purchase).toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full py-5 rounded-2xl text-white font-black shadow-xl shadow-green-100 active:scale-[0.98] transition-all"
                                style={{ backgroundColor: selectedPromo.color || '#059669' }}
                            >
                                Alhamdulillah, Terima Kasih
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerPromo;
