import React, { useState, useEffect } from 'react';
import { FaBook, FaSearch, FaTrash, FaEdit, FaPlus, FaSyncAlt, FaLayerGroup } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DataMapel = () => {
    const [mapel, setMapel] = useState([]);
    const [guruList, setGuruList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        kode_mapel: '',
        nama_mapel: '',
        kategori: 'Umum',
        guru_id: ''
    });

    const resetForm = () => {
        setFormData({
            kode_mapel: '',
            nama_mapel: '',
            kategori: 'Umum',
            guru_id: ''
        });
        setSelectedId(null);
        setIsEditMode(false);
    };

    const fetchMapel = async () => {
        setIsRefreshing(true);
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/mapel`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setMapel(data);
            } else {
                toast.error(data.error || "Gagal mengambil data mata pelajaran.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan koneksi.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchGuruList = async () => {
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/guru-list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setGuruList(data);
            }
        } catch (err) {
            console.error("Gagal mengambil daftar guru.");
        }
    };

    useEffect(() => {
        fetchMapel();
        fetchGuruList();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('siakad_token');
        const apiUrl = import.meta.env.VITE_API_URL;

        try {
            let response;
            if (isEditMode) {
                response = await fetch(`${apiUrl}/api/admin/mapel/${selectedId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${apiUrl}/api/admin/mapel`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            }

            const data = await response.json();
            if (response.ok) {
                toast.success(isEditMode ? "Mata pelajaran diperbarui." : "Mata pelajaran ditambahkan.");
                setShowModal(false);
                resetForm();
                fetchMapel();
            } else {
                toast.error(data.error || "Gagal menyimpan data.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem.");
        }
    };

    const handleEdit = (item) => {
        setSelectedId(item.id);
        setFormData({
            kode_mapel: item.kode_mapel || '',
            nama_mapel: item.nama_mapel || '',
            kategori: item.kategori || 'Umum',
            guru_id: item.guru_id || ''
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Hapus mata pelajaran ${nama}?`)) return;

        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/mapel/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success("Mata pelajaran dihapus.");
                fetchMapel();
            } else {
                toast.error("Gagal menghapus data.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem.");
        }
    };

    const filteredMapel = mapel.filter(m =>
        m.nama_mapel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.kode_mapel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nama_guru?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Statistik
    const totalUmum = mapel.filter(m => m.kategori === 'Umum').length;
    const totalPeminatan = mapel.filter(m => m.kategori === 'Peminatan').length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-all duration-300">Data Mata Pelajaran</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manajemen kurikulum dan pengajar per subjek.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchMapel}
                        disabled={isRefreshing}
                        className={`p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <FaSyncAlt />
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transform transition-all active:scale-95"
                    >
                        <FaPlus size={14} />
                        <span>Tambah Mapel</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="relative group p-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-2xl text-white shadow-2xl shadow-emerald-600/30 overflow-hidden transform transition-all hover:scale-[1.02] hover:shadow-emerald-600/50">
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <div className="flex items-center space-x-1.5 mb-1.5">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                                <p className="text-emerald-100/90 text-sm font-medium">Total Mapel</p>
                            </div>
                            <div className="flex items-baseline space-x-1.5">
                                <h3 className="text-4xl font-black tracking-tighter drop-shadow-lg">{mapel.length}</h3>
                                <span className="text-emerald-200/60 text-[10px] font-bold">Subjek</span>
                            </div>
                        </div>
                        <div className="p-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl">
                            <FaBook size={24} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-between hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all group">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Kategori Umum</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">{totalUmum}</h3>
                    </div>
                    <FaLayerGroup size={24} className="text-emerald-500 opacity-20" />
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-between hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all group">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Peminatan</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">{totalPeminatan}</h3>
                    </div>
                    <FaLayerGroup size={24} className="text-emerald-500 opacity-20" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative w-full sm:max-w-xs group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari mapel, kode, atau guru..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-xs font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Kode Mapel</th>
                                <th className="px-6 py-4">Nama Mata Pelajaran</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4">Guru Pengajar</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center font-bold text-slate-500">Memuat data...</td>
                                </tr>
                            ) : filteredMapel.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center font-bold text-slate-500">Data tidak ditemukan.</td>
                                </tr>
                            ) : filteredMapel.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                                    <td className="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400 text-sm tracking-widest">{item.kode_mapel}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{item.nama_mapel}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${item.kategori === 'Umum' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {item.kategori}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                                        {item.nama_guru || <span className="text-red-400 opacity-50 italic text-xs">Belum diatur</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl transition-all"><FaEdit size={16} /></button>
                                            <button onClick={() => handleDelete(item.id, item.nama_mapel)} className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition-all"><FaTrash size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                    {isLoading ? (
                        <div className="p-12 text-center font-bold text-slate-500">Memuat data...</div>
                    ) : filteredMapel.length === 0 ? (
                        <div className="p-12 text-center font-bold text-slate-500">Data tidak ditemukan.</div>
                    ) : filteredMapel.map((item) => (
                        <div key={item.id} className="p-6 space-y-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1">{item.kode_mapel}</span>
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{item.nama_mapel}</h4>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${item.kategori === 'Umum' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {item.kategori}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guru Pengajar</span>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                        {item.nama_guru || <span className="text-red-400 opacity-50 italic">Belum diatur</span>}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                                    <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"><FaEdit size={14} /></button>
                                    <button onClick={() => handleDelete(item.id, item.nama_mapel)} className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition-colors bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"><FaTrash size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            {isEditMode ? 'Edit Mata Pelajaran' : 'Tambah Mapel Baru'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Kode Mapel</label>
                                <input
                                    type="text" required
                                    value={formData.kode_mapel}
                                    onChange={(e) => setFormData({ ...formData, kode_mapel: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-all font-black uppercase placeholder:normal-case"
                                    placeholder="ex: MTK-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Nama Mata Pelajaran</label>
                                <input
                                    type="text" required
                                    value={formData.nama_mapel}
                                    onChange={(e) => setFormData({ ...formData, nama_mapel: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-all"
                                    placeholder="ex: Matematika"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Kategori</label>
                                    <select
                                        value={formData.kategori}
                                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-all font-bold"
                                    >
                                        <option value="Umum">Umum</option>
                                        <option value="Peminatan">Peminatan</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Guru Pengajar</label>
                                    <select
                                        value={formData.guru_id}
                                        onChange={(e) => setFormData({ ...formData, guru_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 transition-all font-bold"
                                    >
                                        <option value="">Pilih Guru</option>
                                        {guruList.map(g => (
                                            <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 rounded-xl font-bold">Batal</button>
                                <button type="submit" className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                                    {isEditMode ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataMapel;
