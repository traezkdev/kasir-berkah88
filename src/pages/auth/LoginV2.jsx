import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiArrowRight, FiAlertCircle, FiChevronLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import AppIcon from '../../components/AppIcon';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { setOneSignalUser } from '../../utils/oneSignal';

const apiUrl = import.meta.env.VITE_API_URL;

const LoginV2 = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { logoUrl, headerTitle } = useAppSettings();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const userRole = decodedToken.role;
                if (userRole === 'kasir') navigate('/cashier-dashboard');
                else if (userRole === 'owner') navigate('/owner-dashboard');
                else if (userRole === 'pelanggan') navigate('/customer/dashboard');
                else if (userRole === 'penjual') navigate('/seller/dashboard');
                else navigate('/main-dashboard');
            } catch (error) {
                console.error("Error decoding token:", error);
                localStorage.removeItem('token');
            }
        }
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authFetch(`${apiUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                const decodedToken = jwtDecode(data.token);
                localStorage.setItem('userId', decodedToken.userId);
                localStorage.setItem('role', decodedToken.role);
                localStorage.setItem('username', decodedToken.username || formData.username);

                setOneSignalUser(decodedToken.userId);
                const userRole = decodedToken.role;
                if (userRole === 'kasir') navigate('/cashier-dashboard');
                else if (userRole === 'owner') navigate('/owner-dashboard');
                else if (userRole === 'pelanggan') navigate('/customer/dashboard');
                else if (userRole === 'penjual') navigate('/seller/dashboard');
                else navigate('/main-dashboard');
            } else {
                setError(data.error || 'Login gagal. Periksa kembali username dan password Anda.');
            }
        } catch (err) {
            setError('Kesalahan jaringan atau server tidak dapat dijangkau');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#059669] lg:bg-white dark:lg:bg-gray-950 relative overflow-hidden font-sans transition-colors duration-500">

            {/* MOBILE UI (Matches LoginScreen.js) */}
            <div className="lg:hidden min-h-screen flex flex-col bg-gradient-to-b from-[#059669] via-[#065F46] to-[#064E3B]">
                {/* Header Area */}
                {/* Header Area (Absolute for scroll effect) */}
                <div className="absolute top-0 left-0 right-0 p-6 z-50">
                    <button
                        onClick={() => navigate('/auth')}
                        className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform"
                    >
                        <FiChevronLeft size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow flex flex-col justify-center px-8 pb-12 pt-24 overflow-y-auto h-screen relative z-10">
                    {/* Branding */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-[70px] h-[70px] bg-white/15 rounded-[20px] flex items-center justify-center mb-6">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-[60%] h-[60%] object-contain" />
                            ) : (
                                <img src="/assets/images/logoberkah88.png" alt="Logo" className="w-[60%] h-[60%] object-contain" />
                            )}
                        </div>
                        <h2 className="text-white text-3xl font-black mb-2 text-center">Bismillah, Masuk Yuk</h2>
                        <p className="text-white/70 text-sm font-semibold text-center leading-relaxed">
                            Ayo lanjutin pesanan kamu dengan masuk ke akun
                        </p>
                    </div>

                    {/* Form Area */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-white text-[10px] font-extrabold uppercase tracking-widest ml-1">Nama Pengguna</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <FiUser className="text-emerald-300" size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Masukkan nama pengguna"
                                    required
                                    className="w-full h-[58px] bg-white/15 border border-white/20 rounded-[18px] py-4 pl-14 pr-6 text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white text-[10px] font-extrabold uppercase tracking-widest ml-1">Kata Sandi</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <FiLock className="text-emerald-300" size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Masukkan kata sandi"
                                    required
                                    className="w-full h-[58px] bg-white/15 border border-white/20 rounded-[18px] py-4 pl-14 pr-12 text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all font-sans"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="text-right">
                            <Link to="/forgot-password" size={13} className="text-white font-bold text-sm">
                                Lupa Kata Sandi?
                            </Link>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-3">
                                    <FiAlertCircle className="text-white" />
                                    <p className="text-white text-xs font-bold">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-[58px] bg-white rounded-[18px] flex items-center justify-center shadow-lg active:scale-95 transition-all"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="text-[#059669] font-black text-base">Bismillah, Masuk</span>
                                    <div className="w-6 h-6 bg-emerald-600/10 rounded-lg flex items-center justify-center">
                                        <FiArrowRight size={16} className="text-[#059669]" />
                                    </div>
                                </div>
                            )}
                        </button>

                        <div className="flex justify-center gap-1.5 pt-4">
                            <span className="text-white/70 text-sm font-semibold">Belum punya akun?</span>
                            <Link to="/register" className="text-white font-black text-sm">Daftar Disini</Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 text-center">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        © 2026 {headerTitle || 'Kasir Berkah 88'}. Aplikasi POS Premium.
                    </p>
                </div>
            </div>

            {/* DESKTOP UI (Split Screen) */}
            <main className="hidden lg:grid grid-cols-2 min-h-screen relative z-10">
                {/* Left Side: Brand Decor */}
                <div className="flex flex-col justify-center p-16 text-white bg-emerald-600 dark:bg-emerald-900 relative">
                    {/* Background decor (preserved) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    </div>

                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
                        <div className="w-20 h-20 flex items-center justify-center mb-10 overflow-hidden">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <img src="/assets/images/logoberkah88.png" alt="Logo" className="w-full h-full object-contain" />
                            )}
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-tight mb-6">
                            {headerTitle || 'Kasir Berkah 88'} <br />
                            <span className="text-emerald-100 dark:text-emerald-200 uppercase text-3xl">Portal Masuk</span>
                        </h1>
                        <p className="text-xl text-emerald-50/80 font-medium mb-12 max-w-sm leading-relaxed">
                            Akses dashboard manajemen bisnis Anda dengan keamanan tingkat tinggi.
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: 'Zap', text: 'Performa Super Cepat' },
                                { icon: 'PieChart', text: 'Analisa Bisnis Berkah' },
                                { icon: 'ShieldCheck', text: 'Enkripsi Data Aman' }
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-all duration-300 shadow-lg">
                                        <AppIcon name={feature.icon} size={20} />
                                    </div>
                                    <span className="text-lg font-bold text-white/90">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Form */}
                <div className="flex flex-col justify-center p-16 bg-white dark:bg-gray-950 transition-colors duration-500 relative">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-auto">
                        <div className="mb-12">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2 leading-none">SELAMAT DATANG</h2>
                            <p className="text-base text-gray-500 dark:text-gray-400 font-medium">Masukkan kredensial Anda untuk melanjutkan</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <FiUser className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="Username"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl py-4 pl-14 pr-6 text-sm lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <FiLock className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl py-4 pl-14 pr-12 text-sm lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 font-sans"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="text-right">
                                <Link to="/forgot-password" title="Lupa Password" className="text-xs text-emerald-600 dark:text-emerald-400 font-black hover:underline underline-offset-4 uppercase tracking-tighter">
                                    Lupa Password?
                                </Link>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-2xl flex items-center gap-3">
                                        <FiAlertCircle className="text-red-500 flex-shrink-0" />
                                        <p className="text-red-700 dark:text-red-400 text-xs font-bold leading-tight">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-3xl shadow-xl shadow-emerald-200 dark:shadow-none transform active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="flex items-center gap-3 uppercase tracking-[0.2em] text-sm font-black">
                                        Masuk <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium font-sans">
                                Belum punya akun?
                                <Link to="/register" className="text-emerald-600 dark:text-emerald-400 font-black hover:underline underline-offset-4 ml-2 uppercase tracking-tight">
                                    Daftar Sekarang
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default LoginV2;
