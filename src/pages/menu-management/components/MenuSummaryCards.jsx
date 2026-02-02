import React from 'react';
import Icon from '../../../components/AppIcon';

const MenuSummaryCards = ({ menuItems }) => {
  const calculateSummary = () => {
    if (!menuItems) {
      return { totalItems: 0, totalStock: 0, totalValue: 0, lowStockItems: 0, outOfStockItems: 0 };
    }

    const totalItems = menuItems.length;
    const totalStock = menuItems.reduce((sum, item) => sum + Number(item?.stock || 0), 0);
    const totalValue = menuItems.reduce((sum, item) => sum + (Number(item?.stock || 0) * Number(item?.price || 0)), 0);
    const lowStockItems = menuItems.filter(item => Number(item?.stock || 0) <= 5 && Number(item?.stock || 0) > 0).length;
    const outOfStockItems = menuItems.filter(item => Number(item?.stock || 0) === 0).length;

    return { totalItems, totalStock, totalValue, lowStockItems, outOfStockItems };
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
    { title: 'Total Menu', value: summary?.totalItems, icon: 'UtensilsCrossed', color: 'blue' },
    { title: 'Total Stok', value: summary?.totalStock, icon: 'Package', color: 'indigo' },
    { title: 'Nilai Stok', value: formatCurrency(summary?.totalValue), icon: 'DollarSign', color: 'emerald' },
    { title: 'Stok Menipis', value: summary?.lowStockItems, icon: 'AlertTriangle', color: 'orange' },
    { title: 'Stok Habis', value: summary?.outOfStockItems, icon: 'rose' }
  ];

  return (
    <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-4 mb-6 pb-2 no-scrollbar px-1">
      {summaryCards.map((card, idx) => (
        <div
          key={idx}
          className="min-w-[160px] flex-shrink-0 lg:min-w-0 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all active:scale-95"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${card.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              card.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                card.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  card.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                    'bg-rose-50 text-rose-600'
              }`}>
              <Icon name={card.icon || 'Package'} size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
              {card.value}
            </p>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              {card.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(MenuSummaryCards);