
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
    Image,
    Percent,
    AlertCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import authFetch from '../../../utils/authFetch';
import Icon from '../../../components/AppIcon';

const API_URL = import.meta.env.VITE_API_URL;

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${API_URL}${url}`;
};

const SellerPromoManagement = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin') || location.pathname === '/promos';
    const isSellerPath = location.pathname.startsWith('/seller');
    const [promos, setPromos] = useState([]);
    const [heroPromos, setHeroPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
        color: '#059669',
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
                setPromos(data.data);
                setHeroPromos(data.data.filter(p => p.is_hero));
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
                color: promo.color || '#059669',
                expiry: promo.expiry || '',
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
                color: '#059669',
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
            setForm(prev => ({ ...prev, image_url: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title && promoMode !== 'banner') {
            toast.error('Judul promo wajib diisi');
            return;
        }

        if (promoMode === 'voucher' && !form.code) {
            toast.error('Kode promo wajib diisi untuk jenis Voucher');
            return;
        }

        try {
            const cleanedForm = {
                ...form,
                is_hero: promoMode === 'banner',
                code: promoMode === 'voucher' ? form.code : '',
                min_purchase: form.min_purchase ? form.min_purchase.toString().replace(/[^\d.]/g, '') : 0,
                discount_value: form.discount_value ? form.discount_value.toString().replace(/[^\d.]/g, '') : 0,
                icon: promoMode === 'banner' ? null : form.icon,
                is_one_time: form.is_one_time ? 1 : 0
            };

            let response;
            if (editingPromo) {
                response = await authFetch(`/api/promos/${editingPromo.id}`, {
                    method: 'PUT',
                    body: cleanedForm
                });
            } else {
                response = await authFetch('/api/promos', {
                    method: 'POST',
                    body: cleanedForm
                });
            }

            if (response.ok) {
                toast.success(editingPromo ? 'Promo berhasil diperbarui' : 'Promo baru berhasil ditambahkan');
                setModalVisible(false);
                fetchPromos();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Gagal menyimpan promo');
            }
        } catch (error) {
            console.error('Error submitting promo:', error);
            toast.error('Terjadi kesalahan saat menyimpan promo');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus promo ini?')) return;

        try {
            const response = await authFetch(`/api/promos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('Promo berhasil dihapus');
                fetchPromos();
            } else {
                toast.error('Gagal menghapus promo');
            }
        } catch (error) {
            console.error('Error deleting promo:', error);
            toast.error('Terjadi kesalahan saat menghapus promo');
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
            } else {
                toast.error('Gagal mengubah status promo');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Terjadi kesalahan saat mengubah status');
        }
    };

    const fetchPromoUsage = async (promo, page = 1) => {
        if (page === 1) {
            setSelectedPromoUsage(promo);
            setUsageData([]);
            setLoadingUsage(true);
            setUsagePage(1);
            setUsageHasMore(true);
            setUsageModalVisible(true);
        }

        try {
            const response = await authFetch(`/api/promos/${promo.id}/usage?page=${page}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                const newData = data.data;
                const pagination = data.pagination;

                setUsageData(prev => page === 1 ? newData : [...prev, ...newData]);
                setUsageHasMore(pagination.hasMore);
                setUsagePage(page);
            } else {
                toast.error('Gagal memuat data penggunaan voucher');
            }
        } catch (error) {
            console.error('Error fetching usage:', error);
            toast.error('Terjadi kesalahan saat memuat penggunaan');
        } finally {
            setLoadingUsage(false);
        }
    };

    const filteredPromos = useMemo(() => {
        return promos.filter(p => !p.is_hero && (
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
    }, [promos, searchQuery]);

    const stats = useMemo(() => {
        return {
            active: promos.filter(p => p.is_active).length,
            voucher: promos.filter(p => p.is_active && p.code).length,
            auto: promos.filter(p => p.is_active && !p.code && !p.is_hero).length
        };
    }, [promos]);

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50 dark:bg-slate-950' : 'bg-transparent'}`}>
            {theme === 'default' && !isSellerPath && (
                <NavigationHeader headerTitle="Manajemen Promo" />
            )}

            {/* Mobile Header for Seller Path */}
            {theme === 'default' && isSellerPath && (
                <div className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-[#118eea] text-white px-5 py-4 flex items-center gap-3 shadow-md">
                    <button onClick={() => window.history.back()} className="p-1 hover:bg-white/10 rounded-full">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold">Manajemen Promo</h1>
                </div>
            )}

            <div className={`space-y-6 ${theme === 'default' ? 'p-5 pt-24 lg:pt-8 pb-32' : 'space-y-6 pb-20'}`}>
                {/* Header */}
                {isAdmin ? (
                    <div className="mb-6 lg:block hidden">
                        <BreadcrumbNavigation />
                        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Promo</h1>
                                <p className="text-sm text-gray-500 font-medium mt-1">Kelola Voucher, Diskon Otomatis & Banner Promosi</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenModal()}
                                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    <span className="hidden md:inline">Buat Promo Baru</span>
                                    <span className="md:hidden">Baru</span>
                                </button>
                                <button
                                    onClick={() => handleOpenModal(null, true)}
                                    className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Sparkles size={18} />
                                    <span className="hidden md:inline">Pasang Banner</span>
                                    <span className="md:hidden">Banner</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Promo</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">Kelola Voucher, Diskon Otomatis & Banner Promosi</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleOpenModal()}
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={18} />
                                <span className="hidden md:inline">Buat Promo Baru</span>
                                <span className="md:hidden">Baru</span>
                            </button>
                            <button
                                onClick={() => handleOpenModal(null, true)}
                                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Sparkles size={18} />
                                <span className="hidden md:inline">Pasang Banner</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            <Ticket size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900 leading-none">{stats.active}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Total Aktif</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <Hash size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900 leading-none">{stats.voucher}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Voucher</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900 leading-none">{stats.auto}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Otomatis</p>
                        </div>
                    </div>
                </div>

                {/* Banner Section */}
                {heroPromos.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Banner & Highlight</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-2">
                            {heroPromos.map((promo) => (
                                <div
                                    key={promo.id}
                                    className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-sm group cursor-pointer"
                                    onClick={() => handleOpenModal(promo)}
                                >
                                    {promo.image_url ? (
                                        <img
                                            src={getImageUrl(promo.image_url)}
                                            alt={promo.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                            <Sparkles size={48} className="text-white/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex flex-col justify-end">
                                        <h4 className="text-white font-bold truncate">{promo.title}</h4>
                                        <p className="text-white/80 text-xs line-clamp-1">{promo.description}</p>
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors shadow-sm"
                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(promo); }}
                                            title="Edit Banner"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(promo.id); }}
                                            title="Hapus Banner"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div
                                className="aspect-video flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer gap-2"
                                onClick={() => handleOpenModal(null, true)}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Plus size={20} />
                                </div>
                                <span className="text-xs font-bold text-gray-400">Tambah</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Promos List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Daftar Promo</h3>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Cari promo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : filteredPromos.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                            <Ticket className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">Belum ada promo</h3>
                            <p className="text-sm text-gray-500 mb-6">Buat promo pertama Anda untuk menarik pelanggan</p>
                            <button
                                onClick={() => handleOpenModal()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                Buat Promo Sekarang
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredPromos.map((promo) => (
                                <div key={promo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${promo.code ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                {promo.code ? <Ticket size={12} /> : <Zap size={12} />}
                                                {promo.code ? 'Voucher' : 'Otomatis'}
                                            </div>
                                            <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer ${promo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`} onClick={() => handleToggleStatus(promo)}>
                                                {promo.is_active ? 'Aktif' : 'Non-Aktif'}
                                                {promo.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${promo.color}15`, color: promo.color }}>
                                                <Icon name={promo.icon || 'Ticket'} size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 leading-tight mb-1">{promo.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black" style={{ color: promo.color }}>
                                                        {promo.discount_type === 'percentage'
                                                            ? `${promo.discount_value}% OFF`
                                                            : `Rp ${parseFloat(promo.discount_value).toLocaleString('id-ID')}`}
                                                    </span>
                                                    {promo.code && (
                                                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500 border border-gray-200">
                                                            {promo.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {promo.expiry && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                                    <Calendar size={12} />
                                                    <span>{new Date(promo.expiry).toLocaleDateString('id-ID')}</span>
                                                </div>
                                            )}
                                            {parseInt(promo.min_purchase) > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                                    <ShoppingBag size={12} />
                                                    <span>Min. Rp {parseInt(promo.min_purchase).toLocaleString('id-ID')}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                                            <button
                                                onClick={() => handleOpenModal(promo)}
                                                className="flex-1 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            {promo.code && (
                                                <button
                                                    onClick={() => fetchPromoUsage(promo)}
                                                    className="flex-1 py-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <User size={14} /> Pengguna
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(promo.id)}
                                                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Edit/Create Modal */}
                <AnimatePresence>
                    {modalVisible && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8"
                            >
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                                    <h3 className="text-lg font-black text-gray-900">
                                        {editingPromo ? 'Edit Promo' : 'Buat Promo Baru'}
                                    </h3>
                                    <button onClick={() => setModalVisible(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X size={20} className="text-gray-400" />
                                    </button>
                                </div>

                                <div className="p-6 max-h-[80vh] overflow-y-auto">
                                    {/* Type Selector */}
                                    <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                                        {['voucher', 'automatic', 'banner'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setPromoMode(type)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${promoMode === type
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Promo *</label>
                                            <input
                                                type="text"
                                                value={form.title}
                                                onChange={e => setForm({ ...form, title: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                placeholder="Contoh: Diskon Kemerdekaan"
                                            />
                                        </div>

                                        {promoMode === 'banner' && (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gambar Banner (Rasio 16:9)</label>
                                                <div className="relative">
                                                    <div
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all overflow-hidden relative"
                                                    >
                                                        {form.image_url ? (
                                                            <>
                                                                <img src={getImageUrl(form.image_url)} alt="Preview" className="w-full h-full object-cover" />
                                                                {/* Edit Icon - Bottom Right */}
                                                                <div className="absolute bottom-3 right-3 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                                                                    <Edit2 size={18} className="text-white" />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Image className="w-8 h-8 text-gray-400 mb-2" />
                                                                <span className="text-sm font-medium text-gray-500">Klik untuk upload gambar</span>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                        />
                                                    </div>

                                                    {/* Delete Button - Only show when image exists */}
                                                    {form.image_url && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm('Apakah Anda yakin ingin menghapus gambar banner ini?')) {
                                                                    setForm(prev => ({ ...prev, image_url: '' }));
                                                                }
                                                            }}
                                                            className="absolute top-3 right-3 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors z-10"
                                                            title="Hapus Gambar"
                                                        >
                                                            <Trash2 size={18} className="text-white" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deskripsi</label>
                                            <textarea
                                                value={form.description}
                                                onChange={e => setForm({ ...form, description: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium min-h-[80px]"
                                                placeholder="Jelaskan detail promo..."
                                            />
                                        </div>

                                        {promoMode !== 'banner' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nilai Diskon</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={form.discount_value}
                                                                onChange={e => setForm({ ...form, discount_value: e.target.value })}
                                                                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                                                                placeholder="0"
                                                            />
                                                            <div className="absolute right-2 top-2 p-1 bg-gray-100 rounded-lg flex text-xs font-bold">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setForm({ ...form, discount_type: 'percentage' })}
                                                                    className={`px-2 py-1 rounded ${form.discount_type === 'percentage' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                                                                >
                                                                    %
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setForm({ ...form, discount_type: 'fixed' })}
                                                                    className={`px-2 py-1 rounded ${form.discount_type === 'fixed' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                                                                >
                                                                    Rp
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min. Belanja</label>
                                                        <input
                                                            type="number"
                                                            value={form.min_purchase}
                                                            onChange={e => setForm({ ...form, min_purchase: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>

                                                {promoMode === 'voucher' && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kode Voucher *</label>
                                                        <div className="relative">
                                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                            <input
                                                                type="text"
                                                                value={form.code}
                                                                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase tracking-wider"
                                                                placeholder="DISKON10"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Icon & Color Selector (Simplified) */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ikon & Warna</label>
                                                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                                                        {['Ticket', 'Zap', 'Gift', 'Percent', 'Wallet', 'Tags', 'Truck', 'ShoppingBag'].map(icon => (
                                                            <button
                                                                key={icon}
                                                                type="button"
                                                                onClick={() => setForm({ ...form, icon })}
                                                                className={`p-2 rounded-lg border ${form.icon === icon ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-100 text-gray-400'}`}
                                                            >
                                                                <Icon name={icon} size={20} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {['#059669', '#DC2626', '#2563EB', '#D97706', '#7C3AED', '#DB2777'].map(color => (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                onClick={() => setForm({ ...form, color })}
                                                                className={`w-8 h-8 rounded-full border-2 ${form.color === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {promoMode !== 'banner' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kadaluarsa</label>
                                                    <input
                                                        type="date"
                                                        value={form.expiry}
                                                        onChange={e => setForm({ ...form, expiry: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id="is_one_time"
                                                        checked={form.is_one_time}
                                                        onChange={e => setForm({ ...form, is_one_time: e.target.checked })}
                                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor="is_one_time" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                                        Hanya 1x Pakai
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setModalVisible(false)}
                                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                                            >
                                                Simpan
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Usage Modal */}
                <AnimatePresence>
                    {usageModalVisible && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8"
                            >
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">Riwayat Penggunaan</h3>
                                        <p className="text-xs text-gray-500 font-bold">{selectedPromoUsage?.title}</p>
                                    </div>
                                    <button onClick={() => setUsageModalVisible(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X size={20} className="text-gray-400" />
                                    </button>
                                </div>

                                <div className="p-6 max-h-[60vh] overflow-y-auto">
                                    {loadingUsage ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="animate-spin text-blue-600" />
                                        </div>
                                    ) : usageData.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <User size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Belum ada penggunaan</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {usageData.map((usage, idx) => {
                                                // Prioritas: customer_name dari order, fallback ke user_account jika ada
                                                const displayName = usage.customer_name || usage.user_account || 'Pelanggan';
                                                const discountAmount = usage.promo_discount || 0;
                                                const totalAmount = usage.total || 0;
                                                const usedDate = usage.created_at;
                                                const orderStatus = usage.status || 'pending';

                                                // Status badge configuration
                                                const statusConfig = {
                                                    pending: { label: 'Menunggu', bg: 'bg-yellow-100', text: 'text-yellow-700' },
                                                    accepted: { label: 'Diterima', bg: 'bg-blue-100', text: 'text-blue-700' },
                                                    preparing: { label: 'Diproses', bg: 'bg-purple-100', text: 'text-purple-700' },
                                                    ready: { label: 'Siap', bg: 'bg-indigo-100', text: 'text-indigo-700' },
                                                    completed: { label: 'Selesai', bg: 'bg-green-100', text: 'text-green-700' },
                                                    cancelled: { label: 'Dibatalkan', bg: 'bg-red-100', text: 'text-red-700' },
                                                    rejected: { label: 'Ditolak', bg: 'bg-gray-100', text: 'text-gray-700' }
                                                };

                                                const currentStatus = statusConfig[orderStatus] || statusConfig.pending;

                                                return (
                                                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                                        {/* Header: User Info & Status */}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                                                                    <User size={18} className="text-sky-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-800">{displayName}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {usedDate ? new Date(usedDate).toLocaleDateString('id-ID', {
                                                                            day: 'numeric',
                                                                            month: 'long',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        }).replace(' pukul ', ' pukul ') : '-'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={`px-3 py-1 rounded-lg ${currentStatus.bg}`}>
                                                                <p className={`text-xs font-bold uppercase ${currentStatus.text}`}>
                                                                    {currentStatus.label}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Divider */}
                                                        <div className="border-t border-gray-100 my-3"></div>

                                                        {/* Details: Total & Discount */}
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-gray-500">Total Belanja</p>
                                                                <p className="text-sm font-bold text-gray-900">
                                                                    Rp {parseInt(totalAmount).toLocaleString('id-ID')}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1 text-right">
                                                                <p className="text-xs text-gray-500">Potongan</p>
                                                                <p className="text-sm font-bold text-red-600">
                                                                    -Rp {parseInt(discountAmount).toLocaleString('id-ID')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {usageHasMore && !loadingUsage && (
                                        <button
                                            onClick={() => fetchPromoUsage(selectedPromoUsage, usagePage + 1)}
                                            className="w-full py-2 mt-4 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            Muat Lebih Banyak
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SellerPromoManagement;
