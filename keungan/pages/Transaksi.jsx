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

  // --- SUBMIT (CREATE / UPDATE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h1>
          <p className="text-gray-500">Kelola semua pemasukan dan pengeluaranmu di sini.</p>
        </div>
        <button onClick={openAddModal} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus size={20} />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Cari kategori atau catatan..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex bg-gray-50 p-1 rounded-xl">
            {['all', 'income', 'expense'].map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filterType === t
                    ? t === 'income' ? 'bg-white text-green-600 shadow-sm'
                      : t === 'expense' ? 'bg-white text-red-600 shadow-sm'
                      : 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500'}`}>
                {t === 'all' ? 'Semua' : t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={() => downloadTransaksiPDF(filteredTransactions)}
          title="Download PDF"
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
          <Download size={20} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-sm font-medium">Memuat data...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Catatan</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Jumlah</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{formatDateDisplay(tx.date)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <span className="text-sm font-bold text-gray-800">{tx.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{tx.note || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(tx)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} disabled={deletingId === tx.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all">
                        {deletingId === tx.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredTransactions.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 text-gray-300 rounded-full mb-4">
              <Search size={32} />
            </div>
            <p className="text-gray-500 font-medium">Belum ada transaksi. Klik "Tambah Transaksi" untuk memulai.</p>
          </div>
        )}
      </div>

      {/* === MODAL TAMBAH / EDIT === */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-lg mx-4 rounded-[2rem] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Tipe Transaksi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipe</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({...form, type: 'expense', category: 'Makan'})}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${form.type === 'expense' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-500'}`}>
                    Pengeluaran
                  </button>
                  <button type="button" onClick={() => setForm({...form, type: 'income', category: 'Gaji'})}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${form.type === 'income' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-500'}`}>
                    Pemasukan
                  </button>
                </div>
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tanggal</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({...form, date: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                  <select required value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium">
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Nominal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal (Rp)</label>
                <input type="number" required min="0" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})}
                  placeholder="Contoh: 500000"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium" />
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catatan</label>
                <input type="text" value={form.note} onChange={(e) => setForm({...form, note: e.target.value})}
                  placeholder="Opsional, misal: Gaji bulan Maret"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium" />
              </div>

              {/* Tombol Submit */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${form.type === 'income' ? 'bg-green-600 shadow-green-100 hover:bg-green-700' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'}`}>
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Simpan Perubahan' : 'Tambah Sekarang')}
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
