import React from 'react';
import { Plus, Target, TrendingUp, Wallet, ArrowRight, ChevronRight } from 'lucide-react';
import { mockSavings } from '../../mock/data';

const TabunganMobile = () => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="pb-24 space-y-8 px-6 pt-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Target Menabung</h1>
        <button className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100 italic">
          <Plus size={20} />
        </button>
      </div>

      {/* Hero Stats Mobile */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-2">
          <Wallet size={32} />
        </div>
        <p className="text-[10px] font-bold text-gray-400 border border-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">Saldo Tabungan Sekarang</p>
        <p className="text-3xl font-black text-gray-900">
          {formatCurrency(mockSavings.reduce((acc, curr) => acc + curr.current, 0))}
        </p>
      </div>

      {/* Goals List Mobile */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daftar Impian</p>
          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md font-bold">{mockSavings.length} Target</span>
        </div>

        {mockSavings.map((item) => {
          const progress = (item.current / item.target) * 100;
          return (
            <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col gap-6 active:scale-[0.98] transition-all overflow-hidden relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Target size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.name}</h3>
                    <p className="text-[10px] font-bold text-green-600">{Math.round(progress)}% Tercapai</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-gray-400">Target</p>
                   <p className="text-xs font-black text-gray-800">{formatCurrency(item.target)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden p-1">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black italic uppercase text-gray-400">
                  <span className="text-indigo-600">{formatCurrency(item.current)}</span>
                  <span>Sisa {formatCurrency(item.target - item.current)} Lagi</span>
                </div>
              </div>

              <button className="w-full bg-gray-50 text-indigo-600 px-4 py-3 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 active:bg-indigo-600 active:text-white transition-all">
                Tambah Saldo Tabungan <ChevronRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Tip Card Mobile */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-[2.5rem] border border-indigo-100 flex items-start gap-4">
         <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
            <TrendingUp size={24} />
         </div>
         <div>
            <p className="text-xs font-bold text-gray-800 mb-1">Tips Menabung</p>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Sisihkan minimal 10% dari pemasukan setiap bulan untuk mempercepat target impianmu.</p>
         </div>
      </div>
    </div>
  );
};

export default TabunganMobile;
