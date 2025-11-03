import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import authFetch from '../../../utils/authFetch';

const AddMenuItemForm = ({ onAddItem, isLoading, userRole, initialData, isEditing, onCategoryChange, onFormChange }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialData || {
    name: '',
    price: '',
    stock: '',
    category: '', // Initialize with empty string
    image: null,
    discount: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          const fetchedCategories = data.data.map(cat => ({ value: cat.name, label: cat.name }));
          setCategories(fetchedCategories);
          // Set default category if none is selected and categories are available
          if (!formData.category && fetchedCategories.length > 0) {
            setFormData(prev => ({ ...prev, category: fetchedCategories[0].value }));
          }
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [authFetch]); // Depend only on authFetch

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        discount: initialData.discount, // initialData.discount is already percentage string from EditMenuItemModal
      });
    } else {
      setFormData({
        name: '',
        price: '',
        stock: '',
        category: categories.length > 0 ? categories[0].value : '', // Set default from fetched categories
        image: null,
        discount: '',
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
      onFormChange({ name, value, files });
    } else if (name === 'image') {
      setFormData({ ...formData, [name]: files[0] });
    }
    else {
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
      const dataToSubmit = {
        ...formData,
        discount: formData.discount ? parseFloat(formData.discount) / 100 : 0, // Convert percentage string to decimal
      };
      await onAddItem(dataToSubmit);
      if (!isEditing) {
        // Reset form only if not in editing mode
        setFormData({
          name: '',
          price: '',
          stock: '',
          category: categories.length > 0 ? categories[0].value : '', // Reset to first category
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
    <div className="bg-card rounded-lg shadow-elevation-1 border border-border p-6 mb-6">
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
              value={formData?.name}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>

          <div>
            <Select
              label="Kategori"
              name="category"
              value={formData?.category}
              onChange={handleChange}
              required
              className="w-full"
              options={categories}
            />
          </div>
          
          <div>
            <Input
              label="Stok"
              type="number"
              name="stock"
              placeholder="0"
              value={formData?.stock}
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
              value={formData?.price}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>
          <div>
            <Input
              label="Diskon (%)"
              type="number"
              name="discount"
              placeholder="0"
              value={formData?.discount}
              onChange={handleChange}
              min="0"
              max="100"
              step="1"
              className="w-full"
            />
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
                setFormData({ name: '', stock: '', price: '', category: categories.length > 0 ? categories[0].value : '', image: null });
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