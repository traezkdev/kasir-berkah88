import React from 'react';
import { FaUserCircle } from 'react-icons/fa';

const Header = () => {
  // TODO: Get user data from context or state
  const user = { name: 'Admin' };

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
      </div>
      <div className="flex items-center">
        <span className="mr-4 text-gray-600">Selamat datang, {user.name}</span>
        <button className="p-2 rounded-full hover:bg-gray-200">
          <FaUserCircle className="h-6 w-6 text-gray-600" />
        </button>
        {/* TODO: Add dropdown for profile and logout */}
      </div>
    </header>
  );
};

export default Header;
