import React from 'react';
import { Plus, HandCoins, Calendar, Clock, ChevronRight } from 'lucide-react';
import { mockDebts } from '../mock/data';

const Utang = () => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Utang</h1>
          <p className="text-gray-500">Pantau utangmu dan piutang orang lain ke kamu.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus size={20} />
          <span>Tambah Catatan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Utang Saya */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <HandCoins size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Utang Saya</h3>
          </div>
          <div className="space-y-4">
            {mockDebts.filter(d => d.status === 'utang').map(debt => (
              <div key={debt.id} className="p-4 border border-gray-50 bg-gray-50/50 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-wider">{debt.name}</p>
                    <p className="text-sm text-gray-500">{debt.note}</p>
                  </div>
                  <p className="font-bold text-red-600">{formatCurrency(debt.amount)}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {debt.date}</span>
                    <span className="flex items-center gap-1 text-orange-500 font-bold"><Clock size={12} /> Jatuh Tempo: {debt.dueDate}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Piutang (Orang Utang ke Saya) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <HandCoins size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Piutang (Orang Utang)</h3>
          </div>
          <div className="space-y-4">
            {mockDebts.filter(d => d.status === 'piutang').map(debt => (
              <div key={debt.id} className="p-4 border border-gray-50 bg-gray-50/50 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-wider">{debt.name}</p>
                    <p className="text-sm text-gray-500">{debt.note}</p>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(debt.amount)}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {debt.date}</span>
                    <span className="flex items-center gap-1 text-indigo-500 font-bold"><Clock size={12} /> Jatuh Tempo: {debt.dueDate}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Utang;
