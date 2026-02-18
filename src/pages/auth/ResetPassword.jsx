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
        if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) return { label: 'Kuat', color: 'bg-green-500', width: '100%' };
        return { label: 'Sedang', color: 'bg-yellow-500', width: '75%' };
    };

    const strength = passwordStrength(newPassword);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    >
                        <FiLock className="text-3xl text-blue-600 dark:text-blue-400" />
                    </motion.div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Buat Kata Sandi Baru</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Masukkan kata sandi baru untuk akun Anda.
                    </p>
                </div>

                {/* Success State */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 text-center"
                        >
                            <FiCheckCircle className="text-green-500 text-4xl mx-auto mb-3" />
                            <p className="text-green-800 dark:text-green-300 font-black text-base">Berhasil!</p>
                            <p className="text-green-700 dark:text-green-400 text-sm mt-1">{successMessage}</p>
                            <p className="text-green-600 dark:text-green-500 text-xs mt-2">Anda akan diarahkan ke halaman login...</p>
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
                            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3"
                        >
                            <FiAlertCircle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 dark:text-red-400 font-semibold text-sm">{errorMessage}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                {!successMessage && token && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                                Kata Sandi Baru
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiLock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl py-3.5 pl-11 pr-12 text-sm text-gray-900 dark:text-white font-semibold focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {/* Password Strength Indicator */}
                            {strength && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1">
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                                        <motion.div
                                            className={`h-1.5 rounded-full ${strength.color}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: strength.width }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                        Kekuatan: <span className="font-bold">{strength.label}</span>
                                    </p>
                                </motion.div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                                Konfirmasi Kata Sandi
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiLock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    id="confirm-password"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ulangi kata sandi"
                                    required
                                    className={`w-full bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl py-3.5 pl-11 pr-12 text-sm text-gray-900 dark:text-white font-semibold focus:outline-none transition-all duration-300 ${confirmPassword && confirmPassword !== newPassword
                                            ? 'border-red-400 focus:border-red-500'
                                            : confirmPassword && confirmPassword === newPassword
                                                ? 'border-green-400 focus:border-green-500'
                                                : 'border-gray-100 dark:border-gray-700 focus:border-blue-500'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showConfirm ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {confirmPassword && confirmPassword === newPassword && (
                                <p className="text-xs text-green-500 ml-1 flex items-center gap-1">
                                    <FiCheckCircle /> Kata sandi cocok
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            id="btn-reset-password"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FiLock />
                                    Simpan Kata Sandi Baru
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Back to Login */}
                <div className="mt-8 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors"
                    >
                        <FiArrowLeft />
                        Kembali ke Halaman Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
