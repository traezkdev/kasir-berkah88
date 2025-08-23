import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const BreadcrumbNavigation = ({ customPath = null, className = "" }) => {
  const location = useLocation();
  
  const routeLabels = {
    '/': 'Dashboard',
    '/main-dashboard': 'Dashboard',
    '/sales-transaction-processing': 'Penjualan',
    '/menu-management': 'Menu',
    '/expense-tracking': 'Pengeluaran',
    '/transaction-history': 'Riwayat Transaksi',
    '/business-reports': 'Laporan Bisnis'
  };

  const generateBreadcrumbs = () => {
    if (customPath) {
      return customPath;
    }

    const pathSegments = location?.pathname?.split('/')?.filter(segment => segment);
    
    if (pathSegments?.length === 0 || location?.pathname === '/main-dashboard') {
      return [{ label: 'Dashboard', path: '/main-dashboard', isActive: true }];
    }

    const breadcrumbs = [
      { label: 'Dashboard', path: '/main-dashboard', isActive: false }
    ];

    let currentPath = '';
    pathSegments?.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments?.length - 1;
      
      breadcrumbs?.push({
        label: routeLabels?.[currentPath] || segment?.charAt(0)?.toUpperCase() + segment?.slice(1),
        path: currentPath,
        isActive: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs?.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {breadcrumbs?.map((crumb, index) => (
        <React.Fragment key={crumb?.path}>
          {index > 0 && (
            <Icon name="ChevronRight" size={16} className="text-text-secondary" />
          )}
          {crumb?.isActive ? (
            <span className="text-text-primary font-medium" aria-current="page">
              {crumb?.label}
            </span>
          ) : (
            <Link
              to={crumb?.path}
              className="text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              {crumb?.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;