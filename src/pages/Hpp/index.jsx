import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'react-hot-toast';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const Hpp = ({ headerTitle }) => {
  const { theme } = useTheme();
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch master bahan
  const fetchIngredients = async () => {
    try {
      const response = await authFetch('/api/hpp-ingredients');
      const result = await response.json();
      if (result.message === 'success') {
        setIngredients(result.data || []);
      }
    } catch (error) {
      console.error('Fetch ingredients error:', error);
    }
  };

  // Tambah master bahan baru
  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!newIngredient.trim()) return;
    try {
      const response = await authFetch('/api/hpp-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newIngredient.trim() })
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Bahan berhasil ditambahkan');
        setNewIngredient('');
        fetchIngredients();
      } else {
        toast.error(result.message || 'Gagal menambahkan bahan');
      }
    } catch (error) {
      toast.error('Gagal menambahkan bahan');
    }
  };

  // Hapus master bahan
  const handleDeleteIngredient = async (id) => {
    if (!window.confirm('Yakin ingin menghapus bahan ini?')) return;
    try {
      const response = await authFetch(`/api/hpp-ingredients/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Bahan berhasil dihapus');
        fetchIngredients();
      } else {
        toast.error('Gagal menghapus bahan');
      }
    } catch (error) {
      toast.error('Gagal menghapus bahan');
    }
  };

  // Fetch menu items from the server
  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/menu-items/all');
      const result = await response.json();
      if (result.message === 'success' && Array.isArray(result.data)) {
        const initializedItems = result.data.map(item => ({
          ...item,
          isEditing: false,
          // draft state saat edit
          draftComponents: Array.isArray(item.hpp_details) && item.hpp_details.length > 0
            ? item.hpp_details.map(c => ({ ...c }))
            : [{ name: '', cost: '' }],
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
    fetchIngredients();
  }, []);

  // Hitung total HPP dari komponen draft
  const calcTotalFromComponents = (components) =>
    components.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);

  // Toggle edit mode
  const handleEdit = (itemId) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
            ...item,
            isEditing: true,
            draftComponents: Array.isArray(item.hpp_details) && item.hpp_details.length > 0
              ? item.hpp_details.map(c => ({ ...c }))
              : [{ name: '', cost: '' }],
          }
          : { ...item, isEditing: false }
      )
    );
  };

  const handleCancel = (itemId) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, isEditing: false } : item
      )
    );
  };

  // Update satu komponen
  const handleComponentChange = (itemId, index, field, value) => {
    setMenuItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const newComps = item.draftComponents.map((c, i) =>
          i === index ? { ...c, [field]: value } : c
        );
        return { ...item, draftComponents: newComps };
      })
    );
  };

  // Tambah komponen baru
  const handleAddComponent = (itemId) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, draftComponents: [...item.draftComponents, { name: '', cost: '' }] }
          : item
      )
    );
  };

  // Hapus komponen
  const handleRemoveComponent = (itemId, index) => {
    setMenuItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const newComps = item.draftComponents.filter((_, i) => i !== index);
        return { ...item, draftComponents: newComps.length > 0 ? newComps : [{ name: '', cost: '' }] };
      })
    );
  };

  // Simpan ke server
  const handleSave = async (itemId) => {
    const itemToSave = menuItems.find(item => item.id === itemId);
    if (!itemToSave) return;

    const validComponents = itemToSave.draftComponents.filter(c => c.name.trim() !== '');
    const totalHpp = calcTotalFromComponents(validComponents);

    try {
      const response = await authFetch(`/api/menu-items/${itemToSave.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hpp: totalHpp,
          hpp_details: validComponents,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui HPP di server.');
      }

      toast.success('Detail HPP berhasil disimpan!');
      fetchMenuItems();
    } catch (error) {
      toast.error(error.message || 'Gagal memperbarui HPP.');
      console.error('Save HPP Error:', error);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // Komponen HPP akan dirender secara inline untuk menghindari re-render yang merusak fokus

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && (
        <NavigationHeader headerTitle={headerTitle || 'Kalkulator HPP'} />
      )}
      <main className={`pb-20 lg:pb-8 ${theme === 'default' ? 'pt-16' : ''}`}>
        <div className={theme === 'default' ? 'max-w-7xl mx-auto px-4 lg:px-6' : ''}>
          <div className="mb-4 hidden md:block">
            <BreadcrumbNavigation />
          </div>
          <h1 className="text-2xl font-bold mb-1 text-text-primary">Kalkulator HPP (Harga Pokok Penjualan)</h1>
          <p className="text-sm text-gray-500 mb-5">Input rincian biaya per komponen untuk setiap menu. Total HPP akan dihitung otomatis.</p>

          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-text-secondary">Memuat data...</p>
            </div>
          ) : (
            <>
              {/* Card Master Bahan */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm p-5 mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Master Daftar Bahan</h2>
                <form onSubmit={handleAddIngredient} className="flex gap-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Nama bahan baru (contoh: Sambal, Minyak)"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <FaPlus className="mr-2 w-3 h-3" /> Tambah Bahan
                  </Button>
                </form>

                {ingredients.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Belum ada master bahan.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map(ing => (
                      <span key={ing.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                        {ing.name}
                        <button onClick={() => handleDeleteIngredient(ing.id)} className="text-indigo-400 hover:text-red-500 transition-colors">
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {menuItems.map((item) => {
                  const totalHpp = item.isEditing
                    ? calcTotalFromComponents(item.draftComponents)
                    : (item.hpp || 0);
                  const laba = item.price - totalHpp;

                  return (
                    <div
                      key={item.id}
                      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
                    >
                      {/* Header baris menu */}
                      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-semibold text-base text-card-foreground">{item.name}</h3>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-0.5">
                                <span>Harga Jual: <strong className="text-text-primary">{formatCurrency(item.price)}</strong></span>
                                <span>Total HPP: <strong className="text-orange-600">{formatCurrency(totalHpp)}</strong></span>
                                <span className={`font-semibold ${laba < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                  Laba: {formatCurrency(laba)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          {item.isEditing ? (
                            <div className="flex gap-2">
                              <Button onClick={() => handleSave(item.id)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <FaSave className="mr-1.5 w-3 h-3" /> Simpan
                              </Button>
                              <Button onClick={() => handleCancel(item.id)} variant="outline" size="sm">
                                <FaTimes className="mr-1.5 w-3 h-3" /> Batal
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => handleEdit(item.id)} variant="secondary" size="sm">
                              <FaEdit className="mr-1.5 w-3 h-3" /> Edit HPP
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Body: komponen HPP */}
                      <div className="p-4">
                        {item.isEditing ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              Rincian Komponen Biaya (HPP)
                            </p>
                            {item.draftComponents.map((comp, index) => (
                              <div key={`${item.id}-comp-${index}`} className="flex gap-2 items-center mb-2">
                                <div className="flex-1">
                                  <select
                                    value={comp.name}
                                    onChange={(e) => handleComponentChange(item.id, index, 'name', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <option value="">-- Pilih Bahan --</option>
                                    {ingredients.map(ing => (
                                      <option key={ing.id} value={ing.name}>{ing.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="w-36">
                                  <Input
                                    type="number"
                                    value={comp.cost}
                                    onChange={(e) => handleComponentChange(item.id, index, 'cost', e.target.value)}
                                    placeholder="Biaya (Rp)"
                                    className="w-full text-sm"
                                    min="0"
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveComponent(item.id, index)}
                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                  title="Hapus komponen"
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => handleAddComponent(item.id)}
                              className="mt-2 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                            >
                              <FaPlus className="w-3 h-3" /> Tambah Komponen
                            </button>
                            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                              <span className="text-sm text-gray-500">Total HPP Terhitung:</span>
                              <span className="text-lg font-bold text-orange-600">
                                {formatCurrency(calcTotalFromComponents(item.draftComponents))}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {Array.isArray(item.hpp_details) && item.hpp_details.length > 0 ? (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rincian Komponen</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {item.hpp_details.map((comp, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
                                      <span className="text-gray-600 dark:text-gray-300">{comp.name}</span>
                                      <span className="font-semibold text-orange-600 ml-2">{formatCurrency(comp.cost)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 italic">
                                Belum ada rincian komponen HPP. Klik "Edit HPP" untuk menambahkan.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Hpp;
