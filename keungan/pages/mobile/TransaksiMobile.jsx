import React, { useState, useEffect } from 'react';
import {
  Plus, Search, ArrowUpRight, ArrowDownRight,
  X, Loader2, AlertCircle, Edit2, Trash2, ChevronRight, Download
} from 'lucide-react';
import api from '../../services/api';
import { downloadTransaksiPDF } from '../../services/generatePDF';

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  type: 'expense',
  category: '',
  amount: '',
  note: ''
};

const TransaksiMobile = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDateDisplay = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const income = res.data.filter(c => c.type === 'income').map(c => c.name);
      const expense = res.data.filter(c => c.type === 'expense').map(c => c.name);
      setCategories({ income, expense });
    } catch {
      setCategories({
        income: ['Gaji', 'Bonus', 'Investasi', 'Freelance'],
        expense: ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan']
      });
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      setError('Gagal memuat data. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, []);

  // Filter
  const filteredTransactions = transactions.filter(tx => {
    const matchSearch = (tx.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterType === 'all' || tx.type === filterType;
    return matchSearch && matchFilter;
  });

  // Open modal
  const openAddModal = () => {
    const defaultCat = categories.expense[0] || '';
    setEditingId(null);
    setForm({ ...emptyForm, category: defaultCat });
    setShowModal(true);
  };

  const openEditModal = (tx) => {
    setEditingId(tx.id);
    setForm({
      date: tx.date ? tx.date.split('T')[0] : '',
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      note: tx.note || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const totalBalance = transactions.reduce((acc, tx) => tx.type === 'income' ? acc + Number(tx.amount) : acc - Number(tx.amount), 0);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi Saldo Mobile
    if (form.type === 'expense') {
      const amountToSpend = Number(form.amount);
      const oldAmount = editingId ? transactions.find(t => t.id === editingId)?.amount || 0 : 0;
      const oldType = editingId ? transactions.find(t => t.id === editingId)?.type : 'expense';

      const balanceWithoutThis = totalBalance + (oldType === 'expense' ? Number(oldAmount) : 0);

      if (amountToSpend > balanceWithoutThis) {
        alert(`Saldo tidak cukup! Sisa saldo: ${formatCurrency(balanceWithoutThis)}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) {
        const res = await api.put(`/transactions/${editingId}`, payload);
        setTransactions(prev => prev.map(t => t.id === editingId ? res.data : t));
      } else {
        const res = await api.post('/transactions', payload);
        setTransactions(prev => [res.data, ...prev]);
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi ini?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Gagal menghapus transaksi.');
    } finally {
      setDeletingId(null);
    }
  };

  const categoryOptions = form.type === 'income' ? categories.income : categories.expense;

  return (
    <>
      <div className="pb-32 space-y-6 px-6 pt-4 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Transaksi</h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Riwayat Aktivitas</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadTransaksiPDF(filteredTransactions)}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-gray-400 p-3 rounded-2xl shadow-sm active:scale-90 transition-all">
              <Download size={20} />
            </button>
            <button onClick={openAddModal} className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-90 transition-all">
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2 border border-rose-100 dark:border-rose-500/20">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Info Cards Mobile */}
        <div className="space-y-4">
          {totalBalance < 50000 && !loading && (
            <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 p-4 rounded-[1.5rem] flex items-center gap-4 animate-pulse">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <AlertCircle size={20} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">Saldo Menipis!</h3>
                <p className="text-[9px] text-amber-700 dark:text-amber-500 font-bold">Harap segera tambah saldo utama.</p>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2.2rem] text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/40 relative overflow-hidden transition-all">
            <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-12">
              <ArrowUpRight size={100} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <p className="text-indigo-100/60 text-[9px] font-black uppercase tracking-[0.3em] mb-2">Sisa Saldo Anda</p>
              <p className="text-3xl font-black tracking-tight">
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Pemasukan</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {formatCurrency(transactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + Number(tx.amount), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Pengeluaran</p>
              <p className="text-sm font-black text-rose-500 dark:text-rose-400 tracking-tight">
                {formatCurrency(transactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + Number(tx.amount), 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Cari transaksi..."
              className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'Semua', color: 'bg-indigo-600 dark:bg-indigo-600 shadow-indigo-100 dark:shadow-indigo-900/20' },
              { id: 'income', label: 'Masuk', color: 'bg-emerald-600 dark:bg-emerald-600 shadow-emerald-100 dark:shadow-emerald-900/20' },
              { id: 'expense', label: 'Keluar', color: 'bg-rose-500 dark:bg-rose-500 shadow-rose-100 dark:shadow-rose-900/20' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm flex-1 ${filterType === f.id ? f.color + ' text-white scale-105' : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-gray-600 border border-gray-100 dark:border-slate-800'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-gray-400">
            <div className="w-10 h-10 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Sinkronisasi...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm space-y-5 transition-all active:scale-[0.97]">
                {/* Header: Icon, Category & Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-[1.5rem] shadow-sm transform transition-transform group-hover:scale-110 ${tx.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                      {tx.type === 'income' ? <ArrowUpRight size={22} strokeWidth={3} /> : <ArrowDownRight size={22} strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{tx.category}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">{formatDateDisplay(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tracking-tight ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>

                {/* Body: Note */}
                {tx.note && (
                  <div className="px-1">
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border-l-4 border-indigo-500 dark:border-indigo-600 shadow-sm">
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-bold leading-relaxed italic">
                        "{tx.note.toUpperCase()}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer: Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => openEditModal(tx)}
                    className="flex items-center justify-center gap-2 py-3.5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest active:bg-indigo-600 active:text-white transition-all border border-transparent active:border-indigo-500"
                  >
                    <Edit2 size={12} strokeWidth={3} /> EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={deletingId === tx.id}
                    className="flex items-center justify-center gap-2 py-3.5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest active:bg-rose-600 active:text-white transition-all border border-transparent active:border-rose-500"
                  >
                    {deletingId === tx.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} strokeWidth={3} />} HAPUS
                  </button>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="py-24 text-center px-10">
                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 rotate-6 transition-transform hover:rotate-0">
                  <Search size={32} className="text-gray-200 dark:text-slate-800" />
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">KOSONG</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-2 font-bold leading-relaxed">Belum ada catatan transaksi untuk kategori ini.</p>
                <button onClick={openAddModal} className="mt-6 px-8 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl">TAMBAH SEKARANG</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button Mobile */}
      <div className="fixed bottom-28 right-6 z-[100]">
        <button
          onClick={openAddModal}
          className="bg-indigo-600 text-white w-16 h-16 rounded-[2rem] shadow-2xl shadow-indigo-400 dark:shadow-indigo-900/60 flex items-center justify-center active:scale-90 active:rotate-12 transition-all transform"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      {/* ===== BOTTOM SHEET MODAL (Dark Mode Support) ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />

          {/* Bottom Sheet */}
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] z-20 max-h-[95vh] overflow-y-auto animate-in slide-in-from-bottom duration-500">
            {/* Handle */}
            <div className="pt-5 pb-3 flex justify-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
            </div>

            {/* Modal Header */}
            <div className="px-8 pb-6 flex items-center justify-between border-b border-gray-50 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {editingId ? 'Edit Transaksi' : 'Transaksi Baru'}
                </h2>
                <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Lengkapi rincian berikut</p>
              </div>
              <button onClick={closeModal} className="p-3 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Tipe */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'expense', category: categories.expense[0] || '' })}
                  className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${form.type === 'expense'
                      ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/20'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-600'
                    }`}
                >
                  🚀 Keluar
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'income', category: categories.income[0] || '' })}
                  className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${form.type === 'income'
                      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-600'
                    }`}
                >
                  💰 Masuk
                </button>
              </div>

              {/* Nominal */}
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-8 py-6 bg-gray-50 dark:bg-slate-800 border-none rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 text-3xl font-black text-center text-indigo-600 dark:text-indigo-400 shadow-sm placeholder:text-gray-200 dark:placeholder:text-gray-700"
                />
              </div>

              {/* Kategori & Tanggal */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Kategori</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-wider focus:ring-4 focus:ring-indigo-500/10 text-gray-700 dark:text-gray-200"
                  >
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-wider focus:ring-4 focus:ring-indigo-500/10 text-gray-700 dark:text-gray-200"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Catatan Pesan</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Keterangan transaksi..."
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs text-white shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50 mt-4 mb-2 ${form.type === 'income'
                    ? 'bg-emerald-600 shadow-emerald-900/20'
                    : 'bg-indigo-600 shadow-indigo-900/20'
                  }`}
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>{editingId ? 'SIMPAN PERUBAHAN' : 'MASUKKAN DATA'}</span>
                    <ArrowUpRight size={20} strokeWidth={3} />
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

export default TransaksiMobile;
