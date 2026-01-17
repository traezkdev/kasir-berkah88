import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'react-hot-toast';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useTheme } from '../../contexts/ThemeContext';

const Hpp = ({ headerTitle }) => {
  const { theme } = useTheme();
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch menu items from the server
  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/menu-items/all');
      const result = await response.json();
      if (result.message === 'success' && Array.isArray(result.data)) {
        // Initialize each item with editing state properties
        const initializedItems = result.data.map(item => ({
          ...item,
          isEditing: false,
          draftHpp: item.hpp || 0,
        }));
        setMenuItems(initializedItems);
      } else {
        toast.error('Gagal memuat item menu.');
      }
    } catch (error) {
      toast.error('Gagal memuat item menu.');
      console.error('Fetch Menu Items Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Toggle edit mode for a specific item
  const handleEdit = (itemId) => {
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, isEditing: true, draftHpp: item.hpp || 0 } // Start editing this one
          : { ...item, isEditing: false } // Ensure others are not in edit mode
      )
    );
  };

  // Cancel editing for a specific item
  const handleCancel = (itemId) => {
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, isEditing: false, draftHpp: item.hpp || 0 } // Revert changes by resetting draftHpp from original hpp
          : item
      )
    );
  };

  // Handle changes in the HPP input field
  const handleHppChange = (value, itemId) => {
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, draftHpp: value } : item
      )
    );
  };

  // Save the updated HPP value to the server
  const handleSave = async (itemId) => {
    const itemToSave = menuItems.find(item => item.id === itemId);
    if (!itemToSave) return;

    try {
      const response = await authFetch(`/api/menu-items/${itemToSave.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send only the updated hpp value
        body: JSON.stringify({ hpp: itemToSave.draftHpp }),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui HPP di server.');
      }

      toast.success('HPP berhasil diperbarui.');
      // Refresh data from server to ensure consistency
      fetchMenuItems();
    } catch (error) {
      toast.error(error.message || 'Gagal memperbarui HPP.');
      console.error('Save HPP Error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && (
        <NavigationHeader headerTitle={headerTitle || 'Kalkulator HPP'} />
      )}
      <main className={`pb-20 lg:pb-8 ${theme === 'default' ? 'pt-16' : ''}`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
          <div className="mb-4 hidden md:block">
            <BreadcrumbNavigation />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-text-primary">Kalkulator HPP (Harga Pokok Penjualan)</h1>

          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-text-secondary">Memuat data...</p>
            </div>
          ) : (
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Menu</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Harga Jual</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">HPP</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Laba</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {menuItems.map((item) => (
                      <tr key={item.id} className="text-card-foreground hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.isEditing ? (
                            <Input
                              type="number"
                              value={item.draftHpp}
                              onChange={(e) => handleHppChange(e.target.value, item.id)}
                              className="w-32"
                              placeholder="Masukkan HPP"
                            />
                          ) : (
                            formatCurrency(item.hpp || 0)
                          )}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap font-semibold ${item.price - (item.hpp || 0) < 0 ? 'text-destructive' : 'text-success'}`}>
                          {formatCurrency(item.price - (item.hpp || 0))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {item.isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <Button onClick={() => handleSave(item.id)} size="sm">Simpan</Button>
                              <Button onClick={() => handleCancel(item.id)} variant="outline" size="sm">Batal</Button>
                            </div>
                          ) : (
                            <Button onClick={() => handleEdit(item.id)} variant="secondary" size="sm">Edit HPP</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Cards */}
              <div className="md:hidden space-y-4">
                {menuItems.map((item) => (
                  <div key={item.id} className="border border-border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-card-foreground">{item.name}</h3>
                      {!item.isEditing && (
                        <Button onClick={() => handleEdit(item.id)} variant="secondary" size="sm">Edit HPP</Button>
                      )}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga Jual:</span>
                        <span className="font-medium text-text-primary">{formatCurrency(item.price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">HPP:</span>
                        {item.isEditing ? (
                          <Input
                            type="number"
                            value={item.draftHpp}
                            onChange={(e) => handleHppChange(e.target.value, item.id)}
                            className="w-32 py-1"
                            placeholder="Masukkan HPP"
                          />
                        ) : (
                          <span className="font-medium text-text-primary">{formatCurrency(item.hpp || 0)}</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Laba:</span>
                        <span className={`font-semibold ${item.price - (item.hpp || 0) < 0 ? 'text-destructive' : 'text-success'}`}>
                          {formatCurrency(item.price - (item.hpp || 0))}
                        </span>
                      </div>
                    </div>

                    {item.isEditing && (
                      <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => handleCancel(item.id)} variant="outline" size="sm">Batal</Button>
                        <Button onClick={() => handleSave(item.id)} size="sm">Simpan</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Hpp;
