
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    Edit2,
    Send,
    Image as ImageIcon,
    CheckCircle2,
    Eye,
    TrendingUp,
    MousePointer2,
    BarChart3,
    Link2,
    AlertTriangle,
    Info,
    Megaphone,
    X,
    Check,
    Search,
    Loader2,
    Monitor,
    Layout
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import authFetch from '../../../utils/authFetch';
import { useTheme } from '../../../contexts/ThemeContext';
import BreadcrumbNavigation from '../../../components/ui/BreadcrumbNavigation';
import NavigationHeader from '../../../components/ui/NavigationHeader';

const API_URL = import.meta.env.VITE_API_URL;

const AVAILABLE_PAGES = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'menu', label: 'Menu' },
    { value: 'cart', label: 'Keranjang' },
    { value: 'profile', label: 'Profil' },
    { value: 'promo', label: 'Promo' },
    { value: 'orders', label: 'Pesanan' },
    { value: 'points', label: 'Poin' },
];

const LINK_TYPES = [
    { value: 'none', label: 'Tidak Ada Link' },
    { value: 'screen', label: 'Link ke Halaman' },
    { value: 'url', label: 'Link ke URL' },
];

const SCREEN_OPTIONS = [
    { value: 'Promo', label: 'Halaman Promo' },
    { value: 'Menu', label: 'Menu' },
    { value: 'InformationScreen', label: 'Pusat Info' },
];

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const AdminPopupManagement = () => {
    const { theme } = useTheme();
    const [popups, setPopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingPopup, setEditingPopup] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        image: null,
        imageUri: null,
        link_type: 'none',
        link_value: '',
        show_on_pages: [],
        priority: 0,
        is_active: true,
    });

    const fileInputRef = useRef(null);

    const fetchPopups = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/popups');
            if (response.ok) {
                const result = await response.json();
                setPopups(Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []));
            } else {
                toast.error('Gagal memuat data popup');
            }
        } catch (error) {
            console.error('Error fetching popups:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPopups();
    }, [fetchPopups]);

    const handleOpenModal = (popup = null) => {
        if (popup) {
            setEditingPopup(popup);
            setFormData({
                title: popup.title,
                image: null,
                imageUri: getImageUrl(popup.image_url),
                link_type: popup.link_type || 'none',
                link_value: popup.link_value || '',
                show_on_pages: Array.isArray(popup.show_on_pages) ? popup.show_on_pages : [],
                priority: popup.priority || 0,
                is_active: !!popup.is_active,
            });
        } else {
            setEditingPopup(null);
            setFormData({
                title: '',
                image: null,
                imageUri: null,
                link_type: 'none',
                link_value: '',
                show_on_pages: [],
                priority: 0,
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Gagal: Ukuran file melebihi 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image: file,
                    imageUri: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title) {
            toast.error('Judul wajib diisi');
            return;
        }
        if (!editingPopup && !formData.image && !formData.imageUri) {
            toast.error('Gambar wajib diunggah');
            return;
        }

        setSaving(true);
        try {
            // Using multipart/form-data for image upload
            const data = new FormData();
            data.append('title', formData.title);
            data.append('link_type', formData.link_type);
            data.append('link_value', formData.link_value || '');
            data.append('show_on_pages', JSON.stringify(formData.show_on_pages));
            data.append('priority', formData.priority || 0);
            data.append('is_active', formData.is_active ? 1 : 0);

            // Explicitly handle image removal if imageUri is null but was present
            if (!formData.image && !formData.imageUri) {
                data.append('remove_image', 'true');
            }

            if (formData.image) {
                data.append('image', formData.image);
            }

            const url = editingPopup ? `/api/popups/${editingPopup.id}` : '/api/popups';
            const method = editingPopup ? 'PUT' : 'POST';

            const response = await authFetch(url, {
                method,
                body: data,
            });

            if (response.ok) {
                toast.success(editingPopup ? 'Popup diperbarui' : 'Popup ditambahkan');
                setShowModal(false);
                fetchPopups();
            } else {
                const errData = await response.json();
                toast.error(errData.error || 'Gagal menyimpan popup');
            }
        } catch (error) {
            console.error('Error saving popup:', error);
            toast.error('Terjadi kesalahan koneksi');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus popup ini?')) return;
        try {
            const response = await authFetch(`/api/popups/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Popup dihapus');
                fetchPopups();
            } else {
                toast.error('Gagal menghapus');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        }
    };

    const handlePush = async (id) => {
        if (!window.confirm('Kirim ulang push notification untuk popup ini?')) return;
        try {
            const response = await authFetch(`/api/popups/${id}/push`, { method: 'POST' });
            if (response.ok) {
                toast.success('Popup berhasil dipush ke semua customer');
                fetchPopups();
            } else {
                toast.error('Gagal melakukan push');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        }
    };

    const togglePage = (pageValue) => {
        setFormData(prev => {
            const pages = [...prev.show_on_pages];
            const index = pages.indexOf(pageValue);
            if (index > -1) pages.splice(index, 1);
            else pages.push(pageValue);
            return { ...prev, show_on_pages: pages };
        });
    };

    const filteredPopups = useMemo(() => {
        return popups.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [popups, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: popups.length,
            active: popups.filter(p => p.is_active).length,
            totalViews: popups.reduce((acc, p) => acc + (p.view_count || 0), 0),
            totalClicks: popups.reduce((acc, p) => acc + (p.click_count || 0), 0)
        };
    }, [popups]);

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-[#f8fafc] dark:bg-slate-950' : 'bg-transparent'}`}>
            {theme === 'default' && <NavigationHeader headerTitle="Manajemen Popup Admin" />}

            <div className="p-5 pt-24 lg:pt-8 pb-32 max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <BreadcrumbNavigation />
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2 flex items-center gap-3">
                            <Megaphone className="text-emerald-600" size={32} />
                            Pusat Popup Interaktif
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                            Tarik perhatian pelanggan dengan pengumuman visual yang dinamis
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenModal()}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Buat Popup Baru
                    </motion.button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Popup', value: stats.total, icon: Layout, color: 'blue' },
                        { label: 'Popup Aktif', value: stats.active, icon: CheckCircle2, color: 'green' },
                        { label: 'Total Tayangan', value: stats.totalViews, icon: Eye, color: 'purple' },
                        { label: 'Total Klik', value: stats.totalClicks, icon: MousePointer2, color: 'orange' }
                    ].map((stat, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={stat.label}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
                        >
                            <div className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-2xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 mb-4`}>
                                <stat.icon size={24} />
                            </div>
                            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-2">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row gap-6 justify-between items-center">
                        <div className="relative w-full lg:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Cari judul popup..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                                <p className="text-slate-500 font-bold animate-pulse">Menghubungkan ke Pusat Popup...</p>
                            </div>
                        ) : filteredPopups.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Megaphone className="w-12 h-12 text-slate-400" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Belum Ada Popup</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                                    {searchQuery ? 'Tidak ada popup yang cocok dengan pencarian Anda.' : 'Ayo buat popup pertama Anda untuk menyapa pelanggan!'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredPopups.map((popup) => (
                                    <motion.div
                                        layout
                                        key={popup.id}
                                        className="group bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="relative aspect-[4/3] overflow-hidden">
                                            {popup.image_url ? (
                                                <img
                                                    src={getImageUrl(popup.image_url)}
                                                    alt={popup.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                    <ImageIcon size={48} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${popup.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                                                    {popup.is_active ? 'AKTIF' : 'DRAFT'}
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/80 to-transparent">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <TrendingUp size={14} className="text-orange-400" />
                                                    <span className="text-xs font-bold text-orange-400">Prioritas {popup.priority}</span>
                                                </div>
                                                <h4 className="text-white font-black text-xl truncate">{popup.title}</h4>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-6">
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                                                    <Eye size={16} className="text-blue-500 mb-1" />
                                                    <span className="text-xs font-black text-slate-700 dark:text-white">{popup.view_count || 0}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Views</span>
                                                </div>
                                                <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                                                    <MousePointer2 size={16} className="text-orange-500 mb-1" />
                                                    <span className="text-xs font-black text-slate-700 dark:text-white">{popup.click_count || 0}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Clicks</span>
                                                </div>
                                                <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                                                    <BarChart3 size={16} className="text-emerald-500 mb-1" />
                                                    <span className="text-xs font-black text-emerald-600">
                                                        {popup.view_count > 0 ? ((popup.click_count / popup.view_count) * 100).toFixed(1) : 0}%
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">CTR</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    <Layout size={14} className="text-indigo-500" />
                                                    <span>Tampil di: {Array.isArray(popup.show_on_pages) && popup.show_on_pages.length > 0
                                                        ? popup.show_on_pages.map(v => AVAILABLE_PAGES.find(ap => ap.value === v)?.label || v).join(', ')
                                                        : 'Semua Halaman'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    <Link2 size={14} className="text-rose-500" />
                                                    <span>Tipe Aksi: {LINK_TYPES.find(l => l.value === popup.link_type)?.label || popup.link_type}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                                <button
                                                    onClick={() => handleOpenModal(popup)}
                                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Edit2 size={14} /> EDIT
                                                </button>
                                                <button
                                                    onClick={() => handlePush(popup.id)}
                                                    className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
                                                    title="Push Ulang"
                                                >
                                                    <Send size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(popup.id)}
                                                    className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all border border-rose-100 dark:border-rose-900"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden my-8 border border-slate-200 dark:border-slate-800"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-11">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${editingPopup ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {editingPopup ? <Edit2 size={24} /> : <Plus size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                            {editingPopup ? 'Konfigurasi Popup' : 'Desain Popup Baru'}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">Visualisasikan pengumuman terbaik Anda</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
                                {/* Upload Section */}
                                <div className="space-y-3 text-center">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative aspect-[4/3] rounded-[2rem] border-4 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-all overflow-hidden group"
                                    >
                                        {formData.imageUri ? (
                                            <img src={formData.imageUri} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="space-y-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                                    <ImageIcon size={32} />
                                                </div>
                                                <p className="text-sm font-black text-slate-600 dark:text-slate-300">Klik untuk Unggah Gambar</p>
                                                <p className="text-xs font-medium text-slate-400">Rekomendasi rasio 4:3, Maks 5MB</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                    {formData.imageUri && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: null, imageUri: null }))}
                                            className="text-xs font-bold text-rose-500 hover:underline"
                                        >
                                            Hapus & Ganti Gambar
                                        </button>
                                    )}
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Judul PopUp *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full mt-2 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800 dark:text-white transition-all"
                                            placeholder="Misal: Flash Sale Malam Ini!"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Urutan Prioritas</label>
                                            <div className="relative mt-2">
                                                <TrendingUp size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="number"
                                                    value={formData.priority}
                                                    onChange={e => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Status Aktif</span>
                                                <label className="relative inline-flex items-center cursor-pointer ml-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.is_active}
                                                        onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Link & Nav */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Target Interaksi</label>
                                        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                            {LINK_TYPES.map(type => (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, link_type: type.value, link_value: '' }))}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${formData.link_type === type.value
                                                        ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                                                        : 'text-slate-500'}`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>

                                        {formData.link_type === 'screen' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {SCREEN_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, link_value: opt.value }))}
                                                        className={`p-3 rounded-2xl border text-sm font-bold transition-all text-left flex items-center gap-3 ${formData.link_value === opt.value
                                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                                            : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.link_value === opt.value ? 'border-emerald-500' : 'border-slate-300'}`}>
                                                            {formData.link_value === opt.value && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                                                        </div>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {formData.link_type === 'url' && (
                                            <div className="relative">
                                                <Link2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="url"
                                                    value={formData.link_value}
                                                    onChange={e => setFormData(prev => ({ ...prev, link_value: e.target.value }))}
                                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800 dark:text-white"
                                                    placeholder="https://example.com/promo"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Pages targets */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Target Halaman (Multi-select)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {AVAILABLE_PAGES.map(page => (
                                                <button
                                                    key={page.value}
                                                    type="button"
                                                    onClick={() => togglePage(page.value)}
                                                    className={`px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all flex items-center gap-2 border ${formData.show_on_pages.includes(page.value)
                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100'
                                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                                                >
                                                    {page.label}
                                                    {formData.show_on_pages.includes(page.value) && <Check size={12} />}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold italic">*Kosongkan untuk tampil di semua halaman</p>
                                    </div>
                                </div>

                                {/* Footer save */}
                                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 text-slate-500 font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-3xl transition-all"
                                    >
                                        BATAL
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-[2] py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm rounded-3xl shadow-xl shadow-emerald-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={20} />}
                                        {editingPopup ? 'SIMPAN PERUBAHAN' : 'LUNCURKAN POPUP'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPopupManagement;
