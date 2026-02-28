import React, { useState, useEffect } from 'react';
import { FaChalkboardTeacher, FaSearch, FaTrash, FaEdit, FaPlus, FaFilter, FaEllipsisV, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DataGuru = () => {
    const [guru, setGuru] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        nama_lengkap: '',
        jenis_kelamin: 'L',
        nisn_nik: '',
        email: '',
        wa_number: '',
        role: 'guru'
    });

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            nama_lengkap: '',
            jenis_kelamin: 'L',
            nisn_nik: '',
            email: '',
            wa_number: '',
            role: 'guru'
        });
        setSelectedId(null);
        setIsEditMode(false);
    };

    const fetchGuru = async () => {
        setIsRefreshing(true);
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/users?role=guru`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setGuru(data);
            } else {
                toast.error(data.error || "Gagal mengambil data guru.");
            }
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error("Terjadi kesalahan koneksi.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchGuru();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('siakad_token');
        const apiUrl = import.meta.env.VITE_API_URL;

        try {
            let response;
            if (isEditMode) {
                response = await fetch(`${apiUrl}/api/admin/users/${selectedId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${apiUrl}/api/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ...formData, role: 'guru' })
                });
            }

            const data = await response.json();
            if (response.ok) {
                toast.success(isEditMode ? "Data guru diperbarui." : "Guru berhasil ditambahkan.");
                setShowModal(false);
                resetForm();
                fetchGuru();
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
            username: item.username,
            password: '',
            nama_lengkap: item.nama_lengkap || '',
            jenis_kelamin: item.jenis_kelamin || 'L',
            nisn_nik: item.nisn_nik || '',
            email: item.email || '',
            wa_number: item.wa_number || '',
            role: 'guru'
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus guru ${nama}?`)) return;

        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("Guru berhasil dihapus.");
                fetchGuru();
            } else {
                toast.error(data.error || "Gagal menghapus data.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem.");
        }
    };

    const filteredGuru = guru.filter(g =>
        g.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.nisn_nik?.includes(searchTerm)
    );

    // Hitung Statistik
    const totalLaki = guru.filter(g => g.jenis_kelamin === 'L').length;
    const totalPerempuan = guru.filter(g => g.jenis_kelamin === 'P').length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-all duration-300">Data Guru</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manajemen tenaga pengajar dan staf akademik.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchGuru}
                        disabled={isRefreshing}
                        className={`p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <FaSyncAlt />
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-600/20 transform transition-all active:scale-95"
                    >
                        <FaPlus size={14} />
                        <span>Tambah Guru</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards Mini */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="relative group p-5 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 rounded-2xl text-white shadow-2xl shadow-purple-600/30 overflow-hidden transform transition-all hover:scale-[1.02] hover:shadow-purple-600/50">
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="absolute bottom-0 left-0 translate-y-20 -translate-x-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <div className="flex items-center space-x-1.5 mb-1.5">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <p className="text-purple-100/90 text-sm font-medium">Total Guru</p>
                            </div>
                            <div className="flex items-baseline space-x-1.5">
                                <h3 className="text-4xl font-black tracking-tighter drop-shadow-lg">{guru.length}</h3>
                                <span className="text-purple-200/60 text-[10px] font-bold">Pendidik</span>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/10 blur-xl rounded-full animate-pulse"></div>
                            <div className="relative p-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl transform group-hover:rotate-12 transition-transform duration-500">
                                <FaChalkboardTeacher size={24} className="text-white drop-shadow-lg" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-between hover:border-purple-200 dark:hover:border-purple-900/50 transition-all group">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Guru Laki-laki</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors uppercase tracking-tight">{totalLaki}</h3>
                    </div>
                    <div className="text-purple-500 font-black text-4xl opacity-[0.08] group-hover:opacity-20 transition-all pointer-events-none select-none">L</div>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-between hover:border-purple-200 dark:hover:border-purple-900/50 transition-all group">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Guru Perempuan</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors uppercase tracking-tight">{totalPerempuan}</h3>
                    </div>
                    <div className="text-purple-500 font-black text-4xl opacity-[0.08] group-hover:opacity-20 transition-all pointer-events-none select-none">P</div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:max-w-xs group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari guru, NIP/NIK, atau username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-xs font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Nama Guru</th>
                                <th className="px-6 py-4">L/P</th>
                                <th className="px-6 py-4">Identitas / NIP</th>
                                <th className="px-6 py-4">Kontak</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-500 font-bold animate-pulse">Memuat data...</td>
                                </tr>
                            ) : filteredGuru.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center font-bold text-slate-500 italic">Data guru tidak ditemukan.</td>
                                </tr>
                            ) : filteredGuru.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center font-black">
                                                {item.nama_lengkap?.[0] || 'G'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors uppercase tracking-tight">{item.nama_lengkap}</p>
                                                <p className="text-xs text-slate-400 font-medium tracking-wide">@{item.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${item.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                            {item.jenis_kelamin || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg">
                                            {item.nisn_nik || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.email || '-'}</p>
                                        <p className="text-xs text-purple-500 font-bold">{item.wa_number || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all">
                                                <FaEdit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id, item.nama_lengkap)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all">
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Memuat data...</div>
                    ) : filteredGuru.length === 0 ? (
                        <div className="p-12 text-center font-bold text-slate-500 italic">Data guru tidak ditemukan.</div>
                    ) : filteredGuru.map((item) => (
                        <div key={item.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center text-xl font-black">
                                        {item.nama_lengkap?.[0] || 'G'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors uppercase tracking-tight">{item.nama_lengkap}</p>
                                        <p className="text-xs text-slate-400 font-medium tracking-wide">@{item.username}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(item)} className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all border border-slate-100 dark:border-slate-700">
                                        <FaEdit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id, item.nama_lengkap)} className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all border border-slate-100 dark:border-slate-700">
                                        <FaTrash size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas / NIP</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <span className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-md">
                                            {item.nisn_nik || '-'}
                                        </span>
                                    </p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis Kelamin</p>
                                    <p className="text-sm font-bold">
                                        <span className={`px-2.5 py-1 rounded-md ${item.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                            {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                        </span>
                                    </p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontak & Email</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.email || '-'}</p>
                                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                                        <p className="text-sm font-bold text-purple-500">{item.wa_number || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Tambah/Edit */}
            {showModal && (
                <div className="fixed inset-0 z-[99999] overflow-hidden sm:flex sm:items-center sm:justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="fixed inset-0 sm:relative sm:inset-auto w-full h-full sm:h-auto max-w-2xl bg-white dark:bg-slate-800 sm:rounded-3xl rounded-none shadow-2xl flex flex-col m-0 animate-in fade-in slide-in-from-bottom-0 sm:zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isEditMode ? 'Edit Data Guru' : 'Tambah Guru Baru'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-2xl font-black">×</button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                            <form id="guruForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Username</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                                            placeholder="ex: guru_ahmad"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Password</label>
                                        <input
                                            type="password"
                                            required={!isEditMode}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                                            placeholder={isEditMode ? "Kosongkan jika tidak diubah" : "••••••••"}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nama_lengkap}
                                            onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                                            placeholder="ex: Ahmad Subarjo, S.Pd."
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Jenis Kelamin</label>
                                        <div className="flex gap-4 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, jenis_kelamin: 'L' })}
                                                className={`flex-1 py-2 rounded-lg font-bold transition-all ${formData.jenis_kelamin === 'L' ? 'bg-white dark:bg-slate-800 shadow-sm text-purple-600' : 'text-slate-400'}`}
                                            >
                                                Laki-laki
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, jenis_kelamin: 'P' })}
                                                className={`flex-1 py-2 rounded-lg font-bold transition-all ${formData.jenis_kelamin === 'P' ? 'bg-white dark:bg-slate-800 shadow-sm text-purple-600' : 'text-slate-400'}`}
                                            >
                                                Perempuan
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">NIP / NIK</label>
                                        <input
                                            type="text"
                                            value={formData.nisn_nik}
                                            onChange={(e) => setFormData({ ...formData, nisn_nik: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                                            placeholder="ex: 198001012005011001"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                                            placeholder="ex: guru@sekolah.sch.id"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">No. WhatsApp</label>
                                        <input
                                            type="text"
                                            value={formData.wa_number}
                                            onChange={(e) => setFormData({ ...formData, wa_number: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                                            placeholder="ex: 081234567890"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer (Fixed at Bottom) */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    form="guruForm"
                                    className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all"
                                >
                                    {isEditMode ? 'Simpan Perubahan' : 'Tambah Guru'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataGuru;
