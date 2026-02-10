import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMessageCircle, FiSend, FiChevronLeft,
    FiUser, FiCheck, FiClock, FiMoreVertical, FiArrowLeft, FiTrash2,
    FiImage, FiPaperclip, FiX
} from 'react-icons/fi';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../../../contexts/ChatContext';
import { useOrderNotification } from '../../../contexts/OrderNotificationContext';
import authFetch from '../../../utils/authFetch';
import OrderPinWidget from '../../../components/ui/OrderPinWidget';
import Icon from '../../../components/AppIcon';

const CustomerChat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeChat, setActiveChat, fetchConversations, markAsRead, activeOrder, setActiveOrder } = useChat();
    const { onlineUsers } = useOrderNotification();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null); // base64 string
    const [isLoading, setIsLoading] = useState(false); // Sending status
    const [isConnecting, setIsConnecting] = useState(true); // Initial connection status
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const myId = parseInt(localStorage.getItem('userId'));

    const isPartnerOnline = (partner) => {
        if (!partner) return false;
        const partnerId = partner.user_id || partner.id;
        const partnerRole = partner.role;

        // For Customers, if partner is staff, any staff online might mean "Admin System" is online
        // But better check specific user if possible.
        // The server emits userId and role.
        return onlineUsers.some(u => String(u.userId) === String(partnerId));
    };

    // Customer Green Theme
    const themeColor = '#10B981'; // Closer to emerald for premium feel

    const scrollToBottom = (force = false, smooth = true) => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const maxScroll = scrollHeight - clientHeight;

        // Logic for flex-col-reverse:
        // When content < viewport, scrollTop is negative or 0 depending on browser implementation of flex-reverse, 
        // but generally standard scrollTo works if we target the appropriate position.
        // Actually for flex-col-reverse, usually we want to scroll to 0 to see the "bottom" (newest) if it's inverted?
        // No, standard browser behavior for flex-col-reverse:
        // - Scroll bar is at the top?
        // Let's stick to standard layout logic with flex-col-reverse for grouping.
        // Actually, let's use the proven logic from the previous step which user accepted (flex-col-reverse).

        const isNearBottom = maxScroll - scrollTop < 150;

        if (force || isNearBottom) {
            scrollRef.current.scrollTo({
                top: maxScroll,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    };

    // Auto-connect to Admin/Owner
    useEffect(() => {
        const connectToSeller = async () => {
            // If activeChat is already set (e.g. from OrderDetails), use it
            if (activeChat) {
                setIsConnecting(false);
                return;
            }

            try {
                const res = await authFetch('/api/messages/contacts');
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data.length > 0) {
                        // Prioritize Admin or Owner
                        const target = data.data.find(u => u.role === 'admin') ||
                            data.data.find(u => u.role === 'owner') ||
                            data.data[0];

                        setActiveChat(target);
                    }
                }
            } catch (e) {
                console.error("Error connecting to seller:", e);
                toast.error("Gagal menghubungkan ke penjual");
            } finally {
                setIsConnecting(false);
            }
        };

        connectToSeller();
    }, []);

    // Fetch messages & active order
    useEffect(() => {
        if (activeChat) {
            fetchMessages();
            fetchActiveOrder();
            markAsRead(activeChat.user_id || activeChat.id);
        }
    }, [activeChat]);

    // Socket.io Realtime Implementation
    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const socket = io(API_URL, {
            transports: ['websocket'],
            forceNew: true
        });

        socket.on('new_message', (msg) => {
            if (!activeChat) return;

            // Only handle messages for this chat
            // Sender is the partner, Receiver is me
            if (String(msg.sender_id) === String(activeChat.user_id || activeChat.id) && String(msg.receiver_id) === String(myId)) {
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                markAsRead(activeChat.user_id || activeChat.id);
                fetchConversations(); // Update unread counts global
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [activeChat, myId]);

    // Force scroll on new messages
    useEffect(() => {
        const shouldForce = messages.length > 0;
        setTimeout(() => scrollToBottom(shouldForce), 100);
    }, [messages]);

    const fetchMessages = async () => {
        if (!activeChat) return;
        try {
            const res = await authFetch(`/api/messages/history/${activeChat.user_id || activeChat.id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.data);
            }
        } catch (e) {
            console.error("Error fetching messages:", e);
        }
    };

    const fetchActiveOrder = async () => {
        if (!activeChat) return;
        // Always try to fetch active order to ensure it's up to date
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

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran gambar maksimal 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !activeChat || isLoading) return;

        const messageText = newMessage.trim();
        const base64Image = selectedImage;
        const tempId = Date.now();

        // Optimistic Update
        const optimisticMsg = {
            id: tempId,
            sender_id: myId,
            receiver_id: activeChat.user_id || activeChat.id,
            message: messageText,
            image_url: base64Image, // This is local base64 for now
            created_at: new Date().toISOString(),
            is_read: 0,
            is_optimistic: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setIsLoading(true);
        setNewMessage('');
        setSelectedImage(null);

        try {
            const res = await authFetch('/api/messages', {
                method: 'POST',
                body: {
                    receiver_id: activeChat.user_id || activeChat.id,
                    message: messageText,
                    order_id: activeOrder?.id,
                    image_url: base64Image
                }
            });

            if (res.ok) {
                // Wait for socket or fetch to get the real ID and URL
                await fetchMessages();
                fetchConversations();
            } else {
                // Remove optimistic message and restore input
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setNewMessage(messageText);
                setSelectedImage(base64Image);
                toast.error("Gagal mengirim pesan");
            }
        } catch (e) {
            console.error("Error sending message:", e);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setNewMessage(messageText);
            setSelectedImage(base64Image);
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => {
        setActiveChat(null);
        navigate('/customer/dashboard');
    };

    if (isConnecting || (!activeChat && isLoading)) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-lg font-bold text-gray-800">Menghubungkan ke Admin...</h2>
                <p className="text-sm text-gray-400">Mohon tunggu sebentar</p>
            </div>
        );
    }

    if (!activeChat) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <FiMessageCircle size={40} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Tidak dapat terhubung</h2>
                <p className="text-sm text-gray-400 mb-6">Maaf, kami tidak dapat menemukan kontak admin saat ini.</p>
                <button onClick={goBack} className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold">
                    Kembali ke Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-10 font-sans flex flex-col">
            {/* Fixed Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={goBack} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <Icon name="ArrowLeft" className="w-5 h-5 text-gray-800" />
                    </button>
                    <div>
                        <h4 className="text-base font-black text-gray-900 tracking-tight leading-none">{activeChat.username || 'Staf Kasir Berkah88'}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                            {isPartnerOnline(activeChat) ? (
                                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Online
                                </p>
                            ) : (
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    Offline
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <button onClick={handleDeleteChat} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <FiTrash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative flex flex-col items-stretch pt-[72px]">
                {/* Delete Confirmation Overlay */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm overflow-y-auto"
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

                <div className="flex flex-col h-full bg-gray-50">
                    {/* Order Context Pin */}
                    <div className="mx-4 mt-2">
                        <OrderPinWidget order={activeOrder} />
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-20 pt-4 flex flex-col-reverse">
                        {messages.length > 0 ? (
                            messages.slice().reverse().map((msg, idx) => {
                                const isMine = msg.sender_id === myId;
                                const imageUrl = msg.image_url ?
                                    (msg.image_url.startsWith('http') ? msg.image_url : `${import.meta.env.VITE_API_URL}${msg.image_url}`)
                                    : null;

                                return (
                                    <div key={idx} className={`flex flex-col mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[80%] space-y-1`}>
                                            <div className={`rounded-2xl shadow-sm overflow-hidden flex flex-col ${isMine
                                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                                }`}
                                            >
                                                {imageUrl && (
                                                    <img
                                                        src={imageUrl}
                                                        className="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                        alt="Chat Image"
                                                        onClick={() => window.open(imageUrl, '_blank')}
                                                    />
                                                )}
                                                {msg.message && (
                                                    <div className="px-5 py-3 text-sm leading-relaxed">
                                                        {msg.message}
                                                    </div>
                                                )}

                                                {/* Inline Footer for Bubble */}
                                                <div className={`px-4 pb-2 flex items-center gap-1.5 justify-end`}>
                                                    <span className={`text-[9px] font-bold uppercase tracking-tighter ${isMine ? 'text-emerald-100' : 'text-gray-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMine && (
                                                        <div className="flex -space-x-1.5 items-center">
                                                            <FiCheck size={11} className={msg.is_read ? 'text-[#34B7F1]' : (msg.is_optimistic ? 'text-emerald-300/50' : 'text-emerald-200')} />
                                                            <FiCheck size={11} className={msg.is_read ? 'text-[#34B7F1]' : (msg.is_optimistic ? 'text-emerald-300/50' : 'text-emerald-200')} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                                <FiMessageCircle size={48} className="text-gray-300 mb-4" />
                                <p className="text-sm text-gray-400 font-bold">Mulai percakapan dengan sapaan hangat!</p>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100 pb-8 fixed bottom-0 left-0 right-0 z-50">
                        {/* Image Preview Overlay */}
                        <AnimatePresence>
                            {selectedImage && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    className="absolute bottom-[100%] left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex items-center gap-4"
                                >
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                                        <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                                        >
                                            <FiX size={12} />
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">Kirim Gambar</p>
                                        <p className="text-[10px] text-gray-400">Tekan tombol kirim untuk membagikan gambar</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-md lg:max-w-7xl mx-auto items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors"
                            >
                                <FiImage size={24} />
                            </button>

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Tulis pesan..."
                                className="flex-1 bg-gray-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-0 rounded-2xl px-5 py-3 text-sm font-medium transition-all outline-none shadow-sm h-12"
                            />
                            <button
                                type="submit"
                                disabled={(!newMessage.trim() && !selectedImage) || isLoading}
                                className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-50 transition-all shrink-0"
                            >
                                <FiSend size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerChat;
