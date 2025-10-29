import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Icon from '../AppIcon';
import Button from './Button';
import DarkModeToggle from './DarkModeToggle';

const apiUrl = import.meta.env.VITE_API_URL;

const NavigationHeader = ({ isCollapsed = false, onToggleSidebar, headerTitle = "Kasir Berkah 88" }) => {
  const isNativePlatform = Capacitor.isNativePlatform();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [logoUrl, setLogoUrl] = useState('/assets/images/logoberkah88.png'); // Default logo
  const location = useLocation();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings/logo`);
        const data = await response.json();
        if (response.ok && data.data.logo_url) {
            // Prepend API URL if the path is relative
            if (data.data.logo_url.startsWith('/public')) {
              setLogoUrl(`${apiUrl}${data.data.logo_url}`);
            } else {
              setLogoUrl(data.data.logo_url);
            }
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
        // Keep the default logo on error
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
    { label: 'Dashboard', path: '/main-dashboard', icon: 'LayoutDashboard' },
    { label: 'Penjualan', path: '/sales-transaction-processing', icon: 'ShoppingCart' },
    { label: 'Menu', path: '/menu-management', icon: 'UtensilsCrossed' },
    { label: 'Pengeluaran', path: '/expense-tracking', icon: 'Receipt' },
    { label: 'Laporan', path: '/transaction-history', icon: 'FileText' },
    { label: 'Konfirmasi Pesanan', path: '/order-confirmation', icon: 'ClipboardCheck' },
    { label: 'Catatan', path: '/notes', icon: 'Notebook' },
    { label: 'Profil', path: '/profile', icon: 'User' },
    { label: 'Settings', path: '/settings', icon: 'Settings', adminOnly: true },
  ];

  const navigationItems = allNavigationItems.filter(item => {
    if (item.adminOnly && userRole !== 'admin') {
      return false;
    }
    if (item.guestRestricted && userRole === 'guest') {
      return false;
    }
    return true;
  });

  const isActiveRoute = (path) => {
    if (path === '/main-dashboard') {
      return location?.pathname === '/' || location?.pathname === '/main-dashboard';
    }
    return location?.pathname?.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[1001] bg-card border-b border-border shadow-elevation-1 ${isNativePlatform ? 'pt-8' : ''}`}>
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
                            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg" />
              <div>
                <h1 className="text-xl font-semibold text-text-primary">{headerTitle}</h1>
              </div>
            </Link>
          </div>

          {/* Right-aligned group for Desktop */}
          <div className="flex items-center space-x-2">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActiveRoute(item?.path)
                      ? 'bg-primary text-primary-foreground' :'text-text-secondary hover:text-text-primary hover:bg-muted'
                  }`}
                >
                  <Icon name={item?.icon} size={18} />
                  <span>{item?.label}</span>
                </Link>
              ))}
            </nav>

            {/* DarkModeToggle and Mobile Menu Button */}
            <div className="flex items-center space-x-2">
              <div className="lg:hidden">
                <DarkModeToggle />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="lg:hidden"
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-card border-t border-border shadow-elevation-2">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActiveRoute(item?.path)
                      ? 'bg-primary text-primary-foreground' :'text-text-secondary hover:text-text-primary hover:bg-muted'
                  }`}
                >
                  <Icon name={item?.icon} size={20} />
                  <span>{item?.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-1000 bg-card border-t border-border shadow-elevation-2 lg:hidden">
        <nav className="flex items-center justify-around py-2">
          {navigationItems?.slice(0, 5)?.map((item) => (
            <Link
              key={item?.path}
              to={item?.path}
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-md transition-colors duration-200 min-h-44 ${
                isActiveRoute(item?.path)
                  ? 'text-primary' :'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon 
                name={item?.icon} 
                size={20} 
                color={isActiveRoute(item?.path) ? 'var(--color-primary)' : 'currentColor'}
              />
              <span className="text-xs font-medium">{item?.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default NavigationHeader;