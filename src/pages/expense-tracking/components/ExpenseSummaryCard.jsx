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
    <div className={`bg-card rounded-lg shadow-md border border-border dark:bg-dark-card dark:border-dark-border dark:shadow-dark-md ${className}`}>
      <div className="p-4 lg:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="BarChart3" size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Ringkasan Pengeluaran</h3>
            <p className="text-sm text-text-secondary">Overview keuangan bisnis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {summaryItems?.map((item, index) => (
            <div key={index} className={`rounded-lg p-4 hover:shadow-elevation-2 transition-shadow duration-200 ${gradientClasses[index % gradientClasses.length]}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-md bg-white/20`}>
                  <Icon name={item?.icon} size={20} className="text-white" />
                </div>
              </div>

              <div>
                <p className="text-2xl font-mono font-bold text-white mb-1">
                  {item?.value}
                </p>
                <p className="text-sm font-medium text-white mb-1">
                  {item?.label}
                </p>
                <p className="text-xs text-white/80">
                  {item?.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {totalExpenses > 0 && (
          <div className="mt-6 p-4 bg-background-alt rounded-lg border border-border-alt dark:bg-dark-background-alt dark:border-dark-border-alt">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Info" size={16} className="text-primary" />
              <span className="text-sm font-medium text-text-primary">Informasi Keuangan</span>
            </div>
            <p className="text-sm text-text-secondary">
              Total pengeluaran akan mengurangi keuntungan bersih bisnis.
              Pastikan untuk mencatat semua pengeluaran agar laporan keuangan akurat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseSummaryCard;