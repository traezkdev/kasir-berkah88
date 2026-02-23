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
    Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio, Video as ExpoVideo, ResizeMode } from 'expo-av';
import { ArrowLeft, MoreVertical, Paperclip, Smile, Mic, Send, Reply, Edit2, Trash2, X, CornerUpRight, Play, Pause, StopCircle, Check, CheckCheck, Video as VideoIcon, FileText, Download, File, Maximize2 } from 'lucide-react-native';
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

    // Attachments Menu State
    const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);

    // Message Actions States
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    // Media Viewer States
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerType, setViewerType] = useState(null); // 'image' or 'video'
    const [viewerUrl, setViewerUrl] = useState(null);

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

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin galeri untuk mengirim foto.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                // Gunakan teks di input sebagai caption jika ada
                const caption = message.trim();
                sendImageMessage(result.assets[0].uri, caption);
            }
        } catch (error) {
            console.error('Error picking image:', error);
        }
    };

    const sendImageMessage = async (uri, caption = '') => {
        const tempId = 'img-' + Date.now().toString();
        const displayLabel = caption || '📷 Foto';

        const optimisticMessage = {
            id: tempId,
            text: displayLabel,
            image_url: uri,
            type: 'image',
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

            const response = await axios.post(`${API_URL}/messages/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
            });

            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, id: response.data.id, image_url: response.data.image_url } : m
            ));
        } catch (error) {
            console.error('Error sending image message:', error);
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
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                const caption = message.trim();
                sendVideoMessage(result.assets[0].uri, caption);
            }
        } catch (error) {
            console.error('Error picking video:', error);
        }
    };

    const sendVideoMessage = async (uri, caption = '') => {
        const tempId = 'vid-' + Date.now().toString();
        const displayLabel = caption || '🎥 Video';

        const optimisticMessage = {
            id: tempId,
            text: displayLabel,
            video_url: uri,
            type: 'video',
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

            const response = await axios.post(`${API_URL}/messages/video`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, id: response.data.id, video_url: response.data.video_url } : m
            ));
        } catch (error) {
            console.error('Error sending video message:', error);
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

    const MessageItem = memo(({ item, onLongPress, onReplyPress, isHighlighted, highlightAnim, onAudioPress, audioPlayingId, audioLoadingId, sharedProgress, onMediaPress }) => {
        const isMe = item.sender === 'me';
        const displayTime = dayjs(item.created_at || item.time).format('HH:mm');
        const isDeleted = item.is_deleted ? true : false;
        const hasReply = item.reply_to && !isDeleted;
        const isAudio = (item.type === 'audio') && !isDeleted;
        const isImage = (item.type === 'image') && !isDeleted;
        const isVideo = (item.type === 'video') && !isDeleted;
        const isFile = (item.type === 'file') && !isDeleted;
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
                        ) : isImage ? (
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
                                {(item.text && item.text !== '📷 Foto') && (
                                    <View style={styles.imageCaptionContainer}>
                                        <Text style={styles.imageCaptionText}>{item.text}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ) : isVideo ? (
                            <TouchableOpacity
                                style={styles.imageContainer}
                                onPress={() => onMediaPress('video', item.video_url)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.videoPlaceholder}>
                                    <VideoIcon size={48} color="#fff" />
                                    <View style={styles.playOverlay}>
                                        <Play size={24} color="#fff" fill="#fff" />
                                    </View>
                                </View>
                                {(item.text && item.text !== '🎥 Video') && (
                                    <View style={styles.imageCaptionContainer}>
                                        <Text style={styles.imageCaptionText}>{item.text}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ) : isFile ? (
                            <TouchableOpacity
                                style={styles.fileContainer}
                                onPress={() => {/* download/open file */ }}
                                activeOpacity={0.8}
                            >
                                <View style={styles.fileIconBox}>
                                    <FileText size={24} color="#6366F1" />
                                </View>
                                <View style={styles.fileInfo}>
                                    <Text style={styles.fileName} numberOfLines={1}>{item.file_name || 'Document'}</Text>
                                    <Text style={styles.fileSize}>Buka berkas</Text>
                                </View>
                                <Download size={18} color="#888" />
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

    const openMediaViewer = (type, url) => {
        setViewerUrl(url);
        setViewerType(type);
        setViewerVisible(true);
    };

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
                </View>
            </Modal>
        );
    };

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
            onMediaPress={openMediaViewer}
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
                    <TouchableOpacity style={styles.iconButton} onPress={() => setAttachmentMenuVisible(!attachmentMenuVisible)}>
                        <Paperclip size={24} color={attachmentMenuVisible ? "#6366F1" : "#888"} />
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
            {attachmentMenuVisible && (
                <View style={styles.attachmentMenu}>
                    <TouchableOpacity style={styles.attachmentItem} onPress={pickImage}>
                        <View style={[styles.attachmentIcon, { backgroundColor: '#8B5CF6' }]}>
                            <Image style={{ width: 24, height: 24, tintColor: '#fff' }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1375/1375106.png' }} />
                        </View>
                        <Text style={styles.attachmentText}>Galeri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attachmentItem} onPress={pickVideo}>
                        <View style={[styles.attachmentIcon, { backgroundColor: '#F43F5E' }]}>
                            <VideoIcon size={22} color="#fff" />
                        </View>
                        <Text style={styles.attachmentText}>Video</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attachmentItem} onPress={pickDocument}>
                        <View style={[styles.attachmentIcon, { backgroundColor: '#0EA5E9' }]}>
                            <File size={22} color="#fff" />
                        </View>
                        <Text style={styles.attachmentText}>Dokumen</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingBottom: Platform.OS === 'android' ? keyboardPadding : 0 }]}>
            <StatusBar style="light" translucent />

            {renderViewerModal()}

            {(optionsVisible && selectedMessage) ? (
                <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => { setOptionsVisible(false); setSelectedMessage(null); }}>
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

            {attachmentMenuVisible && (
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={() => setAttachmentMenuVisible(false)}
                />
            )}

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
        paddingTop: verticalScale(50),
        paddingBottom: verticalScale(14),
        paddingHorizontal: scale(15),
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: verticalScale(4) },
        shadowOpacity: 0.3,
        shadowRadius: scale(8),
    },
    headerAvatar: {
        width: scale(42),
        height: scale(42),
        borderRadius: scale(14),
        marginLeft: scale(14),
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    headerInfo: {
        flex: 1,
        marginLeft: scale(12),
    },
    headerName: {
        fontSize: moderateScale(18),
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    headerStatus: {
        fontSize: moderateScale(12),
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        marginTop: verticalScale(1),
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
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(15),
    },
    messageContainer: {
        marginVertical: verticalScale(4),
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
    },
    bubble: {
        paddingHorizontal: scale(13),
        paddingVertical: verticalScale(9),
        borderRadius: scale(20),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(1) },
        shadowOpacity: 0.06,
        shadowRadius: scale(4),
    },
    myBubble: {
        backgroundColor: '#DCFCE7',
        borderBottomRightRadius: scale(4),
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: scale(4),
    },
    imageContainer: {
        borderRadius: scale(12),
        overflow: 'hidden',
        marginVertical: verticalScale(2),
        width: scale(220),
        height: scale(220),
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
        color: '#1F2937',
    },
    messageText: {
        fontSize: moderateScale(16),
        color: '#1F2937',
    },
    messageTime: {
        fontSize: moderateScale(11),
        color: '#888',
        alignSelf: 'flex-end',
        marginTop: verticalScale(2),
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(10),
        alignItems: 'flex-end',
        backgroundColor: 'transparent',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: scale(28),
        paddingHorizontal: scale(6),
        alignItems: 'center',
        minHeight: verticalScale(50),
    },
    input: {
        flex: 1,
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(12),
        fontSize: moderateScale(16),
        maxHeight: verticalScale(120),
        color: '#1F2937',
        fontWeight: '500',
    },
    iconButton: {
        padding: scale(10),
    },
    sendButton: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(18),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: scale(8),
    },
    sendButtonActive: {
        backgroundColor: '#6366F1',
    },
    micButtonActive: {
        backgroundColor: '#6366F1',
    },
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
        borderRadius: scale(16),
        paddingVertical: verticalScale(6),
        minWidth: scale(180),
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: scale(10),
    },
    optionsBoxMe: { alignSelf: 'flex-end', marginRight: scale(20) },
    optionsBoxThem: { alignSelf: 'flex-start', marginLeft: scale(20) },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(18),
        paddingVertical: verticalScale(13),
    },
    optionText: {
        fontSize: moderateScale(15),
        color: '#222',
        fontWeight: '500',
        marginLeft: scale(12),
    },
    dangerText: {
        color: '#e53935',
    },
    optionDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: scale(12),
    },
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(8),
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
    replyBannerText: { flex: 1, marginLeft: scale(10) },
    replyBannerTitle: {
        fontSize: moderateScale(13),
        fontWeight: 'bold',
        color: '#6366F1',
    },
    replyBannerMessage: {
        fontSize: moderateScale(13),
        color: '#555',
    },
    replyPreviewBubble: {
        borderRadius: scale(10),
        padding: scale(7),
        marginBottom: verticalScale(6),
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
        fontSize: moderateScale(12),
        fontWeight: 'bold',
        color: '#6366F1',
    },
    replyPreviewText: {
        fontSize: moderateScale(12),
        color: '#555',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: verticalScale(2),
    },
    editedLabel: {
        fontSize: moderateScale(10),
        color: '#888',
        fontStyle: 'italic',
        marginRight: scale(4),
    },
    deletedBubble: {
        opacity: 0.65,
    },
    deletedText: {
        fontStyle: 'italic',
        color: '#888',
    },
    recordingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff0f0',
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(10),
        borderTopWidth: 1,
        borderTopColor: '#ffcccc',
        gap: scale(10),
    },
    recordingPulse: {
        width: scale(12),
        height: scale(12),
        borderRadius: scale(6),
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
        fontSize: moderateScale(14),
        fontWeight: '600',
        color: '#e53935',
    },
    recordingHint: {
        fontSize: moderateScale(12),
        color: '#888',
    },
    recordingCancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(5),
        paddingHorizontal: scale(10),
        backgroundColor: '#fff',
        borderRadius: scale(15),
        borderWidth: 1,
        borderColor: '#ffcccc',
    },
    recordingCancelText: {
        fontSize: moderateScale(13),
        color: '#e53935',
        fontWeight: 'bold',
        marginLeft: scale(4),
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
        width: scale(44),
        height: scale(44),
        borderRadius: scale(22),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.1,
        shadowRadius: scale(4),
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
        height: verticalScale(30),
        gap: scale(3),
        marginBottom: verticalScale(4),
    },
    waveBar: {
        width: scale(3),
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: scale(1.5),
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
        fontSize: moderateScale(11),
        color: '#6B7280',
        fontWeight: '600',
    },
    attachmentMenu: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: verticalScale(15),
        paddingHorizontal: scale(20),
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        justifyContent: 'space-around',
    },
    attachmentItem: {
        alignItems: 'center',
        gap: verticalScale(6),
    },
    attachmentIcon: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(25),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    attachmentText: {
        fontSize: moderateScale(12),
        color: '#4B5563',
        fontWeight: '600',
    },
    videoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playOverlay: {
        position: 'absolute',
        width: scale(50),
        height: scale(50),
        borderRadius: scale(25),
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: scale(10),
        borderRadius: scale(12),
        width: scale(220),
        gap: scale(12),
    },
    fileIconBox: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(10),
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
        color: '#1F2937',
    },
    fileSize: {
        fontSize: moderateScale(11),
        color: '#6B7280',
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerCloseBtn: {
        position: 'absolute',
        top: verticalScale(50),
        right: scale(20),
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: scale(25),
        padding: scale(8),
    },
    viewerImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    viewerVideo: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width * (16 / 9),
        maxHeight: Dimensions.get('window').height,
    },
});

export default ChatDetailScreen;
