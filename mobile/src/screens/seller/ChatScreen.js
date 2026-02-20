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
    Alert,
    AppState
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
    Camera,
    Download,
    Share2,
    Pencil,
    Phone,
    Video,
    Mic,
    StopCircle,
    PlayCircle
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import apiService, { API_URL } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfirm } from '../../context/ConfirmContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';
import { useToast } from '../../context/ToastContext';
import { useIsFocused } from '@react-navigation/native';
import AppImage from '../../components/AppImage';

// --- WHATSAPP-STYLE OPTIMIZATIONS ---

// Audio Voice Note Player Component
const VoiceNotePlayer = memo(({ audioUrl, isMine }) => {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fullAudioUrl = audioUrl
        ? ((audioUrl.startsWith('http') || audioUrl.startsWith('data:'))
            ? audioUrl
            : `${API_URL}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`)
        : null;

    const togglePlay = async () => {
        if (!fullAudioUrl) return;
        try {
            if (isPlaying && sound) {
                await sound.pauseAsync();
                setIsPlaying(false);
                return;
            }
            if (sound) {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    if (status.positionMillis >= status.durationMillis) {
                        await sound.setPositionAsync(0);
                    }
                    await sound.playAsync();
                    setIsPlaying(true);
                    return;
                }
            }
            setIsLoading(true);
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: fullAudioUrl },
                { shouldPlay: true }
            );
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) setIsPlaying(false);
            });
            setSound(newSound);
            setIsPlaying(true);
        } catch (e) {
            console.error('[VoiceNote] Error playing audio:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        return () => { sound?.unloadAsync(); };
    }, [sound]);

    return (
        <TouchableOpacity onPress={togglePlay} style={styles.voiceNoteContainer}>
            {isLoading ? (
                <ActivityIndicator size="small" color={isMine ? '#fff' : '#138FEA'} />
            ) : isPlaying ? (
                <StopCircle size={28} color={isMine ? '#fff' : '#138FEA'} />
            ) : (
                <PlayCircle size={28} color={isMine ? '#fff' : '#138FEA'} />
            )}
            <View style={[styles.voiceWaveform, isMine && styles.voiceWaveformMine]}>
                {[4, 8, 14, 10, 6, 12, 8, 4, 10, 6].map((h, i) => (
                    <View key={i} style={[
                        styles.voiceBar,
                        { height: isPlaying ? h * 1.5 : h },
                        isMine ? styles.voiceBarMine : styles.voiceBarTheir
                    ]} />
                ))}
            </View>
            <Mic size={14} color={isMine ? 'rgba(255,255,255,0.7)' : '#94A3B8'} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
    );
});

