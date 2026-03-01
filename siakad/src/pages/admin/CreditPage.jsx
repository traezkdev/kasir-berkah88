import React, { useEffect, useRef, useState } from 'react';
import { FaInstagram, FaCode, FaHeart, FaLaptopCode, FaGraduationCap, FaShieldAlt, FaDatabase, FaPalette, FaMobileAlt, FaSun, FaMoon } from 'react-icons/fa';
import { SiReact, SiNodedotjs, SiMysql, SiVite, SiTailwindcss, SiJavascript } from 'react-icons/si';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const CreditPage = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [year] = useState(new Date().getFullYear());
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const techStack = [
        { icon: <SiReact size={28} />, name: 'React.js', desc: 'UI Framework', color: 'from-cyan-400 to-cyan-600' },
        { icon: <SiVite size={28} />, name: 'Vite', desc: 'Build Tool', color: 'from-purple-400 to-purple-600' },
        { icon: <SiNodedotjs size={28} />, name: 'Node.js', desc: 'Backend Runtime', color: 'from-green-400 to-green-600' },
        { icon: <SiMysql size={28} />, name: 'MySQL', desc: 'Database', color: 'from-blue-400 to-blue-600' },
        { icon: <SiTailwindcss size={28} />, name: 'Tailwind CSS', desc: 'Styling', color: 'from-sky-400 to-sky-600' },
        { icon: <SiJavascript size={28} />, name: 'JavaScript', desc: 'Language', color: 'from-yellow-400 to-yellow-600' },
    ];

    const features = [
        { icon: <FaGraduationCap />, label: 'Manajemen Akademik', desc: 'Data siswa, guru, kelas & jadwal' },
        { icon: <FaDatabase />, label: 'Database Terintegrated', desc: 'MySQL dengan skema otomatis' },
        { icon: <FaShieldAlt />, label: 'Role-Based Access Control', desc: 'Admin, Guru, Siswa & Kasir' },
        { icon: <FaMobileAlt />, label: 'Responsive Design', desc: 'Optimal di semua perangkat' },
        { icon: <FaPalette />, label: 'Dark / Light Mode', desc: 'Tema yang bisa disesuaikan' },
        { icon: <FaLaptopCode />, label: 'REST API', desc: 'Backend Express.js + JWT Auth' },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-hidden`}>
            {/* Toggle Theme Floating */}
            <button
                onClick={toggleTheme}
                className="fixed top-6 right-6 z-[100] p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all text-indigo-400"
            >
                {isDarkMode ? <FaSun size={20} className="text-yellow-400" /> : <FaMoon size={20} className="text-indigo-600" />}
            </button>

            {/* ── HERO ── */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Animated BG */}
                <div className="absolute inset-0">
                    <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-400/10'} rounded-full blur-[120px] animate-pulse`} />
                    <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-400/10'} rounded-full blur-[120px] animate-pulse delay-1000`} />
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${isDarkMode ? 'bg-indigo-900/10' : 'bg-indigo-200/5'} rounded-full blur-[150px]`} />
                </div>

                {/* Grid lines bg */}
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)]'} bg-[size:60px_60px]`} />

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className={`inline-flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-100 border-indigo-200'} border rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-10 backdrop-blur-sm`}>
                        <FaCode size={10} />
                        Developed with passion
                        <FaCode size={10} />
                    </div>

                    {/* Avatar placeholder */}
                    <div className="relative w-36 h-36 mx-auto mb-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] animate-spin-slow blur-sm opacity-70" style={{ animation: 'spin 8s linear infinite' }} />
                        <div className={`relative w-full h-full ${isDarkMode ? 'bg-slate-900' : 'bg-white'} rounded-[2.5rem] border ${isDarkMode ? 'border-white/10' : 'border-slate-200'} flex items-center justify-center overflow-hidden shadow-2xl`}>
                            <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30' : 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50'}`} />
                            <span className={`relative text-5xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter select-none`}>AF</span>
                        </div>
                    </div>

                    {/* Dev name */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-3 leading-none">
                        <span className={`bg-gradient-to-r ${isDarkMode ? 'from-white via-indigo-300 to-pink-400' : 'from-slate-900 via-indigo-600 to-pink-600'} bg-clip-text text-transparent`}>
                            M. ALFIN FIRDAUS
                        </span>
                    </h1>

                    <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-bold text-xl tracking-[0.2em] uppercase mb-2 mt-4`}>
                        Full-Stack Developer
                    </p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-black text-sm tracking-[0.4em] uppercase mb-10">
                        traezkdev
                    </p>

                    {/* Social link */}
                    <a
                        href="https://instagram.com/alfinf1rdaus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-pink-500/30 hover:scale-105 hover:shadow-pink-500/50 transition-all duration-300 active:scale-95 text-white"
                    >
                        <FaInstagram size={18} />
                        @alfinf1rdaus
                    </a>
                </div>

                {/* Scroll indicator */}
                <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-[10px] font-black uppercase tracking-widest animate-bounce`}>
                    <div className="w-px h-12 bg-gradient-to-b from-transparent to-indigo-500" />
                    <span>Scroll</span>
                </div>
            </div>

            {/* ── ABOUT PROJECT ── */}
            <div className={`py-24 px-6 ${isDarkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
                <div className="max-w-5xl mx-auto text-center">
                    <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Tentang Proyek</p>
                    <h2 className={`text-4xl sm:text-5xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-8 leading-tight`}>
                        SIAS PRO
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"> — Sistem Informasi</span>
                        <br />Akademik Sekolah
                    </h2>
                    <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-lg leading-relaxed max-w-2xl mx-auto font-medium`}>
                        Platform manajemen akademik modern yang dibangun untuk mempermudah pengelolaan data sekolah secara digital, efisien, dan terstruktur — dari data siswa hingga laporan nilai.
                    </p>
                </div>
            </div>

            {/* ── TECH STACK ── */}
            <div className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Dibangun dengan</p>
                        <h2 className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Tech Stack</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {techStack.map((tech, i) => (
                            <div
                                key={i}
                                className={`group relative p-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl border hover:border-indigo-500/50 transition-all duration-300 hover:scale-[1.03] overflow-hidden shadow-sm`}
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${tech.color} opacity-5 rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity blur-2xl`} />
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center text-white shadow-xl mb-4`}>
                                    {tech.icon}
                                </div>
                                <h3 className={`${isDarkMode ? 'text-white' : 'text-slate-900'} font-black text-lg leading-none mb-1`}>{tech.name}</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{tech.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── FEATURES ── */}
            <div className={`py-24 px-6 ${isDarkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Fitur Utama</p>
                        <h2 className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Yang Dibangun</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((f, i) => (
                            <div key={i} className={`flex items-start gap-4 p-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-3xl border hover:border-purple-500/40 transition-all group shadow-sm`}>
                                <div className={`p-3 ${isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'} rounded-2xl group-hover:bg-purple-500/20 transition-colors shrink-0 text-lg`}>
                                    {f.icon}
                                </div>
                                <div>
                                    <h4 className={`${isDarkMode ? 'text-white' : 'text-slate-800'} font-black text-sm mb-1`}>{f.label}</h4>
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CREDIT CARD ── */}
            <div className="py-24 px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="relative p-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/30 text-center text-white">
                        {/* Deco */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-24 -mt-24 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 rounded-full text-white/80 text-[10px] font-black uppercase tracking-widest">
                                <FaHeart size={10} className="text-pink-300 animate-pulse" />
                                Made with passion
                            </div>

                            <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20">
                                <span className="text-3xl font-black text-white">AF</span>
                            </div>

                            <h3 className="text-3xl font-black text-white mb-1 tracking-tight">M. ALFIN FIRDAUS</h3>
                            <p className="text-white/60 font-black text-sm uppercase tracking-[0.3em] mb-6">traezkdev</p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <a
                                    href="https://instagram.com/alfinf1rdaus"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-105"
                                >
                                    <FaInstagram size={14} />
                                    @alfinf1rdaus
                                </a>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/20">
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                                    © {year} SIAS PRO — All rights reserved
                                </p>
                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">
                                    Developed by traezkdev
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FOOTER NAV ── */}
            <div className={`py-10 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} text-center px-6`}>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">SIAS PRO v1.0.0</p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors text-sm font-black uppercase tracking-widest"
                >
                    ← Kembali ke Dashboard
                </Link>
            </div>
        </div>
    );
};

export default CreditPage;
