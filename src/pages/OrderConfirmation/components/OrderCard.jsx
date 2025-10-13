import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OrderCard = ({ order, onAccept, onReject, onDelete }) => {
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
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Order #{order.id}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
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
          <div className="flex items-center text-sm text-gray-700">
            <Icon name="User" className="mr-2" size={14} />
            <span className="font-semibold">{order.customer_name}</span>
          </div>
          {order.customer_address && (
            <div className="flex items-start text-sm text-gray-500 mt-1">
              <Icon name="MapPin" className="mr-2 mt-1 flex-shrink-0" size={14} />
              <span>{order.customer_address}</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          <h4 className="font-semibold text-gray-700">Detail Item ({parsedItems.length})</h4>
          <Icon name={showDetails ? "ChevronUp" : "ChevronDown"} size={20} />
        </div>
        {showDetails && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {parsedItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                <span>{item.name} x {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between items-center text-md font-bold mt-3 pt-3 border-t">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
        {order.status === 'pending' && (
          <>
            <Button variant="destructive" onClick={onReject}>
              <Icon name="X" className="mr-2" /> Tolak
            </Button>
            <Button variant="success" onClick={onAccept}>
              <Icon name="Check" className="mr-2" /> Terima
            </Button>
          </>
        )}
        {(order.status === 'rejected' || order.status === 'accepted') && (
          <Button variant="outline" onClick={onDelete}>
            <Icon name="Trash2" className="mr-2" /> Hapus
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
