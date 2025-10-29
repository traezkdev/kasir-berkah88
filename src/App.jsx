ehimport React, { useEffect, useState } from "react";
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

  return (
    <> {/* Use a React Fragment to return multiple elements */}
      <Toaster position="bottom-center" reverseOrder={false} />
      <Routes headerTitle={headerTitle} />
      <StickyDarkModeToggle />
    </>
  );
}

export default App;
