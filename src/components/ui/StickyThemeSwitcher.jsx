import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FaPalette } from 'react-icons/fa';

const StickyThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const handleSwitchToAdminTheme = () => {
    setTheme('admin');
  };

  if (theme !== 'default') {
    return null;
  }

  return (
    <button
      onClick={handleSwitchToAdminTheme}
      className="fixed bottom-16 right-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark z-50"
      aria-label="Switch to Admin Theme"
    >
      <FaPalette className="h-6 w-6" />
    </button>
  );
};

export default StickyThemeSwitcher;
