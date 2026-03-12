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
      setSuccess('Profil diperbaharui ✨');
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
      setSuccess('Password diubah ✨');
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
      <div className="pb-32 space-y-8 px-6 pt-4 animate-in fade-in duration-500">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Pengaturan</h1>

        {success && (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-xl shadow-emerald-900/5">
            <Save size={20} strokeWidth={3} />
            <p className="text-[10px] font-black uppercase tracking-widest">{success}</p>
          </div>
        )}

        {/* Profile Card Mobile */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all duration-700" />
          <div className="relative flex-shrink-0 group">
            <img
              src={initialUser?.avatar || `https://ui-avatars.com/api/?name=${initialUser?.name || 'U'}&background=4F46E5&color=fff&size=200`}
              alt="avatar"
              className="w-20 h-20 rounded-lg shadow-xl border-4 border-white dark:border-slate-800 object-cover transform active:scale-95 transition-transform"
            />
            <button 
              onClick={() => {
                const url = prompt('Masukkan URL avatar:', initialUser?.avatar);
                if (url !== null) {
                   api.put('/auth/profile', { ...profileForm, avatar: url }).then(res => onUpdateUser(res.data.user));
                }
              }}
              className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2 rounded-xl shadow-xl border-2 border-white dark:border-slate-800"
            >
              <Camera size={12} strokeWidth={3} />
            </button>
          </div>
          <div className="overflow-hidden relative z-10">
            <h2 className="text-base font-black text-gray-900 dark:text-white truncate lg:max-w-xs">{initialUser?.name || 'User'}</h2>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest truncate mt-0.5">{initialUser?.email}</p>
            <div className="mt-2">
               <span className="inline-block text-[7px] font-black bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg uppercase tracking-[0.2em] shadow-sm">Verified Account ✨</span>
            </div>
          </div>
        </div>

        {/* Akun Group */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] ml-2">DATA & KEAMANAN 🔥</p>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-slate-800">
             <button onClick={() => setShowEditProfile(true)} className="w-full flex items-center justify-between p-7 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm">
                    <User size={20} strokeWidth={3} />
                  </div>
                  <div className="text-left font-black uppercase tracking-tight">
                    <p className="text-sm text-gray-900 dark:text-white">Informasi Akun</p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1">NAMA, EMAIL & WHATSAPP</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 dark:text-gray-700" strokeWidth={3} />
             </button>
             <button onClick={() => setShowChangePass(true)} className="w-full flex items-center justify-between p-7 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 shadow-sm">
                    <Lock size={20} strokeWidth={3} />
                  </div>
                  <div className="text-left font-black uppercase tracking-tight">
                    <p className="text-sm text-gray-900 dark:text-white">Ganti Kata Sandi</p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1">SECURITY UPDATES</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 dark:text-gray-700" strokeWidth={3} />
             </button>
          </div>
        </div>

        {/* Kategori Shortcut */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] ml-2">ARSIP & KATEGORI 📂</p>
          <button
            onClick={() => setShowCatSheet(true)}
            className="w-full bg-white dark:bg-slate-900 p-7 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm">
                <Tags size={20} strokeWidth={3} />
              </div>
              <div className="text-left font-black uppercase tracking-tight">
                <p className="text-sm text-gray-900 dark:text-white">Master Kategori</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1">ALOKASI ARUS KAS</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 dark:text-gray-700" strokeWidth={3} />
          </button>
        </div>

        {/* Notifikasi Toggle */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-5 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-20" />
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] flex items-center gap-3">
            <Bell size={12} strokeWidth={3} /> PUSH NOTIFIKASI
          </p>
          <div className="space-y-4">
            {[
              { label: 'Notif Transaksi Baru', key: 'notif_transaksi' },
              { label: 'Reminder Jatuh Tempo', key: 'notif_tagihan' },
              { label: 'Warning Critical Budget', key: 'notif_budget' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest leading-none">{item.label}</p>
                <button
                  onClick={() => handleToggleSetting(item.key)}
                  className={`relative w-10 h-5 rounded-full transition-all duration-500 ring-4 ring-transparent active:ring-indigo-500/20 shadow-inner ${settings[item.key] ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-800'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transform transition-all duration-500 ${settings[item.key] ? 'left-5.5' : 'left-0.5'} flex items-center justify-center`}>
                    {settings[item.key] && <div className="w-1 h-1 bg-indigo-600 rounded-full" />}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preferensi */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] ml-2">REGIONAL SETTINGS 🌏</p>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden p-8 space-y-7">
             <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Format Mata Uang</p>
                <div className="relative group">
                  <select 
                    value={settings.currency} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings({...settings, currency: val});
                      api.put('/auth/profile', { ...profileForm, ...settings, currency: val }).then(res => onUpdateUser(res.data.user));
                    }}
                    className="bg-gray-50 dark:bg-slate-800 border-none text-[10px] font-black uppercase tracking-widest rounded-xl px-5 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 text-indigo-600 dark:text-indigo-400 appearance-none pr-10 shadow-inner"
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                  </select>
                  <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 rotate-90" strokeWidth={4} />
                </div>
             </div>
             <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Bahasa Aplikasi</p>
                <div className="relative group">
                  <select 
                    value={settings.language}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings({...settings, language: val});
                      api.put('/auth/profile', { ...profileForm, ...settings, language: val }).then(res => onUpdateUser(res.data.user));
                    }}
                    className="bg-gray-50 dark:bg-slate-800 border-none text-[10px] font-black uppercase tracking-widest rounded-xl px-5 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 text-indigo-600 dark:text-indigo-400 appearance-none pr-10 shadow-inner"
                  >
                    <option value="id">Indonesia</option>
                    <option value="en">English</option>
                  </select>
                  <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 rotate-90" strokeWidth={4} />
                </div>
             </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-4 py-6 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-rose-900/5 active:scale-95 transition-all mb-4"
        >
          <LogOut size={22} strokeWidth={3} />
          Keluar dari Akun
        </button>

        <div className="text-center pb-8">
           <p className="text-[10px] text-gray-300 dark:text-slate-800 font-black uppercase tracking-[0.5em]">KASIR BERKAH v1.2.0 ✨</p>
        </div>
      </div>

      {/* ======= MODAL: EDIT PROFIL ======= */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-6 transition-all duration-300">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowEditProfile(false)} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-xl p-10 space-y-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="flex items-center justify-between relative z-10">
               <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Identitas Akun</h2>
                  <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1.5">Kelola data profil anda</p>
               </div>
              <button onClick={() => setShowEditProfile(false)} className="p-3 text-gray-400 dark:text-gray-600 hover:text-rose-500 transition-colors"><X size={24} strokeWidth={3}/></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6 relative z-10">
              <div className="space-y-2 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] ml-2">Nama Lengkap</label>
                <input 
                  type="text" required value={profileForm.name} 
                  onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                />
              </div>
              <div className="space-y-2 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] ml-2">Alamat Email</label>
                <input 
                  type="email" required value={profileForm.email} 
                  onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                />
              </div>
              <div className="space-y-2 px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] ml-2">No. WhatsApp</label>
                <input 
                  type="tel" value={profileForm.phone} placeholder="08xxxxxxxxxx"
                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                />
              </div>
              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowEditProfile(false)} className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 rounded-lg font-black uppercase tracking-widest text-[10px]">BATAL</button>
                 <button type="submit" disabled={loading} className="flex-2 px-8 py-5 bg-indigo-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-900/20 active:scale-95 transition-all disabled:opacity-50">
                   {loading ? <Loader2 className="animate-spin mx-auto" size={20} strokeWidth={3}/> : 'SIMPAN PERUBAHAN'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======= MODAL: GANTI PASSWORD ======= */}
      {showChangePass && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowChangePass(false)} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-xl p-10 space-y-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 overflow-hidden text-center">
             <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="flex items-center justify-between text-left relative z-10">
               <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Update Keamanan</h2>
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1.5 leading-none">Refresh kata sandi anda</p>
               </div>
              <button onClick={() => setShowChangePass(false)} className="p-3 text-gray-400 dark:text-gray-700 hover:text-rose-500 transition-colors"><X size={24} strokeWidth={3}/></button>
            </div>
            {error && (
              <div className="p-5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-3 border border-rose-100 dark:border-rose-500/10">
                <AlertCircle size={18} strokeWidth={3}/> {error}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-6 relative z-10">
              <input 
                type="password" placeholder="PASSWORD LAMA" required 
                value={passForm.oldPassword} onChange={e => setPassForm({...passForm, oldPassword: e.target.value})}
                className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-black uppercase tracking-widest text-center focus:ring-4 focus:ring-rose-500/10 shadow-inner placeholder:text-gray-200 dark:placeholder:text-gray-700"
              />
              <div className="space-y-4">
                 <input 
                  type="password" placeholder="PASSWORD BARU" required 
                  value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-black uppercase tracking-widest text-center focus:ring-4 focus:ring-indigo-500/10 shadow-inner placeholder:text-gray-200 dark:placeholder:text-gray-700"
                />
                <input 
                  type="password" placeholder="KONFIRMASI PASSWORD" required 
                  value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm font-black uppercase tracking-widest text-center focus:ring-4 focus:ring-indigo-500/10 shadow-inner placeholder:text-gray-200 dark:placeholder:text-gray-700"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full py-6 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50 h-[70px]">
                {loading ? <Loader2 className="animate-spin mx-auto" size={24} strokeWidth={3}/> : 'UPDATE SEKARANG ✨'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======= BOTTOM SHEET: KELOLA KATEGORI (Dark Mode Support) ======= */}
      {showCatSheet && (
        <div className="fixed inset-0 z-[300] flex items-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowCatSheet(false)} />

          {/* Sheet */}
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-xl shadow-[0_-20px_100px_rgba(0,0,0,0.5)] z-10 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden pb-12">
            {/* Handle */}
            <div className="pt-6 pb-2 flex justify-center flex-shrink-0 sticky top-0 bg-white dark:bg-slate-900 z-20 px-6">
              <div className="w-12 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-10 pb-6 flex items-center justify-between border-b border-gray-50 dark:border-slate-800 flex-shrink-0 sticky top-12 bg-white dark:bg-slate-900 z-20 overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="text-left relative z-10">
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Daftar Kategori</h2>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest mt-1 leading-none font-black">Kelola Arus Kas Akun</p>
              </div>
              <button onClick={() => setShowCatSheet(false)} className="p-3 text-gray-400 dark:text-gray-600 hover:text-rose-500 transition-colors relative z-10">
                <X size={26} strokeWidth={4} />
              </button>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleAddCategory} className="px-10 py-8 border-b border-gray-50 dark:border-slate-800 flex-shrink-0 space-y-6 relative z-10 bg-gray-50/50 dark:bg-slate-800/20">
              <div className="space-y-4">
                 <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="NAMA KATEGORI BARU..."
                  className="w-full px-6 py-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg text-xs font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-indigo-500/10 shadow-sm placeholder:text-gray-200 dark:placeholder:text-gray-700"
                />
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <select
                      value={newCatType}
                      onChange={e => setNewCatType(e.target.value)}
                      className="w-full px-6 py-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/10 shadow-sm appearance-none pr-10"
                    >
                      <option value="expense">📉 Pengeluaran</option>
                      <option value="income">📈 Pemasukan</option>
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 dark:text-indigo-700 rotate-90" strokeWidth={4} />
                  </div>
                  <button
                    type="submit"
                    disabled={addingCat || !newCatName.trim()}
                    className="flex-1 flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-900/20 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {addingCat ? <Loader2 size={18} className="animate-spin" strokeWidth={3} /> : <Plus size={18} strokeWidth={4} />}
                    TAMBAH
                  </button>
                </div>
              </div>
            </form>

            {/* Category List - Scrollable */}
            <div className="overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar flex-1 relative z-10">
              {catLoading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-indigo-500" size={32} strokeWidth={3} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Mensinkronisasi...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Pemasukan */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                      <div className="w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center"><ArrowUpRight size={12} className="text-white" strokeWidth={4} /></div>
                      <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">Arus Masuk</p>
                      <div className="ml-auto w-10 h-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       {incomeCategories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between px-6 py-5 bg-emerald-50/20 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 rounded-lg active:scale-[0.98] transition-all group">
                          <div className="flex items-center gap-4">
                            <Tag size={16} className="text-emerald-500 dark:text-emerald-400" strokeWidth={3} />
                            <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">{cat.name}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            disabled={deletingCatId === cat.id}
                            className="p-3 text-gray-300 dark:text-gray-700 active:text-rose-500 transition-colors"
                          >
                            {deletingCatId === cat.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} strokeWidth={3} />}
                          </button>
                        </div>
                      ))}
                      {incomeCategories.length === 0 && (
                        <div className="py-12 text-center border-4 border-dashed border-gray-50 dark:border-slate-800/50 rounded-xl">
                           <p className="text-[9px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-[0.3em]">Belum Ada Data</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pengeluaran */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1 pt-4 border-t border-gray-50 dark:border-slate-800">
                      <div className="w-5 h-5 bg-rose-500 rounded-lg flex items-center justify-center"><ArrowDownRight size={12} className="text-white" strokeWidth={4} /></div>
                      <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">Arus Keluar</p>
                      <div className="ml-auto w-10 h-1 bg-rose-100 dark:bg-rose-500/20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       {expenseCategories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between px-6 py-5 bg-rose-50/20 dark:bg-rose-500/5 border border-rose-100/50 dark:border-rose-500/10 rounded-lg active:scale-[0.98] transition-all group">
                          <div className="flex items-center gap-4">
                            <Tag size={16} className="text-rose-500 dark:text-rose-400" strokeWidth={3} />
                            <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">{cat.name}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            disabled={deletingCatId === cat.id}
                            className="p-3 text-gray-300 dark:text-gray-700 active:text-rose-500 transition-colors"
                          >
                            {deletingCatId === cat.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} strokeWidth={3} />}
                          </button>
                        </div>
                      ))}
                      {expenseCategories.length === 0 && (
                        <div className="py-12 text-center border-4 border-dashed border-gray-50 dark:border-slate-800/50 rounded-xl">
                           <p className="text-[9px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-[0.3em]">Belum Ada Data</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PengaturanMobile;
