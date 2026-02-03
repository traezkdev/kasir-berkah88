import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const [isVisible, setIsVisible] = useState({});

    useEffect(() => {
        const handleScroll = () => {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(() => {
                    setScrollY(window.scrollY);
                });
            } else {
                setScrollY(window.scrollY);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsVisible((prev) => ({
                        ...prev,
                        [entry.target.id]: entry.isIntersecting,
                    }));
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const features = [
        {
            icon: 'ShoppingCart',
            title: 'Point of Sale',
            description: 'Interface kasir yang cepat dan intuitif untuk transaksi penjualan',
            gradient: 'from-purple-500 to-indigo-500',
        },
        {
            icon: 'Package',
            title: 'Manajemen Inventori',
            description: 'Tracking stok bahan baku dan menu dengan sistem alert otomatis',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            icon: 'DollarSign',
            title: 'Keuangan & Laporan',
            description: 'Dashboard keuangan real-time dengan analitik lengkap',
            gradient: 'from-green-500 to-teal-500',
        },
        {
            icon: 'Users',
            title: 'Manajemen Tim',
            description: 'Role-based access control untuk keamanan data',
            gradient: 'from-orange-500 to-red-500',
        },
        {
            icon: 'Bot',
            title: 'AI Assistant',
            description: 'Chatbot pintar yang memahami semua fitur aplikasi',
            gradient: 'from-pink-500 to-rose-500',
        },
        {
            icon: 'BarChart3',
            title: 'Analitik Bisnis',
            description: 'Visualisasi data dan insights untuk keputusan bisnis',
            gradient: 'from-violet-500 to-purple-500',
        },
    ];

    const stats = [
        { number: '20+', label: 'Fitur Lengkap', icon: 'Zap' },
        { number: '100%', label: 'Responsive', icon: 'Smartphone' },
        { number: '24/7', label: 'AI Support', icon: 'HeadphonesIcon' },
        { number: '∞', label: 'Skalabilitas', icon: 'TrendingUp' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden gpu-acceleration">
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
                    style={{ transform: `translateY(${scrollY * 0.5}px)` }}
                />
                <div
                    className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
                    style={{ transform: `translateY(${scrollY * 0.3}px)` }}
                />
                <div
                    className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"
                    style={{ transform: `translateY(${-scrollY * 0.2}px)` }}
                />
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center z-10">
                    <div
                        className="mb-8 inline-block"
                        data-animate
                        id="hero-badge"
                        style={{
                            opacity: isVisible['hero-badge'] ? 1 : 0,
                            transform: isVisible['hero-badge'] ? 'translateY(0)' : 'translateY(20px)',
                            transition: 'all 0.6s ease-out',
                        }}
                    >
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 backdrop-blur-md border border-white/20">
                            <Icon name="Sparkles" size={16} className="mr-2" />
                            Sistem POS Modern untuk Bisnis F&B
                        </span>
                    </div>

                    <h1
                        className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
                        data-animate
                        id="hero-title"
                        style={{
                            opacity: isVisible['hero-title'] ? 1 : 0,
                            transform: isVisible['hero-title'] ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'all 0.8s ease-out 0.2s',
                        }}
                    >
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                            Kasir Berkah88
                        </span>
                    </h1>

                    <p
                        className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto gpu-acceleration"
                        data-animate
                        id="hero-subtitle"
                        style={{
                            opacity: isVisible['hero-subtitle'] ? 1 : 0,
                            transform: isVisible['hero-subtitle'] ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'all 0.8s ease-out 0.4s',
                            willChange: 'transform, opacity'
                        }}
                    >
                        Kelola penjualan, inventori, dan keuangan bisnis Anda dengan mudah.
                        Dilengkapi AI Assistant yang siap membantu 24/7.
                    </p>

                    <div
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                        data-animate
                        id="hero-cta"
                        style={{
                            opacity: isVisible['hero-cta'] ? 1 : 0,
                            transform: isVisible['hero-cta'] ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'all 0.8s ease-out 0.6s',
                        }}
                    >
                        <button
                            onClick={() => navigate('/')}
                            className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                Mulai Sekarang
                                <Icon name="ArrowRight" size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>

                        <button
                            onClick={() => navigate('/chatbot')}
                            className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 flex items-center justify-center"
                        >
                            <Icon name="Bot" size={20} className="mr-2" />
                            Coba AI Assistant
                        </button>
                    </div>

                    {/* Floating Arrow */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <Icon name="ChevronDown" size={32} className="text-white/50" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8 optimize-scroll">
                <div className="max-w-7xl mx-auto">
                    <div
                        className="text-center mb-16"
                        data-animate
                        id="features-header"
                        style={{
                            opacity: isVisible['features-header'] ? 1 : 0,
                            transform: isVisible['features-header'] ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'all 0.8s ease-out',
                        }}
                    >
                        <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Fitur Lengkap
                        </h2>
                        <p className="text-xl text-gray-400">Semua yang Anda butuhkan untuk mengelola bisnis</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                data-animate
                                id={`feature-${index}`}
                                className="group relative"
                                style={{
                                    opacity: isVisible[`feature-${index}`] ? 1 : 0,
                                    transform: isVisible[`feature-${index}`] ? 'translateY(0)' : 'translateY(30px)',
                                    transition: `all 0.6s ease-out ${index * 0.1}s`,
                                }}
                            >
                                <div className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden">
                                    {/* Gradient Overlay on Hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon name={feature.icon} size={24} className="text-white" />
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                    <p className="text-gray-400">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8 optimize-scroll">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                data-animate
                                id={`stat-${index}`}
                                className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                                style={{
                                    opacity: isVisible[`stat-${index}`] ? 1 : 0,
                                    transform: isVisible[`stat-${index}`] ? 'scale(1)' : 'scale(0.9)',
                                    transition: `all 0.6s ease-out ${index * 0.1}s`,
                                }}
                            >
                                <Icon name={stat.icon} size={32} className="mx-auto mb-4 text-purple-400" />
                                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                    {stat.number}
                                </div>
                                <div className="text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div
                        data-animate
                        id="cta-section"
                        className="relative p-12 rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 backdrop-blur-md border border-white/20 overflow-hidden"
                        style={{
                            opacity: isVisible['cta-section'] ? 1 : 0,
                            transform: isVisible['cta-section'] ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'all 0.8s ease-out',
                        }}
                    >
                        {/* Animated Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-10 animate-gradient" />

                        <h2 className="text-4xl sm:text-5xl font-bold mb-6 relative z-10">
                            Siap Meningkatkan Bisnis Anda?
                        </h2>
                        <p className="text-xl text-gray-300 mb-8 relative z-10">
                            Bergabunglah dengan ribuan bisnis yang sudah menggunakan Kasir Berkah88
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="relative z-10 group px-10 py-5 bg-white text-purple-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl inline-flex items-center"
                        >
                            Mulai Gratis Sekarang
                            <Icon name="Sparkles" size={20} className="ml-2 group-hover:rotate-12 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-8 px-4 sm:px-6 lg:px-8 border-t border-white/10">
                <div className="max-w-7xl mx-auto text-center text-gray-400">
                    <p>© 2024 Kasir Berkah88. Devloped by ❤️ traezkdev</p>
                </div>
            </footer>

            {/* Custom Styles */}
            <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-blob {
          animation: blob 7s infinite;
          will-change: transform;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
          will-change: background-position;
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
