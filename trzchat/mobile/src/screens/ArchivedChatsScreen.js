import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl, SafeAreaView, Platform, StatusBar as NativeStatusBar, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ArrowLeft, MessageSquare, Archive, MoreVertical, Search, Check, CheckCheck } from 'lucide-react-native';
import axios from 'axios';
import { API_URL, fixUrl } from '../config/api';
import { getToken } from '../utils/auth';
import dayjs from 'dayjs';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const ArchivedChatsScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchArchivedChats = useCallback(async () => {
        try {
            await getToken();
            const { getUser } = require('../utils/auth');
            const userData = await getUser();
            setCurrentUser(userData);

            const response = await axios.get(`${API_URL}/chats/archived`);
            setChats(response.data);
        } catch (error) {
            console.error('Error fetching archived chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchArchivedChats();
        }
    }, [isFocused, fetchArchivedChats]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchArchivedChats();
    }, [fetchArchivedChats]);

    const unarchiveChat = async (chatId) => {
        try {
            await getToken();
            await axios.post(`${API_URL}/chats/${chatId}/archive`, { archive: false });
            setChats(prev => prev.filter(c => c.id !== chatId));
        } catch (error) {
            console.error('Error unarchiving chat:', error);
            Alert.alert('Gagal', 'Tidak dapat membatalkan arsip chat.');
        }
    };

    const ChatItem = memo(({ item }) => {
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
                style={styles.chatRow}
                onPress={() => navigation.navigate('ChatDetail', { chat: { ...item, name: otherUser.name, avatar: otherUser.avatar, online: otherUser.online } })}
                onLongPress={() => {
                    Alert.alert(
                        'Buka Arsip?',
                        'Apakah Anda ingin memindahkan chat ini ke daftar utama?',
                        [
                            { text: 'Batal', style: 'cancel' },
                            { text: 'Buka Arsip', onPress: () => unarchiveChat(item.id) }
                        ]
                    );
                }}
                activeOpacity={0.7}
            >
                <View style={styles.avatarWrapper}>
                    <Image
                        source={{ uri: fixUrl(otherUser.avatar) || 'https://ui-avatars.com/api/?name=' + (otherUser.name || 'User') }}
                        style={styles.waAvatar}
                    />
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatTopLine}>
                        <Text style={styles.waChatName} numberOfLines={1}>{otherUser.name}</Text>
                        <Text style={styles.waChatTime}>{timeDisplay}</Text>
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
                        <View style={styles.archiveIconSmall}>
                            <Archive size={14} color="#666" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" backgroundColor="#fff" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#111B21" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Diarsipkan</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.headerIconBtn}>
                        <MoreVertical size={24} color="#111B21" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    Chat ini akan tetap diarsipkan saat pesan baru diterima. Ketuk lama chat untuk mematalkan arsip.
                </Text>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#008069" />
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => `archived_${item.id}`}
                    renderItem={({ item }) => <ChatItem item={item} />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#008069']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Archive size={80} color="#F0F2F5" />
                            <Text style={styles.emptyText}>Tidak ada pesan diarsipkan</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(16),
        paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight + verticalScale(10)) : verticalScale(10),
        paddingBottom: verticalScale(10),
        backgroundColor: '#fff',
    },
    backBtn: {
        marginRight: scale(16),
    },
    headerTitle: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
        color: '#111B21',
        flex: 1,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    headerIconBtn: {
        marginLeft: scale(16),
    },
    infoBox: {
        padding: scale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    infoText: {
        fontSize: moderateScale(13),
        color: '#666',
        textAlign: 'center',
        lineHeight: moderateScale(18),
    },
    listContent: {
        paddingBottom: verticalScale(20),
    },
    chatRow: {
        flexDirection: 'row',
        paddingLeft: scale(14),
        alignItems: 'center',
    },
    avatarWrapper: {
        paddingVertical: verticalScale(10),
        marginRight: scale(14),
    },
    waAvatar: {
        width: scale(52),
        height: scale(52),
        borderRadius: scale(26),
        backgroundColor: '#F0F2F5',
    },
    chatInfo: {
        flex: 1,
        borderBottomWidth: 0.8,
        borderBottomColor: '#F0F2F5',
        paddingVertical: verticalScale(14),
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
        color: '#111B21',
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
    archiveIconSmall: {
        marginLeft: scale(8),
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        marginTop: verticalScale(100),
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: verticalScale(16),
        fontSize: moderateScale(16),
        color: '#666',
    },
});

export default ArchivedChatsScreen;
