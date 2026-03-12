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

  // Submit
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

  // Delete
  const handleDelete = async (id) => {
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
      <div className="pb-24 space-y-6 px-6 pt-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Transaksi</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => downloadTransaksiPDF(filteredTransactions)}
              title="Download PDF"
              className="bg-white border border-gray-100 text-gray-500 p-2.5 rounded-2xl shadow-sm">
              <Download size={20} />
            </button>
            <button onClick={openAddModal} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-xs font-medium rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Cari transaksi..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Semua', active: 'bg-indigo-600 text-white shadow-indigo-100' },
              { id: 'income', label: 'Masuk', active: 'bg-green-600 text-white shadow-green-100' },
              { id: 'expense', label: 'Keluar', active: 'bg-red-500 text-white shadow-red-100' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilterType(f.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-md ${filterType === f.id ? f.active : 'bg-white text-gray-500 border border-gray-100'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-300">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-xs font-medium">Memuat data...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="bg-white p-4 rounded-[1.5rem] border border-gray-50 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{tx.category}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-gray-400 font-medium uppercase">{formatDateDisplay(tx.date)}</p>
                      {tx.note && (
                        <>
                          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                          <p className="text-[10px] text-gray-400 font-medium truncate max-w-[100px]">{tx.note}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`font-black text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(tx)}
                      className="p-1 text-gray-300 hover:text-indigo-500 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(tx.id)} disabled={deletingId === tx.id}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                      {deletingId === tx.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm font-medium">Belum ada transaksi.</p>
                <button onClick={openAddModal} className="mt-3 text-indigo-500 text-xs font-bold underline">Tambah sekarang</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== BOTTOM SHEET MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          {/* Bottom Sheet */}
          <div className="relative w-full bg-white rounded-t-[2.5rem] shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            {/* Handle */}
            <div className="pt-4 pb-2 flex justify-center">
              <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>

            {/* Modal Header */}
            <div className="px-6 pb-4 flex items-center justify-between border-b border-gray-50">
              <h2 className="text-base font-bold text-gray-800">
                {editingId ? 'Edit Transaksi' : 'Transaksi Baru'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Tipe */}
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm({ ...form, type: 'expense', category: categories.expense[0] || '' })}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all ${form.type === 'expense' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-500'}`}>
                  Pengeluaran
                </button>
                <button type="button" onClick={() => setForm({ ...form, type: 'income', category: categories.income[0] || '' })}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all ${form.type === 'income' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-500'}`}>
                  Pemasukan
                </button>
              </div>

              {/* Nominal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal (Rp)</label>
                <input type="number" required min="0" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-xl font-black text-center" />
              </div>

              {/* Kategori & Tanggal */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                  <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100">
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tanggal</label>
                  <input type="date" required value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catatan (Opsional)</label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Contoh: Beli makan siang"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>

              {/* Submit */}
              <button type="submit" disabled={submitting}
                className={`w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-70 ${form.type === 'income' ? 'bg-green-600 shadow-green-100' : 'bg-indigo-600 shadow-indigo-100'}`}>
                {submitting ? <Loader2 className="animate-spin" size={22} /> : (editingId ? 'Simpan Perubahan' : 'Simpan Transaksi')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TransaksiMobile;
