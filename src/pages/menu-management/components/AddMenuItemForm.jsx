import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const AddMenuItemForm = ({ onAddItem, userRole }) => {
  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    price: '',
    category: '',
    image_url: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.name?.trim()) {
      newErrors.name = 'Nama menu wajib diisi';
    }

    if (!formData?.category?.trim()) {
      newErrors.category = 'Kategori wajib diisi';
    }
    
    if (!formData?.stock || parseInt(formData?.stock) < 0) {
      newErrors.stock = 'Stok harus berupa angka positif';
    }
    
    if (!formData?.price || parseFloat(formData?.price) <= 0) {
      newErrors.price = 'Harga harus lebih dari 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const newItem = {
        id: `M-${Date.now()}`,
        name: formData?.name?.trim(),
        stock: parseInt(formData?.stock),
        price: parseFloat(formData?.price),
        category: formData?.category?.trim(),
        image_url: formData?.image_url?.trim(),
        createdAt: new Date()?.toISOString(),
        updatedAt: new Date()?.toISOString()
      };
      
      await onAddItem(newItem);
      
      // Reset form
      setFormData({
        name: '',
        stock: '',
        price: '',
        category: '',
        image_url: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error adding menu item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (value) => {
    if (!value) return '';
    const numericValue = value?.replace(/[^\d]/g, '');
    return new Intl.NumberFormat('id-ID')?.format(numericValue);
  };

  const handlePriceChange = (e) => {
    const { value } = e?.target;
    const numericValue = value?.replace(/[^\d]/g, '');
    setFormData(prev => ({
      ...prev,
      price: numericValue
    }));
    
    if (errors?.price) {
      setErrors(prev => ({
        ...prev,
        price: ''
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-elevation-1 border border-slate-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name="Plus" size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Tambah Menu Baru</h2>
          <p className="text-sm text-text-secondary">Tambahkan item menu dengan stok dan harga</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <Input
              label="Nama Menu"
              type="text"
              name="name"
              placeholder="Contoh: Nasi Gudeg"
              value={formData?.name}
              onChange={handleInputChange}
              error={errors?.name}
              required
              className="w-full"
            />
          </div>

          <div className="md:col-span-1">
            <Input
              label="Kategori"
              type="text"
              name="category"
              placeholder="Contoh: Makanan Utama"
              value={formData?.category}
              onChange={handleInputChange}
              error={errors?.category}
              required
              className="w-full"
            />
          </div>
          
          <div className="md:col-span-1">
            <Input
              label="Stok"
              type="number"
              name="stock"
              placeholder="0"
              value={formData?.stock}
              onChange={handleInputChange}
              error={errors?.stock}
              min="0"
              required
              className="w-full"
            />
          </div>
          
          <div className="md:col-span-1">
            <Input
              label="Harga (Rp)"
              type="text"
              name="price"
              placeholder="0"
              value={formatPrice(formData?.price)}
              onChange={handlePriceChange}
              error={errors?.price}
              required
              className="w-full"
            />
          </div>
          <div className="col-span-full">
            <Input
              label="URL Gambar (Opsional)"
              type="text"
              name="image_url"
              placeholder="https://example.com/gambar-menu.jpg"
              value={formData?.image_url}
              onChange={handleInputChange}
              error={errors?.image_url}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            variant="default"
            loading={isSubmitting}
            iconName="Plus"
            iconPosition="left"
            className="sm:w-auto"
            disabled={userRole === 'guest'}
          >
            {isSubmitting ? 'Menambahkan...' : 'Tambah Menu'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({ name: '', stock: '', price: '', category: '', image_url: '' });
              setErrors({});
            }}
            iconName="RotateCcw"
            iconPosition="left"
            className="sm:w-auto"
          >
            Reset Form
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddMenuItemForm;