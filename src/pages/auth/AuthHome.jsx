import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogIn, FiUserPlus, FiArrowRight, FiShoppingBag, FiHome, FiChevronLeft } from 'react-icons/fi';
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
        },
        {
            id: '2',
            title: 'Menu Penuh Berkah',
            description: 'Banyak pilihan menu halal dan lezat yang siap bikin lidah kamu happy setiap hari.',
        },
        {
            id: '3',
            title: 'Layanan Amanah',
            description: 'Gak perlu antre lama, pesanan kamu langsung kami proses dengan cepat dan jujur.',
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#059669] via-[#065F46] to-[#064E3B] lg:bg-none lg:bg-[#059669] dark:lg:bg-[#064e3b] relative overflow-hidden font-sans transition-colors duration-700">
            {/* Desktop Background Elements (Hidden on Mobile) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: [0, 50, 0], y: [0, -50, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-300 dark:bg-emerald-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-20"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], x: [0, -70, 0], y: [0, 70, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-green-200 dark:bg-green-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"
                />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            </div>

            {/* Mobile Header Navigation (Hidden on Desktop) */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-start items-center z-50 lg:hidden">
                <Link to="/" className="text-white font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
                    <FiHome /> BERANDA
                </Link>
            </div>

            <main className="w-full lg:max-w-4xl px-4 lg:px-4 relative z-10 flex flex-col min-h-screen lg:min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center flex-grow pt-16 lg:pt-0">
                    {/* Brand Section / Carousel */}
                    <div className="text-white text-center lg:text-left flex flex-col items-center lg:items-start">
                        {/* Logo Wrapper (Transparent) */}
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            className="w-20 h-20 lg:w-32 lg:h-32 flex items-center justify-center mb-6 lg:mb-8 transition-all duration-500"
                        >
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-3 lg:p-4" />
                            ) : (
                                <img src="/assets/images/logoberkah88.png" alt="Logo" className="w-full h-full object-contain p-3 lg:p-4" />
                            )}
                        </motion.div>

                        {/* Branding Line (Mobile App Style) */}
                        <div className="flex flex-col items-center lg:items-start mb-4 lg:mb-0">
                            <span className="text-white text-[10px] lg:text-sm font-black tracking-[0.3em] uppercase mb-1.5 lg:mb-2 text-center">
                                {headerTitle || 'BERKAH 88'}
                            </span>
                            <div className="w-8 h-0.5 bg-emerald-400 rounded-full lg:hidden"></div>
                        </div>

                        {/* Carousel Content */}
                        <div className="relative h-48 lg:h-80 w-full flex flex-col justify-center overflow-hidden">
                            <AnimatePresence mode="wait">
                                {onboardingData.map((slide, index) => (activeSlide === index && (
                                    <motion.div
                                        key={slide.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="absolute inset-0 flex flex-col justify-center items-center lg:items-start"
                                    >
                                        <h1 className="text-2xl lg:text-6xl font-black tracking-tighter leading-tight mb-3 lg:mb-4 text-center lg:text-left">
                                            {slide.title}
                                        </h1>
                                        <p className="text-xs lg:text-xl text-white/80 font-semibold max-w-[280px] lg:max-w-md leading-relaxed text-center lg:text-left px-4 lg:px-0">
                                            {slide.description}
                                        </p>
                                    </motion.div>
                                )
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Dots */}
                        <div className="flex justify-center lg:justify-start gap-1.5 mb-6 lg:mb-10 pt-2 lg:pt-4">
                            {onboardingData.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveSlide(index)}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${activeSlide === index ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Action Section - Web Container Styled (Desktop) / Native Stacking (Mobile) */}
                    <div className="lg:bg-white/10 lg:backdrop-blur-3xl lg:border lg:border-white/20 p-6 lg:p-12 lg:rounded-[3.5rem] lg:shadow-2xl relative w-full mb-8 lg:mb-0">
                        {/* Mobile Welcome Title */}
                        <div className="mb-8 text-center lg:hidden">
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Mulai Pesanan</h2>
                            <p className="text-white/60 text-xs font-medium mt-1">Masuk atau daftar untuk berbelanja</p>
                        </div>

                        {/* Web Welcome Title (Visible on Desktop only) */}
                        <div className="mb-10 text-center hidden lg:block">
                            <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-3">Selamat Datang</h2>
                            <p className="text-emerald-100/60 font-medium">Pilih akses sesuai kebutuhan Anda</p>
                        </div>

                        <div className="space-y-4 w-full">
                            {/* Login Button (White Style) */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/login')}
                                className="w-full bg-white text-[#059669] h-14 lg:h-16 rounded-full lg:rounded-2xl flex items-center justify-center font-black text-sm tracking-widest shadow-lg hover:shadow-xl transition-all"
                            >
                                MASUK AKUN MEMBER
                            </motion.button>

                            {/* Guest Button (Gradient Style) */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/guest-checkout')}
                                className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-white h-14 lg:h-16 rounded-full lg:rounded-2xl flex items-center justify-center font-black text-sm tracking-widest shadow-lg hover:shadow-xl transition-all"
                            >
                                PESAN TANPA LOGIN (GUEST)
                            </motion.button>

                            {/* Register Button (Outline Style) */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/register')}
                                className="w-full bg-transparent text-white border-2 border-white/80 h-14 lg:h-16 rounded-full lg:rounded-2xl flex items-center justify-center font-black text-sm tracking-widest hover:bg-white/10 transition-all"
                            >
                                BISMILLAH, DAFTAR MEMBER
                            </motion.button>
                        </div>

                        {/* Mobile Terms & Privacy */}
                        <div className="mt-8 text-center lg:hidden">
                            <p className="text-[10px] text-white/60 font-medium">
                                Dengan melanjutkan, Anda menyetujui <br />
                                <span className="text-white underline decoration-emerald-400 underline-offset-4">Ketentuan Layanan</span> dan <span className="text-white underline decoration-emerald-400 underline-offset-4">Kebijakan Privasi</span>
                            </p>
                        </div>

                        {/* Desktop Footer Trademark */}
                        <div className="mt-12 text-center border-t border-white/10 pt-8 hidden lg:block">
                            <p className="text-[10px] font-black text-emerald-100/30 uppercase tracking-[0.3em]">
                                {headerTitle || 'BERKAH 88'} &copy; {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Trademark (Bottom of Screen) */}
                <div className="pb-8 text-center lg:hidden">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                        MADE WITH BERKAH &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default AuthHome;
