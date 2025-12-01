
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

const TrashTable = ({ transactions, onRestore, onPermanentDelete }) => {
  return (
    <div className="overflow-x-auto bg-background-card border-border-default rounded-lg shadow">
      <table className="min-w-full divide-y divide-border-default">
        <thead className="bg-background-default">
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
        <tbody className="bg-background-card divide-y divide-border-default">
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
