import React from 'react';
import { FaUserGraduate, FaChalkboardTeacher, FaBook, FaCalendarCheck } from 'react-icons/fa';
import StatCard from '../components/ui/StatCard';

const Dashboard = () => {
    return (
        <div className="space-y-8 px-4 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-all duration-300">Dashboard Admin Sekolah</h1>
                <p className="text-gray-500 dark:text-gray-400">Pusat Informasi Akademik Sekolah Terintegrasi (SIAS PRO).</p>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Siswa"
                    value="1,248"
                    icon={FaUserGraduate}
                    color="blue"
                    trend="+12% bln ini"
                    description="Jumlah siswa aktif terdaftar."
                    badgeText="SISWA"
                />
                <StatCard
                    title="Total Guru"
                    value="84"
                    icon={FaChalkboardTeacher}
                    color="indigo"
                    description="Tenaga pengajar aktif."
                    badgeText="GURU"
                />
                <StatCard
                    title="Mata Pelajaran"
                    value="32"
                    icon={FaBook}
                    color="purple"
                    description="Kurikulum aktif semester ini."
                    badgeText="MAPEL"
                />
                <StatCard
                    title="Pertemuan Hari Ini"
                    value="24"
                    icon={FaCalendarCheck}
                    color="pink"
                    trend="+4 kelas"
                    description="Jadwal KBM berlangsung hari ini."
                    badgeText="KBM"
                />
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Siswa Baru Terdaftar</h3>
                        <button className="text-sm text-indigo-600 font-medium hover:underline">Lihat Semua</button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: "Ari Setiawan", class: "X MIPA 1", date: "Hari ini" },
                            { name: "Dewi Lestari", class: "X IPS 2", date: "Kemarin" },
                            { name: "Rizky Ramadhan", class: "XI MIPA 3", date: "2 hari lalu" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                        {item.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.class}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">{item.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Agenda Sekolah Terdekat</h3>
                        <button className="text-sm text-indigo-600 font-medium hover:underline">Lihat Kalender</button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { title: "Ujian Tengah Semester", date: "15 Feb 2026", type: "Akademik" },
                            { title: "Rapat Orang Tua Murid", date: "20 Feb 2026", type: "Umum" },
                            { title: "Lomba Basket Antar Kelas", date: "22 Feb 2026", type: "Eskul" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center space-x-4 p-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                                <div className="text-center w-12">
                                    <p className="text-xs font-bold text-indigo-600 uppercase">{item.date.split(' ')[1]}</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{item.date.split(' ')[0]}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                                    <p className="text-xs text-gray-500">{item.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
