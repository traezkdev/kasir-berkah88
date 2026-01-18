import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiLogIn, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import AppIcon from '../../components/AppIcon';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { useAppSettings } from '../../contexts/AppSettingsContext';

const apiUrl = import.meta.env.VITE_API_URL;

const LoginV2 = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const navigate = useNavigate();
    const { logoUrl } = useAppSettings();

    useEffect(() => {
        setIsLoaded(true);
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const userRole = decodedToken.role;
                if (userRole === 'kasir') {
                    navigate('/cashier-dashboard');
                } else if (userRole === 'owner') {
                    navigate('/owner-dashboard');
                } else {
                    navigate('/main-dashboard');
                }
            } catch (error) {
                console.error("Error decoding token in useEffect:", error);
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
                const userRole = decodedToken.role;
                if (userRole === 'kasir') {
                    navigate('/cashier-dashboard');
                } else if (userRole === 'owner') {
                    navigate('/owner-dashboard');
                } else {
                    navigate('/main-dashboard');
                }
            } else {
                setError(data.error || 'Login gagal. Periksa kembali username dan password Anda.');
            }
        } catch (err) {
            setError('Kesalahan jaringan atau server tidak dapat dijangkau');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#138FEA] dark:bg-[#0d6aad] relative overflow-hidden font-sans transition-colors duration-500">
            {/* Dark Mode Toggle Position */}
            <div className="absolute top-6 right-6 z-50">
                <DarkModeToggle />
            </div>

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 50, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        x: [0, -70, 0],
                        y: [0, 70, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"
                />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>

            <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white/10 dark:bg-black/20 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10 overflow-hidden mx-4 z-10 transition-all duration-500">
                {/* Left Side: Illustration & Text */}
                <div className="hidden lg:flex flex-col justify-center p-16 text-white bg-gradient-to-br from-white/10 to-transparent">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-10 overflow-hidden ${logoUrl ? '' : 'bg-white dark:bg-[#138FEA] shadow-lg shadow-blue-900/20'}`}>
                            {logoUrl ? (
                                <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                            ) : (
                                <AppIcon name="Store" size={48} className="text-[#138FEA] dark:text-white" />
                            )}
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-tight mb-6">
                            Kasir Berkah 88 <br />
                            <span className="text-blue-100 dark:text-blue-200">System V2</span>
                        </h1>
                        <p className="text-xl text-blue-100/80 dark:text-blue-100/60 font-medium mb-12 max-w-sm">
                            Solusi manajemen kasir modern, cepat, dan terpercaya untuk bisnis Anda.
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: 'Zap', text: 'Transaksi Cepat & Akurat' },
                                { icon: 'PieChart', text: 'Laporan Real-time' },
                                { icon: 'ShieldCheck', text: 'Keamanan Data Terjamin' }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + (idx * 0.1) }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-[#138FEA] dark:group-hover:bg-[#138FEA] dark:group-hover:text-white transition-all duration-300">
                                        <AppIcon name={feature.icon} size={20} />
                                    </div>
                                    <span className="text-lg font-semibold">{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex flex-col justify-center p-8 md:p-16 bg-white dark:bg-gray-950 transition-colors duration-500">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="mb-10 block lg:hidden">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 overflow-hidden ${logoUrl ? '' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <AppIcon name="Store" size={32} className="text-[#138FEA]" />
                                )}
                            </div>
                        </div>

                        <div className="mb-12">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Selamat Datang</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Silakan masuk untuk melanjutkan akses ke dashboard</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Nama Pengguna</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FiUser className="text-gray-400 group-focus-within:text-[#138FEA] transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="Username Anda"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#138FEA] focus:bg-white dark:focus:bg-gray-900 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Kata Sandi</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FiLock className="text-gray-400 group-focus-within:text-[#138FEA] transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#138FEA] focus:bg-white dark:focus:bg-gray-900 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3"
                                    >
                                        <FiAlertCircle className="text-red-500 flex-shrink-0" />
                                        <p className="text-red-700 dark:text-red-400 text-sm font-bold leading-tight">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#138FEA] hover:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                {isLoading ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="relative z-10 flex items-center gap-2">
                                            MASUK SEKARANG <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                Belum memiliki akun? {' '}
                                <Link to="/register" className="text-[#138FEA] dark:text-blue-400 font-black hover:underline underline-offset-4">
                                    DAFTAR DISINI
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
