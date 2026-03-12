import React, { useState, useEffect } from 'react';
import { 
  Plus, PieChart, AlertCircle, Search, 
  Edit2, Trash2, X, Loader2, Coins 
} from 'lucide-react';
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

  // CRUD Handlers
  const openAddModal = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEditModal = (b) => {
    setEditingId(b.id);
    setForm({ category: b.category, limit_amount: b.limit_amount });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setForm(emptyForm); setEditingId(null); };

  // Fast Input Handlers (Shortcut Pengeluaran)
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
      alert(err.response?.data?.message || 'Gagal menyimpan budget.');
    } finally {
      setSubmitting(false);
    }
  };

  const handeFastExpense = async (e) => {
    e.preventDefault();
    if (!inputAmount) return;
    setSubmitting(true);
    try {
      // POST ke transaksi langsung
      await api.post('/transactions', {
        type: 'expense',
        category: selectedBudget.category,
        amount: Number(inputAmount),
        note: inputNote || `Belanja ${selectedBudget.category} (via Budget)`,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Refresh budget data (karena used_amount dihitung otomatis di backend)
      await fetchBudgets();
      closeInputModal();
    } catch (err) {
      alert('Gagal mencatat pengeluaran.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Anggaran Saya</h1>
          <p className="text-gray-500">Kendalikan pengeluaranmu dengan limit anggaran.</p>
        </div>
        <button onClick={openAddModal} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus size={20} /> <span>Buat Budget</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Hero Stats */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><PieChart size={120} /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-1">
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Total Limit</p>
            <p className="text-3xl font-black">{formatCurrency(totalLimit)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Terpakai</p>
            <p className="text-3xl font-black">{formatCurrency(totalUsed)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Sisa Budget</p>
            <p className="text-3xl font-black text-green-300">{formatCurrency(totalLimit - totalUsed)}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari kategori budget..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 text-sm"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Budget Cards */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3 text-gray-300">
          <Loader2 className="animate-spin" size={32} />
          <span className="text-sm font-medium">Memuat data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBudgets.map((budget) => {
            const used = Number(budget.used_amount);
            const limit = Number(budget.limit_amount);
            const percent = Math.min((used / limit) * 100, 100);
            const remaining = limit - used;

            return (
              <div key={budget.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${percent >= 90 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <PieChart size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openInputModal(budget)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100" title="Tambah Pengeluaran">
                        <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{budget.category}</h3>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-400">Terpakai: {formatCurrency(used)}</span>
                      <span className="text-gray-800 font-bold">Limit: {formatCurrency(limit)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${percent >= 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress: {Math.round(percent)}%</p>
                      <p className={`text-xs font-bold ${remaining < 0 ? 'text-red-500' : 'text-indigo-600'}`}>
                        {remaining < 0 ? `Over: ${formatCurrency(Math.abs(remaining))}` : `Sisa: ${formatCurrency(remaining)}`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
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
                      {deletingId === budget.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBudgets.length === 0 && (
            <div className="col-span-full py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 text-center">
              <p className="text-gray-400 font-medium">Belum ada budget yang dibuat.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL BUDGET (CREATE/EDIT) ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Anggaran' : 'Buat Anggaran Baru'}</h2>
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
                  min="0"
                  value={form.limit_amount}
                  onChange={e => setForm({ ...form, limit_amount: e.target.value })}
                  placeholder="Contoh: 500000"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">Batal</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-70">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Simpan' : 'Buat Budget')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL INPUT CEPAT (FASTE EXPENSE) ===== */}
      {showInputModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeInputModal} />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Catat Belanja</h2>
              <button onClick={closeInputModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X size={20} /></button>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-2xl text-center">
              <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Budget {selectedBudget?.category}</p>
              <p className="text-[10px] text-indigo-500 font-medium italic">Data akan otomatis muncul di Transaksi</p>
            </div>

            <form onSubmit={handeFastExpense} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal Belanja (Rp)</label>
                <input required type="number" min="1"
                  value={inputAmount} onChange={e => setInputAmount(e.target.value)}
                  placeholder="0" autoFocus
                  className="w-full px-4 py-5 bg-gray-50 border-none rounded-2xl text-2xl font-black text-center focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catatan (Optional)</label>
                <input type="text"
                  value={inputNote} onChange={e => setInputNote(e.target.value)}
                  placeholder="Beli apa hari ini?"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeInputModal} className="flex-1 py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-bold">Batal</button>
                <button type="submit" disabled={submitting || !inputAmount}
                  className="flex-1 py-3.5 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-100 flex items-center justify-center gap-2 disabled:opacity-70">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Coins size={18}/> Catat</>}
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
