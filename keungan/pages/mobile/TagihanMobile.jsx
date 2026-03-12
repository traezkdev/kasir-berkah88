import React, { useState, useEffect } from 'react';
import { 
  Plus, CreditCard, CheckCircle2, AlertCircle,
  Search, Edit2, Trash2, X, Loader2
} from 'lucide-react';
import api from '../../services/api';

const emptyForm = {
  name: '',
  amount: '',
  due_date: '',
  status: 'unpaid'
};

const TagihanMobile = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const fetchBills = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/bills');
      setBills(res.data);
    } catch {
      setError('Gagal memuat data. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  const filteredBills = bills.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const unpaidTotal = bills.filter(b => b.status === 'unpaid').reduce((a, b) => a + Number(b.amount), 0);
  const paidTotal = bills.filter(b => b.status === 'paid').reduce((a, b) => a + Number(b.amount), 0);

  const openAddModal = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEditModal = (bill) => {
    setEditingId(bill.id);
    setForm({
      name: bill.name,
      amount: bill.amount,
      due_date: bill.due_date ? bill.due_date.split('T')[0] : '',
      status: bill.status
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) {
        const res = await api.put(`/bills/${editingId}`, payload);
        setBills(prev => prev.map(b => b.id === editingId ? res.data : b));
      } else {
        const res = await api.post('/bills', payload);
        setBills(prev => [...prev, res.data]);
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (bill) => {
    setTogglingId(bill.id);
    try {
      const newStatus = bill.status === 'paid' ? 'unpaid' : 'paid';
      const res = await api.patch(`/bills/${bill.id}/status`, { status: newStatus });
      setBills(prev => prev.map(b => b.id === bill.id ? res.data : b));
    } catch {
      alert('Gagal mengubah status tagihan.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/bills/${id}`);
      setBills(prev => prev.filter(b => b.id !== id));
    } catch {
      alert('Gagal menghapus tagihan.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="pb-24 space-y-6 px-6 pt-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Tagihan Rutin</h1>
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-50 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Perlu Dibayar</p>
            </div>
            <p className="text-base font-black text-red-600">{formatCurrency(unpaidTotal)}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-50 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={10} className="text-green-500" />
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total Lunas</p>
            </div>
            <p className="text-base font-black text-green-600">{formatCurrency(paidTotal)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari tagihan..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-50 rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm shadow-sm"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {/* Bill List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-300">
            <Loader2 className="animate-spin" size={28} />
            <span className="text-xs font-medium">Memuat data...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <div key={bill.id} className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden group active:scale-[0.98] transition-all">
                {/* Status bar top */}
                <div className={`h-1.5 w-full ${bill.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`}></div>

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${bill.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{bill.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Jatuh Tempo: {formatDate(bill.due_date)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {bill.status === 'paid' ? 'Lunas' : 'Belum'}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(bill)} className="p-1 text-gray-300 active:text-indigo-500">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(bill.id)} disabled={deletingId === bill.id} className="p-1 text-gray-300 active:text-red-500">
                          {deletingId === bill.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xl font-black text-gray-900">{formatCurrency(bill.amount)}</p>
                    <button
                      onClick={() => toggleStatus(bill)}
                      disabled={togglingId === bill.id}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 ${bill.status === 'unpaid' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-gray-100 text-gray-500'}`}>
                      {togglingId === bill.id ? <Loader2 size={13} className="animate-spin" /> : (bill.status === 'unpaid' ? 'Bayar' : 'Batalkan')}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredBills.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm font-medium">Belum ada tagihan tercatat.</p>
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
              <h2 className="text-base font-bold text-gray-800">{editingId ? 'Edit Tagihan' : 'Tagihan Baru'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Tagihan</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Listrik, Internet, BPJS, dll."
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal (Rp)</label>
                <input required type="number" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="0"
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-xl font-black text-center focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jatuh Tempo</label>
                <input required type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm({...form, status: 'unpaid'})}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${form.status === 'unpaid' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-500'}`}>
                  Belum Bayar
                </button>
                <button type="button" onClick={() => setForm({...form, status: 'paid'})}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${form.status === 'paid' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-500'}`}>
                  Sudah Lunas
                </button>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-4 rounded-2xl font-bold text-white text-base bg-indigo-600 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-70">
                {submitting ? <Loader2 className="animate-spin" size={22} /> : (editingId ? 'Simpan Perubahan' : 'Tambah Tagihan')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TagihanMobile;
