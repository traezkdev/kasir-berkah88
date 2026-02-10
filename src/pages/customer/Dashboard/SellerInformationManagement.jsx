
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import BreadcrumbNavigation from '../../../components/ui/BreadcrumbNavigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Info,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    Image as ImageIcon,
    CheckCircle2,
    XCircle,
    X,
    Search,
    Loader2,
    Link as LinkIcon,
    ExternalLink,
    Tag,
    ShoppingBag,
    Megaphone
} from 'lucide-react';
import authFetch from '../../../utils/authFetch';

const API_URL = import.meta.env.VITE_API_URL;

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${API_URL}${url}`;
};

const SellerInformationManagement = () => {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin') || location.pathname === '/information';
    const [informations, setInformations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Link Data
    const [menuItems, setMenuItems] = useState([]);
    const [promos, setPromos] = useState([]);

    const [form, setForm] = useState({
        title: '',
        content: '',
        image_url: '',
        link_type: 'none', // 'none', 'product', 'promo'
        link_value: '',
        is_active: true
    });

    const fileInputRef = useRef(null);

    const fetchInformations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/information?limit=100');
            if (response.ok) {
                const data = await response.json();
                setInformations(data.data || []);
            } else {
                toast.error('Gagal memuat data informasi');
            }
        } catch (error) {
            console.error('Error fetching information:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchLinkData = useCallback(async () => {
        try {
            const [menuRes, promoRes] = await Promise.all([
                authFetch('/api/menu-items'),
                authFetch('/api/promos')
            ]);

            if (menuRes.ok) {
                const menuData = await menuRes.json();
                setMenuItems(menuData.data || []);
            }

            if (promoRes.ok) {
                const promoData = await promoRes.json();
                setPromos(promoData.data || []);
            }
        } catch (error) {
            console.error("Error fetching link data:", error);
        }
    }, []);

    useEffect(() => {
        fetchInformations();
        fetchLinkData();
    }, [fetchInformations, fetchLinkData]);

    const handleOpenModal = (info = null) => {
        if (info) {
            setEditingId(info.id);
            setForm({
                title: info.title,
                content: info.content,
                image_url: info.image_url || '',
                link_type: info.link_type || 'none',
                link_value: info.link_value || '',
                is_active: !!info.is_active
            });
        } else {
            setEditingId(null);
            setForm({
                title: '',
                content: '',
                image_url: '',
                link_type: 'none',
                link_value: '',
                is_active: true
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

        if (!form.title) {
            toast.error('Judul informasi wajib diisi');
            return;
        }
        if (!form.content) {
            toast.error('Konten informasi wajib diisi');
            return;
        }

        try {
            const payload = {
                ...form,
                link_value: form.link_type === 'none' ? null : form.link_value
            };

            let response;
            if (editingId) {
                response = await authFetch(`/api/information/${editingId}`, {
                    method: 'PUT',
                    body: payload
                });
            } else {
                response = await authFetch('/api/information', {
                    method: 'POST',
                    body: payload
                });
            }

            if (response.ok) {
                toast.success(editingId ? 'Informasi berhasil diperbarui' : 'Informasi baru berhasil ditambahkan');
                setModalVisible(false);
                fetchInformations();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Gagal menyimpan informasi');
            }
        } catch (error) {
            console.error('Error submitting information:', error);
            toast.error('Terjadi kesalahan saat menyimpan informasi');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus informasi ini?')) return;

        try {
            const response = await authFetch(`/api/information/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('Informasi berhasil dihapus');
                fetchInformations();
            } else {
                toast.error('Gagal menghapus informasi');
            }
        } catch (error) {
            console.error('Error deleting information:', error);
            toast.error('Terjadi kesalahan saat menghapus informasi');
        }
    };

    const handleToggleStatus = async (info) => {
        try {
            const newStatus = !info.is_active;
            const response = await authFetch(`/api/information/${info.id}`, {
                method: 'PUT',
                body: { ...info, is_active: newStatus }
            });

            if (response.ok) {
                fetchInformations();
                toast.success(`Informasi ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
            } else {
                toast.error('Gagal mengubah status informasi');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Terjadi kesalahan saat mengubah status');
        }
    };

    const handleBroadcast = async (info) => {
        if (!info.is_active) {
            toast.error('Aktifkan informasi terlebih dahulu sebelum mengirim notifikasi');
            return;
        }
        if (!window.confirm(`Kirim notifikasi untuk "${info.title}" kepada semua pelanggan?`)) return;

        try {
            const response = await authFetch(`/api/information/${info.id}/broadcast`, {
                method: 'POST'
            });

            if (response.ok) {
                toast.success('Notifikasi berhasil dikirim');
            } else {
                const data = await response.json();
                toast.error(data.message || 'Gagal mengirim notifikasi');
            }
        } catch (error) {
            console.error('Error broadcasting information:', error);
            toast.error('Terjadi kesalahan saat mengirim notifikasi');
        }
    };

    const filteredInformations = useMemo(() => {
        return informations.filter(info =>
            info.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            info.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [informations, searchQuery]);

    const getLinkDisplay = (type, value) => {
        if (type === 'none') return null;
        if (type === 'product') {
            const product = menuItems.find(item => item.id.toString() === value?.toString());
            return product ? `Produk: ${product.name}` : 'Produk (ID tidak ditemukan)';
        }
        if (type === 'promo') {
            return 'Halaman Promo';
        }
        return value;
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            {isAdmin ? (
                <div className="mb-6">
                    <BreadcrumbNavigation />
                    <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Pusat Informasi</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">Kelola berita, pengumuman, dan artikel untuk pelanggan</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleOpenModal()}
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={18} />
                                <span className="hidden md:inline">Buat Informasi Baru</span>
                                <span className="md:hidden">Baru</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Pusat Informasi</h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">Kelola berita, pengumuman, dan artikel untuk pelanggan</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            <span className="hidden md:inline">Buat Informasi Baru</span>
                            <span className="md:hidden">Baru</span>
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Daftar Informasi</h3>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari informasi..."
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
                ) : filteredInformations.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <Info className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">Belum ada informasi</h3>
                        <p className="text-sm text-gray-500 mb-6">Bagikan kabar terbaru kepada pelanggan Anda</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Buat Informasi Sekarang
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredInformations.map((info) => (
                            <div key={info.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                                {/* Image Area */}
                                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                    {info.image_url ? (
                                        <img
                                            src={getImageUrl(info.image_url)}
                                            alt={info.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon size={40} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <div
                                            className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-white/90 backdrop-blur-sm shadow-sm ${info.is_active ? 'text-green-600' : 'text-gray-500'}`}
                                            onClick={() => handleToggleStatus(info)}
                                        >
                                            {info.is_active ? 'Aktif' : 'Non-Aktif'}
                                            {info.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                        <Calendar size={12} />
                                        <span>{new Date(info.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 text-base leading-tight mb-2 line-clamp-2">{info.title}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1 leading-relaxed">{info.content}</p>

                                    {info.link_type !== 'none' && (
                                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg mb-4 w-fit">
                                            <ExternalLink size={12} />
                                            <span>
                                                {info.link_type === 'product' && 'Link: Produk'}
                                                {info.link_type === 'promo' && 'Link: Promo'}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-50 mt-auto">
                                        <button
                                            onClick={() => handleOpenModal(info)}
                                            className="flex-1 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleBroadcast(info)}
                                            className="flex-1 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            title="Kirim Notifikasi ke Pelanggan"
                                        >
                                            <Megaphone size={14} /> Broadcast
                                        </button>
                                        <button
                                            onClick={() => handleDelete(info.id)}
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
                                    {editingId ? 'Edit Informasi' : 'Buat Informasi Baru'}
                                </h3>
                                <button onClick={() => setModalVisible(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="Judul informasi..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gambar</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all overflow-hidden relative"
                                    >
                                        {form.image_url ? (
                                            <img src={getImageUrl(form.image_url)} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
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
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Konten *</label>
                                    <textarea
                                        value={form.content}
                                        onChange={e => setForm({ ...form, content: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium min-h-[120px]"
                                        placeholder="Tulis detail informasi di sini..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipe Link</label>
                                        <select
                                            value={form.link_type}
                                            onChange={e => setForm({ ...form, link_type: e.target.value, link_value: '' })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium appearance-none"
                                        >
                                            <option value="none">Tidak Ada</option>
                                            <option value="product">Produk</option>
                                            <option value="promo">Halaman Promo</option>
                                        </select>
                                    </div>

                                    {form.link_type === 'product' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Produk</label>
                                            <select
                                                value={form.link_value}
                                                onChange={e => setForm({ ...form, link_value: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium appearance-none"
                                            >
                                                <option value="">Pilih Produk...</option>
                                                {menuItems.map(item => (
                                                    <option key={item.id} value={item.id}>{item.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={form.is_active}
                                        onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                        Status Aktif (Tampilkan ke pelanggan)
                                    </label>
                                </div>

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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SellerInformationManagement;
