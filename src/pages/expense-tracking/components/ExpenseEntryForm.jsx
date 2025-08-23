import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const ExpenseEntryForm = ({ onAddExpense, isLoading = false }) => {
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
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatCurrency = (value) => {
    const numericValue = value?.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    
    return new Intl.NumberFormat('id-ID')?.format(parseInt(numericValue));
  };

  const handleAmountChange = (e) => {
    const value = e?.target?.value;
    const formattedValue = formatCurrency(value);
    handleInputChange('amount', formattedValue);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.category) {
      newErrors.category = 'Kategori pengeluaran harus dipilih';
    }

    if (!formData?.description?.trim()) {
      newErrors.description = 'Deskripsi pengeluaran harus diisi';
    }

    if (!formData?.amount) {
      newErrors.amount = 'Jumlah pengeluaran harus diisi';
    } else {
      const numericAmount = parseInt(formData?.amount?.replace(/[^\d]/g, ''));
      if (numericAmount <= 0) {
        newErrors.amount = 'Jumlah harus lebih dari 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const numericAmount = parseInt(formData?.amount?.replace(/[^\d]/g, ''));
    const categoryLabel = categoryOptions?.find(opt => opt?.value === formData?.category)?.label || formData?.category;

    const expenseData = {
      id: Date.now()?.toString(),
      category: formData?.category,
      categoryLabel,
      description: formData?.description?.trim(),
      amount: numericAmount,
      notes: formData?.notes?.trim(),
      date: new Date()?.toISOString(),
      timestamp: new Date()
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

  return (
    <div className="bg-white rounded-lg shadow-elevation-2 border border-slate-200">
      <div className="p-4 lg:p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Icon name="Receipt" size={24} className="text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Catat Pengeluaran</h2>
            <p className="text-sm text-text-secondary">Tambahkan pengeluaran bisnis untuk tracking keuangan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Select
              label="Kategori Pengeluaran"
              placeholder="Pilih kategori pengeluaran"
              options={categoryOptions}
              value={formData?.category}
              onChange={(value) => handleInputChange('category', value)}
              error={errors?.category}
              required
              className="lg:col-span-1"
            />

            <Input
              label="Jumlah Pengeluaran"
              type="text"
              placeholder="0"
              value={formData?.amount}
              onChange={handleAmountChange}
              error={errors?.amount}
              required
              className="lg:col-span-1"
              description="Format: Rp 50.000"
            />
          </div>

          <Input
            label="Deskripsi Pengeluaran"
            type="text"
            placeholder="Contoh: Pembelian beras 10kg, bayar listrik bulan ini"
            value={formData?.description}
            onChange={(e) => handleInputChange('description', e?.target?.value)}
            error={errors?.description}
            required
            className="w-full"
          />

          <Input
            label="Catatan Tambahan"
            type="text"
            placeholder="Catatan opsional untuk pengeluaran ini"
            value={formData?.notes}
            onChange={(e) => handleInputChange('notes', e?.target?.value)}
            className="w-full"
            description="Opsional - untuk informasi tambahan"
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              iconName="Plus"
              iconPosition="left"
              className="flex-1 sm:flex-none"
            >
              Tambah Pengeluaran
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              iconName="RotateCcw"
              iconPosition="left"
              className="flex-1 sm:flex-none"
            >
              Bersihkan Form
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseEntryForm;