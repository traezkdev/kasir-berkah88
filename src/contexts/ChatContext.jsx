import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authFetch from '../utils/authFetch';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // { user_id, username, role, avatar_url }

    const fetchConversations = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await authFetch('/api/messages/conversations');
            if (response.ok) {
                const data = await response.json();
                setConversations(data.data);

                // Calculate total unread
                const totalUnread = data.data.reduce((acc, conv) => acc + (Number(conv.unread_count) || 0), 0);
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
            await authFetch(`/api/messages/read/${senderId}`, { method: 'PUT' });
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
            markAsRead
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
