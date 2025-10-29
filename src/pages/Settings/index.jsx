import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import AppIcon from '../../components/AppIcon';

const apiUrl = import.meta.env.VITE_API_URL;

// Helper component for the modal
const SettingsModal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <AppIcon name="X" className="w-6 h-6" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// Helper component for the settings cards
const SettingsCard = ({ icon, title, description, onClick, disabled = false }) => (
  <div
    onClick={!disabled ? onClick : undefined}
    className={`
      bg-card p-6 rounded-xl shadow-lg border border-border
      transition-all duration-300 ease-in-out
      ${disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer hover:shadow-primary/20 hover:scale-[1.02] hover:border-primary/50'
      }
    `}
  >
    <div className="flex items-center gap-4 mb-3">
      <AppIcon name={icon} className="w-8 h-8 text-primary" />
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
    </div>
    <p className="text-sm text-text-secondary">{description}</p>
  </div>
);

const Settings = ({ headerTitle }) => {
  // --- ALL EXISTING STATES ---
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [newWebsiteTitle, setNewWebsiteTitle] = useState('');
  const [newHeaderTitle, setNewHeaderTitle] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [users, setUsers] = useState([]);
  const [decodedToken, setDecodedToken] = useState(null);
  const [currentMasterPassword, setCurrentMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [masterPasswordForClear, setMasterPasswordForClear] = useState('');
  const [webDescription, setWebDescription] = useState('');
  const [initialCapital, setInitialCapital] = useState('');
  const [employees, setEmployees] = useState([]);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  // New state for modal management
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();

  // --- ALL EXISTING HANDLERS AND USEEFFECTS ---
  useEffect(() => {
    fetchSettings();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setDecodedToken(decoded);
        setUserRole(decoded.role);
        if (decoded.role === 'admin') {
          fetchUsers();
          fetchEmployees();
        }
      } catch (e) {
        console.error("Error decoding token:", e);
        setUserRole('');
      }
    }
  }, []);

  const clearMessages = () => {
    setMessage('');
    setError('');
  }

  const handleModalClose = () => {
    setActiveModal(null);
    clearMessages();
  }

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/all-settings`);
      const data = await response.json();
      if (response.ok) {
        setWebsiteTitle(data.data.website_title || 'Kasir Berkah 88');
        setNewWebsiteTitle(data.data.website_title || 'Kasir Berkah 88');
        setNewHeaderTitle(data.data.header_title || headerTitle || 'Kasir Berkah 88');
        setRegistrationEnabled(data.data.registration_enabled === 'true');
        setWebDescription(data.data.web_description || '');
        setInitialCapital(data.data.initial_capital || '');
      } else {
        setError(data.error || 'Failed to fetch settings');
      }
    } catch (err) {
      setError('Network error or server unreachable');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/admin/users`);
      const data = await response.json();
      if (response.ok) setUsers(data.data);
    } catch (err) { console.error('Fetch users error:', err); }
  };

  const fetchEmployees = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/employees`);
      const data = await response.json();
      if (response.ok) setEmployees(data.data);
    } catch (err) { console.error('Fetch employees error:', err); }
  };

  const handleUpdateSetting = async (e, endpoint, body, successMessage) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(successMessage);
        fetchSettings();
        setTimeout(() => handleModalClose(), 1500);
      } else {
        setError(data.error || 'Gagal melakukan pembaruan');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!logoFile) { setError('Pilih file logo untuk diunggah.'); return; }
    clearMessages();
    setIsLoading(true);
    const formData = new FormData();
    formData.append('logo', logoFile);
    try {
      const response = await authFetch(`${apiUrl}/api/settings/logo`, { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        setMessage('Logo berhasil diunggah! Halaman akan dimuat ulang.');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError(data.error || 'Gagal mengunggah logo');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRoleChange = async (userId, newRole) => {
    clearMessages();
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Peran pengguna berhasil diperbarui!`);
        fetchUsers();
      } else {
        setError(data.error || 'Gagal memperbarui peran');
      }
    } catch (err) {
      setError('Kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Anda yakin ingin menghapus pengguna "${username}"?`)) {
      clearMessages();
      setIsLoading(true);
      try {
        const response = await authFetch(`${apiUrl}/api/admin/users/${userId}`, { method: 'DELETE' });
        const data = await response.json();
        if (response.ok) {
          setMessage(`Pengguna "${username}" berhasil dihapus!`);
          fetchUsers();
        } else {
          setError(data.error || 'Gagal menghapus pengguna');
        }
      } catch (err) {
        setError('Kesalahan jaringan');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChangeMasterPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/settings/master-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentMasterPassword, newMasterPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Kata sandi master berhasil diperbarui!');
        setCurrentMasterPassword('');
        setNewMasterPassword('');
        setTimeout(() => handleModalClose(), 1500);
      } else {
        setError(data.error || 'Gagal memperbarui kata sandi master');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbs = [{ name: 'Beranda', path: '/main-dashboard' }, { name: 'Pengaturan', path: '/settings' }];
  const isAdmin = userRole === 'admin';

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader title="Pengaturan" headerTitle={headerTitle} />
      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <BreadcrumbNavigation paths={breadcrumbs} />
          <header className="mt-6 mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-text-primary flex items-center gap-3">
              <AppIcon name="Settings" className="w-10 h-10" />
              Pengaturan Aplikasi
            </h1>
            <p className="mt-2 text-lg text-text-secondary">Kelola preferensi umum, tampilan, dan fungsionalitas aplikasi Anda di sini.</p>
          </header>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-6 border-b border-border pb-3">Pengaturan Umum</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SettingsCard icon="Type" title="Judul Situs Web" description="Ubah judul di tab browser dan hasil pencarian." onClick={() => setActiveModal('websiteTitle')} disabled={!isAdmin} />
              <SettingsCard icon="Heading" title="Judul Header Web" description="Sesuaikan teks judul di header utama aplikasi." onClick={() => setActiveModal('headerTitle')} disabled={!isAdmin} />
              <SettingsCard icon="Image" title="Ganti Logo Header" description="Unggah logo baru yang tampil di header." onClick={() => setActiveModal('logo')} disabled={!isAdmin} />
              <SettingsCard icon="DollarSign" title="Modal Awal" description="Atur jumlah modal awal untuk perhitungan bisnis." onClick={() => setActiveModal('initialCapital')} disabled={!isAdmin} />
              <SettingsCard icon="FileText" title="Deskripsi Web" description="Kelola deskripsi meta untuk optimasi SEO." onClick={() => setActiveModal('webDescription')} disabled={!isAdmin} />
              <SettingsCard icon="ToggleRight" title="Pendaftaran Pengguna" description="Izinkan atau blokir pengguna baru untuk mendaftar." onClick={() => setActiveModal('registration')} disabled={!isAdmin} />
            </div>
          </div>

          {isAdmin && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-text-primary mb-6 border-b border-border pb-3">Manajemen & Keamanan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SettingsCard icon="Users" title="Kelola Pengguna" description="Lihat, ubah peran, dan hapus akun pengguna." onClick={() => setActiveModal('userManagement')} />
                <SettingsCard icon="ShieldAlert" title="Kata Sandi Master" description="Ubah kata sandi master untuk tindakan sensitif." onClick={() => setActiveModal('masterPassword')} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- ALL MODALS --- */}
      <SettingsModal title="Ubah Judul Situs Web" isOpen={activeModal === 'websiteTitle'} onClose={handleModalClose}>
        <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/title', { title: newWebsiteTitle }, 'Judul situs berhasil diperbarui!')} className="space-y-4">
          <Input label="Judul Situs Web Baru" name="newWebsiteTitle" type="text" value={newWebsiteTitle} onChange={(e) => setNewWebsiteTitle(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Ubah Judul Header Web" isOpen={activeModal === 'headerTitle'} onClose={handleModalClose}>
        <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/header-title', { title: newHeaderTitle }, 'Judul header berhasil diperbarui!')} className="space-y-4">
          <Input label="Judul Header Baru" name="newHeaderTitle" type="text" value={newHeaderTitle} onChange={(e) => setNewHeaderTitle(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Ganti Logo Header" isOpen={activeModal === 'logo'} onClose={handleModalClose}>
        <form onSubmit={handleLogoUpload} className="space-y-6">
          <Input label="Pilih File Logo (PNG, JPG)" name="logoFile" type="file" accept=".png, .jpg, .jpeg" onChange={handleLogoFileChange} />
          {logoPreview && <img src={logoPreview} alt="Pratinjau Logo" className="w-24 h-24 rounded-lg object-cover mx-auto border border-dashed p-1" />}
          <Button type="submit" className="w-full" disabled={isLoading || !logoFile}>{isLoading ? 'Mengunggah...' : 'Unggah dan Simpan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Atur Modal Awal" isOpen={activeModal === 'initialCapital'} onClose={handleModalClose}>
         <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings', { initial_capital: initialCapital }, 'Modal awal berhasil diperbarui!')} className="space-y-4">
          <Input label="Jumlah Modal Awal (Rp)" name="initialCapital" type="number" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Ubah Deskripsi Web" isOpen={activeModal === 'webDescription'} onClose={handleModalClose}>
        <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/description', { description: webDescription }, 'Deskripsi web berhasil diperbarui!')} className="space-y-4">
          <textarea value={webDescription} onChange={(e) => setWebDescription(e.target.value)} rows="4" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Masukkan deskripsi web..."></textarea>
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Pendaftaran Pengguna" isOpen={activeModal === 'registration'} onClose={handleModalClose}>
        <div className="flex items-center justify-between p-4 rounded-lg bg-background">
            <span className="text-text-primary">Izinkan pengguna baru mendaftar</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={registrationEnabled} onChange={(e) => handleUpdateSetting(e, '/api/settings/registration', { enabled: !registrationEnabled }, 'Pengaturan pendaftaran diperbarui!')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
        </div>
      </SettingsModal>

      <SettingsModal title="Manajemen Pengguna" isOpen={activeModal === 'userManagement'} onClose={handleModalClose}>
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-text-secondary"><tr><th className="p-2">ID</th><th className="p-2">Nama</th><th className="p-2">Peran</th><th className="p-2">Aksi</th></tr></thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-border">
                                <td className="p-2">{user.id}</td>
                                <td className="p-2">{user.username}</td>
                                <td className="p-2">
                                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="bg-background border border-input rounded-md p-1" disabled={isLoading || user.id === 1}>
                                        <option value="user">Pengguna</option>
                                        <option value="kasir">Kasir</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="p-2">
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id, user.username)} disabled={isLoading || user.id === 1 || (decodedToken && user.id === decodedToken.userId)}>Hapus</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </SettingsModal>

      <SettingsModal title="Ubah Kata Sandi Master" isOpen={activeModal === 'masterPassword'} onClose={handleModalClose}>
        <form onSubmit={handleChangeMasterPassword} className="space-y-4">
          <p className="text-sm text-text-secondary">Kata sandi ini digunakan untuk mengotorisasi tindakan berbahaya seperti menghapus semua data.</p>
          <Input label="Kata Sandi Master Saat Ini" name="currentMasterPassword" type="password" value={currentMasterPassword} onChange={(e) => setCurrentMasterPassword(e.target.value)} required />
          <Input label="Kata Sandi Master Baru" name="newMasterPassword" type="password" value={newMasterPassword} onChange={(e) => setNewMasterPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</Button>
        </form>
      </SettingsModal>

      {message && <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg">{message}</div>}
      {error && <div className="fixed bottom-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg">{error}</div>}
    </div>
  );
};

export default Settings;
