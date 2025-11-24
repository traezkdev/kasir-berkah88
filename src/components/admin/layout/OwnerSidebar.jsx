import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  FaTachometerAlt, FaUser, FaSignOutAlt
} from 'react-icons/fa';

const OwnerSidebar = ({ isOpen, toggleSidebar, headerTitle }) => {
  const navigate = useNavigate(); // Declare navigate here
  const navLinkClasses = "flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
  const activeLinkClasses = "bg-gray-700 text-white";

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/login'); // Redirect to login page
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64`}>
        <div className="flex items-center justify-center h-20 border-b border-gray-700">
          <h1 className="text-2xl font-bold">{headerTitle}</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          <NavLink to="/owner-dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaTachometerAlt className="mr-3" />
            Dashboard Owner
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaUser className="mr-3" />
            Profil
          </NavLink>
        </nav>
        <div className="px-2 py-4 border-t border-gray-700">
          <button onClick={handleLogout} className={`${navLinkClasses} w-full`}>
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default OwnerSidebar;