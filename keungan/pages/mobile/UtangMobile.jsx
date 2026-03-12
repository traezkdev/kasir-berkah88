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

  return (
    <>
      <div className="pb-32 space-y-8 px-6 pt-4 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-center">
           <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Utang & Piutang</h1>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Finansial Tracker</p>
           </div>
          <button onClick={openAddModal} className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 font-black transition-all active:scale-90">
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2 border border-rose-100 dark:border-rose-500/20">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rose-50 dark:bg-rose-500/10 p-5 rounded-[2rem] border border-rose-100 dark:border-rose-500/20">
            <p className="text-[9px] font-black text-rose-400 dark:text-rose-500 uppercase tracking-[0.2em] mb-2 leading-none">Total Utang 📉</p>
            <p className="text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(utangList.reduce((a, b) => a + Number(b.amount), 0))}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-[2rem] border border-emerald-100 dark:border-emerald-500/20">
            <p className="text-[9px] font-black text-emerald-400 dark:text-emerald-500 uppercase tracking-[0.2em] mb-2 leading-none">Total Piutang 📈</p>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(piutangList.reduce((a, b) => a + Number(b.amount), 0))}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[1.8rem] border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <button onClick={() => setActiveTab('utang')}
            className={`flex-1 py-3.5 rounded-[1.3rem] text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === 'utang' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'text-gray-400 dark:text-gray-600'}`}>
            Utang Saya ({utangList.length})
          </button>
          <button onClick={() => setActiveTab('piutang')}
            className={`flex-1 py-3.5 rounded-[1.3rem] text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === 'piutang' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-gray-400 dark:text-gray-600'}`}>
            Piutang ({piutangList.length})
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-gray-400">
            <div className="w-10 h-10 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Mensinkronisasi...</span>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredDebts.map((debt) => (
              <div key={debt.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col gap-6 active:scale-[0.98] transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3.5 rounded-[1.2rem] shadow-sm transform group-active:scale-95 transition-transform ${activeTab === 'utang' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                      <HandCoins size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate leading-tight">{debt.name}</p>
                      {debt.note && <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-1 truncate">{debt.note}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2.5 flex-shrink-0 ml-4">
                    <p className={`font-black text-base tracking-tight ${activeTab === 'utang' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatCurrency(debt.amount)}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(debt)} className="p-2 text-gray-300 dark:text-gray-700 active:text-indigo-500 dark:active:text-indigo-400">
                        <Edit2 size={16} strokeWidth={3} />
                      </button>
                      <button onClick={() => handleDelete(debt.id)} disabled={deletingId === debt.id} className="p-2 text-gray-300 dark:text-gray-700 active:text-rose-500 dark:active:text-rose-400">
                        {deletingId === debt.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} strokeWidth={3} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-50 dark:bg-slate-800/50 w-full relative z-10"></div>

                <div className="flex items-center gap-3 flex-wrap relative z-10">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-slate-800">
                    <Calendar size={12} strokeWidth={3} />
                    <span>{formatDate(debt.date)}</span>
                  </div>
                  {debt.due_date && (
                    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${activeTab === 'utang' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100 dark:border-rose-500/10' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-100 dark:border-indigo-500/10'}`}>
                      <Clock size={12} strokeWidth={3} />
                      <span>DEADIINE: {formatDate(debt.due_date)}</span>
                    </div>
                  )}
                </div>

                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-100 dark:bg-slate-800/20 rounded-full blur-3xl -mr-12 -mt-12 transition-colors" />
              </div>
            ))}

            {filteredDebts.length === 0 && (
              <div className="py-24 text-center px-10">
                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 rotate-6 transform transition-transform hover:rotate-0">
                  <HandCoins size={32} className="text-gray-200 dark:text-slate-800" strokeWidth={1.5} />
                </div>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] leading-relaxed">
                  {activeTab === 'utang' ? 'TIDAK ADA UTANG TERCATAT 🎉\nKEUANGAN ANDA SEHAT!' : 'TIDAK ADA PIUTANG TERCATAT'}
                </p>
                <button onClick={openAddModal} className="mt-8 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest underline underline-offset-4">TAMBAH SEKARANG</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== BOTTOM SHEET MODAL (Dark Mode Support) ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-end">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] z-30 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-500">
            <div className="pt-6 pb-2 flex justify-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="w-12 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
            </div>
            <div className="px-10 pb-6 flex items-center justify-between border-b border-gray-50 dark:border-slate-800 sticky top-12 bg-white dark:bg-slate-900 z-10 overflow-hidden">
               <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -ml-16 -mt-16" />
               <div className="relative">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{editingId ? 'Ubah Catatan' : 'Catatan Baru'}</h2>
                  <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Kelola arus kas keluar-masuk</p>
               </div>
              <button onClick={closeModal} className="p-3 text-gray-400 dark:text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all relative z-10">
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              {/* Tipe Selector Mobile */}
              <div className="flex p-2 bg-gray-50 dark:bg-slate-800 rounded-[2rem] gap-2 shadow-inner">
                <button type="button" onClick={() => setForm({...form, status: 'utang'})}
                  className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${form.status === 'utang' ? 'bg-white dark:bg-rose-600 text-rose-600 dark:text-white shadow-xl shadow-black/5' : 'text-gray-400 dark:text-gray-600'}`}>
                  Utang Saya
                </button>
                <button type="button" onClick={() => setForm({...form, status: 'piutang'})}
                  className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${form.status === 'piutang' ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-xl shadow-black/5' : 'text-gray-400 dark:text-gray-600'}`}>
                  Piutang
                </button>
              </div>

              {/* Nama Pihak */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nama Pihak / Keperluan</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Misal: Bank, Teman, dll."
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" />
              </div>

              {/* Nominal Mobile */}
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nominal Uang (Rp)</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-gray-700 text-lg">Rp</span>
                   <input required type="number" min="1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    placeholder="0"
                    className={`w-full pl-16 pr-6 py-7 bg-gray-50 dark:bg-slate-800 border-none rounded-[2rem] text-3xl font-black text-center focus:ring-4 transition-all ${form.status === 'utang' ? 'text-rose-600 dark:text-rose-400 focus:ring-rose-500/10' : 'text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500/10'}`} />
                </div>
              </div>

              {/* Tanggal + Jatuh Tempo Mobile */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Tanggal</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full px-4 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-[10px] font-black text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Jatuh Tempo</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full px-4 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-[10px] font-black text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
              </div>

              {/* Catatan Mobile */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Catatan Tambahan</label>
                <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                  placeholder="Keterangan opsional..."
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-4 focus:ring-indigo-500/10" />
              </div>

              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={closeModal} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all transform active:scale-95">BATAL</button>
                 <button type="submit" disabled={submitting}
                   className={`flex-2 px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] text-white flex items-center justify-center gap-3 shadow-2xl transition-all disabled:opacity-50 transform active:scale-95 ${form.status === 'utang' ? 'bg-rose-600 shadow-rose-900/20' : 'bg-emerald-600 shadow-emerald-900/20'}`}>
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
    </>
  );
};

export default UtangMobile;
