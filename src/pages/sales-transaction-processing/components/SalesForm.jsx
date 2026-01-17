import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import ProductCard from './ProductCard';
import Button from '../../../components/ui/Button';
import authFetch from '../../../utils/authFetch';

const SalesForm = ({ menuItems, onIncrementItem, onDecrementItem, cart, userRole, apiUrl, ignoreStock, handleToggleIgnoreStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await authFetch(`${apiUrl}/api/categories`);
        const categoriesData = await categoriesResponse.json();
        if (categoriesResponse.ok) {
          setCategories(categoriesData.data);
        } else {
          console.error("Failed to fetch categories:", categoriesData.error);
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
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  return (
    <div className="">
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
        <div className="flex items-center ml-auto w-full sm:w-auto">
          <Button
            onClick={handleToggleIgnoreStock}
            variant={ignoreStock ? "destructive" : "outline"}
            className="w-full"
          >
            Abaikan Stok: {ignoreStock ? "Ya" : "Tidak"}
          </Button>
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
            ignoreStock={ignoreStock}
          />
        ))}
      </div>
    </div>
  );
};

export default SalesForm;