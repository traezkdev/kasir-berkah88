import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput, ActivityIndicator, RefreshControl, Keyboard } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, DrawerActions, useIsFocused } from '@react-navigation/native';
import { Search, Menu, Send, MessageSquarePlus } from 'lucide-react-native';
import axios from 'axios';
import { API_URL, SOCKET_URL } from '../config/api';
import { getToken } from '../utils/auth';
import io from 'socket.io-client';

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

    const fetchChats = useCallback(async () => {
        try {
            await getToken();
            const response = await axios.get(`${API_URL}/chats`);
            setChats(response.data);
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
                setSearchResults(response.data);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    }, []);

    const startChat = useCallback(async (userId) => {
        try {
            await getToken();
            const response = await axios.post(`${API_URL}/chats`, { userId });
            const { chatId } = response.data;

            setIsSearching(false);
            setSearchQuery('');
            await fetchChats();

            const chatObj = chats.find(c => c.id === chatId) || { id: chatId };
            navigation.navigate('ChatDetail', { chat: chatObj });
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    }, [chats, fetchChats, navigation]);

    useEffect(() => {
        if (isFocused) {
            fetchChats();
        }
    }, [isFocused, fetchChats]);

    useEffect(() => {
        const initSocket = async () => {
            const token = await getToken();
            const newSocket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                auth: { token }
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('ChatList Socket Connected');
            });

            const decoded = JSON.parse(atob(token.split('.')[1]));
            const currentUserId = decoded.id;

            newSocket.on('new-message', (newMessage) => {
                // When on the list screen, message is DELIVERED but not yet read
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
                        if (chat.id === chatId) {
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

        initSocket();

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

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
        const time = item.last_message_time
            ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => onNavigate(item)}
            >
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: otherUser.avatar || 'https://ui-avatars.com/api/?name=' + (otherUser.name || 'User') }} style={styles.avatar} />
                    {otherUser.online === 'online' && <View style={styles.onlineBadge} />}
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName}>{otherUser.name}</Text>
                        <Text style={styles.chatTime}>{time}</Text>
                    </View>
                    <View style={styles.chatFooter}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.last_message || 'Belum ada pesan'}
                        </Text>
                        {item.unread_count > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{item.unread_count > 99 ? '99+' : item.unread_count}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    });

    const SearchItem = memo(({ item, onStartChat }) => (
        <TouchableOpacity style={styles.chatItem} onPress={() => onStartChat(item.id)}>
            <Image source={{ uri: item.avatar || 'https://ui-avatars.com/api/?name=' + (item.full_name || 'User') }} style={styles.avatar} />
            <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.full_name}</Text>
                <Text style={styles.lastMessage}>@{item.username}</Text>
            </View>
        </TouchableOpacity>
    ));

    const handleNavigate = useCallback((item) => {
        const otherUser = item.otherUser || {};
        navigation.navigate('ChatDetail', {
            chat: {
                ...item,
                name: otherUser.name,
                avatar: otherUser.avatar,
                online: otherUser.online
            }
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
            <StatusBar style="light" backgroundColor="#0088cc" />
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
                        <Menu size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Vira Chat</Text>
                    <TouchableOpacity>
                        <Search size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.searchContainer}>
                    <Search size={18} color="rgba(255,255,255,0.7)" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        ref={searchInputRef}
                        placeholder="Cari user..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0088cc" />
                </View>
            ) : isSearching ? (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderSearchResult}
                    ListEmptyComponent={<Text style={styles.emptyText}>User tidak ditemukan</Text>}
                />
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => `chat_${item.id}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0088cc']} />
                    }
                    ListEmptyComponent={<Text style={styles.emptyText}>Belum ada percakapan</Text>}
                    removeClippedSubviews={true}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    searchInputRef.current?.focus();
                }}
            >
                <MessageSquarePlus size={26} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#0088cc',
        paddingTop: 40,
        paddingBottom: 15,
        paddingHorizontal: 20,
        elevation: 4,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        marginLeft: 25,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        marginTop: 15,
        paddingHorizontal: 10,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#888',
        fontSize: 16,
    },
    listContent: {
        paddingVertical: 5,
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 12,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#eee',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    chatInfo: {
        flex: 1,
        marginLeft: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    chatName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    chatTime: {
        fontSize: 13,
        color: '#888',
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 15,
        color: '#666',
        flex: 1,
        marginRight: 10,
    },
    unreadBadge: {
        backgroundColor: '#0088cc',
        borderRadius: 12,
        minWidth: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0088cc',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
});

export default ChatListScreen;
