import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input'; // Import Input

const BulkActions = ({ 
  onClearAllTransactions, 
  onExportTransactions, 
  transactionCount,
  isExporting = false,
  userRole 
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [password, setPassword] = useState(''); // State for password
  const [passwordError, setPasswordError] = useState(''); // State for password error

  const handleClearAll = () => {
    if (password === 'berkah88') {
      onClearAllTransactions();
      setShowClearConfirm(false);
      setPassword('');
      setPasswordError('');
    } else {
      setPasswordError('Kata sandi salah. Silakan coba lagi.');
    }
  };

  const openClearConfirm = () => {
    setShowClearConfirm(true);
    setPassword('');
    setPasswordError('');
  };

  const exportOptions = [
    { label: 'Export Excel', action: () => onExportTransactions('excel'), icon: 'FileSpreadsheet' },
    { label: 'Export PDF', action: () => onExportTransactions('pdf'), icon: 'FileText' }
  ];

  return (
    <div className="bg-card border-b border-border p-4 lg:p-6">
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
            onClick={openClearConfirm}
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
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
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
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Peringatan: Tindakan ini tidak dapat dibatalkan!
                </p>
                <p className="text-sm text-destructive mt-1">
                  Semua data riwayat transaksi akan hilang secara permanen.
                </p>
              </div>
              
              {/* Password Input */}
              <div>
                <label htmlFor="password-confirm" className="text-sm font-medium text-text-primary">
                  Masukkan kata sandi untuk konfirmasi:
                </label>
                <Input
                  id="password-confirm"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi"
                  className="mt-2"
                  autoComplete="new-password" // Use "new-password" for password fields
                />
                {passwordError && (
                  <p className="text-sm text-destructive mt-2">{passwordError}</p>
                )}
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
