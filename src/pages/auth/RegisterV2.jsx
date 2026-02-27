import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiArrowRight, FiCheckCircle, FiAlertCircle, FiPhone, FiMapPin, FiMail, FiChevronLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import AppIcon from '../../components/AppIcon';
import { useAppSettings } from '../../contexts/AppSettingsContext';

const apiUrl = import.meta.env.VITE_API_URL;

const RegisterV2 = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const { logoUrl, headerTitle } = useAppSettings();

    useEffect(() => {
        const fetchRegistrationSetting = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/settings`);
                const data = await response.json();
                if (response.ok) {
                    setRegistrationEnabled(data.data.registration_enabled === 'true');
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            }
        };
        fetchRegistrationSetting();

        const token = localStorage.getItem('token');
        if (token) navigate('/main-dashboard');
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Konfirmasi kata sandi tidak cocok.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await authFetch(`${apiUrl}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    phone: formData.phone,
                    address: formData.address,
                    email: formData.email || null
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Pendaftaran berhasil! Mengalihkan ke halaman masuk...');
                setFormData({ username: '', email: '', phone: '', address: '', password: '', confirmPassword: '' });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.error || 'Pendaftaran gagal');
            }
        } catch (err) {
            setError('Kesalahan jaringan');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#059669] lg:bg-white dark:lg:bg-gray-950 relative overflow-hidden font-sans transition-colors duration-500">

            {/* MOBILE UI (Matches RegisterScreen.js) */}
            <div className="lg:hidden min-h-screen flex flex-col bg-gradient-to-b from-[#059669] via-[#065F46] to-[#064E3B]">
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
                <div className="flex-grow flex flex-col px-8 pb-12 pt-24 overflow-y-auto h-screen relative z-10">
                    <div className="py-4">
                        {/* Branding */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-[60px] h-[60px] bg-white/15 rounded-[18px] flex items-center justify-center mb-5">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-[60%] h-[60%] object-contain" />
                                ) : (
                                    <img src="/assets/images/logoberkah88.png" alt="Logo" className="w-[60%] h-[60%] object-contain" />
                                )}
                            </div>
                            <h2 className="text-white text-2xl font-black mb-1.5 text-center">Jadi Member Berkah</h2>
                            <p className="text-white/70 text-xs font-semibold text-center leading-relaxed max-w-[250px]">
                                Yuk bikin akun biar jajan makin asik dan insyaAllah berkah
                            </p>
                        </div>

                        {registrationEnabled ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Form Groups */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-white text-[10px] font-extrabold uppercase tracking-widest ml-1">Nama Pengguna</label>
                                        <div className="relative">
                                            <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                placeholder="Pilih nama pengguna"
                                                required
                                                className="w-full h-[54px] bg-white/15 border border-white/20 rounded-2xl py-3 pl-14 pr-6 text-white text-sm font-semibold placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-white text-[10px] font-extrabold uppercase tracking-widest ml-1">Email (Opsional)</label>
                                        <div className="relative">
                                            <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="email@contoh.com"
                                                className="w-full h-[54px] bg-white/15 border border-white/20 rounded-2xl py-3 pl-14 pr-6 text-white text-sm font-semibold placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-white text-[10px] font-extrabold uppercase tracking-widest ml-1">Nomor Telepon</label>
                                        <div className="relative">
                                            <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="Nomor WhatsApp aktif"
                                                required
                                                className="w-full h-[54px] bg-white/15 border border-white/20 rounded-2xl py-3 pl-14 pr-6 text-white text-sm font-semibold placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-white text-[10px] font-extrabold uppercase tracking-widest ml-1">Alamat</label>
                                        <div className="relative">
                                            <FiMapPin className="absolute left-5 top-4 text-emerald-300" size={18} />
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                placeholder="Alamat lengkap"
                                                required
                                                rows="2"
                                                className="w-full bg-white/15 border border-white/20 rounded-2xl py-3 pl-14 pr-6 text-white text-sm font-semibold placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-white text-[10px] font-extrabold uppercase tracking-widest ml-1">Kata Sandi</label>
                                        <div className="relative">
                                            <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Minimal 6 karakter"
                                                required
                                                className="w-full h-[54px] bg-white/15 border border-white/20 rounded-2xl py-3 pl-14 pr-12 text-white text-sm font-semibold placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all font-sans"
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

                                    <div className="space-y-1.5">
                                        <label className="text-white text-[10px] font-extrabold uppercase tracking-widest ml-1">Konfirmasi Kata Sandi</label>
                                        <div className="relative">
                                            <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="Ketik ulang kata sandi"
                                                required
                                                className="w-full h-[54px] bg-white/15 border border-white/20 rounded-2xl py-3 pl-14 pr-12 text-white text-sm font-semibold placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all font-sans"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                            >
                                                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-3">
                                            <FiAlertCircle className="text-white" />
                                            <p className="text-white text-xs font-bold">{error}</p>
                                        </motion.div>
                                    )}
                                    {success && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3">
                                            <FiCheckCircle className="text-emerald-200" />
                                            <p className="text-emerald-100 text-xs font-bold">{success}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-[58px] bg-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all mt-4"
                                >
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span className="text-[#059669] font-black text-base uppercase tracking-tight">Bismillah, Daftar Sekarang</span>
                                            <div className="w-6 h-6 bg-emerald-600/10 rounded-lg flex items-center justify-center">
                                                <FiArrowRight size={16} className="text-[#059669]" />
                                            </div>
                                        </div>
                                    )}
                                </button>

                                <div className="flex justify-center gap-1.5 pt-4">
                                    <span className="text-white/70 text-sm font-semibold">Sudah punya akun?</span>
                                    <Link to="/login" className="text-white font-black text-sm">Masuk Disini</Link>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-white/10 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/20 text-center">
                                <AppIcon name="AlertTriangle" className="mx-auto text-white mb-4" size={48} />
                                <p className="text-white font-black uppercase tracking-tighter text-lg leading-tight">Pendaftaran <br /> Ditutup Sementara</p>
                                <p className="text-white/60 text-xs font-medium mt-3 px-4">Administrator sedang menonaktifkan fitur pendaftaran saat ini. Silakan hubungi admin.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 text-center mt-auto">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        © 2026 {headerTitle || 'Kasir Berkah 88'}. Mari Bergabung.
                    </p>
                </div>
            </div>

            {/* DESKTOP UI (Split Screen) */}
            <main className="hidden lg:grid grid-cols-2 min-h-screen relative z-10">
                {/* Left Side: Brand Decor */}
                <div className="flex flex-col justify-center p-16 text-white bg-emerald-600 dark:bg-emerald-900 relative">
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
                            Pesan Menu <br />
                            <span className="text-emerald-100">Favorit Anda</span>
                        </h1>
                        <p className="text-xl text-emerald-50/80 font-medium mb-10 max-w-sm">
                            Nikmati kemudahan memesan hidangan terbaik Berkah 88 langsung dari smartphone Anda.
                        </p>

                        <div className="space-y-4">
                            {['Menu Selalu Fresh & Berkah', 'Proses Pemesanan Kilat', 'Lacak Pesanan Real-time'].map((text, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                        <FiCheckCircle size={14} className="text-emerald-300" />
                                    </div>
                                    <span className="font-bold text-white/90">{text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Form */}
                <div className="flex flex-col justify-center p-16 bg-white dark:bg-gray-950 transition-colors duration-500 relative overflow-y-auto max-h-screen">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full mx-auto">
                        <div className="mb-10">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2 leading-none">MULAI PESANAN ANDA</h2>
                            <p className="text-base text-gray-500 dark:text-gray-400 font-medium">Lengkapi data Anda untuk mendapatkan pengalaman kuliner terbaik.</p>
                        </div>

                        {registrationEnabled ? (
                            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                                    <div className="relative group">
                                        <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            placeholder="Username"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. WhatsApp</label>
                                    <div className="relative group">
                                        <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="0812..."
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Opsional)</label>
                                    <div className="relative group">
                                        <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="email@bisnis.com"
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                                    <div className="relative group">
                                        <FiMapPin className="absolute left-5 top-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Masukkan alamat lengkap..."
                                            required
                                            rows="2"
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                    <div className="relative group">
                                        <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="••••••••"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-14 pr-12 text-sm font-black focus:outline-none focus:border-emerald-500 transition-all font-sans"
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

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Konfirmasi</label>
                                    <div className="relative group">
                                        <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="••••••••"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-14 pr-12 text-sm font-black focus:outline-none focus:border-emerald-500 transition-all font-sans"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
                                        >
                                            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="col-span-2 pt-4">
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl flex items-center gap-3 mb-4">
                                                <FiAlertCircle className="text-red-500" />
                                                <p className="text-red-700 dark:text-red-400 text-xs font-bold">{error}</p>
                                            </motion.div>
                                        )}
                                        {success && (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl flex items-center gap-3 mb-4">
                                                <FiCheckCircle className="text-emerald-500" />
                                                <p className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">{success}</p>
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
                                                Daftar Sekarang <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-orange-50 dark:bg-orange-900/10 p-12 rounded-[2.5rem] border-2 border-orange-100 dark:border-orange-800/40 text-center">
                                <AppIcon name="AlertTriangle" className="mx-auto text-orange-500 mb-6" size={64} />
                                <p className="text-orange-900 dark:text-orange-400 font-black uppercase tracking-tighter text-2xl">Pendaftaran Ditutup</p>
                                <p className="text-orange-600 dark:text-orange-500/80 text-base font-medium mt-4">Administrator sedang menonaktifkan fitur pendaftaran saat ini. Silakan hubungi admin untuk bantuan.</p>
                            </div>
                        )}

                        <div className="mt-12 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                Sudah punya akun?
                                <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-black hover:underline underline-offset-4 ml-2 uppercase tracking-tight">
                                    Masuk Disini
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default RegisterV2;
