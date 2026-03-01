import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaSearch, FaTrash, FaEdit, FaPlus, FaFilter, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DataAgenda = () => {
    const [agenda, setAgenda] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterType, setFilterType] = useState('All');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAgenda, setSelectedAgenda] = useState(null);

    // Modal state for Add/Edit
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        tanggal: '',
        type: 'Umum',
        keterangan: ''
    });

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());

    const resetForm = () => {
        setFormData({
            title: '',
            tanggal: '',
            type: 'Umum',
            keterangan: ''
        });
        setSelectedId(null);
        setIsEditMode(false);
    };

    const fetchAgenda = async () => {
        setIsRefreshing(true);
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/agenda`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setAgenda(data);
            } else {
                toast.error(data.error || "Gagal mengambil data agenda.");
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
        fetchAgenda();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('siakad_token');
        const apiUrl = import.meta.env.VITE_API_URL;

        try {
            let response;
            if (isEditMode) {
                response = await fetch(`${apiUrl}/api/admin/agenda/${selectedId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${apiUrl}/api/admin/agenda`, {
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
                toast.success(isEditMode ? "Agenda diperbarui." : "Agenda berhasil ditambahkan.");
                setShowModal(false);
                resetForm();
                fetchAgenda();
            } else {
                toast.error(data.error || "Gagal menyimpan data.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem.");
        }
    };

    const handleEdit = (e, item) => {
        e.stopPropagation();
        setSelectedId(item.id);
        const formattedDate = item.tanggal ? new Date(item.tanggal).toISOString().split('T')[0] : '';
        setFormData({
            title: item.title,
            tanggal: formattedDate,
            type: item.type,
            keterangan: item.keterangan || ''
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (e, id, title) => {
        e.stopPropagation();
        if (!window.confirm(`Apakah Anda yakin ingin menghapus agenda "${title}"?`)) return;

        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/agenda/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("Agenda berhasil dihapus.");
                fetchAgenda();
            } else {
                toast.error(data.error || "Gagal menghapus data.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem.");
        }
    };

    const handleShowDetail = (item) => {
        setSelectedAgenda(item);
        setShowDetailModal(true);
    };

    const filteredAgenda = agenda.filter(a => {
        const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.type?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'All' || a.type === filterType;

        return matchesSearch && matchesType;
    });

    // Calendar Helpers
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Previous month days padding
        const prevMonthDays = getDaysInMonth(year, month - 1);
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, currentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, currentMonth: true });
        }

        // Next month days padding
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, currentMonth: false });
        }

        return (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in duration-500">
                <div className="p-6 bg-indigo-600 dark:bg-indigo-900/50 flex items-center justify-between text-white">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-xl font-black uppercase tracking-widest">
                        {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentDate)}
                    </h2>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 text-center bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                        <div key={d} className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">
                    {days.map((d, i) => {
                        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                        // Normalisasi tanggal dari DB: ambil hanya bagian tanggal (YYYY-MM-DD) tanpa timezone conversion
                        const getLocalDateString = (tanggal) => {
                            if (!tanggal) return '';
                            // Jika sudah format YYYY-MM-DD, langsung pakai
                            if (/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return tanggal;
                            // Jika format ISO dengan 'T', ambil bagian sebelum T (UTC date) tapi koreksi dengan offset lokal
                            const d = new Date(tanggal);
                            const offset = d.getTimezoneOffset() * 60000;
                            const local = new Date(d.getTime() - offset);
                            return local.toISOString().split('T')[0];
                        };
                        const dayAgendas = agenda.filter(a => getLocalDateString(a.tanggal) === dateString);
                        const isToday = new Date().toDateString() === new Date(year, month, d.day).toDateString() && d.currentMonth;

                        return (
                            <div
                                key={i}
                                className={`min-h-[100px] sm:min-h-[120px] bg-white dark:bg-slate-800 p-2 sm:p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40 group relative ${!d.currentMonth ? 'opacity-30' : ''}`}
                            >
                                <span className={`inline-flex w-7 h-7 sm:w-8 sm:h-8 items-center justify-center rounded-xl text-sm font-black transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {d.day}
                                </span>
                                <div className="mt-2 space-y-1">
                                    {dayAgendas.map((agnt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleShowDetail(agnt)}
                                            className={`w-full text-left px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold truncate transition-all border ${agnt.type === 'Akademik' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800/30' :
                                                agnt.type === 'Eskul' ? 'bg-pink-50 border-pink-100 text-pink-600 dark:bg-pink-900/20 dark:border-pink-800/30' :
                                                    'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/30'
                                                } hover:scale-[1.02] transform cursor-pointer`}
                                        >
                                            {agnt.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="p-3 sm:p-6 lg:p-8 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-all duration-300">Agenda Sekolah</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manajemen kegiatan dan pengumuman sekolah.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center shadow-inner">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Kalender
                        </button>
                    </div>
                    <button
                        onClick={fetchAgenda}
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
                        <span>Tambah Agenda</span>
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                renderCalendar()
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:max-w-xs group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari agenda atau kategori..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200"
                            />
                        </div>

                        <div className="flex items-center space-x-2 relative w-full sm:w-auto">
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className={`flex items-center justify-center space-x-2 px-6 py-3 border rounded-2xl font-bold transition-all w-full sm:w-auto ${filterType !== 'All'
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                                    : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                            >
                                <FaFilter size={14} />
                                <span>{filterType === 'All' ? 'Filter Kategori' : `Tipe: ${filterType}`}</span>
                            </button>

                            {showFilterDropdown && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setShowFilterDropdown(false)}></div>
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-[70]">
                                        {['All', 'Akademik', 'Umum', 'Eskul'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => { setFilterType(type); setShowFilterDropdown(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${filterType === type ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                                            >
                                                {type === 'All' ? 'Semua Agenda' : type}
                                            </button>
                                        ))}
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
                                    <th className="px-6 py-4">Agenda</th>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {isLoading ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-500 font-bold animate-pulse">Memuat data...</td></tr>
                                ) : filteredAgenda.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 text-center font-bold text-slate-500 italic">Tidak ada agenda ditemukan.</td></tr>
                                ) : filteredAgenda.map((item) => (
                                    <tr key={item.id} onClick={() => handleShowDetail(item)} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.title}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="text-center bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/30 min-w-[50px]">
                                                    <p className="text-[10px] font-black text-indigo-600 uppercase leading-none mb-1">{new Date(item.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</p>
                                                    <p className="text-lg font-black text-slate-800 dark:text-white leading-none">{new Date(item.tanggal).getDate()}</p>
                                                </div>
                                                <p className="text-xs font-medium text-slate-400">{new Date(item.tanggal).getFullYear()}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${item.type === 'Akademik' ? 'bg-blue-100 text-blue-600' :
                                                item.type === 'Eskul' ? 'bg-pink-100 text-pink-600' :
                                                    'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate">
                                            <p className="text-sm text-slate-500 italic">{item.keterangan || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={(e) => handleEdit(e, item)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><FaEdit size={16} /></button>
                                                <button onClick={(e) => handleDelete(e, item.id, item.title)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><FaTrash size={16} /></button>
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
                        ) : filteredAgenda.length === 0 ? (
                            <div className="p-12 text-center font-bold text-slate-500 italic">Tidak ada agenda ditemukan.</div>
                        ) : filteredAgenda.map((item) => (
                            <div key={item.id} onClick={() => handleShowDetail(item)} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-center bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 min-w-[55px]">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase leading-none mb-1">{new Date(item.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</p>
                                            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{new Date(item.tanggal).getDate()}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-tight">{item.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(item.tanggal).getFullYear()}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button onClick={(e) => handleEdit(e, item)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><FaEdit size={16} /></button>
                                        <button onClick={(e) => handleDelete(e, item.id, item.title)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><FaTrash size={16} /></button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${item.type === 'Akademik' ? 'bg-blue-100 text-blue-600' :
                                        item.type === 'Eskul' ? 'bg-pink-100 text-pink-600' :
                                            'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {item.type}
                                    </span>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 italic font-medium">
                                        {item.keterangan || 'Tidak ada keterangan tambahan.'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal Detail */}
            {showDetailModal && selectedAgenda && (
                <div className="fixed inset-0 z-[99999] overflow-hidden flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowDetailModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col m-0 animate-in fade-in zoom-in duration-300 overflow-hidden border border-white/20">
                        <div className={`p-8 pb-12 flex flex-col items-center text-center relative ${selectedAgenda.type === 'Akademik' ? 'bg-blue-600' :
                            selectedAgenda.type === 'Eskul' ? 'bg-pink-600' :
                                'bg-indigo-600'
                            }`}>
                            <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors text-3xl font-black">×</button>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4 shadow-xl">
                                <FaCalendarAlt className="text-white text-3xl" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">{selectedAgenda.title}</h2>
                            <span className="px-4 py-1 bg-white/20 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest rounded-full">
                                {selectedAgenda.type}
                            </span>
                        </div>

                        <div className="p-8 -mt-6 bg-white dark:bg-slate-800 rounded-t-[2.5rem] space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hari & Tanggal</p>
                                    <p className="font-bold text-slate-800 dark:text-white">
                                        {new Date(selectedAgenda.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tahun</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{new Date(selectedAgenda.tanggal).getFullYear()}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Kegiatan</p>
                                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                        {selectedAgenda.keterangan || 'Tidak ada deskripsi detail untuk agenda ini.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={(e) => { setShowDetailModal(false); handleEdit(e, selectedAgenda); }}
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                                >
                                    Edit Agenda
                                </button>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all font-bold"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah/Edit */}
            {showModal && (
                <div className="fixed inset-0 z-[99999] overflow-hidden flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex flex-col m-0 animate-in fade-in zoom-in duration-300">
                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isEditMode ? 'Edit Agenda' : 'Tambah Agenda Baru'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-2xl font-black">×</button>
                        </div>

                        <div className="p-6 sm:p-8 space-y-4">
                            <form id="agendaForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Judul Agenda</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        placeholder="Contoh: Rapat Wali Murid"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Tanggal</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.tanggal}
                                            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Kategori</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        >
                                            <option value="Akademik">Akademik</option>
                                            <option value="Umum">Umum</option>
                                            <option value="Eskul">Eskul</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-tight">Keterangan (Opsional)</label>
                                    <textarea
                                        value={formData.keterangan}
                                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        placeholder="Detail kegiatan..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
                            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-all">Batal</button>
                            <button type="submit" form="agendaForm" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">Simpan Agenda</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataAgenda;
