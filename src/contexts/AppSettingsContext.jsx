import React, { createContext, useState, useEffect, useContext } from 'react';
import authFetch from '../utils/authFetch';

const AppSettingsContext = createContext();

export const useAppSettings = () => useContext(AppSettingsContext);

export const AppSettingsProvider = ({ children }) => {
  const [headerTitle, setHeaderTitle] = useState('Berkah 88'); // Default value
  const [logoUrl, setLogoUrl] = useState('');
  const [appMode, setAppMode] = useState('full'); // Default: full mode
  const [authUiVersion, setAuthUiVersion] = useState('1'); // Default: UI 1
  const [isLoadingMode, setIsLoadingMode] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingMode(false);
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

      // Fetch App Mode
      try {
        const modeResponse = await authFetch(`${apiUrl}/api/user/app-mode`);
        const modeData = await modeResponse.json();
        if (modeResponse.ok && modeData.data && modeData.data.app_mode) {
          setAppMode(modeData.data.app_mode);
        }
      } catch (error) {
        console.error('Error fetching app mode:', error);
      } finally {
        setIsLoadingMode(false);
      }
    };

    const fetchPublicSettings = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings`);
        const data = await response.json();
        if (response.ok && data.data) {
          if (data.data.auth_ui_version) setAuthUiVersion(data.data.auth_ui_version);
        }
      } catch (error) {
        console.error('Error fetching public settings:', error);
      }
    };

    fetchPublicSettings();
    fetchSettings();
  }, [apiUrl]);

  const toggleAppMode = async (newMode) => {
    try {
      const response = await authFetch(`${apiUrl}/api/user/app-mode`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ app_mode: newMode }),
      });

      const data = await response.json();
      if (response.ok && data.data && data.data.app_mode) {
        setAppMode(data.data.app_mode);
        return { success: true, message: 'Mode aplikasi berhasil diubah!' };
      } else {
        throw new Error(data.error || 'Gagal mengubah mode aplikasi');
      }
    } catch (error) {
      console.error('Error toggling app mode:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    headerTitle,
    logoUrl,
    appMode,
    authUiVersion,
    isLoadingMode,
    toggleAppMode,
    setAuthUiVersion,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};
