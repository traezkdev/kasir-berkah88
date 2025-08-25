import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import DashboardMetricsBar from '../../components/ui/DashboardMetricsBar';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import SalesForm from './components/SalesForm';
import OrderSummary from './components/OrderSummary';

import authFetch from '../../utils/authFetch'; // Add this import

const apiUrl = import.meta.env.VITE_API_URL;

const SalesTransactionProcessing = () => {
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEmployeeMeal, setIsEmployeeMeal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchMenuItems = async () => { // Moved outside useEffect
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items`);
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

  const fetchTransactions = async () => { // Moved outside useEffect
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await authFetch(`${apiUrl}/api/transactions`);
      const data = await response.json();
      if (data.message === 'success') {
        setTransactions(data.data);
      } else {
        console.error('Failed to fetch transactions:', data.error);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && menuItems.length > 0) {
      const today = new Date().toDateString();
      const todayTransactions = transactions.filter(t => new Date(t.timestamp).toDateString() === today);
      const todaySales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const averageOrderToday = todayTransactions.length > 0 ? todaySales / todayTransactions.length : 0;
      const lowStockItems = menuItems.filter(item => item.stock <= 5 && item.stock > 0).length;

      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };

      setDashboardMetrics({
        todaySales: { value: formatCurrency(todaySales), change: '+12%', trend: 'up' },
        totalTransactions: { value: todayTransactions.length.toString(), change: '+8%', trend: 'up' },
        averageOrder: { value: formatCurrency(averageOrderToday), change: '+5%', trend: 'up' },
        lowStock: { value: lowStockItems.toString(), change: '-2', trend: 'down' }
      });
    }
  }, [transactions, menuItems]);

  const handleAddToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
    } else {
      setCart(prevCart =>
        prevCart.map(item => (item.id === itemId ? { ...item, quantity } : item))
      );
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleProcessPayment = async (paymentData) => {
    setIsLoading(true);
    
    const transaction = {
      items: cart,
      total: paymentData.total,
      ppn: paymentData.ppn,
      isEmployeeMeal: isEmployeeMeal, // Use state here
    };

    try {
      const response = await authFetch(`${apiUrl}/api/transactions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      const result = await response.json();

      if (result.message === 'success') {
        console.log('Transaction saved successfully');
        handleClearCart();
        setIsEmployeeMeal(false); // Reset checkbox state
        // Maybe show a success message
      } else {
        console.error('Failed to save transaction:', result.error);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={handleToggleSidebar} />
      <div className="pt-16">
        {/* <DashboardMetricsBar metrics={dashboardMetrics} showOnAllPages /> */}
        <main className="pt-6 lg:pt-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6">
            <BreadcrumbNavigation />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Transaksi Penjualan</h1>
                <p className="text-text-secondary mt-1">
                  Proses transaksi penjualan dengan cepat dan efisien.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SalesForm menuItems={menuItems} onAddToCart={handleAddToCart} />
              </div>
              <div className="lg:col-span-1">
                <OrderSummary
                  cart={cart}
                  menuItems={menuItems} // Add this prop
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  onProcessPayment={handleProcessPayment}
                  isLoading={isLoading}
                  isEmployeeMeal={isEmployeeMeal}
                  setIsEmployeeMeal={setIsEmployeeMeal}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SalesTransactionProcessing;