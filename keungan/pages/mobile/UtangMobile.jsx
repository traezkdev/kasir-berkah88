import React, { useState, useEffect } from 'react';
import { 
  Plus, HandCoins, Calendar, Clock, 
  Edit2, Trash2, X, Loader2, AlertCircle
} from 'lucide-react';
import api from '../../services/api';

const emptyForm = {
  name: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  due_date: '',
  status: 'utang',
  note: ''
};

const UtangMobile = () => {
  const [debts, setDebts] = useState([]);
  const [activeTab, setActiveTab] = useState('utang');
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
      setError('Gagal memuat data. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDebts(); }, []);

  const utangList = debts.filter(d => d.status === 'utang');
  const piutangList = debts.filter(d => d.status === 'piutang');
  const filteredDebts = activeTab === 'utang' ? utangList : piutangList;

  // Modal
  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm, status: activeTab });
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

  return (
    <>
      <div className="pb-24 space-y-6 px-6 pt-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Utang & Piutang</h1>
          <button onClick={openAddModal} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
            <Plus size={20} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-xs font-medium rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Total Utang</p>
            <p className="text-sm font-black text-red-600">{formatCurrency(utangList.reduce((a, b) => a + Number(b.amount), 0))}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
            <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Total Piutang</p>
            <p className="text-sm font-black text-green-600">{formatCurrency(piutangList.reduce((a, b) => a + Number(b.amount), 0))}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <button onClick={() => setActiveTab('utang')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'utang' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400'}`}>
            Utang Saya ({utangList.length})
          </button>
          <button onClick={() => setActiveTab('piutang')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'piutang' ? 'bg-green-50 text-green-600 shadow-sm' : 'text-gray-400'}`}>
            Piutang ({piutangList.length})
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-300">
            <Loader2 className="animate-spin" size={28} />
            <span className="text-xs font-medium">Memuat data...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDebts.map((debt) => (
              <div key={debt.id} className="bg-white p-5 rounded-[1.8rem] border border-gray-50 shadow-sm flex flex-col gap-4 group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2.5 rounded-xl ${activeTab === 'utang' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      <HandCoins size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 uppercase tracking-wide truncate">{debt.name}</p>
                      {debt.note && <p className="text-xs text-gray-400 truncate">{debt.note}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                    <p className={`font-black text-sm ${activeTab === 'utang' ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(debt.amount)}
                    </p>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(debt)} className="p-1 text-gray-300 active:text-indigo-500">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(debt.id)} disabled={deletingId === debt.id} className="p-1 text-gray-300 active:text-red-500">
                        {deletingId === debt.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-50 w-full"></div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                    <Calendar size={11} />
                    <span>{formatDate(debt.date)}</span>
                  </div>
                  {debt.due_date && (
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md ${activeTab === 'utang' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Clock size={11} />
                      <span>Jatuh Tempo: {formatDate(debt.due_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredDebts.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm font-medium">
                  {activeTab === 'utang' ? 'Tidak ada utang tercatat 🎉' : 'Tidak ada piutang tercatat'}
                </p>
                <button onClick={openAddModal} className="mt-3 text-indigo-500 text-xs font-bold underline">Tambah sekarang</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== BOTTOM SHEET MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full bg-white rounded-t-[2.5rem] shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="pt-4 pb-2 flex justify-center">
              <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>
            <div className="px-6 pb-4 flex items-center justify-between border-b border-gray-50">
              <h2 className="text-base font-bold text-gray-800">{editingId ? 'Edit Catatan' : 'Tambah Catatan Baru'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipe */}
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm({...form, status: 'utang'})}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all ${form.status === 'utang' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-500'}`}>
                  Utang Saya
                </button>
                <button type="button" onClick={() => setForm({...form, status: 'piutang'})}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all ${form.status === 'piutang' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-500'}`}>
                  Piutang
                </button>
              </div>

              {/* Nama Pihak */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Pihak</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Misal: Bank, Budi, dll."
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>

              {/* Nominal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal (Rp)</label>
                <input required type="number" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="0"
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-xl font-black text-center focus:ring-2 focus:ring-indigo-100" />
              </div>

              {/* Tanggal + Jatuh Tempo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tanggal</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full px-3 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jatuh Tempo</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full px-3 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catatan (Opsional)</label>
                <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                  placeholder="Cicilan gadget, hutang makan, dll."
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>

              <button type="submit" disabled={submitting}
                className={`w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-70 ${form.status === 'utang' ? 'bg-red-600 shadow-red-100' : 'bg-green-600 shadow-green-100'}`}>
                {submitting ? <Loader2 className="animate-spin" size={22} /> : (editingId ? 'Simpan Perubahan' : 'Simpan Catatan')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UtangMobile;
