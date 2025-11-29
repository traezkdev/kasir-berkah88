import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import ProductCard from './ProductCard';
import Button from '../../../components/ui/Button'; // Add this import
import { useEffect } from 'react'; // Add useEffect
import authFetch from '../../../utils/authFetch';
import { Checkbox } from '../../../components/ui/Checkbox'; // Add Checkbox import

const SalesForm = ({ menuItems, onIncrementItem, onDecrementItem, cart, userRole, apiUrl }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]); // State for categories
  const [selectedCategory, setSelectedCategory] = useState('all'); // State for selected category
  const [ignoreStock, setIgnoreStock] = useState(false); // State for ignore stock

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/categories`);
        const data = await response.json();
        if (response.ok) {
          setCategories(data.data);
        } else {
          console.error("Failed to fetch categories:", data.error);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [apiUrl]);

  const filteredAndCategorizedMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory)
  );

  const sortedMenuItems = filteredAndCategorizedMenuItems.sort((a, b) => {
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

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          Semua
        </Button>
                        {categories.map(cat => (
                          <Button
                            key={cat.id}
                            variant={selectedCategory === cat.name.toLowerCase() ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.name.toLowerCase())}
                          >
                            {cat.name}
                          </Button>
                        ))}
                        {/* Checkbox for ignoring stock */}
                        <div className="flex items-center ml-auto">
                          <Checkbox
                            id="ignore-stock-sales-form"
                            label="Abaikan Stok"
                            checked={ignoreStock}
                            onChange={(e) => setIgnoreStock(e.target.checked)}
                          />
                        </div>
                      </div>
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
            ignoreStock={ignoreStock} // Add this prop
          />
        ))}
      </div>
    </div>
  );
};

export default SalesForm;
