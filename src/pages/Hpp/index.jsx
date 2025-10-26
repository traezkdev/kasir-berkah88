import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'react-hot-toast';
import NavigationHeader from '../../components/ui/NavigationHeader';

const Hpp = ({ headerTitle }) => {
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
      <NavigationHeader headerTitle={headerTitle} />
      <div className="pt-16">
        <main className="pb-20 lg:pb-8">
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Kalkulator HPP (Harga Pokok Penjualan)</h1>
            <div className="bg-background-card p-4 rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Nama Menu
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Harga Jual
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        HPP
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Laba
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Edit</span>
                      </th>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          Rp {Number(item.price - (item.hpp || 0)).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingId === item.id ? (
                            <>
                              <Button onClick={() => handleSave(item.id)} size="sm" className="mr-2">
                                Simpan
                              </Button>
                              <Button onClick={handleCancel} variant="outline" size="sm">
                                Batal
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => handleEdit(item)} variant="ghost" size="sm">
                              Edit HPP
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Hpp;
