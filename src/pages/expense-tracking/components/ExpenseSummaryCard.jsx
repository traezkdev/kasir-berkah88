import React from 'react';
import Icon from '../../../components/AppIcon';

const ExpenseSummaryCard = ({ 
  totalExpenses = 0, 
  expenseCount = 0, 
  todayExpenses = 0,
  weeklyExpenses = 0,
  monthlyExpenses = 0,
  className = "" 
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const summaryItems = [
    {
      label: 'Pengeluaran Bulan Ini',
      value: formatCurrency(monthlyExpenses),
      icon: 'Wallet', // Replace with a different icon that is less likely to have arcs
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      description: `${expenseCount} transaksi bulan ini`
    },
    {
      label: 'Pengeluaran Hari Ini',
      value: formatCurrency(todayExpenses),
      icon: 'Calendar',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      description: 'Hari ini'
    },
    {
      label: 'Pengeluaran Minggu Ini',
      value: formatCurrency(weeklyExpenses),
      icon: 'TrendingDown',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      description: 'Minggu berjalan'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-elevation-2 border border-slate-200 ${className}`}>
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
            <div key={index} className="glass-morphism rounded-lg p-4 hover:shadow-elevation-2 transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-md ${item?.bgColor}`}>
                  <Icon name={item?.icon} size={20} className={item?.color} />
                </div>
              </div>
              
              <div>
                <p className="text-2xl font-mono font-bold text-text-primary mb-1">
                  {item?.value}
                </p>
                <p className="text-sm font-medium text-text-primary mb-1">
                  {item?.label}
                </p>
                <p className="text-xs text-text-secondary">
                  {item?.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {totalExpenses > 0 && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
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