import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentTransactionsList = ({ transactions = [], onViewAll }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(new Date(date));
  };

  const getTransactionIcon = (isEmployeeMeal) => {
    return isEmployeeMeal
      ? { icon: 'Users', color: 'text-accent' }
      : { icon: 'ShoppingCart', color: 'text-success' };
  };

  if (transactions?.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-elevation-1 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Transaksi Terbaru</h2>
        </div>
        <div className="text-center py-8">
          <Icon name="FileText" size={48} className="text-text-secondary mx-auto mb-3" />
          <p className="text-text-secondary">Belum ada transaksi</p>
          <p className="text-sm text-text-secondary mt-1">Mulai dengan membuat transaksi pertama</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-elevation-1 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Transaksi Terbaru</h2>
        <Button
          variant="ghost"
          size="sm"
          iconName="ArrowRight"
          iconPosition="right"
          onClick={onViewAll}
        >
          Lihat Semua
        </Button>
      </div>
      <div className="space-y-3">
        {transactions?.map((transaction) => {
          const iconData = getTransactionIcon(transaction.isEmployeeMeal);
          
          return (
            <div key={transaction.id} className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted transition-colors duration-200">
              <div className={`p-2 rounded-md bg-muted ${iconData.color}`}>
                <Icon name={iconData.icon} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-text-primary truncate">
                    {transaction.isEmployeeMeal ? 'Makan Karyawan' : `Transaksi #${transaction.id}`}
                  </p>
                  <span className="font-mono text-sm text-success">
                    +{formatCurrency(transaction.total)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-text-secondary">
                    {transaction.items ? `${transaction.items.length} item` : ''}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatDateTime(transaction.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentTransactionsList;