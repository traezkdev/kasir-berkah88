import React from 'react';
import { FiShoppingBag, FiInfo, FiChevronRight, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';

const OrderPinWidget = ({ order }) => {
    const navigate = useNavigate();
    const { setActiveOrder } = useChat();
    if (!order) return null;

    const userRole = localStorage.getItem('role');

    const getThemeColor = () => {
        if (userRole === 'pelanggan') return '#0D9C59'; // Customer Green
        if (userRole === 'penjual' || userRole === 'admin') return '#3E59E9';   // Seller/Admin Blue
        return '#128EEA'; // Default Blue
    };
    const themeColor = getThemeColor();

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'accepted': return 'bg-green-100 text-green-600 border-green-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Menunggu';
            case 'accepted': return 'Diproses';
            default: return status;
        }
    };

    const handleNavigate = () => {
        if (userRole === 'penjual' || userRole === 'admin') {
            navigate('/seller/orders');
        } else if (userRole === 'pelanggan') {
            navigate('/customer/order-confirmation');
        }
    };

    return (
        <div
            onClick={handleNavigate}
            className="mx-3 mt-3 mb-2 overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all group"
        >
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <FiShoppingBag style={{ color: themeColor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        Pesanan Aktif
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveOrder(null);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <FiX size={14} />
                    </button>
                    <FiChevronRight className="text-gray-400 group-hover:translate-x-0.5 transition-transform" size={14} />
                </div>
            </div>
            <div className="p-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        #{order.id.toString().slice(-5)}
                    </span>
                    <span className="text-xs font-black" style={{ color: themeColor }}>
                        Rp {order.total?.toLocaleString('id-ID')}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <FiInfo size={12} />
                    <span>Klik untuk melihat detail pesanan</span>
                </div>
            </div>
        </div>
    );
};

export default OrderPinWidget;
