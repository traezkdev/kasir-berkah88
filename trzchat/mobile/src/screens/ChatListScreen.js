import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput, ActivityIndicator, RefreshControl, Keyboard, AppState, InteractionManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, DrawerActions, useIsFocused } from '@react-navigation/native';
import { Search, Menu, Send, MessageSquarePlus, MessageSquare } from 'lucide-react-native';
import axios from 'axios';
import { API_URL, SOCKET_URL, fixUrl } from '../config/api';
import { getToken } from '../utils/auth';
import io from 'socket.io-client';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';

const ChatListScreen = () => {
    const navigation = useNavigation();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const isFocused = useIsFocused();
    const [socket, setSocket] = useState(null);
    const [currentUser, setLocalUser] = useState(null);

    const fetchChats = useCallback(async () => {
        try {
            await getToken();
            const { getUser } = require('../utils/auth');
            const userData = await getUser();
            setLocalUser(userData);

            const response = await axios.get(`${API_URL}/chats`);
            // Parse otherUser if it's a string (happens with JSON_OBJECT in some MySQL configurations)
            const processedChats = response.data.map(chat => {
                if (typeof chat.otherUser === 'string') {
                    try {
                        chat.otherUser = JSON.parse(chat.otherUser);
                    } catch (e) {
                        console.error('Error parsing otherUser JSON:', e);
                    }
                }
                return chat;
            });
            setChats(processedChats);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleSearch = useCallback(async (text) => {
        setSearchQuery(text);
        if (text.length > 2) {
            setIsSearching(true);
            try {
                await getToken();
                const response = await axios.get(`${API_URL}/users/search?q=${text}`);
                // Ensure unique IDs in search results
                const uniqueResults = response.data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                setSearchResults(uniqueResults);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    }, []);

    const startChat = useCallback(async (user) => {
        try {
            await getToken();
            const response = await axios.post(`${API_URL}/chats`, { userId: user.id });
            const { chatId } = response.data;

            setIsSearching(false);
            setSearchQuery('');
            const freshChats = await fetchChats(); // Should return processed chats

            const chatInList = (freshChats || chats).find(c => String(c.id) === String(chatId));
            const chatObj = chatInList || {
                id: chatId,
                otherUser: {
                    id: user.id,
                    name: user.full_name,
                    avatar: user.avatar,
                    online: 'offline'
                }
            };
            navigation.navigate('ChatDetail', { chat: chatObj });
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    }, [chats, fetchChats, navigation]);

    useEffect(() => {
        if (isFocused) {
            const task = InteractionManager.runAfterInteractions(() => {
                fetchChats();
            });
            return () => task.cancel();
        }
    }, [isFocused, fetchChats]);

    useEffect(() => {
        let currentSocket = null;

        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active') {
                fetchChats();
                if (currentSocket) {
                    currentSocket.connect();
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        const initSocket = async () => {
            const token = await getToken();
            if (!token) return;

            console.log('Attempting to connect to socket:', SOCKET_URL);
            const newSocket = io(SOCKET_URL, {
                transports: ['polling', 'websocket'], // Polling dulu baru upgrade ke websocket
                auth: { token },
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
                timeout: 30000,
                forceNew: true,
                secure: true,
                rejectUnauthorized: false // Abaikan error SSL jika ada (hanya untuk debug jika perlu)
            });

            currentSocket = newSocket;
            setSocket(newSocket);

            newSocket.on('connect_error', (err) => {
                console.error('ChatList Socket Connection Error Detail:', {
                    message: err.message,
                    description: err.description,
                    context: err.context,
                    type: err.type
                });

                // Jika polling gagal juga, coba bersihkan cache socket
                if (newSocket.io.opts.transports[0] === 'polling') {
                    console.log('Polling failed, client might be blocked by firewall or proxy');
                }
            });

            newSocket.on('connect', () => {
                console.log('ChatList Socket Connected');
            });

            newSocket.on('reconnect', (attempt) => {
                console.log('Socket Reconnected after', attempt, 'attempts');
                fetchChats();
            });

            const { getUser } = require('../utils/auth');
            const currentUser = await getUser();
            const currentUserId = currentUser?.id;

            newSocket.on('new-message', (newMessage) => {
                newSocket.emit('message-delivered', { messageId: newMessage.id, chatId: newMessage.chat_id });
                const isFromOther = newMessage.sender_id !== currentUserId;
                setChats(prevChats => {
                    const updatedChats = prevChats.map(chat => {
                        if (String(chat.id) === String(newMessage.chat_id)) {
                            return {
                                ...chat,
                                last_message: newMessage.text,
                                last_message_time: newMessage.created_at,
                                unread_count: isFromOther ? (chat.unread_count || 0) + 1 : (chat.unread_count || 0)
                            };
                        }
                        return chat;
                    });
                    return updatedChats.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
                });
            });

            newSocket.on('messages-read', ({ chatId }) => {
                setChats(prevChats => {
                    return prevChats.map(chat => {
                        if (String(chat.id) === String(chatId)) {
                            return { ...chat, unread_count: 0 };
                        }
                        return chat;
                    });
                });
            });

            newSocket.on('user-status-changed', ({ userId, status }) => {
                setChats(prevChats => {
                    return prevChats.map(chat => {
                        if (chat.otherUser && chat.otherUser.id === userId) {
                            return {
                                ...chat,
                                otherUser: {
                                    ...chat.otherUser,
                                    online: status
                                }
                            };
                        }
                        return chat;
                    });
                });
            });
        };

        const task = InteractionManager.runAfterInteractions(() => {
            initSocket();
        });

        return () => {
            task.cancel();
            subscription.remove();
            if (currentSocket) currentSocket.disconnect();
        };
    }, [fetchChats]);

    const roomsJoined = useRef(new Set());
    useEffect(() => {
        if (socket && chats.length > 0) {
            chats.forEach(chat => {
                if (!roomsJoined.current.has(chat.id)) {
                    socket.emit('join-chat', chat.id);
                    roomsJoined.current.add(chat.id);
                }
            });
        }
    }, [chats, socket]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchChats();
    }, [fetchChats]);

    const ChatItem = memo(({ item, onNavigate }) => {
        const otherUser = item.otherUser || {};
        const time = item.last_message_time ? dayjs(item.last_message_time).format('HH:mm') : '';

        return (
            <TouchableOpacity
                style={styles.chatCard}
                onPress={() => onNavigate(item)}
                activeOpacity={0.8}
            >
                <View style={styles.avatarWrapper}>
                    <Image
                        source={{ uri: fixUrl(otherUser.avatar) || 'https://ui-avatars.com/api/?name=' + (otherUser.name || 'User') }}
                        style={styles.avatar}
                    />
                    {otherUser.online === 'online' && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.chatContent}>
                    <View style={styles.chatHeaderRow}>
                        <Text style={styles.chatName} numberOfLines={1}>{otherUser.name}</Text>
                        <Text style={styles.chatTime}>{time}</Text>
                    </View>
                    <View style={styles.chatFooterRow}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.last_message || 'Mulai obrolan baru...'}
                        </Text>
                        {item.unread_count > 0 && (
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.unreadCountBadge}
                            >
                                <Text style={styles.unreadText}>{item.unread_count > 99 ? '99+' : item.unread_count}</Text>
                            </LinearGradient>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    });

    const SearchItem = memo(({ item, onStartChat }) => (
        <TouchableOpacity style={styles.searchResultCard} onPress={() => onStartChat(item)}>
            <Image source={{ uri: fixUrl(item.avatar) || 'https://ui-avatars.com/api/?name=' + (item.full_name || 'User') }} style={styles.searchAvatar} />
            <View style={styles.searchInfo}>
                <Text style={styles.chatName}>{item.full_name}</Text>
                <Text style={styles.usernameText}>@{item.username}</Text>
            </View>
            <View style={styles.startChatBtn}>
                <Send size={16} color="#6366F1" />
            </View>
        </TouchableOpacity>
    ));

    const handleNavigate = useCallback((item) => {
        const otherUser = item.otherUser || {};
        navigation.navigate('ChatDetail', {
            chat: { ...item, name: otherUser.name, avatar: otherUser.avatar, online: otherUser.online }
        });
    }, [navigation]);

    const renderItem = useCallback(({ item }) => (
        <ChatItem item={item} onNavigate={handleNavigate} />
    ), [handleNavigate]);

    const renderSearchResult = useCallback(({ item }) => (
        <SearchItem item={item} onStartChat={startChat} />
    ), [startChat]);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.mainHeader}>
                <View style={styles.headerTopRow}>
                    <View>
                        <Text style={styles.greetingText}>Halo, {currentUser?.fullName?.split(' ')[0] || 'User'}!</Text>
                        <Text style={styles.appBrandText}>Vira Chat Messenger</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.menuIconButton}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    >
                        <Menu size={24} color="#1F2937" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBarWrapper}>
                    <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInputField}
                        placeholder="Cari teman atau pesan..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : isSearching ? (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderSearchResult}
                    contentContainerStyle={styles.resultsList}
                    ListEmptyComponent={<Text style={styles.emptyResultsText}>User tidak ditemukan</Text>}
                />
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => `chat_${item.id}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.chatListContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyStateContainer}>
                            <MessageSquare size={60} color="#E5E7EB" />
                            <Text style={styles.emptyTitle}>Belum Ada Percakapan</Text>
                            <Text style={styles.emptySubtitle}>Cari teman Anda di atas untuk mulai chatting!</Text>
                        </View>
                    }
                    removeClippedSubviews={true}
                    initialNumToRender={10}
                />
            )}

            <TouchableOpacity
                style={styles.enhancedFab}
                onPress={() => searchInputRef.current?.focus()}
            >
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.fabGradient}
                >
                    <MessageSquarePlus size={26} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    mainHeader: {
        backgroundColor: '#fff',
        paddingTop: 55,
        paddingBottom: 25,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greetingText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -0.5,
    },
    appBrandText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '700',
        marginTop: 2,
    },
    menuIconButton: {
        width: 48,
        height: 48,
        backgroundColor: '#F3F4F6',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 18,
        paddingHorizontal: 16,
        height: 54,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInputField: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '600',
    },
    chatListContent: {
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 120,
    },
    chatCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 16,
        marginBottom: 14,
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 62,
        height: 62,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
    },
    onlineDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#22C55E',
        borderWidth: 4,
        borderColor: '#fff',
    },
    chatContent: {
        flex: 1,
        marginLeft: 16,
    },
    chatHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    chatName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        flex: 1,
        marginRight: 10,
    },
    chatTime: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '700',
    },
    chatFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
        marginRight: 10,
        fontWeight: '500',
    },
    unreadCountBadge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 7,
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '900',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 50,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#374151',
        marginTop: 20,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
        fontWeight: '500',
    },
    enhancedFab: {
        position: 'absolute',
        bottom: 35,
        right: 25,
        elevation: 12,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 15,
    },
    fabGradient: {
        width: 70,
        height: 70,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 14,
        marginHorizontal: 18,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
    },
    searchAvatar: {
        width: 54,
        height: 54,
        borderRadius: 20,
    },
    searchInfo: {
        flex: 1,
        marginLeft: 16,
    },
    usernameText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '700',
        marginTop: 2,
    },
    startChatBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsList: {
        paddingTop: 25,
    },
    emptyResultsText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 40,
        fontSize: 16,
        fontWeight: '600',
    }
});

export default ChatListScreen;
