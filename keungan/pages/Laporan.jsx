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
    }).format(val || 0);
  };

  if (loading && !reportData) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Menyusun Analisis Laporan...</p>
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Laporan Keuangan</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Analisis mendalam tentang aliran kas keuanganmu.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm transition-colors">
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
               className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 border-none bg-transparent focus:ring-0 cursor-pointer appearance-none pr-10"
             >
               {Array.from({length: 12}, (_, i) => (
                 <option key={i+1} value={i+1}>
                   {new Date(0, i).toLocaleString('id-ID', {month: 'long'})}
                 </option>
               ))}
             </select>
             <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 self-center"></div>
             <select 
               value={selectedYear} 
               onChange={(e) => setSelectedYear(parseInt(e.target.value))}
               className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-transparent focus:ring-0 cursor-pointer appearance-none pr-10"
             >
               {[2024, 2025, 2026].map(y => (
                 <option key={y} value={y}>{y}</option>
               ))}
             </select>
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
          >
            <Download size={18} strokeWidth={3} />
            <span>EXPORT PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-lg flex items-center gap-3">
           <AlertCircle size={20} strokeWidth={2.5} />
           <p>{error}</p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl dark:shadow-black/20 transform hover:-translate-y-1">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 leading-none px-1">Total Pemasukan 📈</p>
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight size={20} strokeWidth={3} />
            <span className="text-2xl font-black tracking-tight">{formatCurrency(summary.totalIncome)}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl dark:shadow-black/20 transform hover:-translate-y-1">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 leading-none px-1">Total Pengeluaran 📉</p>
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <ArrowDownRight size={20} strokeWidth={3} />
            <span className="text-2xl font-black tracking-tight">{formatCurrency(summary.totalExpense)}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl dark:shadow-black/20 transform hover:-translate-y-1 border-b-4 border-b-indigo-500">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 leading-none px-1">Sisa Saldo 💰</p>
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <BarChart3 size={20} strokeWidth={3} />
            <span className="text-2xl font-black tracking-tight">{formatCurrency(summary.balance)}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl dark:shadow-black/20 transform hover:-translate-y-1">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 leading-none px-1">Efisiensi Hemat ✨</p>
          <div className="flex items-center gap-3 text-amber-500">
            <TrendingUp size={20} strokeWidth={3} />
            <span className="text-2xl font-black tracking-tight">{summary.savingsPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
            <div>
               <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                 Tren {reportType === 'monthly' ? 'Bulanan' : 'Mingguan'}
               </h3>
               <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Pergerakan arus kas anda</p>
            </div>
            <div className="flex bg-gray-50 dark:bg-slate-800 p-1.5 rounded-[1.5rem] shadow-inner">
               <button 
                 onClick={() => setReportType('monthly')}
                 className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.1rem] transition-all ${reportType === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600'}`}
               >
                 BULANAN
               </button>
               <button 
                 onClick={() => setReportType('weekly')}
                 className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.1rem] transition-all ${reportType === 'weekly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600'}`}
               >
                 MINGGUAN
               </button>
            </div>
          </div>
          <div className="h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} tickFormatter={(v) => v >= 1000000 ? `${v/1000000}M` : v >= 1000 ? `${v/1000}K` : v} />
                  <Tooltip 
                    cursor={{fill: 'rgba(79, 70, 229, 0.05)'}}
                    contentStyle={{borderRadius: '24px', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', padding: '20px'}}
                    itemStyle={{fontWeight: '900', fontSize: '12px', textTransform: 'uppercase'}}
                    labelStyle={{fontWeight: '900', color: '#1E293B', marginBottom: '8px', fontSize: '14px'}}
                  />
                  <Bar dataKey="income" fill="#4F46E5" radius={[12, 12, 0, 0]} barSize={reportType === 'monthly' ? 14 : 35} animationDuration={1500} />
                  <Bar dataKey="expense" fill="#F43F5E" radius={[12, 12, 0, 0]} barSize={reportType === 'monthly' ? 14 : 35} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-4">
                 <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center rotate-12">
                    <BarChart3 size={32} />
                 </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-center">TIDAK ADA DATA GRAFIK<br/>UNTUK PERIODE INI.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center transform transition-transform hover:scale-[1.01]">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Distribusi</h3>
          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-10">Alokasi Pengeluaran</p>
          
          {categoryData.length > 0 ? (
            <>
              <div className="h-[280px] relative mb-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={105}
                      paddingAngle={10}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', fontWeight: '900'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">100</span>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">%</span>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar text-left px-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: cat.color}}></div>
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">{cat.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-900 dark:text-white">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-4">
               <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center -rotate-12">
                   <PieChartIcon size={32} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest">KATEGORI MASIH KOSONG.</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Transactions in Report */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-xl dark:shadow-black/20">
        <div className="p-10 border-b border-gray-50 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
           <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Transaksi Terbesar</h3>
              <p className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mt-1">Periode {new Date(0, selectedMonth-1).toLocaleString('id-ID', {month: 'long'})} {selectedYear}</p>
           </div>
           <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline underline-offset-4">LIHAT SELURUHNYA</button>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">Kategori</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">Catatan (Note)</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">Tanggal</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {topTransactions.length > 0 ? topTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-10 py-7">
                    <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">{tx.category}</span>
                  </td>
                  <td className="px-10 py-7 text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-tight">{tx.note || '-'}</td>
                  <td className="px-10 py-7 text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                    {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td className={`px-10 py-7 text-right font-black text-sm tracking-tight ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan="4" className="px-10 py-20 text-center">
                       <div className="flex flex-col items-center gap-4 text-gray-300 dark:text-slate-800">
                          <FileText size={48} />
                          <p className="text-[10px] font-black uppercase tracking-widest">TIDAK ADA DATA TRANSAKSI.</p>
                       </div>
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
