import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, ChevronRight, Tags,
  Camera, LogOut, Lock, Mail, Smartphone, Globe,
  Plus, Trash2, Loader2, Tag, ArrowUpRight, ArrowDownRight, X, AlertCircle, Save
} from 'lucide-react';
import api from '../../services/api';

const PengaturanMobile = ({ user: initialUser, onLogout, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State Form Profile
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: initialUser?.name || '',
    email: initialUser?.email || '',
    phone: initialUser?.phone || '',
    avatar: initialUser?.avatar || ''
  });

  // State Form Password
  const [showChangePass, setShowChangePass] = useState(false);
  const [passForm, setPassForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State Setting Toggles
  const [settings, setSettings] = useState({
    notif_transaksi: initialUser?.notif_transaksi ?? true,
    notif_tagihan: initialUser?.notif_tagihan ?? true,
    notif_budget: initialUser?.notif_budget ?? false,
    currency: initialUser?.currency || 'IDR',
    language: initialUser?.language || 'id'
  });

  // Sync state with user prop
  useEffect(() => {
    if (initialUser) {
      setProfileForm({
        name: initialUser.name || '',
        email: initialUser.email || '',
        phone: initialUser.phone || '',
        avatar: initialUser.avatar || ''
      });
      setSettings({
        notif_transaksi: initialUser.notif_transaksi ?? true,
        notif_tagihan: initialUser.notif_tagihan ?? true,
        notif_budget: initialUser.notif_budget ?? false,
        currency: initialUser.currency || 'IDR',
        language: initialUser.language || 'id'
      });
    }
  }, [initialUser]);

  // State Kategori
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [showCatSheet, setShowCatSheet] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');
  const [addingCat, setAddingCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState(null);

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
    if (showCatSheet) fetchCategories();
  }, [showCatSheet]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.put('/auth/profile', profileForm);
      if (onUpdateUser) onUpdateUser(res.data.user);
      setSuccess('Profil berhasil diperbaharui');
      setShowEditProfile(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.put('/auth/password', {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword
      });
      setSuccess('Password berhasil diubah');
      setShowChangePass(false);
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (key) => {
    const newVal = !settings[key];
    const newSettings = { ...settings, [key]: newVal };
    setSettings(newSettings);
    try {
      const res = await api.put('/auth/profile', { ...profileForm, ...newSettings });
      if (onUpdateUser) onUpdateUser(res.data.user);
    } catch (err) {
      console.error('Gagal update setting:', err);
      // Rollback UI jika gagal
      setSettings(settings);
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
      alert('Gagal menghapus kategori');
    } finally {
      setDeletingCatId(null);
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <>
      <div className="pb-24 space-y-6 px-6 pt-4">
        <h1 className="text-xl font-bold text-gray-800">Pengaturan</h1>

        {success && (
          <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-[1.5rem] flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <Save size={18} />
            <p className="text-[11px] font-black uppercase tracking-wider">{success}</p>
          </div>
        )}

        {/* Profile Card Mobile */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <img
              src={initialUser?.avatar || `https://ui-avatars.com/api/?name=${initialUser?.name || 'U'}&background=4F46E5&color=fff&size=128`}
              alt="avatar"
              className="w-20 h-20 rounded-3xl shadow-md border-4 border-white object-cover"
            />
            <button 
              onClick={() => {
                const url = prompt('Masukkan URL avatar:', initialUser?.avatar);
                if (url !== null) {
                   api.put('/auth/profile', { ...profileForm, avatar: url }).then(res => onUpdateUser(res.data.user));
                }
              }}
              className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-xl shadow-sm"
            >
              <Camera size={12} />
            </button>
          </div>
          <div className="overflow-hidden">
            <h2 className="text-base font-black text-gray-800 truncate">{initialUser?.name || 'User'}</h2>
            <p className="text-[11px] text-gray-400 font-medium truncate">{initialUser?.email}</p>
            <span className="inline-block mt-1 text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Premium Akun</span>
          </div>
        </div>

        {/* Akun Group */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Akun & Keamanan</p>
          <div className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden">
             <button onClick={() => setShowEditProfile(true)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 border-b border-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-2xl text-indigo-600 bg-indigo-50">
                    <User size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">Edit Profil</p>
                    <p className="text-[10px] text-gray-400 font-medium">Nama, Email & Telepon</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
             </button>
             <button onClick={() => setShowChangePass(true)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-2xl text-green-600 bg-green-50">
                    <Lock size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">Ganti Password</p>
                    <p className="text-[10px] text-gray-400 font-medium">Ubah kata sandi akun</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
             </button>
          </div>
        </div>

        {/* Kategori Shortcut */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaksi</p>
          <button
            onClick={() => setShowCatSheet(true)}
            className="w-full bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm flex items-center justify-between group hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-2xl text-indigo-600 bg-indigo-50">
                <Tags size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-800">Kelola Kategori</p>
                <p className="text-[10px] text-gray-400 font-medium">Tambah atau hapus kategori transaksi</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </div>

        {/* Notifikasi Toggle */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm space-y-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Bell size={12} /> Notifikasi
          </p>
          {[
            { label: 'Transaksi Baru', key: 'notif_transaksi' },
            { label: 'Jatuh Tempo Tagihan', key: 'notif_tagihan' },
            { label: 'Budget Melebihi 80%', key: 'notif_budget' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">{item.label}</p>
              <button
                onClick={() => handleToggleSetting(item.key)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${settings[item.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${settings[item.key] ? 'left-7' : 'left-1'}`}></span>
              </button>
            </div>
          ))}
        </div>

        {/* Preferensi */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preferensi</p>
          <div className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden p-6 space-y-5">
             <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">Mata Uang</p>
                <select 
                  value={settings.currency} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings({...settings, currency: val});
                    api.put('/auth/profile', { ...profileForm, ...settings, currency: val }).then(res => onUpdateUser(res.data.user));
                  }}
                  className="bg-gray-50 border-none text-xs font-bold rounded-xl px-3 py-2 outline-none"
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                </select>
             </div>
             <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">Bahasa</p>
                <select 
                   value={settings.language}
                   onChange={(e) => {
                     const val = e.target.value;
                     setSettings({...settings, language: val});
                     api.put('/auth/profile', { ...profileForm, ...settings, language: val }).then(res => onUpdateUser(res.data.user));
                   }}
                   className="bg-gray-50 border-none text-xs font-bold rounded-xl px-3 py-2 outline-none"
                >
                  <option value="id">Indonesia</option>
                  <option value="en">English (Soon)</option>
                </select>
             </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-5 bg-red-50 text-red-600 rounded-3xl font-black text-sm hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          <LogOut size={20} />
          Keluar dari Akun
        </button>

        <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest pb-2">trzfinance v1.0.0</p>
      </div>

      {/* ======= MODAL: EDIT PROFIL ======= */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowEditProfile(false)} />
          <div className="relative w-full bg-white rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-800">Edit Profil</h2>
              <button onClick={() => setShowEditProfile(false)} className="p-2 bg-gray-50 rounded-xl"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <input 
                  type="text" required value={profileForm.name} 
                  onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <input 
                  type="email" required value={profileForm.email} 
                  onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telepon</label>
                <input 
                  type="tel" value={profileForm.phone} placeholder="08xxxx"
                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 disabled:opacity-70 mt-4">
                {loading ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======= MODAL: GANTI PASSWORD ======= */}
      {showChangePass && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowChangePass(false)} />
          <div className="relative w-full bg-white rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-800">Ganti Password</h2>
              <button onClick={() => setShowChangePass(false)} className="p-2 bg-gray-50 rounded-xl"><X size={20}/></button>
            </div>
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl flex items-center gap-2">
                <AlertCircle size={14}/> {error}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input 
                type="password" placeholder="Password Lama" required 
                value={passForm.oldPassword} onChange={e => setPassForm({...passForm, oldPassword: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100"
              />
              <input 
                type="password" placeholder="Password Baru" required 
                value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100"
              />
              <input 
                type="password" placeholder="Konfirmasi Password Baru" required 
                value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100"
              />
              <button type="submit" disabled={loading} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-green-100 disabled:opacity-70 mt-2">
                {loading ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Ubah Password Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======= BOTTOM SHEET: KELOLA KATEGORI ======= */}
      {showCatSheet && (
        <div className="fixed inset-0 z-[200] flex items-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCatSheet(false)} />

          {/* Sheet */}
          <div className="relative w-full bg-white rounded-t-[2.5rem] shadow-2xl z-10 max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="pt-4 pb-2 flex justify-center flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-6 pb-4 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
              <div className="text-left">
                <h2 className="text-base font-bold text-gray-800">Kelola Kategori</h2>
                <p className="text-[10px] text-gray-400 font-medium">Kategori ini dipakai di form transaksi</p>
              </div>
              <button onClick={() => setShowCatSheet(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl">
                <X size={20} />
              </button>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleAddCategory} className="px-6 py-4 border-b border-gray-50 flex-shrink-0 space-y-3">
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newCatType}
                  onChange={e => setNewCatType(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
                <button
                  type="submit"
                  disabled={addingCat || !newCatName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-100 disabled:opacity-60"
                >
                  {addingCat ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Tambah
                </button>
              </div>
            </form>

            {/* Category List - Scrollable */}
            <div className="overflow-y-auto px-6 py-4 space-y-5" style={{ maxHeight: '45vh' }}>
              {catLoading ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="animate-spin text-indigo-400" size={28} />
                </div>
              ) : (
                <>
                  {/* Pemasukan */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={14} className="text-green-600" />
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Pemasukan</p>
                      <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{incomeCategories.length}</span>
                    </div>
                    {incomeCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-4 py-3.5 bg-green-50/40 border border-green-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Tag size={14} className="text-green-600" />
                          <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={deletingCatId === cat.id}
                          className="p-1.5 text-gray-300 active:text-red-500 transition-colors"
                        >
                          {deletingCatId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    ))}
                    {incomeCategories.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">Belum ada kategori pemasukan</p>
                    )}
                  </div>

                  {/* Pengeluaran */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight size={14} className="text-red-500" />
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Pengeluaran</p>
                      <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{expenseCategories.length}</span>
                    </div>
                    {expenseCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-4 py-3.5 bg-red-50/30 border border-red-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Tag size={14} className="text-red-500" />
                          <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={deletingCatId === cat.id}
                          className="p-1.5 text-gray-300 active:text-red-500 transition-colors"
                        >
                          {deletingCatId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    ))}
                    {expenseCategories.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">Belum ada kategori pengeluaran</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PengaturanMobile;
