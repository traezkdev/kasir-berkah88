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
    AppState
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { ArrowLeft, MoreVertical, Paperclip, Smile, Mic, Send, Reply, Edit2, Trash2, X, CornerUpRight, Play, Pause, StopCircle, Check, CheckCheck } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_URL, SOCKET_URL, fixUrl } from '../config/api';
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

const ChatDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { chat } = route.params;
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

    // Message Actions States
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

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
            return () => {
                showSub.remove();
                hideSub.remove();
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
        if (item.is_deleted) return;
        setSelectedMessage(item);
        setOptionsVisible(true);
    }, []);

    const handleReply = () => {
        setReplyingTo(selectedMessage);
        setEditingMessage(null);
        setOptionsVisible(false);
    };

    const handleEdit = () => {
        if (selectedMessage.sender !== 'me') return;
        setEditingMessage(selectedMessage);
        setReplyingTo(null);
        setMessage(selectedMessage.text);
        setOptionsVisible(false);
    };

    const handleDelete = async () => {
        if (selectedMessage.sender !== 'me') return;
        const msgId = selectedMessage.id;
        setOptionsVisible(false);
        try {
            await getToken();
            await axios.delete(`${API_URL}/messages/${msgId}`);
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: 'Pesan ini telah dihapus', is_deleted: true } : m));
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const cancelAction = () => {
        setReplyingTo(null);
        setEditingMessage(null);
        if (editingMessage) setMessage('');
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

    // Komponen Bar Individu - Terhubung ke SharedValue (0% Re-render)
    const WaveBar = memo(({ index, isMe, isPlaying, sharedProgress }) => {
        const heights = [10, 16, 12, 20, 14, 24, 18, 12, 22, 16, 20, 14, 18, 12, 10];
        const baseHeight = heights[index % heights.length];
        const pulse = useSharedValue(1);

        useEffect(() => {
            if (isPlaying) {
                pulse.value = withRepeat(
                    withSequence(
                        withTiming(1.2, { duration: 400 + (index * 40) }),
                        withTiming(0.8, { duration: 400 + (index * 40) })
                    ),
                    -1,
                    true
                );
            } else {
                pulse.value = withSpring(1);
            }
        }, [isPlaying]);

        const animatedStyle = useAnimatedStyle(() => {
            const barPct = (index + 1) / 15;
            const isActive = sharedProgress.value >= barPct;

            return {
                height: baseHeight * (isPlaying ? pulse.value : 1),
                backgroundColor: withTiming(
                    isActive
                        ? (isMe ? '#7C3AED' : '#6366F1')
                        : 'rgba(0,0,0,0.1)',
                    { duration: 150 }
                )
            };
        });

        return <Reanimated.View style={[styles.waveBar, animatedStyle]} />;
    });

    // Komponen Waveform Premium
    const Waveform = memo(({ isMe, isPlaying, sharedProgress }) => {
        return (
            <View style={styles.waveformContainer}>
                {[...Array(15)].map((_, i) => (
                    <WaveBar key={i} index={i} isMe={isMe} isPlaying={isPlaying} sharedProgress={sharedProgress} />
                ))}
            </View>
        );
    });

    const MessageItem = memo(({ item, onLongPress, onReplyPress, isHighlighted, highlightAnim, onAudioPress, audioPlayingId, audioLoadingId, sharedProgress }) => {
        const isMe = item.sender === 'me';
        const displayTime = dayjs(item.created_at || item.time).format('HH:mm');
        const isDeleted = item.is_deleted ? true : false;
        const hasReply = item.reply_to && !isDeleted;
        const isAudio = (item.type === 'audio') && !isDeleted;
        const isPlaying = audioPlayingId === item.id;
        const isLoading = audioLoadingId === item.id;

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
            <View
                style={[
                    styles.messageContainer,
                    isMe ? styles.myMessageContainer : styles.theirMessageContainer,
                ]}
            >
                <TouchableOpacity
                    onLongPress={() => onLongPress(item)}
                    delayLongPress={300}
                    activeOpacity={0.85}
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
                        ) : (
                            <Text style={[styles.messageText, isDeleted ? styles.deletedText : null]}>
                                {isDeleted ? 'Pesan ini telah dihapus' : item.text}
                            </Text>
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
        );
    });

    const renderMessage = useCallback(({ item }) => (
        <MessageItem
            item={item}
            onLongPress={handleLongPress}
            onReplyPress={scrollToOriginalMessage}
            isHighlighted={item.id === highlightedMessageId}
            highlightAnim={highlightAnim}
            onAudioPress={handleAudioPlayback}
            audioPlayingId={audioPlayingId}
            audioLoadingId={audioLoadingId}
            sharedProgress={sharedProgress}
        />
    ), [handleLongPress, scrollToOriginalMessage, highlightedMessageId, audioPlayingId, audioLoadingId, sharedProgress]);

    const renderChatArea = () => (
        <View style={styles.chatBackground}>
            <ImageBackground
                source={{ uri: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png' }}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#0088cc" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.messageList}
                        showsVerticalScrollIndicator={true}
                        inverted={true}
                        removeClippedSubviews={true}
                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        onEndReached={loadMoreMessages}
                        onEndReachedThreshold={0.5}
                        onScrollToIndexFailed={(info) => {
                            if (flatListRef.current) {
                                flatListRef.current.scrollToOffset({
                                    offset: info.averageItemLength * info.index,
                                    animated: true,
                                });
                            }
                        }}
                        ListFooterComponent={loadingMore ? (
                            <ActivityIndicator size="small" color="#0088cc" style={{ marginVertical: 10 }} />
                        ) : null}
                    />
                )}
            </View>
        </View>
    );

    const renderInputBar = () => (
        <View>
            {isRecording ? (
                <View style={[styles.recordingBanner, willCancel && styles.recordingBannerCancel]}>
                    <Animated.View style={[
                        styles.recordingPulse,
                        { transform: [{ scale: micPulseAnim }] },
                        willCancel && { backgroundColor: '#e53935' }
                    ]} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.recordingText, willCancel && { color: '#e53935' }]}>
                            🎤 {willCancel ? 'Lepas untuk batal' : (recordingMode === 'hold' ? 'Geser ke atas untuk batal' : 'Merekam')}... {formatDuration(recordingDuration)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={cancelRecording} style={styles.recordingCancelBtn}>
                        <X size={16} color="#e53935" />
                        <Text style={styles.recordingCancelText}>Batal</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
            {(replyingTo || editingMessage) ? (
                <View style={styles.replyBanner}>
                    <View style={styles.replyBannerLeft}>
                        {editingMessage ? (
                            <Edit2 size={16} color="#0088cc" />
                        ) : (
                            <CornerUpRight size={16} color="#0088cc" />
                        )}
                        <View style={styles.replyBannerText}>
                            <Text style={styles.replyBannerTitle}>
                                {editingMessage ? 'Edit Pesan' : ('Balas ' + (replyingTo && replyingTo.sender === 'me' ? 'Anda' : chat.name))}
                            </Text>
                            <Text style={styles.replyBannerMessage} numberOfLines={1}>
                                {editingMessage ? editingMessage.text : (replyingTo ? replyingTo.text : '')}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={cancelAction}>
                        <X size={20} color="#888" />
                    </TouchableOpacity>
                </View>
            ) : null}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Smile size={24} color="#888" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder={editingMessage ? 'Edit pesan...' : 'Message'}
                        placeholderTextColor="#999"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <TouchableOpacity style={styles.iconButton}>
                        <Paperclip size={24} color="#888" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    {...panResponderRef.panHandlers}
                    style={[styles.sendButton, message.trim() ? styles.sendButtonActive : (willCancel ? styles.recordingCancelBtnRaw : styles.micButtonActive)]}
                    onPress={() => {
                        if (message.trim()) {
                            sendMessage();
                        } else {
                            if (!isRecording) {
                                startRecording('toggle');
                            } else if (recordingMode === 'toggle') {
                                stopRecordingAndSend();
                            }
                        }
                    }}
                    onLongPress={() => {
                        if (!message.trim() && !isRecording) {
                            startRecording('hold');
                        }
                    }}
                    onPressOut={() => {
                        if (isRecording && recordingMode === 'hold') {
                            if (willCancel) {
                                cancelRecording();
                            } else {
                                stopRecordingAndSend();
                            }
                        }
                    }}
                    delayLongPress={300}
                >
                    {(message.trim() || isRecording) ? (
                        <Send size={22} color={willCancel ? "#ff4d4f" : "#fff"} />
                    ) : (
                        <Animated.View style={{ transform: [{ scale: micPulseAnim }] }}>
                            <Mic size={22} color="#fff" />
                        </Animated.View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingBottom: Platform.OS === 'android' ? keyboardPadding : 0 }]}>
            <StatusBar style="light" translucent />

            {(optionsVisible && selectedMessage) ? (
                <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => setOptionsVisible(false)}>
                    <View style={[styles.optionsBox, selectedMessage.sender === 'me' ? styles.optionsBoxMe : styles.optionsBoxThem]}>
                        <TouchableOpacity style={styles.optionItem} onPress={handleReply}>
                            <Reply size={18} color="#6366F1" />
                            <Text style={styles.optionText}>Balas</Text>
                        </TouchableOpacity>
                        {selectedMessage.sender === 'me' ? (
                            <View>
                                <View style={styles.optionDivider} />
                                <TouchableOpacity style={styles.optionItem} onPress={handleEdit}>
                                    <Edit2 size={18} color="#555" />
                                    <Text style={styles.optionText}>Edit</Text>
                                </TouchableOpacity>
                                <View style={styles.optionDivider} />
                                <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
                                    <Trash2 size={18} color="#e53935" />
                                    <Text style={[styles.optionText, styles.dangerText]}>Hapus</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                </TouchableOpacity>
            ) : null}

            <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Image source={{ uri: fixUrl(chat.avatar) || 'https://ui-avatars.com/api/?name=' + (chat.name || 'User') }} style={styles.headerAvatar} />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{chat.name}</Text>
                    <Text style={styles.headerStatus}>
                        {currentStatus === 'online'
                            ? 'Online'
                            : lastSeen
                                ? `terakhir dilihat ${dayjs(lastSeen).fromNow()}`
                                : 'offline'}
                    </Text>
                </View>
                <TouchableOpacity>
                    <MoreVertical size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={{ flex: 1 }}>
                {renderChatArea()}
            </View>

            {
                Platform.OS === 'web' ? (
                    renderInputBar()
                ) : (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                    >
                        {renderInputBar()}
                    </KeyboardAvoidingView>
                )
            }
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        height: Platform.OS === 'web' ? '100vh' : '100%',
        maxHeight: Platform.OS === 'web' ? '100vh' : '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 14,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 14,
        marginLeft: 14,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    headerStatus: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        marginTop: 1,
    },
    chatBackground: {
        flex: 1,
        backgroundColor: '#EEF0F5',
        overflow: 'hidden',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    messageContainer: {
        marginVertical: 4,
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
    },
    bubble: {
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    myBubble: {
        backgroundColor: '#DCFCE7',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        color: '#1F2937',
    },
    messageTime: {
        fontSize: 11,
        color: '#888',
        alignSelf: 'flex-end',
        marginTop: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 10,
        alignItems: 'flex-end',
        backgroundColor: 'transparent',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 28,
        paddingHorizontal: 6,
        alignItems: 'center',
        minHeight: 50,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        maxHeight: 120,
        color: '#1F2937',
        fontWeight: '500',
    },
    iconButton: {
        padding: 10,
    },
    sendButton: {
        width: 50,
        height: 50,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonActive: {
        backgroundColor: '#6366F1',
    },
    micButtonActive: {
        backgroundColor: '#6366F1',
    },
    // Message Options
    optionsOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 6,
        minWidth: 180,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    optionsBoxMe: { alignSelf: 'flex-end', marginRight: 20 },
    optionsBoxThem: { alignSelf: 'flex-start', marginLeft: 20 },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 13,
    },
    optionText: {
        fontSize: 15,
        color: '#222',
        fontWeight: '500',
        marginLeft: 12,
    },
    dangerText: {
        color: '#e53935',
    },
    optionDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 12,
    },
    // Reply
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderLeftWidth: 4,
        borderLeftColor: '#6366F1',
    },
    replyBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    replyBannerText: { flex: 1, marginLeft: 10 },
    replyBannerTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    replyBannerMessage: {
        fontSize: 13,
        color: '#555',
    },
    replyPreviewBubble: {
        borderRadius: 10,
        padding: 7,
        marginBottom: 6,
        borderLeftWidth: 3,
    },
    replyPreviewMe: {
        backgroundColor: 'rgba(99,102,241,0.1)',
        borderLeftColor: '#8B5CF6',
    },
    replyPreviewThem: {
        backgroundColor: 'rgba(99,102,241,0.1)',
        borderLeftColor: '#6366F1',
    },
    replyPreviewUser: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    replyPreviewText: {
        fontSize: 12,
        color: '#555',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 2,
    },
    editedLabel: {
        fontSize: 10,
        color: '#888',
        fontStyle: 'italic',
        marginRight: 4,
    },
    deletedBubble: {
        opacity: 0.65,
    },
    deletedText: {
        fontStyle: 'italic',
        color: '#888',
    },
    // Recording Indicator
    recordingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff0f0',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#ffcccc',
        gap: 10,
    },
    recordingPulse: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#e53935',
    },
    recordingBannerCancel: {
        backgroundColor: '#fff1f0',
        borderColor: '#ffa39e',
        borderTopWidth: 1,
    },
    recordingCancelBtnRaw: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ff4d4f',
    },
    recordingText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#e53935',
    },
    recordingHint: {
        fontSize: 12,
        color: '#888',
    },
    recordingCancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ffcccc',
    },
    recordingCancelText: {
        fontSize: 13,
        color: '#e53935',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    // Audio Player
    audioPlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 2,
        minWidth: 200,
        gap: 12,
    },
    audioPlayBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    audioPlayBtnMe: {
        backgroundColor: '#7C3AED',
    },
    audioPlayBtnThem: {
        backgroundColor: '#6366F1',
    },
    audioWaveContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        gap: 3,
        marginBottom: 4,
    },
    waveBar: {
        width: 3,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 1.5,
    },
    waveBarActiveMe: {
        backgroundColor: '#7C3AED',
    },
    waveBarActiveThem: {
        backgroundColor: '#6366F1',
    },
    audioMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    audioDurationText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
});

export default ChatDetailScreen;
