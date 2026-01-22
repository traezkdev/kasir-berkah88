import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMessageCircle, FiX, FiSend, FiChevronLeft,
    FiUser, FiCheck, FiClock, FiMoreVertical, FiArrowLeft
} from 'react-icons/fi';
import { useChat } from '../../contexts/ChatContext';
import authFetch from '../../utils/authFetch';
import OrderPinWidget from './OrderPinWidget';

const ChatWidget = () => {
    const {
        unreadCount,
        activeChat,
        setActiveChat,
        markAsRead,
        conversations,
        fetchConversations
    } = useChat();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otherUsers, setOtherUsers] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [view, setView] = useState('list'); // 'list' or 'chat'

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
    const shadowColor = userRole === 'pelanggan' ? 'shadow-green-500/30' : 'shadow-blue-500/30';

    const scrollToBottom = (force = false, smooth = true) => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

        if (force || isNearBottom) {
            if (smooth) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            } else {
                // Instant jump
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    };

    // Auto scroll when messages change
    useEffect(() => {
        if (view === 'chat' && isOpen) {
            scrollToBottom();
        }
    }, [messages]);

    // Force scroll to bottom when widget opens or view changes to chat
    useEffect(() => {
        if (isOpen && view === 'chat') {
            // Instant jump on open
            setTimeout(() => {
                scrollToBottom(true, false);
            }, 50);
        }
    }, [isOpen, view]);

    // Auto-open chat for pelanggan
    useEffect(() => {
        if (isOpen && userRole === 'pelanggan') {
            if (conversations.length > 0) {
                // If there's already a conversation, use it
                if (!activeChat) {
                    setActiveChat(conversations[0]);
                }
                setView('chat');
            } else {
                // If no conversation, find a contact to start one
                fetchContacts().then(contacts => {
                    if (contacts && contacts.length > 0) {
                        // Priority: admin > owner > penjual
                        const admin = contacts.find(u => u.role === 'admin') ||
                            contacts.find(u => u.role === 'owner') ||
                            contacts[0];
                        setActiveChat({ user_id: admin.id, ...admin });
                        setView('chat');
                    }
                });
            }
        }
    }, [isOpen, conversations]);

    // Fetch messages when activeChat changes or isOpen changes
    useEffect(() => {
        if (activeChat && isOpen) {
            setView('chat');
            fetchMessages();
            fetchActiveOrder();
            markAsRead(activeChat.user_id);
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [activeChat, isOpen]);

    // Fetch contacts for new chat (if customer)
    useEffect(() => {
        if (isOpen && view === 'list' && userRole === 'pelanggan') {
            fetchContacts();
        }
    }, [isOpen, view]);

    const fetchContacts = async () => {
        try {
            const res = await authFetch('/api/messages/contacts');
            if (res.ok) {
                const data = await res.json();
                setOtherUsers(data.data);
                return data.data;
            }
        } catch (e) {
            console.error("Error fetching contacts:", e);
        }
    };

    const fetchMessages = async () => {
        if (!activeChat) return;
        try {
            const res = await authFetch(`/api/messages/history/${activeChat.user_id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.data);

                // Jika ada pesan baru dari lawan bicara, tandai sudah dibaca secara otomatis
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
        // If I am a seller, I want to see the other user's (customer) active order
        // If I am a customer, I want to see my active order
        const targetId = userRole === 'pelanggan' ? myId : activeChat.user_id;
        try {
            const res = await authFetch(`/api/messages/active-order/${targetId}`);
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

    const openChat = (user) => {
        setActiveChat(user);
        setView('chat');
    };

    const closeWidget = () => {
        setIsOpen(false);
        if (userRole === 'pelanggan') {
            // reset to list if needed or keep it
        }
    };

    const goBack = () => {
        setActiveChat(null);
        setView('list');
    };

    // If customer and no conversations, the list view should show "Contacts" (Sellers)
    const displayList = (userRole === 'pelanggan' && conversations.length === 0) ? otherUsers : conversations;

    return (
        <div className="fixed bottom-24 right-6 z-[9999] font-sans">
            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all ${isOpen ? 'bg-gray-100 text-gray-800' : 'text-white'}`}
                style={{ backgroundColor: !isOpen ? themeColor : undefined }}
            >
                {isOpen ? <FiX size={24} /> : (
                    <div className="relative">
                        <FiMessageCircle size={28} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-20 right-0 w-[90vw] max-w-[380px] overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900"
                    >
                        {/* Header */}
                        <div className="p-4 text-white" style={{ backgroundColor: themeColor }}>
                            <div className="flex items-center justify-between">
                                {view === 'chat' ? (
                                    <div className="flex items-center gap-3">
                                        {userRole !== 'pelanggan' && (
                                            <button onClick={goBack} className="rounded-full p-1 hover:bg-white/20">
                                                <FiArrowLeft size={20} />
                                            </button>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-black text-white">
                                                {activeChat?.avatar_url ? (
                                                    <img src={activeChat.avatar_url} className="h-full w-full rounded-full object-cover" />
                                                ) : <FiUser size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold">{activeChat?.username || 'Memuat...'}</h4>
                                                <p className="text-[10px] opacity-80 font-medium uppercase tracking-widest">{activeChat?.role || ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white/20 p-2 rounded-xl">
                                            <FiMessageCircle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black tracking-tight">Pesan Obrolan</h4>
                                            <p className="text-[10px] opacity-80 font-medium">Hubungi penjual/pembeli di sini</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <button onClick={closeWidget} className="rounded-full p-1 hover:bg-white/20">
                                        <FiMoreVertical size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex h-[450px] flex-col bg-gray-50/50 dark:bg-gray-950/50">
                            {view === 'list' ? (
                                <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                                    {displayList.length > 0 ? (
                                        <div className="space-y-3">
                                            {displayList.map((contact) => (
                                                <div
                                                    key={contact.user_id || contact.id}
                                                    onClick={() => openChat(contact.id ? { user_id: contact.id, ...contact } : contact)}
                                                    className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] dark:bg-gray-800"
                                                >
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                                        {contact.avatar_url ? (
                                                            <img src={contact.avatar_url} className="h-full w-full rounded-2xl object-cover" />
                                                        ) : <FiUser size={24} />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="truncate text-sm font-bold text-gray-800 dark:text-gray-200">{contact.username}</h5>
                                                            {contact.unread_count > 0 && (
                                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                                                    {contact.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="truncate text-xs text-gray-400">
                                                            {contact.last_message || `Klik untuk mulai chat dengan ${contact.username}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-center">
                                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-gray-800">
                                                <FiMessageCircle size={40} />
                                            </div>
                                            <h5 className="mb-1 text-sm font-bold text-gray-500">Belum Ada Obrolan</h5>
                                            <p className="px-10 text-xs text-gray-400">Hubungi penjual melalui menu pesanan atau klik tombol di atas.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Order Context Pin */}
                                    <OrderPinWidget order={activeOrder} />

                                    {/* Messages Area */}
                                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 no-scrollbar">
                                        <div className="flex flex-col space-y-4">
                                            {messages.map((msg, idx) => {
                                                const isMine = msg.sender_id === myId;
                                                const showName = !isMine && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);

                                                return (
                                                    <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                        {showName && (
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                                                {activeChat?.username}
                                                            </span>
                                                        )}
                                                        <div className={`max-w-[85%] space-y-1`}>
                                                            <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all duration-300 ${isMine
                                                                ? 'text-white rounded-tr-none'
                                                                : 'bg-white text-gray-800 rounded-tl-none dark:bg-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700'
                                                                }`}
                                                                style={{ backgroundColor: isMine ? themeColor : undefined }}
                                                            >
                                                                {msg.message}
                                                            </div>
                                                            <div className={`flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest text-gray-400 ${isMine ? 'justify-end' : 'justify-start'}`}>
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

                                    {/* Input Area */}
                                    <div className="border-t bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Ketik pesan..."
                                                className="flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white"
                                                style={{ '--tw-ring-color': `${themeColor}80` }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() || isLoading}
                                                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg transition-all active:scale-90 disabled:opacity-50 ${shadowColor}`}
                                                style={{ backgroundColor: themeColor }}
                                            >
                                                <FiSend size={18} />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatWidget;
