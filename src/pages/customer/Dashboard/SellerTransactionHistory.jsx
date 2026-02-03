
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';

const SellerTransactionHistory = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUserRole(decodedToken.role);
            } catch (e) {
                console.error("Error decoding token:", e);
            }
        }

        fetchTransactions();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/transactions?limit=1000`);
            const data = await response.json();

            if (response.ok && data.message === 'success') {
                // Parse items if they are strings
                const parsedData = data.data.map(t => ({
                    ...t,
                    timestamp: new Date(t.timestamp),
                    items: typeof t.items === 'string' ? JSON.parse(t.items || '[]') : (t.items || [])
                }));

                // Sort by newest first
                parsedData.sort((a, b) => b.timestamp - a.timestamp);

                setTransactions(parsedData);
            } else {
                toast.error('Gagal mengambil data transaksi');
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error('Terjadi kesalahan koneksi');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

            let matchesDate = true;
            if (dateRange.startDate) {
                const start = new Date(dateRange.startDate);
                start.setHours(0, 0, 0, 0);
                if (t.timestamp < start) matchesDate = false;
            }
            if (dateRange.endDate) {
                const end = new Date(dateRange.endDate);
                end.setHours(23, 59, 59, 999);
                if (t.timestamp > end) matchesDate = false;
            }

            return matchesSearch && matchesDate;
        });
    }, [transactions, searchTerm, dateRange]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateRange]);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Stats Logic
    const stats = useMemo(() => {
        const total = filteredTransactions.reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0);
        const count = filteredTransactions.length;
        const avg = count > 0 ? total / count : 0;
        return { total, count, avg };
    }, [filteredTransactions]);

    return (
        <div className="pb-10 animate-in fade-in duration-500 lg:static -mx-4 -mt-4 lg:mx-0 lg:mt-0">
            {/* Mobile Sticky Header (Fixed at Root) */}
            <div className="fixed top-0 left-0 right-0 z-50 lg:hidden">
                <div className={`absolute inset-0 bg-white transition-opacity duration-200 ease-in-out ${scrolled ? 'opacity-100 shadow-sm' : 'opacity-0'}`} />
                <div className={`relative z-10 px-6 flex justify-between items-center transition-all duration-200 ease-in-out ${scrolled ? 'py-3 text-gray-800' : 'py-5 text-white'}`}>
                    <button onClick={() => navigate('/seller/dashboard')} className={`p-2 rounded-xl scale-110 active:scale-95 transition-all ${scrolled ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'}`}>
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <span className={`font-black tracking-tight flex-1 text-center transition-opacity duration-300 ${scrolled ? 'opacity-100 text-gray-800' : 'opacity-0 text-white'}`}>
                        Transaksi
                    </span>
                    <div className="flex gap-2">
                        {userRole === 'admin' && (
                            <button
                                onClick={() => navigate('/main-dashboard')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${scrolled ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-white/20 text-white border border-white/30'}`}
                            >
                                <Icon name="ArrowLeft" size={14} />
                                Admin
                            </button>
                        )}
                        <button onClick={fetchTransactions} className={`p-2 rounded-xl active:scale-90 transition-all ${scrolled ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'}`}>
                            <Icon name="RefreshCw" size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop UI */}
            <div className="hidden lg:block pb-10">
                <header className="bg-white rounded-[2rem] p-8 shadow-sm border border-indigo-50/50 mb-8 flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Icon name="History" size={20} /></div>
                            <span className="text-indigo-600 font-bold text-sm uppercase tracking-wider">Laporan Penjualan</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Riwayat Transaksi</h1>
                        <p className="text-gray-500 font-medium">Pantau semua transaksi penjualan toko Anda.</p>
                    </div>
                    <div className="relative z-10 flex gap-4">
                        <button
                            onClick={fetchTransactions}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Icon name="RefreshCw" size={18} className={isLoading ? 'animate-spin' : ''} />
                            Refresh Data
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Icon name="Wallet" size={32} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Pendapatan</p>
                            <h4 className="text-3xl font-black text-gray-800 tracking-tight">{formatCurrency(stats.total)}</h4>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Icon name="Receipt" size={32} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Transaksi</p>
                            <h4 className="text-3xl font-black text-gray-800 tracking-tight">{stats.count}</h4>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Icon name="TrendingUp" size={32} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Rata-rata / Transaksi</p>
                            <h4 className="text-3xl font-black text-gray-800 tracking-tight">{formatCurrency(stats.avg)}</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-4">
                            <div className="relative">
                                <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari ID atau nama menu..."
                                    className="pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 w-80"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <input
                                type="date"
                                className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                            <span className="self-center text-gray-400 font-bold">-</span>
                            <input
                                type="date"
                                className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-100">
                                    <th className="pb-4 pl-4 text-xs font-black text-gray-400 uppercase tracking-wider">ID Transaksi</th>
                                    <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-wider">Waktu</th>
                                    <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-wider">Detail Item</th>
                                    <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-wider">Metode</th>
                                    <th className="pb-4 pr-4 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="py-4 pl-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                            <td className="py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                            <td className="py-4"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                                            <td className="py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                            <td className="py-4 pr-4"><div className="h-4 bg-gray-100 rounded w-24 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((tx) => (
                                        <tr key={tx.id} onClick={() => setSelectedTransaction(tx)} className="group hover:bg-gray-50 transition-colors cursor-pointer">
                                            <td className="py-5 pl-4">
                                                <span className="font-bold text-gray-700 text-sm">#{tx.id}</span>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800 text-sm">{formatDate(tx.timestamp).split(' pukul ')[0]}</span>
                                                    <span className="text-xs text-gray-400 font-medium mt-0.5">{formatDate(tx.timestamp).split(' pukul ')[1]}</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <p className="text-sm font-medium text-gray-600 line-clamp-2">
                                                    {tx.items.map(i => `${i.name} (x${i.qty || i.quantity || 1})`).join(', ')}
                                                </p>
                                            </td>
                                            <td className="py-5">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tx.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                                                    tx.payment_method === 'qris' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {tx.payment_method || 'Tunai'}
                                                </span>
                                            </td>
                                            <td className="py-5 pr-4 text-right">
                                                <span className="font-black text-gray-800 text-base">{formatCurrency(tx.total)}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-gray-400 font-medium">
                                            Tidak ada transaksi ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Desktop Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8 gap-2">
                            <button
                                onClick={() => paginate(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-xl transition-all ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-indigo-600 hover:bg-indigo-50'}`}
                            >
                                <Icon name="ChevronLeft" size={20} />
                            </button>
                            <span className="flex items-center px-4 font-bold text-gray-600">
                                Halaman {currentPage} dari {totalPages}
                            </span>
                            <button
                                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-xl transition-all ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-indigo-600 hover:bg-indigo-50'}`}
                            >
                                <Icon name="ChevronRight" size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile UI */}
            <div className="pb-24 overflow-x-hidden lg:hidden">

                <header className="bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-500 pt-24 pb-12 px-6 rounded-b-[2.5rem] shadow-xl relative z-10">
                    <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
                        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-100 font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full">Report History</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Riwayat<br />Transaksi</h1>
                        <p className="text-blue-100 font-medium opacity-90">Total {stats.count} transaksi tercatat.</p>

                        <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl flex justify-between items-center group active:scale-95 transition-all">
                            <div>
                                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Total Pendapatan</p>
                                <h2 className="text-2xl font-black text-white">{formatCurrency(stats.total)}</h2>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Icon name="TrendingUp" className="text-white" size={24} />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="px-5 mt-8 space-y-6">
                    {/* Filters Mobile */}
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
                        <div className="relative flex-shrink-0 w-64">
                            <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari transaksi..."
                                className="pl-10 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl text-sm font-bold w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <input
                            type="date"
                            className="flex-shrink-0 px-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-auto"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>

                    {/* Transaction List Mobile */}
                    <div className="space-y-4">
                        {isLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />)
                        ) : currentItems.length > 0 ? (
                            currentItems.map((tx) => (
                                <div key={tx.id} onClick={() => setSelectedTransaction(tx)} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider rounded-full mb-2">
                                                #{tx.id}
                                            </span>
                                            <p className="text-xs text-gray-400 font-bold">{formatDate(tx.timestamp)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 ${tx.payment_method === 'cash' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {tx.payment_method || 'Tunai'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-dashed border-gray-100 my-3"></div>

                                    <div className="space-y-2 mb-4">
                                        {tx.items.slice(0, 3).map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600 font-medium truncate pr-4">{item.name}</span>
                                                <span className="text-gray-400 font-bold whitespace-nowrap">x{item.qty || item.quantity}</span>
                                            </div>
                                        ))}
                                        {tx.items.length > 3 && (
                                            <p className="text-xs text-indigo-500 font-bold italic">+ {tx.items.length - 3} item lainnya</p>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Total Bayar</span>
                                        <span className="text-lg font-black text-gray-900">{formatCurrency(tx.total)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-10 text-center">
                                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
                                    <Icon name="Receipt" size={24} />
                                </div>
                                <p className="text-gray-400 font-medium">Belum ada riwayat transaksi<br />yang sesuai filter.</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 gap-3 pb-8">
                            <button
                                onClick={() => {
                                    paginate(Math.max(1, currentPage - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === 1}
                                className={`p-3 rounded-xl transition-all shadow-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-600 active:scale-95'}`}
                            >
                                <Icon name="ChevronLeft" size={24} />
                            </button>
                            <span className="flex items-center px-4 bg-white rounded-xl shadow-sm text-sm font-bold text-gray-800">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => {
                                    paginate(Math.min(totalPages, currentPage + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === totalPages}
                                className={`p-3 rounded-xl transition-all shadow-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-600 active:scale-95'}`}
                            >
                                <Icon name="ChevronRight" size={24} />
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full h-full sm:h-auto max-w-lg rounded-none sm:rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-12 duration-300 sm:max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Detail Transaksi</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">#{selectedTransaction.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"
                            >
                                <Icon name="X" size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {/* Date & Status */}
                            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Waktu Transaksi</span>
                                    <span className="font-bold text-gray-700">{formatDate(selectedTransaction.timestamp)}</span>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="text-sm font-black text-gray-900 mb-3 uppercase tracking-wider">Item Dipesan</h4>
                                <div className="space-y-3">
                                    {selectedTransaction.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    x{item.qty || item.quantity}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</p>
                                                    <p className="text-xs text-gray-400 font-medium">@{formatCurrency(item.price)}</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-gray-900 text-sm">
                                                {formatCurrency((item.price * (item.qty || item.quantity)))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Detail */}
                            <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Subtotal</span>
                                    <span className="font-bold text-gray-900">{formatCurrency(selectedTransaction.total)}</span>
                                </div>
                                {selectedTransaction.ppn > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Pajak (PPN)</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(selectedTransaction.ppn)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm items-center pt-2">
                                    <span className="text-gray-900 font-black text-lg">Total Bayar</span>
                                    <span className="font-black text-indigo-600 text-xl">{formatCurrency(selectedTransaction.total)}</span>
                                </div>
                            </div>

                            <div className="bg-indigo-50 p-4 rounded-2xl flex justify-between items-center">
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Metode Pembayaran</span>
                                <span className="font-black text-indigo-700 uppercase">{selectedTransaction.payment_method || 'TUNAI'}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/seller/receipt', { state: { transaction: selectedTransaction } })}
                                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Icon name="Receipt" size={20} />
                                Lihat Struk
                            </button>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerTransactionHistory;
