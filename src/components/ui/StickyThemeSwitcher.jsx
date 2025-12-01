import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FaPalette } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const StickyThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserRole(decodedToken.role.trim()); // Trim whitespace


      } catch (error) {
        console.error("Error decoding token in StickyThemeSwitcher:", error);
        setUserRole(null); // Clear role if decoding fails
      }
    }
  }, []);

  const handleSwitchToAdminTheme = () => {
    setTheme('admin');
  };

  const ownerPaths = [
    '/owner-dashboard',
    '/uang-bisnis',
    '/owner/business-reports',
    '/owner-raw-material-stock',
    '/critical-stock', // Added as per user's specific request for hiding on owner's critical stock page
    '/owner-profile'
  ];

  // Hide the switcher if the current path is an owner-related path, if the theme is 'admin', or if the user is
  //      an owner
  if (ownerPaths.includes(location.pathname) || theme === 'admin' || userRole === 'owner') { // Changed theme !== 'default' to theme === 'admin'




    return null;
  } // MISSING CLOSING BRACE WAS HERE

  return (
    <button
      onClick={handleSwitchToAdminTheme}
      className="hidden md:block fixed bottom-16 right-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark z-50"
      aria-label="Switch to Admin Theme"
    >
      <FaPalette className="h-6 w-6" />
    </button>
  );
};

export default StickyThemeSwitcher;
