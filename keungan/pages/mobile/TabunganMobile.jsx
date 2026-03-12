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
    <div className="pb-24 space-y-8 px-6 pt-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Target Menabung</h1>
        <button 
          onClick={openAddTargetModal}
          className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100 italic"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-xs font-bold uppercase tracking-widest">Memuat Data...</p>
        </div>
      ) : (
        <>
          {/* Hero Stats Mobile */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-2">
                <Wallet size={32} />
              </div>
              <p className="text-[10px] font-bold text-indigo-100 border border-white/10 px-3 py-1 rounded-full uppercase tracking-widest">Saldo Tabungan Sekarang</p>
              <p className="text-3xl font-black">
                {formatCurrency(totalCurrent)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5">
                <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Kumulatif</p>
                  <p className="text-xl font-black text-gray-900">{formatCurrency(totalTarget)}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sisa Kekurangan</p>
                  <p className="text-xl font-black text-gray-900">{formatCurrency(totalTarget - totalCurrent)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Goals List Mobile */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daftar Impian</p>
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md font-bold">{savings.length} Target</span>
            </div>

            {savings.length === 0 ? (
              <div className="py-12 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                 <Target className="mx-auto text-gray-300 mb-2" size={32} />
                 <p className="text-xs font-bold text-gray-400 italic">Belum ada target menabung</p>
              </div>
            ) : (
              savings.map((item) => {
                const progress = (Number(item.current_amount) / Number(item.target_amount)) * 100;
                return (
                  <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col gap-6 transition-all overflow-hidden relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                          <Target size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.name}</h3>
                          <p className="text-[10px] font-bold text-green-600">{Math.round(progress)}% Tercapai</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={() => setShowActionId(showActionId === item.id ? null : item.id)}
                          className="p-1 text-gray-300"
                        >
                          <MoreVertical size={20} />
                        </button>

                        {showActionId === item.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowActionId(null)} />
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden py-1">
                              <button 
                                onClick={() => openEditTargetModal(item)}
                                className="w-full px-4 py-2 text-left text-[11px] font-bold text-gray-600 flex items-center gap-2"
                              >
                                <Edit2 size={14} /> EDIT
                              </button>
                              <button 
                                onClick={() => { handleDelete(item.id); setShowActionId(null); }}
                                className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 flex items-center gap-2"
                              >
                                <Trash2 size={14} /> HAPUS
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden p-1">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black italic uppercase text-gray-400">
                        <span className="text-indigo-600">{formatCurrency(item.current_amount)}</span>
                        <span>Sisa {formatCurrency(Math.max(0, item.target_amount - item.current_amount))} Lagi</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => openDepositModal(item)}
                      className="w-full bg-gray-50 text-indigo-600 px-4 py-3 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 active:bg-slate-900 active:text-white transition-all"
                    >
                      Tambah Saldo Tabungan <ChevronRight size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
      
      {/* Tip Card Mobile */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-[2.5rem] border border-indigo-100 flex items-start gap-4">
         <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
            <TrendingUp size={24} />
         </div>
         <div>
            <p className="text-xs font-bold text-gray-800 mb-1">Tips Menabung</p>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Sisihkan minimal 10% dari pemasukan setiap bulan untuk mempercepat target impianmu.</p>
         </div>
      </div>

      {/* Modals Mobile */}
      {showTargetModal && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTargetModal(false)} />
          <div className="relative bg-white w-full rounded-t-[2.5rem] p-6 pb-10 space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-800 italic">{editingId ? 'EDIT IMPIAN' : 'IMPIAN BARU'}</h2>
              <button onClick={() => setShowTargetModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTargetSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Impian</label>
                <input 
                  type="text" required
                  value={targetForm.name}
                  onChange={(e) => setTargetForm({...targetForm, name: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold"
                  placeholder="Misal: Beli HP Baru"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Biaya</label>
                <input 
                  type="number" required min="1"
                  value={targetForm.target_amount}
                  onChange={(e) => setTargetForm({...targetForm, target_amount: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-indigo-600"
                  placeholder="2.000.000"
                />
              </div>
              {!editingId && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Setoran Awal (Opsional)</label>
                  <input 
                    type="number" min="0"
                    value={targetForm.current_amount}
                    onChange={(e) => setTargetForm({...targetForm, current_amount: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold"
                    placeholder="0"
                  />
                </div>
              )}
              <button 
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black italic shadow-xl shadow-indigo-100 flex items-center justify-center"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'SIMPAN PERUBAHAN' : 'MULAI MENABUNG')}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDepositModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDepositModal(false)} />
          <div className="relative bg-white w-full rounded-[2.5rem] p-8 space-y-6">
            <div className="text-center">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Tambah Setoran</p>
              <h2 className="text-xl font-black text-gray-800 uppercase italic leading-tight">{selectedSaving?.name}</h2>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-6">
              <input 
                type="number" required min="1" autoFocus
                value={depositForm.amount}
                onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                className="w-full px-5 py-6 bg-gray-50 border-none rounded-[2rem] text-2xl font-black text-center text-indigo-600 ring-4 ring-indigo-50"
                placeholder="RP 0"
              />
              
              <div className="flex items-start gap-3 bg-indigo-50 p-4 rounded-2xl">
                <AlertCircle className="text-indigo-600 shrink-0" size={16} />
                <p className="text-[10px] text-indigo-700 font-bold leading-relaxed italic">
                  *Saldo utama akan otomatis berkurang sesuai jumlah setoran ini.
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDepositModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                <button 
                  disabled={submitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'KONFIRMASI'}
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
