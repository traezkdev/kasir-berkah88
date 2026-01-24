import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import DarkModeToggle from './DarkModeToggle';
import Button from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { Capacitor } from '@capacitor/core';
import authFetch from '../../utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

const OwnerNavigationHeader = ({ onToggleSidebar, headerTitle = "Kasir Berkah 88", hideMobileHeader = false }) => {
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
      <header className={`${hideMobileHeader ? 'hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:right-0' : 'fixed top-0 left-0 right-0'} z-30 lg:bg-card lg:border-b lg:border-border lg:shadow-elevation-1 lg:text-text-primary dana-blue-bg transition-all duration-300 ${isNativePlatform ? 'pt-10' : 'pt-2'} pb-2 lg:pt-0 lg:pb-0 navigation-header-root`}>
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

      {/* Premium Expanding Bottom Navigation (Modern & Native Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-[#0f172a] border-t border-gray-100 dark:border-slate-800 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <nav className="flex items-center justify-between h-18 px-4 py-2">
          {navigationItems.map((item) => {
            const active = isActiveRoute(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center transition-all duration-500 ease-in-out h-12 rounded-2xl relative group active:scale-90
                    ${active
                    ? 'flex-[2.5] bg-blue-600 dark:bg-white text-white dark:text-slate-900 px-4 shadow-lg shadow-blue-500/30 dark:shadow-white/10 hover:brightness-110'
                    : 'flex-1 text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <Icon
                    name={item.icon}
                    size={24}
                    className={`transition-colors duration-300 ${active ? 'text-white dark:text-slate-900' : 'text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}
                  />
                  {active && (
                    <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-500">
                      {item.label === 'Beranda' ? 'Home' : item.label.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* Adaptive Glassy Overlay */}
                {active && (
                  <div className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-black/5 transition-opacity group-hover:opacity-20" />
                )}

                {/* Critical Stock Badge - Premium Style */}
                {item.path === '/critical-stock' && lowStockCount > 0 && (
                  <div className={`absolute -top-1 -right-1 ${active ? 'bg-white text-blue-600 dark:bg-slate-900 dark:text-white' : 'bg-red-500 text-white'} 
                    min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black 
                    shadow-lg ${active ? 'shadow-white/30' : 'shadow-red-500/50'} border-2 border-white dark:border-slate-900
                    animate-pulse`}>
                    {lowStockCount > 9 ? '9+' : lowStockCount}
                  </div>
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