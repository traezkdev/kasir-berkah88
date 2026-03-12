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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Anggaran Saya</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-sm">Kendalikan pengeluaranmu dengan limit anggaran.</p>
        </div>
        <button onClick={openAddModal} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
          <Plus size={18} strokeWidth={3} /> <span>Buat Budget</span>
        </button>
      </div>

      {error && (
        <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-lg flex items-center gap-3">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Hero Stats */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-2xl shadow-indigo-100 dark:shadow-indigo-900/40 relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 p-6 opacity-10 transform rotate-12"><PieChart size={140} /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="space-y-1">
            <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.3em]">Total Limit</p>
            <p className="text-2xl font-black tracking-tight">{formatCurrency(totalLimit)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.3em]">Terpakai</p>
            <p className="text-2xl font-black tracking-tight">{formatCurrency(totalUsed)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.3em]">Sisa Budget</p>
            <p className="text-2xl font-black tracking-tight text-emerald-300">{formatCurrency(totalLimit - totalUsed)}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm transition-colors overflow-hidden">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 transition-colors group-focus-within:text-indigo-500" size={18} />
          <input 
            type="text" 
            placeholder="Cari kategori budget..."
            className="w-full pl-12 pr-6 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700 transition-all shadow-inner"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Budget Cards */}
      {loading ? (
        <div className="py-32 flex flex-col items-center gap-4 text-gray-400">
          <div className="w-12 h-12 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Menyusun Data Budget...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBudgets.map((budget) => {
            const used = Number(budget.used_amount);
            const limit = Number(budget.limit_amount);
            const percent = Math.min((used / limit) * 100, 100);
            const remaining = limit - used;

            return (
              <div key={budget.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 hover:shadow-xl dark:shadow-black/20 transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className={`p-3 rounded-lg shadow-sm transition-transform group-hover:scale-110 ${percent >= 90 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                    <PieChart size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditModal(budget)} 
                      className="p-2 text-gray-400 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-700" 
                      title="Edit Budget"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(budget.id)} 
                      disabled={deletingId === budget.id}
                      className="p-2 text-gray-400 dark:text-gray-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-700" 
                      title="Hapus Budget"
                    >
                      {deletingId === budget.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{budget.category}</h3>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                      <span className="text-gray-400 dark:text-gray-500">Terpakai: <span className="text-gray-900 dark:text-gray-200">{formatCurrency(used)}</span></span>
                      <span className="text-gray-900 dark:text-gray-200">Limit: {formatCurrency(limit)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-3 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-slate-700 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1) ${percent >= 90 ? 'bg-rose-500 shadow-lg shadow-rose-200 dark:shadow-rose-900/20' : 'bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Progress: {Math.round(percent)}%</p>
                      <p className={`text-xs font-black tracking-tight ${remaining < 0 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {remaining < 0 ? `BOCOR: ${formatCurrency(Math.abs(remaining))}` : `SISA: ${formatCurrency(remaining)}`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => openInputModal(budget)}
                      className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl ${
                        percent >= 90
                          ? 'bg-rose-600 text-white shadow-rose-900/10 hover:bg-rose-700'
                          : 'bg-indigo-600 text-white shadow-indigo-900/10 hover:bg-indigo-700'
                      }`}
                    >
                      <Coins size={14} strokeWidth={3} /> Input Pengeluaran
                    </button>
                  </div>
                </div>

                {/* Aesthetic BG Element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 dark:bg-slate-800/20 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors" />
              </div>
            );
          })}

          {filteredBudgets.length === 0 && (
            <div className="col-span-full py-32 bg-white dark:bg-slate-900 rounded-xl border-4 border-dashed border-gray-100 dark:border-slate-800 text-center flex flex-col items-center">
               <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center mb-8 rotate-12 transition-transform hover:rotate-0">
                  <PieChart size={40} className="text-gray-200 dark:text-slate-700" />
               </div>
              <p className="text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest text-xs">Belum ada budget terdaftar</p>
              <button onClick={openAddModal} className="mt-8 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] hover:underline">MULAI SEKARANG</button>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL BUDGET (CREATE/EDIT) ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 pb-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -ml-16 -mt-16" />
               <div className="relative">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{editingId ? 'Edit Anggaran' : 'Budget Baru'}</h2>
                  <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Atur limit pengeluaranmu</p>
               </div>
              <button onClick={closeModal} className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all relative z-10">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Kategori Pengeluaran</label>
                <select
                  required
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black uppercase tracking-wider focus:ring-4 focus:ring-indigo-500/10 text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Kategori --</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Limit Anggaran (Rp)</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 dark:text-gray-600 text-lg">Rp</span>
                   <input
                    required
                    type="number"
                    min="1"
                    value={form.limit_amount}
                    onChange={e => setForm({ ...form, limit_amount: e.target.value })}
                    placeholder="0"
                    className="w-full pl-16 pr-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-xl font-black text-indigo-600 dark:text-indigo-400 placeholder:text-gray-200 dark:placeholder:text-gray-700 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">BATAL</button>
                <button type="submit" disabled={submitting}
                  className="flex-2 px-10 py-5 bg-indigo-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-900/20 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-70 transform hover:-translate-y-1">
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                       <span>{editingId ? 'SIMPAN' : 'BUAT SEKARANG'}</span>
                       <Plus size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL INPUT CEPAT (FASTE EXPENSE) ===== */}
      {showInputModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={closeInputModal} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Catat Belanja</h2>
                  <p className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mt-1">{selectedBudget?.category}</p>
               </div>
              <button onClick={closeInputModal} className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"><X size={24} strokeWidth={3} /></button>
            </div>
            
            <div className="bg-rose-50 dark:bg-rose-500/5 p-6 rounded-xl text-center border border-rose-100 dark:border-rose-500/10">
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-black italic uppercase tracking-widest leading-relaxed">PENGELUARAN AKAN OTOMATIS<br/>TERCATAT DI RIWAYAT</p>
            </div>

            <form onSubmit={handeFastExpense} className="space-y-8">
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nominal (Rp)</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-gray-700 text-lg">Rp</span>
                   <input 
                    required 
                    type="number" 
                    min="1"
                    value={inputAmount} 
                    onChange={e => setInputAmount(e.target.value)}
                    placeholder="0" 
                    autoFocus
                    className="w-full pl-16 pr-6 py-6 bg-gray-50 dark:bg-slate-800 border-none rounded-[1.5rem] text-3xl font-black text-center text-rose-600 dark:text-rose-400 focus:ring-4 focus:ring-rose-500/10 shadow-sm placeholder:text-gray-200 dark:placeholder:text-gray-800" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Catatan Pesan</label>
                <input 
                  type="text"
                  value={inputNote} 
                  onChange={e => setInputNote(e.target.value)}
                  placeholder="Beli apa hari ini?"
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700" 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeInputModal} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">BATAL</button>
                <button 
                  type="submit" 
                  disabled={submitting || !inputAmount}
                  className="flex-2 px-8 py-5 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-3 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-70 transform hover:-translate-y-1"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                       <span>SIMPAN</span>
                       <ArrowUpRight size={18} strokeWidth={3} />
                    </>
                  )}
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
