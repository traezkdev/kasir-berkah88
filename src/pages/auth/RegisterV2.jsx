import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiUserPlus, FiArrowRight, FiCheckCircle, FiAlertCircle, FiPhone, FiMapPin, FiMail, FiShoppingCart, FiPackage, FiTrendingUp, FiCreditCard, FiSmartphone } from 'react-icons/fi';
import AppIcon from '../../components/AppIcon';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
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
    const navigate = useNavigate();
    const { logoUrl } = useAppSettings();

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
                setFormData({ username: '', password: '', confirmPassword: '' });
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
        <div className="h-screen flex lg:items-center lg:justify-center items-end bg-[#138FEA] dark:bg-[#0d6aad] relative overflow-hidden font-sans transition-colors duration-500">
            {/* Background elements same as login for consistency */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                {/* Dynamic Floating Elements */}
                {[
                    { icon: FiShoppingCart, size: 60, lgSize: 120, x: '10%', y: '15%', delay: 0, rot: 15 },
                    { icon: FiPackage, size: 50, lgSize: 80, x: '80%', y: '20%', delay: 2, rot: -20 },
                    { icon: FiTrendingUp, size: 55, lgSize: 100, x: '15%', y: '45%', delay: 4, rot: 10 },
                    { icon: FiCreditCard, size: 45, lgSize: 70, x: '75%', y: '35%', delay: 1, rot: 25 },
                    { icon: FiSmartphone, size: 50, lgSize: 90, x: '45%', y: '12%', delay: 3, rot: -10 },
                    { icon: FiCheckCircle, size: 40, lgSize: 50, x: '85%', y: '50%', delay: 5, rot: 15 }
                ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={i}
                            className="absolute text-white/40 dark:text-blue-200/20"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                                opacity: [0.2, 0.5, 0.2],
                                y: [0, -40, 0],
                                x: [0, 15, 0],
                                rotate: [item.rot, item.rot + 15, item.rot - 15, item.rot]
                            }}
                            transition={{
                                duration: 10 + i * 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: item.delay
                            }}
                            style={{ left: item.x, top: item.y }}
                        >
                            <div className="lg:hidden">
                                <Icon size={item.size} />
                            </div>
                            <div className="hidden lg:block">
                                <Icon size={item.lgSize} />
                            </div>
                        </motion.div>
                    );
                })}

                {/* Extra Floating Particles for mobile */}
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={`particle-${i}`}
                        className={`absolute rounded-full blur-2xl ${i % 2 === 0 ? 'bg-white/30' : 'bg-blue-300/20'}`}
                        animate={{
                            x: [0, Math.random() * 80 - 40, 0],
                            y: [0, Math.random() * 80 - 40, 0],
                            opacity: [0.2, 0.6, 0.2],
                            scale: [1, 1.8, 1]
                        }}
                        transition={{
                            duration: 7 + Math.random() * 7,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5
                        }}
                        style={{
                            width: Math.random() * 80 + 40,
                            height: Math.random() * 80 + 40,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 60}%`,
                            zIndex: 0
                        }}
                    />
                ))}

                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                    transition={{ duration: 25, repeat: Infinity }}
                    className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"
                />
            </div>

            <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white dark:bg-gray-950 lg:bg-white/10 lg:dark:bg-black/20 lg:backdrop-blur-2xl rounded-t-[32px] lg:rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border-t lg:border border-white/20 dark:border-white/10 overflow-hidden lg:mx-4 z-10 transition-all duration-500 fixed lg:relative bottom-0 lg:bottom-auto">
                {/* Left Side: Info */}
                <div className="hidden lg:flex flex-col justify-center p-16 text-white bg-gradient-to-br from-white/10 to-transparent">
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-10 overflow-hidden ${logoUrl ? '' : 'bg-white dark:bg-[#138FEA] shadow-lg shadow-blue-900/20'}`}>
                            {logoUrl ? (
                                <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                            ) : (
                                <AppIcon name="UserPlus" size={48} className="text-[#138FEA] dark:text-white" />
                            )}
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-tight mb-6">
                            Bergabunglah Bersama <br />
                            <span className="text-blue-100 dark:text-blue-200">Berkah 88</span>
                        </h1>
                        <p className="text-xl text-blue-100/80 dark:text-blue-100/60 font-medium mb-12 max-w-sm">
                            Buat akun Anda sekarang dan rasakan kemudahan mengelola transaksi bisnis dalam satu genggaman.
                        </p>

                        <div className="space-y-4 text-blue-100/60 dark:text-blue-100/40 font-medium">
                            <p>✓ Akses Penuh Fitur Dashboard</p>
                            <p>✓ Manajemen Produk & Stok</p>
                            <p>✓ Laporan Keuangan Otomatis</p>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Form */}
                <div className="flex flex-col justify-center p-6 md:p-16 bg-white dark:bg-gray-950 transition-colors duration-500 relative">
                    <div className="absolute top-4 right-4 z-[60]">
                        <DarkModeToggle />
                    </div>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="mb-4 block lg:hidden">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 overflow-hidden ${logoUrl ? '' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <AppIcon name="Store" size={32} className="text-[#138FEA]" />
                                )}
                            </div>
                        </div>

                        <div className="mb-4 lg:mb-10">
                            <h2 className="text-xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-0.5 lg:mb-2">Buat Akun</h2>
                            <p className="text-xs lg:text-base text-gray-500 dark:text-gray-400 font-medium">Lengkapi formulir di bawah untuk mendaftar</p>
                        </div>

                        {registrationEnabled ? (
                            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] lg:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FiUser className="text-sm lg:text-base text-gray-400 group-focus-within:text-[#138FEA]" />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            placeholder="Username Baru"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-2.5 lg:py-4 pl-10 lg:pl-12 pr-4 text-xs lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#138FEA] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] lg:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Email (Opsional)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FiMail className="text-sm lg:text-base text-gray-400 group-focus-within:text-[#138FEA]" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="email@contoh.com (untuk reset password)"
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-2.5 lg:py-4 pl-10 lg:pl-12 pr-4 text-xs lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#138FEA] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] lg:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">No. WhatsApp / HP</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FiPhone className="text-sm lg:text-base text-gray-400 group-focus-within:text-[#138FEA]" />
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="Contoh: 08123456789"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-2.5 lg:py-4 pl-10 lg:pl-12 pr-4 text-xs lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#138FEA] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] lg:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 pt-3 lg:pt-4 flex items-start pointer-events-none">
                                            <FiMapPin className="text-sm lg:text-base text-gray-400 group-focus-within:text-[#138FEA]" />
                                        </div>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Masukkan alamat lengkap pengiriman"
                                            required
                                            rows="2"
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-2.5 lg:py-4 pl-10 lg:pl-12 pr-4 text-xs lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#138FEA] transition-all resize-none"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] lg:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Kata Sandi</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FiLock className="text-sm lg:text-base text-gray-400 group-focus-within:text-[#138FEA]" />
                                        </div>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Min. 6 Karakter"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-2.5 lg:py-4 pl-10 lg:pl-12 pr-4 text-xs lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#138FEA] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] lg:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Konfirmasi Sandi</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FiLock className="text-sm lg:text-base text-gray-400 group-focus-within:text-[#138FEA]" />
                                        </div>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Ulangi Kata Sandi"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-2.5 lg:py-4 pl-10 lg:pl-12 pr-4 text-xs lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#138FEA] transition-all"
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-center gap-3">
                                            <FiAlertCircle className="text-red-500" />
                                            <p className="text-red-700 dark:text-red-400 text-sm font-bold">{error}</p>
                                        </motion.div>
                                    )}
                                    {success && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl flex items-center gap-3">
                                            <FiCheckCircle className="text-green-500" />
                                            <p className="text-green-700 dark:text-green-400 text-sm font-bold">{success}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#138FEA] hover:bg-blue-600 text-white font-black py-3 lg:py-4 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none transform active:scale-95 transition-all flex items-center justify-center gap-3 text-xs lg:text-base border-none"
                                >
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>DAFTAR SEKARANG <FiArrowRight /></>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100 text-center">
                                <AppIcon name="AlertTriangle" className="mx-auto text-orange-500 mb-4" size={40} />
                                <p className="text-orange-800 font-bold uppercase tracking-tighter">Pendaftaran Ditutup</p>
                                <p className="text-orange-600 text-sm font-medium mt-1">Administrator sedang menonaktifkan fitur pendaftaran saat ini.</p>
                            </div>
                        )}

                        <div className="mt-4 lg:mt-10 text-center">
                            <p className="text-[11px] lg:text-[15px] text-gray-500 dark:text-gray-400 font-medium">
                                Sudah memiliki akun? {' '}<br className="lg:hidden" />
                                <Link to="/login" className="text-[#138FEA] dark:text-blue-400 font-black hover:underline underline-offset-4">
                                    MASUK DISINI
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
