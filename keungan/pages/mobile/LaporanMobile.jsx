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
    }).format(val);
  };

  if (loading && !reportData) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Menyusun Laporan...</p>
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
    <div className="pb-24 space-y-6 px-4 pt-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Laporan</h1>
        <div className="flex items-center gap-2">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-white border border-gray-100 text-[10px] font-bold py-2 px-3 rounded-xl focus:ring-0 outline-none"
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i+1} value={i+1}>
                {new Date(0, i).toLocaleString('id-ID', {month: 'short'})}
              </option>
            ))}
          </select>
          <button 
            onClick={handleExportPDF}
            className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-2">
           <AlertCircle size={16} />
           {error}
        </div>
      )}

      {/* Hero Analytics Mobile */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-4">Ringkasan Periode</p>
        <div className="grid grid-cols-2 gap-6 relative z-10">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-indigo-100">
                <ArrowUpRight size={14} className="bg-white/20 p-0.5 rounded-full" />
                <span className="text-[10px] font-bold">Pemasukan</span>
             </div>
             <p className="text-base font-black">{formatCurrency(summary.totalIncome)}</p>
          </div>
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-indigo-100">
                <ArrowDownRight size={14} className="bg-white/20 p-0.5 rounded-full" />
                <span className="text-[10px] font-bold">Pengeluaran</span>
             </div>
             <p className="text-base font-black">{formatCurrency(summary.totalExpense)}</p>
          </div>
        </div>
        
        {/* Sisa Saldo Badge */}
        <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
           <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Sisa Saldo</span>
           <span className="text-sm font-black">{formatCurrency(summary.balance)}</span>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Chart Mobile */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-gray-800">
             Tren {reportType === 'monthly' ? 'Bulanan' : 'Mingguan'}
           </h3>
           <button 
             onClick={() => setReportType(reportType === 'monthly' ? 'weekly' : 'monthly')}
             className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
           >
             {reportType === 'monthly' ? 'Lihat Mingguan' : 'Lihat Bulanan'}
           </button>
        </div>
        <div className="h-[200px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#CBD5E1', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', fontSize: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="income" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={reportType === 'monthly' ? 8 : 15} />
                <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={reportType === 'monthly' ? 8 : 15} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase">
              Tidak ada data
            </div>
          )}
        </div>
      </div>

      {/* Category Distribution Mobile */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-gray-800">Persentase Kategori</h3>
        {categoryData.length > 0 ? (
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
            <div className="w-1/2 space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[60px]">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-800">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[100px] flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase">
            Belum ada data pengeluaran
          </div>
        )}
      </div>

      {/* List Transaksi Laporan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaksi Berpengaruh</p>
        </div>
        
        {topTransactions.length > 0 ? topTransactions.map((tx) => (
          <div key={tx.id} className="bg-white p-5 rounded-[1.8rem] border border-gray-50 flex items-center justify-between active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
              <div>
                <p className="text-xs font-black text-gray-800">{tx.category}</p>
                <p className="text-[10px] text-gray-400 font-bold">
                  {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {tx.note || '-'}
                </p>
              </div>
            </div>
            <p className={`text-xs font-black ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
          </div>
        )) : (
          <div className="bg-white p-10 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
             <BarChart3 size={32} className="text-gray-200" />
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Belum ada transaksi di periode ini</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaporanMobile;
