import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import ProductCard from './ProductCard';

const SalesForm = ({ menuItems, onIncrementItem, onDecrementItem, cart, userRole, apiUrl }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <Input
        type="text"
        placeholder="Cari menu..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMenuItems.map(item => (
          <ProductCard 
            key={item.id} 
            item={item} 
            onIncrement={onIncrementItem} 
            onDecrement={onDecrementItem} 
            cart={cart} 
            userRole={userRole} 
            apiUrl={apiUrl} 
          />
        ))}
      </div>
    </div>
  );
};

export default SalesForm;
