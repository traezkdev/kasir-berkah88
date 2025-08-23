import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const NavigationHeader = ({ isCollapsed = false, onToggleSidebar }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { label: 'Dashboard', path: '/main-dashboard', icon: 'LayoutDashboard' },
    { label: 'Penjualan', path: '/sales-transaction-processing', icon: 'ShoppingCart' },
    { label: 'Menu', path: '/menu-management', icon: 'UtensilsCrossed' },
    { label: 'Pengeluaran', path: '/expense-tracking', icon: 'Receipt' },
    { label: 'Laporan', path: '/transaction-history', icon: 'FileText' },
  ];

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
      <header className="fixed top-0 left-0 right-0 z-1000 bg-white border-b border-slate-200 shadow-elevation-1">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            {onToggleSidebar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="lg:hidden"
              >
                <Icon name="Menu" size={20} />
              </Button>
            )}
            <Link to="/main-dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Calculator" size={20} color="white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-text-primary">Kasir Berkah 88</h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems?.map((item) => (
              <Link
                key={item?.path}
                to={item?.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActiveRoute(item?.path)
                    ? 'bg-primary text-white' :'text-text-secondary hover:text-text-primary hover:bg-muted'
                }`}
              >
                <Icon name={item?.icon} size={18} />
                <span>{item?.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="lg:hidden"
          >
            <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 shadow-elevation-2">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActiveRoute(item?.path)
                      ? 'bg-primary text-white' :'text-text-secondary hover:text-text-primary hover:bg-muted'
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
      <div className="fixed bottom-0 left-0 right-0 z-1000 bg-white border-t border-slate-200 shadow-elevation-2 lg:hidden">
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