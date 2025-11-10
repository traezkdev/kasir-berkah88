import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionCard = ({ transaction, onDelete, onEdit, isMobile = false, userRole, onRowClick }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  let paymentBadge = null;
  switch (transaction?.payment_method) {
    case 'Makan Karyawan':
      paymentBadge = (
        <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
          Makan Karyawan
        </span>
      );
      break;
    case 'Gojek':
      paymentBadge = (
        <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
          Gojek
        </span>
      );
      break;
    case 'Transfer':
      paymentBadge = (
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
          Transfer
        </span>
      );
      break;
    default:
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

  const handleDelete = () => {
    onDelete(transaction?.id);
    setShowDeleteConfirm(false);
  };

  const getTotalItems = () => {
    return transaction?.items?.reduce((total, item) => total + item?.quantity, 0);
  };

  if (isMobile) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-elevation-1 p-4 mb-3">
        <div className="flex items-start justify-between mb-3" onClick={() => onRowClick(transaction)}>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-text-primary">
                #{transaction?.id}
              </span>
              {paymentBadge}
            </div>
            <p className="text-xs text-text-secondary">
              {formatDateTime(transaction?.timestamp)}
            </p>
            <p className="text-xs text-text-secondary">
              Kasir: {transaction.cashier_name ? transaction.cashier_name : 'System'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-semibold text-text-primary">
              {formatCurrency(transaction?.total)}
            </p>
            <p className="text-xs text-text-secondary">
              {getTotalItems()} item
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRowClick(transaction)}
          >
            Lihat Struk
          </Button>
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
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                iconName="Trash2"
                className="text-destructive hover:text-destructive"
              />
            </div>
          )}
        </div>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
            <div className="bg-card rounded-lg p-6 max-w-sm w-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <Icon name="AlertTriangle" size={20} className="text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Hapus Transaksi
                </h3>
              </div>
              <p className="text-text-secondary mb-6">
                Apakah Anda yakin ingin menghapus transaksi #{transaction?.id}? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        )}
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
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              iconName="Trash2"
              className="text-destructive hover:text-destructive"
            />
          </div>
        )}
      </td>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-destructive/10 rounded-full">
                <Icon name="AlertTriangle" size={20} className="text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Hapus Transaksi
              </h3>
            </div>
            <p className="text-text-secondary mb-6">
              Apakah Anda yakin ingin menghapus transaksi #{transaction?.id}? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </tr>
  );
};

export default TransactionCard;