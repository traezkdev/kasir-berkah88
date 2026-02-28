import React from 'react';
import { FaCalendarCheck, FaCheckCircle, FaExclamationTriangle, FaClock, FaFilter } from 'react-icons/fa';

const SiswaAbsensi = () => {
    // Mock data rekap per mapel
    const rekapMapel = [
        { mapel: "Matematika Wajib", hadir: 24, izin: 2, sakit: 0, alpha: 0, persentase: 92 },
        { mapel: "Bahasa Inggris", hadir: 20, izin: 0, sakit: 1, alpha: 0, persentase: 95 },
        { mapel: "Fisika", hadir: 18, izin: 1, sakit: 0, alpha: 3, persentase: 81 },
    ];

    // Mock data riwayat harian
    const riwayatHarian = [
        { tanggal: "06 Feb 2026", jam: "07:30", mapel: "Matematika Wajib", status: "H", ket: "Hadir tepat waktu" },
        { tanggal: "05 Feb 2026", jam: "09:15", mapel: "Bahasa Inggris", status: "H", ket: "Hadir tepat waktu" },
        { tanggal: "04 Feb 2026", jam: "07:30", mapel: "Fisika", status: "A", ket: "Tanpa keterangan" },
        { tanggal: "03 Feb 2026", jam: "11:00", mapel: "Sejarah", status: "I", ket: "Acara keluarga" },
        { tanggal: "02 Feb 2026", jam: "07:30", mapel: "Matematika Wajib", status: "H", ket: "Hadir tepat waktu" },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'H': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'I': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'S': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'A': return 'bg-rose-100 text-rose-600 border-rose-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getStatusLabel = (status) => {
        const labels = { H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alpha' };
        return labels[status] || status;
    };

    return (
        <div className="space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Kehadiran Saya</h1>
                    <p className="text-gray-500 dark:text-gray-400">Pantau statistik dan catatan kehadiran Anda di setiap mata pelajaran.</p>
                </div>
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-gray-400 px-2 uppercase">Filter Semester:</span>
                    <select className="bg-transparent text-sm font-bold text-indigo-600 outline-none pr-4">
                        <option>Genap 2025/2026</option>
                        <option>Ganjil 2025/2026</option>
                    </select>
                </div>
            </div>

            {/* Statistik Ringkasan */}
            {/* Statistik Ringkasan Premium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card: Rata-rata Kehadiran */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-5 transition-all duration-300 h-full relative overflow-hidden group shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1">
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none gpu-acceleration bg-indigo-400"></div>
                    <div className="absolute -left-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white gpu-acceleration">
                        <FaCheckCircle size={100} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-6 lg:mb-4">
                            <div className="p-3.5 lg:p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-inner border flex items-center justify-center text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30">
                                <FaCheckCircle size={22} className="lg:size-[18px]" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30">KESELURUHAN</div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-gray-400 dark:text-slate-500 leading-none">Rata-rata Kehadiran</p>
                            <div className="flex items-baseline gap-1 mb-2 lg:mb-1">
                                <p className="text-2xl lg:text-xl font-black tracking-tighter leading-none text-gray-900 dark:text-white transition-all group-hover:scale-105 origin-left truncate">94.2%</p>
                                <span className="text-[10px] font-bold text-indigo-500 underline decoration-dotted">Sangat Baik</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 line-clamp-1 opacity-80 leading-tight">Performa kehadiran semester ini.</p>
                        </div>
                    </div>
                </div>

                {/* Card: Total Alpha */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-5 transition-all duration-300 h-full relative overflow-hidden group shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1">
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none gpu-acceleration bg-rose-400"></div>
                    <div className="absolute -left-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white gpu-acceleration">
                        <FaExclamationTriangle size={100} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-6 lg:mb-4">
                            <div className="p-3.5 lg:p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-inner border flex items-center justify-center text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30">
                                <FaExclamationTriangle size={22} className="lg:size-[18px]" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30">PERINGATAN</div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-gray-400 dark:text-slate-500 leading-none">Total Alpha</p>
                            <div className="flex items-baseline gap-1 mb-2 lg:mb-1">
                                <p className="text-2xl lg:text-xl font-black tracking-tighter leading-none text-gray-900 dark:text-white transition-all group-hover:scale-105 origin-left truncate">3</p>
                                <span className="text-[10px] font-bold text-rose-500 italic">Batas Maks: 5</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 line-clamp-1 opacity-80 leading-tight">Segera hubungi wali kelas jika berhalangan.</p>
                        </div>
                    </div>
                </div>

                {/* Card: Hari Masuk */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-5 transition-all duration-300 h-full relative overflow-hidden group shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1">
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none gpu-acceleration bg-emerald-400"></div>
                    <div className="absolute -left-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white gpu-acceleration">
                        <FaCalendarCheck size={100} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-6 lg:mb-4">
                            <div className="p-3.5 lg:p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-inner border flex items-center justify-center text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30">
                                <FaCalendarCheck size={22} className="lg:size-[18px]" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30">KBM</div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-gray-400 dark:text-slate-500 leading-none">Hari Masuk</p>
                            <div className="flex items-baseline gap-1 mb-2 lg:mb-1">
                                <p className="text-2xl lg:text-xl font-black tracking-tighter leading-none text-gray-900 dark:text-white transition-all group-hover:scale-105 origin-left truncate">104</p>
                                <span className="text-[10px] font-bold text-emerald-500">Dari 110 Hari</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 line-clamp-1 opacity-80 leading-tight">Total hari efektif semester berjalan.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Rekap Per Mapel */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Persentase Per Mata Pelajaran</h3>
                    <div className="space-y-6">
                        {rekapMapel.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{item.mapel}</span>
                                    <span className={`font-black ${item.persentase < 85 ? 'text-rose-500' : 'text-emerald-500'}`}>{item.persentase}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${item.persentase < 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${item.persentase}%` }}
                                    ></div>
                                </div>
                                <div className="flex space-x-4 text-[10px] font-bold text-gray-400 uppercase">
                                    <span>H: {item.hadir}</span>
                                    <span>I: {item.izin}</span>
                                    <span>S: {item.sakit}</span>
                                    <span>A: {item.alpha}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Riwayat Absensi Terakhir */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Catatan Harian</h3>
                        <button className="text-xs text-indigo-600 font-bold hover:underline">Lihat Semua</button>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                        {riwayatHarian.map((item, i) => (
                            <div key={i} className="p-4 flex items-center space-x-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all">
                                <div className="text-center min-w-[60px]">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{item.tanggal.split(' ')[1]}</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{item.tanggal.split(' ')[0]}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.mapel}</p>
                                    <p className="text-[10px] text-gray-500 flex items-center">
                                        <FaClock className="mr-1" /> {item.jam} • {item.ket}
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(item.status)}`}>
                                    {getStatusLabel(item.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiswaAbsensi;
