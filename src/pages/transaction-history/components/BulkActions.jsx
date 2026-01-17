import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const BulkActions = ({
  onClearAllTransactions,
  onExportTransactions,
  onOpenRecapPopup,
  transactionCount,
  isExporting = false,
  userRole
}) => {
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [password, setPassword] = useState(''); // State for password
  const [passwordError, setPasswordError] = useState(''); // State for password error
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);
  const [currentExportType, setCurrentExportType] = useState('');
  const [exportOption, setExportOption] = useState('today'); // State for selected export option
  const [customDateRange, setCustomDateRange] = useState({
    startDate: null,
    endDate: null,
  });

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

  const handleExportClick = (type) => {
    setCurrentExportType(type);
    setShowExportOptionsModal(true);
  };

  const handleConfirmExport = () => {
    let startDate = null;
    let endDate = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    switch (exportOption) {
      case 'today':
        startDate = today;
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        break;
      case 'byDate':
        startDate = customDateRange.startDate ? new Date(customDateRange.startDate) : null;
        endDate = customDateRange.startDate ? new Date(customDateRange.startDate.getFullYear(), customDateRange.startDate.getMonth(), customDateRange.startDate.getDate(), 23, 59, 59, 999) : null;
        break;
      case 'byWeek':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday as start of week
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'byMonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'custom':
        startDate = customDateRange.startDate;
        endDate = customDateRange.endDate ? new Date(customDateRange.endDate.getFullYear(), customDateRange.endDate.getMonth(), customDateRange.endDate.getDate(), 23, 59, 59, 999) : null;
        break;
      default:
        break;
    }

    if (startDate && endDate) {
      onExportTransactions(currentExportType, startDate.toISOString(), endDate.toISOString());
    }

    setShowExportOptionsModal(false);
    setExportOption('today'); // Reset to default
    setCustomDateRange({ startDate: null, endDate: null }); // Reset custom date range
  };


  const exportOptionsButtons = [
    { label: 'Export Excel', type: 'excel', icon: 'FileSpreadsheet' },
    { label: 'Export PDF', type: 'pdf', icon: 'FileText' }
  ];

  return (
    <div className="my-6 text-white rounded-3xl shadow-lg shadow-blue-500/20 p-5 lg:p-6 bulk-actions-container relative overflow-hidden" style={{ backgroundColor: '#118EEA' }}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

        {/* Information Section */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-inner">
            <Icon name="List" size={24} />
          </div>
          <div>
            <p className="text-sm text-blue-100 font-medium">Total Data</p>
            <h3 className="text-xl font-bold text-white">
              {transactionCount} <span className="text-sm font-normal text-blue-100">Transaksi</span>
            </h3>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">

          {/* Main Actions Group */}
          <div className="flex items-center gap-2 flex-wrap">
            {['admin', 'kasir'].includes(userRole) && (
              <Button
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                variant="outline"
                size="sm"
                onClick={() => navigate('/cash-reconciliation')}
                iconName="Calculator"
                iconPosition="left"
              >
                Rekonsiliasi
              </Button>
            )}

            <Button
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              variant="outline"
              size="sm"
              onClick={onOpenRecapPopup}
              iconName="BookCopy"
              iconPosition="left"
            >
              Rekap Harian
            </Button>
          </div>

          <div className="h-8 w-px bg-white/20 hidden sm:block mx-1"></div>

          {/* Export Actions Group */}
          <div className="flex items-center gap-2">
            {exportOptionsButtons?.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleExportClick(option.type)}
                iconName={option.icon}
                loading={isExporting}
                disabled={transactionCount === 0}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                title={option.label}
              >
                <span className="iconPosition-left">{option.label.replace('Export ', '')}</span>
              </Button>
            ))}
          </div>

          <div className="h-8 w-px bg-white/20 hidden sm:block mx-1"></div>

          {/* Destructive Actions Group */}
          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <Link to="/transaction-trash">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  iconName="Trash"
                  iconPosition="left"
                >
                  Tong Sampah
                </Button>
              </Link>
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={openClearConfirm}
              iconName="Trash2"
              disabled={transactionCount === 0 || userRole === 'guest'}
              className="shadow-lg shadow-red-900/20 bg-red-400 hover:bg-red-500 border-none text-white"
            >
              Hapus Semua
            </Button>
          </div>
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
      {/* Export Options Modal */}
      {showExportOptionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Icon name={currentExportType === 'excel' ? 'FileSpreadsheet' : 'FileText'} size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Export Transaksi ke {currentExportType === 'excel' ? 'Excel' : 'PDF'}
              </h3>
            </div>

            <div className="mb-6 space-y-4">
              <p className="text-text-secondary">Pilih rentang waktu untuk export:</p>

              {/* Export Option Radios */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportOption"
                    value="today"
                    checked={exportOption === 'today'}
                    onChange={(e) => {
                      setExportOption(e.target.value);
                      setCustomDateRange({ startDate: null, endDate: null });
                    }}
                    className="form-radio text-primary"
                  />
                  <span className="text-foreground">Hari Ini</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportOption"
                    value="byDate"
                    checked={exportOption === 'byDate'}
                    onChange={(e) => setExportOption(e.target.value)}
                    className="form-radio text-primary"
                  />
                  <span className="text-foreground">Per Tanggal</span>
                </label>
                {exportOption === 'byDate' && (
                  <Input
                    type="date"
                    value={customDateRange.startDate ? format(customDateRange.startDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setCustomDateRange({ startDate: e.target.value ? new Date(e.target.value) : null, endDate: e.target.value ? new Date(e.target.value) : null })}
                    className="mt-2 w-full"
                  />
                )}
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportOption"
                    value="byWeek"
                    checked={exportOption === 'byWeek'}
                    onChange={(e) => {
                      setExportOption(e.target.value);
                      setCustomDateRange({ startDate: null, endDate: null });
                    }}
                    className="form-radio text-primary"
                  />
                  <span className="text-foreground">Per Minggu</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportOption"
                    value="byMonth"
                    checked={exportOption === 'byMonth'}
                    onChange={(e) => {
                      setExportOption(e.target.value);
                      setCustomDateRange({ startDate: null, endDate: null });
                    }}
                    className="form-radio text-primary"
                  />
                  <span className="text-foreground">Per Bulan</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportOption"
                    value="custom"
                    checked={exportOption === 'custom'}
                    onChange={(e) => setExportOption(e.target.value)}
                    className="form-radio text-primary"
                  />
                  <span className="text-foreground">Custom Tanggal</span>
                </label>
                {exportOption === 'custom' && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Input
                      type="date"
                      value={customDateRange.startDate ? format(customDateRange.startDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : null }))}
                      className="w-full"
                    />
                    <Input
                      type="date"
                      value={customDateRange.endDate ? format(customDateRange.endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : null }))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExportOptionsModal(false);
                  setExportOption('today'); // Reset to default
                  setCustomDateRange({ startDate: null, endDate: null }); // Reset custom date range
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmExport}
                className="flex-1"
                loading={isExporting}
                disabled={
                  (exportOption === 'byDate' && !customDateRange.startDate) ||
                  (exportOption === 'custom' && (!customDateRange.startDate || !customDateRange.endDate))
                }
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActions;
