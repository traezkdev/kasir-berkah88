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

  const handleToggleIgnoreStock = async () => {
    const newValue = !ignoreStock;
    setIgnoreStock(newValue); // Optimistically update local state

    try {
      const response = await authFetch(`${apiUrl}/api/settings/ignore_stock_sales_form`, {
        method: 'PUT', // Use PUT to update an existing setting
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newValue ? '1' : '0' }), // Send '1' or '0'
      });

      if (!response.ok) {
        // If API update fails, revert local state and show error
        setIgnoreStock(!newValue);
        const errorData = await response.json();
        console.error(errorData.error || 'Gagal memperbarui pengaturan Abaikan Stok.');
      }
    } catch (err) {
      // If API call fails, revert local state and show error
      setIgnoreStock(!newValue);
      console.error('Terjadi kesalahan saat memperbarui pengaturan Abaikan Stok: ' + err.message);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch Categories
        const categoriesResponse = await authFetch(`${apiUrl}/api/categories`);
        const categoriesData = await categoriesResponse.json();
        if (categoriesResponse.ok) {
          setCategories(categoriesData.data);
        } else {
          console.error("Failed to fetch categories:", categoriesData.error);
        }

        // Fetch Ignore Stock setting for SalesForm
        const ignoreStockResponse = await authFetch(`${apiUrl}/api/settings/ignore_stock_sales_form`);
        const ignoreStockData = await ignoreStockResponse.json();
        if (ignoreStockResponse.ok) {
          setIgnoreStock(ignoreStockData.data.value === '1'); // Convert '0'/'1' to boolean
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
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
                        {/* Button for ignoring stock */}
                        <div className="flex items-center ml-auto w-full sm:w-auto">
                          <Button
                            onClick={handleToggleIgnoreStock}
                            variant={ignoreStock ? "destructive" : "outline"}
                            className="w-full" // Make button full width
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
            ignoreStock={ignoreStock} // Add this prop
          />
        ))}
      </div>
    </div>
  );
};

export default SalesForm;
