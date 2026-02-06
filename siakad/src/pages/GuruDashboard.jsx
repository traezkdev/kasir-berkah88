import React from 'react';
import { FaChalkboardTeacher, FaUsers, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import StatCard from '../components/ui/StatCard';

const GuruDashboard = () => {
    return (
        <div className="space-y-8 px-4 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Guru</h1>
                <p className="text-gray-500 dark:text-gray-400">Selamat datang, Bapak/Ibu Guru. Pantau jadwal KBM dan perkembangan siswa wali Anda.</p>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Jam Mengajar Hari Ini"
                    value="6 Jam"
                    icon={FaChalkboardTeacher}
                    color="indigo"
                    trend="+2 dari kemarin"
                    description="Total jam pelajaran (JP) terjadwal hari ini."
                    badgeText="GURU"
                />
                <StatCard
                    title="Siswa Wali (Wali Kelas)"
                    value="36 Siswa"
                    icon={FaUsers}
                    color="purple"
                    description="Jumlah siswa di kelas yang Anda ampu (X MIPA 1)."
                    badgeText="WALI"
                />
                <StatCard
                    title="Rata-rata Nilai Mapel"
                    value="78.5"
                    icon={FaChartLine}
                    color="emerald"
                    trend="+2.4 poin"
                    description="Rata-rata nilai tugas & ujian seluruh kelas."
                    badgeText="NILAI"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Jadwal Mengajar */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                                <FaCalendarAlt size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Jadwal KBM Hari Ini</h3>
                        </div>
                        <button className="text-sm text-indigo-600 font-medium hover:underline">Lihat Jadwal</button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { jam: "07:30 - 09:00", mapel: "Matematika Wajib", kelas: "X MIPA 1", status: "Selesai" },
                            { jam: "09:15 - 10:45", mapel: "Matematika Peminatan", kelas: "XII MIPA 2", status: "Sedang Berlangsung" },
                            { jam: "11:00 - 12:30", mapel: "Matematika Wajib", kelas: "XI MIPA 3", status: "Mendatang" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
                                <div className="flex items-center space-x-4">
                                    <div className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md w-24 text-center">
                                        {item.jam}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{item.mapel}</p>
                                        <p className="text-xs text-gray-500">{item.kelas}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider ${item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600' :
                                    item.status === 'Sedang Berlangsung' ? 'bg-amber-50 text-amber-600 animate-pulse' :
                                        'bg-blue-50 text-blue-600'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Siswa Bermasalah / Butuh Perhatian - Context SMA */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600">
                                <FaUsers size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Butuh Perhatian (Presensi)</h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { nama: "Farhan Malik", info: "Tidak hadir 3 hari tanpa keterangan", label: "Alpha" },
                            { nama: "Lina Marlina", info: "Terlambat di jam pelajaran pertama", label: "Terlambat" },
                            { nama: "Joko Susilo", info: "Nilai harian di bawah KKM (65)", label: "Akademik" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center space-x-4 p-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                    {item.nama[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.nama}</p>
                                    <p className="text-xs text-gray-500">{item.info}</p>
                                </div>
                                <span className="text-[8px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-black uppercase">{item.label}</span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-3 bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 text-sm font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        Buka Manajemen Wali Kelas
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuruDashboard;
