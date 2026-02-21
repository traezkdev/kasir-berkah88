import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const TOKEN_KEY = '@vira_chat_token';

export const setToken = async (token) => {
    try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (e) {
        console.error('Error saving token', e);
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

export const removeToken = async () => {
    try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        delete axios.defaults.headers.common['Authorization'];
    } catch (e) {
        console.error('Error removing token', e);
    }
};
