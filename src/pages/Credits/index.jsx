import React from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon'; // Import the Icon component
import { useTheme } from '../../contexts/ThemeContext';

const Credits = ({ headerTitle }) => {
  const { theme } = useTheme();
  const breadcrumbs = [
    { name: 'Beranda', path: '/main-dashboard' },
    { name: 'Credits', path: '/credits' },
  ];

  const isDefaultTheme = theme === 'default';

  return (
    <div className={`flex flex-col ${isDefaultTheme ? 'h-screen bg-background' : 'h-full bg-transparent'}`}>
      {isDefaultTheme && <NavigationHeader title="Credits" headerTitle={headerTitle} />}
      <div className="hidden md:block">
        <BreadcrumbNavigation paths={breadcrumbs} />
      </div>
      <div className={`flex-grow ${isDefaultTheme ? 'pt-20' : 'pt-0'} px-6 pb-20 overflow-auto`}>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-none p-8 space-y-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white">Credits</h2>
          <p className="text-text-secondary dark:text-gray-300">Aplikasi ini di buat oleh:</p>
          <p className="text-xl font-semibold text-primary dark:text-blue-400">M Alfin Firdaus (Traezkdev)</p>
          <div className="flex justify-center space-x-4">
            <a href="https://instagram.com/alfinf1rdaus" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <Icon name="Instagram" size={24} />
            </a>
            <a href="https://github.com/traezkdev" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <Icon name="Github" size={24} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
