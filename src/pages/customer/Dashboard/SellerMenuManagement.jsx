import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';

const SellerMenuManagement = () => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        category: 'Lainnya',
        hpp: '',
        discount: 0,
        is_featured: false,
        options: [],
        description: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        fetchData();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [menuRes, catRes] = await Promise.all([
                authFetch(`${import.meta.env.VITE_API_URL}/api/menu-items/all`),
                authFetch(`${import.meta.env.VITE_API_URL}/api/categories`)
            ]);

            const menuData = await menuRes.json();
            const catData = await catRes.json();

            if (menuData.data) setMenuItems(menuData.data);
            if (catData.data) setCategories(catData.data);
        } catch (error) {
            toast.error("Gagal mengambil data menu");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                price: item.price,
                stock: item.stock,
                category: item.category,
                hpp: item.hpp || '',
                discount: item.discount || 0,
                is_featured: item.is_featured === 1 || item.is_featured === true,
                options: item.options || [],
                description: item.description || ''
            });
            setImagePreview(item.image_url ? `${import.meta.env.VITE_API_URL}${item.image_url}` : null);
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                price: '',
                stock: '',
                category: categories[0]?.name || 'Lainnya',
                hpp: '',
                discount: 0,
                is_featured: false,
                options: [],
                description: ''
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const data = new FormData();
        if (imageFile) data.append('image', imageFile);

        const dataToSubmit = {
            ...formData,
            id: editingItem ? editingItem.id : `M-${Date.now()}`
        };
        data.append('data', JSON.stringify(dataToSubmit));

        try {
            const url = editingItem
                ? `${import.meta.env.VITE_API_URL}/api/menu-items/${editingItem.id}`
                : `${import.meta.env.VITE_API_URL}/api/menu-items`;
            const method = editingItem ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                body: data
            });

            if (res.ok) {
                toast.success(editingItem ? 'Menu diperbarui' : 'Menu ditambahkan');
                setIsModalOpen(false);
                fetchData();
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Gagal menyimpan');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleOptionChange = (index, e) => {
        const { name, value } = e.target;
        const newOptions = [...formData.options];
        newOptions[index][name] = value;
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const addOption = () => {
        setFormData(prev => ({
            ...prev,
            options: [...prev.options, { name: '', price_adjustment: '' }],
        }));
    };

    const removeOption = (index) => {
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus menu ini?')) return;
        try {
            await authFetch(`${import.meta.env.VITE_API_URL}/api/menu-items/${id}`, { method: 'DELETE' });
            toast.success('Menu dihapus');
            fetchData();
        } catch (error) {
            toast.error("Gagal menghapus");
        }
    };

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="pb-24 -mx-4 -mt-4 lg:-mx-10 lg:-mt-10 overflow-x-hidden animate-fade-in" style={{ maxWidth: '100vw' }}>
            {/* Top Bar Floating */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-hidden ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'} lg:hidden`} style={{ maxWidth: '100vw' }}>
                <div className="px-6 flex items-center justify-between max-w-full">
                    <button onClick={() => navigate(-1)} className={`p-2 rounded-xl flex-shrink-0 ${scrolled ? 'bg-gray-100 text-gray-800' : 'bg-white/20 text-white'}`}>
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <span className={`font-black tracking-tight flex-1 text-center ${scrolled ? 'text-gray-800' : 'text-white text-lg'}`}>Kelola Katalog</span>
                    <button onClick={() => handleOpenModal()} className={`p-2 rounded-xl flex-shrink-0 ${scrolled ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>
                        <Icon name="Plus" size={20} />
                    </button>
                </div>
            </div>

            {/* Header Section */}
            <header className="bg-gradient-to-br from-indigo-800 via-blue-700 to-indigo-600 pt-16 pb-10 px-6 lg:pt-10 rounded-b-[2.5rem] shadow-xl relative z-10">
                <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => navigate(-1)} className="hidden lg:flex p-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-all mr-2">
                                <Icon name="ChevronLeft" size={20} />
                            </button>
                            <span className="text-blue-100 font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">Inventory System</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Katalog Menu</h1>
                        <p className="text-blue-100/80 font-medium mt-1">Kelola stok, harga, dan ketersediaan menu.</p>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="hidden lg:flex bg-white text-blue-700 px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all items-center gap-2"
                    >
                        <Icon name="Plus" size={20} />
                        Tambah Menu Baru
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="px-6 mt-8 space-y-6">
                {/* Search and Filters */}
                <section className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm p-2 flex items-center gap-3 border border-gray-50 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <div className="p-2 text-gray-400">
                            <Icon name="Search" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari menu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['Semua', ...categories.map(c => c.name)].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Grid List */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-44 bg-gray-50 rounded-[2rem] animate-pulse" />)}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="bg-white rounded-[2rem] p-4 border border-gray-50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative overflow-hidden">
                                {item.is_featured === 1 && (
                                    <div className="absolute top-4 right-4 z-10 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                                        Featured
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-50">
                                        {item.image_url ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}${item.image_url}`}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                <Icon name="Image" size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1 overflow-hidden">
                                        <div>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block truncate">{item.category}</span>
                                            <h3 className="font-black text-gray-800 text-lg leading-tight truncate">{item.name}</h3>
                                            <p className="text-blue-600 font-black text-xl mt-1 tracking-tight truncate">{formatCurrency(item.price)}</p>
                                            {item.description && (
                                                <p className="text-[10px] text-gray-400 font-medium mt-1 line-clamp-2 leading-tight">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className={`w-2 h-2 rounded-full ${item.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-[11px] font-bold text-gray-500">Stok: <span className={item.stock > 0 ? 'text-gray-800' : 'text-red-500'}>{item.stock}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className="flex-1 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon name="Settings" size={18} />
                                        <span className="hidden sm:inline">Atur Menu</span>
                                        <span className="sm:hidden">Atur</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                                    >
                                        <Icon name="Trash2" size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-blue-200">
                            <Icon name="Pizza" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-gray-800">Menu tidak ditemukan</h3>
                        <p className="text-gray-400 font-medium max-w-xs mx-auto text-sm mt-1 px-4">Coba cari dengan kata kunci lain atau tambahkan menu baru.</p>
                    </div>
                )}
            </main>

            {/* Bottom Floating Action Button (Mobile) */}
            <div className="fixed bottom-24 right-6 lg:hidden z-40">
                <button
                    onClick={() => handleOpenModal()}
                    className="w-16 h-16 bg-blue-600 rounded-2xl text-white shadow-2xl shadow-blue-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                >
                    <Icon name="Plus" size={32} />
                </button>
            </div>

            {/* Modal - Native style Sheet / Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 lg:p-4">
                    <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] lg:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-slide-up lg:animate-scale-up max-h-[92vh]">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{editingItem ? 'Edit' : 'Tambah'} Menu</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Informasi Produk</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all text-gray-500">
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-8 py-6 overflow-y-auto space-y-8 flex-1 bg-white">
                            {/* Image Upload Area */}
                            <div className="flex flex-col items-center">
                                <label className="relative cursor-pointer group">
                                    <div className={`w-32 h-32 rounded-3xl overflow-hidden shadow-xl border-4 ${imagePreview ? 'border-blue-100' : 'border-dashed border-gray-200'} flex items-center justify-center bg-gray-50`}>
                                        {imagePreview ? (
                                            <img src={imagePreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-300 italic">
                                                <Icon name="Camera" size={32} />
                                                <span className="text-[10px] font-bold mt-1">FOTO MENU</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl text-white shadow-lg group-hover:scale-110 transition-all">
                                        <Icon name="Plus" size={20} />
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Nama Menu</label>
                                        <input
                                            type="text" required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold transition-all"
                                            placeholder="Kopi Susu Gula Aren"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Harga Jual</label>
                                            <input
                                                type="number" required
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold transition-all"
                                                placeholder="15000"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Stok Saat Ini</label>
                                            <input
                                                type="number" required
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold transition-all"
                                                placeholder="100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Kategori</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold transition-all appearance-none"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Deskripsi Menu (Opsional)</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold transition-all min-h-[100px] resize-none"
                                            placeholder="Jelaskan keunikan menu ini, misalnya: 'Kopi susu dengan gula aren asli dari petani lokal...'"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Modal (HPP)</label>
                                            <input
                                                type="number"
                                                value={formData.hpp}
                                                onChange={(e) => setFormData({ ...formData, hpp: e.target.value })}
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50/50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold transition-all"
                                                placeholder="8000"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Diskon (%)</label>
                                            <input
                                                type="number"
                                                value={formData.discount}
                                                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50/50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Opsi / Topping Menu</h3>
                                            <button
                                                type="button"
                                                onClick={addOption}
                                                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
                                            >
                                                <Icon name="Plus" size={14} />
                                                TAMBAH OPSI
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {formData.options.map((option, index) => (
                                                <div key={index} className="group relative bg-gray-50/50 p-4 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nama Opsi</label>
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                placeholder="e.g., Dada, Paha, Ekstra Keju"
                                                                value={option.name}
                                                                onChange={(e) => handleOptionChange(index, e)}
                                                                className="w-full bg-white px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                                            />
                                                        </div>
                                                        <div className="relative">
                                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Harga Tambahan (Rp)</label>
                                                            <input
                                                                type="number"
                                                                name="price_adjustment"
                                                                placeholder="0"
                                                                value={option.price_adjustment}
                                                                onChange={(e) => handleOptionChange(index, e)}
                                                                className="w-full bg-white px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeOption(index)}
                                                                className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Icon name="X" size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {formData.options.length === 0 && (
                                                <div className="py-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                                                    <Icon name="PlusCircle" size={24} />
                                                    <p className="text-[10px] font-bold mt-2 uppercase tracking-widest">Belum ada opsi</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-50 rounded-2xl flex items-center justify-between border border-orange-100">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-orange-800">Menu Unggulan</span>
                                        <span className="text-[10px] text-orange-600 font-medium tracking-tight">Muncul di halaman favorit pelanggan</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-orange-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 bg-white border-t border-gray-50 flex gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 px-6 rounded-2xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-100 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="flex-[2] py-4 px-6 rounded-2xl bg-blue-700 text-white font-black shadow-xl shadow-blue-200 hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? 'Menyimpan...' : (editingItem ? 'Simpan Update' : 'Tambahkan Menu')}
                                {!isSaving && <Icon name="Check" size={20} />}
                            </button>
                        </div>
                    </div >
                </div >
            )}
        </div >
    );
};

export default SellerMenuManagement;
