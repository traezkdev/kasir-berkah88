import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, 
    ArrowRight, 
    ArrowLeft, 
    Sparkles, 
    Smartphone, 
    ShoppingCart, 
    Utensils, 
    CreditCard, 
    MessageSquare, 
    CheckCircle, 
    ChevronRight,
    HelpCircle,
    UserCheck,
    Coins,
    Search,
    ChevronDown,
    Plus,
    Minus,
    Check,
    Bell
} from 'lucide-react';

const Tutorial = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('steps'); // 'steps', 'simulator', 'faq'
    const [activeStep, setActiveStep] = useState(0);
    const [faqOpen, setFaqOpen] = useState({});
    
    // Simulator states
    const [simCart, setSimCart] = useState([]);
    const [simScreen, setSimScreen] = useState('menu'); // 'menu', 'cart', 'checkout', 'tracking'
    const [simOrderState, setSimOrderState] = useState(0); // 0: Diterima, 1: Diproses, 2: Selesai
    const [simTableNum, setSimTableNum] = useState('08');
    const [simNotes, setSimNotes] = useState('');
    const [simPromoApplied, setSimPromoApplied] = useState(false);

    // List of shopping steps
    const steps = [
        {
            title: "Akses & Masuk Aplikasi",
            subtitle: "Langkah 1",
            icon: UserCheck,
            color: "from-blue-500 to-indigo-500",
            description: "Buka halaman web utama dan masuk menggunakan akun pelanggan Anda. Jika Anda baru pertama kali berkunjung, Anda bisa mendaftar dengan cepat atau berbelanja langsung menggunakan fitur Guest Checkout (Mode Tamu) dengan memindai kode QR yang ada di meja makan Anda.",
            tips: "Gunakan nomor Whatsapp aktif saat mendaftar untuk menerima pemberitahuan otomatis mengenai status pesanan Anda."
        },
        {
            title: "Pilih Menu & Kustomisasi",
            subtitle: "Langkah 2",
            icon: Utensils,
            color: "from-purple-500 to-pink-500",
            description: "Jelajahi berbagai menu lezat kami melalui daftar menu digital. Anda dapat mencari nama menu langsung melalui kolom pencarian atau memfilternya berdasarkan kategori. Klik pada menu untuk memilih porsi, menambahkan catatan khusus (seperti 'tanpa pedas' atau 'kuah dipisah').",
            tips: "Lihat label 'Promo' atau 'Paling Laris' untuk menemukan hidangan terbaik dengan harga spesial!"
        },
        {
            title: "Kelola Keranjang Belanja",
            subtitle: "Langkah 3",
            icon: ShoppingCart,
            color: "from-pink-500 to-rose-500",
            description: "Semua hidangan yang Anda pilih akan masuk ke Keranjang Belanja. Periksa kembali daftar pesanan Anda, sesuaikan jumlah porsi, masukkan kode kupon promo di kolom yang tersedia untuk mendapatkan potongan harga ekstra, dan pastikan nomor meja Anda sudah sesuai.",
            tips: "Pastikan nomor meja terisi dengan benar agar pramusaji kami mengantarkan pesanan langsung ke meja Anda tanpa tertukar."
        },
        {
            title: "Checkout & Konfirmasi Pembayaran",
            subtitle: "Langkah 4",
            icon: CreditCard,
            color: "from-amber-500 to-orange-500",
            description: "Setelah keranjang Anda sesuai, klik tombol 'Checkout' atau 'Pesan Sekarang'. Anda akan diarahkan ke halaman konfirmasi pemesanan. Pilih metode pembayaran yang Anda inginkan (seperti Cash/Tunai di Kasir, Transfer Bank, atau E-Wallet). Pesanan Anda akan langsung diteruskan ke dapur penjual secara real-time.",
            tips: "Untuk metode Tunai di Kasir, Anda cukup duduk manis dan membayar setelah hidangan selesai disajikan, atau bayar langsung ke kasir dengan menyebutkan nomor meja."
        },
        {
            title: "Pantau Status & Chat Real-Time",
            subtitle: "Langkah 5",
            icon: MessageSquare,
            color: "from-emerald-500 to-teal-500",
            description: "Setelah pemesanan sukses, Anda dapat memantau proses memasak hidangan Anda melalui halaman pelacakan pesanan yang dinamis. Jika ada perubahan atau ingin meminta layanan tambahan (seperti tambah sendok/tisu), Anda bisa langsung menggunakan fitur Chat Real-Time untuk terhubung dengan penjual.",
            tips: "Halaman pelacakan akan otomatis berganti status dari 'Diterima' -> 'Sedang Dimasak' -> 'Siap Disajikan' -> 'Selesai'."
        }
    ];

    // FAQ data
    const faqs = [
        {
            q: "Apakah saya harus membuat akun terlebih dahulu sebelum memesan?",
            a: "Tidak perlu! Anda dapat memilih opsi 'Guest Checkout' (Mode Tamu) saat masuk, cukup dengan mengisi nama dan nomor meja untuk langsung melakukan pemesanan tanpa proses registrasi yang rumit."
        },
        {
            q: "Bagaimana cara saya menggunakan kode promo diskon?",
            a: "Pada halaman Keranjang Belanja Anda, cari kolom 'Kode Promo/Voucher'. Masukkan kode promo yang aktif (misalnya: DISKON88) lalu klik 'Terapkan'. Sistem akan otomatis memotong total tagihan belanja Anda."
        },
        {
            q: "Apakah saya bisa mengubah pesanan yang sudah terlanjur dibuat?",
            a: "Jika pesanan Anda berstatus 'Diterima' dan belum masuk tahap 'Sedang Dimasak' oleh dapur, Anda dapat segera menekan tombol 'Hubungi Penjual' melalui fitur Chat Real-time di halaman pesanan untuk meminta perubahan menu kepada pramusaji."
        },
        {
            q: "Bagaimana sistem Poin Loyalitas bekerja?",
            a: "Setiap kali Anda berbelanja menggunakan akun terdaftar, sistem akan menghitung pembelanjaan Anda dan mengonversinya menjadi Poin Loyalitas secara otomatis. Poin ini dapat dikumpulkan dan ditukarkan di halaman profil Anda dengan kupon makanan gratis atau potongan harga menarik."
        },
        {
            q: "Bagaimana cara melakukan pembayaran non-tunai (E-Wallet/Qris)?",
            a: "Saat melakukan checkout, pilih opsi pembayaran non-tunai. Anda akan diarahkan untuk memindai kode QRIS pembayaran yang dinamis atau mengonfirmasi pembayaran bank transfer. Setelah pembayaran sukses, status pesanan akan langsung otomatis terverifikasi tanpa perlu konfirmasi manual."
        }
    ];

    // Simulator menu items
    const simMenuItems = [
        { id: 1, name: "Nasi Goreng Berkah Special", price: 25000, category: "Makanan", image: "🍳", desc: "Nasi goreng dengan bumbu racikan rahasia, telur, ayam suwir, dan kerupuk renyah." },
        { id: 2, name: "Ayam Bakar Madu Premium", price: 28000, category: "Makanan", image: "🍗", desc: "Ayam bakar pilihan dengan olesan madu murni yang manis gurih meresap sampai ke tulang." },
        { id: 3, name: "Es Teh Manis Jumbo", price: 6000, category: "Minuman", image: "🍹", desc: "Es teh manis segar ukuran jumbo dengan daun teh asli pilihan." },
        { id: 4, name: "Juice Alpukat Float", price: 15000, category: "Minuman", image: "🥑", desc: "Jus alpukat mentega segar dengan susu cokelat kental manis dan ice cream vanilla di atasnya." }
    ];

    // Simulator functions
    const addToSimCart = (item) => {
        const existing = simCart.find(i => i.id === item.id);
        if (existing) {
            setSimCart(simCart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
        } else {
            setSimCart([...simCart, { ...item, qty: 1 }]);
        }
    };

    const removeFromSimCart = (item) => {
        const existing = simCart.find(i => i.id === item.id);
        if (existing.qty === 1) {
            setSimCart(simCart.filter(i => i.id !== item.id));
        } else {
            setSimCart(simCart.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i));
        }
    };

    const simTotal = simCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const simDiscount = simPromoApplied ? simTotal * 0.15 : 0;
    const simFinalTotal = simTotal - simDiscount;

    // Simulate cooking steps interval
    useEffect(() => {
        let interval;
        if (simScreen === 'tracking' && simOrderState < 2) {
            interval = setInterval(() => {
                setSimOrderState(prev => {
                    if (prev < 2) return prev + 1;
                    return prev;
                });
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [simScreen, simOrderState]);

    const toggleFaq = (index) => {
        setFaqOpen(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100 overflow-hidden font-sans pb-20">
            {/* Ambient Lighting Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/30 filter blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-900/20 filter blur-[120px] animate-pulse duration-5000" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Navbar Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 border-b border-white/10 pb-6 gap-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-900/40">
                            <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                Kasir Berkah88
                            </h1>
                            <p className="text-xs text-slate-400 tracking-wider font-semibold">PANDUAN INTERAKTIF</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => navigate('/')} 
                            className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Ke Beranda
                        </button>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-105"
                        >
                            Belanja Sekarang
                        </button>
                    </div>
                </div>

                {/* Hero Title */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 animate-bounce">
                        <Sparkles className="w-3.5 h-3.5" />
                        Semua Bisa Belanja Mudah
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight leading-tight">
                        Bagaimana Cara Belanja di <br />
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Aplikasi Kasir Berkah88?
                        </span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Kami merancang antarmuka pelanggan digital agar Anda dapat memesan makanan dengan cepat dan efisien. Pelajari langkahnya di bawah ini atau coba langsung simulasi interaktifnya!
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full border border-white/10 flex gap-2 w-full max-w-lg shadow-xl">
                        <button
                            onClick={() => setActiveTab('steps')}
                            className={`flex-1 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'steps' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Panduan Langkah
                        </button>
                        <button
                            onClick={() => setActiveTab('simulator')}
                            className={`flex-1 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'simulator' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Smartphone className="w-4 h-4" />
                            Coba Simulator UI
                        </button>
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={`flex-1 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'faq' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <HelpCircle className="w-4 h-4" />
                            Pertanyaan (FAQ)
                        </button>
                    </div>
                </div>

                {/* Tab Contents */}
                <AnimatePresence mode="wait">
                    {/* TAB 1: STEPS */}
                    {activeTab === 'steps' && (
                        <motion.div
                            key="steps-tab"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                        >
                            {/* Left Side: Step Details & Large Cards */}
                            <div className="lg:col-span-7 space-y-6">
                                {steps.map((step, idx) => {
                                    const StepIcon = step.icon;
                                    return (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ scale: 1.01 }}
                                            onClick={() => setActiveStep(idx)}
                                            className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${activeStep === idx ? 'bg-slate-900/90 border-indigo-500 shadow-xl shadow-indigo-500/10' : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className="flex gap-4 items-start">
                                                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg shrink-0 text-white`}>
                                                    <StepIcon className="w-6 h-6" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{step.subtitle}</span>
                                                        {activeStep === idx && (
                                                            <span className="flex h-2 w-2 relative">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-100">{step.title}</h3>
                                                    <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                                                    
                                                    {activeStep === idx && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="pt-3 border-t border-white/5 mt-3"
                                                        >
                                                            <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-start gap-2">
                                                                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                                                <p className="text-xs text-indigo-300 leading-normal">
                                                                    <strong className="font-semibold text-indigo-200">Tips: </strong>
                                                                    {step.tips}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Right Side: Stepper Visual Guide Display */}
                            <div className="lg:col-span-5 sticky top-8 space-y-6">
                                <div className="p-8 bg-gradient-to-br from-slate-900 to-indigo-950/80 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[480px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full filter blur-2xl pointer-events-none" />
                                    
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400 border border-white/5">
                                                Langkah {activeStep + 1} dari 5
                                            </span>
                                            <div className="flex gap-2">
                                                <button 
                                                    disabled={activeStep === 0}
                                                    onClick={() => setActiveStep(prev => prev - 1)}
                                                    className="p-2 bg-white/5 rounded-full text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    disabled={activeStep === 4}
                                                    onClick={() => setActiveStep(prev => prev + 1)}
                                                    className="p-2 bg-white/5 rounded-full text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                                                {steps[activeStep].title}
                                            </h4>
                                            <p className="text-slate-300 text-sm leading-relaxed">
                                                {steps[activeStep].description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Mock Graphic representation of the active step */}
                                    <div className="mt-8 bg-slate-950/80 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4 relative min-h-[200px]">
                                        {activeStep === 0 && (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-bounce">
                                                    <UserCheck className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold mb-1">MASUK SISTEM</p>
                                                    <p className="text-sm font-bold text-slate-200">Gunakan Akun Pelanggan atau Guest</p>
                                                    <div className="mt-3 flex gap-2 justify-center">
                                                        <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-[10px] rounded-md border border-blue-500/30 font-bold">QR SCAN</span>
                                                        <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-md border border-indigo-500/30 font-bold">WHATSAPP OTP</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {activeStep === 1 && (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 animate-pulse">
                                                    <Utensils className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold mb-1">PILIHAN MENU DIGITAL</p>
                                                    <p className="text-sm font-bold text-slate-200">Kustomisasi Porsi & Catatan khusus</p>
                                                    <div className="mt-3 flex justify-center gap-1.5">
                                                        <span className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/25 rounded-md text-[10px] text-purple-300 font-semibold">Pedas Sedang</span>
                                                        <span className="px-2 py-0.5 bg-pink-500/15 border border-pink-500/25 rounded-md text-[10px] text-pink-300 font-semibold">Bungkus</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {activeStep === 2 && (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                                                    <ShoppingCart className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold mb-1">KERANJANG AKTIF</p>
                                                    <p className="text-sm font-bold text-slate-200">Terapkan Kode Kupon Diskon</p>
                                                    <div className="mt-2.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/5 inline-flex items-center gap-2">
                                                        <span className="text-[10px] text-emerald-400 font-black">DISKON88</span>
                                                        <span className="text-[9px] text-slate-400">Terapkan</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {activeStep === 3 && (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                                    <CreditCard className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold mb-1">CHECKOUT METODE</p>
                                                    <p className="text-sm font-bold text-slate-200">E-Wallet, Transfer QRIS, atau Cash</p>
                                                    <div className="mt-3 flex gap-2 justify-center">
                                                        <span className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded text-[10px] text-slate-300">QRIS</span>
                                                        <span className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded text-[10px] text-slate-300">Tunai</span>
                                                        <span className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded text-[10px] text-slate-300">Transfer</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {activeStep === 4 && (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                                    <MessageSquare className="w-8 h-8 animate-bounce" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold mb-1">MONITOR REAL-TIME</p>
                                                    <p className="text-sm font-bold text-slate-200">Status Pesanan & Chat Pramusaji</p>
                                                    <div className="mt-2 text-emerald-400 text-xs font-bold inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                                        Sedang Dimasak Chef
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="pt-6 border-t border-white/5 flex justify-center gap-4">
                                        <button 
                                            onClick={() => setActiveTab('simulator')} 
                                            className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                                        >
                                            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                                            Coba Simulator UI Sekarang
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 2: INTERACTIVE SIMULATOR */}
                    {activeTab === 'simulator' && (
                        <motion.div
                            key="simulator-tab"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
                        >
                            {/* Left Column: Explainer and Simulator controls */}
                            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider">
                                        <Smartphone className="w-3 h-3" />
                                        Simulator Interaktif
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-100">
                                        Coba Simulator <br />Belanja Pelanggan
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Di samping kanan adalah simulator antarmuka pelanggan digital kami. Coba tambahkan beberapa item ke keranjang belanja Anda, sesuaikan jumlahnya, gunakan kupon diskon, lakukan proses Checkout, dan lihat status pesanan Anda berubah secara langsung!
                                    </p>
                                </div>

                                <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 space-y-4 text-xs">
                                    <h4 className="font-bold text-slate-200 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-400" />
                                        Misi Uji Coba:
                                    </h4>
                                    <ul className="space-y-2.5 text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${simCart.length > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>1</span>
                                            <span>Tambahkan salah satu menu makanan ke keranjang.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${simScreen === 'cart' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>2</span>
                                            <span>Buka keranjang belanja Anda untuk memeriksa pesanan.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${simPromoApplied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>3</span>
                                            <span>Gunakan kode diskon <strong className="text-indigo-400">DISKON88</strong> untuk mendapat potongan 15%.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${simScreen === 'tracking' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>4</span>
                                            <span>Tekan Checkout untuk memantau status masak hidangan Anda.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setSimCart([]);
                                            setSimScreen('menu');
                                            setSimOrderState(0);
                                            setSimPromoApplied(false);
                                            setSimNotes('');
                                        }}
                                        className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold rounded-2xl text-xs transition-all uppercase tracking-wider"
                                    >
                                        Reset Simulator
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Smartphone UI Mockup */}
                            <div className="lg:col-span-7 flex justify-center items-center py-4">
                                <div className="w-full max-w-[370px] h-[670px] bg-slate-950 rounded-[48px] border-[10px] border-slate-800 shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden relative flex flex-col justify-between ring-1 ring-white/10">
                                    
                                    {/* Smartphone Notch / Ear speaker */}
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                                        <div className="w-12 h-1 bg-slate-900 rounded-full" />
                                    </div>

                                    {/* App Header Status Bar inside Phone */}
                                    <div className="pt-7 px-6 pb-2.5 bg-slate-900 border-b border-white/5 flex justify-between items-center text-[10px] font-bold text-slate-400 shrink-0 z-40">
                                        <span>12:00</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black uppercase">Meja {simTableNum}</span>
                                            <Bell className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                    </div>

                                    {/* Phone Main Screen Content Area */}
                                    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 scrollbar-none relative">
                                        
                                        {/* SCREEN 1: MENU LIST */}
                                        {simScreen === 'menu' && (
                                            <div className="space-y-4 pt-1">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400">Selamat Datang di</p>
                                                        <h4 className="text-sm font-bold text-slate-100">Kedai Berkah88</h4>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-semibold bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                                        Kategori: Semua
                                                    </span>
                                                </div>

                                                {/* Mini Search input */}
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Cari nasi goreng, jus..." 
                                                        disabled
                                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-8 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none"
                                                    />
                                                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                                                </div>

                                                {/* Menu List */}
                                                <div className="space-y-3">
                                                    {simMenuItems.map(item => {
                                                        const cartItem = simCart.find(i => i.id === item.id);
                                                        return (
                                                            <div key={item.id} className="p-3 bg-slate-900/60 rounded-2xl border border-white/5 flex gap-3 hover:border-white/10 transition-all">
                                                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                                                                    {item.image}
                                                                </div>
                                                                <div className="flex-1 space-y-1">
                                                                    <h5 className="text-xs font-bold text-slate-200">{item.name}</h5>
                                                                    <p className="text-[9px] text-slate-500 line-clamp-1">{item.desc}</p>
                                                                    <div className="flex justify-between items-center pt-1">
                                                                        <span className="text-xs font-black text-indigo-400">Rp {item.price.toLocaleString('id-ID')}</span>
                                                                        
                                                                        {cartItem ? (
                                                                            <div className="flex items-center bg-indigo-600 rounded-lg p-0.5 gap-2 text-white text-xs">
                                                                                <button onClick={() => removeFromSimCart(item)} className="p-1 hover:bg-white/10 rounded"><Minus className="w-3 h-3" /></button>
                                                                                <span className="font-bold text-[10px]">{cartItem.qty}</span>
                                                                                <button onClick={() => addToSimCart(item)} className="p-1 hover:bg-white/10 rounded"><Plus className="w-3 h-3" /></button>
                                                                            </div>
                                                                        ) : (
                                                                            <button 
                                                                                onClick={() => addToSimCart(item)}
                                                                                className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white rounded-lg text-[9px] font-bold text-slate-300 transition-all flex items-center gap-1"
                                                                            >
                                                                                <Plus className="w-3 h-3" /> Tambah
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* SCREEN 2: CART VIEW */}
                                        {simScreen === 'cart' && (
                                            <div className="space-y-4 pt-1">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setSimScreen('menu')} className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
                                                    <h4 className="text-sm font-bold text-slate-100">Keranjang Belanja</h4>
                                                </div>

                                                {simCart.length === 0 ? (
                                                    <div className="text-center py-12 space-y-3">
                                                        <div className="text-4xl">🛒</div>
                                                        <p className="text-xs text-slate-500 font-bold">Keranjang Anda masih kosong</p>
                                                        <button onClick={() => setSimScreen('menu')} className="px-4 py-2 bg-indigo-600 rounded-xl text-[10px] text-white font-bold">Pilih Menu Sekarang</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="space-y-2">
                                                            {simCart.map(item => (
                                                                <div key={item.id} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex justify-between items-center">
                                                                    <div>
                                                                        <h5 className="text-xs font-bold text-slate-200">{item.name}</h5>
                                                                        <p className="text-[10px] text-indigo-400 font-black">Rp {item.price.toLocaleString('id-ID')}</p>
                                                                    </div>
                                                                    <div className="flex items-center bg-slate-800 rounded-lg p-0.5 gap-2 text-white">
                                                                        <button onClick={() => removeFromSimCart(item)} className="p-1.5 hover:bg-white/10 rounded"><Minus className="w-3.5 h-3.5" /></button>
                                                                        <span className="font-bold text-xs">{item.qty}</span>
                                                                        <button onClick={() => addToSimCart(item)} className="p-1.5 hover:bg-white/10 rounded"><Plus className="w-3.5 h-3.5" /></button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Promo Voucher input simulator */}
                                                        <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5 space-y-2">
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase">KODE VOUCHER / PROMO</label>
                                                            <div className="flex gap-2">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Masukkan DISKON88" 
                                                                    value={simPromoApplied ? "DISKON88" : ""}
                                                                    readOnly
                                                                    className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 flex-1 uppercase focus:outline-none"
                                                                />
                                                                <button 
                                                                    onClick={() => setSimPromoApplied(!simPromoApplied)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${simPromoApplied ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-indigo-600 text-white'}`}
                                                                >
                                                                    {simPromoApplied ? 'Hapus' : 'Pakai'}
                                                                </button>
                                                            </div>
                                                            {simPromoApplied && <p className="text-[9px] text-emerald-400 font-bold">Kupon Berhasil Diterapkan! Potongan 15%</p>}
                                                        </div>

                                                        {/* Notes and Table number inside Cart */}
                                                        <div className="space-y-2">
                                                            <div>
                                                                <label className="text-[9px] font-bold text-slate-400 uppercase">Catatan Tambahan</label>
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Contoh: Sendok minta 2, pedas ya..."
                                                                    value={simNotes}
                                                                    onChange={(e) => setSimNotes(e.target.value)}
                                                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Calculation Card */}
                                                        <div className="p-3 bg-slate-900 rounded-xl border border-white/5 text-xs space-y-1.5">
                                                            <div className="flex justify-between text-slate-400">
                                                                <span>Subtotal</span>
                                                                <span>Rp {simTotal.toLocaleString('id-ID')}</span>
                                                            </div>
                                                            {simPromoApplied && (
                                                                <div className="flex justify-between text-emerald-400">
                                                                    <span>Potongan Promo (15%)</span>
                                                                    <span>-Rp {simDiscount.toLocaleString('id-ID')}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between font-bold text-slate-200 pt-1.5 border-t border-white/5 text-sm">
                                                                <span>Total Bayar</span>
                                                                <span className="text-indigo-400">Rp {simFinalTotal.toLocaleString('id-ID')}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* SCREEN 3: CHECKOUT OPTIONS */}
                                        {simScreen === 'checkout' && (
                                            <div className="space-y-4 pt-1">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setSimScreen('cart')} className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
                                                    <h4 className="text-sm font-bold text-slate-100">Metode Pembayaran</h4>
                                                </div>

                                                <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 text-center space-y-2">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Tagihan Anda</p>
                                                    <p className="text-2xl font-black text-indigo-400">Rp {simFinalTotal.toLocaleString('id-ID')}</p>
                                                </div>

                                                <div className="space-y-2.5">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">PILIH METODE PEMBAYARAN</p>
                                                    
                                                    {/* Payment option 1 */}
                                                    <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-indigo-500/40 flex justify-between items-center cursor-pointer">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><CreditCard className="w-5 h-5" /></div>
                                                            <div>
                                                                <h5 className="text-xs font-bold text-slate-200">Transfer Qris / E-Wallet</h5>
                                                                <p className="text-[9px] text-slate-500">Ovo, Gopay, Dana, ShopeePay</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-4 h-4 rounded-full border-4 border-indigo-500" />
                                                    </div>

                                                    {/* Payment option 2 */}
                                                    <div className="p-3.5 bg-slate-900/30 rounded-2xl border border-white/5 flex justify-between items-center opacity-60">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-800 rounded-xl text-slate-400"><Coins className="w-5 h-5" /></div>
                                                            <div>
                                                                <h5 className="text-xs font-bold text-slate-400">Tunai (Bayar di Kasir)</h5>
                                                                <p className="text-[9px] text-slate-500">Bayar cash langsung setelah makan</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-4 h-4 rounded-full border border-slate-600" />
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[9px] text-indigo-300 leading-normal">
                                                    <strong>Info:</strong> Simulator ini diatur untuk pembayaran QRIS dinamis instan agar memudahkan simulasi pelacakan status dapur.
                                                </div>
                                            </div>
                                        )}

                                        {/* SCREEN 4: REAL-TIME TRACKING */}
                                        {simScreen === 'tracking' && (
                                            <div className="space-y-5 pt-1">
                                                <div className="text-center space-y-1">
                                                    <h4 className="text-sm font-bold text-slate-100">Status Pesanan Meja {simTableNum}</h4>
                                                    <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">ID PESANAN: #BRK-88902</p>
                                                </div>

                                                {/* Visual Stepper status tracking */}
                                                <div className="p-4 bg-slate-900 rounded-3xl border border-white/5 space-y-4">
                                                    
                                                    {/* Step 1: Diterima */}
                                                    <div className="flex gap-3 items-center">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${simOrderState >= 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                                                            {simOrderState >= 0 ? <Check className="w-3.5 h-3.5 font-bold" /> : '1'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className={`text-xs font-bold ${simOrderState >= 0 ? 'text-slate-200' : 'text-slate-500'}`}>Pesanan Diterima Dapur</h5>
                                                            <p className="text-[8px] text-slate-500">Antrean diverifikasi oleh sistem</p>
                                                        </div>
                                                    </div>

                                                    {/* Progress Line */}
                                                    <div className={`w-0.5 h-4 ml-3 -my-3 ${simOrderState >= 1 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

                                                    {/* Step 2: Dimasak */}
                                                    <div className="flex gap-3 items-center">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${simOrderState >= 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                                                            {simOrderState >= 1 ? (simOrderState === 1 ? <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-ping"></span> : <Check className="w-3.5 h-3.5 font-bold" />) : '2'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className={`text-xs font-bold ${simOrderState >= 1 ? 'text-slate-200' : 'text-slate-500'}`}>Sedang Dimasak Chef</h5>
                                                            <p className="text-[8px] text-slate-500">Makanan disiapkan dengan higienis</p>
                                                        </div>
                                                    </div>

                                                    {/* Progress Line */}
                                                    <div className={`w-0.5 h-4 ml-3 -my-3 ${simOrderState >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

                                                    {/* Step 3: Siap */}
                                                    <div className="flex gap-3 items-center">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${simOrderState >= 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                                                            {simOrderState >= 2 ? <Check className="w-3.5 h-3.5 font-bold" /> : '3'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className={`text-xs font-bold ${simOrderState >= 2 ? 'text-slate-200' : 'text-slate-500'}`}>Siap Disajikan</h5>
                                                            <p className="text-[8px] text-slate-500">Pramusaji sedang menuju meja Anda</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-slate-900/60 rounded-2xl border border-white/5 space-y-2">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Detail Pembelian Anda</p>
                                                    <div className="space-y-1 text-[10px] text-slate-400">
                                                        {simCart.map(item => (
                                                            <div key={item.id} className="flex justify-between">
                                                                <span>{item.qty}x {item.name}</span>
                                                                <span className="font-semibold text-slate-300">Rp {(item.qty * item.price).toLocaleString('id-ID')}</span>
                                                            </div>
                                                        ))}
                                                        {simNotes && (
                                                            <div className="pt-1.5 border-t border-white/5 text-[9px] text-amber-300">
                                                                <strong>Catatan:</strong> "{simNotes}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Chat simulator trigger */}
                                                <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20 text-center space-y-2">
                                                    <p className="text-[9px] text-indigo-300">Butuh bantuan pramusaji atau ada tambahan sendok?</p>
                                                    <button 
                                                        onClick={() => alert("Simulasi: Fitur chat terhubung real-time dengan pramusaji!")}
                                                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[9px] font-bold text-white uppercase tracking-wider"
                                                    >
                                                        Hubungi Dapur / Chat Penjual
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    </div>

                                    {/* App bottom action button inside Phone Mockup */}
                                    <div className="p-4 bg-slate-900 border-t border-white/5 shrink-0 z-40">
                                        {simScreen === 'menu' && (
                                            <button 
                                                onClick={() => setSimScreen('cart')}
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-transparent rounded-2xl text-xs font-bold text-white transition-all shadow-lg flex justify-between items-center px-4"
                                                disabled={simCart.length === 0}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <ShoppingCart className="w-4 h-4" />
                                                    <span>Lihat Keranjang ({simCart.reduce((s, i) => s + i.qty, 0)})</span>
                                                </div>
                                                <span className="font-black text-[11px]">Rp {simTotal.toLocaleString('id-ID')}</span>
                                            </button>
                                        )}

                                        {simScreen === 'cart' && (
                                            <button 
                                                onClick={() => setSimScreen('checkout')}
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-2xl text-xs font-bold text-white transition-all shadow-lg flex justify-center items-center gap-1"
                                                disabled={simCart.length === 0}
                                            >
                                                <span>Pilih Metode Pembayaran</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}

                                        {simScreen === 'checkout' && (
                                            <button 
                                                onClick={() => {
                                                    setSimScreen('tracking');
                                                    setSimOrderState(0);
                                                }}
                                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl text-xs font-bold text-white transition-all shadow-lg flex justify-center items-center gap-1"
                                            >
                                                <span>Konfirmasi & Bayar Sekarang</span>
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}

                                        {simScreen === 'tracking' && (
                                            <button 
                                                onClick={() => {
                                                    setSimCart([]);
                                                    setSimScreen('menu');
                                                    setSimOrderState(0);
                                                    setSimPromoApplied(false);
                                                    setSimNotes('');
                                                }}
                                                className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-2xl text-xs font-bold transition-all text-center"
                                            >
                                                Kembali Belanja (Mulai Ulang)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 3: FAQ */}
                    {activeTab === 'faq' && (
                        <motion.div
                            key="faq-tab"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="max-w-4xl mx-auto space-y-4"
                        >
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold mb-2">Pertanyaan Populer Pelanggan</h3>
                                <p className="text-slate-400 text-sm">Menemukan masalah saat berbelanja? Berikut adalah daftar pertanyaan yang paling sering diajukan beserta jawabannya.</p>
                            </div>

                            {faqs.map((faq, idx) => (
                                <div 
                                    key={idx}
                                    className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300"
                                >
                                    <button 
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full flex justify-between items-center text-left gap-4"
                                    >
                                        <span className="font-bold text-slate-200 text-base flex items-start gap-3">
                                            <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                            {faq.q}
                                        </span>
                                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${faqOpen[idx] ? 'transform rotate-180 text-white' : ''}`} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {faqOpen[idx] && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-4 pl-8 text-sm text-slate-400 leading-relaxed border-t border-white/5 mt-4">
                                                    {faq.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loyalty Point & Benefits Promotion */}
                <div className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900/40 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none" />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        <div className="md:col-span-8 space-y-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                                <Coins className="w-3.5 h-3.5" />
                                Program Poin Loyalitas
                            </div>
                            <h3 className="text-3xl font-black text-slate-100">Kumpulkan Poin, Dapatkan Makan Gratis!</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                                Setiap transaksi yang Anda lakukan melalui akun pelanggan Kasir Berkah88 akan mendapatkan Poin Loyalitas secara instan. Kumpulkan poin dari setiap pesanan dan tukarkan poin Anda di profil pelanggan untuk menikmati diskon eksklusif, minuman gratis, atau menu favorit gratis tanpa syarat!
                            </p>
                        </div>
                        <div className="md:col-span-4 flex justify-center md:justify-end">
                            <button
                                onClick={() => navigate('/register')}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all hover:scale-105"
                            >
                                Daftar Akun Pelanggan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Simple footer for tutorial */}
                <div className="mt-20 border-t border-white/10 pt-8 text-center text-xs text-slate-500 space-y-2">
                    <p>© 2026 Kasir Berkah88. Seluruh hak cipta dilindungi undang-undang.</p>
                    <p>Butuh bantuan lebih lanjut? Hubungi dukungan kasir atau tanyakan langsung pada AI Assistant kami.</p>
                </div>
            </div>
        </div>
    );
};

export default Tutorial;
