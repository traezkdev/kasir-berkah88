import React, { useState, useEffect } from 'react';
import { 
  Plus, HandCoins, Calendar, Clock, 
  Edit2, Trash2, X, Loader2, AlertCircle 
} from 'lucide-react';
import api from '../services/api';

const emptyForm = {
  name: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  due_date: '',
  status: 'utang',
  note: ''
};

const Utang = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  // Fetch
  const fetchDebts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/debts');
      setDebts(res.data);
    } catch {
      setError('Gagal memuat data. Pastikan server backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDebts(); }, []);

  const utangList = debts.filter(d => d.status === 'utang');
  const piutangList = debts.filter(d => d.status === 'piutang');

  // Modal
  const openAddModal = (defaultStatus = 'utang') => {
    setEditingId(null);
    setForm({ ...emptyForm, status: defaultStatus });
    setShowModal(true);
  };

  const openEditModal = (debt) => {
    setEditingId(debt.id);
    setForm({
      name: debt.name,
      amount: debt.amount,
      date: debt.date ? debt.date.split('T')[0] : '',
      due_date: debt.due_date ? debt.due_date.split('T')[0] : '',
      status: debt.status,
      note: debt.note || ''
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
        const res = await api.put(`/debts/${editingId}`, payload);
        setDebts(prev => prev.map(d => d.id === editingId ? res.data : d));
      } else {
        const res = await api.post('/debts', payload);
        setDebts(prev => [res.data, ...prev]);
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
    setDeletingId(id);
    try {
      await api.delete(`/debts/${id}`);
      setDebts(prev => prev.filter(d => d.id !== id));
    } catch {
      alert('Gagal menghapus catatan.');
    } finally {
      setDeletingId(null);
    }
  };

  const DebtCard = ({ debt, colorScheme }) => (
    <div className="p-5 border border-gray-50 bg-gray-50/50 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-2">
          <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-wider">{debt.name}</p>
          {debt.note && <p className="text-sm text-gray-500 mt-0.5">{debt.note}</p>}
        </div>
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm ${colorScheme === 'red' ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(debt.amount)}
          </p>
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEditModal(debt)} className="p-1 text-gray-300 hover:text-indigo-600 transition-colors">
              <Edit2 size={13} />
            </button>
            <button onClick={() => handleDelete(debt.id)} disabled={deletingId === debt.id} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
              {deletingId === debt.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400">
        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(debt.date)}</span>
        {debt.due_date && (
          <span className={`flex items-center gap-1 font-bold ${colorScheme === 'red' ? 'text-orange-500' : 'text-indigo-500'}`}>
            <Clock size={12} /> Jatuh Tempo: {formatDate(debt.due_date)}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Utang</h1>
          <p className="text-gray-500">Pantau utangmu dan piutang orang lain ke kamu.</p>
        </div>
        <button onClick={() => openAddModal('utang')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus size={20} />
          <span>Tambah Catatan</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Total Utang Saya</p>
          <p className="text-xl font-black text-red-600">{formatCurrency(utangList.reduce((a, b) => a + Number(b.amount), 0))}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
          <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">Total Piutang</p>
          <p className="text-xl font-black text-green-600">{formatCurrency(piutangList.reduce((a, b) => a + Number(b.amount), 0))}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3 text-gray-300">
          <Loader2 className="animate-spin" size={32} />
          <span className="text-sm font-medium">Memuat data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Utang Saya */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><HandCoins size={20} /></div>
                <h3 className="text-lg font-bold text-gray-800">Utang Saya</h3>
                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">{utangList.length}</span>
              </div>
              <button onClick={() => openAddModal('utang')} className="text-xs font-bold text-indigo-500 hover:underline">+ Tambah</button>
            </div>
            <div className="space-y-3">
              {utangList.map(debt => <DebtCard key={debt.id} debt={debt} colorScheme="red" />)}
              {utangList.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Tidak ada utang tercatat 🎉</p>}
            </div>
          </div>

          {/* Piutang */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><HandCoins size={20} /></div>
                <h3 className="text-lg font-bold text-gray-800">Piutang Saya</h3>
                <span className="bg-green-100 text-green-600 text-[10px] font-black px-2 py-0.5 rounded-full">{piutangList.length}</span>
              </div>
              <button onClick={() => openAddModal('piutang')} className="text-xs font-bold text-indigo-500 hover:underline">+ Tambah</button>
            </div>
            <div className="space-y-3">
              {piutangList.map(debt => <DebtCard key={debt.id} debt={debt} colorScheme="green" />)}
              {piutangList.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Tidak ada piutang tercatat</p>}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Catatan' : 'Tambah Catatan Baru'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipe */}
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm({...form, status: 'utang'})}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${form.status === 'utang' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-500'}`}>
                  Utang Saya
                </button>
                <button type="button" onClick={() => setForm({...form, status: 'piutang'})}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${form.status === 'piutang' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-500'}`}>
                  Piutang
                </button>
              </div>

              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Pihak</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Misal: Bank Mandiri, Budi, dll."
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>

              {/* Nominal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal (Rp)</label>
                <input required type="number" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>

              {/* Tanggal + Jatuh Tempo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tanggal</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jatuh Tempo</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catatan</label>
                <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                  placeholder="Opsional: Cicilan gadget, dll."
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-bold">Batal</button>
                <button type="submit" disabled={submitting}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-70 ${form.status === 'utang' ? 'bg-red-600 shadow-red-100' : 'bg-green-600 shadow-green-100'}`}>
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Simpan' : 'Tambah')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utang;
