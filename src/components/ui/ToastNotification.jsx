import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../AppIcon'; // Assuming AppIcon is available

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

        setTimeout(() => {
            setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
        }, duration);
    };

    const value = { showToast };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {createPortal(
                <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
                    {toasts.map((toast) => (
                        <Toast key={toast.id} message={toast.message} type={toast.type} />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const Toast = ({ message, type }) => {
    const baseClasses = 'p-3 rounded-lg shadow-lg flex items-center gap-2 text-white';
    const typeClasses = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
    };

    const iconName = {
        info: 'Info',
        success: 'CheckCircle',
        warning: 'AlertTriangle',
        error: 'XCircle',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            <Icon name={iconName[type]} className="h-5 w-5" />
            <span>{message}</span>
        </div>
    );
};
