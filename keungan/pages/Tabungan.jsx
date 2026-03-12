import React, { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, Wallet, ArrowRight, MoreVertical, X, Loader2, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { savingsAPI } from '../services/api';

const Tabungan = () => {
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
      setError('Gagal mengambil data tabungan.');
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
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
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
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus target tabungan ini?')) {
      try {
        await savingsAPI.delete(id);
        setSavings(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        alert('Gagal menghapus data.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Target Tabungan</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Wujudkan impianmu dengan menabung secara konsisten.</p>
        </div>
        <button 
          onClick={openAddTargetModal}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Tambah Target Baru</span>
        </button>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4 text-gray-400">
          <div className="w-12 h-12 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Memuat Impian Anda...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-xl shadow-2xl shadow-indigo-100 dark:shadow-indigo-900/40 text-white flex items-center gap-4 transform transition-transform hover:-translate-y-1">
              <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm shadow-sm">
                <Wallet size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Total Tabungan</p>
                <p className="text-2xl font-black tracking-tight">{formatCurrency(totalCurrent)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transform transition-transform hover:-translate-y-1">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm">
                <Target size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Target Kumulatif</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(totalTarget)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transform transition-transform hover:-translate-y-1">
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg shadow-sm">
                <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Sisa Kekurangan</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(totalTarget - totalCurrent)}</p>
              </div>
            </div>
          </div>

          {/* Savings Goal Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
            {savings.map((item) => {
              const progress = (Number(item.current_amount) / Number(item.target_amount)) * 100;
              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 transform group-hover:rotate-12 shadow-sm">
                        <Target size={28} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</h3>
                        <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Update Progress Terakhir</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setShowActionId(showActionId === item.id ? null : item.id)}
                        className="text-gray-300 dark:text-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <MoreVertical size={24} strokeWidth={3} />
                      </button>
                      
                      {showActionId === item.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowActionId(null)} />
                          <div className="absolute right-0 mt-3 w-40 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-50 dark:border-slate-800 z-20 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                            <button 
                              onClick={() => openEditTargetModal(item)}
                              className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                            >
                              <Edit2 size={14} strokeWidth={3} /> Edit
                            </button>
                            <button 
                              onClick={() => { handleDelete(item.id); setShowActionId(null); }}
                              className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3 transition-colors"
                            >
                              <Trash2 size={14} strokeWidth={3} /> Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8 relative z-10">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Terkumpul</p>
                        <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{formatCurrency(item.current_amount)}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Target Akhir</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(item.target_amount)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="h-5 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-gray-100 dark:border-slate-800 shadow-inner">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-[2000ms] cubic-bezier(0.34, 1.56, 0.64, 1) shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="text-indigo-600 dark:text-indigo-400">{Math.round(progress)}% Capaian</span>
                        <span className="text-gray-400 dark:text-gray-500">
                          {progress >= 100 ? '✅ Target Tercapai!' : `Sisa ${formatCurrency(item.target_amount - item.current_amount)} Lagi`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4">
                       <button 
                        onClick={() => openDepositModal(item)}
                        className="w-full py-5 bg-gray-50 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-lg hover:bg-slate-900 dark:hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-3 group/btn shadow-sm"
                       >
                         <span>Tambah Tabungan</span>
                         <ArrowRight size={18} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                       </button>
                    </div>
                  </div>

                  {/* BG Decorative */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
                </div>
              );
            })}

            {/* Create New Placeholder */}
            <div 
              onClick={openAddTargetModal}
              className="bg-gray-50/30 dark:bg-slate-800/20 border-4 border-dashed border-gray-100 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-12 group hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all cursor-pointer min-h-[400px] transform hover:scale-[1.01]"
            >
               <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-lg shadow-xl flex items-center justify-center text-gray-200 dark:text-slate-800 group-hover:text-indigo-500 group-hover:scale-110 transition-all duration-500">
                 <Plus size={48} strokeWidth={3} />
               </div>
               <p className="text-gray-400 dark:text-gray-600 font-black uppercase tracking-[0.3em] text-[10px] mt-8 group-hover:text-indigo-500 transition-colors">Buat Target Baru</p>
            </div>
          </div>
        </>
      )}

      {/* Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowTargetModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 pb-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -ml-16 -mt-16" />
               <div className="relative">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {editingId ? 'Edit Impian' : 'Impian Baru'}
                  </h2>
                  <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">Gantungkan mimpimu di sini</p>
               </div>
              <button onClick={() => setShowTargetModal(false)} className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all relative z-10">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            <form onSubmit={handleTargetSubmit} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nama Impian Anda</label>
                <div className="relative">
                   <Target className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700" size={20} />
                   <input 
                    type="text" 
                    required 
                    value={targetForm.name} 
                    onChange={(e) => setTargetForm({...targetForm, name: e.target.value})}
                    placeholder="Misal: Beli Laptop Baru"
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Target Nominal (Rp)</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 dark:text-gray-700 text-lg">Rp</span>
                   <input 
                    type="number" 
                    required 
                    min="1"
                    value={targetForm.target_amount} 
                    onChange={(e) => setTargetForm({...targetForm, target_amount: e.target.value})}
                    placeholder="0"
                    className="w-full pl-16 pr-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 text-xl font-black text-indigo-600 dark:text-indigo-400 placeholder:text-gray-200 dark:placeholder:text-gray-700"
                  />
                </div>
              </div>
              {!editingId && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Saldo Awal (Opsional)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={targetForm.current_amount} 
                    onChange={(e) => setTargetForm({...targetForm, current_amount: e.target.value})}
                    placeholder="Contoh: 1000000"
                    className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700"
                  />
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold italic ml-2">⚠️ OTOMATIS TERCATAT SEBAGAI PENGELUARAN.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowTargetModal(false)}
                  className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                  BATAL
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-2 px-10 py-5 bg-indigo-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-3 transform hover:-translate-y-1">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                       <span>{editingId ? 'SIMPAN' : 'BUAT SEKARANG'}</span>
                       <Plus size={20} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowDepositModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 pb-6 flex items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
               <div className="relative">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Setoran</h2>
                  <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">{selectedSaving?.name}</p>
               </div>
               <button onClick={() => setShowDepositModal(false)} className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all relative z-10">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            <form onSubmit={handleDepositSubmit} className="p-10 space-y-8">
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Jumlah Setoran (Rp)</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 dark:text-gray-700 text-lg">Rp</span>
                   <input 
                    type="number" 
                    required 
                    min="1"
                    autoFocus
                    value={depositForm.amount} 
                    onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                    placeholder="0"
                    className="w-full pl-16 pr-6 py-6 bg-gray-50 dark:bg-slate-800 border-none rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 text-3xl font-black text-indigo-600 dark:text-indigo-400 placeholder:text-gray-200 dark:placeholder:text-gray-800 text-center"
                  />
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-500/5 p-6 rounded-xl flex items-start gap-4 border border-amber-100 dark:border-amber-500/10 shadow-sm">
                <AlertCircle className="text-amber-600 dark:text-amber-500 shrink-0" size={24} strokeWidth={3} />
                <p className="text-[10px] text-amber-900 dark:text-amber-200 font-bold leading-relaxed uppercase tracking-tighter">
                  SETORAN AKAN TERCATAT SEBAGAI <span className="underline">PENGELUARAN</span> UNTUK MENYESUAIKAN SALDO UTAMA.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                  BATAL
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-2 px-6 py-5 bg-indigo-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-3 transform hover:-translate-y-1">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                       <span>SETOR SEKARANG</span>
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

export default Tabungan;
