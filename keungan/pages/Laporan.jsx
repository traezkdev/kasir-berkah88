import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const Laporan = () => {
  const [reportType, setReportType] = useState('monthly');

  const data = [
    { name: 'Jan', income: 4000, expense: 2400 },
    { name: 'Feb', income: 3000, expense: 1398 },
    { name: 'Mar', income: 2000, expense: 9800 },
    { name: 'Apr', income: 2780, expense: 3908 },
    { name: 'May', income: 1890, expense: 4800 },
    { name: 'Jun', income: 2390, expense: 3800 },
  ];

  const categoryData = [
    { name: 'Makan', value: 400, color: '#4F46E5' },
    { name: 'Belanja', value: 300, color: '#10B981' },
    { name: 'Transport', value: 300, color: '#F59E0B' },
    { name: 'Cicilan', value: 200, color: '#EF4444' },
  ];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h1>
          <p className="text-gray-500">Analisis mendalam tentang aliran kas keuanganmu.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            <Calendar size={18} />
            <span>Pilih Periode</span>
          </button>
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Download size={20} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Pemasukan</p>
          <div className="flex items-center gap-2 text-green-600">
            <ArrowUpRight size={20} />
            <span className="text-xl font-black">{formatCurrency(15000000)}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Pengeluaran</p>
          <div className="flex items-center gap-2 text-red-600">
            <ArrowDownRight size={20} />
            <span className="text-xl font-black">{formatCurrency(8500000)}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sisa Saldo</p>
          <div className="flex items-center gap-2 text-indigo-600">
            <BarChart3 size={20} />
            <span className="text-xl font-black">{formatCurrency(6500000)}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Persentase Hemat</p>
          <div className="flex items-center gap-2 text-amber-500">
            <TrendingUp size={20} />
            <span className="text-xl font-black">43.5%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-800">Tren Pemasukan & Pengeluaran</h3>
            <div className="flex bg-gray-50 p-1 rounded-xl">
               <button className="px-4 py-1.5 bg-white text-indigo-600 text-xs font-bold rounded-lg shadow-sm">Bulanan</button>
               <button className="px-4 py-1.5 text-gray-400 text-xs font-bold rounded-lg">Mingguan</button>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="income" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={25} />
                <Bar dataKey="expense" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-8">Distribusi Pengeluaran</h3>
          <div className="h-[250px] relative mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-800">100%</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></div>
                  <span className="text-sm font-medium text-gray-600">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{cat.value}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Transactions in Report */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Transaksi Terbesar Bulan Ini</h3>
          <button className="text-indigo-600 text-sm font-bold hover:underline">Lihat Semua</button>
        </div>
        <div className="p-0">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Note</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-gray-800">Belanja Bulanan</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-500">Supermarket XYZ</td>
                  <td className="px-8 py-5 text-sm text-gray-400">12 Maret 2024</td>
                  <td className="px-8 py-5 text-right font-black text-red-500 text-sm">
                    -{formatCurrency(1200000)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Laporan;
