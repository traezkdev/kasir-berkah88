import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const MOTIVATIONAL_QUOTES = [
    "Bismillah, mari jemput rezeki dengan penuh kejujuran hari ini.",
    "Setiap transaksi adalah ibadah jika diniatkan karena Allah.",
    "Keberkahan bukan pada jumlahnya, tapi pada manfaat dan cara mendapatkannya.",
    "Senyum ramahmu kepada pelanggan adalah sedekah.",
    "Semangat! Kerja kerasmu hari ini adalah bekal untuk masa depan yang lebih baik.",
    "Kejujuran adalah modal utama dalam berdagang. Semoga hari ini penuh berkah.",
    "Rezeki sudah diatur, tugas kita hanyalah berikhtiar dengan cara yang halal.",
    "Jangan lupa bersyukur atas setiap pelanggan yang datang hari ini.",
    "Kedisiplinan adalah kunci kesuksesan toko kita. Ayo mulai dengan semangat!",
    "Hari baru, harapan baru, dan peluang rezeki yang baru. Semangat bekerja!"
];

const QURAN_VERSES = [
    {
        verse: "Allah telah menghalalkan jual beli dan mengharamkan riba.",
        surah: "QS. Al-Baqarah: 275"
    },
    {
        verse: "Wahai orang-orang yang beriman! Janganlah kamu saling memakan harta sesamamu dengan jalan yang batil, kecuali dalam perdagangan yang berlaku atas dasar suka sama suka di antara kamu...",
        surah: "QS. An-Nisa: 29"
    },
    {
        verse: "Sempurnakanlah takaran dan timbangan, dan janganlah kamu merugikan orang-orang sedikit pun...",
        surah: "QS. Al-A'raf: 85"
    },
    {
        verse: "Apabila salat telah dilaksanakan, maka bertebaranlah kamu di bumi; carilah karunia Allah dan ingatlah Allah banyak-banyak agar kamu beruntung.",
        surah: "QS. Al-Jumu'ah: 10"
    },
    {
        verse: "Dan (ingatlah) Allah sebaik-baik pemberi rezeki.",
        surah: "QS. Al-Jumu'ah: 11"
    }
];

const DailyWelcomeModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState({ quote: '', verse: null });
    const location = useLocation();

    // Daftar halaman di mana popup tidak boleh muncul
    const hiddenPages = ['/', '/berkah88', '/download', '/guest-checkout', '/login', '/register'];
    const shouldHidePopup = hiddenPages.includes(location.pathname);

    useEffect(() => {
        // Jangan tampilkan popup jika berada di halaman yang disembunyikan
        if (shouldHidePopup) {
            return;
        }

        const checkShouldShow = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const todayDate = now.toISOString().split('T')[0];
            const lastShownDate = localStorage.getItem('last_welcome_popup_date');
            const token = localStorage.getItem('token');

            const isEnabled = localStorage.getItem('daily_welcome_enabled') !== 'false';

            // Syarat: Fitur Aktif DAN Jam >= 7 pagi DAN belum pernah muncul hari ini DAN sudah login (punya token)
            if (isEnabled && currentHour >= 7 && lastShownDate !== todayDate && token) {
                // Pilih konten secara acak berdasarkan hari
                const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

                const quoteIndex = dayOfYear % MOTIVATIONAL_QUOTES.length;
                const verseIndex = dayOfYear % QURAN_VERSES.length;

                setContent({
                    quote: MOTIVATIONAL_QUOTES[quoteIndex],
                    verse: QURAN_VERSES[verseIndex]
                });

                setIsOpen(true);
            }
        };

        checkShouldShow();
    }, [shouldHidePopup, location.pathname]);

    const handleClose = () => {
        const todayDate = new Date().toISOString().split('T')[0];
        localStorage.setItem('last_welcome_popup_date', todayDate);
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-2xl"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative p-6 sm:p-8 text-center">
                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
                            >
                                <Icon name="X" className="w-5 h-5" />
                            </button>

                            {/* Header Icon */}
                            <div className="flex justify-center mb-4 sm:mb-6 mt-2">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Icon name="Sunrise" className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                                </div>
                            </div>

                            {/* Greeting */}
                            <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-primary mb-1">
                                Selamat Datang!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg mb-6 sm:mb-8">
                                Mari awali hari dengan keberkahan.
                            </p>

                            {/* Motivation Section */}
                            <div className="mb-8 sm:mb-10 space-y-4 sm:space-y-6 text-left sm:text-center">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-4 sm:p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"
                                >
                                    <Icon name="Sparkles" className="w-5 h-5 text-yellow-500 mb-2 mx-auto" />
                                    <p className="text-lg sm:text-xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed italic text-center">
                                        "{content.quote}"
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30"
                                >
                                    <p className="text-emerald-800 dark:text-emerald-300 font-arabic text-lg sm:text-xl mb-3 leading-relaxed text-center">
                                        {content.verse?.verse}
                                    </p>
                                    <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-center">
                                        — {content.verse?.surah}
                                    </p>
                                </motion.div>
                            </div>

                            {/* Action Button */}
                            <Button
                                onClick={handleClose}
                                className="w-full py-3 sm:py-4 text-base sm:text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transform transition-all active:scale-95"
                            >
                                Siap Berdagang!
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DailyWelcomeModal;