// 1. Optimistic Message Item with minimal re-renders
const MessageItem = memo(({ item, isMine, formatTime, onImagePress, onLongPress, refreshKey }) => {
    const imageUrl = item.image_url ?
        ((item.image_url.startsWith('http') || item.image_url.startsWith('data:')) ?
            item.image_url :
            `${API_URL}${item.image_url.startsWith('/') ? '' : '/'}${item.image_url}`)
        : null;

    return (
        <TouchableOpacity
            style={[
                styles.messageWrapper,
                isMine ? styles.myMsgWrapper : styles.theirMsgWrapper,
                imageUrl && { maxWidth: '100%' }
            ]}
            onLongPress={() => isMine && !item.sending && onLongPress(item)}
            activeOpacity={0.9}
            delayLongPress={300}
        >
            <View style={[
                styles.messageBubble,
                isMine ? styles.myMsgBubble : styles.theirMsgBubble,
                imageUrl && styles.imageMessageBubble
            ]}>
                <Text style={[
                    styles.senderName,
                    isMine ? styles.mySenderName : styles.theirSenderName,
                    imageUrl && { paddingHorizontal: 10 }
                ]}>
                    {isMine ? 'Saya' : (item.sender_name || 'User')}
                </Text>
                {imageUrl && (
                    <TouchableOpacity onPress={() => onImagePress(imageUrl)} activeOpacity={0.9}>
                        <AppImage
                            uri={item.image_url}
                            style={styles.messageImage}
                            resizeMode="cover"
                            refreshKey={refreshKey}
                        />
                    </TouchableOpacity>
                )}
                {item.audio_url && (
                    <VoiceNotePlayer audioUrl={item.audio_url} isMine={isMine} />
                )}
                {item.message ? (
                    <Text style={[styles.messageText, isMine ? styles.myMsgText : styles.theirMsgText]}>
                        {item.message}
                    </Text>
                ) : null}
                <View style={styles.messageFooter}>
                    {item.is_edited === 1 && (
                        <Text style={[styles.editedLabel, isMine ? styles.myMsgTime : styles.theirMsgTime]}>
                            (diedit)
                        </Text>
                    )}
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
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // WhatsApp-style: Only re-render if message content or status changes
    return prevProps.item.id === nextProps.item.id &&
        prevProps.item.is_read === nextProps.item.is_read &&
        prevProps.item.sending === nextProps.item.sending &&
        prevProps.item.message === nextProps.item.message &&
        prevProps.item.image_url === nextProps.item.image_url &&
        prevProps.item.audio_url === nextProps.item.audio_url &&
        prevProps.item.is_edited === nextProps.item.is_edited;
});

const ConversationItem = memo(({ item, isActive, onPress, onLongPress, getDisplayName, formatTime, isOnline, refreshKey }) => (
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
                <AppImage uri={item.avatar_url} style={styles.avatar} refreshKey={refreshKey} />
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
const ChatInput = memo(({ onSendMessage, onPickImage, themeColor, editMode, initialValue, onCancelEdit }) => {
    const [localMessage, setLocalMessage] = useState('');
    const [isSendingLocal, setIsSendingLocal] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingRef = useRef(null);
    const recordingTimerRef = useRef(null);

    // Sync local state when entering edit mode
    useEffect(() => {
        if (editMode && initialValue) {
            setLocalMessage(initialValue);
        } else if (!editMode) {
            setLocalMessage('');
        }
    }, [editMode, initialValue]);

    // Cleanup recording on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => { });
            }
        };
    }, []);

    const handleSend = async () => {
        if (!localMessage.trim() || isSendingLocal) return;

        const messageText = localMessage.trim();
        setIsSendingLocal(true);

        const success = await onSendMessage(messageText, null);
        if (success) {
            setLocalMessage('');
        }
        setIsSendingLocal(false);
    };

    const handlePick = async () => {
        if (isSendingLocal || editMode) return;
        setIsSendingLocal(true);
        await onPickImage();
        setIsSendingLocal(false);
    };

    const startRecording = async () => {
        if (isRecording || editMode || isSendingLocal) return;
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Butuh izin mikrofon untuk merekam suara.');
                return;
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            recordingRef.current = recording;
            setIsRecording(true);
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(d => d + 1);
            }, 1000);
        } catch (e) {
            console.error('[Voice] Gagal mulai rekam:', e);
            Alert.alert('Error', 'Gagal memulai perekaman');
        }
    };

    const stopRecordingAndSend = async () => {
        if (!isRecording || !recordingRef.current) return;
        clearInterval(recordingTimerRef.current);
        setIsRecording(false);
        setRecordingDuration(0);
        setIsSendingLocal(true);
        try {
            let uri;

            if (Platform.OS === 'web') {
                // Di web: getURI() hanya tersedia SETELAH rekaman dihentikan
                await recordingRef.current.stopAndUnloadAsync();
                uri = recordingRef.current.getURI();
            } else {
                // Di native: ambil URI SEBELUM stop — setelah unload, URI bisa null
                uri = recordingRef.current.getURI();
                await recordingRef.current.stopAndUnloadAsync();
            }

            recordingRef.current = null;
            console.log('[Voice] URI rekaman:', uri);

            if (!uri) throw new Error('URI rekaman tidak ditemukan');

            let base64Audio;
            if (Platform.OS === 'web') {
                // Di web, URI adalah blob URL — gunakan fetch untuk konversi ke base64
                const response = await fetch(uri);
                const blob = await response.blob();
                base64Audio = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                console.log('[Voice] Web base64Audio prefix:', base64Audio?.substring(0, 50));
            } else {
                // Di native (Android/iOS), gunakan expo-file-system
                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                const mimeType = Platform.OS === 'android' ? 'audio/mp4' : 'audio/m4a';
                base64Audio = `data:${mimeType};base64,${base64}`;
                console.log('[Voice] Native base64Audio prefix:', base64Audio?.substring(0, 50));
            }

            await onSendMessage('', null, base64Audio);
        } catch (e) {
            console.error('[Voice] Gagal kirim suara:', e);
            Alert.alert('Error', 'Gagal mengirim pesan suara: ' + e.message);
        } finally {
            setIsSendingLocal(false);
        }
    };

    const cancelRecording = async () => {
        if (!isRecording || !recordingRef.current) return;
        clearInterval(recordingTimerRef.current);
        try {
            await recordingRef.current.stopAndUnloadAsync();
        } catch (e) { /* ignore */ }
        recordingRef.current = null;
        setIsRecording(false);
        setRecordingDuration(0);
    };

    const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    if (isRecording) {
        return (
            <View style={styles.recordingArea}>
                <TouchableOpacity onPress={cancelRecording} style={styles.recordCancelBtn}>
                    <X size={22} color="#EF4444" />
                </TouchableOpacity>
                <View style={styles.recordingInfo}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
                    <Text style={styles.recordingLabel}>Sedang merekam...</Text>
                </View>
                <TouchableOpacity onPress={stopRecordingAndSend} style={styles.recordSendBtn}>
                    {isSendingLocal ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Send size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View>
            {editMode && (
                <View style={styles.editBar}>
                    <View style={styles.editInfo}>
                        <Pencil size={14} color="#138FEA" />
                        <Text style={styles.editText} numberOfLines={1}>Edit Pesan: {initialValue}</Text>
                    </View>
                    <TouchableOpacity onPress={onCancelEdit}>
                        <X size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.inputArea}>
                <TouchableOpacity
                    style={[styles.attachBtn, editMode && { opacity: 0.3 }]}
                    onPress={handlePick}
                    disabled={isSendingLocal || editMode}
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
                    autoFocus={editMode}
                />
                {!localMessage.trim() && !editMode ? (
                    <TouchableOpacity
                        style={[styles.micBtn, isSendingLocal && { opacity: 0.5 }]}
                        onPress={startRecording}
                        disabled={isSendingLocal}
                    >
                        <Mic size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            (!localMessage.trim() && !isSendingLocal) && styles.sendBtnDisabled,
                            isSendingLocal && { opacity: 0.8 },
                            editMode && { backgroundColor: '#10B981' }
                        ]}
                        onPress={handleSend}
                        disabled={!localMessage.trim() || isSendingLocal}
                    >
                        {isSendingLocal ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            editMode ? <Check size={20} color="#FFFFFF" /> : <Send size={20} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

const ChatScreen = ({ navigation }) => {
    const isFocused = useIsFocused();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const { showToast } = useToast();
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
    const { startCall } = useCall();
    const { onlineUsers, socket, refreshTrigger } = useOrderNotification();

    const [messages, setMessages] = useState([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConv, setSelectedConv] = useState(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const [isMsgMenuVisible, setIsMsgMenuVisible] = useState(false);
    const [selectedMsgForMenu, setSelectedMsgForMenu] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingMsgData, setEditingMsgData] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
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

    // Define performUpdateMessage first (before handleSendMessage uses it)
    const performUpdateMessage = useCallback(async (newText) => {
        if (!editingMsgData) return false;
        try {
            await apiService.put(`/api/messages/${editingMsgData.id}`, {
                message: newText
            });
            setIsEditing(false);
            setEditingMsgData(null);
            showToast('Pesan berhasil diperbarui', 'success');
            return true;
        } catch (error) {
            console.error('Update message error:', error);
            showToast('Gagal memperbarui pesan', 'error');
            return false;
        }
    }, [editingMsgData, showToast]);

    // WhatsApp-style: Optimistic message sending
    const handleSendMessage = useCallback(async (text = '', base64Image = null, base64Audio = null) => {
        if ((!text.trim() && !base64Image && !base64Audio) || !activeChat) return false;

        // Jika sedang mode edit, panggil fungsi update
        if (isEditing && editingMsgData) {
            return performUpdateMessage(text.trim());
        }

        // Create optimistic message
        const optimisticMessage = {
            id: `temp_${Date.now()}`,
            sender_id: user.id,
            receiver_id: activeChat.user_id,
            message: text.trim(),
            image_url: base64Image,
            audio_url: base64Audio,
            created_at: new Date().toISOString(),
            is_read: false,
            sending: true,
            sender_name: user?.username || 'Saya'
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
                image_url: base64Image,
                audio_url: base64Audio
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
    }, [activeChat, activeOrder, fetchConversations, user.id, isEditing, editingMsgData, performUpdateMessage]);

    const handleDeleteMessage = useCallback(async () => {
        if (!selectedMsgForMenu) return;
        const messageToDelete = selectedMsgForMenu;
        setIsMsgMenuVisible(false);

        confirm({
            title: 'Hapus Pesan',
            message: 'Apakah Anda yakin ingin menghapus pesan ini?',
            confirmLabel: 'Hapus',
            onConfirm: async () => {
                // Optimistic UI update: Remove message immediately
                setMessages(prev => prev.filter(m => String(m.id) !== String(messageToDelete.id)));

                try {
                    await apiService.delete(`/api/messages/${messageToDelete.id}`);
                    showToast('Pesan berhasil dihapus', 'success');
                    // Socket event will sync to other devices
                } catch (error) {
                    console.error('Delete message error:', error);
                    showToast('Gagal menghapus pesan', 'error');

                    // Rollback: Re-add the message if deletion failed
                    setMessages(prev => {
                        // Check if message already exists (from socket event)
                        const exists = prev.some(m => String(m.id) === String(messageToDelete.id));
                        if (!exists) {
                            return [...prev, messageToDelete].sort((a, b) =>
                                new Date(a.created_at) - new Date(b.created_at)
                            );
                        }
                        return prev;
                    });
                }
            }
        });
    }, [selectedMsgForMenu, confirm, showToast]);

    const startEditMessage = useCallback(() => {
        if (!selectedMsgForMenu) return;
        setIsMsgMenuVisible(false);
        setIsEditing(true);
        setEditingMsgData(selectedMsgForMenu);
    }, [selectedMsgForMenu]);

    const downloadImage = useCallback(async (url) => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                showToast('Butuh izin galeri untuk mengunduh gambar.', 'error');
                return;
            }

            const fileName = `K-BERKAH88_${Date.now()}.jpg`;
            const fileUri = FileSystem.documentDirectory + fileName;

            // Menggunakan API legacy sesuai anjuran error di Expo 54
            const downloadRes = await FileSystem.downloadAsync(url, fileUri);

            await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
            showToast('Gambar berhasil disimpan ke galeri', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showToast('Gagal mengunduh gambar', 'error');
        } finally {
            setIsDownloading(false);
        }
    }, [isDownloading, showToast]);

    const shareImage = useCallback(async (url) => {
        try {
            const fileName = `K-BERKAH88_SHARE_${Date.now()}.jpg`;
            const fileUri = FileSystem.cacheDirectory + fileName;

            // Menggunakan API legacy sesuai anjuran error di Expo 54
            const downloadRes = await FileSystem.downloadAsync(url, fileUri);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadRes.uri);
            } else {
                showToast('Fitur berbagi tidak didukung', 'info');
            }
        } catch (error) {
            console.error('Share error:', error);
            showToast('Gagal membagikan gambar', 'error');
        }
    }, [showToast]);

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
                const newData = res.data.data;
                setMessages(prev => {
                    // Optimized merge logic:
                    // Keep 'sending' messages AND messages that were just sent but not yet in history
                    const sendingMessages = prev.filter(m => m.sending);
                    const recentlySent = prev.filter(m =>
                        !m.sending &&
                        !String(m.id).startsWith('temp_') &&
                        !newData.some(n => String(n.id) === String(m.id))
                    );

                    // Filter recentlySent to only those from the last 15 seconds to avoid ghosts
                    const nowTS = Date.now();
                    const validRecent = recentlySent.filter(m => (nowTS - new Date(m.created_at).getTime()) < 15000);

                    // If data hasn't changed at all, return prev to avoid re-renders
                    if (prev.length === (newData.length + sendingMessages.length + validRecent.length)) {
                        const hasChanges = newData.some((msg, idx) =>
                            prev[idx] && (msg.is_read !== prev[idx].is_read || msg.message !== prev[idx].message)
                        );
                        if (!hasChanges) return prev;
                    }

                    return [...newData, ...validRecent, ...sendingMessages];
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

    // Refresh when app returns to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active' && activeChat) {
                console.log('[ChatScreen] App active, refreshing messages...');
                fetchMessages(true);
                fetchActiveOrder();
            }
        });
        return () => subscription.remove();
    }, [activeChat, fetchMessages, fetchActiveOrder]);

    useEffect(() => {
        if (activeChat) {
            setIsTransitioning(true);

            // Execute fetching directly without InteractionManager to prevent deadlock
            fetchMessages();
            fetchActiveOrder();
            if (isFocused) {
                markAsRead(activeChat.user_id);
            }

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
                console.log('[ChatScreen] Pesan RELEVAN diterima:', msg.id, 'Sender:', msgSender, 'Name:', msg.sender_name);
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => String(m.id) === String(msg.id))) {
                        console.log('[ChatScreen] Pesan duplikat diabaikan:', msg.id);
                        return prev;
                    }
                    return [...prev, msg];
                });

                // Jika pesan dari partner atau untuk saya (pelanggan), tandai sebagai dibaca
                if (isFocused && (isFromPartner || (isCustomer && isToMe))) {
                    console.log('[ChatScreen] Di layar Chat, menandai sebagai dibaca...');
                    markAsRead(msg.sender_id);
                } else {
                    console.log(`[ChatScreen] Tidak menandai dibaca karena: isFocused=${isFocused}`);
                }
            } else {
                console.log('[ChatScreen] Pesan diabaikan (tidak relevan). Partner:', partnerId, 'MsgFrom:', msgSender, 'MsgTo:', msgReceiver);
            }
        };

        const handleMessageEdited = ({ id, message }) => {
            console.log('[ChatScreen] Pesan diedit via socket:', id);
            setMessages(prev => prev.map(m =>
                String(m.id) === String(id) ? { ...m, message, is_edited: 1 } : m
            ));
        };

        const handleMessageDeleted = ({ id }) => {
            console.log('[ChatScreen] Pesan dihapus via socket:', id);
            setMessages(prev => prev.filter(m => String(m.id) !== String(id)));
        };

        socket.on('new_message', handleNewMessage);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);

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
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('messages_read', handleMessagesRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket, markAsRead, isFocused]); // Ditambah isFocused agar peka terhadap perubahan layar

    // Fallback polling: Selalu poll sebagai backup, tapi lebih cepat jika socket disconnect
    useEffect(() => {
        let interval;
        const POLL_INTERVAL = (socket && socket.connected) ? 5000 : 3000; // 3s jika disconnect, 5s jika connect (backup)

        if (activeChat) {
            console.log(`[ChatScreen] Polling started with interval: ${POLL_INTERVAL}ms. Socket Status: ${socket && socket.connected ? 'Connected' : 'Disconnected'}`);

            // Initial Check
            if (!socket || !socket.connected) {
                console.log('[ChatScreen] Socket not connected, fetching messages immediately...');
                fetchMessages(true);
            }

            interval = setInterval(() => {
                fetchMessages(true);
            }, POLL_INTERVAL);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeChat, socket?.connected, fetchMessages]); // Depend on socket.connected state

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
        if (['admin', 'owner', 'kasir', 'penjual', 'seller'].includes(contact.role)) {
            return 'Staf Berkah 88';
        }
        return contact.username;
    }, []);

    const isPartnerOnline = useCallback((partner) => {
        if (!partner) return false;
        const partnerRole = partner.role;
        const partnerId = partner.user_id || partner.id;

        if (['admin', 'owner', 'kasir', 'penjual', 'seller'].includes(partnerRole)) {
            return onlineUsers.some(u => ['admin', 'owner', 'kasir', 'penjual', 'seller'].includes(u.role));
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
            isMine={String(item.sender_id) === String(user.id)}
            formatTime={formatTime}
            onImagePress={setPreviewImage}
            onLongPress={(msg) => {
                setSelectedMsgForMenu(msg);
                setIsMsgMenuVisible(true);
            }}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => {
                                console.log('[ChatScreen] Voice call pressed', activeChat);
                                if (startCall) {
                                    startCall(activeChat, 'voice');
                                } else {
                                    Alert.alert('Info', 'Fitur telepon sedang disiapkan atau library belum terpasang.');
                                }
                            }}
                            style={[styles.headerActionBtn, { marginRight: 15 }]}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Phone size={22} color="#138FEA" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                console.log('[ChatScreen] Video call pressed', activeChat);
                                if (startCall) {
                                    startCall(activeChat, 'video');
                                } else {
                                    Alert.alert('Info', 'Fitur video call sedang disiapkan atau library belum terpasang.');
                                }
                            }}
                            style={[styles.headerActionBtn, { marginRight: 15 }]}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Video size={22} color="#138FEA" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteHistory} style={styles.moreBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Trash2 size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
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
                                renderItem={({ item }) => (
                                    <MessageItem
                                        item={item}
                                        isMine={String(item.sender_id) === String(user.id || user.userId)}
                                        formatTime={formatTime}
                                        onImagePress={setPreviewImage}
                                        onLongPress={setSelectedMsgForMenu}
                                        refreshKey={refreshTrigger}
                                    />
                                )}
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
                                editMode={isEditing}
                                initialValue={editingMsgData?.message}
                                onCancelEdit={() => {
                                    setIsEditing(false);
                                    setEditingMsgData(null);
                                }}
                            />
                            {Platform.OS === 'android' && <View style={{ height: keyboardPadding }} />}
                        </>
                    )}
                </KeyboardAvoidingView>

                {/* Full Image Preview Modal */}
                <Modal
                    visible={!!previewImage}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setPreviewImage(null)}
                >
                    <View style={styles.previewModal}>
                        <View style={styles.previewHeader}>
                            <TouchableOpacity
                                onPress={() => setPreviewImage(null)}
                                style={styles.previewAction}
                            >
                                <ArrowLeft size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => shareImage(previewImage)}
                                style={styles.previewAction}
                            >
                                <Share2 size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <Image
                            source={{ uri: previewImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />

                        <View style={styles.previewFooter}>
                            <TouchableOpacity
                                style={styles.previewFooterAction}
                                onPress={() => downloadImage(previewImage)}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Download size={20} color="#FFFFFF" />
                                        <Text style={styles.previewFooterText}>Simpan ke Galeri</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Message Options Modal */}
                <Modal
                    visible={isMsgMenuVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsMsgMenuVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setIsMsgMenuVisible(false)}
                    >
                        <View style={styles.optionContainer}>
                            <View style={styles.optionHeader}>
                                <View style={styles.optionHandle} />
                                <Text style={styles.optionTitle}>Opsi Pesan</Text>
                                <Text style={styles.optionSubtitle}>Pilih tindakan untuk pesan ini</Text>
                            </View>

                            {selectedMsgForMenu?.message && (
                                <TouchableOpacity style={styles.optionItem} onPress={startEditMessage}>
                                    <View style={[styles.optionIcon, { backgroundColor: '#E0F2FE' }]}>
                                        <Pencil size={20} color="#0EA5E9" />
                                    </View>
                                    <Text style={styles.optionText}>Edit Pesan</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.optionItem} onPress={handleDeleteMessage}>
                                <View style={[styles.optionIcon, { backgroundColor: '#FEE2E2' }]}>
                                    <Trash2 size={20} color="#EF4444" />
                                </View>
                                <Text style={[styles.optionText, { color: '#EF4444' }]}>Hapus Pesan</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionItem, { borderBottomWidth: 0 }]}
                                onPress={() => setIsMsgMenuVisible(false)}
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
                                    confirmLabel: 'Ya, Hapus',
                                });
                                if (accepted) {
                                    try {
                                        await apiService.delete(`/api/messages/history/${selectedConv.user_id}`);
                                        if (activeChat?.user_id === selectedConv.user_id) {
                                            setMessages([]);
                                        }
                                        fetchConversations();
                                        showToast('Riwayat chat berhasil dihapus', 'success');
                                    } catch (e) {
                                        console.error("Error deleting history:", e);
                                        showToast('Gagal menghapus riwayat chat', 'error');
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
    imageMessageBubble: {
        paddingHorizontal: 4,
        paddingTop: 4,
        paddingBottom: 6,
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
    senderName: {
        fontSize: 9,
        fontWeight: '900',
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    mySenderName: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirSenderName: {
        color: '#138FEA',
    },
    checkIcon: {
        marginLeft: 2,
    },
    messageImage: {
        width: 240,
        height: 180,
        borderRadius: 12,
        marginBottom: 2,
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
    headerActionBtn: {
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
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
    // --- Image Preview Styles ---
    previewModal: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    previewHeader: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    previewAction: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)', // Darker background to be visible on white images
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 10,
    },
    previewFooter: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 70 : 40,
        flexDirection: 'row',
        gap: 20,
    },
    previewFooterAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#138FEA', // Use primary blue for maximum contrast
        paddingHorizontal: 25,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 12,
    },
    previewFooterText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    // --- New Styles for Edit/Delete ---
    editedLabel: {
        fontSize: 10,
        fontStyle: 'italic',
        marginRight: 4,
    },
    editBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        justifyContent: 'space-between',
    },
    editInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    editText: {
        fontSize: 13,
        color: '#64748B',
        fontStyle: 'italic',
    },
    // --- Voice Note Styles ---
    micBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#138FEA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FEF2F2',
        borderTopWidth: 1,
        borderTopColor: '#FECACA',
        gap: 10,
    },
    recordCancelBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
    },
    recordingTimer: {
        fontSize: 16,
        fontWeight: '700',
        color: '#EF4444',
    },
    recordingLabel: {
        fontSize: 13,
        color: '#94A3B8',
    },
    recordSendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#138FEA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceNoteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        minWidth: 160,
        gap: 6,
    },
    voiceWaveform: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    voiceWaveformMine: {},
    voiceBar: {
        width: 3,
        borderRadius: 2,
    },
    voiceBarMine: {
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    voiceBarTheir: {
        backgroundColor: '#94A3B8',
    },
});

export default ChatScreen;
