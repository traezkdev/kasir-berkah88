import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import NavigationHeader from '../../components/ui/NavigationHeader';

import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import AddMenuItemForm from './components/AddMenuItemForm';
import MenuItemsTable from './components/MenuItemsTable';
import MenuSummaryCards from './components/MenuSummaryCards';
import MenuSearchAndFilter from './components/MenuSearchAndFilter';
import EditMenuItemModal from './components/EditMenuItemModal';
import RecipeManagementModal from './RecipeManagementModal'; // Import the new modal
import Pagination from '../../components/ui/Pagination'; // Add this import

import Button from '../../components/ui/Button';
import authFetch from '../../utils/authFetch'; // Add this import

const apiUrl = import.meta.env.VITE_API_URL;

import { useTheme } from '../../contexts/ThemeContext';

const MenuManagement = ({ headerTitle }) => {
  const { theme } = useTheme();
  const [menuItems, setMenuItems] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]); // State for all menu items
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState(null); // New state for user role
  const [notification, setNotification] = useState(null);
  const [editingMenuItem, setEditingMenuItem] = useState(null); // State for item being edited
  const [isRecipeModalOpen, setRecipeModalOpen] = useState(false); // State for recipe modal
  const [selectedMenuItemForRecipe, setSelectedMenuItemForRecipe] = useState(null); // State for recipe item
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Hide after 3 seconds
  };

  const showError = (message) => {
    showNotification(message, 'error');
  };

  const fetchAllMenuItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items/all`);
      const data = await response.json();
      if (data.message === 'success') {
        setAllMenuItems(data.data);
      } else {
        console.error('Failed to fetch all menu items:', data.error);
      }
    } catch (error) {
      console.error('Error fetching all menu items:', error);
    }
  };

  const fetchMenuItems = async (page, filter) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoading(true);

    const params = new URLSearchParams({
      page: page,
      limit: itemsPerPage,
    });

    // Only add category filter if it's one of the specific categories for the backend
    if (['makanan', 'minuman', 'lainnya'].includes(filter)) {
      params.append('category', filter);
    }

    try {
      const response = await authFetch(`${apiUrl}/api/menu-items?${params.toString()}`);
      const data = await response.json();
      if (data.message === 'success') {
        setMenuItems(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch menu items:', data.error);
        setMenuItems([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems(currentPage, activeFilter);
  }, [currentPage, activeFilter]);

  useEffect(() => {
    fetchAllMenuItems(); // Fetch all items on initial load
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



  const handleAddItem = async (itemData) => {
    const newId = `M-${Date.now()}`;
    const dataToSend = {
      id: newId,
      name: itemData.name,
      price: parseFloat(itemData.price),
      stock: parseInt(itemData.stock),
      category: itemData.category,
      hpp: parseFloat(itemData.hpp || 0),
      discount: parseFloat(itemData.discount || 0),
      is_featured: itemData.is_featured ? 1 : 0, // Ensure 0 or 1
      options: itemData.options || [], // Include options
    };

    let body;
    let headers = {};

    if (itemData.image) {
      const formData = new FormData();
      formData.append('image', itemData.image);
      // Append other data as a JSON string
      formData.append('data', JSON.stringify(dataToSend));
      body = formData;
      // No Content-Type header for FormData, browser sets it automatically
    } else {
      // Send as JSON if no image
      body = JSON.stringify(dataToSend);
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await authFetch(`${apiUrl}/api/menu-items`, {
        method: 'POST',
        headers: headers,
        body: body,
      });
      const result = await response.json();
      if (result.message === 'success') {
        fetchMenuItems(1, 'all');
        fetchAllMenuItems(); // Refetch all items
        setCurrentPage(1);
        setActiveFilter('all');
      } else {
        console.error('Failed to add item:', result.error);
        showNotification(`Gagal menambah item: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      showNotification(`Error menambah item: ${error.message}`, 'error');
    }
  };

  const handleUpdateItem = async (id, updatedData) => {
    const dataToSend = {
      name: updatedData.name,
      price: parseFloat(updatedData.price),
      stock: parseInt(updatedData.stock),
      category: updatedData.category,
      hpp: parseFloat(updatedData.hpp || 0),
      discount: parseFloat(updatedData.discount || 0),
      is_featured: updatedData.is_featured ? 1 : 0, // Ensure 0 or 1
      options: updatedData.options || [], // Include options
    };
    let body;
    let headers = {};

    if (updatedData.image) {
      const formData = new FormData();
      formData.append('image', updatedData.image);
      // Append other data as a JSON string
      formData.append('data', JSON.stringify(dataToSend));
      body = formData;
    } else {
      // Send as JSON if no new image
      body = JSON.stringify(dataToSend);
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await authFetch(`${apiUrl}/api/menu-items/${id}`, {
        method: 'PUT',
        headers: headers,
        body: body,
      });
      const result = await response.json();
      if (result.message === 'success') {
        fetchMenuItems(currentPage, activeFilter);
        fetchAllMenuItems(); // Refetch all items
      } else {
        console.error('Failed to update item:', result.error);
        showNotification(`Gagal memperbarui item: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      showNotification(`Error memperbarui item: ${error.message}`, 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.message === 'deleted') {
        fetchMenuItems(currentPage, activeFilter);
        fetchAllMenuItems(); // Refetch all items
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
        fetchMenuItems(currentPage, activeFilter);
        fetchAllMenuItems(); // Refetch all items
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

  const handleShareStock = () => {
    const availableItems = allMenuItems.filter(item => item.stock > 0); // Use allMenuItems

    if (availableItems.length === 0) {
      showNotification('Tidak ada stok yang tersedia untuk dibagikan.', 'error');
      return;
    }

    const now = new Date();
    const date = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const time = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    let message = `*Daftar Stok Tersedia - ${date} Pukul ${time} WIB*

`;
    message += availableItems
      .map(item => `• ${item.name}: *${item.stock}*`)
      .join('\n');
    message += `

---
Powered by Kasir Berkah 88`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    showNotification('Membuka WhatsApp untuk membagikan stok...', 'success');
  };



  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleEditMenuItem = (item) => {
    setEditingMenuItem(item);
  };

  const handleOpenRecipeModal = (item) => {
    setSelectedMenuItemForRecipe(item);
    setRecipeModalOpen(true);
  };

  const handleCloseRecipeModal = () => {
    setRecipeModalOpen(false);
    setSelectedMenuItemForRecipe(null);
  };


  const handleMoveItem = (id, direction) => {
    setMenuItems(prevItems => {
      const newItems = [...prevItems];
      const index = newItems.findIndex(item => item.id === id);

      if (index === -1) return prevItems;

      if (direction === 'up' && index > 0) {
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      } else if (direction === 'down' && index < newItems.length - 1) {
        [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
      }
      // Panggil API untuk menyimpan urutan baru
      const itemIds = newItems.map(item => item.id);
      authFetch(`${apiUrl}/api/menu-items/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      })
        .then(response => response.json())
        .then(result => {
          if (result.message === 'success') {
            showNotification('Urutan menu berhasil diperbarui!', 'success');
          } else {
            console.error('Failed to reorder items:', result.error);
            showNotification(`Gagal memperbarui urutan menu: ${result.error}`, 'error');
          }
        })
        .catch(error => {
          console.error('Error reordering items:', error);
          showNotification(`Error memperbarui urutan menu: ${error.message}`, 'error');
        });

      return newItems;
    });
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

    // The backend handles category filtering. Here we only handle search and stock status.
    if (activeFilter === 'all' || ['makanan', 'minuman', 'lainnya'].includes(activeFilter)) {
      return matchesSearch;
    }
    if (activeFilter === 'available') {
      return matchesSearch && item.stock > 5;
    }
    if (activeFilter === 'low') {
      return matchesSearch && item.stock <= 5 && item.stock > 0;
    }
    if (activeFilter === 'out') {
      return matchesSearch && item.stock === 0;
    }
    return false;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />}
        <div className={`${theme === 'default' ? 'pt-16' : ''}`}>

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
    <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50 lg:bg-background' : ''}`}>
      <Helmet>
        <title>Menu Management - Kasir Berkah 88</title>
        <meta name="description" content="Kelola menu dan inventori warung dengan mudah. Tambah, edit, dan hapus menu dengan tracking stok otomatis." />
      </Helmet>


      {theme === 'default' && (
        <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />
      )}

      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[1002] ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {notification.message}
        </div>
      )}

      <main className={`${theme === 'default' ? 'pt-18 lg:pt-16' : ''} pb-24 lg:pb-8`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 pt-2 space-y-6 lg:space-y-8" : "space-y-6"}>
          {/* Breadcrumb */}
          <div className="mb-6 hidden md:block">
            <BreadcrumbNavigation />
          </div>

          {/* Page Header */}
          <div className="mb-8 lg:mb-6">
            <h1 className="text-2xl lg:text-3xl font-black text-text-primary mt-4 tracking-tighter uppercase lg:normal-case">
              Kelola Menu
            </h1>
            <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 lg:hidden"></div>
            <p className="text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
              Tambah, edit, dan kelola menu warung Anda dengan mudah.
            </p>
          </div>

          {/* Summary Cards */}
          <MenuSummaryCards menuItems={allMenuItems} />

          {/* Add Menu Form */}
          <AddMenuItemForm onAddItem={handleAddItem} userRole={userRole} />

          {/* Search and Filter */}
          <MenuSearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            menuItems={allMenuItems}
            onExportData={handleExportData}
            onShareStock={handleShareStock}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {/* Menu Items Table */}
          <MenuItemsTable
            menuItems={filteredMenuItems}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onBulkDelete={handleBulkDelete}
            userRole={userRole}
            apiUrl={apiUrl}
            onEditItem={handleEditMenuItem}
            onMoveItem={handleMoveItem}
            onOpenRecipeModal={handleOpenRecipeModal}
          />

          {/* Pagination */}
          <div className="mt-6">
            <Pagination
              itemsPerPage={itemsPerPage}
              totalItems={pagination?.totalItems || 0}
              paginate={paginate}
              currentPage={currentPage}
            />
          </div>
        </div>
      </main>

      {/* Quick Action Panel */}


      {
        editingMenuItem && (
          <EditMenuItemModal
            isOpen={!!editingMenuItem}
            onClose={() => setEditingMenuItem(null)}
            menuItem={editingMenuItem}
            onSave={handleUpdateItem}
            userRole={userRole}
          />
        )
      }

      {
        selectedMenuItemForRecipe && (
          <RecipeManagementModal
            isOpen={isRecipeModalOpen}
            onClose={handleCloseRecipeModal}
            menuItem={selectedMenuItemForRecipe}
            showMessage={showNotification}
            showError={showError}
          />
        )
      }
    </div >
  );
};

export default MenuManagement;