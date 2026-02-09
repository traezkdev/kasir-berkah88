import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AppIcon from '../../components/AppIcon';
import authFetch from '../../utils/authFetch';

const CategorySettings = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(null);
  const [newCategoryVisible, setNewCategoryVisible] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryIcon, setEditingCategoryIcon] = useState(null);
  const [previewIcon, setPreviewIcon] = useState(null);
  const [editingCategoryVisible, setEditingCategoryVisible] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL;

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

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('name', newCategoryName);
    formData.append('is_visible', newCategoryVisible);
    if (newCategoryIcon) {
      formData.append('icon', newCategoryIcon);
    }

    try {
      const response = await authFetch('/api/categories', {
        method: 'POST',
        // headers: { 'Content-Type': 'multipart/form-data' }, // Do NOT set Content-Type manually with FormData
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Kategori berhasil ditambahkan.');
        setNewCategoryName('');
        setNewCategoryVisible(true);
        setNewCategoryIcon(null);
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

  const handleToggleVisibility = async (category) => {
    const newStatus = !category.is_visible;
    // Optimistic update
    setCategories(categories.map(c => c.id === category.id ? { ...c, is_visible: newStatus } : c));

    try {
      const formData = new FormData();
      formData.append('name', category.name); // Name is required by backend validation currently
      formData.append('is_visible', newStatus);

      const response = await authFetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        // Revert if failed
        setCategories(categories.map(c => c.id === category.id ? { ...c, is_visible: !newStatus } : c));
        const data = await response.json();
        throw new Error(data.error || 'Gagal mengubah status visibilitas.');
      }
    } catch (err) {
      setError(err.message);
      // Revert if failed
      setCategories(categories.map(c => c.id === category.id ? { ...c, is_visible: !newStatus } : c));
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

    const formData = new FormData();
    formData.append('name', editingCategoryName);
    formData.append('is_visible', editingCategoryVisible);
    if (editingCategoryIcon) {
      formData.append('icon', editingCategoryIcon);
    }

    try {
      const response = await authFetch(`/api/categories/${editingCategoryId}`, {
        method: 'PUT',
        // headers: { 'Content-Type': 'multipart/form-data' }, // Do NOT set Content-Type manually with FormData
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Kategori berhasil diperbarui.');
        cancelEditing();
        fetchCategories(); // Refresh list
      } else {
        throw new Error(data.error || 'Gagal memperbarui kategori.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
    setEditingCategoryIcon(null);
    setPreviewIcon(null);
  };

  const startEditing = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategoryVisible(category.is_visible);
    // Set preview current icon
    if (category.icon) {
      setPreviewIcon(`${apiUrl}${category.icon}`);
    } else {
      setPreviewIcon(null);
    }
    setEditingCategoryIcon(null); // Reset new file
    setError('');
    setMessage('');
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white border-b pb-2">
        Kelola Kategori Menu
      </h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{message}</p>
        </div>
      )}

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="flex flex-col space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama Kategori Baru"
              className="w-full focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm w-full sm:w-auto min-w-[120px]" title="Tampilkan di Dashboard">
            <label htmlFor="newCatVisible" className="cursor-pointer text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap flex items-center gap-2 w-full justify-between sm:justify-start">
              <span>{newCategoryVisible ? 'Tampil' : 'Sembunyi'}</span>
              <input
                type="checkbox"
                id="newCatVisible"
                checked={newCategoryVisible}
                onChange={(e) => setNewCategoryVisible(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t dark:border-gray-700 pt-3">
          <div className="w-full sm:w-auto">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Ikon Kategori</label>
            <input
              type="file"
              accept="image/*"
              className="text-xs text-slate-500 w-full
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs file:font-semibold
                    file:bg-primary/10 file:text-primary
                    hover:file:bg-primary/20
                    transition-all
                  "
              onChange={(e) => setNewCategoryIcon(e.target.files[0])}
            />
          </div>
          <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto shadow-md hover:translate-y-[-1px] active:translate-y-0 transition-all">
            <AppIcon name="PlusCircle" className="h-4 w-4 mr-2" />
            Tambah Kategori
          </Button>
        </div>
      </form>

      {/* Categories List */}
      <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-400">Belum ada kategori</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all gap-3">
              {editingCategoryId === category.id ? (
                <form onSubmit={handleUpdateCategory} className="flex-grow flex flex-col space-y-3 w-full">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="flex-grow"
                      placeholder="Nama Kategori"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex-shrink-0 w-12 h-12 border dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center shadow-inner">
                        {previewIcon ? (
                          <img src={previewIcon} alt="Icon" className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="bg-gray-200 dark:bg-gray-700 w-full h-full flex items-center justify-center">
                            <AppIcon name="Image" size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Ganti Ikon</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="text-xs text-slate-500 w-full
                                file:mr-2 file:py-1 file:px-3
                                file:rounded-md file:border-0
                                file:text-xs file:font-semibold
                                file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-600 dark:file:text-gray-300
                              "
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setEditingCategoryIcon(file);
                              setPreviewIcon(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                      <Button type="button" variant="ghost" size="sm" onClick={cancelEditing} className="flex-1 sm:flex-none">Batal</Button>
                      <Button type="submit" variant="primary" size="sm" className="flex-1 sm:flex-none shadow-sm">Simpan</Button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-4 flex-grow">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-200">
                      {category.icon ? (
                        <img src={`${apiUrl}${category.icon}`} alt={category.name} className="w-full h-full object-contain p-1.5" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary font-black text-xl">
                          {category.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-900 dark:text-gray-100 font-bold block">{category.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                        {category.is_visible ? 'Terlihat di Dashboard' : 'Disembunyikan'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 bg-gray-50 dark:bg-gray-800/80 p-1 rounded-lg border dark:border-gray-700 sm:border-none sm:bg-transparent sm:p-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleVisibility(category)}
                      title={category.is_visible ? "Sembunyikan" : "Tampilkan"}
                      className={`h-9 w-9 rounded-lg ${category.is_visible ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-400 hover:text-primary"}`}
                    >
                      {category.is_visible ? <AppIcon name="Eye" size={18} /> : <AppIcon name="EyeOff" size={18} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(category)}
                      className="h-9 w-9 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <AppIcon name="Edit" size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <AppIcon name="Trash2" size={18} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-end pt-6 border-t dark:border-gray-700 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto rounded-xl py-2 px-8 font-bold h-11"
        >
          Tutup Pengaturan
        </Button>
      </div>
    </div>
  );
};

export default CategorySettings;
