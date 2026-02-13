import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useChat } from '../../../contexts/ChatContext';

const OrderCard = ({ order, onAccept, onReject, onComplete, onDelete }) => {
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
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'completed':
        return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-700/50 text-gray-500';
      default:
        return 'bg-muted dark:bg-muted/20 text-text-primary';
    }
  };

  const statusLabelMap = {
    pending: 'Baru',
    accepted: 'Diproses',
    completed: 'Selesai',
    rejected: 'Ditolak',
    cancelled: 'Batal'
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
          <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${getStatusClasses(order.status)}`}>
            {statusLabelMap[order.status] || order.status}
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
          <h4 className="font-semibold text-text-primary uppercase text-xs tracking-widest">Detail Item ({parsedItems.length})</h4>
          <Icon name={showDetails ? "ChevronUp" : "ChevronDown"} size={20} className="text-gray-400" />
        </div>
        {showDetails && (
          <div className="mt-3 space-y-2 border-t border-dashed pt-3">
            {parsedItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-text-primary">
                <span className="font-medium">{item.name} x {item.quantity}</span>
                <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between items-center text-xs font-bold mt-4 pt-3 border-t text-text-secondary uppercase tracking-widest">
          <span>Metode Pembayaran</span>
          <span className="text-text-primary capitalize">{order.payment_method || 'Tunai'}</span>
        </div>
        <div className="flex justify-between items-center text-lg font-black mt-2">
          <span className="text-text-secondary">Total</span>
          <span className="text-primary">{formatCurrency(order.total)}</span>
        </div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-muted/10 border-t border-border flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3">
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
            className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/10 min-w-[100px] font-bold"
          >
            <Icon name="MessageCircle" className="mr-2" size={16} /> Chat
          </Button>
        )}
        {order.status === 'pending' && (
          <>
            <Button variant="destructive" onClick={onReject} className="flex-1 sm:flex-none min-w-[100px] font-bold">
              <Icon name="X" className="mr-2" size={16} /> Tolak
            </Button>
            <Button variant="success" onClick={onAccept} className="flex-1 sm:flex-none min-w-[100px] font-bold">
              <Icon name="Check" className="mr-2" size={16} /> Terima
            </Button>
          </>
        )}
        {order.status === 'accepted' && (
          <>
            <Button variant="outline" onClick={onReject} className="flex-1 sm:flex-none min-w-[100px] font-bold border-red-200 text-red-500 hover:bg-red-50">
              <Icon name="Slash" className="mr-2" size={16} /> Batal
            </Button>
            <Button variant="success" onClick={onComplete} className="flex-1 sm:flex-none min-w-[100px] font-bold">
              <Icon name="CheckCircle2" className="mr-2" size={16} /> Selesaikan
            </Button>
          </>
        )}
        {(order.status === 'rejected' || order.status === 'completed' || order.status === 'cancelled') && (
          <Button variant="outline" onClick={onDelete} className="flex-1 sm:flex-none min-w-[100px] font-bold">
            <Icon name="Trash2" className="mr-2" size={16} /> Hapus
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
