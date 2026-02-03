import React, { useState, useEffect } from 'react';
import LandingHeader from './components/LandingHeader';
import LandingFooter from './components/LandingFooter';
import ProductCard from './components/ProductCard';
import Icon from '../../components/AppIcon';

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
    }, []);

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
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-500 selection:text-white">
            <LandingHeader />

            {/* Hero Section */}
            <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden gpu-acceleration">
                {/* Background Video/Image Placeholder */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/assets/images/bg.jpeg"
                        className="w-full h-full object-cover gpu-acceleration"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-50" />
                </div>

                <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-fade-in-up">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                            Nikmati Kelezatan
                        </span><br />
                        Tanpa Batas
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">
                        Sajikan momen terbaik Anda dengan menu spesial dari Berkah88.
                        Kualitas rasa bintang lima, harga kaki lima.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
                        <button
                            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all text-white"
                        >
                            Lihat Menu Kami
                        </button>
                        <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full font-bold text-lg hover:bg-white/20 transition-all text-white flex items-center justify-center gap-2">
                            <Icon name="Search" size={20} />
                            Cari Favoritmu
                        </button>
                    </div>
                </div>

                {/* Decor elements */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
                    <Icon name="ChevronDown" size={32} />
                </div>
            </section>

            {/* Featured Highlights (if any) */}
            {featuredProducts.length > 0 && (
                <section className="py-20 relative z-20 -mt-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {featuredProducts.map((product, idx) => (
                                <div key={product.id} className={`transform translate-y-${idx * 4} hover:-translate-y-2 transition-transform duration-500`}>
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Main Product Grid */}
            <section id="products" className="py-20 bg-slate-50 optimize-scroll">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4 inline-block">
                            Daftar Menu Pilihan
                        </h2>
                        <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
                        <p className="mt-4 text-gray-500 text-lg">Temukan selera Anda dari berbagai kategori pilihan kami</p>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 capitalize ${activeCategory === cat
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                                    : 'bg-white text-gray-500 hover:bg-purple-50 hover:text-purple-600 border border-gray-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {productsToShow.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {visibleCount < filteredProducts.length && (
                                <div className="mt-16 text-center">
                                    <button
                                        onClick={handleShowMore}
                                        className="inline-flex items-center gap-2 px-10 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-full font-bold text-lg hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-purple-500/30 active:scale-95 group"
                                    >
                                        Tampilkan Lebih Banyak
                                        <Icon name="ChevronDown" size={20} className="group-hover:translate-y-1 transition-transform" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {filteredProducts.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                            <Icon name="PackageOpen" size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">Belum ada produk di kategori ini.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-gradient-to-r from-purple-900 to-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-5" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8">Siap Memesan?</h2>
                    <p className="text-xl text-purple-200 mb-10 max-w-2xl mx-auto">
                        Kunjungi outlet kami atau pesan sekarang untuk merasakan kenikmatan yang sesungguhnya.
                    </p>
                    <button className="px-10 py-4 bg-white text-purple-900 rounded-full font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-transform shadow-2xl">
                        Hubungi Kami
                    </button>
                </div>
            </section>

            {/* Delivery Services Section */}
            <section id="delivery" className="py-20 bg-slate-50 relative overflow-hidden optimize-scroll">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4 inline-block">
                            Pesan Melalui Aplikasi
                        </h2>
                        <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
                        <p className="mt-4 text-gray-500 text-lg">Nikmati kemudahan memesan dari rumah melalui partner delivery kami</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* GoFood */}
                        <a
                            href="https://gofood.link/a/QVAjFq9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center group"
                        >
                            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <img
                                    src="/assets/images/gofood6210-removebg-preview.png"
                                    alt="GoFood"
                                    className="w-16 h-16 object-contain"
                                />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">GoFood</h3>
                            <p className="text-gray-500 mb-6">Pesan lebih cepat dan praktis lewat aplikasi Gojek.</p>
                            <span className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold group-hover:bg-red-700 transition-colors">Pesan Sekarang</span>
                        </a>

                        {/* GrabFood */}
                        <a
                            href="https://r.grab.com/g/6-20251229_174338_37485b0ebedc4ef5b3754243f90f52ff_MEXMPS-6-C7LELKEFJKL2HE"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center group"
                        >
                            <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <img
                                    src="/assets/images/grab-food-logo-png_seeklogo-389124-removebg-preview.png"
                                    alt="GrabFood"
                                    className="w-16 h-16 object-contain"
                                />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">GrabFood</h3>
                            <p className="text-gray-500 mb-6">Nikmati promo menarik setiap hari di GrabFood.</p>
                            <span className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold group-hover:bg-green-700 transition-colors">Pesan Sekarang</span>
                        </a>

                        {/* ShopeeFood */}
                        <a
                            href="https://shopee.co.id/universal-link/now-food/shop/22596619?deep_and_deferred=1&shareChannel=copy_link"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center group"
                        >
                            <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/512px-Shopee.svg.png"
                                    alt="ShopeeFood"
                                    className="w-12 h-12 object-contain"
                                />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">ShopeeFood</h3>
                            <p className="text-gray-500 mb-6">Gratis ongkir dan cashback melimpah di ShopeeFood.</p>
                            <span className="px-6 py-2 bg-orange-600 text-white rounded-full font-semibold group-hover:bg-orange-700 transition-colors">Pesan Sekarang</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <section id="location" className="py-20 bg-white optimize-scroll">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4 inline-block">
                            Lokasi Kami
                        </h2>
                        <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
                        <p className="mt-4 text-gray-500 text-lg">Kunjungi outlet kami di lokasi strategis</p>
                    </div>

                    <div className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-100 relative group">
                        <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none"></div>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.481862573946!2d106.74469039576967!3d-6.586867632287096!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69c5b6b9c1dcbb%3A0xa0c72d1985eb1b95!2sKerongkongan%20Berkah%2088!5e0!3m2!1sid!2sid!4v1767004583440!5m2!1sid!2sid"
                            width="100%"
                            height="500"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Lokasi Berkah88"
                            className="w-full h-[400px] md:h-[500px] z-10 relative"
                        ></iframe>
                    </div>
                </div>
            </section>

            <LandingFooter />

            {/* Global Styles for Animations */}
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                    will-change: transform, opacity;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
            `}</style>
        </div>
    );
};

export default BerkahLandingPage;
