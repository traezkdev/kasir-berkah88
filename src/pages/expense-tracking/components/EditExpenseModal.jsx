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
    <div className="fixed inset-0 z-[1002] flex items-end lg:items-center justify-center p-0 lg:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div
        className="relative w-full lg:max-w-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden
                   lg:mx-auto lg:h-[90vh]
                   fixed lg:relative bottom-0 left-0 right-0 h-[92vh] lg:h-auto
                   rounded-none animate-in slide-in-from-bottom-full lg:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          {/* Sticky Header */}
          <div className="sticky top-0 p-6 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Icon name="Edit3" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Edit Pengeluaran</h2>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Perbarui detail biaya operasional</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all active:scale-95"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 pb-32">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Deskripsi Pengeluaran</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    placeholder="Contoh: Pembelian beras 10kg, bayar listrik"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Jumlah (Rp)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Kategori</label>
                  <select
                    name="category"
                    value={formData.category || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all dark:text-white"
                    required
                  >
                    <option value="">Pilih kategori...</option>
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Tanggal & Waktu</label>
                  <input
                    type="datetime-local"
                    name="date"
                    step="1"
                    value={formData.date || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all dark:text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Catatan (Opsional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Informasi tambahan pengeluaran..."
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all dark:text-white resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.15em] active:scale-95 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-4 bg-[#118eea] text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Icon name="Save" size={18} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
