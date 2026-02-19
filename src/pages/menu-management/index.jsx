import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import NavigationHeader from '../../components/ui/NavigationHeader';

import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import AddMenuItemForm from './components/AddMenuItemForm';
import MenuItemsTable from './components/MenuItemsTable';
import MenuSummaryCards from './components/MenuSummaryCards';
import MenuSearchAndFilter from './components/MenuSearchAndFilter';
import EditMenuItemModal from './components/EditMenuItemModal';
import AddMenuItemModal from './components/AddMenuItemModal';
import RecipeManagementModal from './RecipeManagementModal'; // Import the new modal
import Pagination from '../../components/ui/Pagination'; // Add this import

import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import NotificationBell from '../../components/ui/NotificationBell';
import authFetch from '../../utils/authFetch'; // Add this import
import { useNavigate } from 'react-router-dom';
import AdminMobileHeader from '../../components/ui/AdminMobileHeader';

const apiUrl = import.meta.env.VITE_API_URL;

import { useTheme } from '../../contexts/ThemeContext';

const MenuManagement = ({ headerTitle }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]); // State for all menu items
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState(null); // New state for user role
  const [notification, setNotification] = useState(null);
  const [editingMenuItem, setEditingMenuItem] = useState(null); // State for item being edited
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // State for adding new item
  const [isRecipeModalOpen, setRecipeModalOpen] = useState(false); // State for recipe modal
  const [selectedMenuItemForRecipe, setSelectedMenuItemForRecipe] = useState(null); // State for recipe item
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Global settings state
  const [globalIgnoreStock, setGlobalIgnoreStock] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const fetchGlobalSettings = useCallback(async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/restaurant-settings`);
      const data = await response.json();
      if (response.ok && data.message === 'success') {
        setGlobalIgnoreStock(!!data.data.ignore_stock);
      }
    } catch (error) {
      console.error("Error fetching global settings:", error);
    }
  }, []);

  const handleToggleGlobalIgnoreStock = async () => {
    const newValue = !globalIgnoreStock;
    setGlobalIgnoreStock(newValue);
    setIsUpdatingSettings(true);

    try {
      const response = await authFetch(`${apiUrl}/api/restaurant-settings/ignore-stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ignore_stock: newValue }),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui pengaturan');
      }
      showNotification(newValue ? 'Mode Abaikan Stok Aktif secara Global' : 'Pengecekan Stok Aktif secara Global');
    } catch (error) {
      setGlobalIgnoreStock(!newValue);
      showError(`Gagal: ${error.message}`);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

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
    fetchGlobalSettings(); // Fetch global ignore_stock configuration
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
      is_hidden: itemData.is_hidden ? 1 : 0, // Include is_hidden
      options: itemData.options || [], // Include options
      description: itemData.description,
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

  const handleUpdateItem = useCallback(async (id, updatedData) => {
    const dataToSend = {
      name: updatedData.name,
      price: parseFloat(updatedData.price),
      stock: parseInt(updatedData.stock),
      category: updatedData.category,
      hpp: parseFloat(updatedData.hpp || 0),
      discount: parseFloat(updatedData.discount || 0),
      is_featured: updatedData.is_featured ? 1 : 0, // Ensure 0 or 1
      is_hidden: updatedData.is_hidden ? 1 : 0, // Include is_hidden
      options: updatedData.options || [], // Include options
      description: updatedData.description,
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
  }, [currentPage, activeFilter]);

  const handleDeleteItem = useCallback(async (id) => {
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
  }, [currentPage, activeFilter]);

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

  const handleEditMenuItem = useCallback((item) => {
    setEditingMenuItem(item);
  }, []);

  const handleOpenRecipeModal = useCallback((item) => {
    setSelectedMenuItemForRecipe(item);
    setRecipeModalOpen(true);
  }, []);

  const handleCloseRecipeModal = () => {
    setRecipeModalOpen(false);
    setSelectedMenuItemForRecipe(null);
  };


  const handleMoveItem = useCallback((id, direction) => {
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
  }, []);

  const filteredMenuItems = (() => {
    const term = searchTerm.toLowerCase();

    // For Stock Filters or Search, use Client-Side Filtering on ALL items
    // This overcomes the limitation of server-side pagination for these cases
    if (['available', 'low', 'out'].includes(activeFilter) || term) {
      return allMenuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(term);

        let matchesFilter = true;

        // Apply Category Filter if active
        if (['makanan', 'minuman', 'lainnya'].includes(activeFilter)) {
          matchesFilter = item.category === activeFilter;
        }
        // Apply Stock Filter if active
        else if (activeFilter === 'available') matchesFilter = item.stock > 5;
        else if (activeFilter === 'low') matchesFilter = item.stock <= 5 && item.stock > 0;
        else if (activeFilter === 'out') matchesFilter = item.stock === 0;

        return matchesSearch && matchesFilter;
      });
    }

    // Default: Use Server-Side Paginated Items
    return menuItems;
  })();

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
        <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} hideMobileHeader={true} />
      )}

      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[1002] ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {notification.message}
        </div>
      )}

      <main className={`${theme === 'default' ? 'pt-0 lg:pt-16' : ''} pb-24 lg:pb-8`}>
        {/* Admin Mobile Header Template */}
        {theme === 'default' && (
          <AdminMobileHeader
            title="Atur Menu"
            subtitle={allMenuItems.length > 0 ? `${allMenuItems.length} Produk` : 'Warung'}
            badgeText="Inventori Warung"
            stickyTitle={headerTitle || 'Kelola Menu'}
            actions={[
              { label: 'Tambah Menu', icon: 'Plus', onClick: () => setIsAddModalOpen(true) },
              { label: 'Status Stok', icon: 'Share2', onClick: handleShareStock }
            ]}
          />
        )}

        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 space-y-6 lg:space-y-8" : "space-y-6"}>
          {/* Breadcrumb - Desktop Only */}
          <div className="mb-6 hidden lg:block">
            <BreadcrumbNavigation />
          </div>

          {/* Page Header - Desktop Only */}
          <div className="mb-8 lg:mb-6 hidden lg:flex lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                Kelola Menu
              </h1>
              <p className="text-sm text-text-secondary mt-1">Atur produk, stok, dan harga warung Anda.</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Global Ignore Stock Toggle (Desktop) */}
              <div
                className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300 cursor-pointer select-none
                  ${globalIgnoreStock
                    ? 'bg-red-50 border-red-200 text-red-700 shadow-sm shadow-red-100'
                    : 'bg-green-50 border-green-200 text-green-700 shadow-sm shadow-green-100'}`}
                onClick={handleToggleGlobalIgnoreStock}
              >
                <div className={`p-2 rounded-xl transition-colors ${globalIgnoreStock ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
                  <Icon name="Package" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Status Stok Global</span>
                  <span className="text-xs font-bold whitespace-nowrap">
                    {globalIgnoreStock ? 'Abaikan Stok Aktif' : 'Pengecekan Stok Aktif'}
                  </span>
                </div>
                <div className={`ml-2 w-10 h-6 rounded-full relative transition-all duration-300 ${globalIgnoreStock ? 'bg-red-500' : 'bg-gray-200 shadow-inner'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ${globalIgnoreStock ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#118eea] hover:bg-[#0d70ba] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Icon name="Plus" size={16} />
                </div>
                Tambah Menu Baru
              </button>
            </div>
          </div>

          {/* Global Ignore Stock Toggle (Mobile) */}
          <div className="lg:hidden mb-6">
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-98
                ${globalIgnoreStock ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}
              onClick={handleToggleGlobalIgnoreStock}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${globalIgnoreStock ? 'bg-red-500' : 'bg-green-600'} text-white shadow-md`}>
                  <Icon name="Package" size={20} />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${globalIgnoreStock ? 'text-red-900' : 'text-green-900'}`}>
                    Abaikan Stok Global
                  </h3>
                  <p className={`text-[11px] font-medium opacity-70 ${globalIgnoreStock ? 'text-red-700' : 'text-green-700'}`}>
                    {globalIgnoreStock ? 'Transaksi diizinkan walau stok 0' : 'Sistem akan mengecek ketersediaan stok'}
                  </p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-all duration-300 ${globalIgnoreStock ? 'bg-red-500' : 'bg-gray-300 shadow-inner'}`}>
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${globalIgnoreStock ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>

          {/* Search and Filter - Overlapping Header */}
          <div className="lg:mt-0 lg:pt-4 relative z-30 mb-6">
            <MenuSearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              menuItems={allMenuItems}
              onExportData={handleExportData}
              onShareStock={handleShareStock}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>

          <div id="add-menu-form" className="relative z-10">
            {/* Summary Cards */}
            <MenuSummaryCards menuItems={allMenuItems} />
          </div>

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
          <div className="mt-6 pb-20">
            <Pagination
              itemsPerPage={itemsPerPage}
              totalItems={pagination?.totalItems || 0}
              paginate={paginate}
              currentPage={currentPage}
            />
          </div>

          {/* Floating Action Button for Mobile */}
          <div className="lg:hidden fixed bottom-24 right-6 z-50">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-14 h-14 bg-[#118eea] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <Icon name="Plus" size={28} />
            </button>
          </div>
        </div >
      </main >

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

      <AddMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddItem}
        userRole={userRole}
      />

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