import React, { useState } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Filter, 
  Download,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const LaporanMobile = () => {
  const data = [
    { name: 'S', income: 400, expense: 240 },
    { name: 'S', income: 300, expense: 139 },
    { name: 'R', income: 200, expense: 980 },
    { name: 'K', income: 278, expense: 390 },
    { name: 'J', income: 189, expense: 480 },
    { name: 'S', income: 239, expense: 380 },
  ];

  const categoryData = [
    { name: 'Makan', value: 400, color: '#4F46E5' },
    { name: 'Belanja', value: 300, color: '#10B981' },
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
    <div className="pb-24 space-y-8 px-6 pt-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Laporan</h1>
        <button className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
          <Download size={20} />
        </button>
      </div>

      {/* Hero Analytics Mobile */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-4">Ringkasan Bulan Ini</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-indigo-100">
                <ArrowUpRight size={14} className="bg-white/20 p-0.5 rounded-full" />
                <span className="text-[10px] font-bold">Pemasukan</span>
             </div>
             <p className="text-base font-black">{formatCurrency(12000000)}</p>
          </div>
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-indigo-100">
                <ArrowDownRight size={14} className="bg-white/20 p-0.5 rounded-full" />
                <span className="text-[10px] font-bold">Pengeluaran</span>
             </div>
             <p className="text-base font-black">{formatCurrency(7500000)}</p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Chart Mobile */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-gray-800">Analisis Mingguan</h3>
           <Filter size={18} className="text-gray-400" />
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#CBD5E1', fontSize: 10}} />
              <Bar dataKey="income" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={15} />
              <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={15} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution Mobile */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-gray-800">Persentase Kategori</h3>
        <div className="flex items-center gap-6">
          <div className="w-1/2 h-[150px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={40} outerRadius={55} paddingAngle={8} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-gray-800">100%</span>
            </div>
          </div>
          <div className="w-1/2 space-y-3">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{cat.name}</span>
                </div>
                <span className="text-[10px] font-black text-gray-800">{cat.value}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List Transaksi Laporan */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Transaksi Berpengaruh</p>
        {[1, 2].map((i) => (
          <div key={i} className="bg-white p-5 rounded-[1.8rem] border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-gray-800">Pembayaran Wifi</p>
                <p className="text-[10px] text-gray-400 font-bold">10 Mar 2024</p>
              </div>
            </div>
            <p className="text-xs font-black text-red-500">-{formatCurrency(450000)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LaporanMobile;
