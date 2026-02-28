import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaEnvelope, FaLock, FaUser, FaPhone, FaArrowRight, FaIdCard } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        nisn_nik: '',
        email: '',
        wa_number: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'siswa'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return toast.error("Konfirmasi password tidak cocok!");
        }

        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
            const response = await fetch(`${apiUrl}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    nama_lengkap: formData.nama_lengkap,
                    role: formData.role,
                    nisn_nik: formData.nisn_nik,
                    email: formData.email,
                    wa_number: formData.wa_number
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Registrasi berhasil! Silakan login.");
                navigate('/login');
            } else {
                toast.error(data.error || "Gagal melakukan pendaftaran.");
            }
        } catch (err) {
            console.error('Register error:', err);
            toast.error("Terjadi kesalahan sistem, coba lagi nanti.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 overflow-x-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 w-full">

                {/* Sisi Kiri: Informasi */}
                <div className="hidden lg:flex flex-col justify-between p-16 relative bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-900 text-white overflow-hidden min-h-screen">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 -right-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-16">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
                                <FaGraduationCap size={28} className="text-white" />
                            </div>
                            <span className="text-3xl font-black tracking-tighter uppercase">SIAS PRO</span>
                        </div>

                        <div className="max-w-md">
                            <h2 className="text-5xl font-black leading-[1.1] mb-8">
                                Bangun Masa Depan <br />
                                <span className="text-purple-300 italic font-serif">Bersama SIAS PRO.</span>
                            </h2>
                            <p className="text-xl text-indigo-100/70 leading-relaxed mb-12">
                                Platform sistem informasi akademik terpadu untuk kemudahan akses edukasi dan manajemen sekolah masa kini.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/10">
                        <p className="text-sm font-semibold text-indigo-100/40 uppercase tracking-[0.2em]">© 2024 SIAS PRO CORE</p>
                    </div>
                </div>

                {/* Sisi Kanan: Form Registrasi (Sesuai Snippet Anda) */}
                <div className="flex flex-col justify-center items-center bg-white dark:bg-slate-900 p-8 sm:p-12 lg:px-20 relative overflow-y-auto min-h-screen">
                    <div className="w-full max-w-2xl relative z-10">

                        <div className="lg:hidden flex items-center space-x-3 mb-10">
                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                                <FaGraduationCap size={20} className="text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">SIAS PRO</span>
                        </div>

                        <div className="mb-10 lg:text-left text-center">
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Daftar Akun Siswa</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Lengkapi data diri Anda untuk membuat akun portal akademik.</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Nama Lengkap */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 tracking-widest uppercase ml-1">Nama Lengkap</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                                            <FaUser size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            name="nama_lengkap"
                                            required
                                            value={formData.nama_lengkap}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-slate-900 dark:text-white text-sm font-medium"
                                            placeholder="Nama Lengkap"
                                        />
                                    </div>
                                </div>

                                {/* NISN / NIK */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 tracking-widest uppercase ml-1">NISN / NIK</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                                            <FaIdCard size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            name="nisn_nik"
                                            required
                                            value={formData.nisn_nik}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-slate-900 dark:text-white text-sm font-medium"
                                            placeholder="Nomor Identitas"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 tracking-widest uppercase ml-1">Alamat Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                                            <FaEnvelope size={14} />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-slate-900 dark:text-white text-sm font-medium"
                                            placeholder="email@sekolah.sch.id"
                                        />
                                    </div>
                                </div>

                                {/* Username */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 tracking-widest uppercase ml-1">Username Login</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                                            <FaUser size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            required
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-slate-900 dark:text-white text-sm font-medium"
                                            placeholder="Userid unik"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 tracking-widest uppercase ml-1">Nomor WhatsApp</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                                        <FaPhone size={14} />
                                    </div>
                                    <input
                                        type="tel"
                                        name="wa_number"
                                        required
                                        value={formData.wa_number}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-slate-900 dark:text-white text-sm font-medium"
                                        placeholder="+62 8xx xxxx xxxx"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 tracking-widest uppercase ml-1">Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                                            <FaLock size={14} />
                                        </div>
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-slate-900 dark:text-white text-sm font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {/* Konfirmasi */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 tracking-widest uppercase ml-1">Konfirmasi</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                                            <FaLock size={14} />
                                        </div>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-slate-900 dark:text-white text-sm font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transform transition-all active:scale-95 flex items-center justify-center space-x-3 mt-8 disabled:opacity-70 h-14"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Daftar Sekarang</span>
                                        <FaArrowRight size={14} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 text-center">
                            <p className="text-gray-500 dark:text-slate-400 font-medium font-bold text-sm tracking-wide">
                                Sudah memiliki akun? <Link to="/login" className="text-purple-600 font-black hover:underline ml-1">Login Masuk</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
