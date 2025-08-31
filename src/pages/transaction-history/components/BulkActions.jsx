import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActions = ({ 
  onClearAllTransactions, 
  onExportTransactions, 
  transactionCount,
  isExporting = false,
  userRole 
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = () => {
    onClearAllTransactions();
    setShowClearConfirm(false);
  };

  const exportOptions = [
    { label: 'Export Excel', action: () => onExportTransactions('excel'), icon: 'FileSpreadsheet' },
    { label: 'Export PDF', action: () => onExportTransactions('pdf'), icon: 'FileText' }
  ];

  return (
    <div className="bg-white border-b border-slate-200 p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-text-secondary">
          Menampilkan {transactionCount} transaksi
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
          {/* Export Actions */}
          <div className="flex items-center space-x-2">
            {exportOptions?.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={option?.action}
                iconName={option?.icon}
                iconPosition="left"
                loading={isExporting}
                disabled={transactionCount === 0}
              >
                {option?.label}
              </Button>
            ))}
          </div>

          {/* Clear All Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            iconName="Trash2"
            iconPosition="left"
            disabled={transactionCount === 0 || userRole === 'guest'}
          >
            Hapus Semua
          </Button>
        </div>
      </div>
      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-destructive/10 rounded-full">
                <Icon name="AlertTriangle" size={24} className="text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Hapus Semua Transaksi
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-text-secondary mb-3">
                Apakah Anda yakin ingin menghapus semua {transactionCount} transaksi? 
              </p>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Peringatan: Tindakan ini tidak dapat dibatalkan!
                </p>
                <p className="text-sm text-destructive mt-1">
                  Semua data riwayat transaksi akan hilang secara permanen.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAll}
                className="flex-1"
              >
                Ya, Hapus Semua
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActions;