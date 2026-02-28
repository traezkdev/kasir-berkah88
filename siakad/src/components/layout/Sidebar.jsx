import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
    FaTachometerAlt, FaUserGraduate, FaChalkboardTeacher, FaBook,
    FaFileAlt, FaUsers, FaCog, FaSignOutAlt, FaAngleDoubleLeft, FaAngleDoubleRight,
    FaCalendarAlt, FaGraduationCap, FaCalendarCheck
} from 'react-icons/fa';

const MenuItem = ({ to, icon: Icon, children, isCollapsed, navLinkClasses, activeLinkClasses, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
    >
        <Icon className={`${isCollapsed ? '' : 'mr-3'} text-lg flex-shrink-0 transition-transform group-hover:scale-110`} />
        {!isCollapsed && <span>{children}</span>}
    </NavLink>
);

const Sidebar = ({ isOpen, toggleSidebar, role = 'admin' }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const savedState = localStorage.getItem('sias_sidebar_collapsed');
        return savedState === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sias_sidebar_collapsed', isCollapsed);
    }, [isCollapsed]);

    const handleLogout = () => {
        localStorage.removeItem('siakad_token');
        localStorage.removeItem('siakad_user');
        navigate('/login');
    };

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const navLinkClasses = `flex items-center ${isCollapsed ? 'justify-center py-3' : 'px-6 py-3'} w-full text-sm font-medium transition-all duration-200 hover:bg-white/10 group relative z-10 ${isCollapsed ? '' : 'border-l-4 border-transparent hover:border-gray-300'}`;
    const activeLinkClasses = `bg-indigo-900/50 text-white active-item ${isCollapsed ? '' : 'border-l-4 border-indigo-400'}`;
    const groupTitleClasses = `px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${isCollapsed ? 'hidden' : ''}`;

    const renderMenuItems = () => {
        // Wrapper untuk onItemClick agar hanya memicu penutupan jika sedang di mobile (isOpen)
        const handleItemClick = () => {
            if (isOpen && window.innerWidth < 1024) {
                toggleSidebar();
            }
        };

        if (role === 'siswa') {
            return (
                <>
                    <MenuItem to="/siswa/dashboard" icon={FaTachometerAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Dashboard
                    </MenuItem>

                    <div className={isCollapsed ? "mx-4 my-4 border-t-2 border-white/20" : groupTitleClasses}>
                        {!isCollapsed && "Akademik Saya"}
                    </div>
                    <MenuItem to="/siswa/jadwal" icon={FaCalendarAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Jadwal Pelajaran
                    </MenuItem>
                    <MenuItem to="/siswa/absensi" icon={FaCalendarCheck} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Riwayat Kehadiran
                    </MenuItem>
                    <MenuItem to="/siswa/nilai" icon={FaFileAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Nilai & Rapor
                    </MenuItem>
                    <MenuItem to="/siswa/materi" icon={FaBook} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Materi Belajar
                    </MenuItem>

                    <div className={isCollapsed ? "mx-4 my-4 border-t-2 border-white/20" : groupTitleClasses}>
                        {!isCollapsed && "Administrasi"}
                    </div>
                    <MenuItem to="/siswa/pembayaran" icon={FaSignOutAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Pembayaran SPP
                    </MenuItem>
                </>
            );
        }

        if (role === 'guru') {
            return (
                <>
                    <MenuItem to="/guru/dashboard" icon={FaTachometerAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Dashboard
                    </MenuItem>

                    <div className={isCollapsed ? "mx-4 my-4 border-t-2 border-white/20" : groupTitleClasses}>
                        {!isCollapsed && "KBM & Materi"}
                    </div>
                    <MenuItem to="/guru/jadwal" icon={FaCalendarAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Jadwal Pelajaran
                    </MenuItem>
                    <MenuItem to="/guru/presensi" icon={FaUsers} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Presensi & Jurnal
                    </MenuItem>
                    <MenuItem to="/guru/materi" icon={FaBook} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Materi & Tugas
                    </MenuItem>

                    <div className={isCollapsed ? "mx-4 my-4 border-t-2 border-white/20" : groupTitleClasses}>
                        {!isCollapsed && "Penilaian"}
                    </div>
                    <MenuItem to="/guru/nilai-harian" icon={FaFileAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Nilai Harian
                    </MenuItem>
                    <MenuItem to="/guru/nilai-rapor" icon={FaGraduationCap} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        E-Rapor
                    </MenuItem>

                    <div className={isCollapsed ? "mx-4 my-4 border-t-2 border-white/20" : groupTitleClasses}>
                        {!isCollapsed && "Tugas Tambahan"}
                    </div>
                    <MenuItem to="/guru/wali-kelas" icon={FaUserGraduate} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                        Wali Kelas
                    </MenuItem>
                </>
            );
        }

        // Default Admin Role
        return (
            <>
                <MenuItem to="/" icon={FaTachometerAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                    Dashboard Admin
                </MenuItem>

                <div className={isCollapsed ? "mx-4 my-4 border-t-2 border-white/20" : groupTitleClasses}>
                    {!isCollapsed && "Data Sekolah"}
                </div>
                <MenuItem to="/admin/siswa" icon={FaUserGraduate} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                    Data Siswa
                </MenuItem>
                <MenuItem to="/admin/guru" icon={FaChalkboardTeacher} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                    Data Guru
                </MenuItem>
                <MenuItem to="/admin/mapel" icon={FaBook} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                    Mata Pelajaran
                </MenuItem>
                <MenuItem to="/admin/jadwal" icon={FaCalendarAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                    Jadwal Pelajaran
                </MenuItem>
                <MenuItem to="/admin/agenda" icon={FaCalendarCheck} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                    Agenda Sekolah
                </MenuItem>

                <div className={isCollapsed ? "mx-4 my-4 border-t-2 border-white/20" : groupTitleClasses}>
                    {!isCollapsed && "Laporan"}
                </div>
                <MenuItem to="/admin/nilai" icon={FaFileAlt} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                    Rekap Nilai
                </MenuItem>
                <MenuItem to="/admin/kelas" icon={FaUsers} isCollapsed={isCollapsed} navLinkClasses={navLinkClasses} activeLinkClasses={activeLinkClasses} onClick={handleItemClick}>
                    Manajemen Kelas
                </MenuItem>
            </>
        );
    };

    return (
        <>
            {/* Backdrop Mobile: Klik di area gelap untuk menutup sidebar */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
                    onClick={toggleSidebar}
                ></div>
            )}

            <div className={`fixed inset-y-0 left-0 z-30 ${isCollapsed ? 'w-20' : 'w-64'} sidebar-root transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col h-screen shadow-2xl`}>
                <div className={`flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} h-20 border-b border-white/10`}>
                    {!isCollapsed && (
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                                <FaGraduationCap className="text-white text-xl" />
                            </div>
                            <h1 className="text-xl font-bold text-white whitespace-nowrap uppercase">SIAS {role}</h1>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <FaGraduationCap className="text-white text-xl" />
                        </div>
                    )}

                    {/* Tombol Tutup Mobile (X) */}
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                        <span className="text-2xl">×</span>
                    </button>

                    {/* Tombol Collapse Desktop */}
                    <button
                        onClick={toggleCollapse}
                        className={`hidden lg:flex p-1.5 rounded-full bg-white text-indigo-900 hover:bg-gray-100 transition-colors ${isCollapsed ? 'absolute -right-3 top-7 shadow-lg' : 'ml-2'}`}
                    >
                        {isCollapsed ? <FaAngleDoubleRight size={12} /> : <FaAngleDoubleLeft size={16} />}
                    </button>
                </div>

                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {renderMenuItems()}

                    <div className={isCollapsed ? "mx-4 my-4 border-t-2 border-white/20" : groupTitleClasses}>
                        {!isCollapsed && "Sistem"}
                    </div>
                    <MenuItem
                        to={role === 'admin' ? "/admin/settings" : "/guru/settings"}
                        icon={FaCog}
                        isCollapsed={isCollapsed}
                        navLinkClasses={navLinkClasses}
                        activeLinkClasses={activeLinkClasses}
                        onClick={() => { if (isOpen && window.innerWidth < 1024) toggleSidebar(); }}
                    >
                        Pengaturan
                    </MenuItem>
                </nav>

                <div className="px-2 py-4 border-t border-white/10 text-center">
                    <button
                        onClick={handleLogout}
                        className={`${navLinkClasses} w-full`}
                    >
                        <FaSignOutAlt className={`${isCollapsed ? '' : 'mr-3'} text-lg flex-shrink-0`} />
                        {!isCollapsed && <span>Keluar</span>}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
