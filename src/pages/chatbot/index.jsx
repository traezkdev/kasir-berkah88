import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import useNotification from '../../hooks/useNotification';

const chatbotApiUrl = import.meta.env.VITE_CHATBOT_API_URL;

const ChatbotPage = ({ headerTitle, isModal = false }) => {
    const { theme } = useTheme();
    const { showError } = useNotification();
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load chat history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('chatbot_history');
        if (savedHistory) {
            try {
                setMessages(JSON.parse(savedHistory));
            } catch (error) {
                console.error('Failed to load chat history:', error);
            }
        }
    }, []);

    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chatbot_history', JSON.stringify(messages));
        }
    }, [messages]);

    // Auto-scroll to bottom when new message arrives
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage.trim(),
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setIsTyping(true);

        try {
            const response = await fetch(`${chatbotApiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage.text })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chatbot');
            }

            const data = await response.json();

            const botMessage = {
                id: Date.now() + 1,
                text: data.reply || 'Maaf, saya tidak bisa memproses permintaan Anda.',
                sender: 'bot',
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            showError('Gagal mengirim pesan. Pastikan server chatbot sedang berjalan.');

            const errorMessage = {
                id: Date.now() + 1,
                text: `Maaf, terjadi kesalahan. Pastikan server chatbot sedang berjalan di ${chatbotApiUrl || ''}`,
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearConversation = () => {
        if (window.confirm('Apakah Anda yakin ingin menghapus semua percakapan?')) {
            setMessages([]);
            localStorage.removeItem('chatbot_history');
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const breadcrumbPath = [
        { label: 'Dashboard', path: '/main-dashboard', isActive: false },
        { label: 'AI Assistant', path: '/chatbot', isActive: true }
    ];

    return (
        <div className={isModal ? "" : "min-h-screen flex flex-col"}>
            {!isModal && theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />}

            <main className={`flex-1 flex flex-col ${!isModal ? `${theme === 'default' ? 'pt-16' : ''} pb-4` : ""}`}>
                <div className={!isModal && theme === 'default' ? "max-w-7xl w-full mx-auto px-4 lg:px-6 py-6 flex flex-col flex-1" : "flex flex-col flex-1"}>

                    {!isModal && (
                        <div className="mb-6">
                            <div className="hidden md:block">
                                <BreadcrumbNavigation customPath={breadcrumbPath} />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-semibold text-text-primary">
                                        {headerTitle}
                                    </h1>
                                    <p className="text-text-secondary mt-1">
                                        Chat dengan BerkahBot untuk bantuan dan informasi
                                    </p>
                                </div>
                                {messages.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearConversation}
                                        iconName="Trash2"
                                        iconPosition="left"
                                    >
                                        Clear Chat
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chat Container */}
                    <div className="flex-1 flex flex-col bg-card rounded-lg shadow-sm border border-border overflow-hidden max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-280px)] min-h-[400px]">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <Icon name="MessageCircle" size={64} className="text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                                        Belum ada percakapan
                                    </h3>
                                    <p className="text-text-secondary max-w-md">
                                        Mulai chat dengan BerkahBot untuk mendapatkan informasi tentang bisnis, stok, keuangan, dan lainnya!
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 ${message.sender === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-foreground'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {message.text}
                                                </p>
                                                <p className={`text-xs mt-1 ${message.sender === 'user'
                                                    ? 'text-primary-foreground/70'
                                                    : 'text-muted-foreground'
                                                    }`}>
                                                    {formatTime(message.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-muted text-foreground rounded-2xl px-4 py-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">BerkahBot sedang mengetik...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-border bg-background p-4">
                            <div className="flex items-end space-x-2">
                                <textarea
                                    ref={textareaRef}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ketik pesan Anda... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                                    className="flex-1 resize-none rounded-lg border border-border bg-input px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] max-h-32"
                                    rows={1}
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || isLoading}
                                    iconName="Send"
                                    size="default"
                                    className="h-11"
                                >
                                    Kirim
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                💡 Tips: Tanyakan tentang stok, penjualan, keuangan, atau informasi lainnya!
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChatbotPage;
