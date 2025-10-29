import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const AddMenuItemForm = ({ onAddItem, isLoading, userRole, initialData, isEditing, onCategoryChange, onFormChange }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    price: '',
    stock: '',
    category: 'makanan',
    image: null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form when initialData is cleared (e.g., modal closed)
      setFormData({
        name: '',
        price: '',
        stock: '',
        category: 'makanan',
        image: null,
      });
    }
  }, [initialData]);
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
              placeholder="Contoh: Nasi Gudeg"
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
              options={[
                { value: 'makanan', label: 'Makanan' },
                { value: 'minuman', label: 'Minuman' },
                { value: 'lainnya', label: 'Lainnya' },
              ]}
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
                setFormData({ name: '', stock: '', price: '', category: 'makanan', image: null });
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