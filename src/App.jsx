import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Routes from "./Routes";
import ScrollToTop from './components/ScrollToTop';
import ThemeProvider from './components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './contexts/ThemeContext';
import StickyDarkModeToggle from './components/ui/StickyDarkModeToggle';
import StickyThemeSwitcher from './components/ui/StickyThemeSwitcher';
import { AppSettingsProvider, useAppSettings } from './contexts/AppSettingsContext';

const apiUrl = import.meta.env.VITE_API_URL;

function App() {
  const { theme } = useTheme();
  const location = useLocation();

  // Hide floating action button on login and register pages
  const showFloatingButton = !['/login', '/register'].includes(location.pathname);

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

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <AppSettingsProvider>
      <ThemeProvider> {/* Tambahkan ThemeProvider di sini */}
        <Toaster position="bottom-center" reverseOrder={false} />
        <Routes />
        {location.pathname !== '/cashier-dashboard' && <StickyThemeSwitcher />}
        {theme === 'default' && location.pathname !== '/cashier-dashboard' && <StickyDarkModeToggle />}
      </ThemeProvider>
    </AppSettingsProvider>
  );
}

export default App;
