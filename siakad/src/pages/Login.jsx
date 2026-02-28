import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [siteSettings, setSiteSettings] = useState({
        welcome_title: 'Pantau Akademik <br /><span className="text-indigo-200 italic font-serif">Lebih Mudah & Cepat.</span>',
        welcome_subtitle: 'Akses data nilai, absen, dan tugas dalam satu platform yang terintegrasi dan aman.'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
                const response = await fetch(`${apiUrl}/api/settings`);
                const data = await response.json();
                if (response.ok) {
                    setSiteSettings(data);
                }
            } catch (err) {
                console.error("Gagal memuat pengaturan site.");
            }
        };
        fetchSettings();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
            const response = await fetch(`${apiUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('siakad_token', data.token);
                localStorage.setItem('siakad_user', JSON.stringify(data.user));
                toast.success(`Selamat datang, ${data.user.nama_lengkap}!`);

                if (data.user.role === 'admin') navigate('/');
                else if (data.user.role === 'guru') navigate('/guru/dashboard');
                else navigate('/siswa/dashboard');
            } else {
                toast.error(data.error || 'Login gagal, periksa kembali akun Anda.');
            }
        } catch (err) {
            console.error('Login error:', err);
            toast.error('Gagal terhubung ke server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 overflow-x-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 w-full">

                {/* Sisi Kiri: Informasi (Sama dengan Register) */}
                <div className="hidden lg:flex flex-col justify-between p-16 relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white overflow-hidden min-h-screen">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-700"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-16">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
                                <FaGraduationCap size={28} className="text-white" />
                            </div>
                            <span className="text-3xl font-black tracking-tighter uppercase">SIAS PRO</span>
                        </div>

                        <div className="max-w-md">
                            <h2
                                className="text-5xl font-black leading-[1.1] mb-8"
                                dangerouslySetInnerHTML={{ __html: siteSettings.welcome_title }}
                            />
                            <p className="text-xl text-indigo-100/70 leading-relaxed mb-12">
                                {siteSettings.welcome_subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/10 flex items-center justify-between">
                        <p className="text-sm font-semibold text-indigo-100/40 uppercase tracking-[0.2em]">SISTEM AKADEMIK TERINTEGRASI</p>
                    </div>
                </div>

                {/* Sisi Kanan: Form Login (Harus identik style-nya dengan Register) */}
                <div className="flex flex-col justify-center items-center bg-white dark:bg-slate-900 p-8 sm:p-12 lg:px-20 relative overflow-y-auto min-h-screen">
                    <div className="w-full max-w-xl relative z-10">

                        {/* Mobile Logo */}
                        <div className="lg:hidden flex items-center space-x-3 mb-10 text-center justify-center">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                                <FaGraduationCap size={20} className="text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">SIAS PRO</span>
                        </div>

                        <div className="mb-12 lg:text-left text-center">
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Login Portal</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Silakan masuk menggunakan kredensial akun akademik Anda.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Username Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 tracking-widest uppercase ml-1">Username / ID Akun</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <FaEnvelope size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white text-sm font-medium"
                                        placeholder="Masukkan username Anda"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-black text-slate-400 tracking-widest uppercase">Password</label>
                                    <Link to="#" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Lupa Password?</Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <FaLock size={14} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white text-sm font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Tombol Login */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transform transition-all active:scale-95 flex items-center justify-center space-x-3 mt-8 disabled:opacity-70 h-14"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Masuk Sekarang</span>
                                        <FaArrowRight size={14} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 text-center">
                            <p className="text-gray-500 dark:text-slate-400 font-bold text-sm tracking-wide">
                                Belum terdaftar? <Link to="/register" className="text-indigo-600 hover:underline ml-1">Daftar Akun Baru</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
