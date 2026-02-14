import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingHeader from './components/LandingHeader';
import LandingFooter from './components/LandingFooter';
import ProductCard from './components/ProductCard';
import {
    ChevronDown,
    Search,
    PackageOpen,
    Smartphone,
    Zap,
    CheckCircle2,
    Star,
    ShoppingBag,
    MoveRight
} from 'lucide-react';
import logoImg from '/assets/images/logo.png';

const BerkahLandingPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [visibleCount, setVisibleCount] = useState(8);
    const initialCount = 8;
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/public/menu-items`);
                const result = await response.json();
                if (result.message === 'success') {
                    setProducts(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [apiUrl]);

    // Extract unique categories
    const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory);

    const productsToShow = filteredProducts.slice(0, visibleCount);

    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        setVisibleCount(initialCount);
    };

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 8);
    };

    // Get 3 featured products for hero/highlights
    const featuredProducts = products.filter(p => p.is_featured === 1).slice(0, 3);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
            <LandingHeader />


            {/* Hero Section */}
            <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/assets/images/bg.jpeg"
                        className="w-full h-full object-cover blur-[6px] scale-105"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                <div className="max-w-7xl relative z-10 mx-auto px-6 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm font-bold tracking-wide text-emerald-400 uppercase bg-emerald-900/40 backdrop-blur-md rounded-full border border-emerald-500/30">
                            <Star size={16} fill="currentColor" />
                            Paling Berkah se-Bogor
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-[1.05] tracking-tight">
                            Bismillah,<br />
                            <span className="text-emerald-400">Makan Enak</span><br />
                            <span className="text-white/90">Hidup Berkah.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-200 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                            Nikmati kelezatan tiada tara dengan sentuhan cinta dan doa di setiap suapan. Kami siap memuliakan hidangan Anda dengan cara terbaik.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <button
                                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-all flex items-center justify-center gap-3 group"
                            >
                                Lihat Menu Kami
                                <MoveRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-black text-lg hover:bg-white/20 transition-all text-white flex items-center justify-center gap-3 group">
                                <Search size={20} className="group-hover:scale-110 transition-transform" />
                                Cari Favoritmu
                            </button>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white/50 cursor-pointer"
                    onClick={() => document.getElementById('highlights')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <ChevronDown size={32} />
                </motion.div>
            </section>

            {/* Highlights Section */}
            <section id="highlights" className="py-24 relative z-10 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8 text-center md:text-left">
                        <div className="max-w-2xl">
                            <span className="text-emerald-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">IKHTIAR TERBAIK</span>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                Menu Pilihan Yang Selalu <span className="text-emerald-600 italic">Ditunggu.</span>
                            </h2>
                        </div>
                        <p className="text-slate-500 font-medium max-w-sm">Dibuat dari bahan-bahan pilihan yang segar dan penuh keberkahan.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-[450px] bg-slate-100 rounded-[2.5rem] animate-pulse" />
                            ))
                        ) : (
                            featuredProducts.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                >
                                    <ProductCard product={product} />
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Products Grid Section */}
            <section id="products" className="py-24 bg-slate-50 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-black tracking-[0.2em] text-emerald-600 uppercase bg-emerald-100/80 rounded-full border border-emerald-200">
                            EKOSISTEM MENU
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-8">
                            Jelajahi Rasa Berkah Kami
                        </h2>

                        {/* Category Filter */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 capitalize text-sm ${activeCategory === cat
                                        ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 scale-105'
                                        : 'bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {productsToShow.map((product) => (
                                        <motion.div
                                            layout
                                            key={product.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ProductCard product={product} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {visibleCount < filteredProducts.length && (
                                <div className="mt-20 text-center">
                                    <button
                                        onClick={handleShowMore}
                                        className="inline-flex items-center gap-3 px-12 py-5 bg-white border border-slate-200 text-slate-900 rounded-[2rem] font-black text-lg hover:border-emerald-600 hover:text-emerald-600 transition-all duration-300 shadow-sm hover:shadow-xl active:scale-95 group"
                                    >
                                        Tampilkan Lebih Banyak
                                        <ChevronDown size={24} className="group-hover:translate-y-1 transition-transform" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {!loading && filteredProducts.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <PackageOpen size={64} className="mx-auto text-slate-200 mb-6" />
                            <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">Belum ada menu di sini, Kak.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Services / Partner Section */}
            <section id="delivery" className="py-24 bg-white relative z-10 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-emerald-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">PESAN ONLINE</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Gak Sempet Mampir? <br /><span className="text-emerald-600 italic">Pesan Aja!</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                        {[
                            {
                                name: "GoFood",
                                color: "bg-rose-50 border-rose-100 hover:shadow-rose-100",
                                btn: "bg-rose-600 hover:bg-rose-700",
                                img: "/assets/images/gofood6210-removebg-preview.png",
                                link: "https://gofood.link/a/QVAjFq9",
                                desc: "Ikhtiar cepat lewat partner setia Gojek."
                            },
                            {
                                name: "GrabFood",
                                color: "bg-emerald-50 border-emerald-100 hover:shadow-emerald-100",
                                btn: "bg-emerald-600 hover:bg-emerald-700",
                                img: "/assets/images/grab-food-logo-png_seeklogo-389124-removebg-preview.png",
                                link: "https://r.grab.com/g/6-20251229_174338_37485b0ebedc4ef5b3754243f90f52ff_MEXMPS-6-C7LELKEFJKL2HE",
                                desc: "Alhamdulillah promo melimpah setiap hari."
                            },
                            {
                                name: "ShopeeFood",
                                color: "bg-orange-50 border-orange-100 hover:shadow-orange-100",
                                btn: "bg-orange-600 hover:bg-orange-700",
                                img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/512px-Shopee.svg.png",
                                link: "https://shopee.co.id/universal-link/now-food/shop/22596619?deep_and_deferred=1&shareChannel=copy_link",
                                desc: "Gratis ongkir Biidznillah di Shopee!"
                            }
                        ].map((partner, idx) => (
                            <motion.a
                                key={idx}
                                href={partner.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className={`p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 flex flex-col items-center text-center group ${partner.color}`}
                            >
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                    <img src={partner.img} alt={partner.name} className="w-16 h-16 object-contain" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4">{partner.name}</h3>
                                <p className="text-slate-500 font-medium mb-8 leading-relaxed italic">"{partner.desc}"</p>
                                <span className={`px-8 py-3 text-white rounded-2xl font-bold text-sm transition-all shadow-lg ${partner.btn}`}>Pesan Sekarang</span>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mobile App CTA Section */}
            <section className="py-24 bg-white relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden text-center md:text-left"
                    >

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="max-w-xl text-white">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <Smartphone size={16} />
                                    ANDROID APP
                                </span>
                                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight">Kini dalam <br /><span className="text-emerald-400 italic"> Genggamanmu.</span></h2>
                                <p className="text-slate-400 text-lg mb-10 font-medium italic">Pasang aplikasinya dan rasakan kemudahan pesan makanan semudah membalikkan telapak tangan. InsyaAllah makin Berkah!</p>
                                <a href="/download" className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-emerald-900/40 group">
                                    Dapatkan Aplikasinya
                                    <Zap size={20} className="fill-white" />
                                </a>
                            </div>
                            <div className="relative">
                                <div className="relative z-10 bg-slate-900 p-3.5 rounded-[3.2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[8px] border-slate-800 w-64 aspect-[9/18.5] overflow-hidden">
                                    <div className="w-full h-full bg-slate-50 rounded-[2.2rem] overflow-hidden relative">
                                        {/* Status Bar */}
                                        <div className="pt-2 px-6 flex justify-between items-center bg-emerald-600 text-white/90 text-[10px] font-bold absolute top-0 left-0 right-0 z-10">
                                            <span>12:30</span>
                                            <div className="flex gap-1.5 items-center">
                                                <Zap size={10} />
                                                <div className="w-4 h-2 rounded-sm border border-white/50 relative">
                                                    <div className="absolute left-0.5 top-0.5 bottom-0.5 right-0.5 bg-white rounded-px" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* App Screenshot */}
                                        <img
                                            src="/assets/images/kberkah88mobile.jpeg"
                                            alt="Aplikasi K Berkah 88"
                                            className="w-full h-full object-cover object-top"
                                        />
                                    </div>
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-900 rounded-b-2xl z-20" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Location Section */}
            <section id="location" className="py-24 bg-slate-50 relative z-10">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="mb-16">
                        <span className="text-emerald-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">MAMPIR YUK</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">Lokasi Outlet Kami</h2>
                    </div>

                    <div className="w-full max-w-6xl mx-auto rounded-[3rem] overflow-hidden shadow-2xl border border-white bg-white p-4">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.481862573946!2d106.74469039576967!3d-6.586867632287096!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69c5b6b9c1dcbb%3A0xa0c72d1985eb1b95!2sKerongkongan%20Berkah%2088!5e0!3m2!1sid!2sid!4v1767004583440!5m2!1sid!2sid"
                            width="100%"
                            height="500"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Lokasi Berkah88"
                            className="w-full h-[400px] md:h-[500px] rounded-[2.5rem]"
                        ></iframe>
                    </div>
                </div>
            </section>

            <LandingFooter />
        </div>
    );
};

export default BerkahLandingPage;
