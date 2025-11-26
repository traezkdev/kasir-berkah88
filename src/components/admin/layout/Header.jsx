import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaBars, FaDesktop, FaBell } from 'react-icons/fa';
import authFetch from '../../../utils/authFetch';
import DarkModeToggle from '../../ui/DarkModeToggle';
import { useTheme } from '../../../contexts/ThemeContext';

const apiUrl = import.meta.env.VITE_API_URL;

const Header = ({ toggleSidebar }) => {
  const { setTheme } = useTheme();
  const [user, setUser] = useState({ name: 'Admin', avatar_url: null });
  const [lowStockCount, setLowStockCount] = useState(0);

  const handleSwitchToDefaultTheme = () => {
    setTheme('default');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/user/profile`);
        const data = await response.json();
        if (response.ok && data.data) {
          setUser(prevUser => ({ ...prevUser, ...data.data }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchLowStockCount = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/stock-alerts/count`);
        const data = await response.json();
        if (response.ok && data.data) {
          setLowStockCount(data.data.low_stock_count);
        }
      } catch (error) {
        console.error("Error fetching low stock count:", error);
      }
    };

    fetchUserData();
    fetchLowStockCount(); // Initial fetch
    const interval = setInterval(fetchLowStockCount, 60000); // Fetch every 60 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const avatarSrc = user.avatar_url ? `${apiUrl}${user.avatar_url}` : '/assets/images/no_image.png';

  return (
    <header className="flex items-center justify-between h-20 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden">
          <FaBars className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 ml-4 lg:ml-0">Dashboard</h1>
      </div>
      <div className="flex items-center">
        <span className="mr-4 text-gray-600 dark:text-gray-300 hidden sm:block">Selamat datang, {user.username || user.name}</span>
        <DarkModeToggle className="mr-2" />
        <button onClick={handleSwitchToDefaultTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2">
          <FaDesktop className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>
        
        <Link to="/critical-stock" className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2">
          <FaBell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          {lowStockCount > 0 && (
            <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
              {lowStockCount}
            </span>
          )}
        </Link>

        <Link to="/profile" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          {user.avatar_url ? (
            <img src={avatarSrc} alt="Profile" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <FaUserCircle className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          )}
        </Link>
        {/* TODO: Add dropdown for profile and logout */}
      </div>
    </header>
  );
};

export default Header;
