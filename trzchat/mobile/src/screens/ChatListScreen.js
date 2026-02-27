import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput, ActivityIndicator, RefreshControl, Keyboard, AppState, InteractionManager, Alert, Modal, Platform, SafeAreaView, StatusBar as NativeStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, DrawerActions, useIsFocused } from '@react-navigation/native';
import { Search, Menu, Send, MessageSquarePlus, MessageSquare, Trash2, AlertCircle, Camera, MoreVertical, Users, Phone, Bell, Archive, ShieldCheck, Circle, CheckCheck, CircleDashed, ArrowLeft, Check } from 'lucide-react-native';
import axios from 'axios';
import { API_URL, SOCKET_URL, fixUrl } from '../config/api';
import { getToken } from '../utils/auth';
import io from 'socket.io-client';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

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
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [activeFilter, setActiveFilter] = useState('Semua');
    const filters = ['Semua', 'Belum dibaca', 'Favorit', 'Grup', 'Teman'];

    // Multi-Selection States
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState({});
    const [archivedCount, setArchivedCount] = useState(0);

    const fetchChats = useCallback(async () => {
        try {
            await getToken();
            const { getUser } = require('../utils/auth');
            const userData = await getUser();
            setLocalUser(userData);

            const response = await axios.get(`${API_URL}/chats`);
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
            fetchArchivedCount();
            return processedChats;
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchArchivedCount = useCallback(async () => {
        try {
            await getToken();
            const response = await axios.get(`${API_URL}/chats/archived/count`);
            setArchivedCount(response.data.count);
        } catch (error) {
            console.error('Error fetching archived count:', error);
        }
    }, []);

    const handleSearch = useCallback(async (text) => {
        setSearchQuery(text);
        if (text.length > 2) {
            setIsSearching(true);
            try {
                await getToken();
                const response = await axios.get(`${API_URL}/users/search?q=${text}`);
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
            const freshChats = await fetchChats();
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

            const finalChat = {
                ...chatObj,
                name: chatObj.otherUser?.name || user.full_name,
                avatar: chatObj.otherUser?.avatar || user.avatar,
                online: chatObj.otherUser?.online || 'offline'
            };

            navigation.navigate('ChatDetail', { chat: finalChat });
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    }, [chats, fetchChats, navigation]);

    const deleteChat = useCallback(async (chatId) => {
        try {
            await getToken();
            await axios.delete(`${API_URL}/chats/${chatId}`);
            setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
        } catch (error) {
            console.error('Error deleting chat:', error);
            Alert.alert('Gagal', 'Tidak dapat menghapus percakapan.');
        }
    }, []);

    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev => {
            const next = { ...prev };
            if (next[id]) {
                delete next[id];
                const hasRemaining = Object.keys(next).length > 0;
                if (!hasRemaining) setSelectionMode(false);
            } else {
                next[id] = true;
            }
            return next;
        });
    }, []);

    const enterSelectionMode = useCallback((id) => {
        setSelectionMode(true);
        setSelectedIds({ [id]: true });
    }, []);

    const exitSelectionMode = useCallback(() => {
        setSelectionMode(false);
        setSelectedIds({});
    }, []);

    const handleLongPress = useCallback((item) => {
        enterSelectionMode(item.id);
    }, [enterSelectionMode]);

    const handleDeleteSelected = async () => {
        const ids = Object.keys(selectedIds);
        Alert.alert(
            'Hapus Chat?',
            `Apakah Anda ingin menghapus ${ids.length} chat yang dipilih?`,
            [
                { text: 'BATAL', style: 'cancel' },
                {
                    text: 'HAPUS CHAT',
                    style: 'destructive',
                    onPress: async () => {
                        await Promise.all(ids.map(id => deleteChat(id)));
                        exitSelectionMode();
                    }
                }
            ]
        );
    };

    const handleArchiveSelected = async () => {
        const ids = Object.keys(selectedIds);
        try {
            await getToken();
            await Promise.all(ids.map(id =>
                axios.post(`${API_URL}/chats/${id}/archive`, { archive: true })
            ));
            exitSelectionMode();
            fetchChats();
            Alert.alert('Berhasil', `${ids.length} chat telah diarsipkan.`);
        } catch (error) {
            console.error('Error archiving chats:', error);
            Alert.alert('Gagal', 'Tidak dapat mengarsipkan chat.');
        }
    };


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

            const newSocket = io(SOCKET_URL, {
                transports: ['polling', 'websocket'],
                auth: { token },
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000,
                forceNew: true,
                secure: true,
                rejectUnauthorized: false
            });

            currentSocket = newSocket;
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('ChatList Socket Connected');
            });

            newSocket.on('reconnect', () => {
                fetchChats();
            });

            const { getUser } = require('../utils/auth');
            const currentUser = await getUser();
            const currentUserId = currentUser?.id;

            newSocket.on('new-message', (newMessage) => {
                newSocket.emit('message-delivered', { messageId: newMessage.id, chatId: newMessage.chat_id });

                setChats(prevChats => {
                    const chatIndex = prevChats.findIndex(chat => String(chat.id) === String(newMessage.chat_id));
                    if (chatIndex === -1) {
                        fetchChats();
                        return prevChats;
                    }

                    const isFromOther = String(newMessage.sender_id) !== String(currentUserId);
                    let previewText = newMessage.text;
                    if (newMessage.is_audio || newMessage.voice_url || newMessage.audio_url) previewText = '🎤 Pesan Suara';
                    else if (newMessage.is_image || newMessage.image_url) previewText = '📷 Foto';
                    else if (newMessage.is_video || newMessage.video_url) previewText = '🎥 Video';
                    else if (!previewText) previewText = 'Pesan baru';

                    const updatedChats = prevChats.map(chat => {
                        if (String(chat.id) === String(newMessage.chat_id)) {
                            return {
                                ...chat,
                                last_message: previewText,
                                last_message_time: newMessage.created_at,
                                unread_count: isFromOther ? (chat.unread_count || 0) + 1 : (chat.unread_count || 0),
                                sender_id: newMessage.sender_id,
                                status: newMessage.status
                            };
                        }
                        return chat;
                    });

                    return [...updatedChats].sort((a, b) => {
                        const timeA = new Date(a.last_message_time || 0).getTime();
                        const timeB = new Date(b.last_message_time || 0).getTime();
                        return timeB - timeA;
                    });
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

    const ChatItem = memo(({ item, onNavigate, onLongPress, currentUser, isSelected, selectionMode, onToggle }) => {
        const otherUser = item.otherUser || {};
        const lastMessageTime = item.last_message_time;
        const now = dayjs();
        const msgDate = dayjs(lastMessageTime);

        let timeDisplay = '';
        if (lastMessageTime) {
            if (now.isSame(msgDate, 'day')) {
                timeDisplay = msgDate.format('HH:mm');
            } else if (now.subtract(1, 'day').isSame(msgDate, 'day')) {
                timeDisplay = 'Kemarin';
            } else {
                timeDisplay = msgDate.format('DD/MM/YY');
            }
        }

        return (
            <TouchableOpacity
                style={[styles.chatRow, isSelected && styles.selectedChatRow]}
                onPress={() => selectionMode ? onToggle(item.id) : onNavigate(item)}
                onLongPress={() => !selectionMode ? onLongPress(item) : null}
                activeOpacity={0.7}
            >
                <View style={styles.avatarWrapper}>
                    <Image
                        source={{ uri: fixUrl(otherUser.avatar) || 'https://ui-avatars.com/api/?name=' + (otherUser.name || 'User') }}
                        style={styles.waAvatar}
                    />
                    {isSelected && (
                        <View style={styles.checkOverlay}>
                            <View style={styles.checkCircle}>
                                <Check size={12} color="#fff" strokeWidth={4} />
                            </View>
                        </View>
                    )}
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatTopLine}>
                        <Text style={styles.waChatName} numberOfLines={1}>{otherUser.name}</Text>
                        <Text style={[styles.waChatTime, (item.unread_count > 0 && !isSelected) && { color: '#25D366', fontWeight: 'bold' }]}>{timeDisplay}</Text>
                    </View>
                    <View style={styles.chatBottomLine}>
                        <View style={styles.msgPreviewWrapper}>
                            {item.sender_id === currentUser?.id && (
                                <View style={styles.statusIcon}>
                                    <CheckCheck size={16} color={item.status === 'read' ? '#34B7F1' : '#888'} />
                                </View>
                            )}
                            <Text style={styles.waLastMessage} numberOfLines={1}>
                                {item.last_message || 'Mulai obrolan baru...'}
                            </Text>
                        </View>
                        {(item.unread_count > 0 && !isSelected) && (
                            <View style={styles.waUnreadBadge}>
                                <Text style={styles.waUnreadText}>{item.unread_count}</Text>
                            </View>
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
                <Text style={styles.waChatName}>{item.full_name}</Text>
                <Text style={styles.usernameText}>@{item.username}</Text>
            </View>
            <View style={styles.startChatBtn}>
                <Send size={16} color="#008069" />
            </View>
        </TouchableOpacity>
    ));

    const handleNavigate = useCallback((item) => {
        const otherUser = item.otherUser || {};
        navigation.navigate('ChatDetail', {
            chat: { ...item, name: otherUser.name, avatar: otherUser.avatar, online: otherUser.online }
        });
    }, [navigation]);

    const renderSearchResult = useCallback(({ item }) => (
        <SearchItem item={item} onStartChat={startChat} />
    ), [startChat]);

    const renderItem = useCallback(({ item }) => {
        const isSelected = !!selectedIds[item.id];
        return (
            <ChatItem
                item={item}
                onNavigate={handleNavigate}
                onLongPress={handleLongPress}
                currentUser={currentUser}
                isSelected={isSelected}
                selectionMode={selectionMode}
                onToggle={toggleSelection}
            />
        );
    }, [handleNavigate, handleLongPress, currentUser, selectedIds, selectionMode, toggleSelection]);

    const renderDeleteModal = () => (
        <Modal
            visible={deleteModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setDeleteModalVisible(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setDeleteModalVisible(false)}
            >
                <View style={styles.confirmModalWrapper}>
                    <Text style={styles.confirmTitle}>Hapus Chat?</Text>
                    <Text style={styles.confirmSubtitle}>
                        Apakah Anda ingin menghapus chat dengan <Text style={{ fontWeight: 'bold', color: '#111B21' }}>{selectedChat?.otherUser?.name || 'User'}</Text>?
                    </Text>
                    <View style={styles.confirmActionRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteModalVisible(false)}>
                            <Text style={styles.cancelText}>BATAL</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={confirmDelete}>
                            <Text style={styles.deleteText}>HAPUS CHAT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
    const renderWhatsAppHeader = () => {
        return (
            <View style={styles.waHeader}>
                {selectionMode ? (
                    <View style={[styles.waHeaderTop, styles.selectionHeaderLayout]}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity onPress={exitSelectionMode} style={{ paddingRight: scale(10) }}>
                                <ArrowLeft size={24} color="#111B21" />
                            </TouchableOpacity>
                            <Text style={styles.selectionCountText}>{Object.keys(selectedIds).length}</Text>
                        </View>
                        <View style={styles.waHeaderIcons}>
                            <TouchableOpacity style={styles.waHeaderIconBtn} onPress={handleDeleteSelected}>
                                <Trash2 size={22} color="#111B21" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.waHeaderIconBtn}>
                                <Bell size={22} color="#111B21" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.waHeaderIconBtn} onPress={handleArchiveSelected}>
                                <Archive size={22} color="#111B21" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.waHeaderIconBtn}>
                                <MoreVertical size={22} color="#111B21" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.waHeaderTop}>
                        <Text style={styles.waLogoText}>Vira chat</Text>
                        <View style={styles.waHeaderIcons}>
                            <TouchableOpacity style={styles.waHeaderIconBtn}>
                                <Camera size={24} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.waHeaderIconBtn} onPress={() => setIsSearching(!isSearching)}>
                                <Search size={24} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.waHeaderIconBtn}>
                                <MoreVertical size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.waSearchBarSection} pointerEvents="auto">
                    <View style={styles.waSearchInputWrapper}>
                        <Search size={20} color="#666" style={styles.waSearchIcon} />
                        <TextInput
                            ref={searchInputRef}
                            style={styles.waSearchInputField}
                            placeholder="cari percakapan atau teman"
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={handleSearch}
                            onFocus={() => {
                                if (selectionMode) exitSelectionMode();
                            }}
                        />
                    </View>
                </View>

                <View style={styles.waFilterRow} pointerEvents="auto">
                    <FlatList
                        horizontal
                        data={filters}
                        keyExtractor={(item) => item}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.waFilterList}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.waFilterChip, activeFilter === item && styles.waFilterChipActive]}
                                onPress={() => {
                                    if (selectionMode) exitSelectionMode();
                                    setActiveFilter(item);
                                }}
                            >
                                <Text style={[styles.waFilterChipText, activeFilter === item && styles.waFilterChipTextActive]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        );
    };

    const renderBottomNav = () => (
        <View style={styles.waBottomNav}>
            <TouchableOpacity style={styles.waNavItem}>
                <View style={[styles.waIconContainer, styles.waNavItemIconActive]}>
                    <MessageSquare size={22} color="#000" />
                </View>
                <Text style={styles.waNavItemTextActive}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.waNavItem}>
                <View style={styles.waIconContainer}>
                    <CircleDashed size={22} color="#444" />
                </View>
                <Text style={styles.waNavItemText}>Pembaruan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.waNavItem}>
                <View style={styles.waIconContainer}>
                    <Users size={22} color="#444" />
                </View>
                <Text style={styles.waNavItemText}>Komunitas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.waNavItem}>
                <View style={styles.waIconContainer}>
                    <Phone size={22} color="#444" />
                </View>
                <Text style={styles.waNavItemText}>Panggilan</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" backgroundColor="#fff" />
            {renderWhatsAppHeader()}

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#25D366" />
                </View>
            ) : isSearching && searchQuery.length > 0 ? (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderSearchResult}
                    contentContainerStyle={styles.resultsList}
                    ListEmptyComponent={<Text style={styles.emptyResultsText}>User tidak ditemukan</Text>}
                />
            ) : (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={chats}
                        keyExtractor={(item) => `chat_${item.id}`}
                        renderItem={renderItem}
                        contentContainerStyle={styles.waChatListScroll}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#25D366']} />
                        }
                        ListHeaderComponent={
                            (chats.length > 0 || archivedCount > 0) && (
                                <TouchableOpacity
                                    style={styles.archiveRow}
                                    onPress={() => navigation.navigate('ArchivedChats')}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.archiveIconWrapper}>
                                        <Archive size={20} color="#444" />
                                    </View>
                                    <Text style={styles.archiveText}>Diarsipkan</Text>
                                    <Text style={styles.archiveCount}>{archivedCount}</Text>
                                </TouchableOpacity>
                            )
                        }
                        ListFooterComponent={
                            chats.length > 0 && (
                                <View style={styles.footerInfo}>
                                    <ShieldCheck size={16} color="#666" />
                                    <Text style={styles.footerInfoText}>
                                        Pesan pribadi Anda <Text style={{ color: '#008069', fontWeight: 'bold' }}>terenkripsi secara end-to-end</Text>
                                    </Text>
                                </View>
                            )
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyStateContainer}>
                                <MessageSquare size={60} color="#E5E7EB" />
                                <Text style={styles.emptyTitle}>Belum Ada Percakapan</Text>
                                <Text style={styles.emptySubtitle}>Cari teman Anda di atas untuk mulai chatting!</Text>
                            </View>
                        }
                    />



                    <TouchableOpacity style={styles.waFab} onPress={() => searchInputRef.current?.focus()}>
                        <MessageSquarePlus size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
            {renderBottomNav()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    waHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: scale(16),
        paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight + verticalScale(5) : 0,
    },
    waHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: verticalScale(48), // Pastikan tinggi konsisten
    },
    waLogoText: {
        fontSize: moderateScale(24),
        fontWeight: 'bold',
        color: '#008069',
    },
    waHeaderIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    waHeaderIconBtn: {
        marginLeft: scale(20),
    },
    waSearchBarSection: {
        marginTop: verticalScale(10),
    },
    waSearchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5', // Kembali ke warna abu-abu semula
        borderRadius: scale(25),
        paddingHorizontal: scale(16),
        height: verticalScale(48),
    },
    waSearchIcon: {
        marginRight: scale(10),
    },
    waSearchInputField: {
        flex: 1,
        fontSize: moderateScale(16),
        color: '#000',
    },
    waFilterRow: {
        paddingVertical: verticalScale(15),
    },
    waFilterList: {
        gap: scale(8),
    },
    waFilterChip: {
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(6),
        borderRadius: scale(20),
        backgroundColor: 'transparent',
        marginRight: scale(8),
        borderWidth: 1,
        borderColor: '#E1E3E6', // Border halus sesuai gaya WA terbaru
    },
    waFilterChipActive: {
        backgroundColor: '#E7FFEB',
        borderColor: '#E7FFEB',
    },
    waFilterChipText: {
        fontSize: moderateScale(14),
        color: '#555',
        fontWeight: '600',
    },
    waFilterChipTextActive: {
        color: '#008069',
    },
    waChatListScroll: {
        paddingBottom: verticalScale(100),
    },
    chatRow: {
        flexDirection: 'row',
        paddingLeft: scale(14), // Padding sesuai gaya WA
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    avatarWrapper: {
        paddingVertical: verticalScale(10),
        marginRight: scale(14),
    },
    waAvatar: {
        width: scale(52), // Sedikit diperkecil agar lebih proporsional
        height: scale(52),
        borderRadius: scale(26),
        backgroundColor: '#F0F2F5',
    },
    chatInfo: {
        flex: 1,
        borderBottomWidth: 0.8, // Garis yang lebih tegas di sisi info saja
        borderBottomColor: '#F0F2F5',
        paddingVertical: verticalScale(14), // Konsisten atas-bawah
        paddingRight: scale(14),
        justifyContent: 'center',
    },
    chatTopLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: verticalScale(4),
    },
    waChatName: {
        fontSize: moderateScale(16.5),
        fontWeight: '600',
        color: '#111B21', // Warna teks gelap WA
        flex: 1,
    },
    waChatTime: {
        fontSize: moderateScale(12),
        color: '#666',
    },
    chatBottomLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    msgPreviewWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusIcon: {
        marginRight: scale(4),
    },
    waLastMessage: {
        fontSize: moderateScale(14),
        color: '#666',
        flex: 1,
    },
    waUnreadBadge: {
        backgroundColor: '#25D366',
        width: scale(20),
        height: scale(20),
        borderRadius: scale(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    waUnreadText: {
        color: '#fff',
        fontSize: moderateScale(10),
        fontWeight: 'bold',
    },
    archiveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(15),
    },
    archiveIconWrapper: {
        marginRight: scale(30),
    },
    archiveText: {
        fontSize: moderateScale(16),
        fontWeight: 'bold',
        flex: 1,
    },
    archiveCount: {
        fontSize: moderateScale(12),
        color: '#25D366',
        fontWeight: 'bold',
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(30),
    },
    footerInfoText: {
        fontSize: moderateScale(12),
        color: '#666',
        marginLeft: scale(8),
    },
    metaAiFab: {
        position: 'absolute',
        bottom: verticalScale(120),
        right: scale(16),
        width: scale(50),
        height: scale(50),
        borderRadius: scale(15),
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    metaAiIcon: {
        width: scale(30),
        height: scale(30),
    },
    waFab: {
        position: 'absolute',
        bottom: verticalScale(35),
        right: scale(16),
        width: scale(60),
        height: scale(60),
        borderRadius: scale(18),
        backgroundColor: '#01816a',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    waBottomNav: {
        flexDirection: 'row',
        paddingBottom: verticalScale(10),
        paddingTop: verticalScale(10),
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
    },
    waNavItem: {
        flex: 1,
        alignItems: 'center',
    },
    waIconContainer: {
        height: verticalScale(30),
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: scale(56),
    },
    waNavItemIconActive: {
        backgroundColor: '#E7FFEB',
        borderRadius: scale(15),
    },
    waNavItemText: {
        fontSize: moderateScale(12),
        color: '#444',
        marginTop: verticalScale(4),
    },
    waNavItemTextActive: {
        fontSize: moderateScale(12),
        fontWeight: 'bold',
        color: '#000',
        marginTop: verticalScale(4),
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateContainer: {
        alignItems: 'center',
        marginTop: verticalScale(100),
    },
    emptyTitle: {
        fontSize: moderateScale(18),
        fontWeight: 'bold',
        marginTop: verticalScale(20),
    },
    emptySubtitle: {
        fontSize: moderateScale(14),
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: scale(40),
        marginTop: verticalScale(10),
    },
    resultsList: {
        paddingTop: verticalScale(10),
    },
    searchResultCard: {
        flexDirection: 'row',
        padding: scale(16),
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    searchAvatar: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(25),
    },
    searchInfo: {
        flex: 1,
        marginLeft: scale(16),
    },
    usernameText: {
        fontSize: moderateScale(14),
        color: '#008069',
    },
    startChatBtn: {
        padding: scale(10),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModalWrapper: {
        backgroundColor: '#fff',
        borderRadius: scale(3), // Gaya kotak Android
        width: '85%',
        paddingTop: verticalScale(22),
        paddingHorizontal: scale(24),
        paddingBottom: verticalScale(15),
        elevation: 10,
    },
    confirmTitle: {
        fontSize: moderateScale(19),
        fontWeight: '700',
        color: '#111B21',
        marginBottom: verticalScale(15),
    },
    confirmSubtitle: {
        fontSize: moderateScale(16),
        color: '#667781',
        lineHeight: verticalScale(22),
        marginBottom: verticalScale(25),
    },
    confirmActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: scale(10),
    },
    actionBtn: {
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(12),
    },
    cancelText: {
        fontSize: moderateScale(14),
        fontWeight: 'bold',
        color: '#008069', // Hijau WA
    },
    deleteText: {
        fontSize: moderateScale(14),
        fontWeight: 'bold',
        color: '#008069',
    },
    // Multi-Selection Styles
    selectedChatRow: {
        backgroundColor: '#e7ffeb', // Hijau muda seleksi WA
    },
    checkOverlay: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#fff',
        borderRadius: scale(10),
        padding: 1,
    },
    checkCircle: {
        backgroundColor: '#25D366',
        width: scale(18),
        height: scale(18),
        borderRadius: scale(9),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    selectionHeaderLayout: {
        backgroundColor: '#fff',
        height: verticalScale(48),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectionCountText: {
        fontSize: moderateScale(20),
        fontWeight: '500',
        color: '#111B21',
        marginLeft: scale(25), // Jarak lebih lebar antara panah dan angka
    },
    emptyResultsText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    }
});

export default ChatListScreen;
