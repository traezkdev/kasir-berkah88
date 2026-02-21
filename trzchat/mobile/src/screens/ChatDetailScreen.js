import React, { useState, useEffect, useRef } from 'react';
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
    Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, MoreVertical, Paperclip, Smile, Mic, Send } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_URL, SOCKET_URL } from '../config/api';
import dayjs from 'dayjs';
import io from 'socket.io-client';

import { getToken } from '../utils/auth';

const ChatDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { chat } = route.params;
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [keyboardPadding, setKeyboardPadding] = useState(0);
    const flatListRef = useRef(null);

    const fetchMessages = async () => {
        try {
            await getToken();
            const response = await axios.get(`${API_URL}/messages/${chat.id}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join-chat', chat.id);
        });

        newSocket.on('new-message', (newMessage) => {
            setMessages((prev) => {
                if (prev.find(m => m.id === newMessage.id)) return prev;
                const isMyDuplicate = prev.find(m =>
                    m.sender === 'me' &&
                    m.text === newMessage.text &&
                    (typeof m.id === 'string' && m.id.length > 10)
                );
                if (isMyDuplicate) {
                    return prev.map(m => m === isMyDuplicate ? { ...m, id: newMessage.id, created_at: newMessage.created_at } : m);
                }
                return [newMessage, ...prev];
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, [chat.id]);

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

    const sendMessage = async () => {
        if (message.trim()) {
            const tempId = Date.now().toString();
            const now = new Date().toISOString();
            const optimisticMessage = {
                id: tempId,
                text: message,
                time: now,
                sender: 'me'
            };
            setMessages([optimisticMessage, ...messages]);
            const textToSend = message;
            setMessage('');
            try {
                await getToken();
                const response = await axios.post(`${API_URL}/messages`, {
                    chatId: chat.id,
                    text: textToSend
                });
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: response.data.id } : m));
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const renderMessage = ({ item }) => {
        const isMe = item.sender === 'me';
        const displayTime = dayjs(item.created_at || item.time).format('HH:mm');
        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={styles.messageText}>{item.text}</Text>
                    <Text style={styles.messageTime}>{displayTime}</Text>
                </View>
            </View>
        );
    };

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
                    />
                )}
            </View>
        </View>
    );

    const renderInputBar = () => (
        <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
                <TouchableOpacity style={styles.iconButton}>
                    <Smile size={24} color="#888" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Message"
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
                style={[styles.sendButton, message.trim() ? styles.sendButtonActive : styles.micButtonActive]}
                onPress={message.trim() ? sendMessage : null}
            >
                {message.trim() ? (
                    <Send size={22} color="#fff" />
                ) : (
                    <Mic size={22} color="#fff" />
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { paddingBottom: Platform.OS === 'android' ? keyboardPadding : 0 }]}>
            <StatusBar style="light" backgroundColor="#0088cc" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Image source={{ uri: chat.avatar }} style={styles.headerAvatar} />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{chat.name}</Text>
                    <Text style={styles.headerStatus}>{chat.online ? 'Online' : 'last seen recently'}</Text>
                </View>
                <TouchableOpacity>
                    <MoreVertical size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                {renderChatArea()}
            </View>

            {Platform.OS === 'web' ? (
                renderInputBar()
            ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    {renderInputBar()}
                </KeyboardAvoidingView>
            )}
        </View>
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
        backgroundColor: '#0088cc',
        paddingTop: 45,
        paddingBottom: 10,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 15,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 15,
    },
    headerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerStatus: {
        fontSize: 13,
        color: '#e0e0e0',
    },
    chatBackground: {
        flex: 1,
        backgroundColor: '#e5ddd5',
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        elevation: 1,
    },
    myBubble: {
        backgroundColor: '#E1FEC6',
        borderBottomRightRadius: 2,
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontSize: 16,
        color: '#000',
    },
    messageTime: {
        fontSize: 11,
        color: '#888',
        alignSelf: 'flex-end',
        marginTop: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 10,
        alignItems: 'flex-end',
        backgroundColor: 'transparent',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 5,
        alignItems: 'center',
        minHeight: 45,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        maxHeight: 120,
        color: '#000',
    },
    iconButton: {
        padding: 10,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonActive: {
        backgroundColor: '#0088cc',
    },
    micButtonActive: {
        backgroundColor: '#0088cc',
    },
});

export default ChatDetailScreen;
