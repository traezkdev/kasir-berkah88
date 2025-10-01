import React, { useEffect, useState } from "react";
import Routes from "./Routes";
import authFetch from './utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

function App() {
  const [headerTitle, setHeaderTitle] = useState('Kasir Berkah 88'); // Default header title

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
    <Routes headerTitle={headerTitle} />
  );
}

export default App;