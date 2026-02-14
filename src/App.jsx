import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Routes from "./Routes";
import ScrollToTop from './components/ScrollToTop';
import ThemeProvider from './components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './contexts/ThemeContext';
import StickyDarkModeToggle from './components/ui/StickyDarkModeToggle';
import StickyThemeSwitcher from './components/ui/StickyThemeSwitcher';
import DailyWelcomeModal from './components/ui/DailyWelcomeModal';
import { AppSettingsProvider, useAppSettings } from './contexts/AppSettingsContext';
import OfflineSyncManager from './components/OfflineSyncManager';
import ChatWidget from './components/ui/ChatWidget';

const apiUrl = import.meta.env.VITE_API_URL;
import { initOneSignal } from './utils/oneSignal';

import { useDarkMode } from './contexts/DarkModeContext';

function App() {
  const { theme } = useTheme();
  const { isDarkMode } = useDarkMode();
  const location = useLocation();

  // Hide floating action button on login, register, seller pages, and admin pages
  const adminPaths = [
    '/main-dashboard',
    '/menu-management',
    '/expense-tracking',
    '/transaction-history',
    '/transaction-trash',
    '/notes',
    '/calculator',
    '/employee-list',
    '/hpp',
    '/order-confirmation',
    '/transaksi',
    '/raw-material-stock',
    '/main-critical-stock',
    '/admin-uang-bisnis',
    '/laporan',
    '/cash-reconciliation',
    '/dashboard-v2',
    '/settings',
    '/profile',
    '/credits',
    '/chatbot',
    '/all-features',
    '/analisis-data',
    '/auditor',
    '/all-logs',
    '/lapak-deposit',
    '/transaksi-sederhana',
    // Owner pages
    '/owner-dashboard',
    '/uang-bisnis',
    '/owner/business-reports',
    '/owner-profile',
    '/owner-raw-material-stock',
    '/critical-stock',
    '/laporan-lengkap',
    // Kasir pages
    '/cashier-dashboard',
    '/cashier-transaction-history'
  ];

  const isAdminPage = adminPaths.some(path => location.pathname.startsWith(path));
  const showFloatingButton = !['/login', '/register', '/seller/chat', '/admin/chat', '/receipt', '/download'].includes(location.pathname)
    && !location.pathname.startsWith('/seller')
    && !location.pathname.startsWith('/customer')
    && !isAdminPage;

  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    const handleKeyDown = (event) => {
      // Prevent Ctrl+C or Cmd+C
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    const fetchOgSettings = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/app-settings`);
        const { data } = await response.json();
        if (response.ok && data) {
          const origin = window.location.origin;
          const imageUrl = data.og_image_url ? `${apiUrl}${data.og_image_url}` : `${origin}/no_image.png`;

          // Helper function to update meta tags
          const updateMetaTag = (id, content) => {
            const element = document.getElementById(id);
            if (element) {
              element.setAttribute('content', content);
            }
          };

          updateMetaTag('og-title', data.og_title);
          updateMetaTag('og-description', data.og_description);
          updateMetaTag('og-image', imageUrl);
          updateMetaTag('twitter-title', data.og_title);
          updateMetaTag('twitter-description', data.og_description);
          updateMetaTag('twitter-image', imageUrl);
        }
      } catch (error) {
        console.error('Failed to fetch OG settings:', error);
      }
    };

    fetchOgSettings();
    initOneSignal();

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Dynamic Theme Color for Browser (Meta Tag)
  useEffect(() => {
    // Helper to verify and create meta if missing
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = "theme-color";
      document.head.appendChild(themeColorMeta);
    }

    if (isDarkMode) {
      themeColorMeta.setAttribute('content', '#0F172A'); // Global Dark Mode Color
    } else if (location.pathname.startsWith('/customer')) {
      themeColorMeta.setAttribute('content', '#0D9C59'); // Customer Green
    } else if (location.pathname.startsWith('/seller')) {
      themeColorMeta.setAttribute('content', '#3E59E9'); // Seller Blue
    } else {
      themeColorMeta.setAttribute('content', '#128EEA'); // Admin/Default Blue
    }
  }, [location.pathname, isDarkMode]);

  return (
    <AppSettingsProvider>
      <ThemeProvider> {/* Tambahkan ThemeProvider di sini */}
        <ScrollToTop />
        <Toaster position="bottom-center" reverseOrder={false} />
        {!location.pathname.startsWith('/customer') && <DailyWelcomeModal />}
        <Routes />
        {!['/cashier-dashboard', '/', '/transaksi-sederhana'].includes(location.pathname) && <StickyThemeSwitcher />}
        {theme === 'default' && !['/cashier-dashboard', '/', '/transaksi-sederhana'].includes(location.pathname) && <StickyDarkModeToggle />}
        <OfflineSyncManager />
        {showFloatingButton && <ChatWidget />}
      </ThemeProvider>
    </AppSettingsProvider>
  );
}

export default App;
