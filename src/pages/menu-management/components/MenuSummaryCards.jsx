import React from 'react';
import Icon from '../../../components/AppIcon';

const MenuSummaryCards = ({ menuItems }) => {
  const gradientClasses = [
    "bg-gradient-to-br from-purple-500 to-indigo-500",
    "bg-gradient-to-br from-blue-500 to-cyan-500",
    "bg-gradient-to-br from-green-500 to-teal-500",
    "bg-gradient-to-br from-yellow-500 to-orange-500",
    "bg-gradient-to-br from-red-500 to-pink-500",
  ];

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
      color: 'text-white',
      bgColor: 'bg-white/20',
      description: 'Item menu tersedia'
    },
    {
      title: 'Total Stok',
      value: summary?.totalStock?.toString(),
      icon: 'Package',
      color: 'text-white',
      bgColor: 'bg-white/20',
      description: 'Unit tersedia'
    },
    {
      title: 'Nilai Stok',
      value: formatCurrency(summary?.totalValue),
      icon: 'DollarSign',
      color: 'text-white',
      bgColor: 'bg-white/20',
      description: 'Total nilai inventori'
    },
    {
      title: 'Stok Menipis',
      value: summary?.lowStockItems?.toString(),
      icon: 'AlertTriangle',
      color: 'text-white',
      bgColor: 'bg-white/20',
      description: 'Perlu restok segera'
    },
    {
      title: 'Stok Habis',
      value: summary?.outOfStockItems?.toString(),
      icon: 'XCircle',
      color: 'text-white',
      bgColor: 'bg-white/20',
      description: 'Tidak tersedia'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {summaryCards?.map((card, index) => (
        <div
          key={index}
          className={`rounded-lg shadow-elevation-1 p-4 hover:shadow-elevation-2 transition-shadow duration-200 ${gradientClasses[index % gradientClasses.length]}`}
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
            <p className="text-2xl font-mono font-bold text-white">
              {card?.value}
            </p>
            <p className="text-sm font-medium text-white">
              {card?.title}
            </p>
            <p className="text-xs text-white/80">
              {card?.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuSummaryCards;