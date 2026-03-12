import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Download,
  ArrowUpRight, ArrowDownRight,
  Edit2, Trash2, X, Loader2, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { downloadTransaksiPDF } from '../services/generatePDF';

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  type: 'expense',
  category: 'Makan',
  amount: '',
  note: ''
};

const Transaksi = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Delete confirm state
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

  // --- FETCH CATEGORIES ---
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const income = res.data.filter(c => c.type === 'income').map(c => c.name);
      const expense = res.data.filter(c => c.type === 'expense').map(c => c.name);
      setCategories({ income, expense });
    } catch (err) {
      // fallback ke default jika API gagal
      setCategories({
        income: ['Gaji', 'Bonus', 'Investasi', 'Freelance'],
        expense: ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan']
      });
    }
  };

  // --- FETCH TRANSACTIONS ---
  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      setError('Gagal memuat data transaksi. Pastikan server backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, []);

  // --- FILTER ---
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = (tx.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // --- OPEN MODAL ---
  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
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

  // --- SUBMIT (CREATE / UPDATE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi Saldo di Frontend
    if (form.type === 'expense') {
      const amountToSpend = Number(form.amount);
      const oldAmount = editingId ? transactions.find(t => t.id === editingId)?.amount || 0 : 0;
      const oldType = editingId ? transactions.find(t => t.id === editingId)?.type : 'expense';

      const balanceWithoutThis = totalBalance + (oldType === 'expense' ? Number(oldAmount) : 0);

      if (amountToSpend > balanceWithoutThis) {
        alert(`Saldo tidak cukup! Sisa saldo tersedia: ${formatCurrency(balanceWithoutThis)}`);
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

  // --- DELETE ---
  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi ini?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus transaksi.');
    } finally {
      setDeletingId(null);
    }
  };

  const categoryOptions = form.type === 'income' ? categories.income : categories.expense;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Riwayat Transaksi</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-sm">Kelola semua pemasukan dan pengeluaranmu di sini.</p>
        </div>
        <button onClick={openAddModal} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
          <Plus size={18} strokeWidth={3} />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Low Balance Alert */}
      {totalBalance < 50000 && !loading && (
        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 dark:bg-amber-500/10 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg shadow-sm">
              <AlertCircle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">Saldo kamu hampir habis nih!</h3>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">Segera tambahkan pemasukan agar catatan keuanganmu tetap lancar.</p>
            </div>
          </div>
          <div className="text-center md:text-right relative z-10">
            <p className="text-[10px] font-black text-amber-400 dark:text-amber-600 uppercase tracking-[0.3em]">Sisa Saldo</p>
            <p className="text-xl font-black text-amber-700 dark:text-amber-300 tracking-tight mt-1">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      )}

      {/* Info Cards Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Saldo Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-xl text-white shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/40 relative overflow-hidden flex flex-col justify-center transform transition-transform hover:-translate-y-1">
          <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12">
            <Plus size={140} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Total Saldo (Neto)</p>
            <p className="text-2xl font-black tracking-tight">
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 group hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-300">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
            <ArrowUpRight size={24} strokeWidth={3} />
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Masuk</p>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(transactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + Number(tx.amount), 0))}
            </p>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 group hover:border-rose-100 dark:hover:border-rose-500/30 transition-all duration-300">
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
            <ArrowDownRight size={24} strokeWidth={3} />
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Pengeluaran</p>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(transactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + Number(tx.amount), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={20} />
            <input
              type="text"
              placeholder="Cari kategori atau catatan..."
              className="w-full pl-12 pr-6 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-50 dark:bg-slate-800 p-1.5 rounded-lg border border-gray-200/50 dark:border-slate-700">
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === t
                    ? t === 'income' ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-xl shadow-emerald-900/10'
                      : t === 'expense' ? 'bg-white dark:bg-rose-600 text-rose-600 dark:text-white shadow-xl shadow-rose-900/10'
                        : 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xl shadow-indigo-900/10'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
              >
                {t === 'all' ? 'Semua' : t === 'income' ? 'Masuk' : 'Keluar'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => downloadTransaksiPDF(filteredTransactions)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <Download size={16} />
          <span>Laporan PDF</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 text-gray-400">
            <div className="w-12 h-12 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Data Sedang Dimuat...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Tanggal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Kategori</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Catatan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-right">Jumlah</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all group">
                    <td className="px-6 py-3.5">
                      <span className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">{formatDateDisplay(tx.date)}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg transition-transform group-hover:scale-110 ${tx.type === 'income'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                          {tx.type === 'income' ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                        </div>
                        <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{tx.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 max-w-xs">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate uppercase tracking-widest">{tx.note || '-'}</p>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`text-sm font-black tracking-tight ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-600"
                        >
                          {deletingId === tx.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredTransactions.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center text-center px-10">
            <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-8 rotate-6 transition-transform hover:rotate-0">
              <Search size={40} className="text-gray-200 dark:text-slate-700" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Tidak Ada Data</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-[300px] font-medium leading-relaxed">Kami tidak menemukan transaksi untuk kriteria pencarian atau filter ini.</p>
          </div>
        )}
      </div>

      {/* === MODAL TAMBAH / EDIT === */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />

          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-10 pb-6 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -ml-16 -mt-16" />
              <div className="relative">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {editingId ? 'Edit Transaksi' : 'Transaksi Baru'}
                </h2>
                <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1">Lengkapi data di bawah ini</p>
              </div>
              <button onClick={closeModal} className="relative z-10 p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-8">
              {/* Tipe Transaksi */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Pilih Tipe Transaksi</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'expense', category: 'Makan' })}
                    className={`flex-1 py-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${form.type === 'expense'
                        ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/20'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500'
                      }`}
                  >
                    🚀 Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'income', category: 'Gaji' })}
                    className={`flex-1 py-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${form.type === 'income'
                        ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500'
                      }`}
                  >
                    💰 Pemasukan
                  </button>
                </div>
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Kategori</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Nominal */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nominal Transaksi (Rp)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-gray-600 text-lg">Rp</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    className="w-full pl-16 pr-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-xl font-black text-indigo-600 dark:text-indigo-400 placeholder:text-gray-200 dark:placeholder:text-gray-700"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Catatan Keterangan</label>
                <div className="relative">
                  <div className="absolute left-6 top-5 text-gray-300 dark:text-gray-600">
                    <Edit2 size={16} />
                  </div>
                  <input
                    type="text"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Contoh: Belanja bahan baku..."
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Tombol Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-2 px-10 py-5 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] text-white shadow-2xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 ${form.type === 'income'
                      ? 'bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-700'
                      : 'bg-indigo-600 shadow-indigo-900/20 hover:bg-indigo-700'
                    }`}
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      <span>{editingId ? 'Simpan' : 'Simpan Transaksi'}</span>
                      <Plus size={18} strokeWidth={3} />
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

export default Transaksi;
