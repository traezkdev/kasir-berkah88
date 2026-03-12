import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Palette, Globe, ChevronRight,
  Camera, LogOut, Smartphone, Lock, Mail, Save,
  Tags, Plus, Trash2, Loader2, Tag, ArrowUpRight, ArrowDownRight, AlertCircle, X
} from 'lucide-react';
import api from '../services/api';

const Pengaturan = ({ user: initialUser, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    name: initialUser?.name || '',
    email: initialUser?.email || '',
    phone: initialUser?.phone || '',
    notif_transaksi: initialUser?.notif_transaksi ?? true,
    notif_tagihan: initialUser?.notif_tagihan ?? true,
    notif_budget: initialUser?.notif_budget ?? false,
    currency: initialUser?.currency || 'IDR',
    language: initialUser?.language || 'id',
    avatar: initialUser?.avatar || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State Kategori
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');
  const [deletingCatId, setDeletingCatId] = useState(null);
  const [addingCat, setAddingCat] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'kategori', label: 'Kategori', icon: Tags },
    { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
    { id: 'keamanan', label: 'Keamanan', icon: Shield },
    { id: 'preferensi', label: 'Preferensi', icon: Palette },
  ];

  // Sync form with user prop when it changes
  useEffect(() => {
    if (initialUser) {
      setForm({
        name: initialUser.name || '',
        email: initialUser.email || '',
        phone: initialUser.phone || '',
        notif_transaksi: initialUser.notif_transaksi ?? true,
        notif_tagihan: initialUser.notif_tagihan ?? true,
        notif_budget: initialUser.notif_budget ?? false,
        currency: initialUser.currency || 'IDR',
        language: initialUser.language || 'id',
        avatar: initialUser.avatar || ''
      });
    }
  }, [initialUser]);

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Gagal memuat kategori:', err);
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'kategori') fetchCategories();
  }, [activeTab]);

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/auth/profile', form);
      setSuccess('Profil berhasil diperbarui!');
      if (onUpdateUser) onUpdateUser(res.data.user);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Konfirmasi password baru tidak cocok');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/auth/password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess('Password berhasil diubah!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const res = await api.post('/categories', { name: newCatName.trim(), type: newCatType });
      setCategories(prev => [...prev, res.data]);
      setNewCatName('');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambah kategori');
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    setDeletingCatId(id);
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori');
    } finally {
      setDeletingCatId(null);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-4 pb-8 border-b border-gray-50 dark:border-slate-800 relative">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
              <div className="relative group">
                <img
                  src={form.avatar || `https://ui-avatars.com/api/?name=${form.name || 'U'}&background=4F46E5&color=fff&size=200`}
                  alt="avatar"
                  className="w-24 h-24 rounded-lg shadow-xl border-4 border-white dark:border-slate-800 object-cover transform group-hover:scale-105 transition-all duration-500 shadow-indigo-200/50 dark:shadow-black/50"
                />
                <button 
                  onClick={() => {
                    const url = prompt('Masukkan URL gambar profil baru:', form.avatar);
                    if (url !== null) setForm({...form, avatar: url});
                  }}
                  className="absolute -bottom-1 -right-1 bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-lg shadow-xl hover:bg-indigo-700 active:scale-90 transition-all border-2 border-white dark:border-slate-800"
                >
                  <Camera size={16} strokeWidth={2.5} />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">{initialUser?.name || 'User'}</h2>
                <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em]">{initialUser?.email}</p>
              </div>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Nama Lengkap</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 group-focus-within:text-indigo-500 transition-colors" size={18} strokeWidth={3} />
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-xs font-black text-gray-700 dark:text-gray-200 shadow-inner" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Alamat Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 group-focus-within:text-indigo-500 transition-colors" size={18} strokeWidth={3} />
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-xs font-black text-gray-700 dark:text-gray-200 shadow-inner" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">No. WhatsApp</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 group-focus-within:text-indigo-500 transition-colors" size={18} strokeWidth={3} />
                    <input type="tel" value={form.phone} placeholder="08xxxxxxxxxx" onChange={e => setForm({...form, phone: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-xs font-black text-gray-700 dark:text-gray-200 shadow-inner" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6">
                <button type="submit" disabled={loading}
                  className="flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-900/20 active:scale-95 hover:bg-indigo-700 transition-all disabled:opacity-70">
                  {loading ? <Loader2 size={18} className="animate-spin" strokeWidth={3} /> : <Save size={18} strokeWidth={3} />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        );

      case 'kategori':
        const incomeCategories = categories.filter(c => c.type === 'income');
        const expenseCategories = categories.filter(c => c.type === 'expense');
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Daftar Kategori</h3>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Atur kategori pemasukan dan pengeluaran anda.</p>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row items-end gap-6 p-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 shadow-inner">
              <div className="flex-1 w-full space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2 leading-none">Nama Kategori</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Laundry, Listrik, Bonus, dll."
                  className="w-full px-6 py-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
              <div className="w-full md:w-auto space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2 leading-none">Tipe Arus Kas</label>
                <select value={newCatType} onChange={e => setNewCatType(e.target.value)}
                  className="w-full px-6 py-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/10 appearance-none pr-12 cursor-pointer">
                  <option value="expense">📉 Pengeluaran</option>
                  <option value="income">📈 Pemasukan</option>
                </select>
              </div>
              <button type="submit" disabled={addingCat || !newCatName.trim()}
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-5 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-900/20 active:scale-95 hover:bg-indigo-700 transition-all disabled:opacity-60 h-[60px]">
                {addingCat ? <Loader2 size={18} className="animate-spin" strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                <span>TAMBAH</span>
              </button>
            </form>

            {catLoading ? (
              <div className="py-20 flex flex-col items-center gap-4 text-gray-400">
                <Loader2 className="animate-spin text-indigo-500" size={32} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Sinkronisasi Kategori...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Pemasukan */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                       <ArrowUpRight size={18} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Pemasukan</h4>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total: {incomeCategories.length} Kategori</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {incomeCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-6 py-5 bg-emerald-50/20 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 rounded-lg group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                          <Tag size={16} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                          <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest leading-none">{cat.name}</span>
                        </div>
                        <button onClick={() => handleDeleteCategory(cat.id)} disabled={deletingCatId === cat.id}
                          className="p-2 text-gray-300 dark:text-gray-700 hover:text-rose-500 transition-all px-1 group-hover:scale-110">
                          {deletingCatId === cat.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} strokeWidth={2.5} />}
                        </button>
                      </div>
                    ))}
                    {incomeCategories.length === 0 && (
                       <div className="py-10 text-center border-4 border-dashed border-gray-50 dark:border-slate-800/50 rounded-3xl">
                          <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest">Belum ada kategori</p>
                       </div>
                    )}
                  </div>
                </div>

                {/* Pengeluaran */}
                <div className="space-y-6">
                   <div className="flex items-center gap-4 px-2">
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                       <ArrowDownRight size={18} className="text-rose-600 dark:text-rose-400" strokeWidth={3} />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Pengeluaran</h4>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total: {expenseCategories.length} Kategori</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {expenseCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-6 py-5 bg-rose-50/20 dark:bg-rose-500/5 border border-rose-100/50 dark:border-rose-500/10 rounded-lg group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                          <Tag size={16} className="text-rose-600 dark:text-rose-400" strokeWidth={3} />
                          <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest leading-none">{cat.name}</span>
                        </div>
                        <button onClick={() => handleDeleteCategory(cat.id)} disabled={deletingCatId === cat.id}
                          className="p-2 text-gray-300 dark:text-gray-700 hover:text-rose-500 transition-all px-1 group-hover:scale-110">
                          {deletingCatId === cat.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} strokeWidth={2.5} />}
                        </button>
                      </div>
                    ))}
                    {expenseCategories.length === 0 && (
                       <div className="py-10 text-center border-4 border-dashed border-gray-50 dark:border-slate-800/50 rounded-3xl">
                          <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest">Belum ada kategori</p>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'notifikasi':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Push Notifikasi</h3>
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Personalisasi pemberitahuan aktivitas anda.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: 'notif_transaksi', label: 'Transaksi Baru ✨', desc: 'Dapatkan konfirmasi setiap kali mencatat pengeluaran atau pemasukan baru.' },
                { key: 'notif_tagihan', label: 'Pengingat Tagihan 🕒', desc: 'Kami akan mengirimkan pengingat H-3 sebelum masa jatuh tempo tagihan anda.' },
                { key: 'notif_budget', label: 'Peringatan Budget 📉', desc: 'Notifikasi krisis saat pengeluaran anda sudah melebihi 80% dari budget yang diatur.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800 active:scale-[0.99] transition-all group">
                  <div className="flex-1 pr-10">
                    <p className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest mb-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.label}</p>
                    <p className="text-[8px] text-gray-400 dark:text-gray-500 leading-relaxed max-w-sm font-bold uppercase tracking-wider">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      const newForm = {...form, [item.key]: !form[item.key]};
                      setForm(newForm);
                      // Langsung simpan untuk UX toggle
                      api.put('/auth/profile', newForm).then(res => onUpdateUser(res.data.user));
                    }}
                    className={`relative w-10 h-5 rounded-full transition-all duration-500 ring-4 ring-transparent hover:ring-indigo-500/10 ${form[item.key] ? 'bg-indigo-600 shadow-lg shadow-indigo-900/20' : 'bg-gray-200 dark:bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-500 flex items-center justify-center ${form[item.key] ? 'left-5.5' : 'left-0.5'}`}>
                       {form[item.key] && <div className="w-1 h-1 bg-indigo-600 rounded-full" />}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'keamanan':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Kata Sandi Akun</h3>
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Update keamanan akun anda secara berkala.</p>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Password Saat Ini</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 group-focus-within:text-rose-500 transition-colors" size={18} strokeWidth={3} />
                    <input type="password" required value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-rose-500/10 text-xs font-black text-gray-700 dark:text-gray-200 shadow-inner" placeholder="••••••••" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Password Baru ✨</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 group-focus-within:text-indigo-500 transition-colors" size={18} strokeWidth={3} />
                      <input type="password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-xs font-black text-gray-700 dark:text-gray-200 shadow-inner" placeholder="Minimal 8 karakter" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Konfirmasi Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 group-focus-within:text-indigo-500 transition-colors" size={18} strokeWidth={3} />
                      <input type="password" required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-xs font-black text-gray-700 dark:text-gray-200 shadow-inner" placeholder="Ulangi password" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-xl shadow-indigo-900/20 active:scale-95 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center gap-3">
                  {loading ? <Loader2 size={16} className="animate-spin" strokeWidth={3} /> : <CheckCircle2 size={16} strokeWidth={3} />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>

            <div className="pt-8 border-t border-gray-50 dark:border-slate-800">
               <button onClick={onLogout}
                className="w-full flex items-center justify-center gap-4 py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg font-black uppercase tracking-[0.2em] hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all text-[9px] shadow-sm">
                <LogOut size={18} strokeWidth={3} />
                <span>KELUAR DARI AKUN</span>
              </button>
            </div>
          </div>
        );

      case 'preferensi':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Regional & Tampilan</h3>
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Atur lokalisasi agar sesuai dengan kebutuhan anda.</p>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Mata Uang (Currency)</label>
                <div className="relative group">
                  <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 group-focus-within:text-indigo-500 transition-colors" size={20} strokeWidth={3} />
                  <select 
                    value={form.currency}
                    onChange={(e) => {
                      const newForm = {...form, currency: e.target.value};
                      setForm(newForm);
                      api.put('/auth/profile', newForm).then(res => onUpdateUser(res.data.user));
                    }}
                    className="w-full pl-16 pr-12 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="IDR">🇮🇩 IDR - Rupiah Indonesia</option>
                    <option value="USD">🇺🇸 USD - US Dollar</option>
                  </select>
                  <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 rotate-90" strokeWidth={3} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Bahasa Sistem (Language)</label>
                <div className="relative group">
                  <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 group-focus-within:text-indigo-500 transition-colors" size={20} strokeWidth={3} />
                  <select 
                    value={form.language}
                    onChange={(e) => {
                      const newForm = {...form, language: e.target.value};
                      setForm(newForm);
                      api.put('/auth/profile', newForm).then(res => onUpdateUser(res.data.user));
                    }}
                    className="w-full pl-16 pr-12 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-4 focus:ring-indigo-500/10 text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English (Mendatang)</option>
                  </select>
                  <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 rotate-90" strokeWidth={3} />
                </div>
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-indigo-500/5 to-transparent dark:from-indigo-500/10 dark:to-transparent rounded-xl border border-gray-50 dark:border-slate-800/50 space-y-1 relative overflow-hidden group hover:scale-[1.01] transition-transform">
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/20 transition-all duration-700" />
               <p className="text-[9px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.4em] mb-4">Informasi Sistem ✨</p>
               <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">KASIR BERKAH v1.2.0</h4>
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-loose">Engineered for superior financial management.<br/>© 2024 Kasir Berkah Inc. All rights reserved.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">Pusat Kendali</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Personalisasi dan optimasi akun kamu sekarang.</p>
        </div>
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
           <div className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
              SISTEM AKTIF
           </div>
        </div>
      </div>

      {success && (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl shadow-emerald-100 dark:shadow-none relative overflow-hidden">
           <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
           <Save size={24} strokeWidth={3} />
           <p className="text-sm font-black uppercase tracking-wide">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-4 animate-in fade-in shake duration-500 shadow-xl shadow-rose-100 dark:shadow-none relative overflow-hidden">
           <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
           <AlertCircle size={24} strokeWidth={3} />
           <p className="text-sm font-black uppercase tracking-wide">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col gap-2 h-fit transition-transform hover:scale-[1.01] sticky top-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-3 px-5 py-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 dark:shadow-none transform scale-105 active:scale-95' 
                  : 'text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}>
              <tab.icon size={16} strokeWidth={3} className={`transition-transform duration-500 group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : 'text-gray-300 dark:text-gray-700'}`} />
              <span>{tab.label}</span>
              {activeTab === tab.id && <div className="ml-auto w-1 h-1 bg-white rounded-full animate-pulse" />}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-12 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
           <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mb-32" />
           <div className="relative z-10">
              {renderContent()}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;
