import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaChalkboardTeacher, FaSearch, FaTrash, FaEdit, FaPlus, FaFilter, FaEllipsisV, FaSyncAlt, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DataGuru = () => {
    const [guru, setGuru] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterGender, setFilterGender] = useState('All');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedGuru, setSelectedGuru] = useState(null);
    const [jadwalGuru, setJadwalGuru] = useState([]);
    const [isLoadingJadwal, setIsLoadingJadwal] = useState(false);

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

    const fetchJadwalGuru = async (guruId) => {
        setIsLoadingJadwal(true);
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/jadwal`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                // Filter jadwal yang diajar oleh guru ini
                // Berdasarkan server.js, jadwal join mapel, mapel left join users (guru)
                // Kita filter berdasarkan guru_id di tabel mata_pelajaran or check join results
                // Since we don't have guru_id directly in jadwal but names, let's filter by name or if ID is available
                const teacherSchedule = data.filter(j => j.guru_id === guruId); // Assuming guru_id exists in join
                setJadwalGuru(teacherSchedule);
            }
        } catch (err) {
            console.error('Fetch jadwal error:', err);
        } finally {
            setIsLoadingJadwal(false);
        }
    };

    const handleShowDetail = (item) => {
        setSelectedGuru(item);
        setJadwalGuru([]);
        setShowDetailModal(true);
        fetchJadwalGuru(item.id);
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

    const filteredGuru = guru.filter(g => {
        const matchesSearch = g.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.nisn_nik?.includes(searchTerm) ||
            g.username?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesGender = filterGender === 'All' || g.jenis_kelamin === filterGender;

        return matchesSearch && matchesGender;
    });

    // Hitung Statistik
    const totalLaki = guru.filter(g => g.jenis_kelamin === 'L').length;
    const totalPerempuan = guru.filter(g => g.jenis_kelamin === 'P').length;

    return (
        <div className="p-3 sm:p-6 lg:p-8 space-y-6">
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

                    <div className="flex items-center space-x-2 relative w-full sm:w-auto">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`flex items-center justify-center space-x-2 px-6 py-3 border rounded-2xl font-bold transition-all w-full sm:w-auto ${filterGender !== 'All'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20'
                                : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            <FaFilter size={14} />
                            <span>{filterGender === 'All' ? 'Filter' : `Gender: ${filterGender}`}</span>
                        </button>

                        {/* Dropdown Filter */}
                        {showFilterDropdown && (
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setShowFilterDropdown(false)}></div>
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-[70] animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Kelamin</p>
                                    </div>
                                    <button
                                        onClick={() => { setFilterGender('All'); setShowFilterDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${filterGender === 'All' ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                                    >
                                        Semua Gender
                                    </button>
                                    <button
                                        onClick={() => { setFilterGender('L'); setShowFilterDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${filterGender === 'L' ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                                    >
                                        Laki-laki
                                    </button>
                                    <button
                                        onClick={() => { setFilterGender('P'); setShowFilterDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${filterGender === 'P' ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                                    >
                                        Perempuan
                                    </button>
                                </div>
                            </>
                        )}
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
                                <tr
                                    key={item.id}
                                    onClick={() => handleShowDetail(item)}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group cursor-pointer"
                                >
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
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all"
                                            >
                                                <FaEdit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.nama_lengkap); }}
                                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all"
                                            >
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
                        <div
                            key={item.id}
                            onClick={() => handleShowDetail(item)}
                            className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group cursor-pointer active:scale-[0.98]"
                        >
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
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                        className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all border border-slate-100 dark:border-slate-700"
                                    >
                                        <FaEdit size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.nama_lengkap); }}
                                        className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all border border-slate-100 dark:border-slate-700"
                                    >
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
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

            {/* Modal Detail Guru (MOBILE VERSION) */}
            {showDetailModal && selectedGuru && (
                <div className="fixed inset-0 z-[99999] overflow-hidden flex items-end sm:hidden">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowDetailModal(false)}></div>
                    <div className="relative w-full bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl flex flex-col m-0 animate-in slide-in-from-bottom duration-500 max-h-[90vh]">
                        {/* Pull Bar */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-4 shrink-0" onClick={() => setShowDetailModal(false)}></div>

                        {/* Header Detail */}
                        <div className="px-6 pb-4 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Profil Guru</h2>
                            <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-2xl font-black">×</button>
                        </div>

                        {/* Body Detail */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-3xl flex items-center justify-center text-3xl font-black shadow-inner shrink-0">
                                    {selectedGuru.nama_lengkap?.[0] || 'G'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-tight">{selectedGuru.nama_lengkap}</h3>
                                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest">@{selectedGuru.username}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Data Kepegawaian</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">NIP / Identitas</span>
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{selectedGuru.nisn_nik || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Gender</span>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${selectedGuru.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                                {selectedGuru.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100/50 dark:border-purple-900/30">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-3">Kontak</p>
                                    <div className="space-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Email</span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedGuru.email || '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1">WhatsApp</span>
                                            <span className="text-base font-black text-purple-600 dark:text-purple-400">{selectedGuru.wa_number || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Jadwal Mengajar</p>
                                    {isLoadingJadwal ? (
                                        <div className="text-center py-4 animate-pulse text-[10px] font-bold text-slate-400">Memuat jadwal...</div>
                                    ) : jadwalGuru.length === 0 ? (
                                        <div className="text-center py-4 text-[10px] font-bold text-slate-400 italic">Belum ada jadwal mengajar</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {jadwalGuru.map((j, idx) => (
                                                <div key={idx} className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase leading-none mb-1">{j.nama_mapel}</p>
                                                        <p className="text-[8px] font-bold text-purple-500 uppercase">{j.hari} • {j.jam_mulai} - {j.jam_selesai}</p>
                                                    </div>
                                                    <div className="px-2 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-600 uppercase">
                                                        {j.nama_kelas}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Detail */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-3 shrink-0 pb-10">
                            <button
                                onClick={() => { setShowDetailModal(false); handleEdit(selectedGuru); }}
                                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all active:scale-95"
                            >
                                Edit Data Guru
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="w-full py-4 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-200 dark:border-slate-600 transition-all active:scale-95"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Guru (DESKTOP FULL-SCREEN VERSION) */}
            {showDetailModal && selectedGuru && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[100000] hidden sm:flex flex-col bg-white dark:bg-[#0F172A] animate-in fade-in duration-300">
                    {/* Header Full Screen */}
                    <div className="h-20 px-8 sm:px-12 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-600/20 text-white">
                                <FaChalkboardTeacher size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Profil Lengkap Guru</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Pendidik Terdaftar dalam Sistem</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDetailModal(false)}
                            className="group flex items-center space-x-3 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-2xl transition-all font-black uppercase text-xs tracking-widest"
                        >
                            <span>Tutup Detail</span>
                            <span className="text-2xl leading-none group-hover:rotate-90 transition-transform">×</span>
                        </button>
                    </div>

                    {/* Content Full Screen */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-6xl mx-auto px-8 sm:px-12 py-12">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                                {/* Left: Identity Card */}
                                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-12">
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden group">
                                        <div className="h-32 bg-gradient-to-br from-purple-600 to-indigo-700 relative">
                                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] text-white"></div>
                                        </div>
                                        <div className="px-8 pb-10 -mt-16 relative text-center">
                                            <div className="w-32 h-32 mx-auto rounded-3xl bg-purple-50 dark:bg-slate-900 border-8 border-white dark:border-slate-800 flex items-center justify-center text-5xl font-black text-purple-600 shadow-2xl transform group-hover:scale-105 transition-all duration-500">
                                                {selectedGuru.nama_lengkap?.[0] || 'G'}
                                            </div>
                                            <div className="mt-6">
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedGuru.nama_lengkap}</h3>
                                                <p className="inline-block mt-2 px-4 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    @{selectedGuru.username}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-8">
                                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-center border border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                                    <p className="text-sm font-black text-emerald-600 uppercase">Aktif</p>
                                                </div>
                                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-center border border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                                                    <p className="text-lg font-black text-slate-800 dark:text-white">4.9</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-gradient-to-br from-slate-900 to-purple-950 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                                            <FaChalkboardTeacher size={100} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 italic">Ringkasan Guru</h4>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Terdaftar Sejak</span>
                                                <span className="text-xs font-black">{new Date(selectedGuru.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Role</span>
                                                <span className="text-xs font-black uppercase">{selectedGuru.role}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Sertifikasi</span>
                                                <span className="flex items-center space-x-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Terverifikasi</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Detailed Info */}
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl p-8 sm:p-12 space-y-12">

                                        {/* Section 1: Data Utama */}
                                        <section className="space-y-8">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-1.5 h-8 bg-purple-600 rounded-full"></div>
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Informasi Kepegawaian</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nama Lengkap & Gelar</p>
                                                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 border-b-2 border-slate-50 dark:border-slate-700 pb-2">{selectedGuru.nama_lengkap}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">NIP / Identitas (Username)</p>
                                                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 border-b-2 border-slate-50 dark:border-slate-700 pb-2">{selectedGuru.nisn_nik || '-'}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Jenis Kelamin</p>
                                                    <div className="flex items-center space-x-3 pt-1">
                                                        <span className={`px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${selectedGuru.jenis_kelamin === 'L' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-pink-600 text-white shadow-lg shadow-pink-600/20'}`}>
                                                            {selectedGuru.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Kepegawaian</p>
                                                    <p className="text-lg font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Guru Tetap</p>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Section 2: Kontak */}
                                        <section className="space-y-8 pt-6 border-t border-slate-50 dark:border-slate-700/50">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Konektivitas & Kontak</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                                <div className="group space-y-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-colors">Alamat Email Resmi</p>
                                                    <div className="flex items-center space-x-3 text-lg font-black text-slate-800 dark:text-slate-100">
                                                        <span>{selectedGuru.email || 'Email belum ditautkan'}</span>
                                                    </div>
                                                </div>
                                                <div className="group space-y-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-colors">WhatsApp Business</p>
                                                    <div className="flex items-center space-x-3 text-xl font-black text-purple-600 dark:text-purple-400">
                                                        <span>{selectedGuru.wa_number || 'Tidak ada nomor'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Section 3: Jadwal Mengajar */}
                                        <section className="space-y-8 pt-6 border-t border-slate-50 dark:border-slate-700/50">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Jadwal Mengajar Mingguan</h4>
                                            </div>

                                            {isLoadingJadwal ? (
                                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                                    <div className="w-12 h-12 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin"></div>
                                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Jadwal...</p>
                                                </div>
                                            ) : jadwalGuru.length === 0 ? (
                                                <div className="p-12 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                                                    <p className="text-sm font-bold text-slate-400 italic uppercase tracking-widest">Belum ada jadwal mengajar yang terdaftar.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {jadwalGuru.map((j, idx) => (
                                                        <div key={idx} className="group p-6 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-purple-500/50 transition-all hover:shadow-2xl hover:shadow-purple-500/10">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">{j.nama_mapel}</p>
                                                                    <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{j.hari}</p>
                                                                </div>
                                                                <div className="px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl text-[10px] font-black tracking-widest uppercase">
                                                                    {j.nama_kelas}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                                    <FaCalendarAlt size={12} className="text-purple-500" />
                                                                </div>
                                                                <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                                                    {j.jam_mulai} - {j.jam_selesai}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                        {/* Action Buttons Desktop */}
                                        <div className="flex flex-col sm:flex-row gap-4 pt-10">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowDetailModal(false); handleEdit(selectedGuru); }}
                                                className="flex-1 py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-purple-600/30 transform transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-3"
                                            >
                                                <FaEdit size={16} />
                                                <span>Ubah Data Guru</span>
                                            </button>
                                            <button
                                                onClick={() => setShowDetailModal(false)}
                                                className="flex-1 py-5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                                            >
                                                Kembali ke List
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DataGuru;
