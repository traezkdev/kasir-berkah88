import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import ProductCard from './ProductCard';
import Button from '../../../components/ui/Button';
import authFetch from '../../../utils/authFetch';
import Icon from '../../../components/AppIcon';

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
      <div className="relative mb-6">
        <Icon name="Search" className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="Cari menu favorit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white border-transparent shadow-sm rounded-3xl focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-6 py-2.5 rounded-2xl font-black text-sm transition-all duration-300 ${selectedCategory === 'all'
            ? 'bg-[#118EEA] text-white shadow-lg shadow-blue-100 scale-105'
            : 'bg-white text-gray-400 border border-gray-100'
            }`}
        >
          Semua
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name.toLowerCase())}
            className={`flex-shrink-0 px-6 py-2.5 rounded-2xl font-black text-sm transition-all duration-300 ${selectedCategory === cat.name.toLowerCase()
              ? 'bg-[#118EEA] text-white shadow-lg shadow-blue-100 scale-105'
              : 'bg-white text-gray-400 border border-gray-100'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="hidden lg:flex items-center ml-auto w-full sm:w-auto mb-6">
        <Button
          onClick={handleToggleIgnoreStock}
          variant={ignoreStock ? "destructive" : "outline"}
          className="w-full"
        >
          Abaikan Stok: {ignoreStock ? "Ya" : "Tidak"}
        </Button>
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