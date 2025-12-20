import React, { useState, useEffect } from 'react';
import LandingHeader from './components/LandingHeader';
import LandingFooter from './components/LandingFooter';
import ProductCard from './components/ProductCard';
import Icon from '../../components/AppIcon';

const BerkahLandingPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
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

    // Get 3 featured products for hero/highlights
    const featuredProducts = products.filter(p => p.is_featured === 1).slice(0, 3);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-500 selection:text-white">
            <LandingHeader />

            {/* Hero Section */}
            <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                {/* Background Video/Image Placeholder */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/assets/images/bg.jpeg"
                        className="w-full h-full object-cover"
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
            <section id="products" className="py-20 bg-slate-50">
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
                                onClick={() => setActiveCategory(cat)}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
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

            <LandingFooter />

            {/* Global Styles for Animations */}
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
            `}</style>
        </div>
    );
};

export default BerkahLandingPage;
