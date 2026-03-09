
import React from 'react';
import { format } from 'date-fns';
import id from 'date-fns/locale/id';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const TrashTable = ({ transactions, onRestore, onPermanentDelete, isMobile, onViewDetails }) => {
  if (isMobile) {
    return (
      <div className="space-y-4">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-border-default cursor-pointer hover:bg-background-hover transition-colors"
              onClick={() => onViewDetails(transaction)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{transaction.id}</h3>
                  <p className="text-xs text-text-secondary">
                    {format(new Date(transaction.deleted_at), 'd MMMM yyyy, HH:mm', { locale: id })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-text-primary">
                    {formatCurrency(transaction.total)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    Kasir: {transaction.cashier_name || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(transaction.id);
                  }}
                  className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition-colors"
                >
                  Pulihkan
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPermanentDelete(transaction.id);
                  }}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-md hover:bg-red-100 transition-colors"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-text-secondary bg-white dark:bg-slate-900 rounded-lg border border-border-default">
            <p>Tidak ada transaksi di tong sampah.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-border-default rounded-lg">
      <table className="min-w-full divide-y divide-border-default">
        <thead className="bg-white dark:bg-slate-900">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              ID Transaksi
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Tanggal Dihapus
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Kasir
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900 divide-y divide-border-default">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-background-hover">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{transaction.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {format(new Date(transaction.deleted_at), 'd MMMM yyyy, HH:mm', { locale: id })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{formatCurrency(transaction.total)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{transaction.cashier_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onRestore(transaction.id)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Pulihkan
                  </button>
                  <button
                    onClick={() => onPermanentDelete(transaction.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Hapus Permanen
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-sm text-text-secondary">
                Tidak ada transaksi di tong sampah.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TrashTable;
