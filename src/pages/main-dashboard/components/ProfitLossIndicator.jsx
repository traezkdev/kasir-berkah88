import React from 'react';
import Icon from '../../../components/AppIcon';

const ProfitLossIndicator = ({ revenue = 0, expenses = 0, periodLabel = 'Bulan Ini' }) => {
    const profit = revenue - expenses;
    const isProfit = profit >= 0;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })?.format(Math.abs(amount));
    };

    return (
        <div className={`p-6 rounded-xl border ${isProfit ? 'bg-emerald-600/10 border-emerald-500/20' : 'bg-rose-600/10 border-rose-500/20'} transition-all hover:shadow-lg flex flex-col gap-4 shadow-sm backdrop-blur-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${isProfit ? 'bg-emerald-600/20 text-emerald-600' : 'bg-rose-600/20 text-rose-600'}`}>
                        <Icon name={isProfit ? "TrendingUp" : "TrendingDown"} size={20} />
                    </div>
                    <div className="flex flex-col">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>Analisis Performa</p>
                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tighter uppercase">Laba Bersih {periodLabel}</h3>
                    </div>
                </div>
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${isProfit ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'}`}>
                    {isProfit ? 'Untung' : 'Rugi'}
                </span>
            </div>

            <div className="flex flex-col gap-1.5">
                <p className={`text-3xl font-mono font-black tracking-tight ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {profit < 0 && '-'} {formatCurrency(profit)}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium">
                    {isProfit
                        ? 'Bisnis menghasilkan keuntungan pada periode ini. Uang yang dihasilkan melebihi biaya yang dikeluarkan.'
                        : 'Bisnis mengalami kerugian pada periode ini. Pengeluaran melebihi pendapatan yang diterima.'}
                </p>
            </div>

            <div className={`pt-4 border-t ${isProfit ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Rincian Perhitungan</p>
                <div className="flex items-center gap-2 flex-wrap bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-white/50 dark:border-slate-700/50">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-indigo-500/70 uppercase">Pendapatan</span>
                        <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(revenue)}</span>
                    </div>
                    <span className="text-sm text-gray-400 font-black px-1">−</span>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-rose-500/70 uppercase">Pengeluaran</span>
                        <span className="text-xs font-mono font-black text-rose-500 dark:text-rose-400">{formatCurrency(expenses)}</span>
                    </div>
                    <span className="text-sm text-gray-400 font-black px-1">=</span>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-emerald-500/70 uppercase">Laba</span>
                        <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg ${isProfit ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'}`}>
                            {profit < 0 && '-'} {formatCurrency(profit)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitLossIndicator;
