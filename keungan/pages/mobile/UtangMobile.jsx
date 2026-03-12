import React, { useState } from 'react';
import { Plus, HandCoins, Calendar, Clock, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { mockDebts } from '../../mock/data';

const UtangMobile = () => {
  const [activeTab, setActiveTab] = useState('utang'); // 'utang' or 'piutang'

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const filteredDebts = mockDebts.filter(d => d.status === activeTab);

  return (
    <div className="pb-24 space-y-6 px-6 pt-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Utang & Piutang</h1>
        <button className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-100">
          <Plus size={20} />
        </button>
      </div>

      {/* Tab Switcher Mobile */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
        <button 
          onClick={() => setActiveTab('utang')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'utang' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400'}`}
        >
          Utang Saya
        </button>
        <button 
          onClick={() => setActiveTab('piutang')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'piutang' ? 'bg-green-50 text-green-600 shadow-sm' : 'text-gray-400'}`}
        >
          Piutang Saya
        </button>
      </div>

      {/* Stats Summary Mobile */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-50 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Utang</p>
          <p className="text-sm font-bold text-red-600">
            {formatCurrency(mockDebts.filter(d => d.status === 'utang').reduce((acc, curr) => acc + curr.amount, 0))}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-50 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Piutang</p>
          <p className="text-sm font-bold text-green-600">
            {formatCurrency(mockDebts.filter(d => d.status === 'piutang').reduce((acc, curr) => acc + curr.amount, 0))}
          </p>
        </div>
      </div>

      {/* Debt List Mobile */}
      <div className="space-y-4">
        {filteredDebts.map((debt) => (
          <div key={debt.id} className="bg-white p-5 rounded-[1.8rem] border border-gray-50 shadow-sm flex flex-col gap-4 active:scale-[0.98] transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeTab === 'utang' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  <HandCoins size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">{debt.name}</p>
                  <p className="text-xs text-gray-400">{debt.note}</p>
                </div>
              </div>
              <p className={`font-black text-sm ${activeTab === 'utang' ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(debt.amount)}
              </p>
            </div>
            
            <div className="h-px bg-gray-50 w-full"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  <Calendar size={12} />
                  <span>{debt.date}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md ${activeTab === 'utang' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Clock size={12} />
                  <span>Jatuh Tempo: {debt.dueDate}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </div>
        ))}
        
        {filteredDebts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-sm font-medium">Tidak ada catatan ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UtangMobile;
