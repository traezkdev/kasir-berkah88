import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Icon from '../AppIcon';
import Button from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import DarkModeToggle from './DarkModeToggle';

const apiUrl = import.meta.env.VITE_API_URL;

const NavigationHeader = ({ isCollapsed = false, onToggleSidebar, headerTitle = "Kasir Berkah 88", rightContent, hideMobileHeader = false }) => {
  const { setTheme } = useTheme();
  const { appMode, headerTitle: settingsHeaderTitle } = useAppSettings();
  const isNativePlatform = Capacitor.isNativePlatform();
  const navigate = useNavigate(); // Declare navigate here

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/login'); // Redirect to login page
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [logoUrl, setLogoUrl] = useState(''); // Initialize with empty string
  const location = useLocation();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings/logo`);
        const data = await response.json();
        if (response.ok && typeof data.data.logo_url === 'string' && data.data.logo_url.length > 0) {
          // Prepend API URL if the path is relative
          if (data.data.logo_url.startsWith('/public')) {
            setLogoUrl(`${apiUrl}${data.data.logo_url}`);
          } else {
            setLogoUrl(data.data.logo_url);
          }
        } else {
          setLogoUrl(''); // Explicitly set to empty if no logo is returned or it's an empty string
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
        setLogoUrl(''); // Set to empty on error as well
      }
    };

    fetchLogo();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
      } catch (e) {
        console.error("Error decoding token in NavigationHeader:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, [location.pathname]); // Re-run when path changes (e.g., after login/logout)

  const allNavigationItems = [
    { label: 'Dashboard', path: '/main-dashboard', icon: 'LayoutDashboard', roles: ['admin', 'user'] },
    { label: 'Dashboard Kasir', path: '/cashier-dashboard', icon: 'ScanBarcode', roles: ['kasir'] },
    { label: 'Penjualan', path: appMode === 'simple' ? '/transaksi-sederhana' : '/transaksi', icon: 'ShoppingCart', roles: ['admin', 'user', 'kasir'] },
    { label: 'Menu', path: '/menu-management', icon: 'UtensilsCrossed', roles: ['admin', 'user'] },
    { label: 'Pengeluaran', path: '/expense-tracking', icon: 'Receipt', roles: ['admin', 'user'] },
    { label: 'Transaksi', path: '/transaction-history', icon: 'ListOrdered', roles: ['admin', 'user', 'kasir'] },

    { label: 'Catatan', path: '/notes', icon: 'Notebook', roles: ['admin', 'user'] },
    { label: 'Profil', path: '/profile', icon: 'User', roles: ['admin', 'user', 'kasir'] },
    { label: 'Pengaturan', path: '/settings', icon: 'Settings', roles: ['admin'] },


  ];



  const navigationItems = allNavigationItems.filter(item => {
    // Basic role check
    if (item.roles && !item.roles.includes(userRole)) {
      return false;
    }

    // Filter based on appMode
    if (appMode === 'simple') {
      const simpleMenuItems = ['Dashboard', 'Penjualan', 'Menu', 'Pengeluaran', 'Transaksi', 'Profil', 'Pengaturan'];
      if (!simpleMenuItems.includes(item.label)) {
        return false;
      }
    }

    // Hide cashiers dashboard from non-cashiers
    if (item.path === '/cashier-dashboard' && userRole !== 'kasir') {
      return false;
    }
    // Hide main dashboard from kasir
    if (item.path === '/main-dashboard' && userRole === 'kasir') {
      return false;
    }

    return true;
  });

  const isActiveRoute = (path) => {
    if (path === '/main-dashboard') {
      return location?.pathname === '/' || location?.pathname === '/main-dashboard';
    }
    return location?.pathname?.startsWith(path === '/business-reports' ? '/laporan' : (path === '/transaksi-sederhana' ? '/transaksi-sederhana' : path));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isMainPage = location.pathname === '/' || location.pathname === '/main-dashboard';

  return (
    <>
      <header className={`${hideMobileHeader ? 'hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:right-0' : 'fixed top-0 left-0 right-0'} z-50 lg:bg-card lg:border-b lg:border-border lg:shadow-elevation-1 lg:text-text-primary bg-[#118eea] lg:bg-card text-white lg:text-text-primary rounded-b-[2.5rem] lg:rounded-none transition-all duration-300 ${isNativePlatform ? 'pt-10' : 'pt-2'} pb-2 lg:pt-0 lg:pb-0 navigation-header-root`}>
        <div className="flex items-center justify-between h-14 lg:h-16 px-5 lg:px-6">
          {/* Left Section: Back Button or Logo */}
          <div className="flex items-center gap-3">
            {!isMainPage && (
              <button
                onClick={() => navigate(-1)}
                className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center bg-white/10 active:scale-90 transition-transform"
              >
                <Icon name="ChevronLeft" size={20} className="text-white" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-3">
              <div className="hidden lg:block">
                {logoUrl && <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />}
              </div>
              <h1 className="text-base lg:text-xl font-black lg:font-semibold uppercase tracking-tight lg:normal-case truncate max-w-[150px] lg:max-w-none">
                {settingsHeaderTitle || headerTitle}
              </h1>
            </Link>
          </div>

          {/* Center Section: Search or empty for mobile */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            {/* Placeholder for future search bar */}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActiveRoute(item?.path)
                    ? 'bg-primary text-primary-foreground font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                    }`}
                >
                  <Icon name={item?.icon} size={18} />
                  <span>{item?.label}</span>
                </Link>
              ))}
            </nav>

            {/* Icons Group */}
            <div className="flex items-center gap-2">
              {rightContent}


              {/* Profile/Settings Quick Access for Mobile */}
              <div
                className="lg:hidden w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
                onClick={() => navigate('/chatbot')}
              >
                <Icon name="Bot" size={18} className="text-white" />
              </div>

              <div
                className="lg:hidden w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
                onClick={toggleMobileMenu}
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={18} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu (Overlay) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 rounded-b-[2rem] mx-4 mt-2 overflow-hidden">
            <nav className="p-4 grid grid-cols-3 gap-4">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${isActiveRoute(item?.path)
                    ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <div className={`p-2 rounded-xl ${isActiveRoute(item?.path) ? 'bg-blue-600/10' : 'bg-gray-100 dark:bg-slate-800'}`}>
                    <Icon name={item?.icon} size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{item?.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
              <button
                onClick={() => {
                  setTheme('admin');
                  setIsMobileMenuOpen(false);
                }}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"
              >
                <Icon name="Monitor" size={14} /> Tema Admin
              </button>
              <button
                onClick={handleLogout}
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2"
              >
                <Icon name="LogOut" size={14} /> Keluar
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation (DANA Style) */}
      {location.pathname !== '/chatbot' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 lg:hidden px-4 pb-2 pt-2 transition-all duration-300">
          <nav className="flex items-center justify-around bg-gray-50 dark:bg-slate-800 rounded-[2rem] py-1.5 px-1 shadow-inner border border-white/5">
            {navigationItems?.slice(0, 5)?.map((item) => (
              <Link
                key={item?.path}
                to={item?.path}
                className={`flex flex-col items-center py-1.5 px-2 rounded-[1.5rem] transition-all duration-300 relative group ${isActiveRoute(item?.path)
                  ? 'text-blue-600 scale-105' : 'text-gray-400'
                  }`}
              >
                <div className={`mb-0.5 transition-transform group-active:scale-90 ${isActiveRoute(item?.path) ? 'animate-bounce-subtle' : ''}`}>
                  <Icon
                    name={item?.icon}
                    size={20}
                    className={isActiveRoute(item?.path) ? 'text-blue-600' : 'text-gray-400'}
                  />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter transition-opacity ${isActiveRoute(item?.path) ? 'opacity-100' : 'opacity-60'}`}>
                  {item.label === 'Dashboard' ? 'Home' : (item.label.split(' ')[0])}
                </span>

                {isActiveRoute(item?.path) && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default NavigationHeader;