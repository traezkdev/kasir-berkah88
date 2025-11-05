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
  const [editingId, setEditingId] = useState(null);
  const [hppValue, setHppValue] = useState('');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await authFetch('/api/menu-items');
      const result = await response.json();
      if (result.message === 'success') {
        setMenuItems(result.data);
      } else {
        toast.error('Gagal memuat item menu.');
      }
    } catch (error) {
      toast.error('Gagal memuat item menu.');
      console.error(error);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setHppValue(item.hpp || '');
  };

  const handleCancel = () => {
    setEditingId(null);
    setHppValue('');
  };

  const handleSave = async (itemId) => {
    try {
      await authFetch(`/api/menu-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hpp: hppValue }),
      });
      toast.success('HPP berhasil diperbarui.');
      setEditingId(null);
      fetchMenuItems(); // Refresh data
    } catch (error) {
      toast.error('Gagal memperbarui HPP.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {theme === 'default' && (
        <NavigationHeader headerTitle={headerTitle} />
      )}
      <main className={`pb-20 lg:pb-8 ${theme === 'default' ? 'pt-16' : ''}`}>
        <div className={theme === 'default' ? "container mx-auto p-4" : ""}>
          <BreadcrumbNavigation className="mb-4" />
          <h1 className="text-2xl font-bold mb-4">Kalkulator HPP (Harga Pokok Penjualan)</h1>
          <div className="bg-background-card p-4 rounded-lg shadow">
            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Menu</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Harga Jual</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">HPP</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Laba</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {Array.isArray(menuItems) && menuItems.map((item) => (
                    <tr key={item.id} className="text-card-foreground">
                      <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">Rp {Number(item.price).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={hppValue}
                            onChange={(e) => setHppValue(e.target.value)}
                            className="w-32"
                          />
                        ) : (
                          `Rp ${Number(item.hpp || 0).toLocaleString()}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">Rp {Number(item.price - (item.hpp || 0)).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === item.id ? (
                          <>
                            <Button onClick={() => handleSave(item.id)} size="sm" className="mr-2">Simpan</Button>
                            <Button onClick={handleCancel} variant="outline" size="sm">Batal</Button>
                          </>
                        ) : (
                          <Button onClick={() => handleEdit(item)} variant="secondary" size="sm">Edit HPP</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
              {Array.isArray(menuItems) && menuItems.map((item) => (
                <div key={item.id} className="bg-card border border-border p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-card-foreground mb-2">{item.name}</h3>
                    {editingId !== item.id && (
                      <Button onClick={() => handleEdit(item)} variant="secondary" size="sm">Edit HPP</Button>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Harga Jual:</span>
                      <span className="font-medium">Rp {Number(item.price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">HPP:</span>
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          value={hppValue}
                          onChange={(e) => setHppValue(e.target.value)}
                          className="w-32 py-1"
                        />
                      ) : (
                        <span className="font-medium">Rp {Number(item.hpp || 0).toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Laba:</span>
                      <span className="font-semibold text-green-500">Rp {Number(item.price - (item.hpp || 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  {editingId === item.id && (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button onClick={handleCancel} variant="outline" size="sm">Batal</Button>
                      <Button onClick={() => handleSave(item.id)} size="sm">Simpan</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Hpp;