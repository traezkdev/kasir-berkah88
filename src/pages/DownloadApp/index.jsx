import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Smartphone,
    Download,
    CheckCircle2,
    ShieldCheck,
    Zap,
    ShoppingBag,
    Clock,
    Star,
    Bell,
    CreditCard,
    BarChart3
} from 'lucide-react';
import logoImg from '/assets/images/logo.png';

/**
 * LANDING PAGE UNTUK DOWNLOAD APLIKASI K BERKAH 88 (ANDROID ONLY)
 * Dibuat dengan gaya modern, premium, dan responsive.
 * Copywriting: Santai & Agamis.
 * by traezkdev
 */
const DownloadApp = () => {
    // ==========================================
    // GANTI LINK DOWNLOAD DI BAWAH INI
    // CHANGE THE DOWNLOAD LINK BELOW
    // ==========================================
    const downloadLink = "https://drive.google.com/file/d/17-FJtL_ePWuj8K1Ij3u8gV0ljXbs0qdk/view?usp=drive_link";
    // ==========================================

    const featureSectionRef = useRef(null);

    const scrollToFeatures = (e) => {
        e.preventDefault();
        featureSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Update browser theme color for mobile
    useEffect(() => {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const originalColor = metaThemeColor ? metaThemeColor.getAttribute('content') : '#128EEA';

        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#059669'); // Emerald 600
        }

        return () => {
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', originalColor);
            }
        };
    }, []);

    const features = [
        {
            icon: ShoppingBag,
            title: "Pesan Sat-set!",
            desc: "Gak perlu antri lama lagi. Bismillah, klik-klik aja, pesanan langsung kami proses dengan cinta.",
            color: "bg-emerald-100 text-emerald-600"
        },
        {
            icon: Clock,
            title: "Pantau Real-time",
            desc: "InsyaAllah pesanan Anda selalu terpantau. Dari dapur sampai ke meja, semua kelihatan statusnya.",
            color: "bg-blue-100 text-blue-600"
        },
        {
            icon: Star,
            title: "Tabungan Berkah",
            desc: "Setiap transaksi ada poinnya lho. Kumpulkan terus buat dapet diskon yang bikin makin bersyukur.",
            color: "bg-amber-100 text-amber-600"
        },
        {
            icon: Bell,
            title: "Kabar Bahagia",
            desc: "Jangan sampai ketinggalan info menu baru atau promo spesial yang cuma ada di aplikasi.",
            color: "bg-rose-100 text-rose-600"
        },
        {
            icon: CreditCard,
            title: "Catatan Rapi",
            desc: "Semua struk belanja tersimpan aman di aplikasi. Gak perlu takut hilang, sejarah jajanmu tetap rapi.",
            color: "bg-purple-100 text-purple-600"
        },
        {
            icon: BarChart3,
            title: "Pas di Lidah",
            desc: "Dapetin rekomendasi menu yang paling cocok buat kamu. Makan enak, hati pun jadi senang.",
            color: "bg-indigo-100 text-indigo-600"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans selection:bg-emerald-100 selection:text-emerald-900">

            {/* Navbar Placeholder - Minimalist */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <img src={logoImg} alt="Logo Berkah 88" className="w-10 h-10 object-contain" />
                    <span className="font-bold text-xl tracking-tight">Berkah 88</span>
                </div>
                <div className="flex items-center gap-8">
                    <div className="hidden md:flex items-center gap-6">
                        <a href="#features" onClick={scrollToFeatures} className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">
                            Apa Yang Menarik?
                        </a>
                    </div>
                    <div className="hidden sm:block">
                        <span className="text-sm font-medium text-slate-500 italic">Makan Enak, Hidup Berkah</span>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 lg:pt-24 pb-24 lg:flex lg:items-center lg:gap-12 min-h-[80vh]">
                {/* Left Content */}
                <div className="lg:w-1/2 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm font-bold tracking-wide text-emerald-700 uppercase bg-emerald-100/80 backdrop-blur-sm rounded-full border border-emerald-200">
                            <Smartphone size={16} />
                            Khusus Pengguna Android
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tight text-slate-900">
                            Bismillah, <span className="text-emerald-600 text-shadow-sm">Makan Enak</span> Jadi Lebih Mudah.
                        </h1>

                        <p className="text-lg lg:text-xl text-slate-600 mb-12 max-w-lg leading-relaxed font-medium">
                            Nikmati kemudahan pesan makanan dari <span className="font-bold text-emerald-700 underline decoration-emerald-200">Berkah 88</span> langsung di genggamanmu. Gak pake antri, gak pake ribet, semua jadi makin berkah.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 mb-16">
                            <motion.a
                                href={downloadLink}
                                download
                                whileHover={{ scale: 1.02, translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg shadow-2xl shadow-emerald-200 transition-all group whitespace-nowrap"
                            >
                                <Download size={20} className="sm:size-6 group-hover:translate-y-0.5 transition-transform" />
                                Unduh Aplikasi
                            </motion.a>
                            <div className="flex flex-col justify-center gap-1.5 px-2 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-700 font-bold">
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                    <span>Alhamdulillah, Gratis!</span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium ml-0 sm:ml-6 uppercase tracking-widest leading-none">Versi Terbaru 1.6.1</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-4 border-t border-slate-200 pt-10">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                <Zap size={16} className="text-emerald-500" />
                                Sat-set & Praktis
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 border-l border-slate-200 pl-4">
                                <ShieldCheck size={16} className="text-emerald-500" />
                                Aman & Terpercaya
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 border-l border-slate-200 pl-4">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                Selalu Update
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Content - Mockup */}
                <div className="lg:w-1/2 mt-24 lg:mt-0 relative group">

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                        className="relative mx-auto lg:ml-auto w-full max-w-[340px]"
                    >
                        {/* Phone Frame */}
                        <div className="relative z-10 bg-slate-900 p-3.5 rounded-[3.2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[8px] border-slate-800 aspect-[9/18.5] overflow-hidden leading-none">
                            <div className="w-full h-full bg-slate-50 rounded-[2.2rem] overflow-hidden relative">
                                <div className="pt-2 px-6 flex justify-between items-center bg-emerald-600 text-white/90 text-[10px] font-bold">
                                    <span>12:30</span>
                                    <div className="flex gap-1.5 items-center">
                                        <Zap size={10} />
                                        <div className="w-4 h-2 rounded-sm border border-white/50 relative">
                                            <div className="absolute left-0.5 top-0.5 bottom-0.5 right-0.5 bg-white rounded-px" />
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800 flex flex-col pt-12 text-left">
                                    <div className="px-8 mb-8">
                                        <div className="w-16 h-16 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
                                            <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white leading-tight">Selamat Datang Kak!</h3>
                                        <p className="text-emerald-100 text-xs mt-2 font-medium">Siap kulineran penuh berkah hari ini?</p>
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
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-900 rounded-b-2xl z-20" />
                        </div>

                        {/* Floating Elements */}
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -left-12 top-20 z-20 bg-white p-4 rounded-2xl shadow-xl border border-emerald-50 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">Hehe...</p>
                                <p className="text-sm font-black text-slate-800">Udah Siap Makan!</p>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 15, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -right-16 bottom-32 z-20 bg-white p-4 rounded-2xl shadow-xl border border-emerald-50 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <Star size={20} />
                            </div>
                            <div className="pr-4 text-left">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rezeki</p>
                                <p className="text-sm font-black text-slate-800">Dapet Poin Lagi!</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </main>

            {/* Features Section (Merged from separate page) */}
            <section id="features" ref={featureSectionRef} className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-200">
                <div className="text-center mb-20">
                    <span className="inline-block px-4 py-1.5 mb-6 text-xs font-black tracking-[0.2em] text-emerald-600 uppercase bg-emerald-100/80 rounded-full border border-emerald-200">
                        KENAPA PUNYA APLIKASINYA?
                    </span>
                    <h2 className="text-4xl lg:text-6xl font-black leading-tight mb-8 text-slate-900 tracking-tight">
                        Ikhtiar Kami Buat <br /><span className="text-emerald-600 italic">Kamu Nyaman.</span>
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        Bukan cuma sekadar aplikasi, ini adalah cara kami memuliakan setiap pelanggan setia Berkah 88. Cobain deh beberapa keunggulannya!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-100 hover:border-emerald-100 transition-all duration-500 text-left"
                        >
                            <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                <feature.icon size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-slate-500 leading-relaxed font-medium">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-center text-white relative overflow-hidden"
                >

                    <div className="relative z-10">
                        <h2 className="text-3xl lg:text-5xl font-black mb-8 leading-tight">Alhamdulillah, <br />Yuk Mulai Sekarang!</h2>
                        <p className="text-slate-400 text-lg mb-2 max-w-xl mx-auto italic">"Makanlah di antara rezeki yang baik yang telah Kami berikan kepadamu..."</p>
                        <p className="text-emerald-500/60 text-xs mb-12 font-bold uppercase tracking-widest">(QS. Thaha: 81)</p>
                        <a
                            href={downloadLink}
                            download
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all hover:scale-105 shadow-xl shadow-emerald-900/20 whitespace-nowrap"
                        >
                            Pasang Sekarang
                            <Download size={18} className="sm:size-5" />
                        </a>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 mt-auto bg-white border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <img src={logoImg} alt="Logo" className="w-8 h-8 object-contain" />
                            <span className="font-bold text-lg">Berkah 88</span>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xs font-medium italic">Ikut andil melayani kebaikan lewat setiap hidangan.</p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-400 text-sm font-bold">
                        <a href="#features" onClick={scrollToFeatures} className="hover:text-emerald-600 transition-colors uppercase tracking-widest text-xs">Fitur</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors uppercase tracking-widest text-xs">Tentang Kami</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors uppercase tracking-widest text-xs">Bantuan</a>
                    </div>

                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">
                        &copy; {new Date().getFullYear()} K Berkah 88. Biidznillah.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DownloadApp;
