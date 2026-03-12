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
        <Loader2 className="animate-spin" size={48} />
        <p className="font-bold uppercase tracking-widest text-sm">Menyiapkan Dashboard Anda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-red-500">
        <AlertCircle size={48} />
        <p className="font-bold">{error}</p>
        <button onClick={fetchDashboardData} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold mt-2">Coba Lagi</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ringkasan Keuangan</h1>
          <p className="text-gray-500 text-sm">Selamat datang kembali! Berikut kondisi keuanganmu hari ini.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setActivePage('transaksi')}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={18} />
            <span>Transaksi</span>
          </button>
          <button 
            onClick={() => setActivePage('tabungan')}
            className="flex-1 md:flex-none bg-white text-gray-700 border border-gray-100 px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Target size={18} />
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
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-gray-800 mb-6 px-2">Arus Kas (7 Hari Terakhir)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.cashflow}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{stroke: '#EEF2FF', strokeWidth: 2}} 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px'}} 
                  formatter={(value) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="income" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories / Budget Info */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-lg font-bold text-gray-800">Budget Terpakai</h3>
            <button onClick={() => setActivePage('budget')} className="text-xs font-bold text-indigo-600 hover:underline">Detail</button>
          </div>
          <div className="space-y-6">
            {stats.budgets.length === 0 ? (
               <div className="py-10 text-center text-gray-400 italic text-sm">Belum ada budget yang diatur.</div>
            ) : (
              stats.budgets.slice(0, 4).map((budget) => {
                const percentage = Math.min(Math.round((budget.used_amount / budget.limit_amount) * 100), 100);
                return (
                  <div key={budget.id} className="px-2">
                    <div className="flex justify-between items-center mb-2 text-xs font-bold uppercase tracking-wider">
                      <span className="text-gray-500">{budget.category}</span>
                      <span className={percentage > 90 ? 'text-red-600' : 'text-indigo-600'}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          percentage > 90 ? 'bg-red-500 shadow-sm shadow-red-100' : 'bg-indigo-500 shadow-sm shadow-indigo-100'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-lg font-bold text-gray-800">Transaksi Terakhir</h3>
            <button onClick={() => setActivePage('transaksi')} className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest">Lihat Semua</button>
          </div>
          <div className="space-y-4">
            {stats.recentTransactions.length === 0 ? (
               <div className="py-10 text-center text-gray-400 italic text-sm">Belum ada transaksi terhitung.</div>
            ) : (
              stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all group border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-tight">{tx.category}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tx.note || '-'} • {new Date(tx.date).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <p className={`font-black text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-lg font-bold text-gray-800">Target Tabungan</h3>
            <button onClick={() => setActivePage('tabungan')} className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest">Rincian</button>
          </div>
          <div className="space-y-5">
            {stats.savings.length === 0 ? (
               <div className="py-10 text-center text-gray-400 italic text-sm">Belum ada target tabungan.</div>
            ) : (
              stats.savings.slice(0, 3).map((saving) => {
                const percentage = Math.round((saving.current_amount / saving.target_amount) * 100);
                return (
                  <div key={saving.id} className="flex flex-col gap-4 p-5 bg-gray-50/50 border border-gray-100/50 rounded-[2rem] hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                          <Target size={20} />
                        </div>
                        <span className="font-black text-gray-800 italic uppercase underline decoration-indigo-200 decoration-4 underline-offset-4">{saving.name}</span>
                      </div>
                      <span className="text-[10px] font-black italic bg-white text-indigo-600 px-3 py-1 rounded-full shadow-sm border border-indigo-50">
                        {percentage}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-2.5 bg-white rounded-full overflow-hidden p-0.5 border border-gray-100">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-sm shadow-indigo-100"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-indigo-600">{formatCurrency(saving.current_amount)}</span>
                        <span className="text-gray-300">Target: {formatCurrency(saving.target_amount)}</span>
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
