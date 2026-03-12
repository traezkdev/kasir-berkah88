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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Target Tabungan</h1>
          <p className="text-gray-500 text-sm">Wujudkan impianmu dengan menabung secara konsisten.</p>
        </div>
        <button 
          onClick={openAddTargetModal}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          <span>Tambah Target Baru</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="animate-spin" size={32} />
          <span className="text-sm font-medium">Memuat data tabungan...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white flex items-center gap-5">
              <div className="p-4 bg-white/20 rounded-2xl">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Total Tabungan</p>
                <p className="text-xl md:text-2xl font-black">{formatCurrency(totalCurrent)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                <Target size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Kumulatif</p>
                <p className="text-xl md:text-2xl font-black text-gray-900">{formatCurrency(totalTarget)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sisa Kekurangan</p>
                <p className="text-xl md:text-2xl font-black text-gray-900">{formatCurrency(totalTarget - totalCurrent)}</p>
              </div>
            </div>
          </div>

          {/* Savings Goal Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 md:pb-0">
            {savings.map((item) => {
              const progress = (Number(item.current_amount) / Number(item.target_amount)) * 100;
              return (
                <div key={item.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <Target size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800">{item.name}</h3>
                        <p className="text-xs md:text-sm text-gray-400 font-medium">Progress Impian Anda</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setShowActionId(showActionId === item.id ? null : item.id)}
                        className="text-gray-300 hover:text-indigo-600 transition-colors p-2"
                      >
                        <MoreVertical size={24} />
                      </button>
                      
                      {showActionId === item.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowActionId(null)} />
                          <div className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl border border-gray-50 z-20 overflow-hidden py-1">
                            <button 
                              onClick={() => openEditTargetModal(item)}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 size={16} /> Edit
                            </button>
                            <button 
                              onClick={() => { handleDelete(item.id); setShowActionId(null); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={16} /> Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terkumpul</p>
                        <p className="text-xl md:text-2xl font-black text-indigo-600">{formatCurrency(item.current_amount)}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Akhir</p>
                        <p className="text-base md:text-lg font-bold text-gray-800">{formatCurrency(item.target_amount)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden p-1">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-sm shadow-indigo-200"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] md:text-xs font-bold uppercase tracking-wider">
                        <span className="text-indigo-600">{Math.round(progress)}% Capaian</span>
                        <span className="text-gray-400">
                          {progress >= 100 ? 'Target Tercapai!' : `Sisa ${formatCurrency(item.target_amount - item.current_amount)} Lagi`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4">
                       <button 
                        onClick={() => openDepositModal(item)}
                        className="w-full py-4 bg-gray-50 text-indigo-600 font-bold rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
                       >
                         <span>Tambah Tabungan</span>
                         <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                       </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Create New Placeholder */}
            <div 
              onClick={openAddTargetModal}
              className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 md:p-12 group hover:border-indigo-300 transition-all cursor-pointer min-h-[300px]"
            >
               <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300 group-hover:text-indigo-400 mb-4 transition-colors">
                 <Plus size={32} />
               </div>
               <p className="text-gray-400 font-bold group-hover:text-indigo-400 transition-colors">Buat Target Baru</p>
            </div>
          </div>
        </>
      )}

      {/* Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTargetModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Target Impian' : 'Target Impian Baru'}
              </h2>
              <button onClick={() => setShowTargetModal(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTargetSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Impian</label>
                <input 
                  type="text" required 
                  value={targetForm.name} 
                  onChange={(e) => setTargetForm({...targetForm, name: e.target.value})}
                  placeholder="Misal: Beli MacBook Pro"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Nominal (Rp)</label>
                <input 
                  type="number" required min="1"
                  value={targetForm.target_amount} 
                  onChange={(e) => setTargetForm({...targetForm, target_amount: e.target.value})}
                  placeholder="Contoh: 25000000"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-bold"
                />
              </div>
              {!editingId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saldo Awal (Opsional)</label>
                  <input 
                    type="number" min="0"
                    value={targetForm.current_amount} 
                    onChange={(e) => setTargetForm({...targetForm, current_amount: e.target.value})}
                    placeholder="Contoh: 1000000"
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-bold"
                  />
                  <p className="text-[10px] text-gray-400 font-medium italic">*Jika diisi, saldo akan otomatis tercatat sebagai pengeluaran.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTargetModal(false)}
                  className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Simpan' : 'Buat Target')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDepositModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-gray-800">Tambah Setoran</h2>
                <button onClick={() => setShowDepositModal(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-400 font-medium">Untuk impian: <span className="text-indigo-600 font-bold">{selectedSaving?.name}</span></p>
            </div>
            <form onSubmit={handleDepositSubmit} className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jumlah Setoran (Rp)</label>
                <input 
                  type="number" required min="1"
                  autoFocus
                  value={depositForm.amount} 
                  onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                  placeholder="Contoh: 100000"
                  className="w-full px-5 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-xl font-black text-indigo-600 text-center"
                />
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-indigo-600 shrink-0" size={18} />
                <p className="text-[10px] md:text-xs text-indigo-800 font-medium leading-relaxed">
                  Setoran akan otomatis dicatat sebagai <span className="font-bold">Pengeluaran</span> di riwayat transaksi untuk menyesuaikan saldo utama Anda.
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Konfirmasi Setoran'}
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
