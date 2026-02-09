import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMessageCircle, FiSend, FiChevronLeft,
    FiUser, FiCheck, FiClock, FiMoreVertical, FiArrowLeft, FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../../../contexts/ChatContext';
import authFetch from '../../../utils/authFetch';
import OrderPinWidget from '../../../components/ui/OrderPinWidget';
import Icon from '../../../components/AppIcon';

const CustomerChat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        unreadCount,
        activeChat,
        setActiveChat,
        markAsRead,
        conversations,
        fetchConversations,
        activeOrder,
        setActiveOrder
    } = useChat();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otherUsers, setOtherUsers] = useState([]);
    const [view, setView] = useState('list'); // 'list' or 'chat'
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const messagesEndRef = useRef(null);
    const scrollRef = useRef(null);
    const userRole = localStorage.getItem('role');
    const myId = parseInt(localStorage.getItem('userId'));

    // Customer Green Theme
    const themeColor = '#0D9C59';
    const shadowColor = 'shadow-green-500/30';

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

    // Auto scroll when messages change
    useEffect(() => {
        if (view === 'chat') {
            scrollToBottom();
        }
    }, [messages]);

    // Check query params for initial order pinning or chat target
    useEffect(() => {
        if (activeChat) {
            setView('chat');
        } else if (conversations.length > 0) {
            // Default to first conversation if available?
            // Or stay in list view?
            // Let's stay in list view to let user choose, unless explicitly navigated
        } else {
            // Fetch contacts to potentially start chat
            fetchContacts().then(contacts => {
                if (contacts && contacts.length > 0) {
                    const admin = contacts.find(u => u.role === 'admin') ||
                        contacts.find(u => u.role === 'owner') ||
                        contacts[0];
                    // If no existing conversations, maybe auto-select admin?
                    // But maybe better to show "Start Chat" UI with Admin
                }
            });
        }
    }, []);

    // Fetch messages when activeChat changes
    useEffect(() => {
        if (activeChat) {
            setView('chat');
            fetchMessages();
            fetchActiveOrder();
            markAsRead(activeChat.user_id);
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [activeChat]);

    // Fetch contacts
    useEffect(() => {
        if (view === 'list') {
            fetchContacts();
        }
    }, [view]);

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
        if (activeOrder) return; // Don't overwrite if already set (e.g. from previous screen)

        try {
            const res = await authFetch(`/api/messages/active-order/${myId}`);
            if (res.ok) {
                const data = await res.json();
                setActiveOrder(data.data);
            }
        } catch (e) {
            console.error("Error fetching active order:", e);
        }
    };

    const handleDeleteChat = () => {
        if (!activeChat) return;
        setShowDeleteConfirm(true);
    };

    const confirmDeleteChat = async () => {
        try {
            const res = await authFetch(`/api/messages/history/${activeChat.id || activeChat.user_id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setMessages([]);
                fetchConversations();
                toast.success("Riwayat chat dihapus");
                setShowDeleteConfirm(false);
            }
        } catch (e) {
            console.error("Error deleting chat:", e);
            toast.error("Gagal menghapus chat");
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

    const goBack = () => {
        if (view === 'chat') {
            setActiveChat(null);
            setView('list');
        } else {
            navigate('/customer/dashboard');
        }
    };

    const displayList = otherUsers.length > 0 ? otherUsers : conversations;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={goBack} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                        <Icon name="ArrowLeft" className="w-5 h-5 text-gray-800" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-gray-800">
                            {view === 'chat' && activeChat
                                ? (activeChat.username || 'Staf Kasir Berkah88')
                                : 'Pesan Masuk'}
                        </h1>
                        {view === 'chat' && activeChat && (
                            <p className="text-xs text-green-600 font-bold">Online</p>
                        )}
                    </div>
                </div>
                {view === 'chat' && (
                    <button onClick={handleDeleteChat} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <FiTrash2 className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative flex flex-col items-stretch">
                {/* Delete Confirmation Overlay */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-[280px] bg-white rounded-3xl p-6 shadow-2xl text-center"
                            >
                                <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4">
                                    <FiTrash2 size={32} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">Hapus Chat?</h3>
                                <p className="text-[11px] text-gray-500 mb-6 font-medium leading-relaxed">
                                    Semua riwayat pesan dengan <span className="font-bold text-gray-800">{activeChat?.username}</span> akan dihapus permanen.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={confirmDeleteChat}
                                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-red-500/30 transition-all active:scale-95"
                                    >
                                        HAPUS SEKARANG
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-black transition-all active:scale-95"
                                    >
                                        TIDAK, BATALKAN
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {view === 'list' ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {displayList.length > 0 ? (
                            displayList.map((contact) => (
                                <div
                                    key={contact.user_id || contact.id}
                                    onClick={() => openChat(contact.id ? { user_id: contact.id, ...contact } : contact)}
                                    className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
                                >
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                                        {contact.avatar_url ? (
                                            <img src={contact.avatar_url} className="w-full h-full rounded-2xl object-cover" />
                                        ) : <FiUser size={24} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-gray-900">{contact.username}</h3>
                                            {contact.unread_count > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {contact.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-1">
                                            {contact.last_message || `Mulai chat dengan ${contact.username}`}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                    <FiMessageCircle size={40} />
                                </div>
                                <h3 className="text-gray-500 font-bold mb-1">Belum Ada Pesan</h3>
                                <p className="text-gray-400 text-xs px-10">Hubungi penjual jika Anda memiliki pertanyaan.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-gray-50">
                        {/* Order Context Pin */}
                        <div className="mx-4 mt-2">
                            <OrderPinWidget order={activeOrder} />
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
                            {messages.length > 0 ? (
                                <>
                                    {messages.map((msg, idx) => {
                                        const isMine = msg.sender_id === myId;
                                        return (
                                            <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[85%] space-y-1`}>
                                                    <div className={`rounded-2xl px-5 py-3 text-sm shadow-sm ${isMine
                                                        ? 'bg-green-600 text-white rounded-tr-none'
                                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                                        }`}
                                                    >
                                                        {msg.message}
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-gray-400 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        <FiClock size={10} />
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMine && (
                                                            <div className="flex -space-x-1.5 items-center ml-1">
                                                                <FiCheck size={12} style={{ color: msg.is_read ? themeColor : '#D1D5DB' }} />
                                                                <FiCheck size={12} style={{ color: msg.is_read ? themeColor : '#D1D5DB' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                                    <FiMessageCircle size={48} className="text-gray-300 mb-4" />
                                    <p className="text-sm text-gray-400 font-bold">Mulai percakapan dengan sapaan hangat!</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100 pb-8 fixed bottom-0 left-0 right-0 z-50">
                            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-md lg:max-w-7xl mx-auto">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Tulis pesan..."
                                    className="flex-1 bg-gray-50 border-transparent focus:border-green-500 focus:bg-white focus:ring-0 rounded-2xl px-5 py-4 text-sm font-medium transition-all outline-none shadow-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isLoading}
                                    className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    <FiSend size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerChat;
