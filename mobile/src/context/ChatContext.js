import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);

    const fetchConversations = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const response = await apiService.get('/api/messages/conversations');
            if (response.data && response.data.data) {
                setConversations(response.data.data);

                // Calculate total unread
                const totalUnread = response.data.data.reduce((acc, conv) => acc + (Number(conv.unread_count) || 0), 0);
                setUnreadCount(totalUnread);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000); // Polling every 5 seconds
        return () => clearInterval(interval);
    }, [fetchConversations]);

    const markAsRead = async (senderId) => {
        try {
            await apiService.put(`/api/messages/read/${senderId}`);
            fetchConversations();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    return (
        <ChatContext.Provider value={{
            unreadCount,
            conversations,
            fetchConversations,
            activeChat,
            setActiveChat,
            markAsRead,
            activeOrder,
            setActiveOrder
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

export default ChatContext;
