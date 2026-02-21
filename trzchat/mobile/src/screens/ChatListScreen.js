import React, { useState, useEffect, useRef } from 'react';
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

    const fetchChats = async () => {
        try {
            await getToken(); // Ensure header is set
            const response = await axios.get(`${API_URL}/chats`);
            setChats(response.data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSearch = async (text) => {
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
    };

    const startChat = async (userId) => {
        try {
            await getToken();
            const response = await axios.post(`${API_URL}/chats`, { userId });
            const { chatId } = response.data;

            // Re-fetch chats and navigate to the detail
            setIsSearching(false);
            setSearchQuery('');
            await fetchChats();

            // Find the chat object to pass to detail
            const chatObj = chats.find(c => c.id === chatId) || { id: chatId };
            navigation.navigate('ChatDetail', { chat: chatObj });
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchChats();
        }
    }, [isFocused]);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling']
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('ChatList Socket Connected');
        });

        newSocket.on('new-message', (newMessage) => {
            // Update the specific chat in the list with the new message
            setChats(prevChats => {
                const updatedChats = prevChats.map(chat => {
                    if (chat.id === newMessage.chat_id) {
                        return {
                            ...chat,
                            last_message: newMessage.text,
                            last_message_time: newMessage.created_at
                        };
                    }
                    return chat;
                });
                // Re-sort the list to put the newest at the top
                return updatedChats.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Join rooms for all chats to receive updates
    useEffect(() => {
        if (socket && chats.length > 0) {
            chats.forEach(chat => {
                socket.emit('join-chat', chat.id);
            });
        }
    }, [chats, socket]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchChats();
    };

    const renderItem = ({ item }) => {
        const otherUser = item.otherUser || {};
        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigation.navigate('ChatDetail', { chat: { ...item, name: otherUser.name, avatar: otherUser.avatar, online: otherUser.online } })}
            >
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: otherUser.avatar || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
                    {otherUser.online === 'online' && <View style={styles.onlineBadge} />}
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName}>{otherUser.name}</Text>
                        <Text style={styles.chatTime}>{item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                    </View>
                    <View style={styles.chatFooter}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.last_message || 'Belum ada pesan'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSearchResult = ({ item }) => (
        <TouchableOpacity style={styles.chatItem} onPress={() => startChat(item.id)}>
            <Image source={{ uri: item.avatar || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
            <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.full_name}</Text>
                <Text style={styles.lastMessage}>@{item.username}</Text>
            </View>
        </TouchableOpacity>
    );

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
