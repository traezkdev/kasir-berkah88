import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Target,
  Loader2,
  AlertCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import api from '../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Dashboard = ({ setActivePage }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      setError('Gagal memuat data dashboard. Pastikan server aktif.');
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
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-gray-400">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="font-black uppercase tracking-[0.3em] text-[10px] text-indigo-400">Menyiapkan Dashboard Anda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-rose-500">
        <AlertCircle size={48} />
        <p className="font-black">{error}</p>
        <button onClick={fetchDashboardData} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 mt-2 transition-transform hover:scale-105 active:scale-95">Coba Lagi</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Ringkasan Keuangan</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Selamat datang kembali! Berikut kondisi keuanganmu hari ini.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setActivePage('transaksi')}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3.5 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={18} strokeWidth={3} />
            <span>Transaksi</span>
          </button>
          <button 
            onClick={() => setActivePage('tabungan')}
            className="flex-1 md:flex-none bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-slate-800 px-6 py-3.5 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Target size={18} strokeWidth={3} />
            <span>Tabungan</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Saldo Utama" 
          value={stats.totalBalance} 
          icon={Wallet} 
          color="indigo" 
        />
        <StatCard 
          title="Pemasukan Bulan Ini" 
          value={stats.monthlyIncome} 
          icon={ArrowUpRight} 
          color="green" 
        />
        <StatCard 
          title="Pengeluaran Bulan Ini" 
          value={stats.monthlyExpense} 
          icon={ArrowDownRight} 
          color="red" 
        />
        <StatCard 
          title="Total Utang Aktif" 
          value={stats.totalDebt} 
          icon={Clock} 
          color="orange" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8">Arus Kas (7 Hari Terakhir)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.cashflow}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={15} />
                <YAxis hide />
                <Tooltip 
                  cursor={{stroke: '#4F46E5', strokeWidth: 2, strokeOpacity: 0.1}} 
                  contentStyle={{
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                  }} 
                  itemStyle={{fontWeight: '900', fontSize: '12px'}}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="income" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories / Budget Info */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Budget Terpakai</h3>
            <button onClick={() => setActivePage('budget')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline">Detail</button>
          </div>
          <div className="space-y-8">
            {stats.budgets.length === 0 ? (
               <div className="py-20 text-center text-gray-400 italic text-sm font-medium">Belum ada budget yang diatur.</div>
            ) : (
              stats.budgets.slice(0, 4).map((budget) => {
                const percentage = Math.min(Math.round((budget.used_amount / budget.limit_amount) * 100), 100);
                return (
                  <div key={budget.id}>
                    <div className="flex justify-between items-center mb-3 text-[10px] font-black uppercase tracking-[0.15em]">
                      <span className="text-gray-500 dark:text-gray-400">{budget.category}</span>
                      <span className={percentage > 90 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-slate-700">
                      <div 
                        className={`h-full rounded-full transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1) ${
                          percentage > 90 
                            ? 'bg-rose-500 shadow-lg shadow-rose-200 dark:shadow-rose-900/20' 
                            : 'bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-3 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      <span>{formatCurrency(budget.used_amount)}</span>
                      <span>{formatCurrency(budget.limit_amount)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Transaksi Terakhir</h3>
            <button onClick={() => setActivePage('transaksi')} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-[0.2em]">Lihat Semua</button>
          </div>
          <div className="space-y-2">
            {stats.recentTransactions.length === 0 ? (
               <div className="py-20 text-center text-gray-400 italic text-sm font-medium">Belum ada transaksi terhitung.</div>
            ) : (
              stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all group border border-transparent hover:border-gray-100 dark:hover:border-slate-700 cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-lg transition-transform group-hover:scale-110 ${
                      tx.type === 'income' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight size={20} strokeWidth={3} /> : <ArrowDownRight size={20} strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase text-xs tracking-wider">{tx.category}</p>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">{tx.note || 'TANPA CATATAN'} • {new Date(tx.date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p>
                    </div>
                  </div>
                  <p className={`font-black text-sm tracking-tight ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Target Tabungan</h3>
            <button onClick={() => setActivePage('tabungan')} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-[0.2em]">Rincian</button>
          </div>
          <div className="space-y-6">
            {stats.savings.length === 0 ? (
               <div className="py-20 text-center text-gray-400 italic text-sm font-medium">Belum ada target tabungan.</div>
            ) : (
              stats.savings.slice(0, 3).map((saving) => {
                const percentage = Math.round((saving.current_amount / saving.target_amount) * 100);
                return (
                  <div key={saving.id} className="flex flex-col gap-5 p-6 bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100/50 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 group-hover:rotate-12 transition-transform">
                          <Target size={22} strokeWidth={3} />
                        </div>
                        <span className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm">{saving.name}</span>
                      </div>
                      <span className="text-[10px] font-black bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full shadow-sm border border-indigo-50 dark:border-slate-600">
                        {percentage}%
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-3 bg-white dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-slate-600 shadow-inner">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-[2000ms] shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest leading-none">
                        <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(saving.current_amount)}</span>
                        <span className="text-gray-400 dark:text-gray-600">Target: {formatCurrency(saving.target_amount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
