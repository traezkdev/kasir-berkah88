import React, { useState, useEffect } from 'react';
import { 
  Plus, PieChart, AlertCircle, Search, 
  Edit2, Trash2, X, Loader2, Coins 
} from 'lucide-react';
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

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [inputAmount, setInputAmount] = useState('');
  const [inputNote, setInputNote] = useState('');

  const [form, setForm] = useState(emptyForm);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

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

  // CRUD Handlers
  const openAddModal = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEditModal = (b) => {
    setEditingId(b.id);
    setForm({ category: b.category, limit_amount: b.limit_amount });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setForm(emptyForm); setEditingId(null); };

  // Fast Input Handlers
  const openInputModal = (b) => {
    setSelectedBudget(b);
    setInputAmount('');
    setInputNote('');
    setShowInputModal(true);
  };
  const closeInputModal = () => {
    setShowInputModal(false);
    setSelectedBudget(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        const res = await api.put(`/budgets/${editingId}`, form);
        setBudgets(prev => prev.map(b => b.id === editingId ? res.data : b));
      } else {
        const res = await api.post('/budgets', form);
        setBudgets(prev => [...prev, res.data]);
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handeFastExpense = async (e) => {
    e.preventDefault();
    if (!inputAmount) return;
    setSubmitting(true);
    try {
      await api.post('/transactions', {
        type: 'expense',
        category: selectedBudget.category,
        amount: Number(inputAmount),
        note: inputNote || `Belanja ${selectedBudget.category} (Mobile)`,
        date: new Date().toISOString().split('T')[0]
      });
      await fetchBudgets();
      closeInputModal();
    } catch (err) {
      alert('Gagal mencatat pengeluaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus budget ini?')) return;
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
    <>
      <div className="pb-24 space-y-6 px-6 pt-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Anggaran</h1>
          <button onClick={openAddModal} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
            <Plus size={20} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-xs font-medium rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><PieChart size={100} /></div>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Terpakai Bulan Ini</p>
              <p className="text-3xl font-black">{formatCurrency(totalUsed)}</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/20">
              <div>
                <p className="text-indigo-100 text-[9px] font-bold uppercase">Total Limit</p>
                <p className="text-sm font-bold">{formatCurrency(totalLimit)}</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-100 text-[9px] font-bold uppercase">Sisa</p>
                <p className="text-sm font-bold text-green-300">{formatCurrency(totalLimit - totalUsed)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-300">
            <Loader2 className="animate-spin" size={28} />
            <span className="text-xs font-medium">Memuat data...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const used = Number(budget.used_amount);
              const limit = Number(budget.limit_amount);
              const percent = Math.min((used / limit) * 100, 100);
              const remaining = limit - used;

              return (
                <div key={budget.id} className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-50 p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`p-3 rounded-2xl ${percent >= 90 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        <PieChart size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{budget.category}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{formatCurrency(used)} / {formatCurrency(limit)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(budget)} className="p-2 text-gray-400">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(budget.id)} disabled={deletingId === budget.id} className="p-2 text-gray-400">
                        {deletingId === budget.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${percent >= 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold uppercase">
                      <span className="text-gray-400">Progress {Math.round(percent)}%</span>
                      <span className={remaining < 0 ? 'text-red-500' : 'text-indigo-600'}>
                         {remaining < 0 ? `Over ${formatCurrency(Math.abs(remaining))}` : `Sisa ${formatCurrency(remaining)}`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button onClick={() => openInputModal(budget)} 
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-100">
                      <Plus size={16} /> Input Pengeluaran
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== BOTTOM SHEET MODAL BUDGET ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full bg-white rounded-t-[2.5rem] shadow-2xl z-10 p-6 pb-12 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <h2 className="text-base font-bold text-gray-800">{editingId ? 'Edit Anggaran' : 'Buat Anggaran'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100">
                  <option value="" disabled>-- Pilih Kategori --</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Limit Budget (Rp)</label>
                <input required type="number" value={form.limit_amount} onChange={e => setForm({...form, limit_amount: e.target.value})}
                  placeholder="0" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-4 rounded-2xl font-bold text-white bg-indigo-600 flex items-center justify-center gap-2 shadow-lg disabled:opacity-70">
                {submitting ? <Loader2 className="animate-spin" size={22} /> : (editingId ? 'Simpan Perubahan' : 'Buat Anggaran')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== BOTTOM SHEET MODAL INPUT CEPAT ===== */}
      {showInputModal && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeInputModal} />
          <div className="relative w-full bg-white rounded-t-[2.5rem] shadow-2xl z-10 p-6 pb-12 space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800">Catat Belanja</h2>
              <p className="text-xs text-indigo-500 font-medium">Budget: {selectedBudget?.category}</p>
            </div>
            
            <form onSubmit={handeFastExpense} className="space-y-6">
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Masukkan Nominal</label>
                <input required type="number" min="1"
                  value={inputAmount} onChange={e => setInputAmount(e.target.value)}
                  placeholder="0" autoFocus
                  className="w-full px-4 py-6 bg-gray-50 border-none rounded-[2rem] text-3xl font-black text-center focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="space-y-1.5">
                <input type="text" value={inputNote} onChange={e => setInputNote(e.target.value)}
                  placeholder="Tambah catatan..."
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm text-center font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>
              <button type="submit" disabled={submitting || !inputAmount}
                className="w-full py-5 rounded-[2rem] font-bold text-white text-lg bg-green-600 flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all disabled:opacity-70">
                {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Coins size={24}/> Catat Belanja</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetMobile;
