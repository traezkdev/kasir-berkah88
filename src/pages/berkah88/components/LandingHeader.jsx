import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import logoImg from '/assets/images/logo.png';

const LandingHeader = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(() => {
                    setScrolled(window.scrollY > 20);
                });
            } else {
                setScrolled(window.scrollY > 20);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Beranda', target: 'hero' },
        { name: 'Menu Favorit', target: 'products' },
        { name: 'Pesan Online', target: 'delivery' },
        { name: 'Lokasi', target: 'location' },
        { name: 'Tentang Kami', target: 'footer' },
    ];

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 gpu-acceleration ${isMobileMenuOpen
                    ? 'bg-white border-b border-slate-100 py-3 shadow-sm'
                    : scrolled
                        ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 py-3 shadow-sm'
                        : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <button onClick={() => scrollToSection('hero')} className="flex items-center gap-2 group">
                        <img src={logoImg} alt="Logo Berkah 88" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
                        <span className={`text-xl font-black tracking-tight ${(scrolled || isMobileMenuOpen) ? 'text-slate-900' : 'text-white'}`}>
                            Berkah 88
                        </span>
                    </button>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => scrollToSection(link.target)}
                                className={`text-sm font-bold transition-colors relative group ${scrolled ? 'text-slate-600 hover:text-emerald-600' : 'text-white/80 hover:text-white'}`}
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full" />
                            </button>
                        ))}
                        <button
                            onClick={() => navigate('/login')}
                            className={`px-6 py-2.5 text-sm font-black rounded-full transition-all duration-300 hover:scale-105 shadow-sm ${scrolled
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/20'}`}
                        >
                            Masuk
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`md:hidden p-2 transition-colors ${(scrolled || isMobileMenuOpen) ? 'text-slate-900' : 'text-white'}`}
                    >
                        <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={24} />
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
                    <div className="px-4 py-6 space-y-4">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => scrollToSection(link.target)}
                                className="block w-full text-left px-4 py-3 text-base font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            >
                                {link.name}
                            </button>
                        ))}
                        <div className="pt-4 border-t border-slate-100">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex items-center justify-center px-4 py-4 text-base font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                            >
                                Masuk Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default LandingHeader;
