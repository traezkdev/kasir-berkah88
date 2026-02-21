import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMessageCircle, FiSend, FiUser, FiCheck, FiTrash2,
    FiImage, FiX, FiPhone, FiVideo
} from 'react-icons/fi';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../../contexts/ChatContext';
import { useOrderNotification } from '../../../contexts/OrderNotificationContext';
import { useCall } from '../../../contexts/CallContext';
import authFetch from '../../../utils/authFetch';
import OrderPinWidget from '../../../components/ui/OrderPinWidget';
import Icon from '../../../components/AppIcon';

const DesktopChat = () => {
    const navigate = useNavigate();
    const { activeChat, setActiveChat, fetchConversations, markAsRead, activeOrder, setActiveOrder } = useChat();
    const { onlineUsers } = useOrderNotification();
    const { startCall } = useCall();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const myId = parseInt(localStorage.getItem('userId'));
    const API_URL = import.meta.env.VITE_API_URL || '';

    const [restaurantSettings, setRestaurantSettings] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    useEffect(() => {
        const fetchRestaurantSettings = async () => {
            try {
                const res = await authFetch(`${API_URL}/api/restaurant-settings`);
                const data = await res.json();
                if (data.data) {
                    setRestaurantSettings(data.data);
                }
            } catch (e) {
                console.error('Error fetching restaurant settings:', e);
            }
        };
        fetchRestaurantSettings();
    }, [API_URL]);

    useEffect(() => {
        const connectToSeller = async () => {
            if (activeChat) { setIsConnecting(false); return; }
            try {
                const res = await authFetch(`${API_URL}/api/messages/contacts`);
                const data = await res.json();
                if (data.data && data.data.length > 0) {
                    const target = data.data.find(u => u.role === 'admin') || data.data[0];
                    setActiveChat(target);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsConnecting(false);
            }
        };
        connectToSeller();
    }, [activeChat, setActiveChat, API_URL]);

    useEffect(() => {
        if (activeChat) {
            fetchMessages();
            fetchActiveOrder();
            markAsRead(activeChat.user_id || activeChat.id);
        }
    }, [activeChat]);

    useEffect(() => {
        const socket = io(API_URL, { transports: ['websocket'], forceNew: true });
        socket.on('new_message', (msg) => {
            if (!activeChat) return;
            if (String(msg.sender_id) === String(activeChat.user_id || activeChat.id) && String(msg.receiver_id) === String(myId)) {
                setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
                markAsRead(activeChat.user_id || activeChat.id);
                fetchConversations();
            }
        });
        return () => { socket.disconnect(); };
    }, [activeChat, myId, API_URL]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        if (!activeChat) return;
        try {
            const res = await authFetch(`${API_URL}/api/messages/history/${activeChat.user_id || activeChat.id}`);
            const data = await res.json();
            setMessages(data.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchActiveOrder = async () => {
        try {
            const res = await authFetch(`${API_URL}/api/messages/active-order/${myId}`);
            const data = await res.json();
            setActiveOrder(data.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !activeChat || isLoading) return;

        const messageText = newMessage.trim();
        const base64Image = selectedImage;
        setIsLoading(true);
        setNewMessage('');
        setSelectedImage(null);

        try {
            const res = await authFetch(`${API_URL}/api/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    receiver_id: activeChat.user_id || activeChat.id,
                    message: messageText,
                    order_id: activeOrder?.id,
                    image_url: base64Image
                })
            });

            if (res.ok) {
                fetchMessages();
                fetchConversations();
            }
        } catch (e) {
            toast.error("Gagal mengirim pesan");
        } finally {
            setIsLoading(false);
        }
    };

    const isPartnerOnline = (partner) => {
        if (!partner) return false;
        return onlineUsers.some(u => String(u.userId) === String(partner.user_id || partner.id));
    };

    return (
        <div className="h-[calc(100vh-160px)] bg-transparent overflow-hidden px-8 py-4">
            <main className="max-w-7xl mx-auto h-full flex gap-8">
                {/* Chat Main Area */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative">
                    {/* Chat Header */}
                    <header className="px-10 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100 dark:border-slate-700 relative">
                                <FiUser size={32} />
                                {isPartnerOnline(activeChat) && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 animate-pulse" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{activeChat?.username || 'Customer Service'}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {isPartnerOnline(activeChat) ? 'Sedang Online' : 'Sedang Offline'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => startCall(activeChat, 'voice')} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-green-600 transition-all border border-transparent hover:border-green-100"><FiPhone size={20} /></button>
                            <button onClick={() => startCall(activeChat, 'video')} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"><FiVideo size={20} /></button>
                            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2" />
                            <button onClick={() => setShowDeleteConfirm(true)} className="p-4 text-slate-300 hover:text-red-500 transition-all"><FiTrash2 size={20} /></button>
                        </div>
                    </header>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
                        {messages.map((msg, idx) => {
                            const isMine = msg.sender_id === myId;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx}
                                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[60%] space-y-2`}>
                                        <div className={`p-6 rounded-[2.5rem] shadow-sm ${isMine ? 'bg-green-600 text-white rounded-tr-none shadow-green-600/10' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                                            {msg.image_url && (
                                                <img
                                                    src={msg.image_url.startsWith('http') ? msg.image_url : `${API_URL}${msg.image_url}`}
                                                    className="w-full h-auto rounded-3xl mb-4 max-h-[300px] object-cover cursor-pointer"
                                                    alt=""
                                                    onClick={() => window.open(msg.image_url.startsWith('http') ? msg.image_url : `${API_URL}${msg.image_url}`, '_blank')}
                                                />
                                            )}
                                            <p className="text-base font-medium leading-relaxed">{msg.message}</p>
                                        </div>
                                        <div className={`flex items-center gap-2 px-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {isMine && <FiCheck className={msg.is_read ? 'text-blue-500' : 'text-slate-300'} />}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Footer */}
                    <footer className="p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-50 dark:border-slate-800">
                        {selectedImage && (
                            <div className="pb-6 flex items-center gap-4">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative group">
                                    <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                                    <button onClick={() => setSelectedImage(null)} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><FiX /></button>
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Siap mengirim lampiran...</p>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex gap-4 items-center">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-green-600 transition-all"><FiImage size={24} /></button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setSelectedImage(reader.result);
                                    reader.readAsDataURL(file);
                                }
                            }} />
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Tulis pesan untuk Berkah88..."
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 rounded-[2rem] h-16 px-10 text-lg font-bold outline-none transition-all shadow-inner"
                            />
                            <button type="submit" disabled={(!newMessage.trim() && !selectedImage) || isLoading} className="w-16 h-16 bg-slate-900 dark:bg-green-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all text-xl disabled:opacity-50">
                                <FiSend />
                            </button>
                        </form>
                    </footer>
                </div>

                {/* Sidebar Content (Contact Info / Active Order) */}
                <div className="w-96 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Informasi Kontak</h4>
                        <div className="text-center space-y-4">
                            <div className="w-24 h-24 bg-green-50 dark:bg-green-900/40 rounded-[2.5rem] flex items-center justify-center mx-auto text-green-600">
                                <Icon name="Shield" size={48} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white">Admin Berkah88</h4>
                                <p className="text-slate-400 font-medium text-sm">Respon biasanya dalam 5 menit</p>
                            </div>
                        </div>
                        <div className="mt-12 space-y-4">
                            <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                                <Icon name="Clock" className="text-slate-400" size={20} />
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jam Operasional</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {restaurantSettings ? `${restaurantSettings.open_time} - ${restaurantSettings.close_time} WIB` : '08:00 - 22:00 WIB'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                                <Icon name="MapPin" className="text-slate-400" size={20} />
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi Lapak</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {restaurantSettings?.store_address || 'Indramayu, Jawa Barat'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeOrder && (
                        <div className="bg-slate-900 dark:bg-green-900/20 rounded-[3rem] p-10 shadow-2xl text-white">
                            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6">Pesanan Aktif</h4>
                            <OrderPinWidget order={activeOrder} />
                            <button onClick={() => navigate(`/customer/order-details/${activeOrder.id}`)} className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Lihat Detail Pesanan</button>
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Confirm Overlay Desktop */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-8">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-950 rounded-[3rem] p-12 max-w-md w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
                                <FiTrash2 size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Hapus Riwayat Chat?</h2>
                            <p className="text-slate-400 font-medium mb-10 leading-relaxed px-4">Semua pesan dengan Admin akan terhapus secara permanen dari perangkat Anda. Tindakan ini tidak dapat dibatalkan.</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={async () => {
                                    try {
                                        await authFetch(`${API_URL}/api/messages/history/${activeChat.id || activeChat.user_id}`, { method: 'DELETE' });
                                        setMessages([]);
                                        setShowDeleteConfirm(false);
                                        toast.success("Riwayat dihapus");
                                    } catch (e) { toast.error("Gagal menghapus"); }
                                }} className="w-full py-5 bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all uppercase tracking-widest text-xs">YA, HAPUS SEKARANG</button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 bg-slate-50 dark:bg-slate-800 text-slate-400 font-black rounded-2xl transition-all uppercase tracking-widest text-xs">BATALKAN</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DesktopChat;
