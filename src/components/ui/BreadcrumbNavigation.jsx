import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { jwtDecode } from 'jwt-decode';
import { useTheme } from '../../contexts/ThemeContext';

const BreadcrumbNavigation = ({ customPath = null, className = "", title = null, children }) => {
  const location = useLocation();
  const { theme } = useTheme();

  // Route labels definition
  const routeLabels = {
    '/': 'Dashboard',
    '/main-dashboard': 'Dashboard',
    '/transaksi': 'Penjualan',
    '/menu-management': 'Menu',
    '/expense-tracking': 'Pengeluaran',
    '/transaction-history': 'Riwayat Transaksi',
    '/laporan': 'Laporan Bisnis',
    '/order-confirmation': 'Konfirmasi Pesanan',
    '/all-logs': 'Semua Log',
    '/settings': 'Pengaturan',
    '/settings/database': 'Database',
    // Owner-specific routes
    '/owner-dashboard': 'Dashboard Owner',
    '/owner-profile': 'Profil Owner',
    '/owner-raw-material-stock': 'Stok Bahan Baku Owner',
    '/owner-raw-material-stock/history': 'Riwayat Stok Bahan Baku Owner',
    '/owner/business-reports': 'Laporan Bisnis',
    '/admin-uang-bisnis': 'Riwayat Transaksi Owner',
    '/raw-material-stock': 'Stok Bahan Baku',
    '/lapak-deposit': 'Pengeluaran Lapak',
  };

  const generateBreadcrumbs = () => {
    if (customPath) {
      return customPath;
    }

    let userRole = null;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        userRole = decodedToken.role;
      } catch (e) {
        console.error("Error decoding token in BreadcrumbNavigation:", e);
      }
    }

    const dashboardPath = userRole === 'owner' ? '/owner-dashboard' : '/main-dashboard';
    const dashboardLabel = userRole === 'owner' ? 'Dashboard Owner' : 'Dashboard';

    const pathSegments = location?.pathname?.split('/')?.filter(segment => segment);

    if (pathSegments?.length === 0 || location?.pathname === '/main-dashboard' || location?.pathname === '/owner-dashboard') {
      return [{ label: dashboardLabel, path: dashboardPath, isActive: true }];
    }

    const breadcrumbs = [
      { label: dashboardLabel, path: dashboardPath, isActive: false }
    ];

    let currentPath = '';
    pathSegments?.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments?.length - 1;

      if (currentPath === '/owner' && !isLast) {
        return;
      }

      let segmentLabel;
      if (currentPath === '/owner-raw-material-stock') {
        segmentLabel = userRole === 'owner' ? 'Stok Bahan Baku Owner' : 'Stok Bahan Baku';
      } else {
        segmentLabel = routeLabels?.[currentPath];
      }

      if (!segmentLabel && currentPath.startsWith('/owner/')) {
        segmentLabel = segment?.replace(/-/g, ' ')?.split(' ')?.map(word => word?.charAt(0)?.toUpperCase() + word?.slice(1))?.join(' ');
      }
      if (!segmentLabel) {
        segmentLabel = segment?.charAt(0)?.toUpperCase() + segment?.slice(1);
      }

      breadcrumbs?.push({
        label: segmentLabel,
        path: currentPath,
        isActive: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const activePageTitle = title || (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Page');

  // Logic to hide breadcrumb on Dashboard (single level) unless functionality (children) is present
  if (breadcrumbs?.length <= 1 && !children) {
    return null;
  }

  return (
    <div className={`page-header flex w-full flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${className}`}>
      {/* Left Side: Title & Breadcrumb Inline */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Page Title */}
        <h5 className="text-base md:text-lg font-bold text-gray-800 dark:text-white m-0 whitespace-nowrap">
          {activePageTitle}
        </h5>

        {/* Vertical Separator */}
        <div className="hidden md:block h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

        {/* Breadcrumb List */}
        <nav aria-label="breadcrumb">
          <ul className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
            {breadcrumbs?.map((crumb, index) => (
              <li key={crumb.path} className="flex items-center">
                {index > 0 && (
                  <Icon name="ChevronRight" size={14} className="mx-1 text-gray-400" />
                )}
                {crumb.isActive ? (
                  <span className="text-muted-foreground font-normal" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Right Side: Actions/Children */}
      {children && (
        <div className="page-header-right mt-4 md:mt-0 flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default BreadcrumbNavigation;