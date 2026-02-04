import React, { createContext, useState, useEffect, useContext } from 'react';
import apiService from '../api/apiService';

const AppSettingsContext = createContext();

export const useAppSettings = () => useContext(AppSettingsContext);

export const AppSettingsProvider = ({ children }) => {
    const [headerTitle, setHeaderTitle] = useState('Berkah 88');
    const [isOpen, setIsOpen] = useState(true);
    const [ignoreStock, setIgnoreStock] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            // Fetch public restaurant settings
            const response = await apiService.get('/api/restaurant-settings');
            if (response.data && response.data.data) {
                setIsOpen(!!response.data.data.is_open);
                setIgnoreStock(!!response.data.data.ignore_stock);
            }
        } catch (error) {
            console.error('Error fetching app settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleIgnoreStock = async (value) => {
        try {
            setIgnoreStock(value);
            await apiService.patch('/api/restaurant-settings/ignore-stock', { ignore_stock: value });
        } catch (error) {
            console.error('Failed to toggle ignore stock:', error);
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
        ignoreStock,
        loading,
        refreshSettings: fetchSettings,
        toggleIgnoreStock
    };

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    );
};
