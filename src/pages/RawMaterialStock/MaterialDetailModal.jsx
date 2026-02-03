import React from 'react';
import { FaBox, FaCubes, FaExclamationTriangle, FaTimes, FaLayerGroup, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';

const MaterialDetailModal = ({ isOpen, onClose, material }) => {
    if (!isOpen || !material) return null;

    const currentStock = Number(material.current_stock) || 0;
    const menuStock = Number(material.menu_stock) || 0;
    const totalStock = currentStock + menuStock;
    const minStock = Number(material.stok_minimum) || 0;

    const isLowStock = totalStock < minStock;
    const stockPercentage = minStock > 0 ? Math.min((totalStock / minStock) * 100, 100) : 100;

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);

    // Unit calculable check (sync with index.jsx logic)
    const isUnitCalculable = (unitName) => {
        if ((unitName || '').toLowerCase() === 'gram') return false;
        // For simplicity in this modal, we assume other units are calculable 
        // since we don't have the full units list here, but we can pass it as prop if needed.
        // However, the requested 'gram' logic is the most critical.
        return true;
    };

    const calculable = isUnitCalculable(material.unit);
    const rawValue = calculable ? (currentStock * (Number(material.raw_stock_price) || 0)) : (currentStock > 0 ? (Number(material.raw_stock_price) || 0) : 0);
    const menuValue = calculable ? (menuStock * (Number(material.price_per_item) || 0)) : (menuStock > 0 ? (Number(material.price_per_item) || 0) : 0);
    const estimatedTotal = rawValue + menuValue;

    return (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">

                {/* Header Decor */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#118EEA] to-blue-700 opacity-10 dark:opacity-20 pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-all active:scale-90 z-20"
                >
                    <FaTimes size={18} />
                </button>

                <div className="relative p-8 lg:p-10">
                    {/* Title Section */}
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                            <FaLayerGroup size={28} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Detail Bahan</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-[#118EEA] text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
                                    {material.unit}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 font-bold text-sm">ID: #{material.id}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Stock Info */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Rincian Produk</h3>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase">{material.name}</h4>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform hover:scale-[1.02]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <FaBox size={14} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Stok Mentah</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{currentStock} {material.unit}</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform hover:scale-[1.02]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <FaCubes size={14} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Stok Menu</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{menuStock} {material.unit}</span>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Kapasitas Stok</span>
                                            <span className="text-sm font-black text-slate-900 dark:text-white">{totalStock} / {minStock} {material.unit}</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-slate-800 shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-[#118EEA]'}`}
                                                style={{ width: `${stockPercentage}%` }}
                                            />
                                        </div>
                                        {isLowStock && (
                                            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20 flex items-center gap-3 animate-bounce">
                                                <FaExclamationTriangle className="text-rose-500" size={16} />
                                                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Peringatan: Stok Menipis!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Pricing & Values */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Informasi Harga</h3>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Estimasi Nilai Total</p>
                                        <p className="text-3xl font-black text-[#118EEA] drop-shadow-sm">{formatCurrency(estimatedTotal)}</p>
                                        {(!calculable) && (
                                            <p className="text-[10px] font-bold text-rose-500 mt-1 italic">* Satuan {material.unit} tidak dikalikan (harga tetap)</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaMoneyBillWave className="text-amber-500" size={14} />
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Harga Stok Mentah</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(material.raw_stock_price)}</p>
                                        </div>

                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaChartLine className="text-purple-500" size={14} />
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Harga Per Item Menu</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(material.price_per_item)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Area */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-black uppercase tracking-[0.1em] rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            Tutup Detail
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialDetailModal;
