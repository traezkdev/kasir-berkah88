import React, { useState } from 'react';
import { FaUsers, FaCalendarAlt, FaBookOpen, FaSave, FaCheckCircle, FaUserCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const PresensiSiswa = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('X MIPA 1');
    const [selectedMapel, setSelectedMapel] = useState('Matematika Wajib');
    const [isSaving, setIsSaving] = useState(false);

    // Mock data siswa
    const [students, setStudents] = useState([
        { id: 1, nisn: '0012345601', nama: 'Ari Setiawan', status: 'H' },
        { id: 2, nisn: '0012345602', nama: 'Dewi Lestari', status: 'H' },
        { id: 3, nisn: '0012345603', nama: 'Farhan Malik', status: 'A' },
        { id: 4, nisn: '0012345604', nama: 'Joko Susilo', status: 'S' },
        { id: 5, nisn: '0012345605', nama: 'Lina Marlina', status: 'I' },
        { id: 6, nisn: '0012345606', nama: 'Rizky Ramadhan', status: 'H' },
        { id: 7, nisn: '0012345607', nama: 'Siti Aminah', status: 'H' },
    ]);

    const [jurnal, setJurnal] = useState('');

    const handleStatusChange = (studentId, newStatus) => {
        setStudents(students.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success('Presensi dan Jurnal berhasil disimpan!');
        }, 1500);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'H': return 'bg-emerald-500 text-white';
            case 'I': return 'bg-blue-500 text-white';
            case 'S': return 'bg-amber-500 text-white';
            case 'A': return 'bg-rose-500 text-white';
            default: return 'bg-gray-200 text-gray-500';
        }
    };

    const statusLabels = { H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alpha' };

    return (
        <div className="space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Presensi & Jurnal Mengajar</h1>
                    <p className="text-gray-500 dark:text-gray-400">Kelola kehadiran siswa dan catat kegiatan KBM hari ini.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-70"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <FaSave />
                            <span>Simpan Presensi</span>
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Konfigurasi & Jurnal (Side/Top) */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                            <FaCalendarAlt className="text-indigo-500" />
                            <span>Informasi KBM</span>
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tanggal</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kelas</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                >
                                    <option>X MIPA 1</option>
                                    <option>X MIPA 2</option>
                                    <option>XI IPS 1</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mata Pelajaran</label>
                                <select
                                    value={selectedMapel}
                                    onChange={(e) => setSelectedMapel(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                >
                                    <option>Matematika Wajib</option>
                                    <option>Bahasa Indonesia</option>
                                    <option>Fisika</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                            <FaBookOpen className="text-purple-500" />
                            <span>Jurnal Mengajar</span>
                        </h3>
                        <textarea
                            rows="5"
                            placeholder="Tuliskan ringkasan materi dan catatan kejadian selama KBM berlangsung..."
                            value={jurnal}
                            onChange={(e) => setJurnal(e.target.value)}
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-900 dark:text-white text-sm"
                        ></textarea>
                    </div>
                </div>

                {/* Daftar Siswa (Main Table) */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <FaUsers className="text-emerald-500" />
                                <span>Daftar Siswa ({students.length})</span>
                            </h3>
                            <div className="flex space-x-2 outline-none">
                                {['H', 'I', 'S', 'A'].map(status => (
                                    <div key={status} className="flex items-center space-x-1">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[0]}`}></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">Siswa</th>
                                        <th className="px-6 py-4 text-center">Status Kehadiran</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                                                        {student.nama[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{student.nama}</p>
                                                        <p className="text-[10px] text-gray-400">NISN: {student.nisn}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    {['H', 'I', 'S', 'A'].map((s) => (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleStatusChange(student.id, s)}
                                                            className={`w-10 h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${student.status === s
                                                                    ? getStatusColor(s) + ' shadow-lg shadow-current/20 scale-110'
                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                                }`}
                                                            title={statusLabels[s]}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-700">
                            <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
                                <div className="flex items-center space-x-2">
                                    <span className="text-emerald-500 font-black">{students.filter(s => s.status === 'H').length}</span>
                                    <span>Hadir</span>
                                </div>
                                <div className="flex items-center space-x-2 text-blue-500">
                                    <span className="font-black">{students.filter(s => s.status === 'I').length}</span>
                                    <span>Izin</span>
                                </div>
                                <div className="flex items-center space-x-2 text-amber-500">
                                    <span className="font-black">{students.filter(s => s.status === 'S').length}</span>
                                    <span>Sakit</span>
                                </div>
                                <div className="flex items-center space-x-2 text-rose-500">
                                    <span className="font-black">{students.filter(s => s.status === 'A').length}</span>
                                    <span>Alpha</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PresensiSiswa;
