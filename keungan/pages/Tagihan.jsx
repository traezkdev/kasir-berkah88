import React, { useState, useEffect } from 'react';
import { 
  Plus, CreditCard, AlertCircle, CheckCircle2, 
  Search, Edit2, Trash2, X, Loader2, Coins
} from 'lucide-react';
import api from '../services/api';

const emptyForm = {
  name: '',
  amount: '',
  due_date: '',
  status: 'unpaid'
};

const Tagihan = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payAmount, setPayAmount] = useState('');
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
      setError('Gagal memuat data. Pastikan server backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  const filteredBills = bills.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unpaidTotal = bills.reduce((acc, b) => acc + (Number(b.amount) - Number(b.paid_amount || 0)), 0);
  const paidTotal = bills.reduce((acc, b) => acc + Number(b.paid_amount || 0), 0);

  // Modal CRUD
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

  // Modal Cicil
  const openPayModal = (bill) => {
    setSelectedBill(bill);
    setPayAmount('');
    setShowPayModal(true);
  };
  const closePayModal = () => {
    setShowPayModal(false);
    setSelectedBill(null);
    setPayAmount('');
  };

  // Submit CRUD
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

  // Submit Cicilan
  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;
    setSubmitting(true);
    try {
      const remaining = selectedBill.amount - (selectedBill.paid_amount || 0);
      if (Number(payAmount) > remaining) {
        if (!window.confirm('Jumlah bayar melebihi sisa tagihan. Lanjutkan melunasi?')) {
          setSubmitting(false);
          return;
        }
      }

      const res = await api.patch(`/bills/${selectedBill.id}/pay`, { amount_to_pay: Number(payAmount) });
      setBills(prev => prev.map(b => b.id === selectedBill.id ? res.data : b));
      closePayModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mencatat pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status Lunas
  const toggleStatus = async (bill) => {
    const isPaying = bill.status !== 'paid';
    const message = isPaying 
      ? `Lanjutkan melunasi tagihan "${bill.name}"?` 
      : `Batalkan status lunas tagihan "${bill.name}"? Transaksi pelunasan akan dihapus.`;
    
    if (!window.confirm(message)) return;

    setTogglingId(bill.id);
    try {
      const newStatus = isPaying ? 'paid' : 'unpaid';
      const res = await api.patch(`/bills/${bill.id}/status`, { status: newStatus });
      setBills(prev => prev.map(b => b.id === bill.id ? res.data : b));
    } catch {
      alert('Gagal mengubah status tagihan.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus tagihan ini?')) return;
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Manajemen Tagihan</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-sm">Pantau dan kelola semua tagihan rutinmu.</p>
        </div>
        <button onClick={openAddModal} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
          <Plus size={18} strokeWidth={3} /> <span>Tambah Tagihan</span>
        </button>
      </div>

      {error && (
        <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-lg flex items-center gap-3">
          <AlertCircle size={20} strokeWidth={2.5} /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-xl dark:shadow-black/20 transform hover:-translate-y-1">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm"><CreditCard size={22} strokeWidth={2.5} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 leading-none">Terbayar ✨</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatCurrency(paidTotal)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-xl dark:shadow-black/20 transform hover:-translate-y-1">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg shadow-sm"><AlertCircle size={22} strokeWidth={2.5} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 leading-none">Sisa Tagihan 📉</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{formatCurrency(unpaidTotal)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-xl dark:shadow-black/20 transform hover:-translate-y-1 border-b-4 border-b-indigo-500">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm"><Coins size={22} strokeWidth={2.5} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 leading-none">Total Tagihan 💰</p>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(unpaidTotal + paidTotal)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={18} strokeWidth={3} />
          <input type="text" placeholder="Cari nama tagihan..."
            className="w-full pl-14 pr-6 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-700 dark:text-gray-200"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Bill Grid */}
      {loading ? (
        <div className="py-32 flex flex-col items-center gap-4 text-gray-400">
           <div className="w-12 h-12 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Mensinkronisasi Tagihan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredBills.map((bill) => {
            const paid = Number(bill.paid_amount || 0);
            const total = Number(bill.amount);
            const percent = Math.min((paid / total) * 100, 100);
            
            return (
              <div key={bill.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl dark:shadow-black/20 transition-all overflow-hidden group relative">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className={`p-3 rounded-lg shadow-sm transform group-active:scale-95 transition-transform ${bill.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-emerald-50' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-rose-50'}`}>
                      <CreditCard size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${bill.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 animate-pulse'}`}>
                        {bill.status === 'paid' ? 'Selesai Lunas' : percent > 0 ? 'Sedang Dicicil' : 'Belum Dibayar'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(bill)} className="p-2 text-gray-300 dark:text-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleDelete(bill.id)} disabled={deletingId === bill.id} className="p-2 text-gray-300 dark:text-gray-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
                          {deletingId === bill.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} strokeWidth={2.5} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{bill.name}</h3>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1">🕒 JATUH TEMPO: {formatDate(bill.due_date)}</p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                        <span>PROGRESS: <span className="text-indigo-600 dark:text-indigo-400">{Math.round(percent)}%</span></span>
                        <span>{formatCurrency(paid)} / {formatCurrency(total)}</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-50 dark:bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-slate-800 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1) shadow-sm ${bill.status === 'paid' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {bill.status !== 'paid' && (
                        <button
                          onClick={() => openPayModal(bill)}
                          className="flex-1 px-6 py-4 bg-gray-50 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white dark:active:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                          <Coins size={14} strokeWidth={3} /> Cicil
                        </button>
                      )}
                      <button
                        onClick={() => toggleStatus(bill)}
                        disabled={togglingId === bill.id}
                        className={`px-5 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${bill.status === 'unpaid' ? 'flex-1 bg-indigo-600 text-white shadow-indigo-900/20 hover:bg-indigo-700' : 'w-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 shadow-none'}`}>
                        {togglingId === bill.id ? <Loader2 size={14} className="animate-spin" /> : (bill.status === 'unpaid' ? (
                           <>BAYAR LUNAS <CheckCircle2 size={14} strokeWidth={3} /></>
                        ) : 'BATALKAN LUNAS')}
                      </button>
                    </div>
                  </div>

                  {/* Decorative BG */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 dark:bg-slate-800/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
                </div>
              </div>
            );
          })}

          {filteredBills.length === 0 && !loading && (
            <div className="col-span-full py-32 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl border-4 border-dashed border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                 <CreditCard size={40} className="text-gray-200 dark:text-slate-800" strokeWidth={1} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600 text-center leading-relaxed">BELUM ADA TAGIHAN TERCATAT.<br/>KLIK "TAMBAH TAGIHAN" UNTUK MULAI.</p>
              <button onClick={openAddModal} className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest underline underline-offset-4">BUAT SEKARANG</button>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL CRUD (Dark Mode Support) ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 pb-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
               <div className="relative">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{editingId ? 'Edit Tagihan' : 'Tagihan Baru'}</h2>
                  <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Jangan biarkan jatuh tempo terlewat</p>
               </div>
              <button onClick={closeModal} className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all relative z-10">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nama Keperluan / Tagihan</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Listrik, Internet, BPJS, dll."
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black uppercase tracking-wider shadow-inner" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Total Tagihan (Rp)</label>
                  <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 dark:text-gray-700 text-lg">Rp</span>
                     <input required type="number" min="1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                      placeholder="0"
                      className="w-full pl-16 pr-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 text-xl font-black text-indigo-600 dark:text-indigo-400 transition-all font-black" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Jatuh Tempo</label>
                  <input required type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-xs font-black text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">BATAL</button>
                <button type="submit" disabled={submitting}
                  className="flex-2 px-10 py-5 bg-indigo-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-900/20 active:scale-95 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70">
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

      {/* ===== MODAL CICIL (Dark Mode Support) ===== */}
      {showPayModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closePayModal} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] p-10 space-y-10 animate-in zoom-in-95 duration-300 overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 dark:bg-amber-500/5 rounded-full -mr-16 -mt-16" />
            <div className="flex items-center justify-between relative z-10">
               <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cicil Tagihan</h2>
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1 font-black">Lunas Bertahap</p>
               </div>
              <button onClick={closePayModal} className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-lg border border-amber-100 dark:border-amber-500/20 relative z-10">
              <p className="text-[9px] font-black text-amber-500 dark:text-amber-600 uppercase tracking-[0.2em] mb-2 font-black leading-none">Tagihan: {selectedBill?.name}</p>
              <p className="text-xl font-black text-amber-700 dark:text-amber-500 tracking-tight">Sisa: {formatCurrency(selectedBill?.amount - (selectedBill?.paid_amount || 0))}</p>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-10 relative z-10">
              <div className="space-y-4 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2 text-center block">Masukkan Nominal Pembayaran (Rp)</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-gray-700 text-lg">Rp</span>
                   <input required type="number" min="1" max={selectedBill?.amount - (selectedBill?.paid_amount || 0)}
                    value={payAmount} onChange={e => setPayAmount(e.target.value)}
                    placeholder="0" autoFocus
                    className="w-full pl-16 pr-6 py-8 bg-gray-50 dark:bg-slate-800 border-none rounded-[2.5rem] text-3xl font-black text-center text-amber-600 dark:text-amber-500 ring-4 ring-amber-500/5 focus:ring-amber-500/20 transition-all font-black placeholder:text-gray-200 dark:placeholder:text-gray-800 shadow-inner" />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={closePayModal} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">BATAL</button>
                <button type="submit" disabled={submitting || !payAmount}
                  className="flex-2 px-8 py-5 bg-amber-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-amber-900/20 flex items-center justify-center gap-3 hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-70">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                     <>
                        <span>KONFIRMASI BAYAR</span>
                        <CheckCircle2 size={18} strokeWidth={3} />
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

export default Tagihan;
