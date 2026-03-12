import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, Inbox, X, Loader2, AlertCircle, PieChart, Receipt } from 'lucide-react';
import api from '../services/api';

const NotificationPopover = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Gagal fetch notifikasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Polling setiap 1 menit untuk update notifikasi (opsional, bisa pakai web sockets tapi ini lebih simple)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Hapus semua notifikasi?')) return;
    try {
      await api.delete('/notifications/clear');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'bill': return 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-100';
      case 'budget': return 'bg-rose-50 text-rose-600 border-rose-100 ring-rose-100';
      case 'success': return 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-100';
      case 'transaction': return 'bg-indigo-50 text-indigo-600 border-indigo-100 ring-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100 ring-slate-100';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bill': return <AlertCircle size={20} />;
      case 'budget': return <PieChart size={20} />;
      case 'success': return <Check size={20} />;
      case 'transaction': return <Receipt size={20} />;
      default: return <Bell size={20} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'
        }`}
      >
        <Bell size={20} className={isOpen ? 'animate-pulse' : ''} />
        {unreadCount > 0 && (
          <span className={`absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 ${isOpen ? 'border-indigo-600' : 'border-white'} animate-bounce`}></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100] backdrop-blur-[2px] bg-black/5 md:bg-transparent" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-4 md:inset-auto md:absolute md:right-0 md:top-full md:mt-4 w-auto md:w-[400px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-[101] overflow-hidden flex flex-col max-h-[80vh] md:max-h-[650px] animate-in fade-in zoom-in-95 duration-200 origin-center md:origin-top-right m-auto md:m-0">
            
            {/* Header with Gradient Background */}
            <div className="p-8 pb-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
               <div className="relative flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Notifikasi</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Update Aktivitas Terbaru</p>
                  </div>
                  <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    <button 
                      onClick={markAllRead}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                      title="Baca Semua"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={clearAll}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                      title="Hapus Semua"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Bell size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Sinkronisasi...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-[3rem] flex items-center justify-center mb-6 rotate-3">
                    <Inbox size={40} className="text-gray-200" />
                  </div>
                  <h4 className="text-base font-bold text-gray-800">Kotak Masuk Kosong</h4>
                  <p className="text-xs text-gray-400 mt-2 max-w-[200px] leading-relaxed">Belum ada notifikasi baru untuk Anda saat ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`group relative p-5 rounded-[2rem] transition-all duration-300 border ${
                        !n.is_read 
                          ? 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100/50 shadow-sm' 
                          : 'bg-white border-transparent hover:bg-gray-50/80 hover:border-gray-100'
                      }`}
                    >
                      <div className="flex gap-5">
                        <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 border-2 ring-4 ring-opacity-10 transition-transform group-hover:scale-110 ${getTypeStyles(n.type)}`}>
                          {getTypeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-black tracking-tight ${!n.is_read ? 'text-gray-900' : 'text-gray-500'}`}>
                              {n.title}
                            </h4>
                            {!n.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
                          </div>
                          <p className={`text-xs leading-relaxed ${!n.is_read ? 'text-gray-600 font-bold' : 'text-gray-400 font-medium'}`}>
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-[9px] font-black text-gray-300 uppercase tracking-widest">
                            <Clock size={10} />
                            {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="absolute top-5 right-5 p-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-rose-50 hover:shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">v1.0.2 • trzfinance</p>
               <button 
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-100 transition-all shadow-sm"
               >
                  Tutup
               </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPopover;
