import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AppState, InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { setOnUnauthorized } from '../api/apiService';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkLoginStatus = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const userData = await AsyncStorage.getItem('userData');
            if (token && userData) {
                setUser(JSON.parse(userData));
            }
        } catch (e) {
            console.error('Failed to load auth state', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const response = await apiService.get('/api/user/profile');
            if (response.data && response.data.message === 'success') {
                const profile = response.data.data;

                setUser(prevUser => {
                    const updatedUser = {
                        ...(prevUser || {}),
                        id: profile.id,
                        name: profile.username,
                        email: profile.email,
                        role: profile.role,
                        avatar_url: profile.avatar_url,
                        phone: profile.phone,
                        address: profile.address,
                        points: profile.points || 0
                    };
                    AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
                    return updatedUser;
                });
            }
        } catch (error) {
            console.error('Failed to refresh user data', error);
        }
    }, []); // No more user dependency

    useEffect(() => {
        checkLoginStatus();

        // Listen for session expiration from apiService
        setOnUnauthorized(() => {
            setUser(null);
        });
    }, [checkLoginStatus]);

    // Separate effect for AppState listener to avoid re-running initialization logic
    useEffect(() => {
        // Refresh user data whenever the app comes back to foreground
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                AsyncStorage.getItem('userToken').then(token => {
                    if (token) {
                        console.log('[AuthContext] App active, refreshing user data...');
                        refreshUser();
                    }
                });
            }
        });

        return () => subscription.remove();
    }, [refreshUser]);

    const login = async (username, password) => {
        try {
            const response = await apiService.post('/api/login', { username, password });
            const { token } = response.data;

            // Decode token untuk mendapatkan info user
            const decoded = jwtDecode(token);

            // Backend biasanya menyimpannya dalam format: { userId, username, role, ... }
            const userData = {
                id: decoded.userId,
                name: decoded.username,
                role: decoded.role
            };

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            setUser(userData);

            // Fetch full profile details (like avatar_url) immediately after login
            InteractionManager.runAfterInteractions(() => {
                refreshUser();
            });

            return { success: true };
        } catch (error) {
            console.error('Login Error:', error);
            return {
                success: false,
                message: error.response?.data?.error || 'Login gagal, periksa username dan password.'
            };
        }
    };

    const updateUser = async (updatedFields) => {
        setUser(prevUser => {
            const newUser = { ...prevUser, ...updatedFields };
            AsyncStorage.setItem('userData', JSON.stringify(newUser));
            return newUser;
        });
    };

    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
