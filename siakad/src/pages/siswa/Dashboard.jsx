import React from 'react';
import { FaGraduationCap, FaCalendarCheck, FaWallet, FaBookReader, FaClock } from 'react-icons/fa';
import StatCard from '../../components/ui/StatCard';

const SiswaDashboard = () => {
    return (
        <div className="space-y-8 px-4 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Siswa</h1>
                <p className="text-gray-500 dark:text-gray-400">Selamat datang kembali, Ari Setiawan. Tetap semangat belajarnya ya!</p>
            </div>

            {/* Premium Stat Cards for Students */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Rata-rata Nilai"
                    value="86.5"
                    icon={FaGraduationCap}
                    color="blue"
                    trend="+2.1 poin"
                    description="Peningkatan dari semester ganjil lalu."
                    badgeText="AKADEMIK"
                />
                <StatCard
                    title="Kehadiran (Presensi)"
                    value="98.2%"
                    icon={FaCalendarCheck}
                    color="emerald"
                    description="Total kehadiran di kelas semester ini."
                    badgeText="PRESENSI"
                />
                <StatCard
                    title="Status Administrasi"
                    value="Lunas"
                    icon={FaWallet}
                    color="purple"
                    description="Status pembayaran SPP bulan Februari."
                    badgeText="KEUANGAN"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Jadwal Pelajaran Hari Ini */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                                <FaClock size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Jadwal Pelajaran Hari Ini</h3>
                        </div>
                        <span className="text-xs font-bold text-gray-400">X MIPA 1</span>
                    </div>
                    <div className="space-y-4">
                        {[
                            { jam: "07:30 - 09:00", mapel: "Matematika Wajib", guru: "Bpk. Bambang, S.Pd", status: "Selesai" },
                            { jam: "09:15 - 10:45", mapel: "Bahasa Inggris", guru: "Ibu. Siti, M.Pd", status: "Sedang Berlangsung" },
                            { jam: "11:00 - 12:30", mapel: "Fisika", guru: "Bpk. Heru, M.Si", status: "Mendatang" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
                                <div className="flex items-center space-x-4">
                                    <div className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded w-20 text-center">
                                        {item.jam}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{item.mapel}</p>
                                        <p className="text-[10px] text-gray-500">{item.guru}</p>
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${item.status === 'Selesai' ? 'bg-emerald-500' :
                                    item.status === 'Sedang Berlangsung' ? 'bg-amber-500 animate-ping' :
                                        'bg-blue-300'
                                    }`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tugas & Ujian Mendatang */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
                                <FaBookReader size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Tugas & Ujian Mendatang</h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { tugas: "PR Logaritma", mapel: "Matematika", deadline: "Besok, 08:00", sisa: "18 jam lagi" },
                            { tugas: "Laporan Praktikum", mapel: "Biologi", deadline: "10 Feb 2026", sisa: "4 hari lagi" },
                            { tugas: "Ulangan Harian 1", mapel: "Sejarah Dunia", deadline: "12 Feb 2026", sisa: "6 hari lagi" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center space-x-4 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-700/10">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.tugas}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase">{item.mapel}</span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap italic">• Deadline: {item.deadline}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter whitespace-nowrap bg-rose-50 px-1 py-0.5 rounded">
                                        {item.sisa}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiswaDashboard;
