import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import authFetch from '../../../utils/authFetch'; // Import authFetch
import { useTheme } from '../../../contexts/ThemeContext';

const AddMenuItemForm = ({ onAddItem, isLoading, userRole, initialData, isEditing, onCategoryChange, onFormChange }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState(initialData || {
    name: '',
    price: '',
    stock: '',
    category: '', // Changed default to empty
    image: null,
    discount: '', // New discount field
    is_featured: false, // New is_featured field
  });
  const [categories, setCategories] = useState([]); // State for categories

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch('/api/categories');
        const data = await response.json();
        if (response.ok) {
          setCategories(data.data);
          // Set default category if not editing and categories are fetched
          if (!isEditing && data.data.length > 0) {
            setFormData(prev => ({ ...prev, category: data.data[0].name.toLowerCase() }));
          }
        } else {
          console.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [isEditing]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        is_featured: !!initialData.is_featured, // Ensure is_featured is always a boolean
      });
    } else {
      // Reset form when initialData is cleared (e.g., modal closed)
      setFormData({
        name: '',
        price: '',
        stock: '',
        category: categories.length > 0 ? categories[0].name.toLowerCase() : '',
        image: null,
        discount: '', // Include discount in reset
        is_featured: false, // Include is_featured in reset
      });
    }
  }, [initialData, categories]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    let name, value, files;

    if (e && e.target) {
      // It's an event object from a standard input
      ({ name, value, files } = e.target);
    } else {
      // It's a direct value from the Select component
      name = 'category';
      value = e;
      if (onCategoryChange) {
        onCategoryChange(value);
      }
    }

    if (onFormChange) {
      if (name === 'is_featured') {
        onFormChange({ name, value: e.target.checked, files });
      } else {
        onFormChange({ name, value, files });
      }
    } else if (name === 'image') {
      setFormData({ ...formData, [name]: files[0] });
    } else if (name === 'is_featured') {
      setFormData({ ...formData, [name]: e.target.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simple validation
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      console.error("Please fill all fields");
      setIsSubmitting(false);
      return;
    }
    try {
      await onAddItem(formData);
      if (!isEditing) {
        // Reset form only if not in editing mode
        setFormData({
          name: '',
          price: '',
          stock: '',
          category: 'makanan',
          image: null,
        });
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${theme === 'default' ? 'bg-card' : 'bg-transparent'} rounded-lg shadow-elevation-1 border border-border p-6 mb-6`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name={isEditing ? "Edit" : "Plus"} size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{isEditing ? "Edit Menu Item" : "Tambah Menu Baru"}</h2>
          <p className="text-sm text-muted-foreground">{isEditing ? "Perbarui detail item menu" : "Tambahkan item menu dengan stok dan harga"}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Nama Menu"
              type="text"
              name="name"
              placeholder="Contoh: Nasi Gudeg"
              value={formData?.name ?? ''}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>

          <div>
            <Select
              label="Kategori"
              name="category"
              value={formData?.category ?? ''}
              onChange={handleChange}
              required
              className="w-full"
              options={categories.map(cat => ({ value: cat.name.toLowerCase(), label: cat.name }))}
            />
          </div>
          
          <div>
            <Input
              label="Stok"
              type="number"
              name="stock"
              placeholder="0"
              value={formData?.stock ?? ''}
              onChange={handleChange}
              min="0"
              required
              className="w-full"
            />
          </div>
          
          <div>
            <Input
              label="Harga (Rp)"
              type="number"
              name="price"
              placeholder="0"
              value={formData?.price ?? ''}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>
          <div>
            <Input
              label="Diskon (0.00 - 1.00)"
              type="number"
              name="discount"
              placeholder="0.00"
              value={formData?.discount ?? ''}
              onChange={handleChange}
              min="0"
              max="1"
              step="0.01"
              className="w-full"
            />
          </div>
          <div className="col-span-2 flex items-center">
            <input
              type="checkbox"
              id="is_featured"
              name="is_featured"
              checked={!!formData?.is_featured}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="is_featured" className="text-sm font-medium text-foreground">Menu Unggulan</label>
          </div>
          <div className="col-span-2">
            <label htmlFor="image" className="block text-sm font-medium text-foreground">Gambar Produk</label>
            <Input
              type="file"
              name="image"
              id="image"
              onChange={handleChange}
              className="mt-1"
              accept="image/*"
            />
            {isEditing && formData.image_url && (
              <p className="text-sm text-muted-foreground mt-1">Gambar saat ini: <a href={`${import.meta.env.VITE_API_URL}${formData.image_url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lihat Gambar</a></p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            variant="default"
            loading={isSubmitting}
            iconName={isEditing ? "Save" : "Plus"}
            iconPosition="left"
            className="sm:w-auto"
            disabled={userRole === 'guest'}
          >
            {isSubmitting ? (isEditing ? 'Menyimpan...' : 'Menambahkan...') : (isEditing ? 'Simpan Perubahan' : 'Tambah Menu')}
          </Button>
          
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
        setFormData({
          name: '',
          price: '',
          stock: '',
          category: categories.length > 0 ? categories[0].name.toLowerCase() : '',
          image: null,
          discount: '',
          is_featured: false,
        });
                setErrors({});
              }}
              iconName="RotateCcw"
              iconPosition="left"
              className="sm:w-auto"
            >
              Reset Form
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddMenuItemForm;