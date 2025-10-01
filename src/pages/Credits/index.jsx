import React from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon'; // Import the Icon component

const Credits = ({ headerTitle }) => {
  const breadcrumbs = [
    { name: 'Beranda', path: '/main-dashboard' },
    { name: 'Credits', path: '/credits' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <NavigationHeader title="Credits" headerTitle={headerTitle} />
      <BreadcrumbNavigation paths={breadcrumbs} />
      <div className="flex-grow pt-20 px-6 pb-20 overflow-auto">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 space-y-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary">Credits</h2>
          <p className="text-text-secondary">Aplikasi ini di buat oleh:</p>
          <p className="text-xl font-semibold text-primary">M Alfin Firdaus (Traezkdev)</p>
          <div className="flex justify-center space-x-4">
            <a href="https://instagram.com/alfinf1rdaus" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
              <Icon name="Instagram" size={24} />
            </a>
            <a href="https://github.com/traezkdev" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
              <Icon name="Github" size={24} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
