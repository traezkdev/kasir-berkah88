import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogIn, FiUserPlus, FiArrowRight, FiShoppingBag, FiHome, FiChevronLeft, FiCheckCircle, FiStar, FiZap } from 'react-icons/fi';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import AppIcon from '../../components/AppIcon';

const AuthHome = () => {
    const navigate = useNavigate();
    const { logoUrl, headerTitle } = useAppSettings();
    const [activeSlide, setActiveSlide] = useState(0);

    const onboardingData = [
        {
            id: '1',
            title: 'Assalamu’alaikum',
            description: `Telah hadir ${headerTitle || 'Berkah 88'} buat nemenin hari kamu dengan menu-menu pilihan yang insyaAllah berkah.`,
            icon: 'Star'
        },
        {
            id: '2',
            title: 'Menu Penuh Berkah',
            description: 'Banyak pilihan menu halal dan lezat yang siap bikin lidah kamu happy setiap hari.',
            icon: 'ShoppingBag'
        },
        {
            id: '3',
            title: 'Layanan Amanah',
            description: 'Gak perlu antre lama, pesanan kamu langsung kami proses dengan cepat dan jujur.',
            icon: 'Zap'
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % onboardingData.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [onboardingData.length]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) navigate('/main-dashboard');
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#059669] lg:bg-white dark:lg:bg-gray-950 relative overflow-hidden font-sans transition-colors duration-500">

            {/* MOBILE UI */}
            <div className="lg:hidden min-h-screen flex flex-col bg-gradient-to-b from-[#059669] via-[#065F46] to-[#064E3B]">
                {/* Header Navigation */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                    <Link to="/" className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform">
                        <FiHome size={20} />
                    </Link>
                    <span className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase">
                        {headerTitle || 'BERKAH 88'}
                    </span>
                </div>

                <main className="flex-grow flex flex-col justify-center px-8 pt-20">
                    {/* Brand Section */}
                    <div className="flex flex-col items-center mb-8">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-[80px] h-[80px] bg-white/10 rounded-[24px] p-4 flex items-center justify-center mb-8 border border-white/20 backdrop-blur-xl"
                        >
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <img src="/assets/images/logoberkah88.png" alt="Logo" className="w-full h-full object-contain" />
                            )}
                        </motion.div>

                        <div className="relative h-40 w-full">
                            <AnimatePresence mode="wait">
                                {onboardingData.map((slide, index) => (activeSlide === index && (
                                    <motion.div
                                        key={slide.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="absolute inset-0 flex flex-col items-center text-center"
                                    >
                                        <h1 className="text-3xl font-black text-white tracking-tight mb-3">
                                            {slide.title}
                                        </h1>
                                        <p className="text-white/70 text-sm font-medium leading-relaxed max-w-[260px]">
                                            {slide.description}
                                        </p>
                                    </motion.div>
                                )))}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-2">
                            {onboardingData.map((_, index) => (
                                <div key={index} className={`h-1.5 rounded-full transition-all duration-500 ${activeSlide === index ? 'w-8 bg-emerald-400' : 'w-2 bg-white/20'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-4 mb-12">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/login')}
                            className="w-full h-[64px] bg-white rounded-[22px] flex items-center justify-between px-8 shadow-xl shadow-black/10 transition-all"
                        >
                            <span className="text-[#059669] font-black text-sm tracking-widest uppercase">Masuk Akun Member</span>
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                <FiLogIn size={18} />
                            </div>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/guest-checkout')}
                            className="w-full h-[64px] bg-emerald-500 text-white rounded-[22px] flex items-center justify-between px-8 shadow-xl shadow-emerald-900/20 transition-all border border-emerald-400/30"
                        >
                            <span className="font-black text-sm tracking-widest uppercase">Pesan Sebagai Guest</span>
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                                <FiShoppingBag size={18} />
                            </div>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/register')}
                            className="w-full h-[64px] bg-transparent border-2 border-white/20 text-white rounded-[22px] flex items-center justify-center font-black text-sm tracking-widest uppercase hover:bg-white/5 transition-all"
                        >
                            Bismillah, Daftar Member
                        </motion.button>
                    </div>

                    <div className="text-center pb-8">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                            {headerTitle || 'BERKAH 88'} &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </main>
            </div>

            {/* DESKTOP UI (Split Screen) */}
            <main className="hidden lg:grid grid-cols-2 min-h-screen relative z-10">
                {/* Left Side: Branding & Onboarding */}
                <div className="bg-emerald-600 dark:bg-emerald-900 relative flex flex-col justify-center p-20 text-white overflow-hidden">
                    {/* Background Decor */}
                    <div className="absolute inset-0 pointer-events-none opacity-10">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] h-full w-full"></div>
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }}
                        transition={{ duration: 15, repeat: Infinity }}
                        className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px]"
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], rotate: [0, -5, 0] }}
                        transition={{ duration: 18, repeat: Infinity }}
                        className="absolute -bottom-20 -right-20 w-96 h-96 bg-green-300/20 rounded-full blur-[100px]"
                    />

                    <div className="relative z-10 max-w-lg">
                        <motion.div
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] p-5 mb-12 flex items-center justify-center"
                        >
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <img src="/assets/images/logoberkah88.png" alt="Logo" className="w-full h-full object-contain" />
                            )}
                        </motion.div>

                        <div className="h-80 flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                {onboardingData.map((slide, index) => (activeSlide === index && (
                                    <motion.div
                                        key={slide.id}
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 50 }}
                                        className="flex flex-col"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                                                <AppIcon name={slide.icon} size={24} />
                                            </div>
                                            <span className="text-emerald-200 font-black text-xs uppercase tracking-[0.3em]">Fitur Utama</span>
                                        </div>
                                        <h1 className="text-6xl font-black tracking-tighter leading-[1.1] mb-6">
                                            {slide.title}
                                        </h1>
                                        <p className="text-xl text-emerald-50/80 font-medium leading-relaxed">
                                            {slide.description}
                                        </p>
                                    </motion.div>
                                )))}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-3 mt-12">
                            {onboardingData.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveSlide(index)}
                                    className={`h-2 rounded-full transition-all duration-500 ${activeSlide === index ? 'w-12 bg-white' : 'w-2 bg-white/30'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="absolute bottom-12 left-20">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">
                            Dibuat k berkah 88 &copy; 2026
                        </p>
                    </div>
                </div>

                {/* Right Side: Action Portal */}
                <div className="bg-white dark:bg-gray-950 flex flex-col justify-center p-20 transition-colors duration-500">
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="max-w-md w-full mx-auto"
                    >
                        <div className="mb-14">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-3 leading-none">SELAMAT DATANG</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Pilih jalur akses Anda untuk mulai memesan hidangan penuh berkah.</p>
                        </div>

                        <div className="space-y-6">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/login')}
                                className="w-full h-[84px] bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-[28px] flex items-center justify-between px-10 shadow-sm hover:shadow-xl transition-all group"
                            >
                                <div className="flex flex-col items-start translate-x-0 group-hover:translate-x-1 transition-transform">
                                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Sudah Punya Akun</span>
                                    <span className="text-gray-900 dark:text-white font-black text-lg">Masuk Sebagai Member</span>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                    <FiLogIn size={20} />
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/guest-checkout')}
                                className="w-full h-[84px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-[28px] flex items-center justify-between px-10 transition-all group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-emerald-200 text-[10px] font-black uppercase tracking-widest mb-1">Tanpa Registrasi</span>
                                    <span className="text-white font-black text-lg">Order Sebagai Guest</span>
                                </div>
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                                    <FiShoppingBag size={20} />
                                </div>
                            </motion.button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase font-black tracking-[0.3em] text-gray-300 dark:text-gray-600">
                                    <span className="bg-white dark:bg-gray-950 px-4 italic leading-tight">Mulai Perjalananmu</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/register')}
                                className="w-full h-[84px] bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white rounded-[28px] flex items-center justify-center font-black text-sm tracking-[0.2em] uppercase hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-dashed border-gray-200 dark:border-gray-800"
                            >
                                <FiUserPlus className="mr-3" size={20} />
                                Bismillah, Daftar Member
                            </motion.button>
                        </div>

                        <div className="mt-16 text-center">
                            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-600 font-bold transition-all text-sm group">
                                <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Halaman utama
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default AuthHome;
