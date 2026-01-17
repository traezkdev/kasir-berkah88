import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import DarkModeToggle from './DarkModeToggle';
import Button from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { Capacitor } from '@capacitor/core';
import authFetch from '../../utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

const OwnerNavigationHeader = ({ onToggleSidebar, headerTitle = "Kasir Berkah 88" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [logoUrl, setLogoUrl] = useState('');
  const [lowStockCount, setLowStockCount] = useState(0);

  const isNativePlatform = Capacitor.isNativePlatform();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings/logo`);
        const data = await response.json();
        if (response.ok && data.data.logo_url) {
          setLogoUrl(data.data.logo_url.startsWith('/public') ? `${apiUrl}${data.data.logo_url}` : data.data.logo_url);
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
      }
    };

    const fetchLowStockCount = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/stock-alerts/count`);
        const data = await response.json();
        if (response.ok) {
          setLowStockCount(data.data.low_stock_count);
        }
      } catch (error) {
        console.error('Failed to fetch low stock count:', error);
      }
    };

    fetchLogo();
    fetchLowStockCount();
    const interval = setInterval(fetchLowStockCount, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
    { label: 'Beranda', path: '/owner-dashboard', icon: 'LayoutDashboard' },
    { label: 'Uang Bisnis', path: '/uang-bisnis', icon: 'Wallet' },
    { label: 'Analisis', path: '/analisis-data', icon: 'BarChart' },
    { label: 'Stok', path: '/owner-raw-material-stock', icon: 'Package' },
    { label: 'Kritis', path: '/critical-stock', icon: 'AlertTriangle' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    if (path === '/owner-dashboard') {
      return location?.pathname === '/owner-dashboard' || location?.pathname === '/';
    }
    return location?.pathname?.startsWith(path);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-30 lg:bg-card lg:border-b lg:border-border lg:shadow-elevation-1 lg:text-text-primary dana-blue-bg dana-header-rounded transition-all duration-300 ${isNativePlatform ? 'pt-10' : 'pt-2'} pb-2 lg:pt-0 lg:pb-0 navigation-header-root`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-14 lg:h-16">
            <div className="flex items-center space-x-3 lg:space-x-4">
              {/* Back Button for mobile when not on dashboard */}
              {location.pathname !== '/owner-dashboard' && location.pathname !== '/' && (
                <button
                  onClick={() => navigate(-1)}
                  className="lg:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Back"
                >
                  <Icon name="ArrowLeft" size={24} />
                </button>
              )}

              <Link to="/owner-dashboard" className="flex items-center space-x-2 group">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg shadow-elevation-1 group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name="Store" className="text-primary" size={20} />
                  </div>
                )}
                <div>
                  <h1 className="text-base lg:text-xl font-bold lg:text-text-primary text-white leading-tight">
                    {headerTitle}
                  </h1>
                  <p className="text-[10px] lg:text-xs lg:text-text-secondary text-white/80 font-medium">
                    Owner Panel
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-1 lg:space-x-3">
              <Link
                to="/critical-stock"
                className="relative p-2 text-white lg:text-text-secondary hover:bg-white/10 lg:hover:bg-primary/5 rounded-full transition-all duration-200"
              >
                <Icon name="Bell" size={22} />
                {lowStockCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-primary lg:border-card animate-pulse">
                    {lowStockCount}
                  </span>
                )}
              </Link>

              <div className="hidden lg:block">
                <DarkModeToggle />
              </div>

              <div className="h-6 w-px bg-white/20 lg:bg-border mx-1"></div>

              <button
                onClick={handleLogout}
                className="p-2 text-white lg:text-destructive hover:bg-white/10 lg:hover:bg-destructive/5 rounded-full transition-all duration-200"
                title="Logout"
              >
                <Icon name="LogOut" size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-lg border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:hidden safe-area-bottom">
        <nav className="flex items-center justify-around h-16 px-2">
          {navigationItems.map((item) => {
            const active = isActiveRoute(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-all duration-300 relative ${active ? 'text-primary scale-110' : 'text-text-secondary hover:text-text-primary'
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors duration-300 ${active ? 'bg-primary/10' : ''}`}>
                  <Icon
                    name={item.icon}
                    size={20}
                    color={active ? 'var(--color-primary)' : 'currentColor'}
                  />
                </div>
                <span className={`text-[10px] font-bold mt-1 truncate w-full text-center transition-all duration-300 ${active ? 'opacity-100' : 'opacity-80'}`}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"></span>
                )}
                {item.path === '/critical-stock' && lowStockCount > 0 && !active && (
                  <span className="absolute top-1 right-1/4 h-2 w-2 rounded-full bg-red-600 border-2 border-card"></span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default OwnerNavigationHeader;