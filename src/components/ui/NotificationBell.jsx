import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { useOrderNotification } from '../../contexts/OrderNotificationContext';

const NotificationBell = ({ size = 24, className = "" }) => {
    const navigate = useNavigate();
    const { pendingCount } = useOrderNotification();

    return (
        <button
            onClick={() => navigate('/order-confirmation')}
            className={`relative p-2 rounded-full transition-all active:scale-95 hover:bg-black/5 dark:hover:bg-white/5 ${className}`}
            aria-label="Notifikasi Pesanan"
        >
            <Icon name="Bell" size={size} />
            {pendingCount > 0 && (
                <>
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
                            {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                    </span>
                </>
            )}
        </button>
    );
};

export default NotificationBell;
