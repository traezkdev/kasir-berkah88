import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiUserPlus, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import AppIcon from '../../components/AppIcon';
import DarkModeToggle from '../../components/ui/DarkModeToggle';

const apiUrl = import.meta.env.VITE_API_URL;

const RegisterV2 = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const navigate = useNavigate();

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
                body: JSON.stringify({ username: formData.username, password: formData.password }),
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
        <div className="min-h-screen flex items-center justify-center bg-[#0052CC] dark:bg-[#003d99] relative overflow-hidden font-sans transition-colors duration-500">
            {/* Dark Mode Toggle Position */}
            <div className="absolute top-6 right-6 z-50">
                <DarkModeToggle />
            </div>
            {/* Background elements same as login for consistency */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-20"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                    transition={{ duration: 25, repeat: Infinity }}
                    className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"
                />
            </div>

            <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white/10 dark:bg-black/20 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10 overflow-hidden mx-4 z-10 transition-all duration-500">
                {/* Left Side: Info */}
                <div className="hidden lg:flex flex-col justify-center p-16 text-white bg-gradient-to-br from-white/10 to-transparent">
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="w-20 h-20 bg-white dark:bg-blue-500 rounded-3xl flex items-center justify-center mb-10 shadow-lg shadow-blue-900/20">
                            <AppIcon name="UserPlus" size={48} className="text-[#0052CC] dark:text-white" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-tight mb-6">
                            Bergabunglah Bersama <br />
                            <span className="text-blue-200 dark:text-blue-300">Berkah 88</span>
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
                <div className="flex flex-col justify-center p-8 md:p-16 bg-white dark:bg-gray-950 transition-colors duration-500">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Buat Akun</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Lengkapi formulir di bawah untuk mendaftar</p>
                        </div>

                        {registrationEnabled ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FiUser className="text-gray-400 group-focus-within:text-[#0052CC]" />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            placeholder="Username Baru"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#0052CC] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Kata Sandi</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FiLock className="text-gray-400 group-focus-within:text-[#0052CC]" />
                                        </div>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Min. 6 Karakter"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#0052CC] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Konfirmasi Sandi</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FiLock className="text-gray-400 group-focus-within:text-[#0052CC]" />
                                        </div>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Ulangi Kata Sandi"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#0052CC] transition-all"
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
                                    className="w-full bg-[#0052CC] hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none transform active:scale-95 transition-all flex items-center justify-center gap-3"
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

                        <div className="mt-10 text-center">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                Sudah memiliki akun? {' '}
                                <Link to="/login" className="text-[#0052CC] dark:text-blue-400 font-black hover:underline underline-offset-4">
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
