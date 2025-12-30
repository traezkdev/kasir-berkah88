import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import Button from './Button';

const chatbotApiUrl = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:4001';

const OwnerMotivationalModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [quote, setQuote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkShouldShow = () => {
            const now = new Date();
            const todayDate = now.toISOString().split('T')[0];
            const lastShownDate = localStorage.getItem('last_owner_motivation_date');

            // Tampilkan jika belum muncul hari ini
            if (lastShownDate !== todayDate) {
                fetchAIQuote();
            }
        };

        checkShouldShow();
    }, []);

    const fetchAIQuote = async () => {
        setIsLoading(true);
        try {
            const prompt = "Berikan 1 kalimat singkat motivasi yang sangat berkelas, premium, dan membakar semangat untuk pemilik restoran/bisnis. Gunakan gaya bahasa Indonesia yang asik, ramah, dan selipkan doa keberkahan yang modern. Jangan terlalu panjang, maksimal 2 kalimat. Fokus pada kesuksesan dan semangat juang.";

            const response = await fetch(`${chatbotApiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: prompt })
            });

            if (!response.ok) throw new Error('Failed to fetch AI quote');

            const data = await response.json();
            // Membersihkan quote dari karakter aneh atau quotes berlebih
            const cleanQuote = data.reply.replace(/^["']|["']$/g, '').trim();

            setQuote(cleanQuote);
            setIsOpen(true);
        } catch (error) {
            console.error('Error fetching owner motivation:', error);
            // Fallback jika AI gagal
            setQuote("Semangat Bosku! Setiap langkah kecilmu hari ini adalah kunci menuju kejayaan yang lebih besar. Barokah selalu ya!");
            setIsOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        const todayDate = new Date().toISOString().split('T')[0];
        localStorage.setItem('last_owner_motivation_date', todayDate);
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Backdrop dengan Blur Premium */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Modal Content - Glassmorphism Design */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className="relative w-full max-w-lg overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
                    >
                        {/* Gradient Background Blobs */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

                        <div className="relative p-7 sm:p-12 text-center">
                            {/* Close Button UI Minimalis */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full z-20"
                            >
                                <Icon name="X" className="w-5 h-5" />
                            </button>

                            {/* Animated Icon Container */}
                            <div className="flex justify-center mb-6 sm:mb-8">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="relative"
                                >
                                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-tr from-primary via-blue-500 to-indigo-600 rounded-[1.2rem] sm:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 rotate-12">
                                        <Icon name="Crown" className="w-8 h-8 sm:w-12 sm:h-12 text-white -rotate-12" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                        <Icon name="Sparkles" className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Content */}
                            <div className="space-y-2 sm:space-y-4">
                                <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary/80 dark:text-blue-400/80">
                                    Owner Premium Spirit
                                </h3>
                                <h2 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                    Halo, Sang <br className="sm:hidden" /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-indigo-600">Pahlawan</span> Ekonomi!
                                </h2>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="py-3 sm:py-5 px-1 sm:px-4"
                                >
                                    <Icon name="Quote" className="w-5 h-5 sm:w-7 sm:h-7 text-primary/20 mb-2 mx-auto" />
                                    <p className="text-base sm:text-xl font-medium text-gray-700 dark:text-gray-200 leading-relaxed italic">
                                        "{quote || "..."}"
                                    </p>
                                    <Icon name="Quote" className="w-5 h-5 sm:w-7 sm:h-7 text-primary/20 mt-2 mx-auto rotate-180" />
                                </motion.div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-6 sm:mt-8 pt-2 sm:pt-4">
                                <Button
                                    onClick={handleClose}
                                    className="w-full py-3.5 sm:py-5 text-base sm:text-lg font-bold rounded-2xl bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.6)] transform transition-all active:scale-95 border-none"
                                >
                                    Siap Taklukkan Hari Ini! 🚀
                                </Button>
                                <p className="mt-4 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Dibuat dengan ❤️ oleh AI khusus untuk Anda.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default OwnerMotivationalModal;
