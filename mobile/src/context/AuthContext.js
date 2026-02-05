import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
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
    };

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
            return { success: true };
        } catch (error) {
            console.error('Login Error:', error);
            return {
                success: false,
                message: error.response?.data?.error || 'Login gagal, periksa username dan password.'
            };
        }
    };

    const refreshUser = async () => {
        try {
            const response = await apiService.get('/api/user/profile');
            if (response.data && response.data.message === 'success') {
                const profile = response.data.data;
                const updatedUser = {
                    ...user,
                    id: profile.id,
                    name: profile.username,
                    role: profile.role,
                    avatar_url: profile.avatar_url,
                    phone: profile.phone,
                    address: profile.address
                };
                await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
        } catch (error) {
            console.error('Failed to refresh user data', error);
        }
    };

    const updateUser = async (updatedFields) => {
        const newUser = { ...user, ...updatedFields };
        await AsyncStorage.setItem('userData', JSON.stringify(newUser));
        setUser(newUser);
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
