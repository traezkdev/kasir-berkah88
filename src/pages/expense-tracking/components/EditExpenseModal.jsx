import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const EditExpenseModal = ({ isOpen, onClose, expense, onUpdateExpense, isLoading }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (expense) {
      // Format date to YYYY-MM-DD for the input field
      const formattedDate = expense.date ? formatInTimeZone(new Date(expense.date), 'Asia/Jakarta', 'yyyy-MM-dd') : '';
      setFormData({ ...expense, date: formattedDate });
    } else {
      setFormData({});
    }
  }, [expense]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Preserve the original time to prevent it from being reset
    const originalTime = expense.date ? formatInTimeZone(new Date(expense.date), 'Asia/Jakarta', 'HH:mm:ss') : '00:00:00';
    
    const updatedFormData = {
      ...formData,
      // Combine the potentially updated date from the form with the original time
      date: formData.date ? formatInTimeZone(new Date(`${formData.date}T${originalTime}`), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss') : null,
    };
    onUpdateExpense(updatedFormData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1002] p-4">
      <div className="bg-white rounded-lg shadow-elevation-3 max-w-lg w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon name="Edit3" size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Edit Pengeluaran</h3>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <Input
              label="Nama Pengeluaran"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Contoh: Beli Gas Elpiji"
              required
            />
            <Input
              label="Jumlah (Rp)"
              name="amount"
              type="number"
              value={formData.amount || ''}
              onChange={handleChange}
              placeholder="Contoh: 25000"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tanggal"
                name="date"
                type="date"
                value={formData.date || ''}
                onChange={handleChange}
                required
              />
              <Select
                label="Kategori"
                options={categoryOptions}
                value={formData.category || ''}
                onChange={handleSelectChange}
                placeholder="Pilih kategori..."
                required
              />
            </div>
             <Input
              label="Catatan (Opsional)"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Catatan tambahan..."
            />
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={isLoading} disabled={isLoading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
