import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import authFetch from '../../utils/authFetch';
import { Trash2, Edit, PlusCircle } from 'lucide-react';

const CategorySettings = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.data);
      } else {
        throw new Error(data.error || 'Gagal memuat kategori.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Nama kategori tidak boleh kosong.');
      return;
    }
    setError('');
    setMessage('');
    try {
      const response = await authFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Kategori berhasil ditambahkan.');
        setNewCategoryName('');
        fetchCategories(); // Refresh list
      } else {
        throw new Error(data.error || 'Gagal menambahkan kategori.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      setError('');
      setMessage('');
      try {
        const response = await authFetch(`/api/categories/${categoryId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setMessage('Kategori berhasil dihapus.');
          fetchCategories(); // Refresh list
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Gagal menghapus kategori.');
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategoryName.trim()) {
      setError('Nama kategori tidak boleh kosong.');
      return;
    }
    setError('');
    setMessage('');
    try {
      const response = await authFetch(`/api/categories/${editingCategoryId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingCategoryName }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Kategori berhasil diperbarui.');
        setEditingCategoryId(null);
        setEditingCategoryName('');
        fetchCategories(); // Refresh list
      } else {
        throw new Error(data.error || 'Gagal memperbarui kategori.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setError('');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
        Kelola Kategori Menu
      </h3>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="flex items-center space-x-2">
        <Input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nama Kategori Baru"
          className="flex-grow"
        />
        <Button type="submit" variant="primary" size="icon">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </form>

      {/* Categories List */}
      <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
        {isLoading ? (
          <p>Memuat...</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
              {editingCategoryId === category.id ? (
                <form onSubmit={handleUpdateCategory} className="flex-grow flex items-center space-x-2">
                  <Input
                    type="text"
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    className="flex-grow"
                  />
                  <Button type="submit" variant="ghost" size="sm">Simpan</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCategoryId(null)}>Batal</Button>
                </form>
              ) : (
                <>
                  <span className="text-gray-800 dark:text-gray-200">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => startEditing(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Tutup</Button>
      </div>
    </div>
  );
};

export default CategorySettings;
