import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { jwtDecode } from 'jwt-decode'; // Add this import

const BreadcrumbNavigation = ({ customPath = null, className = "" }) => {
  const location = useLocation();

  const routeLabels = {
    '/': 'Dashboard',
    '/main-dashboard': 'Dashboard',
    '/sales-transaction-processing': 'Penjualan',
    '/menu-management': 'Menu',
    '/expense-tracking': 'Pengeluaran',
    '/transaction-history': 'Riwayat Transaksi',
    '/business-reports': 'Laporan Bisnis', // This will now be primarily for admin/user
    '/order-confirmation': 'Konfirmasi Pesanan',
    // Owner-specific routes
    '/owner-dashboard': 'Dashboard Owner',
    '/owner-profile': 'Profil Owner',
    '/owner-raw-material-stock': 'Stok Bahan Baku Owner',
    '/owner-raw-material-stock/history': 'Riwayat Stok Bahan Baku Owner',
    '/owner/business-reports': 'Laporan Bisnis', // Explicitly define for owner
    '/admin-uang-bisnis': 'Riwayat Transaksi Owner',
    '/raw-material-stock': 'Stok Bahan Baku',
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

    // Check if it's the root or specific dashboard paths
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

      // Skip adding '/owner' as a separate breadcrumb if it's just a prefix for other owner routes
      if (currentPath === '/owner' && !isLast) {
        return; // Skip this segment
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

  if (breadcrumbs?.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-xs md:text-sm pt-4 ${className}`} aria-label="Breadcrumb">
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