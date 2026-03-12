import React from 'react';
import { Plus, Target, TrendingUp, Wallet, ArrowRight, MoreVertical } from 'lucide-react';
import { mockSavings } from '../mock/data';

const Tabungan = () => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const totalCurrent = mockSavings.reduce((acc, curr) => acc + curr.current, 0);
  const totalTarget = mockSavings.reduce((acc, curr) => acc + curr.target, 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Target Tabungan</h1>
          <p className="text-gray-500">Wujudkan impianmu dengan menabung secara konsisten.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus size={20} />
          <span>Tambah Target Baru</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Tabungan</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(totalCurrent)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
            <Target size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Target Kumulatif</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(totalTarget)}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white flex items-center gap-5">
          <div className="p-4 bg-white/20 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mb-1">Sisa Kekurangan</p>
            <p className="text-2xl font-black">{formatCurrency(totalTarget - totalCurrent)}</p>
          </div>
        </div>
      </div>

      {/* Savings Goal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockSavings.map((item) => {
          const progress = (item.current / item.target) * 100;
          return (
            <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <Target size={30} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-400 font-medium">Progress Impian Anda</p>
                  </div>
                </div>
                <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                  <MoreVertical size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terkumpul</p>
                    <p className="text-2xl font-black text-indigo-600">{formatCurrency(item.current)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Akhir</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(item.target)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden p-1">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-sm shadow-indigo-200"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span className="text-indigo-600">{Math.round(progress)}% Capaian</span>
                    <span className="text-gray-400">Sisa {formatCurrency(item.target - item.current)} Lagi</span>
                  </div>
                </div>

                <div className="pt-4">
                   <button className="w-full py-4 bg-gray-50 text-indigo-600 font-bold rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 group/btn">
                     <span>Tambah Tabungan</span>
                     <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Create New Placeholder */}
        <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center p-12 group hover:border-indigo-300 transition-all cursor-pointer">
           <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300 group-hover:text-indigo-400 mb-4 transition-colors">
             <Plus size={32} />
           </div>
           <p className="text-gray-400 font-bold group-hover:text-indigo-400 transition-colors">Buat Target Baru</p>
        </div>
      </div>
    </div>
  );
};

export default Tabungan;
