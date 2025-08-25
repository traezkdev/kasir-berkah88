import React, { useEffect, useState } from "react";
import Routes from "./Routes";
import authFetch from './utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

function App() {
  const [websiteTitle, setWebsiteTitle] = useState('Kasir Berkah 88'); // Default title
  const [headerTitle, setHeaderTitle] = useState('Kasir Berkah 88'); // Default header title

  useEffect(() => {
    const fetchWebsiteTitle = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/settings`);
        const data = await response.json();
        if (response.ok) {
          setWebsiteTitle(data.data.website_title || 'Kasir Berkah 88');
          setHeaderTitle(data.data.header_title || 'Kasir Berkah 88'); // Assuming header_title from API
        } else {
          console.error('Failed to fetch website title:', data.error);
        }
      } catch (err) {
        console.error('Network error fetching website title:', err);
      }
    };
    fetchWebsiteTitle();
  }, []);

  useEffect(() => {
    document.title = websiteTitle;
  }, [websiteTitle]);

  return (
    <Routes headerTitle={headerTitle} />
  );
}

export default App;
