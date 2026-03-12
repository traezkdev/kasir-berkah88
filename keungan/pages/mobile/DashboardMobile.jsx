import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  Plus,
  TrendingUp
} from 'lucide-react';
import { mockStats, mockTransactions, mockSavings } from '../../mock/data';

const DashboardMobile = () => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="pb-24 space-y-6 px-6 pt-4">
      {/* Balance Card Mobile */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <p className="text-white/70 text-sm font-medium mb-1">Total Saldo Anda</p>
        <h2 className="text-3xl font-bold mb-6">{formatCurrency(mockStats.totalBalance)}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
            <div className="flex items-center gap-2 text-white/70 text-[10px] font-bold uppercase mb-1">
              <ArrowUpRight size={12} />
              <span>Pemasukan</span>
            </div>
            <p className="font-bold text-sm tracking-tight">{formatCurrency(mockStats.monthlyIncome)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
            <div className="flex items-center gap-2 text-white/70 text-[10px] font-bold uppercase mb-1">
              <ArrowDownRight size={12} />
              <span>Pengeluaran</span>
            </div>
            <p className="font-bold text-sm tracking-tight">{formatCurrency(mockStats.monthlyExpense)}</p>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-50">
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-indigo-600 font-bold text-sm">
          <Plus size={18} />
          <span>Transaksi</span>
        </button>
        <div className="w-px h-6 bg-gray-100"></div>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-500 font-bold text-sm">
          <TrendingUp size={18} />
          <span>Laporan</span>
        </button>
      </div>

      {/* Target Tabungan Mobile */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Target Saya</h3>
          <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">Lihat Semua</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {mockSavings.map(item => (
            <div key={item.id} className="min-w-[240px] bg-white p-5 rounded-3xl border border-gray-50 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Target size={20} />
                </div>
                <span className="text-xs font-bold text-gray-400">{Math.round((item.current/item.target)*100)}%</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                <p className="text-[11px] text-gray-400">Tersimpan {formatCurrency(item.current)}</p>
              </div>
              <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${(item.current/item.target)*100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Mobile */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Transaksi Terakhir</h3>
        <div className="space-y-3">
          {mockTransactions.slice(0, 5).map(tx => (
            <div key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{tx.category}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">{tx.date}</p>
                </div>
              </div>
              <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-gray-800'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardMobile;
