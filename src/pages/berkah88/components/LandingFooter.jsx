import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const LandingFooter = () => {
    const [logoUrl, setLogoUrl] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
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
    }, []);

    return (
        <footer id="footer" className="bg-slate-900 text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Brand Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                                    B
                                </div>
                            )}
                            <span className="text-xl font-bold">Berkah88</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Menyajikan cita rasa terbaik dengan bahan-bahan pilihan berkualitas.
                            Temukan kenikmatan dalam setiap sajian kami.
                        </p>
                        <div className="flex gap-4">
                            {['Instagram', 'Facebook', 'Twitter'].map((social) => (
                                <a
                                    key={social}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
                                >
                                    <Icon name={social} size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6">Tautan Cepat</h3>
                        <ul className="space-y-4">
                            {[
                                { name: 'Daftar Menu', link: '#products' },
                                { name: 'Tentang', link: '#' },
                                { name: 'Lokasi Outlet', link: '#' },
                                { name: 'Karir', link: '#' },
                            ].map((item) => (
                                <li key={item.name}>
                                    <a
                                        href={item.link}
                                        className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2"
                                    >
                                        <Icon name="ChevronRight" size={14} />
                                        {item.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact - Static for now */}
                    <div>
                        <h3 className="text-lg font-bold mb-6">Hubungi Kami</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <div className="mt-1 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                    <Icon name="MapPin" size={16} />
                                </div>
                                <span className="text-gray-400">
                                    Jl. Kaliurang Km 12, Sleman, Yogyakarta, Indonesia
                                </span>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
                                    <Icon name="Phone" size={16} />
                                </div>
                                <span className="text-gray-400">+62 812-3456-7890</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                    <Icon name="Mail" size={16} />
                                </div>
                                <span className="text-gray-400">halo@berkah88.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © 2024 Kasir Berkah88. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
