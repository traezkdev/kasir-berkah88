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
      <div className="pb-32 space-y-6 px-6 pt-4 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-center">
           <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Anggaran</h1>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Limit Pengeluaran</p>
           </div>
          <button onClick={openAddModal} className="bg-indigo-600 text-white p-3 rounded-lg shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-90 transition-all">
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg flex items-center gap-2 border border-rose-100 dark:border-rose-500/20">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12"><PieChart size={120} strokeWidth={1} /></div>
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-indigo-100/60 text-[9px] font-black uppercase tracking-[0.3em] mb-2">Terpakai Bulan Ini</p>
              <p className="text-3xl font-black tracking-tight">{formatCurrency(totalUsed)}</p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <div>
                <p className="text-indigo-100/60 text-[9px] font-black uppercase tracking-widest mb-1">Total Limit</p>
                <p className="text-sm font-black">{formatCurrency(totalLimit)}</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-100/60 text-[9px] font-black uppercase tracking-widest mb-1">Sisa Anggaran</p>
                <p className="text-sm font-black text-emerald-300">{formatCurrency(totalLimit - totalUsed)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-gray-400">
            <div className="w-10 h-10 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Sinkronisasi...</span>
          </div>
        ) : (
          <div className="space-y-5">
            {budgets.map((budget) => {
              const used = Number(budget.used_amount);
              const limit = Number(budget.limit_amount);
              const percent = Math.min((used / limit) * 100, 100);
              const remaining = limit - used;

              return (
                <div key={budget.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-800 p-6 space-y-6 transition-all active:scale-[0.98]">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`p-4 rounded-lg shadow-sm ${percent >= 90 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                        <PieChart size={22} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{budget.category}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1 tracking-wider uppercase">{formatCurrency(used)} / {formatCurrency(limit)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(budget)} className="p-2.5 text-gray-400 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                        <Edit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleDelete(budget.id)} disabled={deletingId === budget.id} className="p-2.5 text-gray-400 dark:text-gray-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                        {deletingId === budget.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-3 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-slate-800 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1) ${percent >= 90 ? 'bg-rose-500 shadow-lg shadow-rose-200 dark:shadow-rose-900/20' : 'bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest leading-none px-1">
                      <span className="text-gray-400 dark:text-gray-600">Progres {Math.round(percent)}%</span>
                      <span className={remaining < 0 ? 'text-rose-500 font-black' : 'text-indigo-600 dark:text-indigo-400 font-black'}>
                         {remaining < 0 ? `Bocor ${formatCurrency(Math.abs(remaining))}` : `Sisa ${formatCurrency(remaining)}`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button onClick={() => openInputModal(budget)} 
                        className="w-full py-6 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20">
                      <Plus size={16} strokeWidth={3} /> Masukkan Belanja
                    </button>
                  </div>
                </div>
              );
            })}
            
            {budgets.length === 0 && (
              <div className="py-24 text-center px-10">
                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-lg flex items-center justify-center mx-auto mb-6 rotate-6 transform">
                  <PieChart size={32} className="text-gray-200 dark:text-slate-800" />
                </div>
                <p className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Belum ada budget aktif</p>
                <button onClick={openAddModal} className="mt-6 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest underline underline-offset-4">BUAT SEKARANG</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== BOTTOM SHEET MODAL BUDGET (Dark Mode Support) ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-xl shadow-[0_-20px_60px_rgba(0,0,0,0.3)] z-20 p-8 pb-12 space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mx-auto -mt-2 mb-2"></div>
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{editingId ? 'Ubah Budget' : 'Anggaran Baru'}</h2>
                  <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Atur limit pengeluaranmu</p>
               </div>
               <button onClick={closeModal} className="p-3 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Pilih Kategori</label>
                <select 
                  required 
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/10 text-gray-700 dark:text-gray-200"
                >
                  <option value="" disabled>-- Pilih Kategori --</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Limit Anggaran (Rp)</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-gray-700 text-lg">Rp</span>
                   <input 
                    required 
                    type="number" 
                    value={form.limit_amount} 
                    onChange={e => setForm({...form, limit_amount: e.target.value})}
                    placeholder="0" 
                    className="w-full pl-16 pr-6 py-6 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-2xl font-black text-center text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-gray-200 dark:placeholder:text-gray-800" 
                   />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-5 rounded-lg font-black uppercase tracking-[0.2em] text-xs text-white bg-indigo-600 shadow-2xl shadow-indigo-900/20 flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                     <span>{editingId ? 'SIMPAN PERUBAHAN' : 'BUAT ANGGARAN'}</span>
                     <Plus size={20} strokeWidth={3} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== BOTTOM SHEET MODAL INPUT CEPAT (FASTE EXPENSE) ===== */}
      {showInputModal && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closeInputModal} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-xl shadow-[0_-20px_60px_rgba(0,0,0,0.3)] z-20 p-8 pb-12 space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mx-auto -mt-2 mb-2"></div>
            <div className="text-center">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Catat Belanja</h2>
              <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Kategori: {selectedBudget?.category}</p>
            </div>
            
            <form onSubmit={handeFastExpense} className="space-y-8">
              <div className="space-y-3 text-center px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Masukkan Nominal (Rp)</label>
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
                    className="w-full pl-16 pr-6 py-6 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-3xl font-black text-center text-rose-600 dark:text-rose-400 focus:ring-4 focus:ring-rose-500/10 placeholder:text-gray-200 dark:placeholder:text-gray-800 shadow-sm" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={inputNote} 
                  onChange={e => setInputNote(e.target.value)}
                  placeholder="Catatan belanja hari ini..."
                  className="w-full px-8 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm text-center font-bold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-rose-500/10 placeholder:text-gray-300 dark:placeholder:text-gray-700 transition-all" 
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting || !inputAmount}
                className="w-full py-5 rounded-lg font-black uppercase tracking-[0.2em] text-xs text-white bg-emerald-600 shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? <Loader2 className="animate-spin" size={24} /> : (
                  <>
                     <span>CATAT SEKARANG</span>
                     <Coins size={22} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetMobile;
