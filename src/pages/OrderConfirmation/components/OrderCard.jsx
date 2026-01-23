import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useChat } from '../../../contexts/ChatContext';

const OrderCard = ({ order, onAccept, onReject, onDelete }) => {
  const navigate = useNavigate();
  const { setActiveChat, setActiveOrder } = useChat();
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      default:
        return 'bg-muted dark:bg-muted/20 text-text-primary';
    }
  };

  const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-text-primary">Order #{order.id}</h3>
            <div className="flex items-center text-sm text-text-secondary mt-1">
              <Icon name="Clock" className="mr-2" size={14} />
              <span>{new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClasses(order.status)}`}>
            {order.status === 'pending' && 'Menunggu Konfirmasi'}
            {order.status === 'accepted' && 'Diterima'}
            {order.status === 'rejected' && 'Ditolak'}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-center text-sm text-text-primary">
            <Icon name="User" className="mr-2" size={14} />
            <span className="font-semibold">{order.customer_name}</span>
          </div>
          {order.customer_address && (
            <div className="flex items-start text-sm text-text-secondary mt-1">
              <Icon name="MapPin" className="mr-2 mt-1 flex-shrink-0" size={14} />
              <span>{order.customer_address}</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          <h4 className="font-semibold text-text-primary">Detail Item ({parsedItems.length})</h4>
          <Icon name={showDetails ? "ChevronUp" : "ChevronDown"} size={20} />
        </div>
        {showDetails && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {parsedItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-text-primary">
                <span>{item.name} x {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between items-center text-sm font-medium mt-3 pt-3 border-t text-text-secondary">
          <span>Metode Pembayaran</span>
          <span className="text-text-primary capitalize">{order.payment_method || 'Tunai'}</span>
        </div>
        <div className="flex justify-between items-center text-md font-bold mt-2">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>
      <div className="p-4 bg-background border-t border-border flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3">
        {order.user_id && (
          <Button
            variant="outline"
            onClick={() => {
              setActiveChat({
                user_id: order.user_id,
                username: order.customer_name,
                role: 'pelanggan'
              });
              setActiveOrder(order);
              navigate('/admin/chat');
            }}
            className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/10 min-w-[80px]"
          >
            <Icon name="MessageCircle" className="mr-2" /> Chat
          </Button>
        )}
        {order.status === 'pending' && (
          <>
            <Button variant="destructive" onClick={onReject} className="flex-1 sm:flex-none min-w-[80px]">
              <Icon name="X" className="mr-2" /> Tolak
            </Button>
            <Button variant="success" onClick={onAccept} className="flex-1 sm:flex-none min-w-[80px]">
              <Icon name="Check" className="mr-2" /> Terima
            </Button>
          </>
        )}
        {(order.status === 'rejected' || order.status === 'accepted') && (
          <Button variant="outline" onClick={onDelete} className="flex-1 sm:flex-none min-w-[80px]">
            <Icon name="Trash2" className="mr-2" /> Hapus
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
