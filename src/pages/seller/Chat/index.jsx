import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMessageCircle, FiSend, FiUser, FiCheck, FiClock,
    FiSearch, FiArrowLeft, FiMoreVertical, FiShoppingBag, FiX
} from 'react-icons/fi';
import { useChat } from '../../../contexts/ChatContext';
import authFetch from '../../../utils/authFetch';
import OrderPinWidget from '../../../components/ui/OrderPinWidget';
import { useNavigate } from 'react-router-dom';

const SellerChatPage = () => {
    const navigate = useNavigate();
    const {
        unreadCount,
        conversations,
        fetchConversations,
        activeChat,
        setActiveChat,
        markAsRead
    } = useChat();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const messagesEndRef = useRef(null);
    const scrollRef = useRef(null);
    const userRole = localStorage.getItem('role');
    const myId = parseInt(localStorage.getItem('userId'));

    // Dynamic Theme Color based on Role
    const getThemeColor = () => {
        if (userRole === 'pelanggan') return '#0D9C59'; // Customer Green
        if (userRole === 'penjual' || userRole === 'admin') return '#3E59E9';   // Seller/Admin Blue
        return '#128EEA'; // Default Blue
    };
    const themeColor = getThemeColor();

    const scrollToBottom = (force = false, smooth = true) => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

        if (force || isNearBottom) {
            if (smooth) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            } else {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Instant jump when switching active chat
    useEffect(() => {
        if (activeChat) {
            setTimeout(() => {
                scrollToBottom(true, false);
            }, 50);
        }
    }, [activeChat]);

    useEffect(() => {
        if (activeChat) {
            fetchMessages();
            fetchActiveOrder();
            markAsRead(activeChat.user_id);
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [activeChat]);

    const fetchMessages = async () => {
        if (!activeChat) return;
        try {
            const res = await authFetch(`/api/messages/history/${activeChat.user_id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.data);

                const hasUnread = data.data.some(m => m.sender_id === activeChat.user_id && m.is_read === 0);
                if (hasUnread) {
                    markAsRead(activeChat.user_id);
                }
            }
        } catch (e) {
            console.error("Error fetching messages:", e);
        }
    };

    const fetchActiveOrder = async () => {
        if (!activeChat) return;
        try {
            const res = await authFetch(`/api/messages/active-order/${activeChat.user_id}`);
            if (res.ok) {
                const data = await res.json();
                setActiveOrder(data.data);
            }
        } catch (e) {
            console.error("Error fetching active order:", e);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || isLoading) return;

        setIsLoading(true);
        try {
            const res = await authFetch('/api/messages', {
                method: 'POST',
                body: {
                    receiver_id: activeChat.user_id,
                    message: newMessage,
                    order_id: activeOrder?.id
                }
            });

            if (res.ok) {
                setNewMessage('');
                await fetchMessages();
                fetchConversations();
                setTimeout(() => scrollToBottom(true), 100);
            }
        } catch (e) {
            console.error("Error sending message:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 dark:bg-gray-950 font-sans overflow-hidden">
            {/* Global Chat Header */}
            <header className="h-16 flex-shrink-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-6 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl text-white shadow-lg shadow-blue-500/20" style={{ backgroundColor: themeColor }}>
                        <FiMessageCircle size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white leading-none">Pusat Pesan</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: themeColor }}>Layanan Pelanggan</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/seller/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-all rounded-xl font-bold text-xs"
                >
                    <FiX size={16} />
                    <span>Keluar Chat</span>
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar: Chat List */}
                <div className={`w-full md:w-80 lg:w-96 flex-col border-r bg-white dark:bg-gray-900 dark:border-gray-800 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate('/seller/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                    <FiArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Obrolan</h1>
                            </div>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{unreadCount} Baru</span>
                            )}
                        </div>

                        <div className="relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:transition-colors" style={{ color: 'var(--search-icon-color)' }} />
                            <input
                                type="text"
                                placeholder="Cari pelanggan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 transition-all dark:text-white"
                                style={{ '--tw-ring-color': `${themeColor}33` }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-6">
                        {filteredConversations.length > 0 ? (
                            <div className="space-y-2">
                                {filteredConversations.map((contact) => (
                                    <div
                                        key={contact.user_id}
                                        onClick={() => setActiveChat(contact)}
                                        className={`flex cursor-pointer items-center gap-4 rounded-[1.5rem] p-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${activeChat?.user_id === contact.user_id ? 'ring-1' : ''}`}
                                        style={activeChat?.user_id === contact.user_id ? {
                                            backgroundColor: `${themeColor}1a`,
                                            borderColor: `${themeColor}4d`
                                        } : {}}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-400">
                                                {contact.avatar_url ? (
                                                    <img src={contact.avatar_url} className="h-full w-full rounded-2xl object-cover" />
                                                ) : <FiUser size={28} />}
                                            </div>
                                            {contact.unread_count > 0 && (
                                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                                    {contact.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h5 className="truncate text-sm font-black text-gray-900 dark:text-gray-100">{contact.username}</h5>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                    {contact.last_message_time ? new Date(contact.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <p className={`truncate text-xs ${contact.unread_count > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400 font-medium'}`}>
                                                {contact.last_message || "Mulai percakapan..."}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                                <FiMessageCircle size={48} className="text-gray-300 mb-4" />
                                <p className="text-sm font-bold text-gray-400">Belum ada obrolan</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chat Content */}
                <div className={`flex-1 flex flex-col bg-white dark:bg-gray-900 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            {/* Header */}
                            <header className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setActiveChat(null)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                        <FiArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-400">
                                        {activeChat.avatar_url ? (
                                            <img src={activeChat.avatar_url} className="h-full w-full rounded-2xl object-cover" />
                                        ) : <FiUser size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{activeChat.username}</h4>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                    <FiMoreVertical size={20} className="text-gray-400" />
                                </button>
                            </header>

                            {/* Messages Area */}
                            <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 no-scrollbar bg-gray-50/30 dark:bg-gray-950/20">
                                <div className="max-w-4xl mx-auto flex flex-col min-h-full">
                                    <div className="mb-4 sticky top-0 z-[5]">
                                        <OrderPinWidget order={activeOrder} />
                                    </div>

                                    <div className="flex-1 flex flex-col space-y-6">
                                        {messages.map((msg, idx) => {
                                            const isMine = msg.sender_id === myId;
                                            const showName = !isMine && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);

                                            return (
                                                <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                    {showName && (
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                                            {activeChat.username}
                                                        </span>
                                                    )}
                                                    <div className={`max-w-[80%] md:max-w-[70%] space-y-1`}>
                                                        <div className={`rounded-3xl px-5 py-3 text-sm shadow-sm transition-all duration-300 ${isMine
                                                            ? 'text-white rounded-tr-none'
                                                            : 'bg-white text-gray-800 rounded-tl-none dark:bg-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700'
                                                            }`}
                                                            style={isMine ? { backgroundColor: themeColor } : {}}
                                                        >
                                                            {msg.message}
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            <FiClock size={10} />
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {isMine && (
                                                                <div className="flex -space-x-1.5 items-center">
                                                                    <FiCheck size={11} style={{ color: msg.is_read ? themeColor : '#D1D5DB' }} />
                                                                    <FiCheck size={11} style={{ color: msg.is_read ? themeColor : '#D1D5DB' }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>
                            </main>

                            {/* Input Area */}
                            <div className="p-6 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
                                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Ketik balasan Anda di sini..."
                                        className="flex-1 rounded-[1.5rem] bg-gray-50 border-none px-6 py-4 text-sm focus:ring-2 dark:bg-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all font-medium"
                                        style={{ '--tw-ring-color': `${themeColor}33` }}
                                    />
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={!newMessage.trim() || isLoading}
                                        className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] text-white shadow-xl active:opacity-90 disabled:opacity-50 transition-all"
                                        style={{ backgroundColor: themeColor, boxShadow: `0 10px 25px -5px ${themeColor}4d` }}
                                    >
                                        <FiSend size={22} />
                                    </motion.button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/30 dark:bg-gray-950/20">
                            <div className="h-32 w-32 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 border border-white dark:border-gray-700" style={{ boxShadow: `0 25px 50px -12px ${themeColor}1a` }}>
                                <FiMessageCircle size={56} style={{ color: themeColor }} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-3">Pusat Pesan Penjual</h2>
                            <p className="max-w-xs mx-auto text-gray-400 font-medium text-sm leading-relaxed mb-8">Pilih pelanggan di sidebar untuk melihat riwayat obrolan dan merespon pesan mereka.</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                <div className="px-4 py-2 rounded-full flex items-center gap-2 border" style={{ backgroundColor: `${themeColor}1a`, borderColor: `${themeColor}33` }}>
                                    <FiShoppingBag style={{ color: themeColor }} size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: themeColor }}>Konteks Pesanan</span>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/10 px-4 py-2 rounded-full flex items-center gap-2 border border-green-100 dark:border-green-900/30">
                                    <FiCheck className="text-green-500" size={14} />
                                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Real-time update</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerChatPage;
