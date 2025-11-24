import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Icon from '../AppIcon';
import Button from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import DarkModeToggle from './DarkModeToggle';

const apiUrl = import.meta.env.VITE_API_URL;

const OwnerNavigationHeader = ({ isCollapsed = false, onToggleSidebar, headerTitle = "Kasir Berkah 88" }) => {
  const { setTheme } = useTheme();
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
      return null; // Add a return statement here
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
        console.error("Error decoding token in OwnerNavigationHeader:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, [location.pathname]); // Re-run when path changes (e.g., after login/logout)

  const allNavigationItems = [
    { label: 'Dashboard Owner', path: '/owner-dashboard', icon: 'BriefcaseBusiness', roles: ['owner'] },
    { label: 'Profil Owner', path: '/owner-profile', icon: 'User', roles: ['owner'] },
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
            <div className="p-4">
              <button
                onClick={() => {
                  setTheme('admin');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-muted w-full"
              >
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className="h-5 w-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <path d="M528 0H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h192l-16 48h-72c-13.3 0-24 10.7-24 24s10.7 24 24 24h272c13.3 0 24-10.7 24-24s-10.7-24-24-24h-72l-16-48h192c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48zm-16 352H64V64h448v288z"></path>
                  </svg>
                  <span>Beralih ke tema admin</span>
              </button>
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

export default OwnerNavigationHeader;