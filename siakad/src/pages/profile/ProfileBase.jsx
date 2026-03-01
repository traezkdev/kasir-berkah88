import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaSave, FaLock, FaEnvelope, FaPhoneAlt, FaVenusMars, FaIdCard, FaCamera, FaChevronRight, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ProfileBase = ({ roleTitle, accentColor = "indigo" }) => {
    const [profile, setProfile] = useState({
        username: '',
        nama_lengkap: '',
        email: '',
        wa_number: '',
        jenis_kelamin: '',
        profile_photo: '',
        nisn_nik: '',
        role: ''
    });
    const fileInputRef = useRef(null);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setProfile(data);
            } else {
                toast.error("Gagal memuat profil.");
            }
        } catch (err) {
            toast.error("Kesalahan koneksi.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nama_lengkap: profile.nama_lengkap,
                    email: profile.email,
                    wa_number: profile.wa_number,
                    jenis_kelamin: profile.jenis_kelamin,
                    password: password
                })
            });

            if (response.ok) {
                toast.success("Profil berhasil diperbarui!");
                setPassword('');
                fetchProfile();
            } else {
                toast.error("Gagal memperbarui profil.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/profile/photo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Foto profil berhasil diperbarui!");
                setProfile(prev => ({ ...prev, profile_photo: data.photoUrl }));

                // Update local storage user data
                const userData = JSON.parse(localStorage.getItem('siakad_user') || '{}');
                userData.profile_photo = data.photoUrl;
                localStorage.setItem('siakad_user', JSON.stringify(userData));
            } else {
                toast.error(data.error || "Gagal mengunggah foto.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan saat mengunggah.");
        }
    };

    if (isLoading) return <div className="p-20 text-center font-black animate-pulse text-slate-400 tracking-widest uppercase italic border-none m-0">Synchronizing Identity...</div>;

    const accentBg = `bg-${accentColor}-600`;
    const accentText = `text-${accentColor}-600`;
    const accentShadow = `shadow-${accentColor}-600/20`;
    const accentBorder = `focus:border-${accentColor}-500`;

    return (
        <div className="w-full space-y-0 animate-in fade-in duration-500">
            {/* Header: Identity Banner - Bleed to edges on top/sides */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm p-4 sm:p-10 lg:p-12 flex flex-col md:flex-row items-center gap-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900/50 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>

                {/* Avatar Section */}
                <div className="relative group">
                    <div className={`w-28 h-28 rounded-3xl ${profile.profile_photo ? 'bg-transparent border-none shadow-none' : accentBg + ' ring-4 ring-white dark:ring-slate-700 shadow-2xl'} flex items-center justify-center text-white overflow-hidden transform group-hover:scale-105 transition-all duration-500`}>
                        {profile.profile_photo ? (
                            <img
                                src={`${import.meta.env.VITE_API_URL}${profile.profile_photo}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <FaUser size={48} className="opacity-80 group-hover:scale-110 transition-transform duration-500" />
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="absolute bottom-2 right-2 p-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
                    >
                        <FaCamera size={14} />
                    </button>
                </div>

                <div className="flex-1 text-center md:text-left relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2 justify-center md:justify-start">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none group cursor-default">
                            {profile.nama_lengkap || "User Siakad"}
                        </h1>
                        <span className={`px-4 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${accentShadow}`}>
                            {roleTitle}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-wide mb-4">@{profile.username} • {profile.email || "Email belum diatur"}</p>

                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ID Pengguna</p>
                            <p className="font-black text-slate-700 dark:text-slate-200 text-[10px]">#USR-{profile.id}</p>
                        </div>
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Bergabung Sejak</p>
                            <p className="font-black text-slate-700 dark:text-slate-200 text-[10px]">{new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area with some horizontal padding for content readability */}
            <div className="p-6 sm:p-10 lg:p-20 grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Left Sidebar: Settings Navigation */}
                <div className="space-y-4 lg:sticky lg:top-8 self-start">
                    <button className={`w-full p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none flex items-center justify-between group transform hover:-translate-y-1 transition-all ${accentText}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-current`}>
                                <FaUser />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-sm uppercase tracking-tight text-slate-800 dark:text-white">Informasi Personal</p>
                                <p className="text-[10px] font-bold text-slate-400">Data diri & akun utama</p>
                            </div>
                        </div>
                        <FaChevronRight size={12} className="opacity-40" />
                    </button>

                    <button className="w-full p-6 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between group opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-400">
                                <FaShieldAlt size={16} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-sm uppercase tracking-tight text-slate-400">Verifikasi & Keamanan</p>
                                <p className="text-[10px] font-bold text-slate-400 italic">Fitur segera hadir...</p>
                            </div>
                        </div>
                    </button>

                    {/* Role Specific Info Placeholder */}
                    <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                            <FaIdCard size={80} />
                        </div>
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 italic">Akses Level</h4>
                        <p className="font-black text-xl mb-4 leading-tight">Anda sebagai <br /> {roleTitle}</p>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">Pastikan data Anda valid untuk keperluan administrasi akademik.</p>
                    </div>
                </div>

                {/* Right Area: Large Settings Form */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                        <div className={`p-8 sm:p-10 ${accentBg} text-white flex justify-between items-center bg-gradient-to-r from-transparent to-black/10`}>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Perbarui Profil</h3>
                                <p className="text-current opacity-70 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1">Identitas Digital Pendidikan</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <FaSave className="text-2xl" />
                            </div>
                        </div>

                        <div className="p-8 sm:p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Nama Lengkap */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FaUser className={accentText} size={10} /> Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.nama_lengkap}
                                        onChange={(e) => setProfile({ ...profile, nama_lengkap: e.target.value })}
                                        className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none ${accentBorder} transition-all font-bold text-slate-700 dark:text-white`}
                                        required
                                    />
                                </div>

                                {/* Username (Read-only for security) */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username Pengguna</label>
                                    <input
                                        type="text"
                                        value={profile.username}
                                        className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-400 cursor-not-allowed opacity-70"
                                        disabled
                                    />
                                </div>

                                {/* NISN / NIK (Read-only usually for students/teachers) */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FaIdCard className={accentText} size={10} /> {profile.role === 'siswa' ? 'NISN' : 'NIK / NUPTK'}
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.nisn_nik || '-'}
                                        className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-400 cursor-not-allowed opacity-70"
                                        disabled
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FaEnvelope className={accentText} size={10} /> Alamat Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email || ''}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none ${accentBorder} transition-all font-bold text-slate-700 dark:text-white`}
                                        placeholder="user@example.com"
                                    />
                                </div>

                                {/* WhatsApp Number */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FaPhoneAlt className={accentText} size={10} /> Nomor WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.wa_number || ''}
                                        onChange={(e) => setProfile({ ...profile, wa_number: e.target.value })}
                                        className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none ${accentBorder} transition-all font-bold text-slate-700 dark:text-white`}
                                        placeholder="08xxxxxxxx"
                                    />
                                </div>

                                {/* Jenis Kelamin */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FaVenusMars className={accentText} size={10} /> Jenis Kelamin
                                    </label>
                                    <select
                                        value={profile.jenis_kelamin || ''}
                                        onChange={(e) => setProfile({ ...profile, jenis_kelamin: e.target.value })}
                                        className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none ${accentBorder} transition-all font-bold text-slate-700 dark:text-white appearance-none`}
                                    >
                                        <option value="">Pilih Jenis Kelamin</option>
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                </div>
                            </div>

                            {/* Password Update Section */}
                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600`}>
                                        <FaLock />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Ubah Kata Sandi</h4>
                                        <p className="text-[10px] font-bold text-slate-400">Kosongkan jika tidak ingin mengubah password.</p>
                                    </div>
                                </div>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan Kata Sandi Baru"
                                    className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none ${accentBorder} transition-all font-bold text-slate-700 dark:text-white`}
                                />
                            </div>
                        </div>

                        {/* Footer Form: Save Bar */}
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`px-12 py-5 ${accentBg} text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-2xl ${accentShadow} hover:opacity-90 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50`}
                            >
                                <FaSave />
                                {isSaving ? "Sinkronisasi..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </form>

                    {/* Security Tip Card */}
                    <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800/40 rounded-3xl flex items-start gap-6">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-indigo-200/50 dark:shadow-none text-indigo-600 shrink-0">
                            <FaLock size={20} />
                        </div>
                        <div>
                            <h5 className="font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight text-sm">Tips Keamanan Akun</h5>
                            <p className="text-indigo-700/70 dark:text-indigo-400/70 text-xs font-medium leading-relaxed mt-2">Jangan pernah memberikan password Anda kepada siapapun. Pihak sekolah tidak pernah meminta kredensial Anda melalui pesan pribadi. Gunakan kombinasi huruf besar, kecil, angka, dan simbol untuk keamanan maksimal.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileBase;
