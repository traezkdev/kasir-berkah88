import React, { useState } from 'react';

const ExpenseEntryForm = ({ onAddExpense, isLoading, userRole }) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const categoryOptions = [
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    
    return new Intl.NumberFormat('id-ID').format(parseInt(numericValue));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatCurrency(value);
    handleInputChange('amount', formattedValue);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Kategori pengeluaran harus dipilih';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Deskripsi pengeluaran harus diisi';
    }

    if (!formData.amount) {
      newErrors.amount = 'Jumlah pengeluaran harus diisi';
    } else {
      const numericAmount = parseInt(formData.amount.replace(/[^\d]/g, ''));
      if (numericAmount <= 0) {
        newErrors.amount = 'Jumlah harus lebih dari 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const numericAmount = parseInt(formData.amount.replace(/[^\d]/g, ''));

    const expenseData = {
      name: formData.description.trim(),
      amount: numericAmount,
      category: formData.category,
      date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      notes: formData.notes.trim(),
    };

    onAddExpense(expenseData);

    // Reset form
    setFormData({
      category: '',
      description: '',
      amount: '',
      notes: ''
    });
    setErrors({});
  };

  const handleClear = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      notes: ''
    });
    setErrors({});
  };

  // Simple SVG icons to replace the Icon component
  const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  const ResetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
      <path d="M3 3v5h5"></path>
    </svg>
  );

  const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200">
      <div className="p-4 lg:p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <div className="text-blue-600">
              <ListIcon />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Catat Pengeluaran</h2>
            <p className="text-sm text-gray-600">Tambahkan pengeluaran bisnis untuk tracking keuangan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Pengeluaran</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Pilih kategori pengeluaran</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pengeluaran</label>
              <input
                type="text"
                placeholder="0"
                value={formData.amount}
                onChange={handleAmountChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              <p className="mt-1 text-xs text-gray-500">Format: Rp 50.000</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pengeluaran</label>
            <input
              type="text"
              placeholder="Contoh: Pembelian beras 10kg, bayar listrik bulan ini"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
            <input
              type="text"
              placeholder="Catatan opsional untuk pengeluaran ini"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Opsional - untuk informasi tambahan</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || userRole === 'guest'}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex-1 sm:flex-none disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <PlusIcon />
                  <span>Tambah Pengeluaran</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex-1 sm:flex-none"
            >
              <ResetIcon />
              <span>Bersihkan Form</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseEntryForm;