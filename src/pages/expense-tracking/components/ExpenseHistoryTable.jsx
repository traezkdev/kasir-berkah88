import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const ExpenseHistoryTable = ({ 
  expenses = [], 
  onDeleteExpense, 
  onBulkDelete,
  onExportData,
  isLoading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const categoryOptions = [
    { value: '', label: 'Semua Kategori' },
    { value: 'supplies', label: 'Bahan Baku & Supplies' },
    { value: 'utilities', label: 'Listrik & Air' },
    { value: 'inventory', label: 'Pembelian Stok' },
    { value: 'equipment', label: 'Peralatan' },
    { value: 'maintenance', label: 'Perawatan & Perbaikan' },
    { value: 'transport', label: 'Transportasi' },
    { value: 'marketing', label: 'Promosi & Marketing' },
    { value: 'operational', label: 'Operasional Lainnya' },
    { value: 'other', label: 'Lain-lain' }
  ];

  const categoryLabelMap = new Map(categoryOptions.map(opt => [opt.value, opt.label]));

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(numericAmount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredExpenses = expenses?.filter(expense => {
    const lowercasedSearchTerm = searchTerm?.toLowerCase() || '';
    const matchesSearch = expense?.name?.toLowerCase()?.includes(lowercasedSearchTerm);
    const matchesCategory = !categoryFilter || expense?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSelectExpense = (expenseId) => {
    setSelectedExpenses(prev => 
      prev?.includes(expenseId) 
        ? prev?.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedExpenses?.length === filteredExpenses?.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses?.map(expense => expense?.id));
    }
  };

  const handleDeleteExpense = (expenseId) => {
    onDeleteExpense(expenseId);
    setShowDeleteConfirm(null);
    setSelectedExpenses(prev => prev?.filter(id => id !== expenseId));
  };

  const handleBulkDelete = () => {
    if (selectedExpenses?.length > 0) {
      selectedExpenses?.forEach(id => onDeleteExpense(id));
      setSelectedExpenses([]);
    } else {
      onBulkDelete();
    }
    setShowBulkDeleteConfirm(false);
  };

  if (expenses?.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-elevation-2 border border-slate-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Receipt" size={32} className="text-text-secondary" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">Belum Ada Pengeluaran</h3>
          <p className="text-text-secondary">
            Mulai catat pengeluaran bisnis Anda untuk tracking keuangan yang lebih baik.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-elevation-2 border border-slate-200">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="History" size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Riwayat Pengeluaran</h3>
              <p className="text-sm text-text-secondary">{filteredExpenses?.length} dari {expenses?.length} pengeluaran</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onExportData('excel')}
              iconName="Download"
              iconPosition="left"
              size="sm"
            >
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => onExportData('pdf')}
              iconName="FileText"
              iconPosition="left"
              size="sm"
            >
              Export PDF
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => setShowBulkDeleteConfirm(true)}
              iconName="Trash2"
              iconPosition="left"
              size="sm"
            >
              {selectedExpenses?.length > 0 ? `Hapus ${selectedExpenses?.length}` : 'Hapus Semua'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Input
            type="search"
            placeholder="Cari pengeluaran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="lg:col-span-2"
          />
          
          <Select
            placeholder="Filter kategori"
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="lg:col-span-1"
          />
        </div>
      </div>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4">
                <input
                  type="checkbox"
                  checked={selectedExpenses?.length === filteredExpenses?.length && filteredExpenses?.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
              </th>
              <th className="text-left p-4 text-sm font-medium text-text-secondary">Tanggal</th>
              <th className="text-left p-4 text-sm font-medium text-text-secondary">Kategori</th>
              <th className="text-left p-4 text-sm font-medium text-text-secondary">Deskripsi</th>
              <th className="text-right p-4 text-sm font-medium text-text-secondary">Jumlah</th>
              <th className="text-center p-4 text-sm font-medium text-text-secondary">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses?.map((expense) => (
              <tr key={expense?.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedExpenses?.includes(expense?.id)}
                    onChange={() => handleSelectExpense(expense?.id)}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </td>
                <td className="p-4">
                  <div className="text-sm text-text-primary font-medium">
                    {formatDate(expense?.date)}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {formatTime(expense?.date)}
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                    {categoryLabelMap.get(expense?.category) || expense?.category}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm text-text-primary font-medium">
                    {expense?.name}
                  </div>
                  {expense?.notes && (
                    <div className="text-xs text-text-secondary mt-1">
                      {expense?.notes}
                    </div>
                  )}
                </td>
                <td className="p-4 text-right">
                  <span className="text-sm font-mono font-semibold text-destructive">
                    {formatCurrency(expense?.amount)}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteConfirm(expense?.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-slate-100">
        {filteredExpenses?.map((expense) => (
          <div key={expense?.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedExpenses?.includes(expense?.id)}
                  onChange={() => handleSelectExpense(expense?.id)}
                  className="rounded border-slate-300 text-primary focus:ring-primary mt-1"
                />
                <div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                    {categoryLabelMap.get(expense?.category) || expense?.category}
                  </span>
                  <div className="text-xs text-text-secondary mt-1">
                    {formatDate(expense?.date)} • {formatTime(expense?.date)}
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(expense?.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            </div>

            <div className="mb-3">
              <h4 className="text-sm font-medium text-text-primary mb-1">
                {expense?.name}
              </h4>
              {expense?.notes && (
                <p className="text-xs text-text-secondary">
                  {expense?.notes}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-lg font-mono font-bold text-destructive">
                {formatCurrency(expense?.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
          <div className="bg-white rounded-lg shadow-elevation-3 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Icon name="AlertTriangle" size={24} className="text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Hapus Pengeluaran</h3>
              </div>
              
              <p className="text-text-secondary mb-6">
                Apakah Anda yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteExpense(showDeleteConfirm)}
                  className="flex-1"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
          <div className="bg-white rounded-lg shadow-elevation-3 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Icon name="AlertTriangle" size={24} className="text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedExpenses?.length > 0 ? 'Hapus Pengeluaran Terpilih' : 'Hapus Semua Pengeluaran'}
                </h3>
              </div>
              
              <p className="text-text-secondary mb-6">
                {selectedExpenses?.length > 0 
                  ? `Apakah Anda yakin ingin menghapus ${selectedExpenses?.length} pengeluaran yang dipilih?`
                  : 'Apakah Anda yakin ingin menghapus semua pengeluaran? Tindakan ini tidak dapat dibatalkan.'
                }
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="flex-1"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseHistoryTable;