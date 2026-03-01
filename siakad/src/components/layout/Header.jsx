import React from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaBell, FaUserCircle, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ toggleSidebar, headerName, role }) => {
    const { isDarkMode, toggleTheme } = useTheme();
    const user = JSON.parse(localStorage.getItem('siakad_user') || '{}');
    const profilePath = role === 'admin' ? '/admin/profile' : `/${role}/profile`;

    return (
        <header className="h-20 bg-white dark:bg-[#1F2937] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-8 shadow-sm">
            <div className="flex items-center">
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                    <FaBars size={20} />
                </button>
                <h2 className="ml-4 lg:ml-0 text-sm sm:text-lg lg:text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                    {headerName}
                </h2>
            </div>

            <div className="flex items-center space-x-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                    title={isDarkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
                >
                    {isDarkMode ? <FaSun size={20} className="text-yellow-400" /> : <FaMoon size={20} />}
                </button>

                <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors relative">
                    <FaBell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1F2937]"></span>
                </button>
                <Link to={profilePath} className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{user.nama_lengkap || 'User Siakad'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role || 'Guest'}</p>
                    </div>
                    {user.profile_photo ? (
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-700">
                            <img
                                src={`${import.meta.env.VITE_API_URL}${user.profile_photo}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <FaUserCircle size={32} className="text-gray-400" />
                    )}
                </Link>
            </div>
        </header>
    );
};

export default Header;
