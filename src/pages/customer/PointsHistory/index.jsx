import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';

const PointsHistory = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [points, setPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchData = useCallback(async (targetPage = 1) => {
        if (targetPage === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            // Fetch current points
            if (targetPage === 1) {
                const pointsRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/customer/points`);
                const pointsData = await pointsRes.json();
                if (pointsData.data) setPoints(pointsData.data.points);
            }

            // Fetch points history with pagination
            const historyRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/customer/points/history?page=${targetPage}&limit=10`);
            const historyData = await historyRes.json();
            const newData = historyData.data || [];
            const pagination = historyData.pagination;

            if (targetPage === 1) {
                setHistory(newData);
            } else {
                setHistory(prev => [...prev, ...newData]);
            }

            if (pagination) {
                setHasMore(pagination.currentPage < pagination.totalPages);
                setPage(pagination.currentPage);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching points data:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore && !isLoading) {
            fetchData(page + 1);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options);
    };

    if (isLoading && page === 1) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-6 max-w-md mx-auto relative">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 px-6 pt-6 pb-6 shadow-lg max-w-md mx-auto">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/customer/dashboard')}
                        className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <Icon name="ArrowLeft" className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-lg font-black text-white">Riwayat Poin</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            {/* Spacer to push content down from fixed header */}
            <div className="h-[88px]"></div>

            {/* Points Card */}
            <div className="mx-6 mt-6 bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-2">
                    TOTAL POIN ANDA
                </p>
                <p className="text-5xl font-black text-green-600 text-center tracking-tight mb-1">
                    {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(points)}
                </p>
                <p className="text-xs font-semibold text-gray-500 text-center">
                    Poin Berkah 88
                </p>
            </div>

            {/* History List */}
            <div className="mt-6 px-6">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Icon name="Calendar" className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-base font-bold text-gray-500 mb-1">Belum ada riwayat poin</p>
                        <p className="text-xs text-gray-400">Mulai belanja untuk mendapatkan poin!</p>
                    </div>
                ) : (
                    <>
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex items-center gap-3"
                            >
                                <div
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.type === 'earn'
                                        ? 'bg-green-50 text-green-600'
                                        : 'bg-red-50 text-red-600'
                                        }`}
                                >
                                    <Icon
                                        name={item.type === 'earn' ? 'TrendingUp' : 'TrendingDown'}
                                        className="w-5 h-5"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800 mb-1">
                                        {item.description || 'Transaksi'}
                                    </p>
                                    <p className="text-[11px] text-gray-400 font-medium">
                                        {formatDate(item.created_at)}
                                    </p>
                                    {item.transaction_id && (
                                        <p className="text-[10px] text-gray-300 font-semibold mt-0.5">
                                            ID: {item.transaction_id}
                                        </p>
                                    )}
                                </div>
                                <p
                                    className={`text-base font-black tracking-tight ${item.type === 'earn' ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {item.type === 'earn' ? '+' : '-'}
                                    {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(item.amount)}
                                </p>
                            </div>
                        ))}

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center mt-4 mb-6">
                                {isLoadingMore ? (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                                        <span className="text-xs font-semibold">Memuat lebih banyak...</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-6 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-wider hover:bg-green-100 transition-colors"
                                    >
                                        Muat Lebih Banyak
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PointsHistory;
