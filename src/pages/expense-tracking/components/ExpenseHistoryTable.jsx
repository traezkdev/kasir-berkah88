import React, { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';

const ExpenseHistoryTable = ({
  expenses = [],
  onDeleteExpense,
  onBulkDelete,
  onExportData,
  onEditExpense,
  isLoading = false,
  userRole,
  dateFilter = '',
  onDateFilterChange,
  onFilteredCountChange, // New prop to send filtered count to parent
  currentPage = 1,
  itemsPerPage = 20
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [categories, setCategories] = useState([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch('/api/expense-categories');
        const data = await response.json();
        if (response.ok) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch expense categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const categoryOptions = [
    { value: '', label: 'Semua Kategori' },
    ...categories.map(cat => ({
      value: cat.name,
      label: cat.name
    }))
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
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const filteredExpenses = expenses?.filter(expense => {
    const lowercasedSearchTerm = searchTerm?.toLowerCase() || '';
    const matchesSearch = expense?.name?.toLowerCase()?.includes(lowercasedSearchTerm);
    const matchesCategory = !categoryFilter || expense?.category === categoryFilter;
    const matchesDate = !dateFilter || (expense?.date && formatInTimeZone(new Date(expense.date), 'Asia/Jakarta', 'yyyy-MM-dd') === dateFilter);
    return matchesSearch && matchesCategory && matchesDate;
  });

  // Notify parent about filtered count for pagination
  React.useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filteredExpenses?.length || 0);
    }
  }, [filteredExpenses?.length, onFilteredCountChange]);

  // Client-side pagination after filtering
  const indexOfLastExpense = currentPage * itemsPerPage;
  const indexOfFirstExpense = indexOfLastExpense - itemsPerPage;
  const paginatedExpenses = filteredExpenses?.slice(indexOfFirstExpense, indexOfLastExpense) || [];

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
      <div className="bg-card rounded-lg shadow-md border dark:bg-dark-card dark:border-dark-border dark:shadow-dark-md">
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
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm text-blue-600">
            <Icon name="History" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-1">Riwayat Pengeluaran</h3>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{filteredExpenses?.length} dari {expenses?.length} pengeluaran terdata</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar lg:pb-0">
          <button
            onClick={() => onExportData('excel', filteredExpenses)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest active:scale-95 transition-all shadow-sm whitespace-nowrap"
          >
            <Icon name="Download" size={14} />
            Excel
          </button>
          <button
            onClick={() => onExportData('pdf', filteredExpenses)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest active:scale-95 transition-all shadow-sm whitespace-nowrap"
          >
            <Icon name="FileText" size={14} />
            PDF
          </button>
          {userRole !== 'guest' && (
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/10 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest active:scale-95 transition-all shadow-sm whitespace-nowrap"
            >
              <Icon name="Trash2" size={14} />
              {selectedExpenses?.length > 0 ? `Hapus (${selectedExpenses?.length})` : 'Hapus Semua'}
            </button>
          )}
        </div>
      </div>

      {/* Filters Overlay */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 lg:col-span-7">
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e?.target?.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 lg:col-span-2.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="lg:bg-white lg:dark:bg-slate-800 lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 lg:dark:border-slate-700 lg:overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-alt border-b border-border dark:bg-dark-background-alt dark:border-dark-border">
              <tr>
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={selectedExpenses?.length === filteredExpenses?.length && filteredExpenses?.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-border dark:border-dark-border text-primary focus:ring-primary"
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-secondary">Tanggal</th>
                <th className="text-left p-4 text-sm font-medium text-text-secondary">Kategori</th>
                <th className="text-left p-4 text-sm font-medium text-text-secondary">Deskripsi</th>
                <th className="text-right p-4 text-sm font-medium text-text-secondary">Jumlah</th>
                <th className="text-left p-4 text-sm font-medium text-text-secondary">Dicatat Oleh</th>
                <th className="text-center p-4 text-sm font-medium text-text-secondary">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExpenses?.map((expense) => (
                <tr key={expense?.id} className="border-b border-border dark:border-dark-border hover:bg-background-alt dark:hover:bg-dark-background-alt">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedExpenses?.includes(expense?.id)}
                      onChange={() => handleSelectExpense(expense?.id)}
                      className="rounded border-border dark:border-dark-border text-primary focus:ring-primary"
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
                  <td className="p-4 text-sm text-text-secondary">
                    {expense.recorded_by ? expense.recorded_by : 'System'}
                  </td>
                  <td className="p-4 text-center flex items-center justify-center">
                    {userRole !== 'guest' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditExpense(expense)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Icon name="Edit3" size={16} />
                      </Button>
                    )}
                    {userRole !== 'guest' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDeleteConfirm(expense?.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {paginatedExpenses?.map((expense) => (
            <div key={expense?.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedExpenses?.includes(expense?.id)}
                      onChange={() => handleSelectExpense(expense?.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-2 mt-1"
                    />
                    <div>
                      <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                        {categoryLabelMap.get(expense?.category) || expense?.category}
                      </span>
                      <div className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5">
                        {formatDate(expense?.date)} • {formatTime(expense?.date)}
                      </div>
                      <div className="text-[10px] font-medium text-gray-400 dark:text-slate-500 mt-1">
                        Dicatat: {expense.recorded_by ? expense.recorded_by : 'System'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {userRole !== 'guest' && (
                      <button
                        onClick={() => onEditExpense(expense)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95 transition-all"
                      >
                        <Icon name="Edit3" size={16} />
                      </button>
                    )}
                    {userRole !== 'guest' && (
                      <button
                        onClick={() => setShowDeleteConfirm(expense?.id)}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-95 transition-all"
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3 pb-3 border-b border-gray-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    {expense?.name}
                  </h4>
                  {expense?.notes && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                      {expense?.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Total Biaya</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 tracking-tight">
                    {formatCurrency(expense?.amount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
            <div className="bg-card dark:bg-dark-card rounded-lg shadow-elevation-3 max-w-md w-full">
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
            <div className="bg-card dark:bg-dark-card rounded-lg shadow-elevation-3 max-w-md w-full">
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
    </div>
  );
};

export default ExpenseHistoryTable;