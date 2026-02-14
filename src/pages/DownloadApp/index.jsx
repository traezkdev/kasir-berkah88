import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Download, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

/**
 * LANDING PAGE UNTUK DOWNLOAD APLIKASI K BERKAH 88 (ANDROID ONLY)
 * Dibuat dengan gaya modern, premium, dan responsive.
 */
const DownloadApp = () => {
    // ==========================================
    // GANTI LINK DOWNLOAD DI BAWAH INI
    // CHANGE THE DOWNLOAD LINK BELOW
    // ==========================================
    const downloadLink = "#";
    // ==========================================

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-emerald-100 selection:text-emerald-900">
            {/* Background Decorative Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px] opacity-60 animate-blob" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-100 rounded-full blur-[120px] opacity-60 animate-blob animation-delay-2000" />
            </div>

            {/* Navbar Placeholder - Minimalist */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <span className="text-white font-bold text-xl uppercase tracking-tighter">K</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">Berkah 88</span>
                </div>
                <div className="hidden sm:block">
                    <span className="text-sm font-medium text-slate-500">Aplikasi Kasir & Pemesanan</span>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 lg:pt-24 pb-24 lg:flex lg:items-center lg:gap-12">
                {/* Left Content */}
                <div className="lg:w-1/2">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm font-bold tracking-wide text-emerald-700 uppercase bg-emerald-100/80 backdrop-blur-sm rounded-full border border-emerald-200">
                            <Smartphone size={16} />
                            Tersedia Untuk Android
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tight text-slate-900">
                            Cara <span className="text-emerald-600">Terbaik</span> Pesan Makan Favoritmu.
                        </h1>

                        <p className="text-lg lg:text-xl text-slate-600 mb-12 max-w-lg leading-relaxed">
                            Dapatkan pengalaman memesan yang lebih cepat dan nyaman langsung dari genggaman Anda. Dirancang khusus untuk pelanggan setia <span className="font-semibold text-emerald-700">K Berkah 88</span>.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 mb-16">
                            <motion.a
                                href={downloadLink}
                                download
                                whileHover={{ scale: 1.02, translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-200 transition-all group"
                            >
                                <Download size={24} className="group-hover:translate-y-0.5 transition-transform" />
                                Download Link (APK)
                            </motion.a>
                            <div className="flex flex-col justify-center gap-1.5 px-2">
                                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                    <span>Gratis & Aman</span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium ml-6 uppercase tracking-widest">Versi Terbaru 1.0.0</span>
                            </div>
                        </div>

                        {/* Features Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 border-t border-slate-200 pt-10">
                            {[
                                { icon: Zap, title: "Instan", desc: "Pesan tanpa antri lama" },
                                { icon: ShieldCheck, title: "Keamanan", desc: "Transaksi aman 100%" },
                                { icon: CheckCircle2, title: "Menu Lengkap", desc: "Update menu setiap hari" },
                                { icon: Smartphone, title: "Android Syarat", desc: "Responsif di semua HP" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-emerald-600">
                                        <item.icon size={22} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 leading-tight">{item.title}</h4>
                                        <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Content - Mockup */}
                <div className="lg:w-1/2 mt-24 lg:mt-0 relative group">
                    {/* Animated Glow behind the phone */}
                    <div className="absolute -inset-4 bg-emerald-400/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                        className="relative mx-auto lg:ml-auto w-full max-w-[340px]"
                    >
                        {/* Phone Frame */}
                        <div className="relative z-10 bg-slate-900 p-3.5 rounded-[3.2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[8px] border-slate-800 aspect-[9/18.5] overflow-hidden">
                            {/* Screen Content */}
                            <div className="w-full h-full bg-slate-50 rounded-[2.2rem] overflow-hidden relative">
                                {/* Status Bar Mockup */}
                                <div className="pt-2 px-6 flex justify-between items-center bg-emerald-600 text-white/90 text-[10px] font-bold">
                                    <span>12:30</span>
                                    <div className="flex gap-1.5 items-center">
                                        <Zap size={10} />
                                        <div className="w-4 h-2 rounded-sm border border-white/50 relative">
                                            <div className="absolute left-0.5 top-0.5 bottom-0.5 right-0.5 bg-white rounded-px" />
                                        </div>
                                    </div>
                                </div>

                                {/* App UI Landing Mockup */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800 flex flex-col pt-12">
                                    <div className="px-8 mb-8">
                                        <div className="w-16 h-16 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-6">
                                            <span className="text-3xl font-black text-emerald-600">K</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white leading-tight">Selamat Datang di Berkah 88</h3>
                                        <div className="w-12 h-1 bg-emerald-400 mt-4 rounded-full" />
                                    </div>

                                    <div className="mt-auto bg-slate-50 rounded-t-[2.5rem] p-8 space-y-5 flex-1 shadow-2xl">
                                        <div className="space-y-2">
                                            <div className="h-4 w-2/3 bg-slate-200 rounded-full" />
                                            <div className="h-4 w-full bg-slate-100 rounded-full" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="h-20 bg-emerald-50 rounded-2xl border border-emerald-100" />
                                            <div className="h-20 bg-emerald-50 rounded-2xl border border-emerald-100" />
                                        </div>
                                        <div className="h-32 bg-slate-100 rounded-2xl" />
                                        <div className="h-14 w-full bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200 mt-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Speaker/Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-900 rounded-b-2xl z-20" />
                        </div>

                        {/* Stylized Floating Elements around the phone */}
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -left-12 top-20 z-20 bg-white p-4 rounded-2xl shadow-xl border border-emerald-50 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</p>
                                <p className="text-sm font-black text-slate-800">Pesanan Siap!</p>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 15, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -right-16 bottom-32 z-20 bg-white p-4 rounded-2xl shadow-xl border border-emerald-50 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <Zap size={20} />
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Promo</p>
                                <p className="text-sm font-black text-slate-800">Diskon 20%</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 mt-auto bg-white border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm uppercase">K</span>
                            </div>
                            <span className="font-bold text-lg">Berkah 88</span>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xs">Solusi cerdas pemesanan makanan untuk pelanggan setia Berkah 88.</p>
                    </div>

                    <div className="flex gap-6 text-slate-400 text-sm font-medium">
                        <a href="#" className="hover:text-emerald-600 transition-colors">Tentang Kami</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors">Bantuan</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors">Kebijakan Privasi</a>
                    </div>

                    <div className="text-slate-400 text-xs">
                        &copy; {new Date().getFullYear()} K Berkah 88. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DownloadApp;
