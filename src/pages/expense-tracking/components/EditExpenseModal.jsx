import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';

const EditExpenseModal = ({ isOpen, onClose, expense, onUpdateExpense, isLoading }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (expense) {
      // Format date to YYYY-MM-DDTHH:mm:ss for datetime-local input
      // Ensuring it's treated as Asia/Jakarta time
      const dateStr = formatInTimeZone(new Date(expense.date), 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss");
      setFormData({ ...expense, date: dateStr });
    } else {
      setFormData({});
    }
  }, [expense]);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
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

  const categoryOptions = categories.map(cat => ({
    value: cat.name,
    label: cat.name
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!expense || !formData.date) {
      alert('Tanggal dan waktu pengeluaran wajib diisi.');
      return;
    }

    const updatedFormData = {
      ...formData,
      // Pass the date string directly without converting to UTC ISO
      date: formData.date.replace('T', ' '),
    };
    onUpdateExpense(updatedFormData);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1002] p-4">
      <div className="bg-card rounded-lg shadow-elevation-3 max-w-lg w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-border">
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
                label="Tanggal & Waktu"
                name="date"
                type="datetime-local"
                step="1"
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

          <div className="p-6 bg-card-foreground/5 border-t border-border flex justify-end space-x-3">
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
