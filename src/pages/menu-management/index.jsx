import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import NavigationHeader from '../../components/ui/NavigationHeader';

import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import AddMenuItemForm from './components/AddMenuItemForm';
import MenuItemsTable from './components/MenuItemsTable';
import MenuSummaryCards from './components/MenuSummaryCards';
import MenuSearchAndFilter from './components/MenuSearchAndFilter';

import Button from '../../components/ui/Button';
import authFetch from '../../utils/authFetch'; // Add this import

const apiUrl = import.meta.env.VITE_API_URL;

const MenuManagement = ({ headerTitle }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState(null); // New state for user role
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Hide after 3 seconds
  };

  const fetchMenuItems = async () => { // Moved outside useEffect
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
        console.error("Error decoding token in MenuManagement:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  

  const handleAddItem = async (newItem) => {
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      const result = await response.json();
      if (result.message === 'success') {
        setMenuItems(prev => [...prev, newItem]);
      } else {
        console.error('Failed to add item:', result.error);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateItem = async (id, updatedItem) => {
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      });
      const result = await response.json();
      if (result.message === 'success') {
        setMenuItems(prev => 
          prev.map(item => item.id === id ? { ...item, ...updatedItem } : item)
        );
      } else {
        console.error('Failed to update item:', result.error);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.message === 'deleted') {
        setMenuItems(prev => prev.filter(item => item.id !== id));
      } else {
        console.error('Failed to delete item:', result.error);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      const deletePromises = ids.map(id => 
        authFetch(`${apiUrl}/api/menu-items/${id}`, {
          method: 'DELETE',
        })
      );
      const responses = await Promise.all(deletePromises);
      
      const successfulDeletes = responses.every(res => res.ok);

      if (successfulDeletes) {
        setMenuItems(prev => prev.filter(item => !ids.includes(item.id)));
      } else {
        console.error('Failed to delete some items.');
      }
    } catch (error) {
      console.error('Error bulk deleting items:', error);
    }
  };

  const handleExportData = (format) => {
    try {
      // The actual export is now handled in MenuSearchAndFilter.jsx
      // This function now only handles the notification.

      if (format === 'excel') {
        showNotification('Data menu berhasil diekspor ke Excel!', 'success');
      } else if (format === 'csv') {
        showNotification('Data menu berhasil diekspor ke CSV!', 'success');
      } else if (format === 'pdf') {
        showNotification('Data menu berhasil diekspor ke PDF!', 'success');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotification('Gagal mengekspor data. Silakan coba lagi.', 'error');
    }
  };

  

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle} />
        <div className="pt-16">
          
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Memuat data menu...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Menu Management - Kasir Berkah 88</title>
        <meta name="description" content="Kelola menu dan inventori warung dengan mudah. Tambah, edit, dan hapus menu dengan tracking stok otomatis." />
      </Helmet>

      <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle} />
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="pt-16">
        
        
        <main className="container mx-auto px-4 lg:px-6 py-6 pb-20 lg:pb-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <BreadcrumbNavigation />
          </div>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Kelola Menu</h1>
            <p className="text-text-secondary">
              Tambah, edit, dan kelola menu warung Anda dengan mudah. 
              Pantau stok dan harga secara real-time.
            </p>
          </div>

          {/* Summary Cards */}
          <MenuSummaryCards menuItems={menuItems} />

          {/* Add Menu Form */}
          <AddMenuItemForm onAddItem={handleAddItem} userRole={userRole} />

          {/* Search and Filter */}
          <MenuSearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            menuItems={menuItems}
            onExportData={handleExportData}
          />

          {/* Menu Items Table */}
          <MenuItemsTable
            menuItems={menuItems}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onBulkDelete={handleBulkDelete}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            userRole={userRole}
          />
        </main>

        {/* Quick Action Panel */}
        
      </div>
    </div>
  );
};

export default MenuManagement;