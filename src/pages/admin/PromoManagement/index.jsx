
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import BreadcrumbNavigation from '../../../components/ui/BreadcrumbNavigation';
import NavigationHeader from '../../../components/ui/NavigationHeader';
import { useTheme } from '../../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Ticket,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    Hash,
    Zap,
    CheckCircle2,
    XCircle,
    ShoppingBag,
    X,
    Truck,
    Gift,
    Wallet,
    Tags,
    Sparkles,
    User,
    Image as ImageIcon,
    Percent,
    AlertCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Palette,
    Eye,
    Tag,
    Clock
} from 'lucide-react';
import authFetch from '../../../utils/authFetch';
import Icon from '../../../components/AppIcon';

const API_URL = import.meta.env.VITE_API_URL;

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const AdminPromoManagement = () => {
    const { theme } = useTheme();
    const location = useLocation();

    // States
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('semua'); // 'semua', 'voucher', 'otomatis', 'banner'

    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [promoMode, setPromoMode] = useState('voucher'); // 'voucher' | 'automatic' | 'banner'

    // Usage Modal States
    const [usageModalVisible, setUsageModalVisible] = useState(false);
    const [usageData, setUsageData] = useState([]);
    const [loadingUsage, setLoadingUsage] = useState(false);
    const [selectedPromoUsage, setSelectedPromoUsage] = useState(null);
    const [usagePage, setUsagePage] = useState(1);
    const [usageHasMore, setUsageHasMore] = useState(true);

    const [form, setForm] = useState({
        title: '',
        description: '',
        code: '',
        icon: 'Ticket',
        color: '#3B82F6',
        expiry: '',
        is_active: true,
        discount_value: '',
        discount_type: 'fixed',
        min_purchase: '',
        is_hero: false,
        badge_text: '',
        image_url: '',
        is_one_time: false
    });

    const fileInputRef = useRef(null);

    const fetchPromos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/promos');
            if (response.ok) {
                const data = await response.json();
                setPromos(data.data || []);
            } else {
                toast.error('Gagal memuat data promo');
            }
        } catch (error) {
            console.error('Error fetching promos:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPromos();
    }, [fetchPromos]);

    const handleOpenModal = (promo = null, startAsHero = false) => {
        if (promo) {
            setEditingPromo(promo);
            if (promo.is_hero) {
                setPromoMode('banner');
            } else if (promo.code) {
                setPromoMode('voucher');
            } else {
                setPromoMode('automatic');
            }

            setForm({
                title: promo.title,
                description: promo.description || '',
                code: promo.code || '',
                icon: promo.icon || 'Ticket',
                color: promo.color || '#3B82F6',
                expiry: promo.expiry ? new Date(promo.expiry).toISOString().split('T')[0] : '',
                is_active: !!promo.is_active,
                discount_value: promo.discount_value?.toString() || '',
                discount_type: promo.discount_type || 'fixed',
                min_purchase: promo.min_purchase?.toString() || '',
                is_hero: !!promo.is_hero,
                badge_text: promo.badge_text || '',
                image_url: promo.image_url || '',
                is_one_time: !!promo.is_one_time
            });
        } else {
            setEditingPromo(null);
            setPromoMode(startAsHero ? 'banner' : 'voucher');
            setForm({
                title: '',
                description: '',
                code: '',
                icon: 'Ticket',
                color: '#3B82F6',
                expiry: '',
                is_active: true,
                discount_value: '',
                discount_type: 'fixed',
                min_purchase: '',
                is_hero: startAsHero,
                badge_text: '',
                image_url: '',
                is_one_time: false
            });
        }
        setModalVisible(true);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran gambar maksimal 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(prev => ({ ...prev, image: file, image_url: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title) {
            toast.error('Judul promo wajib diisi');
            return;
        }

        if (promoMode === 'voucher' && !form.code) {
            toast.error('Kode promo wajib diisi untuk jenis Voucher');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('is_hero', promoMode === 'banner' ? 1 : 0);
            formData.append('code', promoMode === 'voucher' ? form.code : '');
            formData.append('discount_value', form.discount_value || 0);
            formData.append('discount_type', form.discount_type);
            formData.append('min_purchase', form.min_purchase || 0);
            formData.append('expiry', form.expiry);
            formData.append('is_active', form.is_active ? 1 : 0);
            formData.append('is_one_time', form.is_one_time ? 1 : 0);
            formData.append('badge_text', form.badge_text || '');
            formData.append('color', form.color);
            formData.append('icon', promoMode === 'banner' ? '' : form.icon);

            if (form.image) {
                formData.append('image', form.image);
            }

            const url = editingPromo ? `/api/promos/${editingPromo.id}` : '/api/promos';
            const method = editingPromo ? 'PUT' : 'POST';

            const response = await authFetch(url, {
                method,
                body: formData
            });

            if (response.ok) {
                toast.success(editingPromo ? 'Promo diperbarui' : 'Promo ditambahkan');
                setModalVisible(false);
                fetchPromos();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Gagal menyimpan promo');
            }
        } catch (error) {
            console.error('Error submitting promo:', error);
            toast.error('Terjadi kesalahan koneksi');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus promo ini?')) return;
        try {
            const response = await authFetch(`/api/promos/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Promo dihapus');
                fetchPromos();
            } else {
                toast.error('Gagal menghapus');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        }
    };

    const handleToggleStatus = async (promo) => {
        try {
            const newStatus = !promo.is_active;
            const response = await authFetch(`/api/promos/${promo.id}`, {
                method: 'PUT',
                body: { ...promo, is_active: newStatus }
            });

            if (response.ok) {
                fetchPromos();
                toast.success(`Status promo ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
            }
        } catch (error) {
            toast.error('Gagal mengubah status');
        }
    };

    const fetchPromoUsage = async (promo, page = 1) => {
        if (page === 1) {
            setSelectedPromoUsage(promo);
            setUsageData([]);
            setLoadingUsage(true);
            setUsageModalVisible(true);
        }

        try {
            const response = await authFetch(`/api/promos/${promo.id}/usage?page=${page}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                setUsageData(prev => page === 1 ? data.data : [...prev, ...data.data]);
                setUsageHasMore(data.pagination.hasMore);
                setUsagePage(page);
            }
        } catch (error) {
            toast.error('Gagal memuat penggunaan');
        } finally {
            setLoadingUsage(false);
        }
    };

    const filteredPromos = useMemo(() => {
        let result = promos;
        if (activeTab === 'voucher') result = result.filter(p => p.code && !p.is_hero);
        else if (activeTab === 'otomatis') result = result.filter(p => !p.code && !p.is_hero);
        else if (activeTab === 'banner') result = result.filter(p => p.is_hero);
        else result = result.filter(p => !p.is_hero);

        if (searchQuery) {
            result = result.filter(p =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        return result;
    }, [promos, activeTab, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: promos.length,
            active: promos.filter(p => p.is_active).length,
            voucher: promos.filter(p => p.code && !p.is_hero).length,
            banner: promos.filter(p => p.is_hero).length
        };
    }, [promos]);

    const heroPromos = useMemo(() => promos.filter(p => p.is_hero), [promos]);

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-[#f8fafc] dark:bg-slate-950' : 'bg-transparent'}`}>
            {theme === 'default' && <NavigationHeader headerTitle="Manajemen Promo Admin" />}

            <div className="p-5 pt-24 lg:pt-8 pb-32 max-w-[1600px] mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <BreadcrumbNavigation />
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2 flex items-center gap-3">
                            <Sparkles className="text-blue-600" size={32} />
                            Pusat Kendali Promo
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                            Optimalkan penjualan dengan strategi diskon yang tepat
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOpenModal(null, true)}
                            className="px-5 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <ImageIcon size={20} className="text-indigo-500" />
                            Tambah Banner
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleOpenModal()}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Buat Promo Baru
                        </motion.button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Promo', value: stats.total, icon: Ticket, color: 'blue' },
                        { label: 'Promo Aktif', value: stats.active, icon: CheckCircle2, color: 'green' },
                        { label: 'Total Voucher', value: stats.voucher, icon: Hash, color: 'purple' },
                        { label: 'Total Banner', value: stats.banner, icon: ImageIcon, color: 'orange' }
                    ].map((stat, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
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

                {/* Main Content Area */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row gap-6 justify-between items-center">
                        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[1.25rem] w-full lg:w-auto overflow-x-auto no-scrollbar">
                            {[
                                { id: 'semua', label: 'Semua', icon: Ticket },
                                { id: 'voucher', label: 'Voucher', icon: Hash },
                                { id: 'otomatis', label: 'Otomatis', icon: Zap },
                                { id: 'banner', label: 'Banner', icon: ImageIcon }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Cari promo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* List Grid */}
                    <div className="p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                <p className="text-slate-500 font-bold">Memuat Data Promo...</p>
                            </div>
                        ) : filteredPromos.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Tidak Ada Promo</h3>
                                <p className="text-slate-500 mt-1">Coba sesuaikan filter atau cari kata kunci lain</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredPromos.map((promo) => (
                                    <motion.div
                                        layout
                                        key={promo.id}
                                        className="group bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${promo.code ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {promo.code ? <Ticket size={14} /> : <Zap size={14} />}
                                                    {promo.is_hero ? 'Banner' : (promo.code ? 'Voucher' : 'Otomatis')}
                                                </div>
                                                <button
                                                    onClick={() => handleToggleStatus(promo)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${promo.is_active ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                >
                                                    {promo.is_active ? 'Aktif' : 'Off'}
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-5 mb-6">
                                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative" style={{ backgroundColor: `${promo.color || '#3B82F6'}15` }}>
                                                    {promo.image_url ? (
                                                        <img src={getImageUrl(promo.image_url)} alt="Promo" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Icon name={promo.icon || 'Ticket'} size={40} color={promo.color || '#3B82F6'} />
                                                    )}
                                                    {promo.badge_text && (
                                                        <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-[8px] font-black uppercase py-0.5 text-center">
                                                            {promo.badge_text}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-2 truncate group-hover:text-blue-600 transition-colors">
                                                        {promo.title}
                                                    </h4>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xl font-black tracking-tight" style={{ color: promo.color || '#3B82F6' }}>
                                                            {promo.discount_type === 'percentage'
                                                                ? `${promo.discount_value}% OFF`
                                                                : `Rp ${parseFloat(promo.discount_value || 0).toLocaleString('id-ID')}`}
                                                        </span>
                                                        {promo.code && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-mono font-bold text-slate-600 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-600">
                                                                    {promo.code}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-xl">
                                                    <Calendar size={14} className="text-blue-500" />
                                                    <span className="truncate">{promo.expiry ? new Date(promo.expiry).toLocaleDateString('id-ID') : 'Selamanya'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-xl">
                                                    <ShoppingBag size={14} className="text-indigo-500" />
                                                    <span className="truncate">Min. Rp {parseInt(promo.min_purchase || 0).toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleOpenModal(promo)}
                                                    className="flex-1 py-3 text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-2xl transition-all border border-blue-100 flex items-center justify-center gap-2"
                                                >
                                                    <Edit2 size={14} /> EDIT
                                                </button>
                                                {promo.code && (
                                                    <button
                                                        onClick={() => fetchPromoUsage(promo)}
                                                        className="flex-1 py-3 text-xs font-black text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-2xl transition-all border border-purple-100 flex items-center justify-center gap-2"
                                                    >
                                                        <User size={14} /> PENGGUNA
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(promo.id)}
                                                    className="w-12 h-12 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-100"
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

            {/* Main Modal Form */}
            <AnimatePresence>
                {modalVisible && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden my-8"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-1">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                        {editingPromo ? <Edit2 size={24} /> : <Plus size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                            {editingPromo ? 'Edit Promo' : 'Promo Baru'}
                                        </h3>
                                        <p className="text-sm text-slate-500">Konfigurasi penawaran terbaik Anda</p>
                                    </div>
                                </div>
                                <button onClick={() => setModalVisible(false)} className="w-10 h-10 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
                                {/* Type Selector */}
                                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                    {[
                                        { id: 'voucher', label: 'Voucher', icon: Hash },
                                        { id: 'automatic', label: 'Otomatis', icon: Zap },
                                        { id: 'banner', label: 'Banner', icon: ImageIcon }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setPromoMode(t.id)}
                                            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${promoMode === t.id ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <t.icon size={16} />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Media Upload */}
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Media Promo</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative aspect-video rounded-[2rem] border-4 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 overflow-hidden"
                                    >
                                        {form.image_url ? (
                                            <img src={getImageUrl(form.image_url)} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center opacity-40">
                                                <ImageIcon size={48} className="mb-2" />
                                                <span className="text-sm font-black">Unggah Gambar</span>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </div>
                                </div>

                                {/* Main Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-full">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Judul Promo *</label>
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={e => setForm({ ...form, title: e.target.value })}
                                            className="w-full mt-2 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                            placeholder="Contoh: Diskon Akhir Pekan"
                                        />
                                    </div>

                                    {promoMode === 'voucher' && (
                                        <div className="col-span-full">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Kode Voucher *</label>
                                            <input
                                                type="text"
                                                value={form.code}
                                                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                                className="w-full mt-2 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-black tracking-widest uppercase text-blue-600"
                                                placeholder="PROMO10K"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Diskon {form.discount_type === 'percentage' ? '%' : 'Rp'}</label>
                                        <div className="relative mt-2 flex items-center">
                                            <input
                                                type="number"
                                                value={form.discount_value}
                                                onChange={e => setForm({ ...form, discount_value: e.target.value })}
                                                className="w-full pl-6 pr-20 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                            />
                                            <div className="absolute right-2 flex bg-white dark:bg-slate-700 p-1 rounded-xl shadow-sm">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, discount_type: 'fixed' })}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-black ${form.discount_type === 'fixed' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                                                >
                                                    Rp
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, discount_type: 'percentage' })}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-black ${form.discount_type === 'percentage' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                                                >
                                                    %
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Min. Belanja (Rp)</label>
                                        <input
                                            type="number"
                                            value={form.min_purchase}
                                            onChange={e => setForm({ ...form, min_purchase: e.target.value })}
                                            className="w-full mt-2 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Berakhir Pada</label>
                                        <input
                                            type="date"
                                            value={form.expiry}
                                            onChange={e => setForm({ ...form, expiry: e.target.value })}
                                            className="w-full mt-2 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Warna Aksen</label>
                                        <div className="flex items-center gap-3 mt-2">
                                            <input
                                                type="color"
                                                value={form.color}
                                                onChange={e => setForm({ ...form, color: e.target.value })}
                                                className="w-12 h-12 rounded-xl outline-none cursor-pointer overflow-hidden border-2 border-slate-100"
                                            />
                                            <input
                                                type="text"
                                                value={form.color}
                                                onChange={e => setForm({ ...form, color: e.target.value })}
                                                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-mono text-sm uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Toggle Switches */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                        <span className="text-sm font-bold">Aktifkan Sekarang</span>
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                            className="w-5 h-5 accent-blue-600"
                                        />
                                    </div>
                                    {promoMode === 'voucher' && (
                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                            <span className="text-sm font-bold">Sekali Pakai</span>
                                            <input
                                                type="checkbox"
                                                checked={form.is_one_time}
                                                onChange={e => setForm({ ...form, is_one_time: e.target.checked })}
                                                className="w-5 h-5 accent-purple-600"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setModalVisible(false)}
                                        className="flex-1 py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        BATAL
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={20} />
                                        SIMPAN PROMO
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Usage View Modal */}
            <AnimatePresence>
                {usageModalVisible && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Riwayat Penggunaan</h3>
                                        <p className="text-sm text-slate-500 font-medium">{selectedPromoUsage?.code}</p>
                                    </div>
                                </div>
                                <button onClick={() => setUsageModalVisible(false)} className="w-10 h-10 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {loadingUsage && usageData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                                        <p className="text-slate-500 font-bold">Mengambil data penggunaan...</p>
                                    </div>
                                ) : usageData.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <User className="text-slate-400" />
                                        </div>
                                        <h4 className="font-black text-slate-900 dark:text-white">Belum Ada Penggunaan</h4>
                                        <p className="text-sm text-slate-500 mt-1">Kode promo ini belum pernah digunakan oleh pelanggan.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {usageData.map((usage, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={idx}
                                                className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                                        <User size={18} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 dark:text-white text-sm">
                                                            {usage.username || 'Pelanggan'}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-0.5">
                                                            <Clock size={12} />
                                                            {new Date(usage.used_at).toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-emerald-600 font-black text-sm">
                                                        -Rp {parseFloat(usage.discount_amount || 0).toLocaleString('id-ID')}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Potongan</p>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {usageHasMore && (
                                            <button
                                                onClick={() => fetchPromoUsage(selectedPromoUsage, usagePage + 1)}
                                                disabled={loadingUsage}
                                                className="w-full py-4 text-xs font-black text-slate-500 hover:text-blue-600 transition-all"
                                            >
                                                {loadingUsage ? 'MEMUAT...' : 'MUAT LEBIH BANYAK'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPromoManagement;
