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

    if (!expense || !formData.date) {
      onUpdateExpense(formData);
      return;
    }

    // Extract original time components in 'Asia/Jakarta' timezone
    const originalExpenseDate = new Date(expense.date);
    const originalHour = formatInTimeZone(originalExpenseDate, 'Asia/Jakarta', 'HH');
    const originalMinute = formatInTimeZone(originalExpenseDate, 'Asia/Jakarta', 'mm');
    const originalSecond = formatInTimeZone(originalExpenseDate, 'Asia/Jakarta', 'ss');

    // Combine the new date (from formData.date) with the original time components
    // and explicitly state it's in 'Asia/Jakarta' timezone for correct interpretation.
    // We construct a string that new Date() can parse, then convert to ISOString.
    const combinedDateTimeString = `${formData.date}T${originalHour}:${originalMinute}:${originalSecond}`;

    // Create a Date object. This will be interpreted as local time if no timezone is specified.
    // To ensure it's treated as 'Asia/Jakarta' time, we need to be careful.
    // A robust way is to use a library function that creates a date in a specific timezone.
    // Since zonedTimeToUtc is problematic, we'll rely on the backend to correctly interpret
    // the ISO string, assuming it's always UTC.

    // The most reliable way to send a specific date and time (e.g., 2025-10-10 11:06:00 in Jakarta) to a backend
    // is to convert it to its equivalent UTC ISO string.
    // We can construct a Date object that represents this specific instant in time.
    // The `new Date()` constructor with a string like 'YYYY-MM-DDTHH:mm:ss' without 'Z' or offset
    // will be parsed as local time. We need to adjust for that.

    // Let's create a Date object that represents the desired date and time in 'Asia/Jakarta'
    // and then convert it to UTC.
    const [year, month, day] = formData.date.split('-').map(Number);

    // Create a Date object in the local timezone, then adjust it to represent the 'Asia/Jakarta' time.
    // This is a bit tricky without zonedTimeToUtc.
    // A simpler approach is to send the date string with timezone info if possible, or let backend handle.

    // Given the constraints, the most straightforward approach is to construct a Date object
    // that represents the desired moment in 'Asia/Jakarta' and then convert it to UTC.
    // We can use the `Date` constructor with individual components, which defaults to local time.
    // Then, we need to adjust it to reflect 'Asia/Jakarta' time.

    // Let's try to construct a Date object that represents the exact moment in 'Asia/Jakarta'
    // and then convert it to UTC. This is the most robust way without `zonedTimeToUtc`.
    const dateInJakarta = new Date(
      Date.UTC(year, month - 1, day, parseInt(originalHour, 10), parseInt(originalMinute, 10), parseInt(originalSecond, 10))
    );

    // Now, we need to adjust this UTC date to be the equivalent of the 'Asia/Jakarta' time.
    // This is where the timezone offset comes in. 'Asia/Jakarta' is UTC+7.
    // So, if we want 11:06:00 in Jakarta, we need to send 04:06:00 UTC.
    // The `Date.UTC` constructor already creates a UTC date.
    // The `originalHour`, `originalMinute`, `originalSecond` are already in 'Asia/Jakarta' time.
    // So, we need to subtract the UTC offset of 'Asia/Jakarta' from the hour to get the UTC hour.

    // Get the UTC offset for 'Asia/Jakarta' (which is +7 hours)
    // This is a constant, but can be dynamic if needed.
    const jakartaUtcOffsetHours = 7;

    const utcHour = parseInt(originalHour, 10) - jakartaUtcOffsetHours;

    const finalDateInUtc = new Date(
      Date.UTC(year, month - 1, day, utcHour, parseInt(originalMinute, 10), parseInt(originalSecond, 10))
    );

    const updatedFormData = {
      ...formData,
      date: finalDateInUtc.toISOString(), // Send as ISO string (UTC) to backend
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
