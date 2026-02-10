import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    Platform,
    Image,
    ActivityIndicator,

    StatusBar,
    Modal,
    KeyboardAvoidingView,
    Keyboard,
    InteractionManager,
    Alert
} from 'react-native';
import {
    MessageCircle,
    Send,
    User,
    ArrowLeft,
    Search,
    ShoppingBag,
    X,
    Trash2,
    Check,
    Clock,
    Image as ImageIcon,
    Camera
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '../../context/ChatContext';
import apiService, { API_URL } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfirm } from '../../context/ConfirmContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';

// --- WHATSAPP-STYLE OPTIMIZATIONS ---

// 1. Optimistic Message Item with minimal re-renders
const MessageItem = memo(({ item, isMine, formatTime }) => {
    const imageUrl = item.image_url ?
        (item.image_url.startsWith('http') ? item.image_url : `${API_URL}${item.image_url}`)
        : null;

    return (
        <View style={[styles.messageWrapper, isMine ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
            <View style={[styles.messageBubble, isMine ? styles.myMsgBubble : styles.theirMsgBubble]}>
                {imageUrl && (
                    <Image
                        source={{ uri: imageUrl, cache: 'force-cache' }}
                        style={styles.messageImage}
                        resizeMode="cover"
                        fadeDuration={0}
                    />
                )}
                {item.message ? (
                    <Text style={[styles.messageText, isMine ? styles.myMsgText : styles.theirMsgText]}>
                        {item.message}
                    </Text>
                ) : null}
                <View style={styles.messageFooter}>
                    <Text style={[styles.msgTime, isMine ? styles.myMsgTime : styles.theirMsgTime]}>
                        {formatTime(item.created_at)}
                    </Text>
                    {isMine && (
                        <View style={styles.checkIcon}>
                            {item.sending ? (
                                <Clock size={10} color="rgba(255,255,255,0.5)" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Check size={10} color={item.is_read ? '#38BDF8' : 'rgba(255,255,255,0.5)'} />
                                    <View style={{ marginLeft: -6 }}>
                                        <Check size={10} color={item.is_read ? '#38BDF8' : 'rgba(255,255,255,0.5)'} />
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    // WhatsApp-style: Only re-render if message content or status changes
    return prevProps.item.id === nextProps.item.id &&
        prevProps.item.is_read === nextProps.item.is_read &&
        prevProps.item.sending === nextProps.item.sending;
});

const ConversationItem = memo(({ item, isActive, onPress, onLongPress, getDisplayName, formatTime, isOnline }) => (
    <TouchableOpacity
        style={[
            styles.convItem,
            isActive && styles.activeConvItem
        ]}
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress(item)}
    >
        <View style={styles.avatarContainer}>
            {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
                <View style={styles.avatarPlaceholder}>
                    <User size={24} color="#94A3B8" />
                </View>
            )}
            {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                </View>
            )}
            {isOnline && (
                <View style={styles.onlineBadge} />
            )}
        </View>
        <View style={styles.convDetails}>
            <View style={styles.convHeader}>
                <Text style={styles.convName}>{getDisplayName(item)}</Text>
                <Text style={styles.convTime}>
                    {item.last_message_time ? formatTime(item.last_message_time) : ''}
                </Text>
            </View>
            <Text style={[styles.convLastMsg, item.unread_count > 0 && styles.convLastMsgUnread]} numberOfLines={1}>
                {item.last_message || 'Mulai percakapan...'}
            </Text>
        </View>
    </TouchableOpacity>
));

// 2. Isolated Input Component (WhatsApp-style)
const ChatInput = memo(({ onSendMessage, onPickImage, themeColor }) => {
    const [localMessage, setLocalMessage] = useState('');
    const [isSendingLocal, setIsSendingLocal] = useState(false);

    const handleSend = async () => {
        if (!localMessage.trim() || isSendingLocal) return;

        const messageText = localMessage.trim();
        setLocalMessage(''); // Clear immediately (optimistic UI)
        setIsSendingLocal(true);

        const success = await onSendMessage(messageText);
        if (!success) {
            // Restore message if failed
            setLocalMessage(messageText);
        }
        setIsSendingLocal(false);
    };

    const handlePick = async () => {
        if (isSendingLocal) return;
        setIsSendingLocal(true);
        await onPickImage();
        setIsSendingLocal(false);
    };

    return (
        <View style={styles.inputArea}>
            <TouchableOpacity
                style={styles.attachBtn}
                onPress={handlePick}
                disabled={isSendingLocal}
            >
                <ImageIcon size={24} color="#64748B" />
            </TouchableOpacity>
            <TextInput
                style={styles.chatInput}
                placeholder="Ketik pesan..."
                value={localMessage}
                onChangeText={setLocalMessage}
                multiline
                maxLength={1000}
                editable={!isSendingLocal}
            />
            <TouchableOpacity
                style={[
                    styles.sendBtn,
                    (!localMessage.trim() && !isSendingLocal) && styles.sendBtnDisabled,
                    isSendingLocal && { opacity: 0.8 }
                ]}
                onPress={handleSend}
                disabled={!localMessage.trim() || isSendingLocal}
            >
                {isSendingLocal ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <Send size={20} color="#FFFFFF" />
                )}
            </TouchableOpacity>
        </View>
    );
});

const ChatScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const {
        conversations,
        unreadCount,
        activeChat,
        setActiveChat,
        markAsRead,
        activeOrder,
        setActiveOrder,
        fetchConversations
    } = useChat();
    const { onlineUsers, socket } = useOrderNotification();

    const [messages, setMessages] = useState([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConv, setSelectedConv] = useState(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const listRef = useRef(null);
    const lastFetchTime = useRef(0);
    const autoSelectAttempted = useRef(false);
    const activeChatRef = useRef(activeChat);
    const userRef = useRef(user);
    // Manual Keyboard Handling untuk Android
    const [keyboardPadding, setKeyboardPadding] = useState(0);

    useEffect(() => {
        if (Platform.OS === 'android') {
            const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
                // Manual: Set padding sebesar tinggi keyboard
                setKeyboardPadding(e.endCoordinates.height);
            });
            const hideSub = Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardPadding(0); // Reset ke 0 saat turun
            });
            return () => {
                showSub.remove();
                hideSub.remove();
            };
        }
    }, []);

    // Keep refs in sync
    useEffect(() => {
        activeChatRef.current = activeChat;
        userRef.current = user;
    }, [activeChat, user]);

    const themeColor = '#138FEA';

    // WhatsApp-style: Optimistic message sending
    const handleSendMessage = useCallback(async (text = '', base64Image = null) => {
        if ((!text.trim() && !base64Image) || !activeChat) return false;

        // Create optimistic message
        const optimisticMessage = {
            id: `temp_${Date.now()}`,
            sender_id: user.id,
            receiver_id: activeChat.user_id,
            message: text.trim(),
            image_url: base64Image,
            created_at: new Date().toISOString(),
            is_read: false,
            sending: true // Flag for pending state
        };

        // Add to UI immediately (WhatsApp-style)
        setMessages(prev => [...prev, optimisticMessage]);

        // Scroll to bottom
        setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 50);

        try {
            const res = await apiService.post('/api/messages', {
                receiver_id: activeChat.user_id,
                message: text.trim(),
                order_id: activeOrder?.id,
                image_url: base64Image
            });

            if (res.data && res.data.data) {
                // Replace optimistic message with real one
                setMessages(prev => prev.map(msg =>
                    msg.id === optimisticMessage.id ? { ...res.data.data, sending: false } : msg
                ));
                fetchConversations();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error sending message:", e);
            // Remove failed message
            setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
            Alert.alert('Gagal', 'Pesan gagal dikirim. Silakan coba lagi.');
            return false;
        }
    }, [activeChat, activeOrder, fetchConversations, user.id]);

    const pickImage = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin galeri untuk mengirim gambar.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                handleSendMessage('', base64Image);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Gagal memilih gambar');
        }
    }, [handleSendMessage]);

    // WhatsApp-style: Display messages (already in correct order for inverted list)
    const displayMessages = useMemo(() => {
        return [...messages].reverse();
    }, [messages]);

    // MEMOIZE filtered conversations
    const filteredConversations = useMemo(() => {
        return conversations.filter(c =>
            c.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [conversations, searchTerm]);

    const formatTime = useCallback((dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    // WhatsApp-style: Smart fetching with debounce
    const fetchMessages = useCallback(async (silent = false) => {
        if (!activeChat) return;

        const now = Date.now();
        // Prevent fetching more than once per 2 seconds, unless it's silent polling
        if (!silent && now - lastFetchTime.current < 2000) {
            setIsTransitioning(false);
            return;
        }
        if (!silent) lastFetchTime.current = now;

        if (!silent) setIsTransitioning(true);
        try {
            const res = await apiService.get(`/api/messages/history/${activeChat.user_id}`);
            if (res.data && res.data.data) {
                setMessages(prev => {
                    const newData = res.data.data;
                    // Only update state if message count is different to save resources
                    if (prev.length === newData.length) return prev;
                    return newData;
                });
            }
        } catch (e) {
            console.error("Error fetching messages:", e);
        } finally {
            if (!silent) setIsTransitioning(false);
        }
    }, [activeChat]);

    const fetchActiveOrder = useCallback(async () => {
        if (!activeChat || !user) return;
        try {
            const isCustomer = user?.role === 'pelanggan' || user?.role === 'user';
            const targetUserId = isCustomer ? user.userId : activeChat.user_id;

            const res = await apiService.get(`/api/messages/active-order/${targetUserId}`);
            if (res.data && res.data.data) {
                setActiveOrder(res.data.data);
            } else {
                setActiveOrder(null);
            }
        } catch (e) {
            console.error("Error fetching active order:", e);
        }
    }, [activeChat?.user_id, user?.id, user?.role, user?.userId, setActiveOrder]);

    useEffect(() => {
        if (activeChat) {
            setIsTransitioning(true);

            // Execute fetching directly without InteractionManager to prevent deadlock
            fetchMessages();
            fetchActiveOrder();
            markAsRead(activeChat.user_id);

            // Safety timeout: Ensure loading stops after 5s if fetch hangs
            const timer = setTimeout(() => {
                setIsTransitioning(false);
            }, 5000);

            return () => clearTimeout(timer);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChat?.user_id]); // Only re-run if USER ID changes, not object reference

    // Listen for real-time socket events
    useEffect(() => {
        if (!socket) return; // Subscribe as long as socket exists

        const handleNewMessage = (msg) => {
            const currentActiveChat = activeChatRef.current;
            const currentUser = userRef.current;

            if (!currentActiveChat || !currentUser) return;

            // Ignore messages sent by myself (already handled by optimistic update)
            const myId = String(currentUser.id || currentUser.userId || '');
            if (String(msg.sender_id) === myId) return;

            const partnerId = String(currentActiveChat.user_id);
            const msgSender = String(msg.sender_id);
            const msgReceiver = String(msg.receiver_id);

            // Logic Relevansi Pesan:
            // 1. Pesan DARI Partner Chat (Customer mengirim ke Toko)
            const isFromPartner = msgSender === partnerId;

            // 2. Pesan KE Partner Chat (Staff lain membalas Customer ini)
            // Ini memungkinkan fitur "Shared Inbox" realtime antar seller
            const isToPartner = msgReceiver === partnerId;

            // 3. KHUSUS PELANGGAN: Terima pesan dari SIAPAPUN yang ditujukan ke saya
            // Karena pelanggan bisa menerima pesan dari Admin, Owner, atau Kasir (beda ID)
            const isCustomer = currentUser.role === 'pelanggan' || currentUser.role === 'user';
            const isToMe = msgReceiver === myId;

            if (isFromPartner || isToPartner || (isCustomer && isToMe)) {
                console.log('[ChatScreen] Pesan relevan diterima via socket:', msg.id);
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => String(m.id) === String(msg.id))) return prev;
                    return [...prev, msg];
                });

                // Jika pesan dari partner atau untuk saya (pelanggan), tandai sebagai dibaca
                if (isFromPartner || (isCustomer && isToMe)) {
                    // Untuk pelanggan, kita markAsRead sender pesan ini (siapapun staffnya)
                    markAsRead(msg.sender_id);
                }
            } else {
                console.log('[ChatScreen] Pesan diabaikan (tidak relevan dengan chat aktif ini)');
            }
        };

        const handleMessagesRead = ({ readerId, senderId }) => {
            const currentActiveChat = activeChatRef.current;
            const currentUser = userRef.current;

            if (!currentActiveChat || !currentUser) return;

            const partnerId = String(currentActiveChat.user_id);
            const rId = String(readerId);
            const sId = String(senderId);

            // 1. Partner (di chat ini) terlibat (membaca atau dibaca)
            const isPartnerInvolved = rId === partnerId || sId === partnerId;

            // 2. KHUSUS PELANGGAN: Pesan SAYA dibaca oleh SIAPAPUN (Staff Toko)
            const isCustomer = currentUser.role === 'pelanggan' || currentUser.role === 'user';
            const isMyMessageRead = isCustomer && sId === String(currentUser.id);

            if (isPartnerInvolved || isMyMessageRead) {
                setMessages(prev => prev.map(m => ({ ...m, is_read: 1 })));
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket, markAsRead]); // Keep stable dependencies

    // Fallback polling jika socket tidak terhubung atau sebagai pengaman tambahan di production
    useEffect(() => {
        let interval;
        if (activeChat) {
            interval = setInterval(() => {
                const isConnected = socket && socket.connected;

                // Jika socket tidak terhubung, lakukan fetch manual (polling)
                if (!isConnected) {
                    console.log('[ChatScreen] Socket tidak terhubung, melakukan fallback fetch...');
                    fetchMessages(true);
                }
            }, 8000); // Poll setiap 8 detik jika socket mati
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeChat, socket, fetchMessages]);

    // For customers, auto-select the first contact (admin/seller)
    useEffect(() => {
        const isCustomer = user?.role === 'pelanggan' || user?.role === 'user';
        if (isCustomer && !activeChat) {
            const autoSelectContact = async () => {
                try {
                    const res = await apiService.get('/api/messages/contacts');
                    if (res.data && res.data.data && res.data.data.length > 0) {
                        const contacts = res.data.data;
                        const mainContact = contacts.find(c => c.role === 'owner') ||
                            contacts.find(c => c.role === 'admin') ||
                            contacts[0];

                        setActiveChat({
                            user_id: mainContact.id,
                            username: mainContact.username,
                            avatar_url: mainContact.avatar_url,
                            role: mainContact.role
                        });
                    }
                } catch (e) {
                    console.error("Error auto-selecting contact:", e);
                }
            };
            autoSelectContact();
        }
    }, [user, activeChat, setActiveChat]);

    const handleDeleteHistory = async () => {
        const accepted = await confirm({
            title: 'Hapus Riwayat',
            message: 'Hapus semua pesan dengan ' + activeChat.username + '?',
            confirmText: 'Ya, Hapus',
            type: 'danger'
        });

        if (accepted) {
            try {
                await apiService.delete(`/api/messages/history/${activeChat.user_id}`);
                setMessages([]);
                setIsTransitioning(false);
                fetchConversations();
            } catch (e) {
                console.error("Error deleting history:", e);
            }
        }
    };

    const handleBackToLobby = useCallback(() => {
        setIsTransitioning(true);
        setMessages([]);

        InteractionManager.runAfterInteractions(() => {
            setActiveChat(null);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 100);
        });
    }, [setActiveChat, setIsTransitioning]);

    const getDisplayName = useCallback((contact) => {
        if (!contact) return '';
        if (['admin', 'owner', 'kasir', 'penjual'].includes(contact.role)) {
            return 'Staf Berkah 88';
        }
        return contact.username;
    }, []);

    const isPartnerOnline = useCallback((partner) => {
        if (!partner) return false;
        const partnerRole = partner.role;
        const partnerId = partner.user_id || partner.id;

        if (['admin', 'owner', 'kasir', 'penjual'].includes(partnerRole)) {
            return onlineUsers.some(u => ['admin', 'owner', 'kasir', 'penjual'].includes(u.role));
        }

        return onlineUsers.some(u => String(u.userId) === String(partnerId));
    }, [onlineUsers]);

    const handleConvPress = useCallback((item) => {
        setActiveChat(item);
    }, [setActiveChat]);

    const handleConvLongPress = useCallback((item) => {
        setSelectedConv(item);
        setIsOptionsVisible(true);
    }, []);

    const renderConversationItem = useCallback(({ item }) => (
        <ConversationItem
            item={item}
            isActive={activeChat?.user_id === item.user_id}
            onPress={handleConvPress}
            onLongPress={handleConvLongPress}
            getDisplayName={getDisplayName}
            formatTime={formatTime}
            isOnline={isPartnerOnline(item)}
        />
    ), [activeChat, handleConvPress, handleConvLongPress, getDisplayName, formatTime, isPartnerOnline]);

    const renderMessageItem = useCallback(({ item }) => (
        <MessageItem
            item={item}
            isMine={item.sender_id === user.id}
            formatTime={formatTime}
        />
    ), [user.id, formatTime]);

    // WhatsApp-style: getItemLayout for better scroll performance
    const getItemLayout = useCallback((data, index) => ({
        length: 80,
        offset: 80 * index,
        index,
    }), []);

    if (activeChat) {
        return (
            <SafeAreaView style={styles.container}>
                {/* Message Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            onPress={() => (user?.role === 'pelanggan' || user?.role === 'user') ? navigation.goBack() : handleBackToLobby()}
                            style={styles.backBtn}
                        >
                            <ArrowLeft size={24} color="#1E293B" />
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerTitle}>{getDisplayName(activeChat)}</Text>
                            {isPartnerOnline(activeChat) && (
                                <View style={styles.onlineStatus}>
                                    <View style={styles.onlineDot} />
                                    <Text style={styles.onlineText}>ONLINE</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleDeleteHistory} style={styles.moreBtn}>
                        <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                {/* Body & Input */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    enabled={Platform.OS === 'ios'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    {isTransitioning && messages.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={themeColor} />
                        </View>
                    ) : (
                        <>
                            {/* Active Order Widget if exists */}
                            {activeOrder && (() => {
                                const statusConfig = {
                                    pending: { label: 'Baru', color: '#F59E0B' },
                                    accepted: { label: 'Diproses', color: '#138FEA' },
                                    ready: { label: 'Siap Diambil', color: '#10B981' },
                                    completed: { label: 'Selesai', color: '#059669' },
                                    rejected: { label: 'Ditolak', color: '#EF4444' },
                                    cancelled: { label: 'Batal', color: '#64748B' }
                                };
                                const currentStatus = statusConfig[activeOrder.status] || { label: activeOrder.status, color: '#138FEA' };

                                return (
                                    <View style={[
                                        styles.orderWidget,
                                        {
                                            borderColor: currentStatus.color + '40',
                                            backgroundColor: currentStatus.color + '05'
                                        }
                                    ]}>
                                        <TouchableOpacity
                                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                            onPress={() => {
                                                const isSeller = ['admin', 'owner', 'kasir', 'penjual', 'seller'].includes(user?.role);
                                                if (isSeller) {
                                                    navigation.navigate('MainTabs', {
                                                        screen: 'Pesanan',
                                                        params: { status: activeOrder.status }
                                                    });
                                                } else {
                                                    navigation.navigate('OrderDetails', { orderId: activeOrder.id });
                                                }
                                            }}
                                        >
                                            <View style={[styles.orderIcon, { backgroundColor: currentStatus.color + '15' }]}>
                                                <ShoppingBag size={18} color={currentStatus.color} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.orderTitle}>Pesanan Progres: #{activeOrder.id.toString().slice(-6)}</Text>
                                                <Text style={[styles.orderStatus, { color: currentStatus.color }]}>
                                                    Status: <Text style={{ fontWeight: '900' }}>{currentStatus.label}</Text>
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setActiveOrder(null)}>
                                            <X size={16} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })()}

                            {/* Messages List - WhatsApp-Style Optimized */}
                            <FlatList
                                ref={listRef}
                                data={displayMessages}
                                renderItem={renderMessageItem}
                                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                                contentContainerStyle={styles.messagesList}
                                inverted
                                scrollEnabled={true}
                                keyboardShouldPersistTaps="handled"
                                style={{ flex: 1 }}
                                // WhatsApp-style Performance Props
                                initialNumToRender={15}
                                maxToRenderPerBatch={10}
                                windowSize={10}
                                removeClippedSubviews={Platform.OS === 'android'}
                                updateCellsBatchingPeriod={100}
                                getItemLayout={getItemLayout}
                            />

                            {/* Input Area - Optimized Component */}
                            <ChatInput
                                onSendMessage={handleSendMessage}
                                onPickImage={pickImage}
                                themeColor={themeColor}
                            />
                            {Platform.OS === 'android' && <View style={{ height: keyboardPadding }} />}
                        </>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    if (!activeChat && (user?.role === 'pelanggan' || user?.role === 'user')) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={themeColor} />
                    <Text style={{ marginTop: 10, color: '#64748B', fontWeight: 'bold' }}>Menghubungkan ke Penjual...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.mainTitle}>Pesan</Text>
                        <Text style={styles.subTitle}>PUSAT OBROLAN</Text>
                    </View>
                </View>
                {unreadCount > 0 && (
                    <View style={styles.totalUnreadBadge}>
                        <Text style={styles.totalUnreadText}>{unreadCount} BARU</Text>
                    </View>
                )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari pelanggan..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
            </View>

            {/* Conversation List - Optimized */}
            {isTransitioning ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={themeColor} />
                </View>
            ) : (
                <FlatList
                    data={filteredConversations}
                    renderItem={renderConversationItem}
                    keyExtractor={item => item.user_id.toString()}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={Platform.OS === 'android'}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MessageCircle size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Belum ada obrolan</Text>
                        </View>
                    }
                />
            )}
            {/* Modal Opsi Percakapan */}
            <Modal
                visible={isOptionsVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsOptionsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsOptionsVisible(false)}
                >
                    <View style={styles.optionContainer}>
                        <View style={styles.optionHeader}>
                            <View style={styles.optionHandle} />
                            <Text style={styles.optionTitle}>Opsi Percakapan</Text>
                            <Text style={styles.optionSubtitle}>{selectedConv?.username}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={async () => {
                                setIsOptionsVisible(false);
                                const accepted = await confirm({
                                    title: 'Hapus Obrolan',
                                    message: `Hapus seluruh riwayat pesan dengan ${selectedConv?.username}?`,
                                    confirmText: 'Ya, Hapus',
                                    type: 'danger'
                                });
                                if (accepted) {
                                    try {
                                        await apiService.delete(`/api/messages/history/${selectedConv.user_id}`);
                                        if (activeChat?.user_id === selectedConv.user_id) {
                                            setMessages([]);
                                        }
                                        fetchConversations();
                                    } catch (e) {
                                        console.error("Error deleting history:", e);
                                    }
                                }
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#FEF2F2' }]}>
                                <Trash2 size={20} color="#EF4444" />
                            </View>
                            <Text style={[styles.optionText, { color: '#EF4444' }]}>Hapus Percakapan</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionItem, { borderBottomWidth: 0 }]}
                            onPress={() => setIsOptionsVisible(false)}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#F1F5F9' }]}>
                                <X size={20} color="#64748B" />
                            </View>
                            <Text style={styles.optionText}>Batal</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingTop: 15,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 8,
        marginLeft: -10,
        marginRight: 10,
    },
    headerInfo: {
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22C55E',
        marginRight: 4,
    },
    onlineText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
    },
    subTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#138FEA',
        letterSpacing: 2,
    },
    totalUnreadBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    totalUnreadText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    searchContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        height: 50,
        borderRadius: 15,
        paddingHorizontal: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1E293B',
    },
    listContent: {
        paddingBottom: 20,
    },
    convItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    activeConvItem: {
        backgroundColor: '#EFF6FF',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    convDetails: {
        flex: 1,
    },
    convHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    convName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    convTime: {
        fontSize: 12,
        color: '#94A3B8',
    },
    convLastMsg: {
        fontSize: 14,
        color: '#64748B',
    },
    convLastMsgUnread: {
        fontWeight: '600',
        color: '#1E293B',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '600',
    },
    messagesList: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    messageWrapper: {
        marginBottom: 12,
        maxWidth: '75%',
    },
    myMsgWrapper: {
        alignSelf: 'flex-end',
    },
    theirMsgWrapper: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    myMsgBubble: {
        backgroundColor: '#138FEA',
        borderBottomRightRadius: 4,
    },
    theirMsgBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMsgText: {
        color: '#FFFFFF',
    },
    theirMsgText: {
        color: '#1E293B',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        justifyContent: 'flex-end',
    },
    msgTime: {
        fontSize: 11,
        marginRight: 4,
    },
    myMsgTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirMsgTime: {
        color: '#94A3B8',
    },
    checkIcon: {
        marginLeft: 2,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 8,
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    attachBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    chatInput: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        color: '#1E293B',
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#138FEA',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    moreBtn: {
        padding: 8,
    },
    orderWidget: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 5,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    orderIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    orderStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    optionContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 30,
    },
    optionHeader: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    optionHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 16,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
});

export default ChatScreen;
