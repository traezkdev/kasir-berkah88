import React from 'react';
import Icon from '../../../components/AppIcon';

const BusinessSummaryCard = ({ 
  todayStats = {
    transactions: 0,
    itemsSold: 0,
    averageOrder: 0,
    peakHour: '-'
  }
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
      label: 'Total Transaksi',
      value: todayStats?.transactions?.toString(),
      icon: 'ShoppingCart',
      color: 'text-primary'
    },
    {
      label: 'Item Terjual',
      value: todayStats?.itemsSold?.toString(),
      icon: 'Package',
      color: 'text-success'
    },
    {
      label: 'Rata-rata Order',
      value: formatCurrency(todayStats?.averageOrder),
      icon: 'Calculator',
      color: 'text-accent'
    },
    {
      label: 'Jam Tersibuk',
      value: todayStats?.peakHour,
      icon: 'Clock',
      color: 'text-warning'
    }
  ];

  return (
    <div className="bg-card rounded-lg p-4 shadow-elevation-1 border border-border">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="BarChart3" size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-text-primary">Ringkasan Hari Ini</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {summaryItems?.map((item, index) => (
          <div key={index} className="p-3 rounded-md bg-muted/50 dark:bg-muted/20 hover:bg-muted dark:hover:bg-muted/50 transition-colors duration-200">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name={item?.icon} size={16} className={item?.color} />
              <span className="text-sm text-text-secondary">{item?.label}</span>
            </div>
            <p className="font-mono font-semibold text-text-primary">
              {item?.value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Terakhir diperbarui:</span>
          <span className="text-text-primary font-medium">
            {new Date()?.toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BusinessSummaryCard;