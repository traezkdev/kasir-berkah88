import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Modal
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
    Clock
} from 'lucide-react-native';
import { useChat } from '../../context/ChatContext';
import apiService, { API_URL } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';

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

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConv, setSelectedConv] = useState(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const listRef = useRef(null);

    const themeColor = '#138FEA';

    // Fetch messages when activeChat changes
    useEffect(() => {
        if (activeChat) {
            fetchMessages();
            fetchActiveOrder();
            markAsRead(activeChat.user_id);
            const interval = setInterval(fetchMessages, 4000);
            return () => clearInterval(interval);
        }
    }, [activeChat]);

    // For customers, auto-select the first contact (admin/seller)
    useEffect(() => {
        const isCustomer = user?.role === 'pelanggan' || user?.role === 'user';
        if (isCustomer && !activeChat) {
            const autoSelectContact = async () => {
                try {
                    const res = await apiService.get('/api/messages/contacts');
                    if (res.data && res.data.data && res.data.data.length > 0) {
                        const contacts = res.data.data;
                        // Find owner first, then admin, then penjual, or just the first one
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
    }, [user, activeChat]);

    const fetchMessages = async () => {
        if (!activeChat) return;
        try {
            const res = await apiService.get(`/api/messages/history/${activeChat.user_id}`);
            if (res.data && res.data.data) {
                setMessages(res.data.data);
            }
        } catch (e) {
            console.error("Error fetching messages:", e);
        }
    };

    const fetchActiveOrder = async () => {
        if (!activeChat || !user) return;
        try {
            // Jika saya pelanggan, cari pesanan SAYA
            // Jika saya seller, cari pesanan LAWAN CHAT (pelanggan)
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
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChat) return;

        const originalMsg = newMessage;
        setNewMessage('');

        try {
            await apiService.post('/api/messages', {
                receiver_id: activeChat.user_id,
                message: originalMsg,
                order_id: activeOrder?.id
            });
            fetchMessages();
            fetchConversations();
        } catch (e) {
            console.error("Error sending message:", e);
            setNewMessage(originalMsg);
        }
    };

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
                fetchConversations();
            } catch (e) {
                console.error("Error deleting history:", e);
            }
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredConversations = conversations.filter(c =>
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderConversationItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.convItem,
                activeChat?.user_id === item.user_id && styles.activeConvItem
            ]}
            onPress={() => setActiveChat(item)}
            onLongPress={() => {
                setSelectedConv(item);
                setIsOptionsVisible(true);
            }}
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
            </View>
            <View style={styles.convDetails}>
                <View style={styles.convHeader}>
                    <Text style={styles.convName}>{item.username}</Text>
                    <Text style={styles.convTime}>
                        {item.last_message_time ? formatTime(item.last_message_time) : ''}
                    </Text>
                </View>
                <Text style={[styles.convLastMsg, item.unread_count > 0 && styles.convLastMsgUnread]} numberOfLines={1}>
                    {item.last_message || 'Mulai percakapan...'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderMessageItem = ({ item, index }) => {
        const isMine = item.sender_id === user.id;
        return (
            <View style={[styles.messageWrapper, isMine ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
                <View style={[styles.messageBubble, isMine ? styles.myMsgBubble : styles.theirMsgBubble]}>
                    <Text style={[styles.messageText, isMine ? styles.myMsgText : styles.theirMsgText]}>
                        {item.message}
                    </Text>
                    <View style={styles.messageFooter}>
                        <Text style={[styles.msgTime, isMine ? styles.myMsgTime : styles.theirMsgTime]}>
                            {formatTime(item.created_at)}
                        </Text>
                        {isMine && (
                            <View style={styles.checkIcon}>
                                <Check size={10} color={item.is_read ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (activeChat) {
        return (
            <View style={styles.container}>
                {/* Message Header - Tetap di Atas */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => (user?.role === 'pelanggan' || user?.role === 'user') ? navigation.goBack() : setActiveChat(null)} style={styles.backBtn}>
                            <ArrowLeft size={24} color="#1E293B" />
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerTitle}>{activeChat.username}</Text>
                            <View style={styles.onlineStatus}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.onlineText}>ONLINE</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleDeleteHistory} style={styles.moreBtn}>
                        <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                {/* Body & Input */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    {/* Active Order Widget if exists */}
                    {activeOrder && (
                        <View style={styles.orderWidget}>
                            <View style={styles.orderIcon}>
                                <ShoppingBag size={18} color={themeColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.orderTitle}>Pesanan Progres: #{activeOrder.id.toString().slice(-6)}</Text>
                                <Text style={styles.orderStatus}>Status: {activeOrder.status}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setActiveOrder(null)}>
                                <X size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Messages List */}
                    <FlatList
                        ref={listRef}
                        data={[...messages].reverse()}
                        renderItem={renderMessageItem}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={styles.messagesList}
                        inverted
                    />

                    {/* Input Area */}
                    <View style={styles.inputArea}>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="Ketik pesan..."
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
                            onPress={handleSendMessage}
                            disabled={!newMessage.trim()}
                        >
                            <Send size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
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

            {/* Conversation List */}
            <FlatList
                data={filteredConversations}
                renderItem={renderConversationItem}
                keyExtractor={item => item.user_id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MessageCircle size={60} color="#E2E8F0" />
                        <Text style={styles.emptyText}>Belum ada obrolan</Text>
                    </View>
                }
            />
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : (Platform.OS === 'ios' ? 50 : 25),
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
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    listContent: {
        padding: 15,
    },
    convItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeConvItem: {
        borderColor: '#138FEA',
        backgroundColor: '#F0F9FF',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 55,
        height: 55,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        width: 55,
        height: 55,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#EF4444',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    convDetails: {
        flex: 1,
        marginLeft: 15,
    },
    convHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    convName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    convTime: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    convLastMsg: {
        fontSize: 13,
        color: '#64748B',
    },
    convLastMsgUnread: {
        color: '#1E293B',
        fontWeight: 'bold',
    },
    messagesList: {
        padding: 20,
    },
    messageWrapper: {
        marginBottom: 15,
        flexDirection: 'row',
    },
    myMsgWrapper: {
        justifyContent: 'flex-end',
    },
    theirMsgWrapper: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
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
        fontSize: 14,
        lineHeight: 20,
    },
    myMsgText: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    theirMsgText: {
        color: '#1E293B',
        fontWeight: '500',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 4,
    },
    msgTime: {
        fontSize: 9,
        fontWeight: '800',
    },
    myMsgTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirMsgTime: {
        color: '#94A3B8',
    },
    inputArea: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    chatInput: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1E293B',
        maxHeight: 100,
    },
    sendBtn: {
        width: 50,
        height: 50,
        backgroundColor: '#138FEA',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#94A3B8',
        marginTop: 15,
    },
    orderWidget: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 15,
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
            },
            android: { elevation: 2 },
            web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.05)' }
        })
    },
    orderIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    orderTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1E293B',
    },
    orderStatus: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#138FEA',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    optionContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    optionHeader: {
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    optionHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 10,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    optionSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginTop: 2,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    }
});

export default ChatScreen;
