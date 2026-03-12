import React, { useState, useEffect } from 'react';
import { 
  Plus, CreditCard, CheckCircle2, AlertCircle,
  Search, Edit2, Trash2, X, Loader2, Coins
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
      setError('Gagal memuat data. Pastikan server aktif.');
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
    if (!window.confirm('Hapus tagihan ini?')) return;
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
      <div className="pb-32 space-y-8 px-6 pt-4 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-center">
           <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Tagihan Rutin</h1>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Payment Reminder</p>
           </div>
          <button onClick={openAddModal} className="bg-indigo-600 text-white p-3.5 rounded-lg shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-90 transition-all">
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        {error && (
          <div className="p-5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle size={18} strokeWidth={3} /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-500/50"></div>
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sisa Tagihan</p>
            </div>
            <p className="text-base font-black text-rose-600 dark:text-rose-400 tracking-tight">{formatCurrency(unpaidTotal)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={12} className="text-emerald-500" strokeWidth={3} />
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sudah Bayar</p>
            </div>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatCurrency(paidTotal)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-700" size={20} strokeWidth={3} />
          <input type="text" placeholder="Cari tagihan anda..."
            className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-xs font-black uppercase tracking-widest placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-700 dark:text-gray-200 shadow-sm"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {/* Bill List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-gray-400">
            <div className="w-10 h-10 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Sinkronisasi...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBills.map((bill) => {
              const paid = Number(bill.paid_amount || 0);
              const total = Number(bill.amount);
              const percent = Math.min((paid / total) * 100, 100);

              return (
                <div key={bill.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden active:scale-[0.98] transition-all border border-gray-100 dark:border-slate-800 group relative">
                  <div className={`h-2 w-full transition-colors duration-500 ${bill.status === 'paid' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                  <div className="p-7 space-y-6 relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`p-4 rounded-lg flex-shrink-0 shadow-sm transform group-active:scale-95 transition-transform ${bill.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                          <CreditCard size={22} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight truncate">{bill.name}</p>
                          <p className="text-[9px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest mt-1.5 truncate">🕒 TEMPO: {formatDate(bill.due_date)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2.5">
                        <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-sm ${bill.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 animate-pulse'}`}>
                          {bill.status === 'paid' ? 'LUNAS' : percent > 0 ? 'MEMBAYAR' : 'TERTUNDA'}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => openEditModal(bill)} className="p-2 text-gray-300 dark:text-gray-700 active:text-indigo-500 transition-colors">
                                <Edit2 size={15} strokeWidth={3} />
                            </button>
                            <button onClick={() => handleDelete(bill.id)} disabled={deletingId === bill.id} className="p-2 text-gray-300 dark:text-gray-700 active:text-rose-500 transition-colors">
                                {deletingId === bill.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} strokeWidth={3} />}
                            </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 px-1">
                        <div className="flex justify-between text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                          <span>Progress: <span className="text-indigo-600 dark:text-indigo-400">{Math.round(percent)}%</span></span>
                          <span>{formatCurrency(paid)} / {formatCurrency(total)}</span>
                        </div>
                        <div className="h-3 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-slate-800 shadow-inner">
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
                          className="flex-1 px-5 py-4 bg-indigo-50 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:bg-indigo-600 active:text-white transition-all">
                          <Coins size={16} strokeWidth={3} /> CICIL
                        </button>
                      )}
                      <button
                        onClick={() => toggleStatus(bill)}
                        disabled={togglingId === bill.id}
                        className={`px-5 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all ${bill.status === 'unpaid' ? (percent > 0 ? 'w-24 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-600' : 'flex-1 bg-indigo-600 text-white shadow-indigo-900/20') : 'w-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600'}`}>
                        {togglingId === bill.id ? <Loader2 size={16} className="animate-spin" /> : (bill.status === 'unpaid' ? (percent > 0 ? 'LUNAS' : 'BAYAR LUNAS') : 'BATAL')}
                      </button>
                    </div>
                  </div>

                  {/* Decorative BG */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gray-100 dark:bg-slate-800/20 rounded-full blur-3xl -mr-12 -mt-12 transition-colors" />
                </div>
              );
            })}
            
            {filteredBills.length === 0 && !loading && (
              <div className="py-24 text-center px-10">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center mx-auto mb-6 rotate-6 transform transition-transform hover:rotate-0 shadow-sm border border-gray-50 dark:border-slate-800">
                  <CreditCard size={32} className="text-gray-200 dark:text-slate-800" strokeWidth={1.5} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600 text-center leading-relaxed">BELUM ADA TAGIHAN TERCATAT.<br/>KLIK TOMBOL DI ATAS UNTUK MULAI.</p>
                <button onClick={openAddModal} className="mt-8 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest underline underline-offset-4">BUAT SEKARANG</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== BOTTOM SHEET MODAL (Dark Mode Support) ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-end">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-xl shadow-[0_-20px_60px_rgba(0,0,0,0.3)] z-30 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 pb-12">
            <div className="pt-6 pb-2 flex justify-center sticky top-0 bg-white dark:bg-slate-900 z-10 px-6">
              <div className="w-12 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
            </div>
            <div className="px-10 pb-6 flex items-center justify-between border-b border-gray-50 dark:border-slate-800 sticky top-12 bg-white dark:bg-slate-900 z-10 overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
               <div className="relative">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{editingId ? 'Edit Tagihan' : 'Tagihan Baru'}</h2>
                  <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Atur pengeluaran rutin anda</p>
               </div>
              <button onClick={closeModal} className="p-3 text-gray-400 dark:text-gray-500 hover:text-rose-500 transition-all font-black relative z-10">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nama Keperluan Tagihan</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Misal: Listrik, Internet, dll."
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
              </div>
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3 px-1">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Total Nominal Tagihan (Rp)</label>
                  <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-gray-700 text-lg">Rp</span>
                     <input required type="number" min="1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                      placeholder="0"
                      className="w-full pl-16 pr-6 py-6 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-2xl font-black text-emerald-600 dark:text-emerald-400 focus:ring-4 focus:ring-emerald-500/10 shadow-inner" />
                  </div>
                </div>
                <div className="space-y-3 px-1">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Tanggal Jatuh Tempo</label>
                  <input required type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-[10px] font-black text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={closeModal} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all">BATAL</button>
                 <button type="submit" disabled={submitting}
                   className="flex-2 px-10 py-5 bg-indigo-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
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

      {/* ===== BOTTOM SHEET MODAL CICIL (Dark Mode Support) ===== */}
      {showPayModal && (
        <div className="fixed inset-0 z-[300] flex items-end">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closePayModal} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-xl shadow-[0_-20px_100px_rgba(0,0,0,0.5)] z-40 p-10 pb-16 space-y-10 animate-in slide-in-from-bottom duration-500 overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
            <div className="flex items-center justify-between relative z-10">
               <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Setoran Tagihan</h2>
                  <p className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mt-1">Pembayaran Cicilan</p>
               </div>
              <button onClick={closePayModal} className="p-3 text-gray-400 dark:text-gray-500 hover:text-rose-500 transition-all font-black relative z-10">
                <X size={26} strokeWidth={4} />
              </button>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-500/5 p-8 rounded-xl border border-emerald-100 dark:border-emerald-500/10 shadow-inner relative z-10">
              <p className="text-[9px] font-black text-emerald-400 dark:text-emerald-500 uppercase tracking-[0.2em] mb-2 leading-none">Tagihan: {selectedBill?.name}</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">Sisa: {formatCurrency(selectedBill?.amount - (selectedBill?.paid_amount || 0))}</p>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-10 relative z-10">
              <div className="space-y-4 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2 text-center block">Masukkan Nominal Bayar (Rp)</label>
                <div className="relative">
                   <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-gray-700 text-2xl">Rp</span>
                   <input required type="number" min="1" max={selectedBill?.amount - (selectedBill?.paid_amount || 0)}
                    value={payAmount} onChange={e => setPayAmount(e.target.value)}
                    placeholder="0" autoFocus
                    className="w-full pl-20 pr-8 py-9 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-4xl font-black text-center text-indigo-600 dark:text-indigo-400 ring-4 ring-indigo-500/5 focus:ring-indigo-500/10 shadow-inner transition-all placeholder:text-gray-200 dark:placeholder:text-gray-800" />
                </div>
              </div>
              <button type="submit" disabled={submitting || !payAmount}
                className="w-full py-7 rounded-lg font-black text-white text-[12px] uppercase tracking-[0.2em] bg-indigo-600 shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                {submitting ? <Loader2 className="animate-spin" size={24} /> : (
                   <>
                      <span>KONFIRMASI BAYAR</span>
                      <CheckCircle2 size={24} strokeWidth={3} />
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

export default TagihanMobile;
