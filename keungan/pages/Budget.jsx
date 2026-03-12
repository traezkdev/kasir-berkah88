import React, { useState, useEffect } from 'react';
import { Plus, PieChart, AlertTriangle, Edit2, Trash2, X, Loader2, Search, AlertCircle } from 'lucide-react';
import api from '../services/api';

const emptyForm = {
  category: '',
  limit_amount: '',
};

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
      setError('Gagal memuat data. Pastikan server backend aktif.');
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

  const filteredBudgets = budgets.filter(b =>
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLimit = budgets.reduce((a, b) => a + Number(b.limit_amount), 0);
  const totalUsed = budgets.reduce((a, b) => a + Number(b.used_amount), 0);
  const totalSisa = totalLimit - totalUsed;

  // Modal
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Anggaran Bulanan</h1>
          <p className="text-gray-500">Batasi pengeluaranmu agar tidak over-budget.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Buat Budget Baru</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><PieChart size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Limit</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(totalLimit)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Terpakai</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalUsed)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><PieChart size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sisa Budget</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalSisa)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari kategori budget..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Budget Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3 text-gray-300">
          <Loader2 className="animate-spin" size={32} />
          <span className="text-sm font-medium">Memuat data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBudgets.map((budget) => {
            const percent = Math.min((Number(budget.used_amount) / Number(budget.limit_amount)) * 100, 100);
            const isWarning = percent >= 90;

            return (
              <div key={budget.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${isWarning ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <PieChart size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    {isWarning && (
                      <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-bounce">
                        <AlertTriangle size={12} />
                        Warning
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{budget.category}</h3>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-400">Terpakai: {formatCurrency(budget.used_amount)}</span>
                      <span className="text-gray-800 font-bold">Limit: {formatCurrency(budget.limit_amount)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${getProgressColor(percent)}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress: {Math.round(percent)}%</p>
                      <p className={`text-xs font-bold ${isWarning ? 'text-red-600' : 'text-indigo-600'}`}>
                        Sisa: {formatCurrency(Number(budget.limit_amount) - Number(budget.used_amount))}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      disabled={deletingId === budget.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-60"
                    >
                      {deletingId === budget.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBudgets.length === 0 && !loading && (
            <div className="col-span-full py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 text-center">
              <p className="text-gray-400 font-medium">Belum ada budget. Klik "Buat Budget Baru" untuk mulai.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-[2rem] shadow-2xl">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Budget' : 'Buat Budget Baru'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-bold">Batal</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Simpan' : 'Buat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;
