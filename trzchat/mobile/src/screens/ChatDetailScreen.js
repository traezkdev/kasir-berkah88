import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ImageBackground,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard,
    Animated,
    Alert,
    PanResponder,
    InteractionManager,
    AppState,
    Modal,
    Dimensions,
    Linking,
    Clipboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio, Video as ExpoVideo, ResizeMode } from 'expo-av';
import { ArrowLeft, MoreVertical, Paperclip, Smile, Mic, Send, Reply, Edit2, Trash2, X, CornerUpRight, Play, Pause, StopCircle, Check, CheckCheck, Video as VideoIcon, FileText, Download, File, Maximize2, Phone, User, Image as ImageIcon, MapPin, Copy, Camera } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_URL, SOCKET_URL, fixUrl } from '../config/api';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';
dayjs.extend(relativeTime);
dayjs.locale('id');
import io from 'socket.io-client';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    interpolateColor,
    withSpring
} from 'react-native-reanimated';

import { getToken } from '../utils/auth';
import { useCall } from '../context/CallContext';

// --- Komponen Pembantu di Luar (Untuk Optimasi Performa) ---

// Komponen Bar Statis (Sangat Ringan untuk Scroll)
const StaticWaveBar = memo(({ index }) => {
    const heights = [10, 16, 12, 20, 14, 24, 18, 12, 22, 16, 20, 14, 18, 12, 10];
    const height = heights[index % heights.length];
    return <View style={[styles.waveBar, { height }]} />;
});

// Komponen Bar Animasi (Hanya untuk yang sedang diputar)
const AnimatedWaveBar = memo(({ index, isMe, sharedProgress }) => {
    const heights = [10, 16, 12, 20, 14, 24, 18, 12, 22, 16, 20, 14, 18, 12, 10];
    const baseHeight = heights[index % heights.length];
    const pulse = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 400 + (index * 40) }),
                withTiming(0.8, { duration: 400 + (index * 40) })
            ),
            -1,
            true
        );
        return () => { pulse.value = 1; };
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const barPct = (index + 1) / 15;
        const isActive = sharedProgress.value >= barPct;

        return {
            height: baseHeight * pulse.value,
            backgroundColor: withTiming(
                isActive ? (isMe ? '#7C3AED' : '#6366F1') : 'rgba(0,0,0,0.1)',
                { duration: 150 }
            )
        };
    });

    return <Reanimated.View style={[styles.waveBar, animatedStyle]} />;
});

const Waveform = memo(({ isMe, isPlaying, sharedProgress }) => {
    return (
        <View style={styles.waveformContainer}>
            {[...Array(15)].map((_, i) => (
                isPlaying ? (
                    <AnimatedWaveBar key={i} index={i} isMe={isMe} sharedProgress={sharedProgress} />
                ) : (
                    <StaticWaveBar key={i} index={i} />
                )
            ))}
        </View>
    );
});

const MessageItem = memo(({
    item,
    onLongPress,
    onReplyPress,
    isHighlighted,
    highlightAnim,
    onAudioPress,
    sharedProgress,
    isPlaying,
    isLoading,
    onMediaPress,
    itemProgress,
    onDownloadPress,
    selectionMode,
    isSelected,
    onToggleSelection,
    onEnterSelection
}) => {
    const isMe = item.sender === 'me';
    const displayTime = React.useMemo(() => dayjs(item.created_at || item.time).format('HH:mm'), [item.created_at, item.time]);
    const isDeleted = item.is_deleted ? true : false;
    const hasReply = item.reply_to && !isDeleted;
    const isAudio = (item.type === 'audio') && !isDeleted;
    const isImage = (item.type === 'image') && !isDeleted;
    const isVideo = (item.type === 'video') && !isDeleted;
    const isFile = (item.type === 'file') && !isDeleted;

    const animatedBubbleStyle = isHighlighted ? {
        backgroundColor: highlightAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['transparent', '#ffe082', 'transparent'],
        }),
        transform: [{
            scale: highlightAnim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [1, 1.03, 1],
            })
        }],
    } : {};

    return (
        <TouchableOpacity
            style={[
                styles.messageOuterContainer,
                isSelected && styles.selectedMessageBg
            ]}
            activeOpacity={1}
            onPress={() => selectionMode ? onToggleSelection(item.id) : null}
            onLongPress={() => !selectionMode ? onEnterSelection(item.id) : null}
            delayLongPress={400}
        >
            <View
                style={[
                    styles.messageContainer,
                    isMe ? styles.myMessageContainer : styles.theirMessageContainer,
                    selectionMode && { maxWidth: '100%', width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center' },
                ]}
            >
                {selectionMode && (
                    <View style={styles.selectionIndicator}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Check size={12} color="#fff" strokeWidth={4} />}
                        </View>
                    </View>
                )}
                <TouchableOpacity
                    onLongPress={() => !selectionMode ? onLongPress(item) : null}
                    onPress={() => selectionMode ? onToggleSelection(item.id) : null}
                    delayLongPress={400}
                    activeOpacity={0.85}
                    style={selectionMode ? { flex: 1, alignItems: isMe ? 'flex-end' : 'flex-start' } : null}
                >
                    <Animated.View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble, isDeleted ? styles.deletedBubble : null, animatedBubbleStyle]}>
                        {hasReply ? (
                            <TouchableOpacity
                                style={[styles.replyPreviewBubble, isMe ? styles.replyPreviewMe : styles.replyPreviewThem]}
                                onPress={() => onReplyPress(item.reply_to)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.replyPreviewUser}>{item.reply_user || 'User'}</Text>
                                <Text style={styles.replyPreviewText} numberOfLines={1}>{item.reply_text}</Text>
                            </TouchableOpacity>
                        ) : null}
                        {isAudio ? (
                            <TouchableOpacity
                                style={styles.audioPlayer}
                                onPress={() => onAudioPress(item.id, item.audio_url)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.audioPlayBtn, isMe ? styles.audioPlayBtnMe : styles.audioPlayBtnThem]}>
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : isPlaying ? (
                                        <Pause size={18} color="#fff" />
                                    ) : (
                                        <Play size={18} color="#fff" />
                                    )}
                                </View>
                                <View style={styles.audioWaveContainer}>
                                    <Waveform isMe={isMe} isPlaying={isPlaying} sharedProgress={sharedProgress} />
                                    <View style={styles.audioMetaRow}>
                                        <Text style={styles.audioDurationText}>{item.text.replace('🎤 Pesan Suara', '').trim()}</Text>
                                        <Mic size={12} color="#9CA3AF" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ) : isImage ? (
                            <View>
                                <TouchableOpacity
                                    style={styles.imageContainer}
                                    onPress={() => onMediaPress('image', item.image_url)}
                                    activeOpacity={0.9}
                                >
                                    <Image
                                        source={{ uri: fixUrl(item.image_url) }}
                                        style={styles.messageImage}
                                        resizeMode="cover"
                                    />
                                    {itemProgress !== undefined && (
                                        <View style={styles.uploadOverlay}>
                                            <ActivityIndicator size="small" color="#fff" />
                                            <Text style={styles.uploadProgressText}>{itemProgress}%</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {(item.text && item.text !== '📷 Foto') && (
                                    <View style={styles.imageCaptionContainer}>
                                        <Text style={styles.imageCaptionText}>{item.text}</Text>
                                    </View>
                                )}
                            </View>
                        ) : isVideo ? (
                            <View>
                                <TouchableOpacity
                                    style={styles.imageContainer}
                                    onPress={() => onMediaPress('video', item.video_url)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.videoWrapper}>
                                        <ExpoVideo
                                            source={{ uri: fixUrl(item.video_url) }}
                                            style={styles.messageImage}
                                            resizeMode={ResizeMode.COVER}
                                            shouldPlay={false}
                                            positionMillis={100} // Mengambil frame awal untuk thumbnail
                                            useNativeControls={false}
                                        />
                                        <View style={styles.playOverlay}>
                                            <Play size={24} color="#fff" fill="#fff" />
                                        </View>
                                        {itemProgress !== undefined && (
                                            <View style={styles.uploadOverlay}>
                                                <ActivityIndicator size="small" color="#fff" />
                                                <Text style={styles.uploadProgressText}>{itemProgress}%</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                {(item.text && item.text !== '🎥 Video') && (
                                    <View style={styles.imageCaptionContainer}>
                                        <Text style={styles.imageCaptionText}>{item.text}</Text>
                                    </View>
                                )}
                            </View>
                        ) : isFile ? (
                            <TouchableOpacity
                                style={styles.fileContainer}
                                onPress={() => onDownloadPress(item.file_url, item.file_name)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.fileIconBox}>
                                    <FileText size={24} color="#6366F1" />
                                </View>
                                <View style={styles.fileInfo}>
                                    <Text style={styles.fileName} numberOfLines={1}>{item.file_name || 'Document'}</Text>
                                    <Text style={styles.fileSize}>Unduh berkas</Text>
                                </View>
                                <Download size={18} color="#888" />
                            </TouchableOpacity>
                        ) : isDeleted ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(5) }}>
                                <Text style={styles.deletedText}>🚫</Text>
                                <Text style={styles.deletedText}>Pesan ini telah dihapus</Text>
                            </View>
                        ) : (
                            <Text style={styles.messageText}>{item.text}</Text>
                        )}
                        <View style={styles.messageFooter}>
                            {(item.is_edited && !isDeleted) ? (
                                <Text style={styles.editedLabel}>diedit</Text>
                            ) : null}
                            <Text style={styles.messageTime}>{displayTime}</Text>
                            {isMe && !isDeleted && (
                                <View style={{ marginLeft: 4 }}>
                                    {item.status === 'read' ? (
                                        <CheckCheck size={16} color="#34B7F1" />
                                    ) : item.status === 'delivered' ? (
                                        <CheckCheck size={16} color="#888" />
                                    ) : (
                                        <Check size={16} color="#888" />
                                    )}
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // Custom comparison untuk memaksimalkan performa memo
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.text === nextProps.item.text &&
        prevProps.item.status === nextProps.item.status &&
        prevProps.isPlaying === nextProps.isPlaying &&
        prevProps.isLoading === nextProps.isLoading &&
        prevProps.isHighlighted === nextProps.isHighlighted &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.selectionMode === nextProps.selectionMode &&
        prevProps.itemProgress === nextProps.itemProgress
    );
});

const ChatDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { chat } = route.params;
    const { startCall } = useCall();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [socket, setSocket] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(chat.online || 'offline');
    const [lastSeen, setLastSeen] = useState(null);
    const [keyboardPadding, setKeyboardPadding] = useState(0);
    const [showEmojis, setShowEmojis] = useState(false);

    // Attachments Menu State
    const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);

    // Message Actions States
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    // Multi-Selection States
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState({}); // Menggunakan object { [id]: true } agar lookup O(1)

    // Media Preview States
    const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaCaption, setMediaCaption] = useState('');

    // Media Viewer States
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerType, setViewerType] = useState(null); // 'image' or 'video'
    const [viewerUrl, setViewerUrl] = useState(null);

    // Upload Progress State
    const [uploadProgress, setUploadProgress] = useState({}); // { tempId: percentage }

    // Voice Message States
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingInstanceRef = useRef(null);
    const recordingStatusRef = useRef('none');
    const startTimeRef = useRef(0);
    const [recordingMode, setRecordingMode] = useState(null); // 'hold' or 'toggle'
    const [willCancel, setWillCancel] = useState(false);
    const [audioPlayingId, setAudioPlayingId] = useState(null);
    const [audioLoadingId, setAudioLoadingId] = useState(null);
    const soundObjectRef = useRef(null);
    const audioPlayingIdRef = useRef(null);
    const sharedProgress = useSharedValue(0); // Progres animasi global (0-1)
    const recordingTimerRef = useRef(null);
    const micPulseAnim = useRef(new Animated.Value(1)).current;

    const flatListRef = useRef(null);
    const highlightAnim = useRef(new Animated.Value(0)).current;
    const messagesRef = useRef([]);
    const lastFetchRef = useRef(0);
    const isRecordingRef = useRef(false);

    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    const fetchMessages = useCallback(async (pageNum = 1) => {
        if (pageNum === 1 && messagesRef.current.length === 0) setLoading(true);
        else if (pageNum > 1) setLoadingMore(true);

        lastFetchRef.current = Date.now();

        try {
            await getToken();
            const response = await axios.get(`${API_URL}/messages/${chat.id}?page=${pageNum}&limit=20`);
            const newMessages = response.data;

            if (newMessages.length < 20) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            if (pageNum === 1) {
                setMessages(newMessages);
                messagesRef.current = newMessages;
            } else {
                setMessages(prev => {
                    // Filter out any messages that already exist in prev state
                    const filteredNew = newMessages.filter(
                        newMsg => !prev.some(prevMsg => String(prevMsg.id) === String(newMsg.id))
                    );
                    const updated = [...prev, ...filteredNew];
                    messagesRef.current = updated;
                    return updated;
                });
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [chat.id]);

    const loadMoreMessages = useCallback(() => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMessages(nextPage);
        }
    }, [loadingMore, hasMore, page, fetchMessages]);

    useEffect(() => {
        let currentSocket = null;

        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active') {
                // Jangan reload jika sedang merekam atau baru saja fetch (dalam 10 detik)
                const recentlyFetched = Date.now() - lastFetchRef.current < 10000;
                if (!isRecordingRef.current && !recentlyFetched) {
                    fetchMessages();
                }

                if (currentSocket) {
                    currentSocket.connect();
                    currentSocket.emit('join-chat', chat.id);
                    currentSocket.emit('mark-as-read', { chatId: chat.id });
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        const task = InteractionManager.runAfterInteractions(() => {
            fetchMessages();
            initSocket();
        });

        const initSocket = async () => {
            const token = await getToken();
            console.log('Attempting to connect to socket (Detail):', SOCKET_URL);
            const newSocket = io(SOCKET_URL, {
                transports: ['polling', 'websocket'],
                auth: { token },
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
                timeout: 30000,
                forceNew: true,
                secure: true,
                rejectUnauthorized: false
            });

            currentSocket = newSocket;
            setSocket(newSocket);

            newSocket.on('connect_error', (err) => {
                console.error('Socket Connection Error Detail:', {
                    message: err.message,
                    description: err.description,
                    context: err.context,
                    type: err.type
                });
                // Jika error autentikasi, mungkin token expired
                if (err.message.includes('Authentication error')) {
                    console.log('Auth error detected, might need to refresh token');
                }
            });

            newSocket.on('connect', () => {
                console.log('Socket connected to room:', chat.id);
                newSocket.emit('join-chat', chat.id);
                // Langsung tandai dibaca setelah join room
                newSocket.emit('mark-as-read', { chatId: chat.id });
            });

            newSocket.on('reconnect', () => {
                console.log('Socket reconnected, re-joining room:', chat.id);
                newSocket.emit('join-chat', chat.id);
                newSocket.emit('mark-as-read', { chatId: chat.id });

                const recentlyFetched = Date.now() - lastFetchRef.current < 5000;
                if (!isRecordingRef.current && !recentlyFetched) {
                    fetchMessages();
                }
            });

            newSocket.on('new-message', (newMessage) => {
                // Gunakan String() agar perbandingan ID selalu akurat (kadangkala number vs string)
                const isFromOther = String(newMessage.sender_id) === String(chat.otherUser?.id);

                if (isFromOther) {
                    newSocket.emit('message-delivered', { messageId: newMessage.id, chatId: chat.id });
                    if (navigation.isFocused()) {
                        setTimeout(() => {
                            newSocket.emit('mark-as-read', { chatId: chat.id });
                        }, 500);
                    }
                }

                setMessages((prev) => {
                    const socketMsg = { ...newMessage, sender: isFromOther ? 'them' : 'me' };

                    // 1. Cek duplikat berdasarkan ID asli
                    if (prev.some(m => String(m.id) === String(socketMsg.id))) return prev;

                    // 2. Cek apakah ini adalah upgrade dari pesan optimistik (pesan saya sendiri)
                    if (!isFromOther) {
                        const optimisticMatch = prev.find(m =>
                            (typeof m.id === 'string' && m.id.length > 10) && // Cek ID temp (Date.now())
                            m.text === socketMsg.text
                        );

                        if (optimisticMatch) {
                            // Update pesan optimistik yang sudah ada dengan ID asli dari server
                            return prev.map(m => m.id === optimisticMatch.id
                                ? { ...socketMsg, sender: 'me' }
                                : m
                            );
                        }
                    }

                    // 3. Tambahkan sebagai pesan baru
                    return [socketMsg, ...prev];
                });
            });

            newSocket.on('messages-read', ({ chatId, readerId }) => {
                if (String(chatId) === String(chat.id)) {
                    setMessages(prev => prev.map(m => (m.sender === 'me' && m.status !== 'read') ? { ...m, status: 'read' } : m));
                }
            });

            newSocket.on('message-status-updated', ({ messageId, status }) => {
                setMessages(prev => prev.map(m => String(m.id) === String(messageId) ? { ...m, status } : m));
            });

            newSocket.on('message-edited', ({ id, text }) => {
                setMessages(prev => prev.map(m => String(m.id) === String(id) ? { ...m, text, is_edited: true } : m));
            });

            newSocket.on('message-deleted', ({ id }) => {
                setMessages(prev => prev.map(m => String(m.id) === String(id) ? { ...m, text: 'Pesan ini telah dihapus', is_deleted: true } : m));
            });

            newSocket.on('user-status-changed', ({ userId, status, last_seen }) => {
                const otherParticipantId = chat.otherUser?.id;
                if (String(userId) === String(otherParticipantId)) {
                    setCurrentStatus(status);
                    if (last_seen) setLastSeen(last_seen);
                }
            });
        };

        const focusListener = navigation.addListener('focus', () => {
            if (currentSocket) {
                currentSocket.emit('mark-as-read', { chatId: chat.id });
            }
        });

        return () => {
            task.cancel();
            subscription.remove();
            focusListener();
            if (currentSocket) currentSocket.disconnect();
        };
    }, [chat.id, navigation]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
                setKeyboardPadding(e.endCoordinates.height);
            });
            const hideSub = Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardPadding(0);
            });
            const showSubGeneric = Keyboard.addListener('keyboardWillShow', () => {
                setShowEmojis(false); // Sembunyikan emoji saat keyboard muncul
            });
            return () => {
                showSub.remove();
                hideSub.remove();
                showSubGeneric.remove();
            };
        }
    }, []);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (soundObjectRef.current) {
                soundObjectRef.current.unloadAsync();
            }
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        };
    }, []);

    // Format seconds to MM:SS
    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const startMicPulse = useCallback(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(micPulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
                Animated.timing(micPulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, [micPulseAnim]);

    const stopMicPulse = useCallback(() => {
        micPulseAnim.stopAnimation();
        micPulseAnim.setValue(1);
    }, [micPulseAnim]);

    const startRecording = useCallback(async (mode = 'hold') => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Izin Ditolak', 'Harap izinkan akses mikrofon untuk mengirim pesan suara.');
                return;
            }

            // Clean up previous attempts
            if (recordingStatusRef.current !== 'none') {
                await cancelRecording();
            }

            recordingStatusRef.current = 'starting';
            setIsRecording(true);
            setRecordingMode(mode);
            setWillCancel(false);
            setRecordingDuration(0);
            startMicPulse();
            startTimeRef.current = Date.now();

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            // Jika dibatalkan saat sedang inisialisasi
            if (recordingStatusRef.current !== 'starting') {
                try { await recording.stopAndUnloadAsync(); } catch (e) { }
                return;
            }

            recordingInstanceRef.current = recording;
            recordingStatusRef.current = 'recording';

            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            recordingStatusRef.current = 'none';
            setIsRecording(false);
            setRecordingMode(null);
            setWillCancel(false);
            stopMicPulse();
        }
    }, [startMicPulse, stopMicPulse]);

    const cancelRecording = useCallback(async () => {
        const wasStatus = recordingStatusRef.current;
        recordingStatusRef.current = 'none';

        setIsRecording(false);
        setRecordingMode(null);
        setWillCancel(false);
        stopMicPulse();

        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        const recording = recordingInstanceRef.current;
        if (recording || wasStatus === 'starting') {
            try {
                if (recording) {
                    await recording.stopAndUnloadAsync();
                }
            } catch (e) { }
            recordingInstanceRef.current = null;
        }
        setRecordingDuration(0);
    }, [stopMicPulse]);

    const stopRecordingAndSend = useCallback(async () => {
        if (recordingStatusRef.current === 'none') return;

        const currentStatus = recordingStatusRef.current;
        recordingStatusRef.current = 'none';

        stopMicPulse();
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        const durationInMs = Date.now() - startTimeRef.current;
        const durationSeconds = Math.floor(durationInMs / 1000);
        setIsRecording(false);
        setRecordingMode(null);

        try {
            const recording = recordingInstanceRef.current;

            // Jika status masih starting, berarti stop dipanggil terlalu cepat
            if (currentStatus === 'starting') {
                // Biarkan startRecording yang menanganinya lewat pengecekan status
                recordingInstanceRef.current = null;
                setRecordingDuration(0);
                return;
            }

            if (!recording) return;

            // Durasi minimal 500ms
            if (durationInMs < 500) {
                try { await recording.stopAndUnloadAsync(); } catch (e) { }
                recordingInstanceRef.current = null;
                setRecordingDuration(0);
                return;
            }

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            recordingInstanceRef.current = null;
            setRecordingDuration(0);

            if (!uri) return;

            const durationLabel = formatDuration(durationSeconds || 1);
            const tempId = 'audio-' + Date.now().toString();
            const optimisticMessage = {
                id: tempId,
                text: `🎤 Pesan Suara (${durationLabel})`,
                audio_url: uri,
                type: 'audio',
                time: new Date().toISOString(),
                sender: 'me',
                reply_to: replyingTo?.id || null,
                reply_text: replyingTo?.text,
                reply_user: replyingTo?.sender === 'me' ? 'Anda' : (replyingTo?.reply_user || chat.name),
                status: 'sent'
            };
            setMessages(prev => [optimisticMessage, ...prev]);
            const replyId = replyingTo?.id;
            setReplyingTo(null);

            await getToken();
            const formData = new FormData();

            // Perbaikan untuk Web Preview / Web Platform
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('audio', blob, 'voice.m4a');
            } else {
                formData.append('audio', {
                    uri: uri,
                    type: 'audio/m4a',
                    name: 'voice.m4a',
                });
            }

            formData.append('chatId', chat.id);
            formData.append('duration', durationLabel);
            if (replyId) formData.append('replyToId', replyId);

            const response = await axios.post(`${API_URL}/messages/audio`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
            });
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, id: response.data.id, audio_url: response.data.audio_url } : m
            ));
        } catch (error) {
            console.error('Error sending audio message:', error);
            if (error.response) {
                console.error('Server response data:', error.response.data);
                console.error('Server response status:', error.response.status);
            }
            recordingInstanceRef.current = null;
        }
    }, [replyingTo, chat.id, chat.name, stopMicPulse]);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin galeri untuk mengirim foto.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled) {
                const { uri, width, height } = result.assets[0];
                setSelectedMedia({ uri, type: 'image', width, height });
                setMediaCaption('');
                setMediaPreviewVisible(true);
                setAttachmentMenuVisible(false);
            }
        } catch (error) {
            console.error('Error picking image:', error);
        }
    };

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin kamera untuk mengambil foto.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled) {
                const { uri, width, height } = result.assets[0];
                setSelectedMedia({ uri, type: 'image', width, height });
                setMediaCaption('');
                setMediaPreviewVisible(true);
                setAttachmentMenuVisible(false);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
        }
    };

    const sendImageMessage = async (uri, caption = '', width, height) => {
        const tempId = 'img-' + Date.now().toString();
        const displayLabel = caption || '📷 Foto';

        const optimisticMessage = {
            id: tempId,
            text: displayLabel,
            image_url: uri,
            type: 'image',
            width: width,
            height: height,
            time: new Date().toISOString(),
            sender: 'me',
            reply_to: replyingTo?.id || null,
            reply_text: replyingTo?.text,
            reply_user: replyingTo?.sender === 'me' ? 'Anda' : (replyingTo?.reply_user || chat.name),
            status: 'sent'
        };

        setMessages(prev => [optimisticMessage, ...prev]);
        const replyId = replyingTo?.id;
        setReplyingTo(null);
        setMessage(''); // Clear input

        try {
            await getToken();
            const formData = new FormData();

            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('image', blob, 'image.jpg');
            } else {
                formData.append('image', {
                    uri: uri,
                    type: 'image/jpeg',
                    name: 'image.jpg',
                });
            }

            formData.append('chatId', chat.id);
            if (replyId) formData.append('replyToId', replyId);
            if (caption) formData.append('text', caption);
            if (width) formData.append('width', width);
            if (height) formData.append('height', height);

            const response = await axios.post(`${API_URL}/messages/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
                }
            });

            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[tempId];
                return newProgress;
            });

            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, id: response.data.id, image_url: response.data.image_url } : m
            ));
        } catch (error) {
            console.error('Error sending image message:', error);
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[tempId];
                return newProgress;
            });
            Alert.alert('Gagal', 'Gagal mengirim gambar. Silakan coba lagi.');
        }
    };

    const pickVideo = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin galeri untuk mengirim video.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: false, // Menghilangkan batasan editing video
                quality: 0.8,
            });

            if (!result.canceled) {
                const { uri, width, height } = result.assets[0];
                setSelectedMedia({ uri, type: 'video', width, height });
                setMediaCaption('');
                setMediaPreviewVisible(true);
                setAttachmentMenuVisible(false);
            }
        } catch (error) {
            console.error('Error picking video:', error);
        }
    };

    const sendVideoMessage = async (uri, caption = '', width, height) => {
        const tempId = 'vid-' + Date.now().toString();
        const displayLabel = caption || '🎥 Video';

        const optimisticMessage = {
            id: tempId,
            text: displayLabel,
            video_url: uri,
            type: 'video',
            width: width,
            height: height,
            time: new Date().toISOString(),
            sender: 'me',
            reply_to: replyingTo?.id || null,
            reply_text: replyingTo?.text,
            reply_user: replyingTo?.sender === 'me' ? 'Anda' : (replyingTo?.reply_user || chat.name),
            status: 'sent'
        };

        setMessages(prev => [optimisticMessage, ...prev]);
        const replyId = replyingTo?.id;
        setReplyingTo(null);
        setMessage('');
        setAttachmentMenuVisible(false);

        try {
            await getToken();
            const formData = new FormData();
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('video', blob, 'video.mp4');
            } else {
                formData.append('video', { uri, type: 'video/mp4', name: 'video.mp4' });
            }
            formData.append('chatId', chat.id);
            if (replyId) formData.append('replyToId', replyId);
            if (caption) formData.append('text', caption);
            if (width) formData.append('width', width);
            if (height) formData.append('height', height);

            const response = await axios.post(`${API_URL}/messages/video`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
                }
            });

            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[tempId];
                return newProgress;
            });

            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, id: response.data.id, video_url: response.data.video_url } : m
            ));
        } catch (error) {
            console.error('Error sending video message:', error);
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[tempId];
                return newProgress;
            });
            Alert.alert('Gagal', 'Gagal mengirim video.');
        }
    };

    const pickDocument = async () => {
        try {
            Alert.alert('Segera Hadir', 'Fitur pemilihan dokumen akan segera ditambahkan.');
            setAttachmentMenuVisible(false);
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    const handleAudioPlayback = useCallback(async (messageId, audioUrl) => {
        try {
            // 1. Jika klik pada audio yang sama saat sedang loading atau main
            if (audioPlayingIdRef.current === messageId) {
                setAudioPlayingId(null);
                audioPlayingIdRef.current = null;
                sharedProgress.value = withTiming(0);

                if (soundObjectRef.current) {
                    await soundObjectRef.current.stopAsync();
                    await soundObjectRef.current.unloadAsync();
                    soundObjectRef.current = null;
                }
                return;
            }

            // 2. Berhentikan audio lain jika ada yang sedang jalan
            if (soundObjectRef.current) {
                try {
                    await soundObjectRef.current.stopAsync();
                    await soundObjectRef.current.unloadAsync();
                } catch (e) { }
                soundObjectRef.current = null;
            }

            // 3. Set loading state
            setAudioLoadingId(messageId);
            sharedProgress.value = 0;

            await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });

            const finalAudioUrl = fixUrl(audioUrl);
            const { sound } = await Audio.Sound.createAsync(
                { uri: finalAudioUrl },
                { shouldPlay: true },
                (status) => {
                    if (status.isLoaded) {
                        if (status.isPlaying) {
                            // Update progres langsung ke UI Thread
                            sharedProgress.value = status.durationMillis > 0
                                ? status.positionMillis / status.durationMillis
                                : 0;
                        }

                        if (status.didJustFinish) {
                            setAudioPlayingId(null);
                            audioPlayingIdRef.current = null;
                            sharedProgress.value = withTiming(0);
                        }
                    }
                }
            );

            // 4. Playback dimulai
            soundObjectRef.current = sound;
            setAudioLoadingId(null);
            setAudioPlayingId(messageId);
            audioPlayingIdRef.current = messageId;
        } catch (error) {
            console.error('Audio Playback Error:', error);
            setAudioLoadingId(null);
            setAudioPlayingId(null);
            audioPlayingIdRef.current = null;
        }
    }, [sharedProgress]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                // Logic onPressIn akan ditangani oleh onPress/onLongPress TouchableOpacity
            },
            onPanResponderMove: (_, gestureState) => {
                // Hanya deteksi jika mode hhold sedang aktif
                if (recordingMode === 'hold' || (isRecording && recordingMode === 'hold')) {
                    if (gestureState.dy < -80) {
                        setWillCancel(true);
                    } else {
                        setWillCancel(false);
                    }
                }
            },
            onPanResponderRelease: () => {
                // Logic akhir ditangani onPressOut/onPress
            }
        })
    ).current;

    const panResponderRef = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const threshold = -60;
                if (gestureState.dy < threshold) {
                    setWillCancel(true);
                } else {
                    setWillCancel(false);
                }
            }
        })
    ).current;

    const handleEmojiSelected = (emoji) => {
        setMessage(prev => prev + emoji);
    };

    const toggleEmojiPicker = () => {
        if (showEmojis) {
            setShowEmojis(false);
            Keyboard.dismiss();
        } else {
            Keyboard.dismiss();
            setTimeout(() => {
                setShowEmojis(true);
            }, 100);
        }
    };

    const sendMessage = useCallback(async () => {
        if (message.trim()) {
            const now = new Date().toISOString();
            const tempId = Date.now().toString();
            const textToSend = message;

            if (editingMessage) {
                // Update local state first (Optimistic)
                setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, text: textToSend, is_edited: true } : m));
                const msgId = editingMessage.id;
                setEditingMessage(null);
                setMessage('');
                try {
                    await getToken();
                    await axios.put(`${API_URL}/messages/${msgId}`, { text: textToSend });
                } catch (error) {
                    console.error('Error editing message:', error);
                }
                return;
            }

            const optimisticMessage = {
                id: tempId,
                text: textToSend,
                time: now,
                sender: 'me',
                reply_to: replyingTo?.id || null,
                reply_text: replyingTo?.text,
                reply_user: replyingTo?.sender === 'me' ? 'Anda' : replyingTo?.reply_user || chat.name,
                status: 'sent'
            };

            setMessages(prev => [optimisticMessage, ...prev]);
            const replyId = replyingTo?.id;
            setReplyingTo(null);
            setMessage('');

            try {
                await getToken();
                const response = await axios.post(`${API_URL}/messages`, {
                    chatId: chat.id,
                    text: textToSend,
                    replyToId: replyId
                });
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: response.data.id } : m));
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }, [chat.id, message, replyingTo, editingMessage, chat.name]);

    const handleLongPress = useCallback((item) => {
        setSelectedMessage(item);
        setOptionsVisible(true);
    }, []);

    const handleCopy = () => {
        if (selectedMessage) {
            Clipboard.setString(selectedMessage.text);
            setOptionsVisible(false);
        }
    };

    const handleReply = () => {
        setReplyingTo(selectedMessage);
        setEditingMessage(null);
        setOptionsVisible(false);
    };

    const handleEdit = () => {
        if (selectedMessage.sender !== 'me') return;
        // Hanya izinkan edit untuk tipe text dan image (edit caption)
        const editableTypes = [undefined, null, 'text', 'image'];
        if (!editableTypes.includes(selectedMessage.type)) return;

        setEditingMessage(selectedMessage);
        setReplyingTo(null);

        let initialText = selectedMessage.text;
        // Jika teks hanya placeholder, kosongkan input agar user bisa tulis caption baru
        if (['📷 Foto', '🎥 Video', '🎤 Pesan Suara'].includes(initialText)) {
            initialText = '';
        }

        setMessage(initialText);
        setOptionsVisible(false);
    };

    const handleDelete = async (type = 'semua') => {
        if (!selectedMessage) return;
        const msgId = selectedMessage.id;
        setOptionsVisible(false);
        try {
            await getToken();
            await axios.delete(`${API_URL}/messages/${msgId}?type=${type}`);

            if (type === 'semua') {
                // Hapus untuk semua orang (Hanya update teks)
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: 'Pesan ini telah dihapus', is_deleted: true } : m));
            } else {
                // Hapus untuk saya (Hilangkan dari list)
                setMessages(prev => prev.filter(m => m.id !== msgId));
            }
            setSelectedMessage(null);
        } catch (error) {
            console.error('Error deleting message:', error);
            Alert.alert('Gagal', 'Tidak dapat menghapus pesan.');
        }
    };

    const cancelAction = () => {
        setReplyingTo(null);
        setEditingMessage(null);
        if (editingMessage) setMessage('');
    };

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

    const handleCopyMultiple = useCallback(() => {
        const ids = Object.keys(selectedIds);
        const selectedMessages = messages.filter(m => ids.includes(String(m.id)));
        const combinedText = selectedMessages
            .reverse() // Balik karena di flatlist inverted
            .map(m => m.text)
            .join('\n');

        Clipboard.setString(combinedText);
        Alert.alert('Tersalin', `${ids.length} pesan telah disalin ke papan klip.`);
        exitSelectionMode();
    }, [selectedIds, messages, exitSelectionMode]);


    const handleDeleteSelected = async () => {
        const ids = Object.keys(selectedIds);
        if (ids.length === 0) return;

        Alert.alert(
            'Hapus Pesan',
            `Hapus ${ids.length} pesan untuk saya?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await getToken();
                            // Kirim request hapus massal (pribadi)
                            await Promise.all(ids.map(id =>
                                axios.delete(`${API_URL}/messages/${id}?type=pribadi`)
                            ));

                            setMessages(prev => prev.filter(m => !selectedIds[m.id]));
                            exitSelectionMode();
                        } catch (error) {
                            console.error('Error deleting multiple messages:', error);
                            Alert.alert('Gagal', 'Beberapa pesan gagal dihapus.');
                        }
                    }
                }
            ]
        );
    };


    const scrollToOriginalMessage = useCallback((replyToId) => {
        const currentMessages = messagesRef.current;
        const index = currentMessages.findIndex(m => m.id === replyToId);
        if (index === -1) return; // Message not in current loaded list

        // Scroll to the found index
        if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5,
            });
        }

        // Trigger highlight animation
        setHighlightedMessageId(replyToId);
        highlightAnim.setValue(0);
        Animated.sequence([
            Animated.timing(highlightAnim, {
                toValue: 0.5,
                duration: 250,
                useNativeDriver: false,
            }),
            Animated.delay(700),
            Animated.timing(highlightAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false,
            }),
        ]).start(() => {
            setHighlightedMessageId(null);
            highlightAnim.setValue(0);
        });
    }, [highlightAnim]);


    const downloadMedia = useCallback(async (url, fileName = 'download') => {
        const downloadUrl = fixUrl(url);
        try {
            // Lazy load modules to bypass top-level import errors
            let ExpoFileSystem, ExpoSharing, ExpoMediaLibrary;
            try {
                ExpoFileSystem = require('expo-file-system');
                ExpoSharing = require('expo-sharing');
                ExpoMediaLibrary = require('expo-media-library');
            } catch (e) {
                console.log('Native modules not available');
            }

            // Check if modules were successfully loaded and have the required functions
            const hasFileSystem = ExpoFileSystem && ExpoFileSystem.createDownloadResumable;
            const hasMediaLibrary = ExpoMediaLibrary && ExpoMediaLibrary.requestPermissionsAsync;
            const hasSharing = ExpoSharing && ExpoSharing.isAvailableAsync;

            if (hasFileSystem && hasMediaLibrary) {
                const { status } = await ExpoMediaLibrary.requestPermissionsAsync();
                if (status === 'granted') {
                    const actualFileName = fileName.includes('.') ? fileName : url.split('/').pop();
                    const extension = actualFileName.split('.').pop().toLowerCase();
                    const localUri = ExpoFileSystem.cacheDirectory + actualFileName;

                    const downloadResumable = ExpoFileSystem.createDownloadResumable(downloadUrl, localUri, {}, () => { });
                    Alert.alert('Mengunduh...', 'Mohon tunggu sebentar.');
                    const { uri } = await downloadResumable.downloadAsync();

                    if (['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'].includes(extension)) {
                        await ExpoMediaLibrary.saveToLibraryAsync(uri);
                        Alert.alert('Berhasil', 'Media telah disimpan ke Galeri.');
                        return;
                    } else if (hasSharing && (await ExpoSharing.isAvailableAsync())) {
                        await ExpoSharing.shareAsync(uri);
                        return;
                    }
                }
            }

            // Default fallback to browser
            await Linking.openURL(downloadUrl);
        } catch (error) {
            console.log('Bypassing download error to browser:', error.message);
            try {
                await Linking.openURL(downloadUrl);
            } catch (linkError) {
                Alert.alert('Gagal', 'Tidak dapat membuka tautan unduhan.');
            }
        }
    }, []);

    const openMediaViewer = useCallback((type, url) => {
        setViewerUrl(url);
        setViewerType(type);
        setViewerVisible(true);
    }, []);

    const renderViewerModal = () => {
        if (!viewerVisible) return null;

        return (
            <Modal
                visible={viewerVisible}
                transparent={false}
                animationType="fade"
                onRequestClose={() => setViewerVisible(false)}
            >
                <View style={styles.viewerContainer}>
                    <TouchableOpacity
                        style={styles.viewerCloseBtn}
                        onPress={() => setViewerVisible(false)}
                    >
                        <X size={30} color="#fff" />
                    </TouchableOpacity>

                    {viewerType === 'image' ? (
                        <Image
                            source={{ uri: fixUrl(viewerUrl) }}
                            style={styles.viewerImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <ExpoVideo
                            source={{ uri: fixUrl(viewerUrl) }}
                            rate={1.0}
                            volume={1.0}
                            isMuted={false}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
                            useNativeControls
                            style={styles.viewerVideo}
                        />
                    )}

                    <TouchableOpacity
                        style={styles.viewerDownloadBtn}
                        onPress={() => downloadMedia(viewerUrl, viewerUrl.split('/').pop())}
                    >
                        <Download size={30} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    };

    const handleSendPreview = () => {
        if (!selectedMedia) return;
        const { uri, type, width, height } = selectedMedia;
        if (type === 'image') {
            sendImageMessage(uri, mediaCaption, width, height);
        } else {
            sendVideoMessage(uri, mediaCaption, width, height);
        }
        setMediaPreviewVisible(false);
        setSelectedMedia(null);
        setMediaCaption('');
    };

    const renderMediaPreviewModal = () => {
        if (!mediaPreviewVisible || !selectedMedia) return null;

        return (
            <Modal
                visible={mediaPreviewVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setMediaPreviewVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.previewModalContainer}
                >
                    <View style={styles.previewHeader}>
                        <TouchableOpacity
                            style={styles.previewCloseBtn}
                            onPress={() => {
                                setMediaPreviewVisible(false);
                                setSelectedMedia(null);
                            }}
                        >
                            <ArrowLeft size={28} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.previewContent}>
                        {selectedMedia.type === 'image' ? (
                            <Image
                                source={{ uri: selectedMedia.uri }}
                                style={styles.previewMedia}
                                resizeMode="contain"
                            />
                        ) : (
                            <ExpoVideo
                                source={{ uri: selectedMedia.uri }}
                                style={styles.previewMedia}
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                                isLooping
                                useNativeControls={false}
                            />
                        )}
                    </View>

                    <View style={styles.previewFooter}>
                        <View style={styles.previewInputWrapper}>
                            <TextInput
                                style={styles.previewInput}
                                placeholder="Tambahkan pesan..."
                                placeholderTextColor="#999"
                                value={mediaCaption}
                                onChangeText={setMediaCaption}
                                multiline
                            />
                            <TouchableOpacity
                                style={styles.previewSendBtn}
                                onPress={handleSendPreview}
                            >
                                <Send size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const renderOptionsModal = () => {
        if (!optionsVisible || !selectedMessage) return null;

        const isMe = selectedMessage.sender === 'me';
        const isDeletedMsg = selectedMessage.is_deleted;

        return (
            <Modal
                visible={optionsVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setOptionsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setOptionsVisible(false)}
                >
                    <View style={styles.optionsContainer}>
                        {isDeletedMsg ? (
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => handleDelete('pribadi')}
                            >
                                <Trash2 size={22} color="#e53935" />
                                <Text style={[styles.optionText, { color: '#e53935' }]}>Hapus untuk saya</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.optionItem} onPress={handleReply}>
                                    <CornerUpRight size={22} color="#555" />
                                    <Text style={styles.optionText}>Balas</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.optionItem} onPress={handleCopy}>
                                    <Copy size={22} color="#555" />
                                    <Text style={styles.optionText}>Salin</Text>
                                </TouchableOpacity>

                                {isMe && ['text', 'image', undefined, null].includes(selectedMessage.type) && (
                                    <TouchableOpacity style={styles.optionItem} onPress={handleEdit}>
                                        <Edit2 size={22} color="#555" />
                                        <Text style={styles.optionText}>Edit</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => {
                                        Alert.alert(
                                            'Hapus Pesan?',
                                            'Pilih jenis penghapusan',
                                            [
                                                { text: 'Batal', style: 'cancel' },
                                                { text: 'Hapus untuk saya', onPress: () => handleDelete('pribadi') },
                                                isMe ? { text: 'Hapus untuk semua orang', style: 'destructive', onPress: () => handleDelete('semua') } : null
                                            ].filter(Boolean)
                                        );
                                    }}
                                >
                                    <Trash2 size={22} color="#e53935" />
                                    <Text style={[styles.optionText, { color: '#e53935' }]}>Hapus</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    const renderMessage = useCallback(({ item }) => {
        const isSelected = !!selectedIds[item.id];
        const itemProgress = uploadProgress[item.id];

        return (
            <MessageItem
                item={item}
                onLongPress={handleLongPress}
                onReplyPress={scrollToOriginalMessage}
                isHighlighted={item.id === highlightedMessageId}
                highlightAnim={highlightAnim}
                onAudioPress={handleAudioPlayback}
                isPlaying={audioPlayingId === item.id}
                isLoading={audioLoadingId === item.id}
                sharedProgress={sharedProgress}
                onMediaPress={openMediaViewer}
                itemProgress={itemProgress}
                onDownloadPress={downloadMedia}
                selectionMode={selectionMode}
                isSelected={isSelected}
                onToggleSelection={toggleSelection}
                onEnterSelection={enterSelectionMode}
            />
        );
    }, [handleLongPress, scrollToOriginalMessage, highlightedMessageId, audioPlayingId, audioLoadingId, sharedProgress, uploadProgress, selectionMode, selectedIds, openMediaViewer, downloadMedia, toggleSelection, enterSelectionMode]);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {renderViewerModal()}
            {renderMediaPreviewModal()}
            {renderOptionsModal()}

            {/* Header WhatsApp Style */}
            <View style={[styles.header, selectionMode && styles.selectionHeader]}>
                {selectionMode ? (
                    <>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity onPress={exitSelectionMode} style={styles.headerIcon}>
                                <X size={24} color="#1F2937" />
                            </TouchableOpacity>
                            <Text style={styles.selectionCount}>{Object.keys(selectedIds).length}</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.headerIcon} onPress={handleCopyMultiple}>
                                <Copy size={22} color="#1F2937" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIcon} onPress={handleDeleteSelected}>
                                <Trash2 size={22} color="#1F2937" />
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                <ArrowLeft size={24} color="#1F2937" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerProfile}>
                                <Image
                                    source={{ uri: fixUrl(chat.avatar) || 'https://ui-avatars.com/api/?name=' + (chat.name || 'User') }}
                                    style={styles.headerAvatar}
                                />
                                <View style={styles.headerInfo}>
                                    <Text style={styles.headerName} numberOfLines={1}>{chat.name}</Text>
                                    <Text style={styles.headerStatus}>
                                        {currentStatus === 'online' ? 'online' : lastSeen ? `terakhir dilihat ${dayjs(lastSeen).fromNow()}` : 'offline'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.headerIcon} onPress={() => startCall(chat.otherUser?.id, chat.name, fixUrl(chat.avatar || chat.otherUser?.avatar), 'video')}>
                                <VideoIcon size={22} color="#1F2937" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIcon} onPress={() => startCall(chat.otherUser?.id, chat.name, fixUrl(chat.avatar || chat.otherUser?.avatar), 'audio')}>
                                <Phone size={22} color="#1F2937" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIcon}>
                                <MoreVertical size={22} color="#1F2937" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Chat Area + Input (wrapped in KeyboardAvoidingView) */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.chatBackground}>
                    <ImageBackground
                        source={{ uri: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png' }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="repeat"
                    />

                    <View style={{ flex: 1 }}>
                        {loading ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color="#075e54" />
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderMessage}
                                contentContainerStyle={styles.messageList}
                                inverted={true}
                                onEndReached={loadMoreMessages}
                                onEndReachedThreshold={0.5}
                            />
                        )}
                    </View>

                    {/* Input Bar Section */}
                    {!selectionMode && (
                        <View style={[styles.inputSection, Platform.OS === 'android' && { paddingBottom: keyboardPadding > 0 ? keyboardPadding + scale(8) : scale(8) }]}>
                            {(replyingTo || editingMessage) && (
                                <View style={styles.replyBanner}>
                                    <View style={{ width: 4, backgroundColor: '#075e54', borderRadius: 2, marginRight: scale(8), alignSelf: 'stretch' }} />
                                    <View style={styles.replyBannerContent}>
                                        <Text style={styles.replyUser}>
                                            {editingMessage
                                                ? '✏️ Edit Pesan'
                                                : (replyingTo?.sender === 'me' ? 'Anda' : chat.name)
                                            }
                                        </Text>
                                        <Text style={styles.replyText} numberOfLines={1}>
                                            {replyingTo?.text || editingMessage?.text}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={cancelAction} style={{ padding: scale(5) }}>
                                        <X size={18} color="#888" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            {attachmentMenuVisible && (
                                <View style={styles.attachmentMenuContainer}>
                                    <View style={styles.attachmentRow}>
                                        <TouchableOpacity style={styles.attachmentItem} onPress={() => { pickDocument(); setAttachmentMenuVisible(false); }}>
                                            <View style={[styles.attachmentIcon, { backgroundColor: '#5F66CD' }]}>
                                                <File size={24} color="#fff" />
                                            </View>
                                            <Text style={styles.attachmentText}>Dokumen</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.attachmentItem} onPress={() => { takePhoto(); setAttachmentMenuVisible(false); }}>
                                            <View style={[styles.attachmentIcon, { backgroundColor: '#EC407A' }]}>
                                                <Camera size={24} color="#fff" />
                                            </View>
                                            <Text style={styles.attachmentText}>Kamera</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.attachmentItem} onPress={() => { pickImage(); setAttachmentMenuVisible(false); }}>
                                            <View style={[styles.attachmentIcon, { backgroundColor: '#BF59CF' }]}>
                                                <ImageIcon size={24} color="#fff" />
                                            </View>
                                            <Text style={styles.attachmentText}>Galeri</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.attachmentRow, { marginTop: verticalScale(15) }]}>
                                        <TouchableOpacity style={styles.attachmentItem} onPress={() => { setAttachmentMenuVisible(false); }}>
                                            <View style={[styles.attachmentIcon, { backgroundColor: '#F06034' }]}>
                                                <Phone size={24} color="#fff" />
                                            </View>
                                            <Text style={styles.attachmentText}>Audio</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.attachmentItem} onPress={() => { setAttachmentMenuVisible(false); }}>
                                            <View style={[styles.attachmentIcon, { backgroundColor: '#069E58' }]}>
                                                <MapPin size={24} color="#fff" />
                                            </View>
                                            <Text style={styles.attachmentText}>Lokasi</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.attachmentItem} onPress={() => { setAttachmentMenuVisible(false); }}>
                                            <View style={[styles.attachmentIcon, { backgroundColor: '#0EA5E9' }]}>
                                                <User size={24} color="#fff" />
                                            </View>
                                            <Text style={styles.attachmentText}>Kontak</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            <View style={styles.inputRow}>
                                {isRecording ? (
                                    <View style={[styles.inputMain, styles.recordingInputMain]}>
                                        <Animated.View style={{ transform: [{ scale: micPulseAnim }] }}>
                                            <Mic size={24} color="#e53935" />
                                        </Animated.View>
                                        <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
                                        <View style={styles.slideCancelWrapper}>
                                            <Text style={styles.slideCancelText}>
                                                {willCancel ? 'Lepas untuk batal' : 'Geser untuk batal ‹'}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.inputMain}>
                                        <TouchableOpacity style={styles.inputActionIcon} onPress={toggleEmojiPicker}>
                                            <Smile size={24} color="#888" />
                                        </TouchableOpacity>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Ketik pesan"
                                            placeholderTextColor="#909090"
                                            value={message}
                                            onChangeText={setMessage}
                                            multiline
                                        />
                                        <TouchableOpacity style={styles.inputActionIcon} onPress={() => setAttachmentMenuVisible(!attachmentMenuVisible)}>
                                            <Paperclip size={24} color="#888" />
                                        </TouchableOpacity>
                                        {!message.trim() && (
                                            <TouchableOpacity style={styles.inputActionIcon} onPress={takePhoto}>
                                                <Camera size={24} color="#888" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={[styles.sendBtnCircle, isRecording && { backgroundColor: '#e53935' }]}
                                    onPress={() => message.trim() ? sendMessage() : (isRecording ? stopRecordingAndSend() : startRecording())}
                                    {...(isRecording ? panResponder.panHandlers : {})}
                                >
                                    {message.trim() ? (
                                        <Send size={24} color="#fff" fill="#fff" />
                                    ) : (
                                        <Mic size={24} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {showEmojis && (
                                <View style={styles.emojiWrapper}>
                                    <FlatList
                                        data={['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']}
                                        numColumns={8}
                                        keyExtractor={(item, index) => index.toString()}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity style={styles.emojiBtn} onPress={() => handleEmojiSelected(item)}>
                                                <Text style={{ fontSize: 26 }}>{item}</Text>
                                            </TouchableOpacity>
                                        )}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#efe7de',
        height: Platform.OS === 'web' ? '100vh' : '100%',
        maxHeight: Platform.OS === 'web' ? '100vh' : '100%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(40),
        paddingBottom: verticalScale(10),
        paddingHorizontal: scale(10),
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backBtn: {
        padding: scale(5),
    },
    headerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: scale(2),
    },
    headerAvatar: {
        width: scale(38),
        height: scale(38),
        borderRadius: scale(19),
    },
    headerInfo: {
        marginLeft: scale(10),
    },
    headerName: {
        fontSize: moderateScale(16),
        fontWeight: 'bold',
        color: '#000',
    },
    headerStatus: {
        fontSize: moderateScale(12),
        color: '#666',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        padding: scale(8),
        marginLeft: scale(5),
    },
    chatBackground: {
        flex: 1,
        backgroundColor: '#efe7de',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        paddingVertical: verticalScale(10),
    },
    messageContainer: {
        marginVertical: verticalScale(2),
        maxWidth: '85%',
        paddingHorizontal: scale(12), // Pindahkan padding ke sini
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
    },
    bubble: {
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(6),
        borderRadius: scale(8),
        elevation: 1,
        minWidth: scale(60),
    },
    myBubble: {
        backgroundColor: '#d9fdd3',
        borderTopRightRadius: 0, // "Tail" effect
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 0,
    },
    messageText: {
        fontSize: moderateScale(16),
        color: '#000',
    },
    deletedBubble: {
        opacity: 0.7,
    },
    deletedText: {
        fontSize: moderateScale(15),
        color: '#8696A0',
        fontStyle: 'italic',
    },
    editedLabel: {
        fontSize: moderateScale(11),
        color: '#8696A0',
        fontStyle: 'italic',
        marginRight: scale(4),
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: verticalScale(2),
    },
    messageTime: {
        fontSize: moderateScale(10),
        color: '#888',
        marginRight: scale(4),
    },
    inputSection: {
        paddingHorizontal: scale(8),
        paddingBottom: scale(8),
        paddingTop: scale(4),
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    inputMain: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: scale(25),
        alignItems: 'center',
        paddingHorizontal: scale(10),
        minHeight: verticalScale(45),
        elevation: 2,
    },
    inputActionIcon: {
        padding: scale(8),
    },
    textInput: {
        flex: 1,
        fontSize: moderateScale(16),
        paddingVertical: verticalScale(8),
        maxHeight: verticalScale(100),
        color: '#000',
    },
    sendBtnCircle: {
        width: scale(45),
        height: scale(45),
        borderRadius: scale(22.5),
        backgroundColor: '#075e54',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: scale(8),
        elevation: 2,
    },
    replyBanner: {
        backgroundColor: '#fff',
        paddingVertical: verticalScale(8),
        paddingHorizontal: scale(10),
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        marginBottom: verticalScale(6),
        borderRadius: scale(8),
        elevation: 1,
    },
    replyBannerContent: {
        flex: 1,
    },
    replyUser: {
        fontWeight: 'bold',
        color: '#075e54',
        fontSize: moderateScale(13),
    },
    replyText: {
        color: '#666',
        fontSize: moderateScale(13),
    },
    emojiWrapper: {
        height: verticalScale(250),
        marginTop: verticalScale(10),
    },
    emojiBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: scale(5),
    },
    attachmentMenuContainer: {
        backgroundColor: '#fff',
        borderRadius: scale(20),
        padding: scale(20),
        marginBottom: verticalScale(12),
        marginHorizontal: scale(10),
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    attachmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    attachmentItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: scale(70),
    },
    attachmentIcon: {
        width: scale(52),
        height: scale(52),
        borderRadius: scale(26),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(8),
    },
    attachmentText: {
        fontSize: moderateScale(13),
        color: '#555',
    },
    // Missing Media Styles
    imageContainer: {
        borderRadius: scale(10),
        overflow: 'hidden',
        marginVertical: verticalScale(2),
        width: scale(250),
        height: scale(250),
        backgroundColor: '#f3f4f6',
    },
    messageImage: {
        width: '100%',
        height: '100%',
    },
    imageCaptionContainer: {
        paddingTop: verticalScale(6),
        paddingHorizontal: scale(4),
    },
    imageCaptionText: {
        fontSize: moderateScale(15),
        color: '#000',
    },
    audioPlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(8),
        paddingHorizontal: scale(2),
        minWidth: scale(200),
        gap: scale(12),
    },
    audioPlayBtn: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    audioPlayBtnMe: {
        backgroundColor: '#075e54',
    },
    audioPlayBtnThem: {
        backgroundColor: '#888',
    },
    audioWaveContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: verticalScale(25),
        gap: scale(3),
    },
    waveBar: {
        width: scale(3),
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: scale(1.5),
    },
    audioMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: verticalScale(2),
    },
    audioDurationText: {
        fontSize: moderateScale(11),
        color: '#666',
    },
    videoWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    playOverlay: {
        position: 'absolute',
        width: scale(40),
        height: scale(40),
        borderRadius: scale(20),
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: scale(10),
        borderRadius: scale(10),
        width: scale(200),
        gap: scale(10),
    },
    fileIconBox: {
        width: scale(35),
        height: scale(35),
        borderRadius: scale(8),
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: moderateScale(14),
        fontWeight: 'bold',
        color: '#000',
    },
    fileSize: {
        fontSize: moderateScale(11),
        color: '#666',
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadProgressText: {
        color: '#fff',
        fontSize: moderateScale(14),
        fontWeight: 'bold',
    },
    replyPreviewBubble: {
        borderRadius: scale(8),
        padding: scale(5),
        marginBottom: verticalScale(5),
        borderLeftWidth: 3,
    },
    replyPreviewMe: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderLeftColor: '#075e54',
    },
    replyPreviewThem: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderLeftColor: '#075e54',
    },
    replyPreviewUser: {
        fontSize: moderateScale(12),
        fontWeight: 'bold',
        color: '#075e54',
    },
    replyPreviewText: {
        fontSize: moderateScale(12),
        color: '#555',
    },
    messageOuterContainer: {
        width: '100%',
    },
    selectedMessageBg: {
        backgroundColor: 'rgba(52, 183, 241, 0.15)', // Warna biru khas WA saat dipilih
    },
    selectionIndicator: {
        width: scale(30),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: scale(5),
    },
    checkbox: {
        width: scale(20),
        height: scale(20),
        borderRadius: scale(10),
        borderWidth: 2,
        borderColor: '#8696A0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkboxSelected: {
        backgroundColor: '#00A884', // Warna hijau WA
        borderColor: '#00A884',
    },
    // Media Viewer Styles
    viewerContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    viewerVideo: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    viewerCloseBtn: {
        position: 'absolute',
        top: verticalScale(50),
        left: scale(20),
        padding: scale(10),
        zIndex: 10,
    },
    viewerDownloadBtn: {
        position: 'absolute',
        bottom: verticalScale(50),
        right: scale(20),
        padding: scale(10),
        zIndex: 10,
    },
    // Recording Styles
    recordingInputMain: {
        justifyContent: 'flex-start',
        gap: scale(10),
    },
    recordingTimer: {
        fontSize: moderateScale(18),
        color: '#000',
        fontWeight: '500',
        marginLeft: scale(5),
    },
    slideCancelWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slideCancelText: {
        color: '#888',
        fontSize: moderateScale(14),
    },
    // Options Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsContainer: {
        backgroundColor: '#fff',
        borderRadius: scale(12),
        width: '70%',
        paddingVertical: verticalScale(8),
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(20),
        gap: scale(15),
    },
    optionText: {
        fontSize: moderateScale(16),
        color: '#333',
    },
    // Selection Styles
    selectionHeader: {
        backgroundColor: '#fff',
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    selectionCount: {
        fontSize: moderateScale(20),
        fontWeight: '500',
        color: '#1F2937',
        marginLeft: scale(10),
    },
    // Media Preview Styles
    previewModalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20),
        paddingHorizontal: scale(15),
        zIndex: 10,
    },
    previewCloseBtn: {
        padding: scale(5),
    },
    previewHeaderText: {
        color: '#fff',
        fontSize: moderateScale(18),
        fontWeight: 'bold',
    },
    previewContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewMedia: {
        width: '100%',
        height: '100%',
    },
    previewFooter: {
        paddingHorizontal: scale(10),
        paddingBottom: Platform.OS === 'ios' ? verticalScale(30) : verticalScale(15),
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    previewInputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: scale(10),
    },
    previewInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: scale(25),
        paddingHorizontal: scale(15),
        paddingVertical: verticalScale(10),
        fontSize: moderateScale(16),
        color: '#000',
        maxHeight: verticalScale(100),
    },
    previewSendBtn: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(25),
        backgroundColor: '#075e54',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatDetailScreen;
