import React, { useState } from 'react';
import Icon from '../../../../components/AppIcon';

const SellerOrderCard = ({ order, onAccept, onReject }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const totalQty = parsedItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

    return (
        <div className="bg-white rounded-[2rem] border border-indigo-50 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
            {/* Top Info Bar */}
            <div className="bg-indigo-50/50 px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Pesanan #{order.id}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 capitalize">
                    {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <div className="p-5">
                {/* Customer Section */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Icon name="User" size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-800 leading-tight">{order.customer_name}</h4>
                            <p className="text-[11px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                                <Icon name="MapPin" size={10} />
                                {order.customer_address || 'Ambil di Toko'}
                            </p>
                            <p className="text-[11px] text-green-600 font-bold flex items-center gap-1 mt-1">
                                <Icon name="Wallet" size={10} />
                                {order.payment_method || 'Tunai'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Summary / Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full bg-gray-50 rounded-2xl p-3 flex items-center justify-between group transition-all active:scale-95 mb-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600">
                            <Icon name="ShoppingBag" size={16} />
                        </div>
                        <div className="text-left">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">Pesanan</span>
                            <span className="text-xs font-bold text-gray-700">{totalQty} Item • {formatCurrency(order.total)}</span>
                        </div>
                    </div>
                    <Icon
                        name="ChevronDown"
                        size={18}
                        className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="space-y-3 mb-5 border-t border-dashed border-gray-100 pt-4 animate-in fade-in slide-in-from-top-2">
                        {parsedItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                                <div className="flex gap-2 items-center">
                                    <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black">{item.quantity}x</span>
                                    <span className="text-xs font-bold text-gray-600">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-gray-800">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {(onAccept && onReject) && (
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={onReject}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-2xl transition-all active:scale-90"
                            title="Tolak Pesanan"
                        >
                            <Icon name="X" size={20} strokeWidth={3} />
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 group"
                        >
                            Terima Sekarang
                            <Icon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerOrderCard;
