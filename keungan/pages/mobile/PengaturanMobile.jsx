import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, ChevronRight, Tags,
  Camera, LogOut, Lock, Mail, Smartphone, Globe,
  Plus, Trash2, Loader2, Tag, ArrowUpRight, ArrowDownRight, X
} from 'lucide-react';
import api from '../../services/api';

const PengaturanMobile = ({ user, onLogout }) => {
  const [notifTagihan, setNotifTagihan] = useState(true);
  const [notifBudget, setNotifBudget] = useState(false);
  const [notifTransaksi, setNotifTransaksi] = useState(true);

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

  const menuGroups = [
    {
      title: 'Akun',
      items: [
        { label: 'Edit Profil', desc: 'Ubah nama dan foto profil', icon: User, color: 'text-indigo-600 bg-indigo-50' },
        { label: 'Ganti Email', desc: user?.email || '-', icon: Mail, color: 'text-blue-600 bg-blue-50' },
        { label: 'Ganti Password', desc: 'Keamanan kata sandi', icon: Lock, color: 'text-green-600 bg-green-50' },
      ]
    },
    {
      title: 'Preferensi',
      items: [
        { label: 'Bahasa & Wilayah', desc: 'Bahasa Indonesia / IDR', icon: Globe, color: 'text-amber-600 bg-amber-50' },
        { label: 'Perangkat Terhubung', desc: 'Kelola sesi aktif', icon: Smartphone, color: 'text-purple-600 bg-purple-50' },
      ]
    }
  ];

  return (
    <>
      <div className="pb-24 space-y-6 px-6 pt-4">
        <h1 className="text-xl font-bold text-gray-800">Pengaturan</h1>

        {/* Profile Card Mobile */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=4F46E5&color=fff&size=128`}
              alt="avatar"
              className="w-20 h-20 rounded-3xl shadow-md border-4 border-white"
            />
            <button className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-xl shadow-sm">
              <Camera size={12} />
            </button>
          </div>
          <div className="overflow-hidden">
            <h2 className="text-base font-black text-gray-800 truncate">{user?.name || 'User'}</h2>
            <p className="text-[11px] text-gray-400 font-medium truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Free Plan</span>
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
            { label: 'Transaksi Baru', state: notifTransaksi, fn: setNotifTransaksi },
            { label: 'Jatuh Tempo Tagihan', state: notifTagihan, fn: setNotifTagihan },
            { label: 'Budget Melebihi 80%', state: notifBudget, fn: setNotifBudget },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">{item.label}</p>
              <button
                onClick={() => item.fn(!item.state)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.state ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${item.state ? 'left-7' : 'left-1'}`}></span>
              </button>
            </div>
          ))}
        </div>

        {/* Menu Groups */}
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{group.title}</p>
            <div className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden">
              {group.items.map((item, i) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors ${i !== group.items.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-2xl ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800">{item.label}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

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
              <div>
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
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pemasukan</p>
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
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pengeluaran</p>
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
