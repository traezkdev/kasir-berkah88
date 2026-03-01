import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaSearch, FaTrash, FaEdit, FaPlus, FaSyncAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DataJadwal = () => {
    const [jadwal, setJadwal] = useState([]);
    const [kelasList, setKelasList] = useState([]);
    const [mapelList, setMapelList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        kelas_id: '',
        mapel_id: '',
        hari: 'Senin',
        jam_mulai: '',
        jam_selesai: '',
        ruangan: ''
    });

    const resetForm = () => {
        setFormData({
            kelas_id: '',
            mapel_id: '',
            hari: 'Senin',
            jam_mulai: '',
            jam_selesai: '',
            ruangan: ''
        });
        setSelectedId(null);
        setIsEditMode(false);
    };

    const fetchJadwal = async () => {
        setIsRefreshing(true);
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/jadwal`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setJadwal(data);
            } else {
                toast.error(data.error || "Gagal mengambil data jadwal.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan koneksi.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchHelpers = async () => {
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;

            const [resKelas, resMapel] = await Promise.all([
                fetch(`${apiUrl}/api/admin/kelas-list`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiUrl}/api/admin/mapel`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const dataKelas = await resKelas.json();
            const dataMapel = await resMapel.json();

            if (resKelas.ok) setKelasList(dataKelas);
            if (resMapel.ok) setMapelList(dataMapel);
        } catch (err) {
            console.error("Gagal mengambil data pendukung.");
        }
    };

    useEffect(() => {
        fetchJadwal();
        fetchHelpers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('siakad_token');
        const apiUrl = import.meta.env.VITE_API_URL;

        try {
            let response;
            if (isEditMode) {
                response = await fetch(`${apiUrl}/api/admin/jadwal/${selectedId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${apiUrl}/api/admin/jadwal`, {
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
                toast.success(isEditMode ? "Jadwal diperbarui." : "Jadwal ditambahkan.");
                setShowModal(false);
                resetForm();
                fetchJadwal();
            } else {
                toast.error(data.error || "Gagal menyimpan jadwal.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem.");
        }
    };

    const handleEdit = (item) => {
        setSelectedId(item.id);
        setFormData({
            kelas_id: item.kelas_id,
            mapel_id: item.mapel_id,
            hari: item.hari,
            jam_mulai: item.jam_mulai,
            jam_selesai: item.jam_selesai,
            ruangan: item.ruangan || ''
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Hapus jadwal ini?")) return;
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/jadwal/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success("Jadwal dihapus.");
                fetchJadwal();
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem.");
        }
    };

    const filteredJadwal = jadwal.filter(j =>
        j.nama_mapel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.hari?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.nama_guru?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Grouping jadwal by Hari for better UI
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    return (
        <div className="p-3 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jadwal Pelajaran</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Atur sirkulasi KBM untuk tiap kelas dan subjek.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchJadwal}
                        className={`p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <FaSyncAlt />
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center space-x-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-amber-600/20 transform transition-all active:scale-95"
                    >
                        <FaPlus size={14} />
                        <span>Tambah Jadwal</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative max-w-md group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Cari kelas, mapel, atau guru..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-amber-500 transition-all text-slate-700 dark:text-slate-200"
                    />
                </div>
            </div>

            {/* Timetable Style View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {days.map(day => {
                    const dailyJadwal = filteredJadwal.filter(j => j.hari === day);
                    if (dailyJadwal.length === 0 && !searchTerm) return null;
                    if (dailyJadwal.length === 0 && searchTerm) return null;

                    return (
                        <div key={day} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <FaCalendarAlt className="text-amber-500" />
                                    {day}
                                </h3>
                                <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                    {dailyJadwal.length} Jadwal
                                </span>
                            </div>
                            <div className="p-2 space-y-2 flex-1">
                                {dailyJadwal.map((item) => (
                                    <div key={item.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-amber-200 dark:hover:border-amber-900 transition-all group relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-tighter mb-0.5 bg-amber-50 inline-block px-1.5 rounded">
                                                    {item.nama_kelas}
                                                </p>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 transition-colors uppercase leading-tight">
                                                    {item.nama_mapel}
                                                </h4>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"><FaEdit size={12} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><FaTrash size={12} /></button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <FaClock className="text-slate-300" />
                                                <span>{item.jam_mulai.slice(0, 5)} - {item.jam_selesai.slice(0, 5)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FaMapMarkerAlt className="text-slate-300" />
                                                <span>{item.ruangan || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700 flex items-center gap-2">
                                            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-[10px] font-black">
                                                {item.nama_guru?.[0] || '?'}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 truncate">{item.nama_guru || 'Guru belum diatur'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {filteredJadwal.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-600">
                        <FaCalendarAlt size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="font-bold text-slate-400">Jadwal tidak ditemukan atau belum ada data.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[99999] overflow-hidden sm:flex sm:items-center sm:justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="fixed inset-0 sm:relative sm:inset-auto w-full h-full sm:h-auto max-w-lg bg-white dark:bg-slate-800 sm:rounded-3xl rounded-none shadow-2xl flex flex-col m-0 animate-in fade-in slide-in-from-bottom-0 sm:zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isEditMode ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-2xl font-black">×</button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                            <form id="jadwalForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Hari</label>
                                        <select
                                            value={formData.hari}
                                            onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 transition-all font-bold"
                                        >
                                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Kelas</label>
                                        <select
                                            required
                                            value={formData.kelas_id}
                                            onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 transition-all font-bold"
                                        >
                                            <option value="">Pilih Kelas</option>
                                            {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Mata Pelajaran</label>
                                    <select
                                        required
                                        value={formData.mapel_id}
                                        onChange={(e) => setFormData({ ...formData, mapel_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 transition-all font-bold"
                                    >
                                        <option value="">Pilih Mapel</option>
                                        {mapelList.map(m => (
                                            <option key={m.id} value={m.id}>{m.nama_mapel} - {m.nama_guru || 'Tanpa Guru'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Jam Mulai</label>
                                        <input
                                            type="time" required
                                            value={formData.jam_mulai}
                                            onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 transition-all font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Jam Selesai</label>
                                        <input
                                            type="time" required
                                            value={formData.jam_selesai}
                                            onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 transition-all font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Ruangan (Opsional)</label>
                                    <input
                                        type="text"
                                        value={formData.ruangan}
                                        onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 transition-all"
                                        placeholder="ex: Lab Komputer 1 / Kelas X-A"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer (Fixed at Bottom) */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">Batal</button>
                                <button type="submit" form="jadwalForm" className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 shadow-lg shadow-amber-600/20 transition-all">
                                    {isEditMode ? 'Simpan' : 'Tambah Jadwal'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataJadwal;
