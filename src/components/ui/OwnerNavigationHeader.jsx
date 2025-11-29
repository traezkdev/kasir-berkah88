import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Icon from '../AppIcon';
import Button from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import DarkModeToggle from './DarkModeToggle';
import { FaBell } from 'react-icons/fa';
import authFetch from '../../utils/authFetch';


const apiUrl = import.meta.env.VITE_API_URL;

const OwnerNavigationHeader = ({ isCollapsed = false, onToggleSidebar, headerTitle = "Kasir Berkah 88" }) => {
  const { theme, setTheme } = useTheme();
  const isNativePlatform = Capacitor.isNativePlatform();
  const navigate = useNavigate(); // Declare navigate here

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/login'); // Redirect to login page
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [logoUrl, setLogoUrl] = useState(''); // Initialize with empty string
  const [lowStockCount, setLowStockCount] = useState(0);
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
      return null; // Add a return statement here
    };

    const fetchLowStockCount = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/stock-alerts/count`);
        const data = await response.json();
        if (response.ok && data.data) {
          setLowStockCount(data.data.low_stock_count);
        }
      } catch (error) {
        console.error("Error fetching low stock count:", error);
      }
    };

    fetchLogo();
    fetchLowStockCount();
    const interval = setInterval(fetchLowStockCount, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
      } catch (e) {
        console.error("Error decoding token in OwnerNavigationHeader:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, [location.pathname]); // Re-run when path changes (e.g., after login/logout)

  const allNavigationItems = [
    { label: 'Dashboard', path: '/owner-dashboard', icon: 'BriefcaseBusiness', roles: ['owner'] },
    { label: 'Uang Bisnis', path: '/uang-bisnis', icon: 'DollarSign', roles: ['owner'] },
    { label: 'Laporan Bisnis', path: '/owner/business-reports', icon: 'BarChart3', roles: ['owner'] },
    { label: 'Stok Mentah', path: '/owner-raw-material-stock', icon: 'Package', roles: ['owner'] },
    { label: 'Stok Kritis', path: '/critical-stock', icon: 'AlertTriangle', roles: ['owner', 'admin'] },
    { label: 'Profil', path: '/owner-profile', icon: 'User', roles: ['owner'] },
  ];



  const navigationItems = allNavigationItems.filter(item => {
    return item.roles && item.roles.includes(userRole);
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
      <header className={`fixed top-0 left-0 right-0 z-30 bg-card border-b border-border shadow-elevation-1 ${isNativePlatform ? 'pt-8' : ''}`}>
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
                            {logoUrl && <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />}
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 relative ${
                    isActiveRoute(item?.path)
                      ? 'bg-primary text-primary-foreground' :'text-text-secondary hover:text-text-primary hover:bg-muted'
                  }`}
                >
                  <Icon name={item?.icon} size={18} />
                  <span>{item?.label}</span>
                  {item.path === '/critical-stock' && lowStockCount > 0 && (
                     <span className="absolute top-1 right-1 h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                      {lowStockCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* DarkModeToggle and Mobile Menu Button */}
            <div className="flex items-center md:space-x-2">
              <div className="lg:hidden">
                <DarkModeToggle />
              </div>
              {/* Logout button for desktop */}

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
                  className={`flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 relative ${
                    isActiveRoute(item?.path)
                      ? 'bg-primary text-primary-foreground' :'text-text-secondary hover:text-text-primary hover:bg-muted'
                  }`}
                >
                  <Icon name={item?.icon} size={20} />
                  <span>{item?.label}</span>
                   {item.path === '/critical-stock' && lowStockCount > 0 && (
                     <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                      {lowStockCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="p-4">

              {/* Logout button for mobile */}
              {location.pathname === '/owner-dashboard' && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-muted w-full mt-2"
                >
                  <Icon name="LogOut" size={20} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border shadow-elevation-2 lg:hidden">
        <nav className="flex items-center justify-around py-2">
                    {navigationItems?.slice(0, 5)?.map((item) => (
                      item.path !== '/owner-raw-material-stock' && (
                        <Link
                          key={item?.path}
                          to={item?.path}
                          className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-md transition-colors duration-200 min-h-44 relative ${
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
                          {item.path === '/critical-stock' && lowStockCount > 0 && (
                            <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-600 border-2 border-card"></span>
                          )}
                        </Link>
                      )
                    ))}        </nav>
      </div>
    </>
  );
};

export default OwnerNavigationHeader;