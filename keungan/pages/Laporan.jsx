import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Loader2,
  AlertCircle
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
import api, { reportsAPI } from '../services/api';
import { downloadTransaksiPDF } from '../services/generatePDF';

const Laporan = () => {
  const [reportType, setReportType] = useState('monthly'); // 'monthly' or 'weekly'
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportsAPI.getReport({
        month: selectedMonth,
        year: selectedYear,
        type: reportType
      });
      setReportData(res.data);
    } catch (err) {
      setError('Gagal memuat data laporan. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear, reportType]);

  const handleExportPDF = async () => {
    try {
      // Fetch all transactions for the current period for full report
      const res = await api.get('/transactions');
      // Filter by month and year in frontend for now to simplify
      const filtered = res.data.filter(tx => {
        const d = new Date(tx.date);
        return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
      });
      
      if (filtered.length === 0) {
        alert('Tidak ada data transaksi untuk periode ini.');
        return;
      }
      
      downloadTransaksiPDF(filtered);
    } catch (err) {
      alert('Gagal mengekspor PDF.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  if (loading && !reportData) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-gray-500 font-medium">Menyusun laporanmu...</p>
      </div>
    );
  }

  const { summary, chartData, categoryData, topTransactions } = reportData || {
    summary: { totalIncome: 0, totalExpense: 0, balance: 0, savingsPercentage: 0 },
    chartData: [],
    categoryData: [],
    topTransactions: []
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h1>
          <p className="text-gray-500">Analisis mendalam tentang aliran kas keuanganmu.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
               className="px-4 py-2.5 text-sm font-semibold text-gray-600 border-none bg-transparent focus:ring-0 cursor-pointer"
             >
               {Array.from({length: 12}, (_, i) => (
                 <option key={i+1} value={i+1}>
                   {new Date(0, i).toLocaleString('id-ID', {month: 'long'})}
                 </option>
               ))}
             </select>
             <select 
               value={selectedYear} 
               onChange={(e) => setSelectedYear(parseInt(e.target.value))}
               className="px-4 py-2.5 text-sm font-semibold text-gray-600 border-r border-gray-100 bg-transparent focus:ring-0 cursor-pointer"
             >
               {[2024, 2025, 2026].map(y => (
                 <option key={y} value={y}>{y}</option>
               ))}
             </select>
          </div>
          <button 
            onClick={handleExportPDF}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Download size={20} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
           <AlertCircle size={18} />
           <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Pemasukan</p>
          <div className="flex items-center gap-2 text-green-600">
            <ArrowUpRight size={20} />
            <span className="text-xl font-black">{formatCurrency(summary.totalIncome)}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Pengeluaran</p>
          <div className="flex items-center gap-2 text-red-600">
            <ArrowDownRight size={20} />
            <span className="text-xl font-black">{formatCurrency(summary.totalExpense)}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sisa Saldo</p>
          <div className="flex items-center gap-2 text-indigo-600">
            <BarChart3 size={20} />
            <span className="text-xl font-black">{formatCurrency(summary.balance)}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Persentase Hemat</p>
          <div className="flex items-center gap-2 text-amber-500">
            <TrendingUp size={20} />
            <span className="text-xl font-black">{summary.savingsPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-800">
              Tren {reportType === 'monthly' ? 'Bulanan' : 'Mingguan'}
            </h3>
            <div className="flex bg-gray-50 p-1 rounded-xl">
               <button 
                 onClick={() => setReportType('monthly')}
                 className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${reportType === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
               >
                 Bulanan
               </button>
               <button 
                 onClick={() => setReportType('weekly')}
                 className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${reportType === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
               >
                 Mingguan
               </button>
            </div>
          </div>
          <div className="h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="income" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={reportType === 'monthly' ? 12 : 25} />
                  <Bar dataKey="expense" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={reportType === 'monthly' ? 12 : 25} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                Tidak ada data grafik untuk periode ini.
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center lg:text-left">
          <h3 className="text-lg font-bold text-gray-800 mb-8">Distribusi Pengeluaran</h3>
          {categoryData.length > 0 ? (
            <>
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
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Porsi</span>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></div>
                      <span className="text-sm font-medium text-gray-600">{cat.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm font-medium">
              Belum ada data kategori.
            </div>
          )}
        </div>
      </div>

      {/* Top Transactions in Report */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Transaksi Terbesar Periode Ini</h3>
        </div>
        <div className="p-0 overflow-x-auto">
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
              {topTransactions.length > 0 ? topTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-gray-800">{tx.category}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-500">{tx.note || '-'}</td>
                  <td className="px-8 py-5 text-sm text-gray-400">
                    {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td className={`px-8 py-5 text-right font-black text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan="4" className="px-8 py-10 text-center text-gray-400 text-sm font-medium">
                      Tidak ada data transaksi.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Laporan;
