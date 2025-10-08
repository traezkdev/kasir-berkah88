import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import { Check, X, Clock, User, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const OrderCard = ({ order, onAccept, onReject }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formattedDate = new Date(order.created_at).toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">Order #{order.id}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock size={14} className="mr-2" />
                            <span>{formattedDate}</span>
                        </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusChipColor(order.status)}`}>
                        {order.status}
                    </span>
                </div>
                <div className="mt-3">
                    <div className="flex items-center text-sm text-gray-700">
                        <User size={14} className="mr-2" />
                        <span className="font-semibold">{order.customer_name}</span>
                    </div>
                    <div className="flex items-start text-sm text-gray-500 mt-1">
                        <MapPin size={14} className="mr-2 mt-1 flex-shrink-0" />
                        <span>{order.customer_address}</span>
                    </div>
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <h4 className="font-semibold text-gray-700">Detail Item ({order.items?.length || 0})</h4>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {isExpanded && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                        {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-mono">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center text-md font-bold mt-3 pt-3 border-t">
                    <span>Total</span>
                    <span>Rp {order.total.toLocaleString('id-ID')}</span>
                </div>
            </div>

            {order.status === 'pending' && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <Button 
                        variant="destructive" 
                        onClick={onReject} 
                    >
                        <X size={16} className="mr-2" />
                        Tolak
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={onAccept} 
                    >
                        <Check size={16} className="mr-2" />
                        Terima
                    </Button>
                </div>
            )}
        </div>
    );
};

export default OrderCard;
