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
    category: '',
    image: null,
    discount: '',
    is_featured: false,
    options: [], // Add options to initial state
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch('/api/categories');
        const data = await response.json();
        if (response.ok) {
          setCategories(data.data);
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
        is_featured: !!initialData.is_featured,
        options: initialData.options || [],
      });
    } else {
      setFormData({
        name: '',
        price: '',
        stock: '',
        category: categories.length > 0 ? categories[0].name.toLowerCase() : '',
        image: null,
        discount: '',
        is_featured: false,
        options: [],
      });
    }
  }, [initialData, categories]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    const val = type === 'checkbox' ? checked : (type === 'file' ? files[0] : value);
    setFormData(prev => ({ ...prev, [name]: val }));
    if (onFormChange) {
      onFormChange({ name, value: val, files });
    }
  };

  const handleOptionChange = (index, e) => {
    const { name, value } = e.target;
    const newOptions = [...formData.options];
    newOptions[index][name] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { name: '', price_adjustment: '' }],
    }));
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      console.error("Please fill all fields");
      setIsSubmitting(false);
      return;
    }
    try {
      await onAddItem(formData);
      if (!isEditing) {
        setFormData({
          name: '',
          price: '',
          stock: '',
          category: 'makanan',
          image: null,
          options: [],
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Nama Menu"
              type="text"
              name="name"
              placeholder="Contoh: Nasi Gudeg"
              value={formData?.name ?? ''}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Select
              label="Kategori"
              name="category"
              value={formData?.category ?? ''}
              onChange={(value) => handleChange({ target: { name: 'category', value } })}
              required
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
            />
          </div>
          <div className="flex items-center">
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
          <div className="md:col-span-2">
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

        {/* --- Menu Options/Toppings --- */}
        <div className="md:col-span-2 pt-4">
          <h3 className="text-lg font-medium text-foreground mb-2">Opsi / Topping Menu</h3>
          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border border-border rounded-md">
                <Input
                  type="text"
                  name="name"
                  placeholder="Nama Opsi (e.g., Dada, Paha)"
                  value={option.name}
                  onChange={(e) => handleOptionChange(index, e)}
                  className="flex-grow"
                />
                <Input
                  type="number"
                  name="price_adjustment"
                  placeholder="Penyesuaian Harga (Rp)"
                  value={option.price_adjustment}
                  onChange={(e) => handleOptionChange(index, e)}
                  className="w-48"
                />
                <Button type="button" variant="destructive" size="sm" onClick={() => removeOption(index)}>
                  Hapus
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-3">
            <Icon name="Plus" className="mr-2" />
            Tambah Opsi
          </Button>
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
              onClick={() => setFormData({ name: '', price: '', stock: '', category: 'makanan', image: null, discount: '', is_featured: false, options: [] })}
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