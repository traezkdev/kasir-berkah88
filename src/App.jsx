import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Routes from "./Routes";
import authFetch from './utils/authFetch';
import ScrollToTop from './components/ScrollToTop';
import ThemeProvider from './components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import StickyDarkModeToggle from './components/ui/StickyDarkModeToggle';

const apiUrl = import.meta.env.VITE_API_URL;

function App() {
  const [headerTitle, setHeaderTitle] = useState('Kasir Berkah 88'); // Default header title
  const location = useLocation();

  // Hide floating action button on login and register pages
  const showFloatingButton = !['/login', '/register'].includes(location.pathname);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings`);
        const data = await response.json();
        if (response.ok) {
          const settings = data.data;
          
          // Set Website Title
          const newTitle = settings.website_title || 'Kasir Berkah 88';
          document.title = newTitle;

          // Set Header Title
          setHeaderTitle(settings.header_title || 'Kasir Berkah 88');
        } else {
          console.error('Failed to fetch settings:', data.error);
        }
      } catch (err) {
        // This can happen if the user is offline or the backend is down.
        // The app will just use the default title.
        console.error('Network error fetching settings:', err);
      }
    };
    
    fetchSettings();
  }, []);

  useEffect(() => {
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
  }, []);

  return (
    <> {/* Use a React Fragment to return multiple elements */}
      <Toaster position="bottom-center" reverseOrder={false} />
      <Routes headerTitle={headerTitle} />
      {location.pathname !== '/cashier-dashboard' && <StickyDarkModeToggle />}
    </>
  );
}

export default App;
