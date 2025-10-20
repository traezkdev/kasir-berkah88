import React from 'react';
import Icon from '../../../components/AppIcon';

const MenuSummaryCards = ({ menuItems }) => {
  const calculateSummary = () => {
    const totalItems = menuItems?.length;
    const totalStock = menuItems?.reduce((sum, item) => sum + item?.stock, 0);
    const totalValue = menuItems?.reduce((sum, item) => sum + (item?.stock * item?.price), 0);
    const lowStockItems = menuItems?.filter(item => item?.stock <= 5 && item?.stock > 0)?.length;
    const outOfStockItems = menuItems?.filter(item => item?.stock === 0)?.length;

    return {
      totalItems,
      totalStock,
      totalValue,
      lowStockItems,
      outOfStockItems
    };
  };

  const summary = calculateSummary();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    })?.format(amount);
  };

  const summaryCards = [
    {
      title: 'Total Menu',
      value: summary?.totalItems?.toString(),
      icon: 'UtensilsCrossed',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'Item menu tersedia'
    },
    {
      title: 'Total Stok',
      value: summary?.totalStock?.toString(),
      icon: 'Package',
      color: 'text-success',
      bgColor: 'bg-success/10',
      description: 'Unit tersedia'
    },
    {
      title: 'Nilai Stok',
      value: formatCurrency(summary?.totalValue),
      icon: 'DollarSign',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      description: 'Total nilai inventori'
    },
    {
      title: 'Stok Menipis',
      value: summary?.lowStockItems?.toString(),
      icon: 'AlertTriangle',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      description: 'Perlu restok segera'
    },
    {
      title: 'Stok Habis',
      value: summary?.outOfStockItems?.toString(),
      icon: 'XCircle',
      color: 'text-error',
      bgColor: 'bg-error/10',
      description: 'Tidak tersedia'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {summaryCards?.map((card, index) => (
        <div
          key={index}
          className="bg-card rounded-lg shadow-elevation-1 border border-border p-4 hover:shadow-elevation-2 transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${card?.bgColor}`}>
              <Icon name={card?.icon} size={20} className={card?.color} />
            </div>
            {card?.title === 'Stok Menipis' && summary?.lowStockItems > 0 && (
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            )}
            {card?.title === 'Stok Habis' && summary?.outOfStockItems > 0 && (
              <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-mono font-bold text-foreground">
              {card?.value}
            </p>
            <p className="text-sm font-medium text-foreground">
              {card?.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {card?.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuSummaryCards;