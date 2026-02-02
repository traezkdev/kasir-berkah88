import React from 'react';
import TransactionCard from './TransactionCard';

const TransactionTable = ({ transactions, onDeleteTransaction, onEditTransaction, isMobile, userRole, onRowClick, onOpenDeleteConfirm }) => {
  if (transactions?.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-elevation-1 p-8 text-center">
        <div className="text-text-secondary">
          <p className="text-lg font-medium mb-2">Tidak ada transaksi ditemukan</p>
          <p className="text-sm">Transaksi akan muncul di sini setelah Anda melakukan penjualan</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {transactions?.map((transaction) => (
          <TransactionCard
            key={transaction?.id}
            transaction={transaction}
            onDelete={onDeleteTransaction}
            onEdit={onEditTransaction}
            onRowClick={onRowClick} // Pass prop
            isMobile={true}
            userRole={userRole}
            onOpenDeleteConfirm={onOpenDeleteConfirm}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-1 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary dark:text-gray-100">
                ID Transaksi
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary dark:text-gray-100">
                Tanggal & Waktu
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary dark:text-gray-100">
                Item
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary dark:text-gray-100">
                Total
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary dark:text-gray-100">
                Jenis
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary dark:text-gray-100">
                Kasir
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary dark:text-gray-100">
                Aksi
              </th>

            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions?.map((transaction) => (
              <TransactionCard
                key={transaction?.id}
                transaction={transaction}
                onDelete={onDeleteTransaction}
                onEdit={onEditTransaction}
                onRowClick={onRowClick} // Pass prop
                isMobile={false}
                userRole={userRole}
                onOpenDeleteConfirm={onOpenDeleteConfirm}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(TransactionTable);