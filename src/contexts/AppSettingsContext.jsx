import React, { createContext, useState, useEffect, useContext } from 'react';
import authFetch from '../utils/authFetch';

const AppSettingsContext = createContext();

export const useAppSettings = () => useContext(AppSettingsContext);

export const AppSettingsProvider = ({ children }) => {
  const [headerTitle, setHeaderTitle] = useState('Berkah 88'); // Default value
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchHeaderTitle = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping app settings fetch.');
        return; // Skip fetch if no token
      }

      try {
        const response = await authFetch(`${apiUrl}/api/all-settings`);
        const data = await response.json();
        if (response.ok && data.data && data.data.header_title) {
          setHeaderTitle(data.data.header_title);
        } else {
          console.warn('Failed to fetch header title, using default.');
        }
      } catch (error) {
        console.error('Error fetching app settings:', error);
      }
    };

    fetchHeaderTitle();
  }, [apiUrl]);

  const value = {
    headerTitle,
    // If there's a need to update the header title from other parts of the app,
    // a function like setHeaderTitle can be exposed here.
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};
