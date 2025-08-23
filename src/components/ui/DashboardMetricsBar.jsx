import React from 'react';
import Icon from '../AppIcon';

const DashboardMetricsBar = ({ 
  isCollapsed = false, 
  showOnAllPages = false,
  metrics = {
    todaySales: { value: 'Rp 2.450.000', change: '+12%', trend: 'up' },
    totalTransactions: { value: '47', change: '+8', trend: 'up' },
    averageOrder: { value: 'Rp 52.128', change: '+5%', trend: 'up' },
    lowStock: { value: '3', change: '-2', trend: 'down' }
  }
}) => {
  const metricItems = [
    {
      key: 'todaySales',
      label: 'Penjualan Hari Ini',
      icon: 'TrendingUp',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      key: 'totalTransactions',
      label: 'Total Transaksi',
      icon: 'ShoppingCart',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      key: 'averageOrder',
      label: 'Rata-rata Order',
      icon: 'Calculator',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      key: 'lowStock',
      label: 'Stok Menipis',
      icon: 'AlertTriangle',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  if (isCollapsed && !showOnAllPages) {
    return (
      <div className="hidden lg:block fixed top-16 left-0 right-0 z-500 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex items-center justify-center py-3 px-4">
          <div className="flex items-center space-x-6">
            {metricItems?.map((item) => {
              const metric = metrics?.[item?.key];
              return (
                <div key={item?.key} className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-md ${item?.bgColor}`}>
                    <Icon name={item?.icon} size={16} className={item?.color} />
                  </div>
                  <div className="text-sm">
                    <span className="font-mono font-medium text-text-primary">{metric?.value}</span>
                    <span className={`ml-2 text-xs ${
                      metric?.trend === 'up' ? 'text-success' : 'text-warning'
                    }`}>
                      {metric?.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-slate-200 shadow-elevation-1">
      <div className="px-4 lg:px-6 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricItems?.map((item) => {
            const metric = metrics?.[item?.key];
            return (
              <div key={item?.key} className="glass-morphism rounded-lg p-4 hover:shadow-elevation-2 transition-shadow duration-200 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-md ${item?.bgColor}`}>
                    <Icon name={item?.icon} size={20} className={item?.color} />
                  </div>
                  <div className={`flex items-center space-x-1 text-xs font-medium ${
                    metric?.trend === 'up' ? 'text-success' : 'text-warning'
                  }`}>
                    <Icon 
                      name={metric?.trend === 'up' ? 'TrendingUp' : 'TrendingDown'} 
                      size={12} 
                    />
                    <span>{metric?.change}</span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-mono font-semibold text-text-primary mb-1 break-words">
                    {metric?.value}
                  </p>
                  <p className="text-sm text-text-secondary">{item?.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardMetricsBar;