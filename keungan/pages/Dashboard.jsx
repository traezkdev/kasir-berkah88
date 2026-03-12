import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Target 
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { mockStats, mockTransactions, mockBudgets, mockSavings } from '../mock/data';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

const Dashboard = () => {
  const chartData = [
    { name: 'Sen', income: 4000, expense: 2400 },
    { name: 'Sel', income: 3000, expense: 1398 },
    { name: 'Rab', income: 2000, expense: 9800 },
    { name: 'Kam', income: 2780, expense: 3908 },
    { name: 'Jum', income: 1890, expense: 4800 },
    { name: 'Sab', income: 2390, expense: 3800 },
    { name: 'Min', income: 3490, expense: 4300 },
  ];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ringkasan Keuangan</h1>
          <p className="text-gray-500">Selamat datang kembali! Berikut kondisi keuanganmu hari ini.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <ArrowUpRight size={18} />
            <span>Tambah Pemasukan</span>
          </button>
          <button className="bg-white text-gray-700 border border-gray-100 px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
            <ArrowDownRight size={18} />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Saldo" 
          value={mockStats.totalBalance} 
          icon={Wallet} 
          color="indigo" 
          trend="up" 
          trendValue={12} 
        />
        <StatCard 
          title="Pemasukan Bulan Ini" 
          value={mockStats.monthlyIncome} 
          icon={ArrowUpRight} 
          color="green" 
          trend="up" 
          trendValue={5} 
        />
        <StatCard 
          title="Pengeluaran Bulan Ini" 
          value={mockStats.monthlyExpense} 
          icon={ArrowDownRight} 
          color="red" 
          trend="down" 
          trendValue={2} 
        />
        <StatCard 
          title="Total Utang" 
          value={mockStats.totalDebt} 
          icon={Clock} 
          color="orange" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Arus Kas (7 Hari Terakhir)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{stroke: '#EEF2FF', strokeWidth: 2}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                <Area type="monotone" dataKey="income" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories / Budget Info */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Budget Terpakai</h3>
          <div className="space-y-6">
            {mockBudgets.map((budget) => (
              <div key={budget.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">{budget.category}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {Math.round((budget.used / budget.limit) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      (budget.used / budget.limit) > 0.9 ? 'bg-red-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${(budget.used / budget.limit) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                  <span>Terpakai: {formatCurrency(budget.used)}</span>
                  <span>Limit: {formatCurrency(budget.limit)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Transaksi Terakhir</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Lihat Semua</button>
          </div>
          <div className="space-y-4">
            {mockTransactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{tx.category}</p>
                    <p className="text-xs text-gray-400">{tx.note} • {tx.date}</p>
                  </div>
                </div>
                <p className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-gray-800'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Target Tabungan</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Tambah Target</button>
          </div>
          <div className="space-y-6">
            {mockSavings.map((saving) => (
              <div key={saving.id} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Target size={20} />
                    </div>
                    <span className="font-bold text-gray-800">{saving.name}</span>
                  </div>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md">
                    {Math.round((saving.current / saving.target) * 100)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(saving.current / saving.target) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-indigo-600">{formatCurrency(saving.current)}</span>
                    <span className="text-gray-400">Target: {formatCurrency(saving.target)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
