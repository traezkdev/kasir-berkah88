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
    if (!window.confirm('Hapus catatan ini?')) return;
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
    <div className="p-4 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-100 dark:hover:border-slate-700 transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1 pr-4">
          <p className="font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase text-[10px] tracking-[0.2em] mb-1">{debt.name}</p>
          {debt.note && <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-relaxed">{debt.note}</p>}
        </div>
        <div className="flex items-center gap-3">
          <p className={`font-black text-sm tracking-tight ${colorScheme === 'red' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {formatCurrency(debt.amount)}
          </p>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEditModal(debt)} className="p-2 text-gray-300 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-600">
              <Edit2 size={14} strokeWidth={2.5} />
            </button>
            <button onClick={() => handleDelete(debt.id)} disabled={deletingId === debt.id} className="p-2 text-gray-300 dark:text-gray-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-600">
              {deletingId === debt.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 relative z-10">
        <span className="flex items-center gap-1.5"><Calendar size={12} strokeWidth={2.5} /> {formatDate(debt.date)}</span>
        {debt.due_date && (
          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${colorScheme === 'red' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500'}`}>
            <Clock size={12} strokeWidth={2.5} /> JATUH TEMPO: {formatDate(debt.due_date)}
          </span>
        )}
      </div>

      {/* Decorative BG */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gray-100 dark:bg-slate-800/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/5 transition-colors" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Manajemen Utang</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-sm">Pantau utangmu dan piutang orang lain ke kamu.</p>
        </div>
        <button onClick={() => openAddModal('utang')} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
          <Plus size={18} strokeWidth={3} />
          <span>Tambah Catatan</span>
        </button>
      </div>

      {error && (
        <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-lg flex items-center gap-3">
          <AlertCircle size={20} strokeWidth={2.5} /> {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-rose-50 dark:bg-rose-500/10 p-5 rounded-xl border border-rose-100 dark:border-rose-500/20 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-rose-400 dark:text-rose-500 uppercase tracking-[0.3em] mb-2 leading-none px-1">Total Utang Saya 📉</p>
          <p className="text-2xl font-black text-rose-600 tracking-tight">{formatCurrency(utangList.reduce((a, b) => a + Number(b.amount), 0))}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-emerald-400 dark:text-emerald-500 uppercase tracking-[0.3em] mb-2 leading-none px-1">Total Piutang Saya 📈</p>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(piutangList.reduce((a, b) => a + Number(b.amount), 0))}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center gap-4 text-gray-400">
           <div className="w-12 h-12 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Mensinkronisasi Catatan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Utang Saya */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl dark:shadow-black/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg shadow-sm"><HandCoins size={20} strokeWidth={2.5} /></div>
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Utang Saya</h3>
                    <p className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mt-1">Harus Segera Dilunasi</p>
                </div>
              </div>
              <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{utangList.length} Item</span>
            </div>
            <div className="space-y-4">
              {utangList.map(debt => <DebtCard key={debt.id} debt={debt} colorScheme="red" />)}
              {utangList.length === 0 && (
                 <div className="py-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-12">
                        <HandCoins size={32} className="text-gray-200 dark:text-slate-800" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-relaxed">TIDAK ADA UTANG TERCATAT 🎉<br/>KEUANGAN ANDA AMAN!</p>
                 </div>
              )}
            </div>
          </div>

          {/* Piutang */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl dark:shadow-black/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm"><HandCoins size={20} strokeWidth={2.5} /></div>
                <div>
                   <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Piutang</h3>
                   <p className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mt-1">Uang Yang Akan Kembali</p>
                </div>
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{piutangList.length} Item</span>
            </div>
            <div className="space-y-4">
              {piutangList.map(debt => <DebtCard key={debt.id} debt={debt} colorScheme="green" />)}
              {piutangList.length === 0 && (
                 <div className="py-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 -rotate-12 transition-transform hover:rotate-0">
                        <HandCoins size={32} className="text-gray-200 dark:text-slate-800" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">TIDAK ADA PIUTANG TERCATAT</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 pb-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
               <div className="relative">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{editingId ? 'Edit Catatan' : 'Catatan Baru'}</h2>
                  <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Rapikan catatan finansialmu</p>
               </div>
              <button onClick={closeModal} className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all relative z-10">
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              {/* Tipe Selector */}
              <div className="flex p-2 bg-gray-50 dark:bg-slate-800 rounded-lg gap-2">
                <button type="button" onClick={() => setForm({...form, status: 'utang'})}
                  className={`flex-1 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${form.status === 'utang' ? 'bg-white dark:bg-rose-600 text-rose-600 dark:text-white shadow-xl shadow-black/5' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600'}`}>
                  Utang Saya
                </button>
                <button type="button" onClick={() => setForm({...form, status: 'piutang'})}
                  className={`flex-1 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${form.status === 'piutang' ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-xl shadow-black/5' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600'}`}>
                  Piutang
                </button>
              </div>

              {/* Input Fields */}
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nama Pihak / Deskripsi</label>
                    <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Misal: Bank, Budi, dll."
                    className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black uppercase tracking-wider" />
                 </div>

                 <div className="space-y-3 px-1">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nominal (Rp)</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 dark:text-gray-700 text-lg">Rp</span>
                       <input required type="number" min="1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                        placeholder="0"
                        className={`w-full pl-16 pr-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 text-xl font-black transition-all ${form.status === 'utang' ? 'text-rose-600 dark:text-rose-400 focus:ring-rose-500/10' : 'text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500/10'}`} 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Tanggal</label>
                      <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-xs font-black text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Jatuh Tempo</label>
                      <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-xs font-black text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Catatan Tambahan</label>
                    <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                      placeholder="Opsional: Tujuan Pinjaman, dll."
                      className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700" />
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">BATAL</button>
                <button type="submit" disabled={submitting}
                  className={`flex-2 px-10 py-5 rounded-lg font-black uppercase tracking-widest text-[10px] text-white flex items-center justify-center gap-3 shadow-2xl transition-all disabled:opacity-70 transform hover:-translate-y-1 ${form.status === 'utang' ? 'bg-rose-600 shadow-rose-900/20' : 'bg-emerald-600 shadow-emerald-900/20'}`}>
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                     <>
                        <span>{editingId ? 'SIMPAN' : 'TAMBAHKAN'}</span>
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

export default Utang;
