import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaBars } from 'react-icons/fa';
import authFetch from '../../../utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

const Header = ({ toggleSidebar }) => {
  const [user, setUser] = useState({ name: 'Admin', avatar_url: null });

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
    fetchUserData();
  }, []);

  const avatarSrc = user.avatar_url ? `${apiUrl}${user.avatar_url}` : '/assets/images/no_image.png';

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden">
          <FaBars className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 ml-4 lg:ml-0">Dashboard</h1>
      </div>
      <div className="flex items-center">
        <span className="mr-4 text-gray-600 dark:text-gray-300 hidden sm:block">Selamat datang, {user.username || user.name}</span>
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
