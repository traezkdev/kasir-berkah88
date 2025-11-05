import React from 'react';
import { FaUserCircle, FaBars } from 'react-icons/fa';

const Header = ({ toggleSidebar }) => {
  // TODO: Get user data from context or state
  const user = { name: 'Admin' };

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden">
          <FaBars className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 ml-4 lg:ml-0">Dashboard</h1>
      </div>
      <div className="flex items-center">
        <span className="mr-4 text-gray-600 dark:text-gray-300 hidden sm:block">Selamat datang, {user.name}</span>
        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <FaUserCircle className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>
        {/* TODO: Add dropdown for profile and logout */}
      </div>
    </header>
  );
};

export default Header;
