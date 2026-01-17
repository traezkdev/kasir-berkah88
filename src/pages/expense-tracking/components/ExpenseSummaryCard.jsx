import React from 'react';
import Icon from '../../../components/AppIcon';

const ExpenseSummaryCard = ({
  totalExpenses = 0,
  expenseCount = 0,
  todayExpenses = 0,
  weeklyExpenses = 0,
  monthlyExpenses = 0,
  monthlyExpenseCount = 0,
  filterDate = '',
  referenceDate,
  weekStart,
  weekEnd,
  className = ""
}) => {
  const gradientClasses = [
    "bg-gradient-to-br from-purple-500 to-indigo-500",
    "bg-gradient-to-br from-blue-500 to-cyan-500",
    "bg-gradient-to-br from-green-500 to-teal-500",
    "bg-gradient-to-br from-yellow-500 to-orange-500",
    "bg-gradient-to-br from-red-500 to-pink-500",
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatMonthYear = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateRange = (start, end) => {
    const startFormatted = new Date(start).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit'
    });
    const endFormatted = new Date(end).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit'
    });
    return `${startFormatted} - ${endFormatted}`;
  };

  const summaryItems = [
    {
      label: filterDate ? `Pengeluaran Bulan ${formatMonthYear(referenceDate)}` : 'Pengeluaran Bulan Ini',
      value: formatCurrency(monthlyExpenses),
      icon: 'Wallet',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      description: filterDate ? `${monthlyExpenseCount} transaksi` : `${monthlyExpenseCount} transaksi bulan ini`
    },
    {
      label: filterDate ? `Pengeluaran ${formatDate(referenceDate)}` : 'Pengeluaran Hari Ini',
      value: formatCurrency(todayExpenses),
      icon: 'Calendar',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      description: filterDate ? 'Tanggal terpilih' : 'Hari ini'
    },
    {
      label: filterDate ? `Pengeluaran Minggu (${formatDateRange(weekStart, weekEnd)})` : 'Pengeluaran Minggu Ini',
      value: formatCurrency(weeklyExpenses),
      icon: 'TrendingDown',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      description: filterDate ? 'Minggu terpilih' : 'Minggu berjalan'
    }
  ];

  return (
    <div className={`bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden ${className}`}>
      <div className="p-5 lg:p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <Icon name="BarChart3" size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase truncate max-w-[200px] lg:max-w-none">
              Ringkasan Biaya
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Overview keuangan bisnis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {summaryItems?.map((item, index) => (
            <div key={index} className={`rounded-3xl p-6 transition-all duration-300 active:scale-95 shadow-lg shadow-gray-200/20 ${gradientClasses[index % gradientClasses.length]}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20`}>
                  <Icon name={item?.icon} size={24} className="text-white" />
                </div>
              </div>

              <div>
                <p className="text-2xl font-black text-white mb-2 tracking-tighter">
                  {item?.value}
                </p>
                <p className="text-[11px] font-black text-white/90 uppercase tracking-widest mb-1 opacity-80">
                  {item?.label}
                </p>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-tight">
                  {item?.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {totalExpenses > 0 && (
          <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-white dark:border-slate-800">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Info" size={16} className="text-blue-600" />
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Wawasan Keuangan</span>
            </div>
            <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
              Total pengeluaran akan langsung mengurangi keuntungan bersih. Catatlah setiap transaksi agar laporan tetap presisi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseSummaryCard;
