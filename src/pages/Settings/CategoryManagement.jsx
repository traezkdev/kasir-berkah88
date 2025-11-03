import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { toast } from 'react-toastify';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null); // { id, name }
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await authFetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.data);
            } else {
                toast.error('Gagal mengambil kategori.');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Terjadi kesalahan saat mengambil kategori.');
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.warn('Nama kategori tidak boleh kosong.');
            return;
        }
        try {
            const response = await authFetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName }),
            });
            if (response.ok) {
                toast.success('Kategori berhasil ditambahkan!');
                setNewCategoryName('');
                fetchCategories();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Gagal menambahkan kategori.');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Terjadi kesalahan saat menambahkan kategori.');
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!editingCategory || !editingCategory.name.trim()) {
            toast.warn('Nama kategori tidak boleh kosong.');
            return;
        }
        try {
            const response = await authFetch(`/api/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingCategory.name }),
            });
            if (response.ok) {
                toast.success('Kategori berhasil diperbarui!');
                setEditingCategory(null);
                fetchCategories();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Gagal memperbarui kategori.');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Terjadi kesalahan saat memperbarui kategori.');
        }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;
        try {
            const response = await authFetch(`/api/categories/${categoryToDelete.id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                toast.success('Kategori berhasil dihapus!');
                fetchCategories();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Gagal menghapus kategori.');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Terjadi kesalahan saat menghapus kategori.');
        } finally {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
        }
    };

    const confirmDelete = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    return (
        <div className="p-4 bg-card rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Manajemen Kategori</h2>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="mb-6 flex gap-2">
                <Input
                    type="text"
                    placeholder="Nama Kategori Baru"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-grow"
                />
                <Button type="submit">Tambah Kategori</Button>
            </form>

            {/* Categories List */}
            <div>
                {categories.length === 0 ? (
                    <p className="text-muted-foreground">Belum ada kategori.</p>
                ) : (
                    <ul className="space-y-2">
                        {categories.map((category) => (
                            <li key={category.id} className="flex items-center justify-between bg-background p-3 rounded-md shadow-sm">
                                {editingCategory && editingCategory.id === category.id ? (
                                    <form onSubmit={handleUpdateCategory} className="flex-grow flex gap-2">
                                        <Input
                                            type="text"
                                            value={editingCategory.name}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                            className="flex-grow"
                                        />
                                        <Button type="submit" size="sm">Simpan</Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingCategory(null)}>Batal</Button>
                                    </form>
                                ) : (
                                    <>
                                        <span className="text-foreground">{category.name}</span>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setEditingCategory(category)}>Edit</Button>
                                            <Button variant="destructive" size="sm" onClick={() => confirmDelete(category)}>Hapus</Button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteCategory}
                title="Konfirmasi Hapus Kategori"
                message={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
            />
        </div>
    );
};

export default CategoryManagement;
