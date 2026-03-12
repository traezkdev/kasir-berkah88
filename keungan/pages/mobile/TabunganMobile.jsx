import React, { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, Wallet, ArrowRight, ChevronRight, X, Loader2, Edit2, Trash2, MoreVertical, AlertCircle } from 'lucide-react';
import { savingsAPI } from '../../services/api';

const TabunganMobile = () => {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedSaving, setSelectedSaving] = useState(null);
  const [showActionId, setShowActionId] = useState(null);

  // Form states
  const [targetForm, setTargetForm] = useState({ name: '', target_amount: '', current_amount: '0' });
  const [depositForm, setDepositForm] = useState({ amount: '' });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const fetchSavings = async () => {
    setLoading(true);
    try {
      const res = await savingsAPI.getAll();
      setSavings(res.data);
    } catch (err) {
      setError('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  const totalCurrent = savings.reduce((acc, curr) => acc + Number(curr.current_amount), 0);
  const totalTarget = savings.reduce((acc, curr) => acc + Number(curr.target_amount), 0);

  const openAddTargetModal = () => {
    setEditingId(null);
    setTargetForm({ name: '', target_amount: '', current_amount: '0' });
    setShowTargetModal(true);
  };

  const openEditTargetModal = (item) => {
    setEditingId(item.id);
    setTargetForm({ name: item.name, target_amount: item.target_amount, current_amount: '0' });
    setShowTargetModal(true);
    setShowActionId(null);
  };

  const openDepositModal = (item) => {
    setSelectedSaving(item);
    setDepositForm({ amount: '' });
    setShowDepositModal(true);
  };

  const handleTargetSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await savingsAPI.update(editingId, {
          name: targetForm.name,
          target_amount: Number(targetForm.target_amount)
        });
      } else {
        await savingsAPI.create({
          name: targetForm.name,
          target_amount: Number(targetForm.target_amount),
          current_amount: Number(targetForm.current_amount)
        });
      }
      fetchSavings();
      setShowTargetModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan target.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await savingsAPI.addDeposit(selectedSaving.id, Number(depositForm.amount));
      fetchSavings();
      setShowDepositModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambah saldo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus target tabungan ini?')) {
      try {
        await savingsAPI.delete(id);
        setSavings(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        alert('Gagal menghapus.');
      }
    }
  };

  return (
    <div className="pb-32 space-y-8 px-6 pt-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Tabungan</h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Wujudkan Impianmu</p>
         </div>
        <button 
          onClick={openAddTargetModal}
          className="bg-indigo-600 text-white p-3 rounded-lg shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-90 transition-all font-black"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Sinkronisasi Impian...</p>
        </div>
      ) : (
        <>
          {/* Hero Stats Mobile */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/40 text-white flex flex-col items-center text-center gap-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12"><Wallet size={120} strokeWidth={1} /></div>
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-1 backdrop-blur-sm shadow-sm relative z-10">
                <Wallet size={32} strokeWidth={2.5} />
              </div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-indigo-100/60 uppercase tracking-[0.3em] mb-2">Total Tabungan Sekarang</p>
                 <p className="text-3xl font-black tracking-tight">
                   {formatCurrency(totalCurrent)}
                 </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Target size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Target Kumulatif</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(totalTarget)}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                  <TrendingUp size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Sisa Kekurangan</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(totalTarget - totalCurrent)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Goals List Mobile */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Daftar Impian</p>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">{savings.length} Target</span>
            </div>

            {savings.length === 0 ? (
              <div className="py-20 text-center bg-gray-50/50 dark:bg-slate-900/50 rounded-xl border-4 border-dashed border-gray-100 dark:border-slate-800">
                 <Target className="mx-auto text-gray-200 dark:text-slate-800 mb-4" size={48} strokeWidth={2} />
                 <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Belum ada target impian</p>
                 <button onClick={openAddTargetModal} className="mt-6 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest underline underline-offset-4">MULAI SEKARANG</button>
              </div>
            ) : (
              savings.map((item) => {
                const progress = (Number(item.current_amount) / Number(item.target_amount)) * 100;
                return (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col gap-6 transition-all active:scale-[0.98] relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 dark:bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20">
                          <Target size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</h3>
                          <p className="text-[10px] font-black text-emerald-500 mt-1 uppercase tracking-widest">{Math.round(progress)}% Tercapai</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={() => setShowActionId(showActionId === item.id ? null : item.id)}
                          className="p-3 text-gray-300 dark:text-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <MoreVertical size={24} strokeWidth={3} />
                        </button>

                        {showActionId === item.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowActionId(null)} />
                            <div className="absolute right-0 mt-3 w-36 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-50 dark:border-slate-800 z-20 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                              <button 
                                onClick={() => openEditTargetModal(item)}
                                className="w-full px-5 py-3 text-left text-[11px] font-black text-gray-600 dark:text-gray-400 flex items-center gap-3 uppercase tracking-widest"
                              >
                                <Edit2 size={14} strokeWidth={3} /> EDIT
                              </button>
                              <button 
                                onClick={() => { handleDelete(item.id); setShowActionId(null); }}
                                className="w-full px-5 py-3 text-left text-[11px] font-black text-rose-500 flex items-center gap-3 uppercase tracking-widest"
                              >
                                <Trash2 size={14} strokeWidth={3} /> HAPUS
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="h-4 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-gray-100 dark:border-slate-800 shadow-inner">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1) shadow-sm"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 px-1">
                        <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(item.current_amount)}</span>
                        <span>Sisa {formatCurrency(Math.max(0, item.target_amount - item.current_amount))}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => openDepositModal(item)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 px-4 py-6 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:bg-indigo-600 active:text-white dark:active:bg-indigo-600 transition-all font-black shadow-sm"
                    >
                      <span>Tambah Tabungan</span> <ChevronRight size={16} strokeWidth={3} />
                    </button>

                    {/* BG Decorative */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors" />
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
      
      {/* Tip Card Mobile */}
      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 p-8 rounded-xl border border-indigo-100 dark:border-slate-800 flex items-start gap-5 shadow-sm">
         <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0 transform rotate-6">
            <TrendingUp size={28} strokeWidth={2.5} />
         </div>
         <div className="pt-1">
            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">💡 Tips Menabung</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-bold uppercase tracking-tight">Sisihkan minimal 10% dari pemasukan setiap bulan untuk mempercepat target impianmu.</p>
         </div>
      </div>

      {/* Modals Mobile (Dark Mode Support) */}
      {showTargetModal && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowTargetModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full rounded-t-xl p-8 pb-12 space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mx-auto -mt-2 mb-2" />
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{editingId ? 'Edit Impian' : 'Impian Baru'}</h2>
                  <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Gantungkan mimpimu di sini</p>
               </div>
              <button onClick={() => setShowTargetModal(false)} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-gray-400 dark:text-gray-500 hover:text-rose-500 transition-all font-black">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            
            <form onSubmit={handleTargetSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nama Impian Anda</label>
                <input 
                  type="text" required
                  value={targetForm.name}
                  onChange={(e) => setTargetForm({...targetForm, name: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700"
                  placeholder="Misal: Beli Laptop Baru"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Target Nominal (Rp)</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-gray-700 text-lg">Rp</span>
                   <input 
                    type="number" required min="1"
                    value={targetForm.target_amount}
                    onChange={(e) => setTargetForm({...targetForm, target_amount: e.target.value})}
                    className="w-full pl-16 pr-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-xl font-black text-indigo-600 dark:text-indigo-400 placeholder:text-gray-200 dark:placeholder:text-gray-800"
                    placeholder="0"
                  />
                </div>
              </div>
              {!editingId && (
                <div className="space-y-3 px-1">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Saldo Awal (Opsional)</label>
                  <input 
                    type="number" min="0"
                    value={targetForm.current_amount}
                    onChange={(e) => setTargetForm({...targetForm, current_amount: e.target.value})}
                    className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200"
                    placeholder="0"
                  />
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold italic ml-2">⚠️ OTOMATIS TERCATAT SEBAGAI PENGELUARAN.</p>
                </div>
              )}
              <button 
                disabled={submitting}
                className="w-full py-5 bg-indigo-600 text-white rounded-lg font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                   <>
                      <span>{editingId ? 'SIMPAN PERUBAHAN' : 'MULAI MENABUNG'}</span>
                      <Plus size={20} strokeWidth={3} />
                   </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDepositModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowDepositModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full rounded-xl p-10 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="text-center">
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-2 font-black">Tambah Setoran</p>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">{selectedSaving?.name}</h2>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-8">
              <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-gray-700 text-lg">Rp</span>
                 <input 
                  type="number" required min="1" autoFocus
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                  className="w-full pl-16 pr-6 py-7 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-3xl font-black text-center text-indigo-600 dark:text-indigo-400 ring-4 ring-indigo-50 dark:ring-indigo-500/10 placeholder:text-gray-200 dark:placeholder:text-gray-800"
                  placeholder="0"
                />
              </div>
              
              <div className="flex items-start gap-4 bg-amber-50 dark:bg-amber-500/5 p-5 rounded-lg border border-amber-100 dark:border-amber-500/10">
                <AlertCircle className="text-amber-600 dark:text-amber-500 shrink-0" size={20} strokeWidth={3} />
                <p className="text-[9px] text-amber-900 dark:text-amber-200 font-bold leading-relaxed uppercase tracking-tighter">
                  SALDO UTAMA AKAN OTOMATIS BERKURANG SESUAI JUMLAH SETORAN INI.
                </p>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setShowDepositModal(false)} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-lg font-black text-[10px] uppercase tracking-widest">BATAL</button>
                <button 
                  disabled={submitting}
                  className="flex-2 px-6 py-5 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                     <>
                        <span>KONFIRMASI</span>
                        <ArrowRight size={18} strokeWidth={3} />
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

export default TabunganMobile;
