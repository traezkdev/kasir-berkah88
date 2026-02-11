import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';
import { useAuth } from './AuthContext';
import { useOrderNotification } from './OrderNotificationContext';
import { AppState } from 'react-native';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    // All hooks must be at the top level, in the same order every render
    const [unreadCount, setUnreadCount] = useState(0);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);

    // Refs
    const lastProcessedMsgId = useRef(null);
    const lastReceiveTime = useRef(0);

    // Context hooks
    const { socket } = useOrderNotification();
    const { user } = useAuth();

    const fetchConversations = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const response = await apiService.get('/api/messages/conversations');

            if (response.data && response.data.data) {
                setConversations(response.data.data);
                const serverUnread = response.data.data.reduce((acc, conv) => acc + (Number(conv.unread_count) || 0), 0);

                // Mencegah "Kabur-kaburan": 
                // Jika baru saja terima pesan (< 5 detik), jangan turunkan angka jika server masih bilang 0
                setUnreadCount(prev => {
                    const isRecentlyReceived = (Date.now() - lastReceiveTime.current) < 5000;
                    if (isRecentlyReceived && serverUnread < prev) {
                        console.log('[ChatContext] Server telat (delay), mempertahankan titik merah...');
                        return prev;
                    }
                    return serverUnread;
                });
            }
        } catch (error) {
            console.error('[ChatContext] Failed to fetch conversations:', error);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        // Polling dihapus agar tidak menimpa data real-time socket
    }, [fetchConversations]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            // Cek duplikasi sinyal (pernah diproses belum?)
            if (lastProcessedMsgId.current === message.id) return;
            lastProcessedMsgId.current = message.id;

            const currentUserId = user?.id || user?.userId || user?.user_id;
            const myIdStr = currentUserId ? String(currentUserId) : null;
            const receiverIdStr = message.receiver_id ? String(message.receiver_id) : null;
            const senderIdStr = message.sender_id ? String(message.sender_id) : null;

            console.log(`[ChatContext] INCOMING: From=${senderIdStr}, To=${receiverIdStr}, Me=${myIdStr}, Role=${user?.role}`);

            const isMine = senderIdStr === myIdStr;
            if (isMine) return;

            const isSeller = ['admin', 'owner', 'penjual', 'kasir', 'seller'].includes(user?.role);
            const isCustomer = user?.role === 'pelanggan' || user?.role === 'user';

            let isRelevant = false;

            if (isCustomer) {
                if (receiverIdStr === myIdStr) isRelevant = true;
            } else if (isSeller) {
                if (receiverIdStr === myIdStr || message.sender_role === 'pelanggan' || message.sender_role === 'user') {
                    isRelevant = true;
                }
            }

            if (isRelevant) {
                console.log('[ChatContext] Pesan baru terdeteksi, menambah titik merah...');
                lastReceiveTime.current = Date.now(); // Kunci angka selama 5 detik

                // Tambah manual segera agar titik muncul instan
                setUnreadCount(prev => prev + 1);

                // Sinkronisasi dengan server setelah jeda
                setTimeout(() => fetchConversations(), 1500);
            }
        };

        const handleMessageEdited = () => fetchConversations();
        const handleMessageDeleted = () => fetchConversations();
        const handleMessagesRead = ({ senderId, readerId }) => {
            const currentUserId = user?.id || user?.userId || user?.user_id;
            const myIdStr = currentUserId ? String(currentUserId) : null;
            const rIdStr = String(readerId);

            // Jika saya yang membaca (di device lain) ATAU saya adalah pengirim pesan yang baru saja dibaca
            if (rIdStr === myIdStr || String(senderId) === myIdStr) {
                console.log('[ChatContext] Pesan telah dibaca, memperbarui titik...');
                fetchConversations();
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('messages_read', handleMessagesRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket, fetchConversations, user]);

    // Handle AppState changes (Foreground refresh)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                fetchConversations();
            }
        });
        return () => subscription.remove();
    }, [fetchConversations]);

    const markAsRead = useCallback(async (senderId) => {
        try {
            await apiService.put(`/api/messages/read/${senderId}`);
            fetchConversations();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }, [fetchConversations]);

    const contextValue = React.useMemo(() => ({
        unreadCount,
        conversations,
        fetchConversations,
        activeChat,
        setActiveChat,
        markAsRead,
        activeOrder,
        setActiveOrder
    }), [unreadCount, conversations, fetchConversations, activeChat, markAsRead, activeOrder]);

    return (
        <ChatContext.Provider value={contextValue}>
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
