import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { useTheme } from '../../../contexts/ThemeContext';

const LandingHeader = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme } = useTheme();

    // Fetch logo logic if needed, or just use text/hardcoded for now as it's a specific landing page
    const [logoUrl, setLogoUrl] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Fetch Logo
        const fetchLogo = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/settings/logo`);
                const data = await response.json();
                if (data.data && data.data.logo_url) {
                    setLogoUrl(`${apiUrl}${data.data.logo_url}`);
                }
            } catch (error) {
                console.error("Error fetching logo", error);
            }
        };
        fetchLogo();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Beranda', target: 'hero' },
        { name: 'Menu Favorit', target: 'products' },
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
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/80 backdrop-blur-md border-b border-white/10 py-3 shadow-lg' : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/berkah88" className="flex items-center gap-2 group">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
                                B
                            </div>
                        )}
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            Berkah88
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => scrollToSection(link.target)}
                                className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group"
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
                            </button>
                        ))}
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all duration-300 hover:scale-105"
                        >
                            Masuk
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-gray-300 hover:text-white"
                    >
                        <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={24} />
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-white/10 shadow-2xl animate-fade-in-down">
                    <div className="px-4 py-4 space-y-4">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => scrollToSection(link.target)}
                                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                {link.name}
                            </button>
                        ))}
                        <div className="pt-4 border-t border-white/10">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex items-center justify-center px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                Masuk ke Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default LandingHeader;
