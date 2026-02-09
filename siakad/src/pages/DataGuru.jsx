import React, { useState, useEffect } from 'react';
import { FaChalkboardTeacher, FaSearch, FaTrash, FaEdit, FaPlus, FaFilter, FaEllipsisV, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DataGuru = () => {
    const [guru, setGuru] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchGuru = async () => {
        setIsRefreshing(true);
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
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

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus guru ${nama}?`)) return;

        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
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
                    <button className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-600/20 transform transition-all active:scale-95">
                        <FaPlus size={14} />
                        <span>Tambah Guru</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards Mini */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative group p-5 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 rounded-2xl text-white shadow-2xl shadow-purple-600/30 overflow-hidden transform transition-all hover:scale-[1.02] hover:shadow-purple-600/50">
                    {/* Decorative Elements */}
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
                                <span className="text-purple-200/60 text-[10px] font-bold">Pengajar</span>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/10 blur-xl rounded-full animate-pulse"></div>
                            <div className="relative p-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl transform group-hover:rotate-12 transition-transform duration-500">
                                <FaChalkboardTeacher size={24} className="text-white drop-shadow-lg" />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-purple-100/50">
                        <span>Pendidik Aktif</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-50"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-25"></div>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-between hover:border-purple-200 dark:hover:border-purple-900/50 transition-all group">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Sertifikasi</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors">-</h3>
                    </div>
                    <div className="text-purple-500 font-black text-4xl opacity-[0.08] group-hover:opacity-20 transition-all pointer-events-none select-none text-right">EDU</div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                {/* Table Header / Toolbar */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:max-w-xs group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari guru, NUPTK/NIK, atau username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>

                {/* Table Body */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-xs font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Nama Guru</th>
                                <th className="px-6 py-4">Identitas / NIP</th>
                                <th className="px-6 py-4">Kontak</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center">
                                        <div className="inline-flex items-center space-x-2">
                                            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-bold text-slate-500">Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredGuru.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center font-bold text-slate-500">
                                        {searchTerm ? "Data guru tidak ditemukan." : "Belum ada guru terdaftar."}
                                    </td>
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
                                                <p className="text-xs text-slate-400 font-medium">@{item.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                            {item.nisn_nik || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.email || '-'}</p>
                                        <p className="text-xs text-purple-500 font-bold">{item.wa_number || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all">
                                                <FaEdit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, item.nama_lengkap)}
                                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
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
            </div>
        </div>
    );
};

export default DataGuru;
