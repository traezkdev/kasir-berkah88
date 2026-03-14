import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AppIcon from '../../components/AppIcon';
import authFetch from '../../utils/authFetch';
import { useToast } from '../../components/ui/ToastNotification';

const BannerSettings = ({ onClose }) => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  
  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isActive, setIsActive] = useState(true);
  
  const [editingId, setEditingId] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/seller-banners/all');
      const data = await response.json();
      if (response.ok) {
        setBanners(data.data || []);
      } else {
        throw new Error(data.error || 'Gagal memuat pengumuman.');
      }
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setLinkUrl('');
    setImageFile(null);
    setImagePreview(null);
    setIsActive(true);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !imageFile) {
      setError('Harap pilih gambar untuk pengumuman baru.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('title', title || 'Pengumuman');
    formData.append('subtitle', subtitle);
    formData.append('link_url', linkUrl);
    formData.append('is_active', isActive);
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const url = editingId ? `/api/seller-banners/${editingId}` : '/api/seller-banners';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await authFetch(url, {
        method: method,
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        showToast(editingId ? 'Pengumuman berhasil diperbarui' : 'Pengumuman berhasil ditambahkan', 'success');
        resetForm();
        fetchBanners();
      } else {
        throw new Error(data.error || 'Gagal menyimpan pengumuman.');
      }
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingId(banner.id);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setLinkUrl(banner.link_url || '');
    setIsActive(banner.is_active === 1 || banner.is_active === true);
    setImagePreview(banner.image_url ? `${apiUrl}${banner.image_url}` : null);
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    
    setIsLoading(true);
    try {
      const response = await authFetch(`/api/seller-banners/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showToast('Pengumuman berhasil dihapus', 'success');
        fetchBanners();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Gagal menghapus pengumuman.');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
          Manajemen Pengumuman Seller
        </h3>
        {editingId && (
          <Button variant="ghost" size="sm" onClick={resetForm} className="text-red-500 font-bold">
            Batal Edit
          </Button>
        )}
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1 block">Judul Pengumuman</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Perbaikan Sistem Malam Ini"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1 block">Deskripsi (Opsional)</label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Detail pengumuman"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1 block">Link Tujuan (Opsional)</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/info"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center bg-white dark:bg-gray-900 group transition-all hover:border-blue-500/50">
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <span className="text-white font-bold text-sm bg-blue-600 px-4 py-2 rounded-full shadow-lg">Ganti Gambar</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer space-y-2 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <AppIcon name="Upload" size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Upload Gambar Pengumuman</p>
                  <p className="text-[10px] text-gray-400 font-medium">Format: JPG, PNG, WEBP (16:9)</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t dark:border-gray-700">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="bannerActive" className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                  Aktifkan Pengumuman
                </label>
              </div>
           </div>
           
           <Button type="submit" variant="primary" disabled={isLoading} className="w-full sm:w-auto px-8 shadow-blue-500/20 shadow-lg">
             {isLoading ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Kirim Pengumuman')}
           </Button>
        </div>
      </form>

      {/* List Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {banners.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <AppIcon name="Bell" size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Belum ada pengumuman seller</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="relative group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-xl transition-all">
              <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 relative">
                <img 
                  src={`${apiUrl}${banner.image_url}`} 
                  alt={banner.title} 
                  className={`w-full h-full object-cover ${!banner.is_active ? 'grayscale opacity-50' : ''}`}
                />
                {!banner.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">
                    Nonaktif
                  </div>
                )}
              </div>
              
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight line-clamp-1">{banner.title}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{banner.subtitle || 'Tanpa deskripsi'}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)} className="text-blue-600 hover:bg-blue-50">
                    <AppIcon name="Edit" size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)} className="text-red-500 hover:bg-red-50">
                    <AppIcon name="Trash2" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-6 border-t dark:border-gray-700 flex justify-end">
        <Button variant="outline" onClick={onClose} className="rounded-xl px-8 font-black uppercase text-xs tracking-widest h-11">
          Selesai
        </Button>
      </div>
    </div>
  );
};

export default BannerSettings;
