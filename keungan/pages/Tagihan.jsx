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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Tagihan</h1>
          <p className="text-gray-500">Pantau dan kelola semua tagihan rutinmu.</p>
        </div>
        <button onClick={openAddModal} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus size={20} /> <span>Tambah Tagihan</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><CreditCard size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Terbayar</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(paidTotal)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sisa Tagihan</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(unpaidTotal)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Coins size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tagihan</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(unpaidTotal + paidTotal)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari nama tagihan..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 text-sm"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Bill Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3 text-gray-300">
          <Loader2 className="animate-spin" size={32} />
          <span className="text-sm font-medium">Memuat data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBills.map((bill) => {
            const paid = Number(bill.paid_amount || 0);
            const total = Number(bill.amount);
            const percent = Math.min((paid / total) * 100, 100);
            
            return (
              <div key={bill.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${bill.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                      <CreditCard size={24} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                        {bill.status === 'paid' ? 'Lunas' : percent > 0 ? 'Mencicil' : 'Belum Bayar'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEditModal(bill)} className="p-1.5 text-gray-300 hover:text-indigo-600 rounded-lg">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(bill.id)} disabled={deletingId === bill.id} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg">
                          {deletingId === bill.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{bill.name}</h3>
                      <p className="text-xs text-gray-400 font-medium">Jatuh Tempo: {formatDate(bill.due_date)}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        <span>Progress: {Math.round(percent)}%</span>
                        <span>{formatCurrency(paid)} / {formatCurrency(total)}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${bill.status === 'paid' ? 'bg-green-500' : 'bg-indigo-600'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {bill.status !== 'paid' && (
                        <button
                          onClick={() => openPayModal(bill)}
                          className="flex-1 px-4 py-2.5 bg-gray-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5">
                          <Coins size={14} /> Cicil
                        </button>
                      )}
                      <button
                        onClick={() => toggleStatus(bill)}
                        disabled={togglingId === bill.id}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 ${bill.status === 'unpaid' ? 'flex-1 bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'w-full bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {togglingId === bill.id ? <Loader2 size={13} className="animate-spin" /> : (bill.status === 'unpaid' ? 'Bayar Lunas' : 'Batalkan Lunas')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBills.length === 0 && !loading && (
            <div className="col-span-full py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 text-center">
              <p className="text-gray-400 font-medium">Belum ada tagihan. Klik "Tambah Tagihan" untuk mulai.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL CRUD ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Tagihan' : 'Tambah Tagihan Baru'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Tagihan</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Listrik, Internet, BPJS, dll."
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal (Rp)</label>
                  <input required type="number" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jatuh Tempo</label>
                  <input required type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-bold">Batal</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Simpan' : 'Tambah')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL CICIL ===== */}
      {showPayModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePayModal} />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Cicil Tagihan</h2>
              <button onClick={closePayModal} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X size={20} /></button>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-2xl">
              <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Tagihan: {selectedBill?.name}</p>
              <p className="text-lg font-black text-indigo-700">Sisa: {formatCurrency(selectedBill?.amount - (selectedBill?.paid_amount || 0))}</p>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jumlah Bayar (Rp)</label>
                <input required type="number" min="1" max={selectedBill?.amount - (selectedBill?.paid_amount || 0)}
                  value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  placeholder="Masukkan nominal cicilan" autoFocus
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-xl font-black text-center focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={closePayModal} className="flex-1 py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-bold">Batal</button>
                <button type="submit" disabled={submitting || !payAmount}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Bayar'}
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
