import React, { useState } from 'react';
import { Plus, PieChart, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { mockBudgets } from '../../mock/data';

const BudgetMobile = () => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-orange-500';
    return 'bg-indigo-600';
  };

  return (
    <div className="pb-24 space-y-6 px-6 pt-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Budgeting</h1>
        <button className="bg-white border border-gray-100 p-2.5 rounded-2xl shadow-sm text-indigo-600">
          <Plus size={20} />
        </button>
      </div>

      {/* Hero Card Budget Mobile */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs font-medium text-indigo-100 uppercase tracking-widest mb-1">Total Sisa Budget</p>
          <p className="text-2xl font-black mb-6">
            {formatCurrency(mockBudgets.reduce((acc, curr) => acc + (curr.limit - curr.used), 0))}
          </p>
          <div className="flex items-center gap-3">
             <div className="flex-1 bg-white/20 backdrop-blur-md rounded-2xl p-3">
                <p className="text-[10px] font-bold text-indigo-100 uppercase mb-1">Total Limit</p>
                <p className="text-sm font-bold">{formatCurrency(mockBudgets.reduce((acc, curr) => acc + curr.limit, 0))}</p>
             </div>
             <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3">
                <p className="text-[10px] font-bold text-indigo-100 uppercase mb-1">Terpakai</p>
                <p className="text-sm font-bold">{formatCurrency(mockBudgets.reduce((acc, curr) => acc + curr.used, 0))}</p>
             </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* List Budget Mobile */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Kategori Anggaran</p>
        
        {mockBudgets.map((budget) => {
          const percent = Math.min((budget.used / budget.limit) * 100, 100);
          const isWarning = percent >= 90;

          return (
            <div key={budget.id} className="bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm space-y-4 active:scale-[0.98] transition-all">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isWarning ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    <PieChart size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-gray-800">{budget.category}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Sisa: {formatCurrency(budget.limit - budget.used)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400">Terpakai</p>
                  <p className={`text-xs font-black ${isWarning ? 'text-red-600' : 'text-gray-800'}`}>{Math.round(percent)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${getProgressColor(percent)}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase italic">
                  <span>{formatCurrency(budget.used)}</span>
                  <span>Limit: {formatCurrency(budget.limit)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Mobile */}
      <button className="w-full bg-white border-2 border-dashed border-gray-200 py-4 rounded-3xl text-gray-400 text-xs font-bold hover:border-indigo-300 hover:text-indigo-400 transition-all flex items-center justify-center gap-2">
        <Plus size={16} />
        Tambah Kategori Baru
      </button>
    </div>
  );
};

export default BudgetMobile;
