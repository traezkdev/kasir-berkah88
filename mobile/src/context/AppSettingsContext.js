import React, { createContext, useState, useEffect, useContext } from 'react';
import apiService from '../api/apiService';

const AppSettingsContext = createContext();

export const useAppSettings = () => useContext(AppSettingsContext);

export const AppSettingsProvider = ({ children }) => {
    const [headerTitle, setHeaderTitle] = useState('Berkah 88');
    const [isOpen, setIsOpen] = useState(true);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            // Fetch public restaurant settings
            const response = await apiService.get('/api/restaurant-settings');
            if (response.data && response.data.data) {
                setIsOpen(!!response.data.data.is_open);
            }
        } catch (error) {
            console.error('Error fetching app settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
        // Poll for status every 1 minute
        const interval = setInterval(fetchSettings, 60000);
        return () => clearInterval(interval);
    }, []);

    const value = {
        headerTitle,
        isOpen,
        loading,
        refreshSettings: fetchSettings
    };

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    );
};
