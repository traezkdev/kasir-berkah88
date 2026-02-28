import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaSearch, FaTrash, FaEdit, FaPlus, FaFilter, FaSyncAlt, FaFileAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DataNilai = () => {
    const [nilaiData, setNilaiData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Form options
    const [siswaList, setSiswaList] = useState([]);
    const [mapelList, setMapelList] = useState([]);
    const [kelasList, setKelasList] = useState([]);
    const [guruList, setGuruList] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        siswa_id: '',
        mapel_id: '',
        guru_id: '',
        kelas_id: '',
        nilai_uh: 0,
        nilai_uts: 0,
        nilai_uas: 0,
        semester: 'Ganjil',
        tahun_ajaran: '2023/2024',
        keterangan: ''
    });

    const resetForm = () => {
        setFormData({
            siswa_id: '',
            mapel_id: '',
            guru_id: '',
            kelas_id: '',
            nilai_uh: 0,
            nilai_uts: 0,
            nilai_uas: 0,
            semester: 'Ganjil',
            tahun_ajaran: '2023/2024',
            keterangan: ''
        });
        setSelectedId(null);
        setIsEditMode(false);
    };

    const fetchData = async () => {
        setIsRefreshing(true);
        const token = localStorage.getItem('siakad_token');
        const apiUrl = import.meta.env.VITE_API_URL;

        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            // Parallel fetching
            const [resNilai, resSiswa, resMapel, resKelas, resGuru] = await Promise.all([
                fetch(`${apiUrl}/api/admin/nilai`, { headers }),
                fetch(`${apiUrl}/api/admin/users?role=siswa`, { headers }),
                fetch(`${apiUrl}/api/admin/mapel`, { headers }),
                fetch(`${apiUrl}/api/admin/kelas`, { headers }),
                fetch(`${apiUrl}/api/admin/guru-list`, { headers })
            ]);

            const dNilai = await resNilai.json();
            const dSiswa = await resSiswa.json();
            const dMapel = await resMapel.json();
            const dKelas = await resKelas.json();
            const dGuru = await resGuru.json();

            if (resNilai.ok) setNilaiData(dNilai);
            if (resSiswa.ok) setSiswaList(dSiswa);
            if (resMapel.ok) setMapelList(dMapel);
            if (resKelas.ok) setKelasList(dKelas);
            if (resGuru.ok) setGuruList(dGuru);

        } catch (err) {
            console.error('Fetch error:', err);
            toast.error("Gagal mengambil data dari server.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('siakad_token');
        const apiUrl = import.meta.env.VITE_API_URL;

        try {
            let response;
            if (isEditMode) {
                response = await fetch(`${apiUrl}/api/admin/nilai/${selectedId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${apiUrl}/api/admin/nilai`, {
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
                toast.success(isEditMode ? "Data nilai diperbarui." : "Nilai berhasil ditambahkan.");
                setShowModal(false);
                resetForm();
                fetchData();
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
            siswa_id: item.siswa_id,
            mapel_id: item.mapel_id,
            guru_id: item.guru_id,
            kelas_id: item.kelas_id,
            nilai_uh: item.nilai_uh,
            nilai_uts: item.nilai_uts,
            nilai_uas: item.nilai_uas,
            semester: item.semester,
            tahun_ajaran: item.tahun_ajaran,
            keterangan: item.keterangan || ''
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Hapus data nilai ini?")) return;

        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/nilai/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success("Data nilai berhasil dihapus.");
                fetchData();
            } else {
                toast.error("Gagal menghapus data.");
            }
        } catch (err) {
            toast.error("Kesalahan koneksi.");
        }
    };

    const filteredNilai = nilaiData.filter(n =>
        n.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.nama_mapel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getGradeColor = (nilai) => {
        if (nilai >= 85) return 'text-emerald-600 bg-emerald-100';
        if (nilai >= 75) return 'text-blue-600 bg-blue-100';
        if (nilai >= 60) return 'text-amber-600 bg-amber-100';
        return 'text-red-600 bg-red-100';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-all duration-300">Manajemen Nilai</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Pengelolaan rekapitulasi nilai akademik siswa.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className={`p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <FaSyncAlt />
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transform transition-all active:scale-95"
                    >
                        <FaPlus size={14} />
                        <span>Input Nilai</span>
                    </button>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                {/* Search Bar */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative w-full sm:max-w-xs group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari siswa, mapel, atau kelas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>

                {/* Table View (Desktop) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-xs font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Siswa & Kelas</th>
                                <th className="px-6 py-4">Mata Pelajaran</th>
                                <th className="px-6 py-4 text-center">UH</th>
                                <th className="px-6 py-4 text-center">UTS</th>
                                <th className="px-6 py-4 text-center">UAS</th>
                                <th className="px-6 py-4 text-center">Akhir</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-500 font-bold">Memuat data...</td>
                                </tr>
                            ) : filteredNilai.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-500 font-bold">Tidak ada data nilai.</td>
                                </tr>
                            ) : filteredNilai.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{item.nama_siswa}</p>
                                        <p className="text-[10px] font-black text-indigo-500 tracking-widest uppercase">{item.nama_kelas} • {item.semester}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{item.nama_mapel}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Guru: {item.nama_guru}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-400">{item.nilai_uh}</td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-400">{item.nilai_uts}</td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-400">{item.nilai_uas}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${getGradeColor(item.nilai_akhir)}`}>
                                            {item.nilai_akhir.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                                                <FaEdit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition-all">
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Card View (Mobile) */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredNilai.map((item) => (
                        <div key={item.id} className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{item.nama_siswa}</h4>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{item.nama_kelas}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-xs font-black ${getGradeColor(item.nilai_akhir)}`}>
                                    {item.nilai_akhir.toFixed(1)}
                                </span>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mata Pelajaran</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.nama_mapel}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-black">
                                    <p className="text-[8px] text-slate-400 uppercase">UH</p>
                                    <p className="text-sm dark:text-white">{item.nilai_uh}</p>
                                </div>
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-black">
                                    <p className="text-[8px] text-slate-400 uppercase">UTS</p>
                                    <p className="text-sm dark:text-white">{item.nilai_uts}</p>
                                </div>
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-black">
                                    <p className="text-[8px] text-slate-400 uppercase">UAS</p>
                                    <p className="text-sm dark:text-white">{item.nilai_uas}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.semester} • {item.tahun_ajaran}</p>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(item)} className="p-3 bg-white dark:bg-slate-800 text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700"><FaEdit /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-3 bg-white dark:bg-slate-800 text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700"><FaTrash /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Input/Edit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {isEditMode ? 'Edit Nilai Akademik' : 'Input Nilai Baru'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-2xl font-black">×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Siswa Select */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Siswa</label>
                                        <select
                                            required
                                            value={formData.siswa_id}
                                            onChange={(e) => setFormData({ ...formData, siswa_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            <option value="">-- Pilih Siswa --</option>
                                            {siswaList.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap}</option>)}
                                        </select>
                                    </div>

                                    {/* Kelas Select */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
                                        <select
                                            required
                                            value={formData.kelas_id}
                                            onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            <option value="">-- Pilih Kelas --</option>
                                            {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                                        </select>
                                    </div>

                                    {/* Mapel Select */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                                        <select
                                            required
                                            value={formData.mapel_id}
                                            onChange={(e) => setFormData({ ...formData, mapel_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            <option value="">-- Pilih Mapel --</option>
                                            {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
                                        </select>
                                    </div>

                                    {/* Guru Select */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Guru Pengajar</label>
                                        <select
                                            required
                                            value={formData.guru_id}
                                            onChange={(e) => setFormData({ ...formData, guru_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            <option value="">-- Pilih Guru --</option>
                                            {guruList.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}
                                        </select>
                                    </div>

                                    {/* Nilai Inputs */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nilai Harian (UH)</label>
                                        <input
                                            type="number"
                                            min="0" max="100"
                                            value={formData.nilai_uh}
                                            onChange={(e) => setFormData({ ...formData, nilai_uh: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">UTS</label>
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={formData.nilai_uts}
                                                onChange={(e) => setFormData({ ...formData, nilai_uts: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">UAS</label>
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={formData.nilai_uas}
                                                onChange={(e) => setFormData({ ...formData, nilai_uas: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Type/Semester Select */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                                        <select
                                            value={formData.semester}
                                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            <option value="Ganjil">Ganjil</option>
                                            <option value="Genap">Genap</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tahun Ajaran</label>
                                        <input
                                            type="text"
                                            value={formData.tahun_ajaran}
                                            onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                                            placeholder="ex: 2023/2024"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Catatan</label>
                                    <textarea
                                        rows="2"
                                        value={formData.keterangan}
                                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                        placeholder="Catatan kemajuan siswa..."
                                    ></textarea>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                                    >
                                        {isEditMode ? 'Simpan Perubahan' : 'Proses Nilai'}
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

export default DataNilai;
