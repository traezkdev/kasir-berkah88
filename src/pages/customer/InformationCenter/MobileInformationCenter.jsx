import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';

const MobileInformationCenter = () => {
    const navigate = useNavigate();
    const [infos, setInfos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInfo, setSelectedInfo] = useState(null);
    const [showDetailInfo, setShowDetailInfo] = useState(false);

    useEffect(() => {
        fetchInfos();
    }, []);

    const fetchInfos = async () => {
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/information?limit=50`);
            const data = await response.json();
            if (data.data) {
                setInfos(data.data);
                // Update last seen timestamp immediately when opening this page
                if (data.data.length > 0) {
                    const latestTimestamp = new Date(data.data[0].created_at).getTime();
                    const currentLastSeen = parseInt(localStorage.getItem('last_seen_info_timestamp') || '0');
                    if (latestTimestamp > currentLastSeen) {
                        localStorage.setItem('last_seen_info_timestamp', latestTimestamp.toString());
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching information:', error);
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
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-6 py-4 shadow-sm flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <Icon name="ArrowLeft" className="w-6 h-6 text-gray-800" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900">Pusat Informasi</h1>
                    <p className="text-xs text-gray-500 font-medium">Update terbaru dari Berkah88</p>
                </div>
            </div>

            {/* List Content */}
            <div className="p-4 pt-24 space-y-4 max-w-md mx-auto">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-32 animate-pulse" />
                    ))
                ) : infos.length > 0 ? (
                    infos.map((info) => (
                        <div
                            key={info.id}
                            onClick={() => { setSelectedInfo(info); setShowDetailInfo(true); }}
                            className="bg-white p-5 rounded-2xl border border-gray-100 active:scale-[0.98] transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-[10px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg font-bold">
                                    <Icon name="Clock" className="w-3 h-3" />
                                    <span>{formatDate(info.created_at).split(' pukul ')[0]}</span>
                                </div>
                            </div>

                            {info.image_url && (
                                <div className="mb-4 rounded-xl overflow-hidden bg-gray-100 aspect-video shadow-sm border border-gray-100 relative group-hover:shadow-md transition-all">
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}${info.image_url}`}
                                        alt={info.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.display = 'none'; }}
                                    />
                                </div>
                            )}

                            <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">{info.title}</h4>
                            <p className="text-gray-500 text-sm line-clamp-3 mb-4 bg-gray-50 p-3 rounded-xl leading-relaxed">{info.content}</p>

                            {info.link_type !== 'none' && (
                                <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-100">
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${info.link_type === 'promo'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-green-100 text-green-700'
                                        }`}>
                                        <Icon name={info.link_type === 'promo' ? 'Tag' : 'ShoppingBag'} className="w-3.5 h-3.5" />
                                        <span>{info.link_type === 'promo' ? 'Lihat Promo' : 'Lihat Produk'}</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                                        <Icon name="ChevronRight" className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
                            <Icon name="BellOff" className="w-12 h-12" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Belum ada informasi</h3>
                        <p className="text-gray-400 text-sm">Nantikan update terbaru dari kami</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailInfo && selectedInfo && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowDetailInfo(false)}></div>
                    <div className="bg-white w-full max-w-md h-auto rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 z-50 p-6">
                        <div className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6 sm:hidden"></div>

                        {selectedInfo.image_url && (
                            <img
                                src={`${import.meta.env.VITE_API_URL}${selectedInfo.image_url}`}
                                alt={selectedInfo.title}
                                className="w-full h-56 object-cover rounded-2xl mb-5 shadow-sm"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}

                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="Calendar" className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-500 font-medium">{formatDate(selectedInfo.created_at)}</span>
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{selectedInfo.title}</h3>
                        <div className="w-full h-px bg-gray-100 my-4"></div>
                        <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-8 max-h-[50vh] overflow-y-auto">
                            {selectedInfo.content}
                        </div>

                        {(selectedInfo.link_type === 'product' || selectedInfo.link_type === 'promo') && (
                            <button
                                onClick={() => handleInfoAction(selectedInfo)}
                                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all mb-3 ${selectedInfo.link_type === 'promo' ? 'bg-amber-500 shadow-amber-200' : 'bg-green-600 shadow-green-200'
                                    }`}
                            >
                                <Icon name={selectedInfo.link_type === 'promo' ? 'Tag' : 'ShoppingBag'} className="w-5 h-5" />
                                <span>{selectedInfo.link_type === 'promo' ? 'Lihat Promo Spesial' : 'Pesan Sekarang'}</span>
                                <Icon name="ArrowRight" className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            onClick={() => setShowDetailInfo(false)}
                            className="w-full py-3.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileInformationCenter;
