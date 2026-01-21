import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import authFetch from '../../../utils/authFetch';
import Icon from '../../../components/AppIcon';

const ExpenseEntryForm = ({ onAddExpense, isLoading, userRole, isInsideModal = false }) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch('/api/expense-categories');
        const data = await response.json();
        if (response.ok) {
          // Map to format suitable for select options
          const options = data.data.map(cat => ({
            value: cat.name, // Using name as value to match existing data structure if needed, or cat.id
            label: cat.name
          }));
          setCategoryOptions(options);
        }
      } catch (err) {
        console.error("Failed to fetch expense categories:", err);
      }
    };

    fetchCategories();
  }, []);

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
      date: formatInTimeZone(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
      notes: formData.notes.trim(),
    };

    onAddExpense(expenseData);

    // Reset form
    setFormData({
      category: '',
      description: '',
      amount: '',
      notes: '',
      date: ''
    });
    setErrors({});
  };

  const handleClear = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      notes: '',
      date: ''
    });
    setErrors({});
  };

  // Content render
  const formContent = (
    <div className={isInsideModal ? "" : "p-4 lg:p-8"}>
      {!isInsideModal && (
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Icon name="PlusCircle" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
              Catat Pengeluaran
            </h2>
            <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
              Tambahkan detail biaya operasional bisnis Anda
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Kategori Pengeluaran</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all dark:text-white ${errors.category ? 'border-rose-500' : 'border-gray-100 dark:border-slate-700'}`}
              required
            >
              <option value="" className="dark:bg-slate-900">Pilih kategori...</option>
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value} className="dark:bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-[10px] font-bold text-rose-500 px-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Jumlah (Rp)</label>
            <input
              type="text"
              placeholder="0"
              value={formData.amount}
              onChange={handleAmountChange}
              className={`w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all dark:text-white ${errors.amount ? 'border-rose-500' : 'border-gray-100 dark:border-slate-700'}`}
              required
            />
            {errors.amount && <p className="mt-1 text-[10px] font-bold text-rose-500 px-1">{errors.amount}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Deskripsi Pengeluaran</label>
            <input
              type="text"
              placeholder="Contoh: Pembelian beras 10kg, bayar listrik"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all dark:text-white ${errors.description ? 'border-rose-500' : 'border-gray-100 dark:border-slate-700'}`}
              required
            />
            {errors.description && <p className="mt-1 text-[10px] font-bold text-rose-500 px-1">{errors.description}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Catatan (Opsional)</label>
            <textarea
              placeholder="Informasi tambahan pengeluaran..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows="3"
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all dark:text-white resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading || userRole === 'guest'}
            className="flex-1 py-4 bg-[#118eea] text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Icon name="PlusCircle" size={20} />
                <span>Simpan Pengeluaran</span>
              </>
            )}
          </button>

          {!isInsideModal && (
            <button
              type="button"
              onClick={handleClear}
              className="px-8 py-4 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );

  return isInsideModal ? (
    formContent
  ) : (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      {formContent}
    </div>
  );
};

export default ExpenseEntryForm;