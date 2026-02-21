import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

const apiUrl = import.meta.env.VITE_API_URL;

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setErrorMessage('Token tidak valid. Silakan minta link reset password baru.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setErrorMessage('Kata sandi tidak cocok. Periksa kembali.');
            return;
        }
        if (newPassword.length < 6) {
            setErrorMessage('Kata sandi minimal 6 karakter.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || 'Kata sandi berhasil diubah!');
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setErrorMessage(data.error || 'Terjadi kesalahan. Coba lagi nanti.');
            }
        } catch (err) {
            setErrorMessage('Kesalahan jaringan. Periksa koneksi Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    const passwordStrength = (pwd) => {
        if (pwd.length === 0) return null;
        if (pwd.length < 6) return { label: 'Terlalu Pendek', color: 'bg-red-500', width: '25%' };
        if (pwd.length < 8) return { label: 'Lemah', color: 'bg-orange-500', width: '50%' };
        if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) return { label: 'Kuat', color: 'bg-emerald-500', width: '100%' };
        return { label: 'Sedang', color: 'bg-yellow-500', width: '75%' };
    };

    const strength = passwordStrength(newPassword);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#059669] dark:bg-[#064e3b] p-4 font-sans relative overflow-hidden transition-colors duration-700">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                    transition={{ duration: 25, repeat: Infinity }}
                    className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-green-200 rounded-full filter blur-[100px] opacity-20"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl p-8 lg:p-10 border border-white/10 z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"
                    >
                        <FiLock className="text-4xl text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none mb-3">Atur Ulang Sandi</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium px-2">
                        Buat kata sandi baru yang kuat untuk mengamankan akun Anda kembali.
                    </p>
                </div>

                {/* Success State */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-2xl p-6 text-center"
                        >
                            <FiCheckCircle className="text-emerald-500 text-5xl mx-auto mb-4" />
                            <p className="text-emerald-800 dark:text-emerald-300 font-black text-lg uppercase tracking-tight">Berhasil!</p>
                            <p className="text-emerald-700 dark:text-emerald-400 text-sm mt-2 font-medium">{successMessage}</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75" />
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error State */}
                <AnimatePresence>
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-2xl p-4 flex items-start gap-4"
                        >
                            <FiAlertCircle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 dark:text-red-400 font-bold text-xs leading-relaxed uppercase">{errorMessage}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                {!successMessage && token && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Sandi Baru</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <FiLock className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 6 Karakter"
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl py-4 pl-14 pr-12 text-sm lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 transition-all duration-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-500 transition-colors"
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {/* Strength Indicator */}
                            {strength && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 px-1">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kekuatan: {strength.label}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            className={`h-full ${strength.color}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: strength.width }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Konfirmasi Sandi</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <FiLock className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ulangi Sandi"
                                    required
                                    className={`w-full bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl py-4 pl-14 pr-12 text-sm lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none transition-all duration-300 ${confirmPassword && confirmPassword !== newPassword
                                        ? 'border-red-400 focus:border-red-500'
                                        : confirmPassword && confirmPassword === newPassword
                                            ? 'border-emerald-400 focus:border-emerald-500'
                                            : 'border-gray-100 dark:border-gray-800 focus:border-emerald-500'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-500 transition-colors"
                                >
                                    {showConfirm ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 lg:py-5 rounded-2xl lg:rounded-3xl shadow-xl shadow-emerald-200 dark:shadow-none transform active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-60 uppercase tracking-widest text-sm"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Simpan Perubahan <FiLock />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Back to Login */}
                <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-[10px] lg:text-xs text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-black uppercase tracking-widest transition-all px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full"
                    >
                        <FiArrowLeft /> Kembali ke Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
