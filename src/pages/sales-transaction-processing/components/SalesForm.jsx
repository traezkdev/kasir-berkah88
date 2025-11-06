import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import ProductCard from './ProductCard';

const SalesForm = ({ menuItems, onIncrementItem, onDecrementItem, cart, userRole, apiUrl }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMenuItems = filteredMenuItems.sort((a, b) => {
    // Item unggulan (is_featured: true) muncul lebih dulu
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    // Urutan default jika keduanya unggulan atau tidak unggulan
    return 0;
  });

  return (
    <div className="bg-card rounded-lg shadow-lg p-6">
      <Input
        type="text"
        placeholder="Cari menu..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedMenuItems.map(item => (
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
