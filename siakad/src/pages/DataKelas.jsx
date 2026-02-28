import React, { useState, useEffect } from 'react';
import { FaChalkboard, FaSearch, FaTrash, FaEdit, FaPlus, FaSyncAlt, FaUserTie, FaGraduationCap } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DataKelas = () => {
    const [kelas, setKelas] = useState([]);
    const [guruList, setGuruList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        nama_kelas: '',
        tingkat: 'X',
        wali_kelas_id: ''
    });

    const resetForm = () => {
        setFormData({
            nama_kelas: '',
            tingkat: 'X',
            wali_kelas_id: ''
        });
        setSelectedId(null);
        setIsEditMode(false);
    };

    const fetchKelas = async () => {
        setIsRefreshing(true);
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/kelas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setKelas(data);
            } else {
                toast.error(data.error || "Gagal mengambil data kelas.");
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
        fetchKelas();
        fetchGuruList();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('siakad_token');
        const apiUrl = import.meta.env.VITE_API_URL;

        try {
            let response;
            if (isEditMode) {
                response = await fetch(`${apiUrl}/api/admin/kelas/${selectedId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${apiUrl}/api/admin/kelas`, {
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
                toast.success(isEditMode ? "Kelas berhasil diperbarui." : "Kelas berhasil ditambahkan.");
                setShowModal(false);
                resetForm();
                fetchKelas();
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
            nama_kelas: item.nama_kelas || '',
            tingkat: item.tingkat || 'X',
            wali_kelas_id: item.wali_kelas_id || ''
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Hapus kelas ${nama}? Semua data jadwal terkait akan ikut terhapus.`)) return;

        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/kelas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success("Kelas berhasil dihapus.");
                fetchKelas();
            } else {
                toast.error("Gagal menghapus data.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem.");
        }
    };

    const filteredKelas = kelas.filter(k =>
        k.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.nama_wali?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Grouping for stats
    const totalWali = kelas.filter(k => k.wali_kelas_id).length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Kelas</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Atur kelompok belajar dan penugasan wali kelas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchKelas}
                        disabled={isRefreshing}
                        className={`p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <FaSyncAlt />
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center space-x-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold shadow-lg shadow-sky-600/20 transform transition-all active:scale-95"
                    >
                        <FaPlus size={14} />
                        <span>Tambah Kelas</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative group p-5 bg-gradient-to-br from-sky-600 via-sky-700 to-sky-900 rounded-3xl text-white shadow-2xl shadow-sky-600/30 overflow-hidden transform transition-all hover:scale-[1.01]">
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-sky-100/90 text-sm font-medium mb-1">Total Kelas Aktif</p>
                            <div className="flex items-baseline space-x-2">
                                <h3 className="text-4xl font-black tracking-tighter">{kelas.length}</h3>
                                <span className="text-sky-200/60 text-xs font-bold uppercase">Ruangan</span>
                            </div>
                        </div>
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <FaChalkboard size={28} />
                        </div>
                    </div>
                </div>
                <div className="relative group p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-between overflow-hidden transition-all hover:border-sky-300">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Sudah Ber-Wali</p>
                        <div className="flex items-baseline space-x-2">
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{totalWali}</h3>
                            <span className="text-slate-400 text-xs font-bold uppercase">Dari {kelas.length} Kelas</span>
                        </div>
                    </div>
                    <div className="p-4 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-2xl">
                        <FaUserTie size={24} />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari kelas atau wali kelas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-sky-500 transition-all font-medium text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-xs font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Tingkat</th>
                                <th className="px-6 py-4">Nama Kelas</th>
                                <th className="px-6 py-4">Wali Kelas</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">Memuat data kelas...</td>
                                </tr>
                            ) : filteredKelas.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center font-bold text-slate-400 italic">Data kelas masih kosong.</td>
                                </tr>
                            ) : filteredKelas.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-lg text-xs font-black tracking-widest uppercase">
                                            {item.tingkat}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{item.nama_kelas}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">
                                                {item.nama_wali?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{item.nama_wali || 'Belum diisi'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Penanggung Jawab</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleEdit(item)} className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-all"><FaEdit size={16} /></button>
                                            <button onClick={() => handleDelete(item.id, item.nama_kelas)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><FaTrash size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            {isEditMode ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tingkat</label>
                                    <select
                                        required
                                        value={formData.tingkat}
                                        onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-sky-500 transition-all font-bold"
                                    >
                                        <option value="X">Tingkat X</option>
                                        <option value="XI">Tingkat XI</option>
                                        <option value="XII">Tingkat XII</option>
                                        <option value="Umum">Umum</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Kelas</label>
                                    <input
                                        type="text" required
                                        value={formData.nama_kelas}
                                        onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-sky-500 transition-all font-black uppercase"
                                        placeholder="ex: X RPL 1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Wali Kelas</label>
                                <select
                                    value={formData.wali_kelas_id}
                                    onChange={(e) => setFormData({ ...formData, wali_kelas_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-sky-500 transition-all font-bold"
                                >
                                    <option value="">-- Pilih Guru --</option>
                                    {guruList.map(g => (
                                        <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all hover:bg-slate-200">Batal</button>
                                <button type="submit" className="px-10 py-3 bg-sky-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-sky-600/20 hover:bg-sky-700 active:scale-95 uppercase text-xs tracking-widest">
                                    {isEditMode ? 'Simpan Perubahan' : 'Buat Kelas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataKelas;
