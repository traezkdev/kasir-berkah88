import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import SalesForm from './components/SalesForm';
import OrderSummary from './components/OrderSummary';
import OptionSelectionModal from './components/OptionSelectionModal'; // Import the new modal
import authFetch from '../../utils/authFetch';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button'; // Added import for Button

const apiUrl = import.meta.env.VITE_API_URL;

// Helper function to create a unique ID for a cart item based on its options
const getCartItemId = (item, options) => {
  if (!options || options.length === 0) {
    return item.id;
  }
  const optionIds = options.map(o => o.id).sort().join('-');
  return `${item.id}-${optionIds}`;
};

const SalesTransactionProcessing = ({ headerTitle }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmployeeMeal, setIsEmployeeMeal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [userRole, setUserRole] = useState(null);
  const [ignoreStock, setIgnoreStock] = useState(false);


  // State for the options modal
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);

  const fetchMenuItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items/all`);
      const data = await response.json();
      if (data.message === 'success') {
        setMenuItems(data.data);
      } else {
        console.error('Failed to fetch menu items:', data.error);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    fetchMenuItems();

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
      } catch (e) {
        console.error("Error decoding token in SalesTransactionProcessing:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }

    const fetchIgnoreStockSetting = async () => {
      try {
        const ignoreStockResponse = await authFetch(`${apiUrl}/api/settings/ignore_stock_sales_form`);
        const ignoreStockData = await ignoreStockResponse.json();
        if (ignoreStockResponse.ok) {
          setIgnoreStock(ignoreStockData.data.value === '1');
        }
      } catch (error) {
        console.error("Error fetching initial ignore stock setting:", error);
      }
    };
    fetchIgnoreStockSetting();
  }, []);

  const handleToggleIgnoreStock = async () => {
    const newValue = !ignoreStock;
    setIgnoreStock(newValue);

    try {
      await authFetch(`${apiUrl}/api/settings/ignore_stock_sales_form`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newValue ? '1' : '0' }),
      });
    } catch (err) {
      setIgnoreStock(!newValue);
      console.error('Terjadi kesalahan saat memperbarui pengaturan Abaikan Stok: ' + err.message);
    }
  };

  // Simplified useEffect for metrics, as it's not the focus
  useEffect(() => {
    // This effect can be simplified or removed if metrics aren't displayed here
  }, [menuItems]);

  const addItemToCart = (item, selectedOptions = []) => {
    setCart(prevCart => {
      const cartItemId = getCartItemId(item, selectedOptions);
      const existingItem = prevCart.find(cartItem => cartItem.cartItemId === cartItemId);

      const optionPriceAdjustment = selectedOptions.reduce((sum, opt) => sum + (opt.price_adjustment || 0), 0);
      const priceAfterDiscount = item.discount > 0 ? parseFloat(item.price) * (1 - item.discount) : parseFloat(item.price);
      const finalPrice = priceAfterDiscount + optionPriceAdjustment;

      if (existingItem) {
        // Increment quantity if item with same options exists
        if (!ignoreStock && existingItem.quantity + 1 > item.stock) {
          console.warn(`Not enough stock for ${item.name}`);
          return prevCart;
        }
        return prevCart.map(cartItem =>
          cartItem.cartItemId === cartItemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Add new item to cart
        const newCartItem = {
          ...item,
          cartItemId, // Unique ID for this specific item configuration
          quantity: 1,
          selectedOptions,
          basePrice: parseFloat(item.price),
          finalPrice,
        };
        return [...prevCart, newCartItem];
      }
    });
  };

  const handleItemClick = (item) => {
    // If item has options, open the modal
    if (item.options && item.options.length > 0) {
      setSelectedItemForOptions(item);
      setIsOptionsModalOpen(true);
    } else {
      // Otherwise, add directly to cart with no options
      addItemToCart(item, []);
    }
  };

  const handleDecrementItem = (cartItemId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.cartItemId === cartItemId);
      if (!existingItem) return prevCart;

      if (existingItem.quantity === 1) {
        return prevCart.filter(item => item.cartItemId !== cartItemId);
      } else {
        return prevCart.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
    });
  };

  const handleRemoveFromCart = (cartItemId) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
  };

  const handleUpdateQuantity = (cartItemId, quantity) => {
    if (quantity < 0) return;

    setCart(prevCart => {
      const cartItem = prevCart.find(item => item.cartItemId === cartItemId);
      const menuItem = menuItems.find(item => item.id === cartItem.id); // Original menu item for stock check

      if (!ignoreStock && menuItem && quantity > menuItem.stock) {
        console.warn(`Not enough stock for ${menuItem.name}. Available: ${menuItem.stock}`);
        return prevCart.map(item => (item.cartItemId === cartItemId ? { ...item, quantity: menuItem.stock } : item));
      } else if (quantity === 0) {
        return prevCart.filter(item => item.cartItemId !== cartItemId);
      } else {
        return prevCart.map(item => (item.cartItemId === cartItemId ? { ...item, quantity } : item));
      }
    });
  };

  const handleClearCart = () => setCart([]);

  const handleProcessPayment = async (paymentData) => {
    setIsLoading(true);

    const transactionItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.finalPrice, // Use the final price per item
      basePrice: item.basePrice, // Include basePrice for receipt display
      discount: item.discount,   // Include discount for receipt display
      options: item.selectedOptions.map(opt => ({ name: opt.name, price_adjustment: opt.price_adjustment }))
    }));

    const transaction = {
      items: transactionItems,
      total: paymentData.total,
      ppn: paymentData.ppn,
      isEmployeeMeal,
      payment_method: paymentMethod,
      ignoreStock,

      cashPaid: paymentData.cashPaid,
      change: paymentData.change,
      manual_discount: paymentData.manual_discount,
      catatan: paymentData.catatan,
    };

    try {
      const response = await authFetch(`${apiUrl}/api/transactions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      const result = await response.json();
      if (result.message === 'success') {
        setCart([]);
        setIsEmployeeMeal(false);
        fetchMenuItems();
        navigate('/receipt', { state: { transaction: result.data } });
      } else {
        console.error('Failed to save transaction:', result.error);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />}
      <div className={`${theme === 'default' ? 'pt-16' : ''}`}>
        <div className={`max-w-7xl mx-auto ${theme === 'default' ? 'px-4' : ''} lg:px-6 space-y-6 py-4 pb-20`}>
          <BreadcrumbNavigation />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Transaksi Penjualan</h1>
              <p className="text-text-secondary mt-1">
                Proses transaksi penjualan dengan cepat dan efisien.
              </p>
            </div>
            <Button
              onClick={() => navigate('/transaksi-sederhana')}
              variant="outline"
              className="w-full md:w-auto" // Make button full width on mobile, auto on desktop
            >
              Mode Transaksi Sederhana
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SalesForm
                menuItems={menuItems}
                onIncrementItem={handleItemClick} // Use the new handler
                onDecrementItem={handleDecrementItem}
                cart={cart}
                userRole={userRole}
                apiUrl={apiUrl}
                ignoreStock={ignoreStock}
                handleToggleIgnoreStock={handleToggleIgnoreStock}
              />
            </div>
            <div className="lg:col-span-1">
              <OrderSummary
                cart={cart}
                menuItems={menuItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onProcessPayment={handleProcessPayment}
                isLoading={isLoading}
                isEmployeeMeal={isEmployeeMeal}
                setIsEmployeeMeal={setIsEmployeeMeal}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                userRole={userRole}
                ignoreStock={ignoreStock}

              />
            </div>
          </div>
        </div>
      </div>
      <OptionSelectionModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        item={selectedItemForOptions}
        onAddToCartWithOptions={addItemToCart}
      />
    </div>
  );
};

export default SalesTransactionProcessing;
