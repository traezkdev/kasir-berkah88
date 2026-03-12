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
      case 'bill': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      case 'budget': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
      case 'success': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
      case 'transaction': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20';
      default: return 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-500/20';
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
        className={`relative p-2.5 rounded-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
        }`}
      >
        <Bell size={20} className={isOpen ? 'animate-pulse' : ''} />
        {unreadCount > 0 && (
          <span className={`absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 ${isOpen ? 'border-indigo-600' : 'border-white dark:border-slate-900'} animate-bounce`}></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100] backdrop-blur-[2px] bg-black/5 dark:bg-black/20 md:bg-transparent" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-4 md:inset-auto md:absolute md:right-0 md:top-full md:mt-4 w-auto md:w-[400px] bg-white dark:bg-slate-900 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-slate-800 z-[101] overflow-hidden flex flex-col max-h-[80vh] md:max-h-[650px] animate-in fade-in zoom-in-95 duration-200 origin-center md:origin-top-right m-auto md:m-0">
            
            <div className="p-6 pb-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -mr-12 -mt-12 opacity-50" />
               <div className="relative flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Notifikasi</h3>
                    <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1">Update Aktivitas Terbaru</p>
                  </div>
                  <div className="flex bg-gray-50 dark:bg-slate-800 p-1.5 rounded-lg border border-gray-100 dark:border-slate-700">
                    <button 
                      onClick={markAllRead}
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                      title="Baca Semua"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={clearAll}
                      className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                      title="Hapus Semua"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin" />
                    <Bell size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 dark:text-indigo-500">Sinkronisasi...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl flex items-center justify-center mb-6 rotate-3">
                    <Inbox size={40} className="text-gray-200 dark:text-slate-700" />
                  </div>
                  <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">Kotak Masuk Kosong</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 max-w-[200px] leading-relaxed">Belum ada notifikasi baru untuk Anda saat ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`group relative p-4 rounded-lg transition-all duration-300 border ${
                        !n.is_read 
                          ? 'bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800/50 dark:to-slate-800 border-indigo-100/50 dark:border-indigo-500/20 shadow-sm' 
                          : 'bg-white dark:bg-slate-900 border-transparent dark:border-transparent hover:bg-gray-50/80 dark:hover:bg-slate-800 hover:border-gray-100 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ring-4 ring-opacity-5 transition-transform group-hover:scale-110 ${getTypeStyles(n.type)}`}>
                          {getTypeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className={`text-xs font-black tracking-tight ${!n.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
                              {n.title}
                            </h4>
                            {!n.is_read && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                          </div>
                          <p className={`text-[10px] leading-relaxed ${!n.is_read ? 'text-gray-600 dark:text-gray-300 font-bold' : 'text-gray-400 dark:text-gray-500 font-medium'}`}>
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                            <Clock size={10} />
                            {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="absolute top-5 right-5 p-2 text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
               <p className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">v1.0.2 • trzfinance</p>
               <button 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-600 transition-all shadow-sm"
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
