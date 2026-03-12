import React, { useState } from 'react';
import { Plus, PieChart, TrendingUp, AlertTriangle, MoreVertical, Search, Edit2, Trash2 } from 'lucide-react';
import { mockBudgets } from '../mock/data';

const Budget = () => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredBudgets = mockBudgets.filter(b => 
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Anggaran Bulanan</h1>
          <p className="text-gray-500">Batasi pengeluaranmu agar tidak over-budget.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus size={20} />
          <span>Buat Budget Baru</span>
        </button>
      </div>

      {/* Grid Budget Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBudgets.map((budget) => {
          const percent = Math.min((budget.used / budget.limit) * 100, 100);
          const isWarning = percent >= 90;

          return (
            <div key={budget.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${isWarning ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <PieChart size={24} />
                </div>
                <div className="flex items-center gap-2">
                  {isWarning && (
                    <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-bounce">
                      <AlertTriangle size={12} />
                      Warning
                    </div>
                  )}
                  <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{budget.category}</h3>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-400">Terpakai: {formatCurrency(budget.used)}</span>
                    <span className="text-gray-800 font-bold">Limit: {formatCurrency(budget.limit)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${getProgressColor(percent)}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress: {Math.round(percent)}%</p>
                    <p className={`text-xs font-bold ${isWarning ? 'text-red-600' : 'text-indigo-600'}`}>
                      Sisa: {formatCurrency(budget.limit - budget.used)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all">
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Budget;
