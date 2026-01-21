import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionCard = ({ transaction, onDelete, onEdit, isMobile = false, userRole, onRowClick, onOpenDeleteConfirm }) => {
  let paymentBadge = null;
  // Normalize payment method for comparison
  const normalizedPaymentMethod = transaction?.payment_method?.toLowerCase() || 'tunai';

  switch (normalizedPaymentMethod) {
    case 'employee_meal':
    case 'makan karyawan': // Handle both cases
      paymentBadge = (
        <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
          Makan Karyawan
        </span>
      );
      break;
    case 'gojek':
      paymentBadge = (
        <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
          Gojek
        </span>
      );
      break;
    case 'transfer':
      paymentBadge = (
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
          Transfer
        </span>
      );
      break;
    default: // Default is 'Tunai' for 'cash' or any unhandled
      paymentBadge = (
        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
          Tunai
        </span>
      );
  }

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

  const getTotalItems = () => {
    return transaction?.items?.reduce((total, item) => total + item?.quantity, 0);
  };

  if (isMobile) {
    return (
      <div
        className="p-5 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm active:scale-[0.98] transition-all duration-200"
        onClick={() => onRowClick(transaction)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                #{transaction?.id.slice(-6).toUpperCase()}
              </span>
              {paymentBadge}
            </div>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-tight">
              {formatDateTime(transaction?.timestamp)}
            </p>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-tight mt-1">
              Kasir: <span className="text-gray-900 dark:text-white font-bold">{transaction.cashier_name ? transaction.cashier_name : 'System'}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
              {formatCurrency(transaction?.total)}
            </p>
            <p className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mt-0.5">
              Success
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-slate-700 w-full mb-4"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Icon name="Receipt" size={16} />
            </div>
            <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">Detail Struk</span>
          </div>

          {userRole !== 'guest' && (
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
                className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-700 text-blue-500 dark:text-blue-400 flex items-center justify-center active:scale-90 transition-all hover:bg-gray-100 dark:hover:bg-slate-600"
              >
                <Icon name="Pencil" size={18} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenDeleteConfirm(transaction.id); }}
                className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 flex items-center justify-center active:scale-90 transition-all hover:bg-rose-100 dark:hover:bg-rose-900/30"
              >
                <Icon name="Trash2" size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <tr
      onClick={() => onRowClick(transaction)}
      className="hover:bg-muted/50 transition-colors duration-200 cursor-pointer"
    >
      <td className="px-4 py-3 text-sm font-medium text-text-primary">
        #{transaction?.id}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {formatDateTime(transaction?.timestamp)}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          {transaction?.items?.map((item, index) => (
            <div key={index} className="text-sm">
              <span className="text-text-primary">{item?.name}</span>
              <span className="text-text-secondary ml-2">x{item?.quantity}</span>
            </div>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-mono font-semibold text-text-primary">
        {formatCurrency(transaction?.total)}
      </td>
      <td className="px-4 py-3">
        {paymentBadge}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {transaction.cashier_name ? transaction.cashier_name : 'System'}
      </td>
      <td className="px-4 py-3">
        {userRole !== 'guest' && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
              iconName="Pencil"
              className="text-primary hover:text-primary"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onOpenDeleteConfirm(transaction.id); }}
              iconName="Trash2"
              className="text-destructive hover:text-destructive"
            />
          </div>
        )}
      </td>
    </tr>
  );
};

export default TransactionCard;