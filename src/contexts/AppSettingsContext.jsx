import React, { createContext, useState, useEffect, useContext } from 'react';
import authFetch from '../utils/authFetch';

const AppSettingsContext = createContext();

export const useAppSettings = () => useContext(AppSettingsContext);

export const AppSettingsProvider = ({ children }) => {
  const [headerTitle, setHeaderTitle] = useState('Berkah 88'); // Default value
  const [logoUrl, setLogoUrl] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return; // Skip fetch if no token
      }

      // Fetch Header Title
      try {
        const response = await authFetch(`${apiUrl}/api/all-settings`);
        const data = await response.json();
        if (response.ok && data.data && data.data.header_title) {
          setHeaderTitle(data.data.header_title);
        }
      } catch (error) {
        console.error('Error fetching header title:', error);
      }

      // Fetch Logo
      try {
        const logoResponse = await authFetch(`${apiUrl}/api/settings/logo`);
        const logoData = await logoResponse.json();
        if (logoResponse.ok && logoData.data && typeof logoData.data.logo_url === 'string' && logoData.data.logo_url.length > 0) {
          if (logoData.data.logo_url.startsWith('/public')) {
            setLogoUrl(`${apiUrl}${logoData.data.logo_url}`);
          } else {
            setLogoUrl(logoData.data.logo_url);
          }
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };

    fetchSettings();
  }, [apiUrl]);

  const value = {
    headerTitle,
    logoUrl
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};
