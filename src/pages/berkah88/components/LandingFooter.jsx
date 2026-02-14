import React from 'react';
import Icon from '../../../components/AppIcon';
import logoImg from '/assets/images/logo.png';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, ChevronRight } from 'lucide-react';

const LandingFooter = () => {
    return (
        <footer id="footer" className="bg-slate-900 text-white pt-24 pb-12 relative overflow-hidden">
            {/* Decorative background for footer */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-2 mb-8">
                            <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" />
                            <span className="text-2xl font-black tracking-tight">Berkah 88</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-8 font-medium italic">
                            "Makan Enak, Hidup Berkah" - Ikut andil melayani kebaikan lewat setiap hidangan yang kami sajikan dengan cinta.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { icon: Instagram, link: '#' },
                                { icon: Facebook, link: '#' },
                                { icon: Twitter, link: '#' }
                            ].map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.link}
                                    className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all hover:scale-110 border border-white/5"
                                >
                                    <social.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-black mb-8 border-b border-white/5 pb-2 inline-block">Menu Cepat</h3>
                        <ul className="space-y-4">
                            {[
                                { name: 'Daftar Menu', link: '#products' },
                                { name: 'Pesan Online', link: '#delivery' },
                                { name: 'Lokasi Outlet', link: '#location' },
                                { name: 'Download Aplikasi', link: '/download' },
                            ].map((item) => (
                                <li key={item.name}>
                                    <a
                                        href={item.link}
                                        className="text-slate-400 hover:text-emerald-400 transition-all flex items-center gap-2 group font-medium"
                                    >
                                        <ChevronRight size={16} className="text-emerald-500/50 group-hover:translate-x-1 transition-transform" />
                                        {item.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-black mb-8 border-b border-white/5 pb-2 inline-block">Hubungi Kami</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <ul className="space-y-6">
                                <li className="flex items-start gap-4 group">
                                    <div className="mt-1 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                                        <MapPin size={18} />
                                    </div>
                                    <span className="text-slate-400 font-medium leading-relaxed">
                                        Ciherang Dramaga, <br />Bogor, Indonesia
                                    </span>
                                </li>
                                <li className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                                        <Phone size={18} />
                                    </div>
                                    <span className="text-slate-400 font-medium">0858-6487-5536</span>
                                </li>
                            </ul>
                            <ul>
                                <li className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                                        <Mail size={18} />
                                    </div>
                                    <span className="text-slate-400 font-medium break-all">kerongkonganberkah88@gmail.com</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} K Berkah 88. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
                        <a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
