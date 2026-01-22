import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../AppIcon'; // Assuming AppIcon is available

const ToastContext = createContext();

const Toast = ({ message, type, id, onRemove }) => {
    const [progress, setProgress] = useState(100);
    const duration = 3000;

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 10);
        return () => clearInterval(interval);
    }, []);

    const config = {
        success: {
            bg: 'bg-emerald-50/95 dark:bg-emerald-950/30',
            border: 'border-emerald-100 dark:border-emerald-800/50',
            text: 'text-emerald-700 dark:text-emerald-400',
            icon: 'CheckCircle2',
            iconColor: 'bg-emerald-500',
            progress: 'bg-emerald-500'
        },
        error: {
            bg: 'bg-rose-50/95 dark:bg-rose-950/30',
            border: 'border-rose-100 dark:border-rose-800/50',
            text: 'text-rose-700 dark:text-rose-400',
            icon: 'AlertCircle',
            iconColor: 'bg-rose-500',
            progress: 'bg-rose-500'
        },
        warning: {
            bg: 'bg-amber-50/95 dark:bg-amber-950/30',
            border: 'border-amber-100 dark:border-amber-800/50',
            text: 'text-amber-700 dark:text-amber-400',
            icon: 'AlertTriangle',
            iconColor: 'bg-amber-500',
            progress: 'bg-amber-500'
        },
        info: {
            bg: 'bg-blue-50/95 dark:bg-blue-950/30',
            border: 'border-blue-100 dark:border-blue-800/50',
            text: 'text-blue-700 dark:text-blue-400',
            icon: 'Info',
            iconColor: 'bg-blue-500',
            progress: 'bg-blue-500'
        }
    };

    const style = config[type] || config.info;

    return (
        <div className={`relative min-w-[320px] max-w-sm ${style.bg} backdrop-blur-xl border ${style.border} rounded-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]`}>
            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5 dark:bg-white/5"></div>
            {/* Progress Bar Fill */}
            <div
                className={`absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear ${style.progress}`}
                style={{ width: `${progress}%` }}
            ></div>

            <div className="p-4 flex items-center gap-4">
                {/* Icon Container */}
                <div className={`${style.iconColor} p-2.5 rounded-xl text-white flex items-center justify-center shrink-0`}>
                    <Icon name={style.icon} size={20} />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
                            {type === 'success' ? 'Berhasil' : type === 'error' ? 'Gagal' : type === 'warning' ? 'Peringatan' : 'Info'}
                        </span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5 line-clamp-2 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => onRemove(id)}
                    className="p-1 rounded-lg text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                    <Icon name="X" size={16} />
                </button>
            </div>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {createPortal(
                <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 max-w-full pointer-events-none">
                    <div className="flex flex-col gap-4 pointer-events-auto">
                        {toasts.map((toast) => (
                            <Toast
                                key={toast.id}
                                id={toast.id}
                                message={toast.message}
                                type={toast.type}
                                onRemove={removeToast}
                            />
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
