import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { jwtDecode } from 'jwt-decode';

const SellerBanners = () => {
    const navigate = useNavigate();
    const [banners, setBanners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userRole, setUserRole] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        color_class: 'bg-indigo-600',
        icon_name: 'Percent',
        link_url: '',
        is_active: true
    });
    const [imageFile, setImageFile] = useState(null);

    const colors = [
        { name: 'Indigo', class: 'bg-indigo-600' },
        { name: 'Blue', class: 'bg-blue-600' },
        { name: 'Sky', class: 'bg-sky-500' },
        { name: 'Emerald', class: 'bg-emerald-600' },
        { name: 'Amber', class: 'bg-amber-500' },
        { name: 'Orange', class: 'bg-orange-500' },
        { name: 'Rose', class: 'bg-rose-500' },
        { name: 'Purple', class: 'bg-purple-600' },
    ];

    const icons = ['Percent', 'Utensils', 'Star', 'Gift', 'Tag', 'Coffee', 'Zap', 'ShoppingBag'];

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role);
            } catch (e) {
                console.error(e);
            }
        }

        fetchBanners();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchBanners = async () => {
        setIsLoading(true);
        try {
            const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/banners/all`);
            const data = await res.json();
            if (data.data) setBanners(data.data);
        } catch (error) {
            toast.error("Gagal mengambil data banner");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title || '',
                subtitle: banner.subtitle || '',
                color_class: banner.color_class || 'bg-indigo-600',
                icon_name: banner.icon_name || 'Percent',
                link_url: banner.link_url || '',
                is_active: banner.is_active === 1 || banner.is_active === true
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                subtitle: '',
                color_class: 'bg-indigo-600',
                icon_name: 'Percent',
                link_url: '',
                is_active: true
            });
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const data = new FormData();
        if (imageFile) data.append('image', imageFile);
        data.append('data', JSON.stringify(formData));

        try {
            const url = editingBanner
                ? `${import.meta.env.VITE_API_URL}/api/banners/${editingBanner.id}`
                : `${import.meta.env.VITE_API_URL}/api/banners`;
            const method = editingBanner ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                body: data
            });

            if (res.ok) {
                toast.success(editingBanner ? 'Banner diperbarui' : 'Banner ditambahkan');
                setIsModalOpen(false);
                fetchBanners();
            } else {
                throw new Error('Gagal menyimpan');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus banner ini?')) return;
        try {
            await authFetch(`${import.meta.env.VITE_API_URL}/api/banners/${id}`, { method: 'DELETE' });
            toast.success('Banner dihapus');
            fetchBanners();
        } catch (error) {
            toast.error("Gagal menghapus");
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="pb-24 -mx-4 -mt-4 lg:-mx-10 lg:-mt-10 overflow-x-hidden animate-fade-in">
            {/* Top Bar Floating */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'} lg:hidden`}>
                <div className="px-6 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className={`p-2 rounded-xl ${scrolled ? 'bg-gray-100 text-gray-800' : 'bg-white/20 text-white'}`}>
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <span className={`font-black tracking-tight ${scrolled ? 'text-gray-800' : 'text-white text-lg'}`}>Kelola Banner</span>
                    <div className="flex gap-2">
                        {userRole === 'admin' && (
                            <button
                                onClick={() => navigate('/main-dashboard')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${scrolled ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-white/20 text-white border border-white/30'}`}
                            >
                                <Icon name="ArrowLeft" size={14} />
                                Admin
                            </button>
                        )}
                        <button onClick={() => handleOpenModal()} className={`p-2 rounded-xl ${scrolled ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>
                            <Icon name="Plus" size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Header Section */}
            <header className="bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-500 pt-16 pb-10 px-6 lg:pt-10 rounded-b-[2.5rem] shadow-xl relative z-10">
                <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => navigate(-1)} className="hidden lg:flex p-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-all mr-2">
                                <Icon name="ChevronLeft" size={20} />
                            </button>
                            <span className="text-blue-100 font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">Promotion Tools</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Katalog Banner</h1>
                        <p className="text-blue-100/80 font-medium mt-1">Atur tampilan promosi di aplikasi pelanggan.</p>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="hidden lg:flex bg-white text-indigo-700 px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all items-center gap-2"
                    >
                        <Icon name="Plus" size={20} />
                        Buat Banner Baru
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="px-6 mt-10 space-y-6">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-50 rounded-[2.5rem] animate-pulse" />)}
                    </div>
                ) : banners.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {banners.map((banner) => (
                            <div key={banner.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                                {/* Preview area */}
                                <div className={`${banner.color_class} p-6 text-white h-44 flex flex-col justify-between relative overflow-hidden`}>
                                    <div className="z-10 relative">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-black text-2xl tracking-tight leading-tight mb-1">{banner.title}</h3>
                                                <p className="text-sm font-medium opacity-80">{banner.subtitle}</p>
                                            </div>
                                            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                                                <Icon name={banner.icon_name} size={24} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/30 backdrop-blur-md ${banner.is_active ? 'bg-white/20' : 'bg-red-500/40 text-white'}`}>
                                            {banner.is_active ? 'Status: Aktif' : 'Status: Non-Aktif'}
                                        </span>
                                        <div className="bg-white text-gray-800 p-2 rounded-full shadow-lg">
                                            <Icon name="ArrowRight" size={16} />
                                        </div>
                                    </div>
                                    {/* Abstract Icon Backdrop */}
                                    <Icon name={banner.icon_name} className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 rotate-12" strokeWidth={1} />
                                </div>

                                {/* Action bar */}
                                <div className="p-4 flex gap-3">
                                    <button
                                        onClick={() => handleOpenModal(banner)}
                                        className="flex-1 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon name="Edit" size={18} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                                    >
                                        <Icon name="Trash2" size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center animate-slide-up">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-blue-200">
                            <Icon name="Image" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-2">Belum ada Banner</h3>
                        <p className="text-gray-400 font-medium mb-8 max-w-xs mx-auto text-sm">Buat banner promosi pertamamu untuk menarik pelanggan di halaman utama aplikasi.</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
                        >
                            Mulai Sekarang
                        </button>
                    </div>
                )}
            </main>

            {/* Modal - Native style Sheet / Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 lg:p-4">
                    <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] lg:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-slide-up lg:animate-scale-up max-h-[95vh]">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{editingBanner ? 'Edit' : 'Buat'} Banner</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Konfigurasi Tampilan</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all text-gray-500">
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-8 py-6 overflow-y-auto space-y-8 flex-1 bg-white">
                            {/* Live Preview Section */}
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Live Preview</span>
                                    <div className="flex items-center gap-1.5 text-blue-500">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase">Real-time</span>
                                    </div>
                                </div>
                                <div className={`${formData.color_class} p-6 rounded-[2rem] text-white h-40 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all duration-500`}>
                                    <div className="z-10 relative">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-black text-2xl tracking-tight mb-1">{formData.title || 'Judul Banner'}</h3>
                                                <p className="text-sm font-medium opacity-80">{formData.subtitle || 'Sub-titel banner Anda'}</p>
                                            </div>
                                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                                <Icon name={formData.icon_name} size={24} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                                            <div className="w-8 h-1 bg-white/40 rounded-full" />
                                        </div>
                                        <div className="bg-white text-gray-800 p-2 rounded-full shadow-lg">
                                            <Icon name="ArrowRight" size={16} />
                                        </div>
                                    </div>
                                    <Icon name={formData.icon_name} className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 rotate-12" strokeWidth={1} />
                                </div>
                            </div>

                            {/* Form Section */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Judul Konten</label>
                                        <input
                                            type="text" required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold transition-all"
                                            placeholder="Contoh: Diskon Kopi 50%"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Deskripsi / Sub-titel</label>
                                        <input
                                            type="text"
                                            value={formData.subtitle}
                                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold transition-all"
                                            placeholder="Contoh: Berlaku s/d jam 10 pagi"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Palet Warna Utama</label>
                                    <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
                                        {colors.map(color => (
                                            <button
                                                key={color.class}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color_class: color.class })}
                                                className={`h-10 rounded-xl transition-all shadow-sm ${color.class} ${formData.color_class === color.class ? 'ring-4 ring-blue-500 ring-offset-2 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Ikon Ilustrasi</label>
                                    <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
                                        {icons.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon_name: icon })}
                                                className={`h-12 rounded-xl flex items-center justify-center transition-all border-2 ${formData.icon_name === icon ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                            >
                                                <Icon name={icon} size={22} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800">Status Aktifkan</span>
                                        <span className="text-[10px] text-gray-400 font-medium">Tampilkan langsung ke pelanggan</span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            id="banner-status-toggle"
                                            type="checkbox"
                                            checked={!!formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <label
                                            htmlFor="banner-status-toggle"
                                            className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 transition-colors cursor-pointer"
                                        ></label>
                                    </div>
                                </div>

                                {/* Modal Footer - Moved inside form or handled via form id */}
                                <div className="pt-6 mt-6 border-t border-gray-100 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 px-6 rounded-2xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-100 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-[2] py-4 px-6 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? 'Memproses...' : (editingBanner ? 'Simpan Update' : 'Terbitkan Sekarang')}
                                        {!isSaving && <Icon name="Check" size={20} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerBanners;

