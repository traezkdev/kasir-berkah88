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
    description: '',
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
        description: '',
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
          description: '',
        });
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Icon name={isEditing ? "SquarePen" : "PlusCircle"} size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">{isEditing ? "Edit Menu Item" : "Tambah Menu Baru"}</h2>
          <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{isEditing ? "Perbarui detail item menu" : "Tambahkan item menu dengan stok dan harga"}</p>
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

          <div className="flex items-center group cursor-pointer lg:col-span-2 py-2">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={!!formData?.is_featured}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded-lg focus:ring-blue-500/20 transition-all cursor-pointer"
              />
            </div>
            <label htmlFor="is_featured" className="ml-3 text-sm font-black text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Jadikan Menu Unggulan
            </label>
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
              <p className="text-sm text-muted-foreground mt-1">Gambar saat ini: <a href={formData.image_url ? `${import.meta.env.VITE_API_URL}${formData.image_url}` : '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lihat Gambar</a></p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">Deskripsi Menu (Opsional)</label>
            <textarea
              id="description"
              name="description"
              placeholder="Jelaskan detail menu ini..."
              value={formData?.description ?? ''}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="md:col-span-2 pt-6 border-t border-gray-50 dark:border-slate-700 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Opsi / Topping Menu</h3>
            <button
              type="button"
              onClick={addOption}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              + Tambah Opsi
            </button>
          </div>

          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={index} className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                <div className="flex-1 min-w-[150px]">
                  <Input
                    type="text"
                    name="name"
                    placeholder="Nama Opsi (e.g., Dada, Paha)"
                    value={option.name}
                    onChange={(e) => handleOptionChange(index, e)}
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Input
                    type="number"
                    name="price_adjustment"
                    placeholder="Harga Tambahan (Rp)"
                    value={option.price_adjustment}
                    onChange={(e) => handleOptionChange(index, e)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl active:scale-90 transition-all"
                >
                  <Icon name="Trash2" size={18} />
                </button>
              </div>
            ))}

            {formData.options.length === 0 && (
              <div className="py-8 text-center bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-gray-100 dark:border-slate-700">
                <Icon name="CirclePlus" size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Belum ada opsi topping</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <button
            type="submit"
            disabled={userRole === 'guest' || isSubmitting}
            className="flex-1 py-4 bg-[#118eea] text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Icon name={isEditing ? "Save" : "Plus"} size={20} />
            )}
            {isSubmitting ? (isEditing ? 'Menyimpan...' : 'Memproses...') : (isEditing ? 'Simpan Perubahan' : 'Tambahkan Ke Menu')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMenuItemForm;