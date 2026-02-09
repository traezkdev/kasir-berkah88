
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { toast } from 'react-hot-toast';

const SellerTransactionTrash = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [txToDelete, setTxToDelete] = useState(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        fetchTrashedTransactions();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchTrashedTransactions = async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/transactions/trash`);
            const data = await response.json();

            if (response.ok && data.message === 'success') {
                const parsedData = data.data.map(t => ({
                    ...t,
                    timestamp: new Date(t.timestamp),
                    deleted_at: new Date(t.deleted_at),
                    items: typeof t.items === 'string' ? JSON.parse(t.items || '[]') : (t.items || [])
                }));
                setTransactions(parsedData);
            }
        } catch (error) {
            console.error("Error fetching trash:", error);
            toast.error('Gagal mengambil data sampah');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (id) => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/transactions/${id}/restore`, {
                method: 'PUT'
            });
            const data = await response.json();

            if (response.ok && data.message === 'restored') {
                toast.success('Transaksi berhasil dipulihkan');
                fetchTrashedTransactions();
            } else {
                toast.error(data.error || 'Gagal memulihkan transaksi');
            }
        } catch (error) {
            console.error("Restore error:", error);
            toast.error('Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePermanentDelete = (id) => {
        setTxToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmPermanentDelete = async () => {
        if (!txToDelete) return;

        setIsLoading(true);
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/transactions/${txToDelete}/permanent`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok && data.message === 'permanently deleted') {
                toast.success('Transaksi dihapus permanen');
                setShowDeleteConfirm(false);
                setTxToDelete(null);
                fetchTrashedTransactions();
            } else {
                toast.error(data.error || 'Gagal menghapus permanen');
            }
        } catch (error) {
            console.error("Permanent delete error:", error);
            toast.error('Terjadi kesalahan');
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

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [transactions, searchTerm]);

    return (
        <div className="pb-10 animate-in fade-in duration-500 lg:static -mx-4 -mt-4 lg:mx-0 lg:mt-0">
            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-50 lg:hidden">
                <div className={`absolute inset-0 bg-white transition-opacity duration-200 ease-in-out ${scrolled ? 'opacity-100 shadow-sm' : 'opacity-0'}`} />
                <div className={`relative z-10 px-6 flex justify-between items-center transition-all duration-200 ease-in-out ${scrolled ? 'py-3 text-gray-800' : 'py-5 text-white'}`}>
                    <button onClick={() => navigate(-1)} className={`p-2 rounded-xl scale-110 active:scale-95 transition-all ${scrolled ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'}`}>
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <span className={`font-black tracking-tight flex-1 text-center transition-opacity duration-300 ${scrolled ? 'opacity-100 text-gray-800' : 'opacity-0 text-white'}`}>
                        Tong Sampah
                    </span>
                    <button onClick={fetchTrashedTransactions} className={`p-2 rounded-xl active:scale-90 transition-all ${scrolled ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'}`}>
                        <Icon name="RefreshCw" size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Desktop UI */}
            <div className="hidden lg:block pb-10">
                <header className="bg-white rounded-[2rem] p-8 shadow-sm border border-red-50/50 mb-8 flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-red-100 p-2 rounded-xl text-red-600"><Icon name="Trash2" size={20} /></div>
                            <span className="text-red-600 font-bold text-sm uppercase tracking-wider">Storage Terhapus</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Tong Sampah</h1>
                        <p className="text-gray-500 font-medium">Transaksi yang dihapus sementara dapat dipulihkan di sini.</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Icon name="ArrowLeft" size={18} />
                        Kembali
                    </button>
                </header>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="relative">
                            <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari di sampah..."
                                className="pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-red-500 w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-gray-400 text-[10px] uppercase font-black tracking-widest px-4">
                                    <th className="px-6 py-4">ID Transaksi</th>
                                    <th className="px-6 py-4">Dihapus Pada</th>
                                    <th className="px-6 py-4 text-center">Items</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="group bg-white hover:bg-red-50/30 transition-all">
                                        <td className="px-6 py-5 first:rounded-l-2xl border-y border-l border-gray-50 group-hover:border-red-100">
                                            <span className="font-black text-gray-900 tracking-tight text-sm">#{tx.id}</span>
                                        </td>
                                        <td className="px-6 py-5 border-y border-gray-50 group-hover:border-red-100">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-700 text-sm">{formatDate(tx.deleted_at)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 border-y border-gray-50 group-hover:border-red-100">
                                            <div className="flex justify-center -space-x-2">
                                                {tx.items.slice(0, 3).map((item, i) => (
                                                    <div key={i} title={item.name} className="w-8 h-8 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-red-600">
                                                        {item.name.charAt(0)}
                                                    </div>
                                                ))}
                                                {tx.items.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-gray-600">
                                                        +{tx.items.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 border-y border-gray-50 group-hover:border-red-100 text-right">
                                            <span className="font-black text-gray-900 text-sm">{formatCurrency(tx.total)}</span>
                                        </td>
                                        <td className="px-6 py-5 last:rounded-r-2xl border-y border-r border-gray-50 group-hover:border-red-100 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleRestore(tx.id)}
                                                    className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                                                    title="Pulihkan"
                                                >
                                                    <Icon name="RotateCcw" size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(tx.id)}
                                                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                                    title="Hapus Permanen"
                                                >
                                                    <Icon name="Trash2" size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && !isLoading && (
                            <div className="py-20 text-center">
                                <Icon name="Trash2" size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-bold">Tong sampah kosong</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile UI - List View */}
            <div className="lg:hidden px-4 pt-24 pb-20 space-y-4">
                {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Dihapus Pada</p>
                                <p className="font-bold text-gray-800 text-sm leading-none">{formatDate(tx.deleted_at)}</p>
                                <p className="text-gray-400 text-[10px] font-bold mt-2 tracking-tight">#{tx.id}</p>
                            </div>
                            <span className="font-black text-gray-900 text-lg">{formatCurrency(tx.total)}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRestore(tx.id)}
                                className="flex-1 bg-green-50 text-green-600 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <Icon name="RotateCcw" size={16} />
                                Pulihkan
                            </button>
                            <button
                                onClick={() => handlePermanentDelete(tx.id)}
                                className="flex-1 bg-red-50 text-red-600 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <Icon name="Trash2" size={16} />
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Permanent Delete Confirmation Popup */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                <Icon name="AlertTriangle" size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Hapus Permanen?</h3>
                            <p className="text-gray-500 font-bold text-sm leading-relaxed mb-8">
                                Transaksi <span className="text-gray-900 font-black">#{txToDelete}</span> akan dihapus selamanya. Tindakan ini tidak dapat dibatalkan!
                            </p>
                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={confirmPermanentDelete}
                                    className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Icon name="RefreshCw" size={20} className="animate-spin" /> : 'Ya, Hapus Permanen'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setTxToDelete(null);
                                    }}
                                    className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
                                    disabled={isLoading}
                                >
                                    Batalkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerTransactionTrash;
