import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Filter, 
  Download,
  PieChart as PieChartIcon,
  BarChart3,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import api, { reportsAPI } from '../../services/api';
import { downloadTransaksiPDF } from '../../services/generatePDF';

const LaporanMobile = () => {
  const [reportType, setReportType] = useState('monthly');
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
      setError('Gagal memuat data laporan.');
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
      const res = await api.get('/transactions');
      const filtered = res.data.filter(tx => {
        const d = new Date(tx.date);
        return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
      });
      
      if (filtered.length === 0) {
        alert('Tidak ada data transaksi.');
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
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="w-10 h-10 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Menyusun Analisis...</p>
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
    <div className="pb-32 space-y-8 px-5 pt-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Laporan</h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Statistik Keuangan</p>
         </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-lg focus:ring-0 outline-none shadow-sm appearance-none pr-8 text-gray-700 dark:text-gray-200"
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i+1} value={i+1}>
                {new Date(0, i).toLocaleString('id-ID', {month: 'short'})}
              </option>
            ))}
          </select>
          <button 
            onClick={handleExportPDF}
            className="bg-indigo-600 text-white p-3.5 rounded-lg shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-[0.85] transition-all"
          >
            <Download size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-500/20 rounded-lg flex items-center gap-3">
           <AlertCircle size={18} strokeWidth={3} />
           <span>{error}</span>
        </div>
      )}

      {/* Hero Analytics Mobile */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-700 dark:to-indigo-900 rounded-xl p-10 text-white shadow-2xl shadow-indigo-100 dark:shadow-indigo-900/40 relative overflow-hidden group active:scale-[0.98] transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 group-hover:rotate-45 transition-transform duration-700"><BarChart3 size={150} strokeWidth={1} /></div>
        <p className="text-[10px] font-black text-indigo-100/60 uppercase tracking-[0.3em] mb-6 relative z-10">Ringkasan Arus Kas ✨</p>
        <div className="grid grid-cols-2 gap-8 relative z-10">
          <div className="space-y-2">
             <div className="flex items-center gap-2.5 text-indigo-100/80">
                <ArrowUpRight size={14} strokeWidth={4} className="bg-white/20 p-1 rounded-md" />
                <span className="text-[9px] font-black uppercase tracking-widest">Pemasukan</span>
             </div>
             <p className="text-xl font-black tracking-tight">{formatCurrency(summary.totalIncome)}</p>
          </div>
          <div className="space-y-2">
             <div className="flex items-center gap-2.5 text-indigo-100/80">
                <ArrowDownRight size={14} strokeWidth={4} className="bg-white/20 p-1 rounded-md" />
                <span className="text-[9px] font-black uppercase tracking-widest">Pengeluaran</span>
             </div>
             <p className="text-xl font-black tracking-tight">{formatCurrency(summary.totalExpense)}</p>
          </div>
        </div>
        
        {/* Sisa Saldo Badge */}
        <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-end relative z-10">
           <div>
              <p className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Total Tabungan</p>
              <p className="text-2xl font-black tracking-tighter">{formatCurrency(summary.balance)}</p>
           </div>
           <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
              <p className="text-[8px] font-black uppercase tracking-widest text-indigo-100">Hemat</p>
              <p className="text-sm font-black text-white">{summary.savingsPercentage}%</p>
           </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/5 rounded-full blur-[80px]"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-[40px]"></div>
      </div>

      {/* Chart Mobile */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-8 transition-transform hover:scale-[1.01]">
        <div className="flex items-center justify-between">
           <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Tren Saldo</h3>
              <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Grafik {reportType === 'monthly' ? 'Bulanan' : 'Mingguan'}</p>
           </div>
           <button 
             onClick={() => setReportType(reportType === 'monthly' ? 'weekly' : 'monthly')}
             className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2.5 rounded-lg active:scale-[0.85] transition-all uppercase tracking-widest"
           >
             Ubah
           </button>
        </div>
        <div className="h-[220px] w-full mt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 9, fontWeight: '900'}} dy={10} />
                <Tooltip 
                  cursor={{fill: 'rgba(79, 70, 229, 0.05)'}}
                  contentStyle={{borderRadius: '16px', border: 'none', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="income" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={reportType === 'monthly' ? 10 : 20} animationDuration={1000} />
                <Bar dataKey="expense" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={reportType === 'monthly' ? 10 : 20} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-200 dark:text-slate-800 gap-3">
               <BarChart3 size={48} strokeWidth={1} />
               <p className="text-[9px] font-black uppercase tracking-widest">Kosong</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Distribution Mobile */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden">
        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight px-1">Alokasi Budget</h3>
        {categoryData.length > 0 ? (
          <div className="flex flex-col gap-10">
            <div className="w-full h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={55} outerRadius={75} paddingAngle={12} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">100%</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Share</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar px-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{backgroundColor: cat.color}}></div>
                    <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">{cat.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[120px] flex flex-col items-center justify-center text-gray-200 dark:text-slate-800 gap-3">
             <PieChartIcon size={48} strokeWidth={1} />
             <p className="text-[9px] font-black uppercase tracking-widest">Belum ada pengeluaran</p>
          </div>
        )}
      </div>

      {/* List Transaksi Laporan */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em]">HITS TRANSAKSI 🔥</p>
        </div>
        
        {topTransactions.length > 0 ? topTransactions.map((tx) => (
          <div key={tx.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-5 transition-all active:scale-[0.97] active:bg-gray-50 dark:active:bg-slate-800/50">
            {/* Header: Icon, Category & Amount */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-5 min-w-0 flex-1">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-emerald-50' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-rose-50'}`}>
                  {tx.type === 'income' ? <ArrowUpRight size={24} strokeWidth={3} /> : <ArrowDownRight size={24} strokeWidth={3} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate leading-tight">{tx.category}</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5 truncate">
                    {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className={`text-base font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            </div>

            {/* Body: Note Block (Style dari TransaksiMobile) */}
            {tx.note && (
              <div className="px-1">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border-l-4 border-indigo-500 dark:border-indigo-600 shadow-sm">
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-bold leading-relaxed italic">
                    "{tx.note.toUpperCase()}"
                  </p>
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="bg-white dark:bg-slate-900 p-20 rounded-xl border-4 border-dashed border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center gap-4 transition-colors">
             <FileText size={48} className="text-gray-200 dark:text-slate-800" strokeWidth={1} />
             <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest text-center leading-relaxed">BELUM ADA TRANSAKSI<br/>DI PERIODE INI ✨</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaporanMobile;
