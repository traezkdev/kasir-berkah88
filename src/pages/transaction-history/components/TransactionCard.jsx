import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionCard = ({ transaction, onDelete, isMobile = false, userRole }) => {
  const [isExpanded, setIsExpanded] = useState(false);
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
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
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
      <div className="bg-white rounded-lg border border-slate-200 shadow-elevation-1 p-4 mb-3">
        <div className="flex items-start justify-between mb-3">
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
            onClick={() => setIsExpanded(!isExpanded)}
            iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
            iconPosition="right"
          >
            Detail
          </Button>
          {userRole !== 'guest' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              iconName="Trash2"
              className="text-destructive hover:text-destructive"
            />
          )}
        </div>
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="space-y-2">
              {transaction?.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-text-primary">{item?.name}</span>
                    <span className="text-text-secondary ml-2">x{item?.quantity}</span>
                  </div>
                  <span className="font-mono text-text-primary">
                    {formatCurrency(item?.price * item?.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
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
                  onClick={() => setShowDeleteConfirm(false)}
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
    <tr className="hover:bg-muted/50 transition-colors duration-200">
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
      <td className="px-4 py-3">
        {userRole !== 'guest' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            iconName="Trash2"
            className="text-destructive hover:text-destructive"
          />
        )}
      </td>
      {showDeleteConfirm && (
        <td colSpan="6" className="absolute inset-0">
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
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
                  onClick={() => setShowDeleteConfirm(false)}
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
        </td>
      )}
    </tr>
  );
};

export default TransactionCard;