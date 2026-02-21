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
        <div className="min-h-screen flex items-center justify-center bg-[#059669] dark:bg-[#064e3b] p-4 font-sans relative overflow-hidden transition-colors duration-700">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-300 rounded-full filter blur-[80px] opacity-20"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl p-8 lg:p-10 border border-white/20 z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"
                    >
                        <FiMail className="text-4xl text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none mb-3">Lupa Sandi?</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed px-2">
                        Kami akan membantu memulihkan akses akun Kasir Berkah Anda. Masukkan email terdaftar di bawah ini.
                    </p>
                </div>

                {/* Success State */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-2xl p-4 flex items-start gap-4"
                        >
                            <FiCheckCircle className="text-emerald-500 text-xl flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-emerald-800 dark:text-emerald-300 font-black text-sm uppercase tracking-tight">Email Terkirim!</p>
                                <p className="text-emerald-700 dark:text-emerald-400 text-xs font-medium mt-1 leading-relaxed">{successMessage}</p>
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
                {!successMessage && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">
                                Alamat Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <FiMail className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@contoh.com"
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl lg:rounded-3xl py-4 pl-14 pr-6 text-sm lg:text-base text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 shadow-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            id="btn-send-reset"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 lg:py-5 rounded-2xl lg:rounded-3xl shadow-xl shadow-emerald-200 dark:shadow-none transform active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-60 uppercase tracking-widest text-sm"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Kirim Instruksi <FiSend />
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

export default ForgotPassword;
