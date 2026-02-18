import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiSend } from 'react-icons/fi';

const apiUrl = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const response = await fetch(`${apiUrl}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || 'Link reset password telah dikirim ke email Anda.');
            } else {
                setErrorMessage(data.error || 'Terjadi kesalahan. Coba lagi nanti.');
            }
        } catch (err) {
            setErrorMessage('Kesalahan jaringan. Periksa koneksi Anda.');
        } finally {
            setIsLoading(false);
        }
    };

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
                        <FiMail className="text-3xl text-blue-600 dark:text-blue-400" />
                    </motion.div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Lupa Kata Sandi?</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                        Masukkan email yang terdaftar. Kami akan mengirimkan link untuk mereset kata sandi Anda.
                    </p>
                </div>

                {/* Success State */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-start gap-3"
                        >
                            <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-green-800 dark:text-green-300 font-bold text-sm">Email Terkirim!</p>
                                <p className="text-green-700 dark:text-green-400 text-sm mt-0.5">{successMessage}</p>
                                <p className="text-green-600 dark:text-green-500 text-xs mt-2">Periksa folder spam jika tidak menemukan email.</p>
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
                            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3"
                        >
                            <FiAlertCircle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 dark:text-red-400 font-semibold text-sm">{errorMessage}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                {!successMessage && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                                Alamat Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiMail className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@contoh.com"
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white font-semibold focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            id="btn-send-reset"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FiSend />
                                    Kirim Link Reset
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

export default ForgotPassword;
