import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const TOKEN_KEY = '@vira_chat_token';

const USER_KEY = '@vira_chat_user';

export const setToken = async (token) => {
    try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (e) {
        console.error('Error saving token', e);
    }
};

export const setUser = async (user) => {
    try {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
        console.error('Error saving user', e);
    }
};

export const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        return token;
    } catch (e) {
        console.error('Error getting token', e);
        return null;
    }
};

export const getUser = async () => {
    try {
        const user = await AsyncStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error('Error getting user', e);
        return null;
    }
};

export const removeToken = async () => {
    try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
        delete axios.defaults.headers.common['Authorization'];
    } catch (e) {
        console.error('Error removing token', e);
    }
};
