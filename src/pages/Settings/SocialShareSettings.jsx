import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import authFetch from '../../utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

const SocialShareSettings = ({ onClose }) => {
  const [settings, setSettings] = useState({
    og_title: '',
    og_description: '',
    og_image_url: '',
  });
  const [newImage, setNewImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await authFetch('/api/app-settings');
        const data = await response.json();
        if (response.ok) {
          setSettings(data.data);
          setPreviewUrl(data.data.og_image_url);
        } else {
           throw new Error(data.error || 'Failed to fetch settings');
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
        setMessage('Gagal memuat pengaturan.');
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('og_title', settings.og_title);
    formData.append('og_description', settings.og_description);
    if (newImage) {
      formData.append('og_image', newImage);
    }

    try {
      await authFetch('/api/app-settings', {
        method: 'POST',
        body: formData,
      });
      setMessage('Pengaturan berhasil diperbarui!');
      setTimeout(() => onClose(), 1500); // Close modal on success
    } catch (error) {
      console.error('Failed to update settings', error);
      setMessage('Gagal memperbarui pengaturan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="og_title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Judul
        </label>
        <Input
          type="text"
          name="og_title"
          id="og_title"
          value={settings.og_title}
          onChange={handleInputChange}
          className="w-full"
          placeholder="Contoh: Kasir Berkah 88"
        />
      </div>
      <div>
        <label htmlFor="og_description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Deskripsi
        </label>
        <textarea
          name="og_description"
          id="og_description"
          value={settings.og_description}
          onChange={handleInputChange}
          rows="3"
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Contoh: Aplikasi kasir modern untuk bisnis Anda."
        ></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Gambar Cover
        </label>
        <div className="mt-2 flex items-center space-x-4">
          {previewUrl && (
            <img src={previewUrl.startsWith('blob:') ? previewUrl : `${apiUrl}${previewUrl}`} alt="Preview" className="h-20 w-auto rounded-md bg-gray-100" />
          )}
          <label htmlFor="og_image" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
            <span>Ganti Gambar</span>
            <input id="og_image" name="og_image" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-4 pt-4">
        {message && <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>}
        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
};

export default SocialShareSettings;
