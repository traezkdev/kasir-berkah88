import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  Plus,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';

const DashboardMobile = ({ setActivePage }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      setError('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-center">Menyiapkan<br/>Dashboard Anda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-red-500 px-10 text-center">
        <AlertCircle size={40} />
        <p className="font-bold text-sm tracking-tight">{error}</p>
        <button onClick={fetchDashboardData} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Coba Lagi</button>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6 px-6 pt-4">
      {/* Balance Card Mobile */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Total Saldo Anda</p>
        <h2 className="text-3xl font-black mb-6 italic tracking-tighter">{formatCurrency(stats.totalBalance)}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-white/70 text-[9px] font-black uppercase mb-1">
              <ArrowUpRight size={10} />
              <span>Masuk (Bulan Ini)</span>
            </div>
            <p className="font-black text-xs tracking-tight">{formatCurrency(stats.monthlyIncome)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-white/70 text-[9px] font-black uppercase mb-1">
              <ArrowDownRight size={10} />
              <span>Keluar (Bulan Ini)</span>
            </div>
            <p className="font-black text-xs tracking-tight">{formatCurrency(stats.monthlyExpense)}</p>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-50">
        <button 
          onClick={() => setActivePage('transaksi')}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-indigo-600 font-black text-xs uppercase tracking-widest"
        >
          <Plus size={16} />
          <span>Transaksi</span>
        </button>
        <div className="w-px h-6 bg-gray-100"></div>
        <button 
          onClick={() => setActivePage('laporan')}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-500 font-black text-xs uppercase tracking-widest"
        >
          <TrendingUp size={16} />
          <span>Laporan</span>
        </button>
      </div>

      {/* Target Tabungan Mobile */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-black text-gray-800 italic uppercase">Target Saya</h3>
          <button 
            onClick={() => setActivePage('tabungan')}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full"
          >
            Semua
          </button>
        </div>
        
        {stats.savings.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-gray-400 text-[10px] font-bold uppercase italic">
            Belum ada target tabungan aktif
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {stats.savings.map(item => {
              const percentage = Math.round((item.current_amount / item.target_amount) * 100);
              return (
                <div 
                  key={item.id} 
                  onClick={() => setActivePage('tabungan')}
                  className="min-w-[260px] bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm flex flex-col gap-4 active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-50">
                      <Target size={18} />
                    </div>
                    <span className="text-[10px] font-black italic bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{percentage}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800 line-clamp-1 italic uppercase tracking-tight">{item.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{formatCurrency(item.current_amount)} TERKUMPUL</p>
                  </div>
                  <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions Mobile */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-black text-gray-800 italic uppercase tracking-tight">Riwayat</h3>
          <button 
            onClick={() => setActivePage('transaksi')}
            className="text-[10px] font-black uppercase tracking-widest text-gray-400"
          >
            Lainnya
          </button>
        </div>
        <div className="space-y-3">
          {stats.recentTransactions.length === 0 ? (
             <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 text-gray-400 text-[10px] font-bold uppercase">Belum ada transaksi</div>
          ) : (
            stats.recentTransactions.map(tx => (
              <div 
                key={tx.id} 
                onClick={() => setActivePage('transaksi')}
                className="bg-white p-4 rounded-2xl border border-gray-50 flex items-center justify-between active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800 italic uppercase tracking-tight">{tx.category}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
                      {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <p className={`font-black text-sm tracking-tighter ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardMobile;
