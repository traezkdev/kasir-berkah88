import React, { useState, useEffect } from 'react';
import { Plus, PieChart, AlertTriangle, Edit2, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const emptyForm = {
  category: '',
  limit_amount: '',
};

const BudgetMobile = () => {
  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-orange-500';
    return 'bg-indigo-600';
  };

  const fetchBudgets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/budgets');
      setBudgets(res.data);
    } catch {
      setError('Gagal memuat data budget.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const expense = res.data.filter(c => c.type === 'expense').map(c => c.name);
      setExpenseCategories(expense);
    } catch {
      setExpenseCategories(['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan']);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const totalLimit = budgets.reduce((a, b) => a + Number(b.limit_amount), 0);
  const totalUsed = budgets.reduce((a, b) => a + Number(b.used_amount), 0);
  const totalSisa = totalLimit - totalUsed;

  // Modal handlers
  const openAddModal = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEditModal = (budget) => {
    setEditingId(budget.id);
    setForm({
      category: budget.category,
      limit_amount: budget.limit_amount,
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        category: form.category,
        limit_amount: Number(form.limit_amount),
      };
      if (editingId) {
        const res = await api.put(`/budgets/${editingId}`, payload);
        setBudgets(prev => prev.map(b => b.id === editingId ? res.data : b));
      } else {
        const res = await api.post('/budgets', payload);
        setBudgets(prev => [res.data, ...prev]);
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus budget ini?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch {
      alert('Gagal menghapus budget.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pb-24 space-y-6 px-6 pt-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Budgeting</h1>
        <button
          onClick={openAddModal}
          className="bg-white border border-gray-100 p-2.5 rounded-2xl shadow-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-2xl flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Hero Card */}
      {loading ? (
        <div className="bg-indigo-600 rounded-[2.5rem] p-6 flex items-center justify-center min-h-[130px]">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      ) : (
        <div className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-medium text-indigo-100 uppercase tracking-widest mb-1">Total Sisa Budget</p>
            <p className="text-2xl font-black mb-6">{formatCurrency(totalSisa)}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/20 backdrop-blur-md rounded-2xl p-3">
                <p className="text-[10px] font-bold text-indigo-100 uppercase mb-1">Total Limit</p>
                <p className="text-sm font-bold">{formatCurrency(totalLimit)}</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3">
                <p className="text-[10px] font-bold text-indigo-100 uppercase mb-1">Terpakai</p>
                <p className="text-sm font-bold">{formatCurrency(totalUsed)}</p>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* List Budget */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Kategori Anggaran</p>

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="animate-spin text-indigo-400" size={24} />
          </div>
        ) : budgets.length === 0 ? (
          <div className="py-16 bg-white rounded-[2rem] border border-dashed border-gray-200 text-center">
            <p className="text-gray-400 font-medium text-sm">Belum ada budget. Tap + untuk mulai.</p>
          </div>
        ) : (
          budgets.map((budget) => {
            const percent = Math.min((Number(budget.used_amount) / Number(budget.limit_amount)) * 100, 100);
            const isWarning = percent >= 90;

            return (
              <div key={budget.id} className="bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm space-y-4 active:scale-[0.98] transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isWarning ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      <PieChart size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-gray-800">{budget.category}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        Sisa: {formatCurrency(Number(budget.limit_amount) - Number(budget.used_amount))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isWarning && (
                      <div className="p-1.5 bg-red-50 rounded-xl text-red-500">
                        <AlertTriangle size={14} />
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400">Terpakai</p>
                      <p className={`text-xs font-black ${isWarning ? 'text-red-600' : 'text-gray-800'}`}>{Math.round(percent)}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${getProgressColor(percent)}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase italic">
                    <span>{formatCurrency(budget.used_amount)}</span>
                    <span>Limit: {formatCurrency(budget.limit_amount)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEditModal(budget)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    disabled={deletingId === budget.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-60"
                  >
                    {deletingId === budget.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tambah Baru */}
      {!loading && (
        <button
          onClick={openAddModal}
          className="w-full bg-white border-2 border-dashed border-gray-200 py-4 rounded-3xl text-gray-400 text-xs font-bold hover:border-indigo-300 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Tambah Kategori Baru
        </button>
      )}

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-lg rounded-t-[2rem] shadow-2xl pb-safe">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
            <div className="px-6 pb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">{editingId ? 'Edit Budget' : 'Buat Budget Baru'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori Pengeluaran</label>
                <select
                  required
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="" disabled>-- Pilih Kategori --</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Limit (Rp)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.limit_amount}
                  onChange={e => setForm({ ...form, limit_amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-bold text-sm">Batal</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (editingId ? 'Simpan' : 'Buat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetMobile;
