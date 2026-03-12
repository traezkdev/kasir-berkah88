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
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-4 pb-8 border-b border-gray-50">
              <div className="relative">
                <img
                  src={form.avatar || `https://ui-avatars.com/api/?name=${form.name || 'U'}&background=4F46E5&color=fff&size=128`}
                  alt="avatar"
                  className="w-28 h-28 rounded-3xl shadow-lg border-4 border-white object-cover"
                />
                <button 
                  onClick={() => {
                    const url = prompt('Masukkan URL gambar profil baru:', form.avatar);
                    if (url !== null) setForm({...form, avatar: url});
                  }}
                  className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
                >
                  <Camera size={16} />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-800">{initialUser?.name || 'User'}</h2>
                <p className="text-sm text-gray-400">{initialUser?.email}</p>
              </div>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Telepon</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="tel" value={form.phone} placeholder="08xxxxxxxxxx" onChange={e => setForm({...form, phone: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-70">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
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
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Kelola Kategori Transaksi</h3>
              <p className="text-sm text-gray-400">Kategori yang kamu buat akan otomatis muncul di form tambah transaksi.</p>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleAddCategory} className="flex items-end gap-3 p-5 bg-gray-50 rounded-2xl text-left">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Kategori Baru</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Contoh: Laundry, Gym, dll."
                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipe</label>
                <select value={newCatType} onChange={e => setNewCatType(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100">
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>
              <button type="submit" disabled={addingCat || !newCatName.trim()}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-60">
                {addingCat ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                <span>Tambah</span>
              </button>
            </form>

            {catLoading ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-400" size={28} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pemasukan */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size={16} className="text-green-600" />
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider text-left">Kategori Pemasukan</h4>
                    <span className="ml-auto bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{incomeCategories.length}</span>
                  </div>
                  <div className="space-y-2">
                    {incomeCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-4 py-3.5 bg-green-50/50 border border-green-100 rounded-2xl group">
                        <div className="flex items-center gap-3">
                          <Tag size={14} className="text-green-600" />
                          <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                        </div>
                        <button onClick={() => handleDeleteCategory(cat.id)} disabled={deletingCatId === cat.id}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          {deletingCatId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    ))}
                    {incomeCategories.length === 0 && <p className="text-xs text-gray-400 py-2 text-center">Belum ada kategori pemasukan</p>}
                  </div>
                </div>

                {/* Pengeluaran */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight size={16} className="text-red-500" />
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider text-left">Kategori Pengeluaran</h4>
                    <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{expenseCategories.length}</span>
                  </div>
                  <div className="space-y-2">
                    {expenseCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-4 py-3.5 bg-red-50/30 border border-red-100 rounded-2xl group">
                        <div className="flex items-center gap-3">
                          <Tag size={14} className="text-red-500" />
                          <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                        </div>
                        <button onClick={() => handleDeleteCategory(cat.id)} disabled={deletingCatId === cat.id}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          {deletingCatId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    ))}
                    {expenseCategories.length === 0 && <p className="text-xs text-gray-400 py-2 text-center">Belum ada kategori pengeluaran</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'notifikasi':
        return (
          <div className="space-y-6">
            <div className="pb-4">
              <h3 className="text-base font-bold text-gray-800 mb-1">Push Notifikasi</h3>
              <p className="text-sm text-gray-400">Atur saat kapan aplikasi harus mengirimkan kamu pengingat.</p>
            </div>
            {[
              { key: 'notif_transaksi', label: 'Transaksi Baru', desc: 'Notifikasi setiap ada transaksi yang dicatat' },
              { key: 'notif_tagihan', label: 'Pengingat Tagihan', desc: 'Notifikasi H-3 sebelum tagihan jatuh tempo' },
              { key: 'notif_budget', label: 'Peringatan Budget', desc: 'Notif saat pengeluaran melebihi 80% dari budget' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-6 bg-gray-50/80 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-gray-800 text-left">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 text-left">{item.desc}</p>
                </div>
                <button
                  onClick={() => {
                    const newForm = {...form, [item.key]: !form[item.key]};
                    setForm(newForm);
                    // Langsung simpan untuk UX toggle
                    api.put('/auth/profile', newForm).then(res => onUpdateUser(res.data.user));
                  }}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form[item.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${form[item.key] ? 'left-7' : 'left-1'}`}></span>
                </button>
              </div>
            ))}
          </div>
        );

      case 'keamanan':
        return (
          <div className="space-y-8">
             <div className="pb-4">
              <h3 className="text-base font-bold text-gray-800 mb-1">Ganti Kata Sandi</h3>
              <p className="text-sm text-gray-400">Pastikan menggunakan password yang kuat dan unik.</p>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password Lama</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="password" required value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="password" required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-70">
                  {loading ? 'Sedang Memproses...' : 'Ubah Password'}
                </button>
              </div>
            </form>

            <div className="pt-8 border-t border-gray-50">
               <button onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors">
                <LogOut size={20} />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        );

      case 'preferensi':
        return (
          <div className="space-y-8">
            <div className="pb-4">
              <h3 className="text-base font-bold text-gray-800 mb-1">Bahasa & Lokalisasi</h3>
              <p className="text-sm text-gray-400">Sesuaikan format mata uang dan bahasa aplikasi.</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mata Uang</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <select 
                    value={form.currency}
                    onChange={(e) => {
                      const newForm = {...form, currency: e.target.value};
                      setForm(newForm);
                      api.put('/auth/profile', newForm).then(res => onUpdateUser(res.data.user));
                    }}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium appearance-none"
                  >
                    <option value="IDR">IDR - Rupiah Indonesia</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                  <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bahasa Aplikasi</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <select 
                    value={form.language}
                    onChange={(e) => {
                      const newForm = {...form, language: e.target.value};
                      setForm(newForm);
                      api.put('/auth/profile', newForm).then(res => onUpdateUser(res.data.user));
                    }}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm font-medium appearance-none"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English (Coming Soon)</option>
                  </select>
                  <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl space-y-1 text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Versi Aplikasi</p>
              <p className="text-sm font-bold text-gray-800">trzfinance v1.0.0</p>
              <p className="text-[10px] text-gray-400">© 2024 trzfinance. All Rights Reserved.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-gray-500">Kelola profil dan konfigurasi akun kamu.</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
           <Save size={18} />
           <p className="text-sm font-bold">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-pulse">
           <AlertCircle size={18} />
           <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-1 h-fit">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all ${
                activeTab === tab.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              <tab.icon size={18} className={activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;
