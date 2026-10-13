import React, { createContext, useState, useEffect, useContext } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';

const AppSettingsContext = createContext();

export const useAppSettings = () => useContext(AppSettingsContext);

export const AppSettingsProvider = ({ children }) => {
    const [headerTitle, setHeaderTitle] = useState('Berkah 88');
    const [isOpen, setIsOpen] = useState(true);
    const [ignoreStock, setIgnoreStock] = useState(false);
    const [loading, setLoading] = useState(true);
    const [logoUrl, setLogoUrl] = useState(null);
    const [ownerPhone, setOwnerPhone] = useState(null);

    const fetchSettings = async () => {
        try {
            // Fetch public restaurant settings
            const response = await apiService.get('/api/restaurant-settings');
            if (response.data && response.data.data) {
                const d = response.data.data;
                setIsOpen(!!d.is_open);
                setIgnoreStock(!!d.ignore_stock);
                // restaurant_name is the actual field from admin settings
                const name = d.restaurant_name || d.app_name;
                if (name) {
                    setHeaderTitle(name);
                    AsyncStorage.setItem('cached_restaurant_name', name).catch(() => {});
                }
                if (d.owner_phone) {
                    setOwnerPhone(d.owner_phone);
                    AsyncStorage.setItem('cached_owner_phone', d.owner_phone).catch(() => {});
                }
            }

            // Fetch logo
            const logoResponse = await apiService.get('/api/settings/logo');
            if (logoResponse.data && logoResponse.data.data && logoResponse.data.data.logo_url) {
                setLogoUrl(logoResponse.data.data.logo_url);
                AsyncStorage.setItem('cached_logo_url', logoResponse.data.data.logo_url).catch(() => {});
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
        // Load cached values first for instant render
        AsyncStorage.getItem('cached_restaurant_name').then(val => {
            if (val) setHeaderTitle(val);
        }).catch(() => {});
        AsyncStorage.getItem('cached_owner_phone').then(val => {
            if (val) setOwnerPhone(val);
        }).catch(() => {});
        AsyncStorage.getItem('cached_logo_url').then(val => {
            if (val) setLogoUrl(val);
        }).catch(() => {});

        fetchSettings();

        // Refresh when app returns to foreground
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                console.log('[Settings] App active, refreshing settings...');
                fetchSettings();
            }
        });

        // Poll for status every 1 minute
        const interval = setInterval(fetchSettings, 60000);
        return () => {
            subscription.remove();
            clearInterval(interval);
        };
    }, []);

    const value = {
        headerTitle,
        isOpen,
        ignoreStock,
        loading,
        logoUrl,
        ownerPhone,
        refreshSettings: fetchSettings,
        toggleIgnoreStock
    };

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    );
};
