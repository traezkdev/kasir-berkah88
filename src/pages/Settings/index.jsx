import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import AppIcon from '../../components/AppIcon';
import RestaurantSettingsModal from './components/RestaurantSettingsModal';

import SocialShareSettings from './SocialShareSettings';
import CategorySettings from './CategorySettings';

const apiUrl = import.meta.env.VITE_API_URL;

// Reusable Modal Component
const SettingsModal = ({ title, isOpen, onClose, children, size = 'lg' }) => {
  if (!isOpen) return null;
  const sizeClass = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '3xl': 'max-w-3xl',
  }[size];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={onClose}>
      <div className={`bg-card rounded-xl shadow-2xl w-full ${sizeClass} max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><AppIcon name="X" className="w-6 h-6" /></Button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// Reusable Card Component
const SettingsCard = ({ icon, title, description, onClick, disabled = false }) => (
  <div
    onClick={!disabled ? onClick : undefined}
    className={`bg-card p-6 rounded-xl shadow-lg border border-border transition-all duration-300 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-primary/20 hover:scale-[1.02] hover:border-primary/50'}`}>
    <div className="flex items-center gap-4 mb-3">
      <AppIcon name={icon} className="w-8 h-8 text-primary" />
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
    </div>
    <p className="text-sm text-text-secondary">{description}</p>
  </div>
);

import { useTheme } from '../../contexts/ThemeContext';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  // --- States ---
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [newWebsiteTitle, setNewWebsiteTitle] = useState('');
  const [newHeaderTitle, setNewHeaderTitle] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [currentLogoUrl, setCurrentLogoUrl] = useState('');
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
  const [showCurrentMasterPassword, setShowCurrentMasterPassword] = useState(false);
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [showNewMasterPassword, setShowNewMasterPassword] = useState(false);
  const [confirmNewMasterPassword, setConfirmNewMasterPassword] = useState('');
  const [showConfirmNewMasterPassword, setShowConfirmNewMasterPassword] = useState(false);
  const [masterPasswordForClear, setMasterPasswordForClear] = useState('');
  const [showMasterPasswordForClear, setShowMasterPasswordForClear] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [webDescription, setWebDescription] = useState('');
  const [initialCapital, setInitialCapital] = useState('');
  const [employees, setEmployees] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [showDeleteEmployeeConfirmation, setShowDeleteEmployeeConfirmation] = useState(false);
  const [employeeToDeleteId, setEmployeeToDeleteId] = useState(null);
  const [showDeleteUserConfirmation, setShowDeleteUserConfirmation] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState(null);
  const [userToDeleteUsername, setUserToDeleteUsername] = useState('');
  const [showDeleteLogoConfirmation, setShowDeleteLogoConfirmation] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [cashierDashboardTitle, setCashierDashboardTitle] = useState('');
  const [newCashierDashboardTitle, setNewCashierDashboardTitle] = useState('');
  const navigate = useNavigate();
  const [isRestaurantSettingsModalOpen, setIsRestaurantSettingsModalOpen] = useState(false);
  const [restaurantSettings, setRestaurantSettings] = useState({ restaurant_name: 'Trz Kasir Apps', restaurant_slogan: 'Aplikasi kasir modern cepat dan keren' });

  // --- Effects ---
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
      } catch (e) { console.error("Error decoding token:", e); setUserRole(''); }
    }
  }, []);

  // Update document title when websiteTitle changes
  useEffect(() => {
    if (websiteTitle) {
      document.title = websiteTitle;
    }
  }, [websiteTitle]);

  // --- Handlers ---
  const clearMessages = () => { setMessage(''); setError(''); };
  const handleModalClose = () => { setActiveModal(null); clearMessages(); setEditingEmployee(null); };

  const handleSaveRestaurantSettings = async (settings) => {
    clearMessages();
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/restaurant-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Pengaturan restoran berhasil diperbarui!');
        fetchSettings(); // Refresh settings to update displayed values
      } else {
        setError(data.error || 'Gagal memperbarui pengaturan restoran');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/all-settings`);
      const data = await response.json();
      if (response.ok) {
        setWebsiteTitle(data.data.website_title || 'Kasir Berkah 88');
        setNewWebsiteTitle(data.data.website_title || 'Kasir Berkah 88');
        setNewHeaderTitle(data.data.header_title || 'Kasir Berkah 88');
        setRegistrationEnabled(data.data.registration_enabled === 'true');
        setWebDescription(data.data.web_description || '');
        setInitialCapital(data.data.initial_capital || '');
        setCashierDashboardTitle(data.data.cashier_dashboard_title || 'Dasbor Kasir');
        setNewCashierDashboardTitle(data.data.cashier_dashboard_title || 'Dasbor Kasir');

        // Fetch current logo URL
        const logoResponse = await authFetch(`${apiUrl}/api/settings/logo`);
        const logoData = await logoResponse.json();
        if (logoResponse.ok && logoData.data.logo_url) {
          setCurrentLogoUrl(`${apiUrl}${logoData.data.logo_url}`);
        } else {
          setCurrentLogoUrl(''); // No logo or failed to fetch
        }
        // Fetch restaurant settings
        const restaurantSettingsResponse = await authFetch(`${apiUrl}/api/restaurant-settings`);
        const restaurantSettingsData = await restaurantSettingsResponse.json();
        if (restaurantSettingsResponse.ok && restaurantSettingsData.data) {
          setRestaurantSettings(restaurantSettingsData.data);
        } else {
          console.error('Failed to fetch restaurant settings:', restaurantSettingsData.error);
        }

      } else {
        setError(data.error || 'Failed to fetch settings');
      } 
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
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

    // Validation for title-related settings to prevent empty values
    if (endpoint === '/api/settings/header_title' && (!body.value || body.value.trim() === '')) {
      setError('Judul header tidak boleh kosong');
      setIsLoading(false);
      return;
    }
    if (endpoint === '/api/settings/website_title' && (!body.value || body.value.trim() === '')) {
      setError('Judul situs web tidak boleh kosong');
      setIsLoading(false);
      return;
    }
    if (endpoint === '/api/settings/cashier_dashboard_title' && (!body.value || body.value.trim() === '')) {
      setError('Judul dasbor kasir tidak boleh kosong');
      setIsLoading(false);
      return;
    }

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
  
  const handleDeleteLogo = async () => {
    clearMessages();
    setIsLoading(true);
    setShowDeleteLogoConfirmation(false); // Close modal immediately
    try {
      const response = await authFetch(`${apiUrl}/api/settings/logo`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        setMessage('Logo berhasil dihapus! Halaman akan dimuat ulang.');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError(data.error || 'Gagal menghapus logo');
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

  const confirmDeleteUser = (userId, username) => {
    setUserToDeleteId(userId);
    setUserToDeleteUsername(username);
    setShowDeleteUserConfirmation(true);
  };

  const handleDeleteUser = async () => {
    clearMessages();
    setIsLoading(true);
    setShowDeleteUserConfirmation(false); // Close modal immediately
    try {
      const response = await authFetch(`${apiUrl}/api/admin/users/${userToDeleteId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Pengguna "${userToDeleteUsername}" berhasil dihapus!`);
        fetchUsers();
      } else {
        setError(data.error || 'Gagal menghapus pengguna');
      }
    } catch (err) {
      setError('Kesalahan jaringan');
    } finally {
      setIsLoading(false);
      setUserToDeleteId(null);
      setUserToDeleteUsername('');
    }
  };

  const handleCreateAdminUser = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Admin user created successfully!');
        setAdminUsername('');
        setAdminPassword('');
        fetchUsers(); // Refresh user list
        setTimeout(() => handleModalClose(), 1500);
      } else {
        setError(data.error || 'Failed to create admin user');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Create admin user error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeMasterPassword = async (e) => {
    e.preventDefault();
    clearMessages(); // Clear previous messages
    if (newMasterPassword !== confirmNewMasterPassword) {
      setError('Kata sandi master baru dan konfirmasi tidak cocok.');
      return;
    }
    try {
      const res = await authFetch(`${apiUrl}/api/settings/master-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentMasterPassword: currentMasterPassword,
          newMasterPassword: newMasterPassword,
        }),
      });
      if (res.ok) {
        setMessage('Kata sandi master berhasil diperbarui!');
        setCurrentMasterPassword('');
        setNewMasterPassword('');
        setConfirmNewMasterPassword('');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Gagal memperbarui kata sandi master.');
      }
    } catch (error) {
      console.error('Error updating master password:', error);
      setError(error.message);
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const url = editingEmployee ? `${apiUrl}/api/employees/${editingEmployee.id}` : `${apiUrl}/api/employees`;
    const method = editingEmployee ? 'PUT' : 'POST';

    try {
      const response = await authFetch(url, { method, body: formData });
      const data = await response.json();
      if (response.ok) {
        setMessage(editingEmployee ? 'Karyawan berhasil diperbarui!' : 'Karyawan berhasil ditambahkan!');
        fetchEmployees();
        setActiveModal('employeeManagement'); // Go back to list
        setEditingEmployee(null);
      } else {
        setError(data.error || 'Gagal menyimpan data karyawan');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteEmployee = (employeeId) => {
    setEmployeeToDeleteId(employeeId);
    setShowDeleteEmployeeConfirmation(true);
  };

  const handleDeleteEmployee = async () => {
    clearMessages();
    setIsLoading(true);
    setShowDeleteEmployeeConfirmation(false); // Close modal immediately
    try {
      const response = await authFetch(`${apiUrl}/api/employees/${employeeToDeleteId}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage('Karyawan berhasil dihapus.');
        fetchEmployees();
      } else {
        const data = await response.json();
        setError(data.error || 'Gagal menghapus karyawan');
      }
    } catch (err) {
      setError('Kesalahan jaringan');
    } finally {
      setIsLoading(false);
      setEmployeeToDeleteId(null);
    }
  };

  const openEmployeeForm = (employee) => {
    setEditingEmployee(employee);
    setActiveModal('employeeForm');
  };

  const handleClearAllData = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/admin/data/all`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterPassword: masterPasswordForClear }),
        disableRedirectOnAuthError: true,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Semua data berhasil dihapus!');
        // Optionally clear masterPasswordForClear here if needed
      } else if (response.status === 401) {
        setError(data.error || 'Kata sandi master salah!');
      } else {
        setError(data.error || 'Gagal menghapus semua data');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDataAsUpdated = async () => {
    clearMessages();
    setIsLoading(true);
    try {
        const response = await authFetch(`${apiUrl}/api/settings/data-updated-timestamp`, {
            method: 'PUT',
        });
        const data = await response.json();
        if (response.ok) {
            setMessage(`Data ditandai sebagai diperbarui pada: ${new Date(data.timestamp).toLocaleString()}`);
        } else {
            setError(data.error || 'Gagal menandai data sebagai diperbarui');
        }
    } catch (err) {
        setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
        setIsLoading(false);
        setIsConfirmationModalOpen(false);
    }
  };

  const openConfirmationModal = () => {
    setIsConfirmationModalOpen(true);
  };

  const confirmDeleteLogo = () => {
    setShowDeleteLogoConfirmation(true);
  };

  const breadcrumbs = [{ name: 'Beranda', path: '/main-dashboard' }, { name: 'Pengaturan', path: '/settings' }];
  const isAdmin = userRole === 'admin';

  return (
    <div className="flex flex-col h-screen">
      {theme === 'default' && <NavigationHeader title="Pengaturan" headerTitle={newHeaderTitle} />}
      <main className={`flex-grow ${theme === 'default' ? 'pt-16' : ''}`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-8 py-8" : ""}>
          <BreadcrumbNavigation paths={breadcrumbs} />
          <header className="mt-6 mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold tracking-tight text-text-primary flex items-center gap-3">
              <AppIcon name="Settings" className="w-10 h-10" /> Pengaturan Aplikasi
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
              <SettingsCard icon="Share2" title="Tampilan Media Sosial" description="Atur judul, deskripsi, dan gambar untuk berbagi di media sosial." onClick={() => setActiveModal('socialShare')} disabled={!isAdmin} />
              <SettingsCard icon="Type" title="Judul Dasbor Kasir" description="Ubah judul yang ditampilkan di halaman dasbor kasir." onClick={() => setActiveModal('cashierDashboardTitle')} disabled={!isAdmin} />

          <SettingsCard icon="ChartNoAxesColumnIncreasing" title="Laporan Transaksi Owner" description="Lihat laporan pendapatan dan pengeluaran bisnis owner." onClick={() => navigate('/admin-uang-bisnis')} />
              <SettingsCard
                icon="Store"
                title="Pengaturan Restoran"
                description="Ubah nama dan slogan restoran Anda."
                onClick={() => setIsRestaurantSettingsModalOpen(true)}
                disabled={!isAdmin}
              />
              <SettingsCard icon="Layout" title={`Beralih ke Tema ${theme === 'default' ? 'Admin' : 'Bawaan'}`} description={`Tema saat ini: ${theme === 'default' ? 'Bawaan' : 'Admin'}. Klik untuk mengganti.`} onClick={toggleTheme} />
              <SettingsCard icon="List" title="Kelola Kategori Menu" description="Tambah, ubah, atau hapus kategori untuk item menu." onClick={() => setActiveModal('categoryManagement')} disabled={!isAdmin} />
              {/* Card baru untuk Pengeluaran Lapak */}
              <SettingsCard icon="Wallet" title="Pengeluaran Lapak" description="Kelola uang masuk dan keluar untuk operasional lapak." onClick={() => navigate('/lapak-deposit')} disabled={!isAdmin && userRole !== 'user' && userRole !== 'kasir' && userRole !== 'owner'} />
              <SettingsCard icon="ClipboardCheck" title="Konfirmasi Pesanan" description="Akses halaman konfirmasi pesanan." onClick={() => navigate('/order-confirmation')} disabled={!isAdmin && userRole !== 'user' && userRole !== 'kasir'} />
              <SettingsCard icon="Package" title="Stok Bahan Baku" description="Kelola persediaan bahan baku produk Anda." onClick={() => navigate('/raw-material-stock')} disabled={!isAdmin} />



            </div>
          </div>

          {isAdmin && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-text-primary mb-6 border-b border-border pb-3">Manajemen & Keamanan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SettingsCard icon="Users" title="Kelola Pengguna" description="Lihat, ubah peran, dan hapus akun pengguna." onClick={() => setActiveModal('userManagement')} />
                <SettingsCard icon="Contact" title="Manajemen Karyawan" description="Tambah, ubah, dan hapus data karyawan." onClick={() => setActiveModal('employeeManagement')} />
                <SettingsCard icon="ShieldAlert" title="Kata Sandi Master" description="Ubah kata sandi master untuk tindakan sensitif." onClick={() => setActiveModal('masterPassword')} />
                <SettingsCard icon="Trash2" title="Hapus Semua Data" description="Hapus semua transaksi, pengeluaran, dan reset stok." onClick={() => setActiveModal('clearAllData')} />
                <SettingsCard icon="RefreshCw" title="Sinkronisasi Data" description="Tandai semua data (menu, harga) telah diperbarui." onClick={openConfirmationModal} />
              </div>
            </div>
          )}


        </div>
      </main>

      {/* --- ALL MODALS --- */}
      <SettingsModal title="Ubah Judul Dasbor Kasir" isOpen={activeModal === 'cashierDashboardTitle'} onClose={handleModalClose}>
        <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/cashier_dashboard_title', { value: newCashierDashboardTitle }, 'Judul dasbor kasir berhasil diperbarui!')} className="space-y-4">
          <Input label="Judul Dasbor Kasir Baru" name="newCashierDashboardTitle" type="text" value={newCashierDashboardTitle} onChange={(e) => setNewCashierDashboardTitle(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Ubah Judul Situs Web" isOpen={activeModal === 'websiteTitle'} onClose={handleModalClose}>
        <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/website_title', { value: newWebsiteTitle }, 'Judul situs berhasil diperbarui!')} className="space-y-4">
          <Input label="Judul Situs Web Baru" name="newWebsiteTitle" type="text" value={newWebsiteTitle} onChange={(e) => setNewWebsiteTitle(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Ubah Judul Header Web" isOpen={activeModal === 'headerTitle'} onClose={handleModalClose}>
        <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/header_title', { value: newHeaderTitle }, 'Judul header berhasil diperbarui!')} className="space-y-4">
          <Input label="Judul Header Baru" name="newHeaderTitle" type="text" value={newHeaderTitle} onChange={(e) => setNewHeaderTitle(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Ganti Logo Header" isOpen={activeModal === 'logo'} onClose={handleModalClose}>
        <form onSubmit={handleLogoUpload} className="space-y-6">
          {currentLogoUrl && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-text-secondary">Logo Saat Ini:</p>
              <img src={currentLogoUrl} alt="Logo Saat Ini" className="w-24 h-24 rounded-lg object-cover border border-dashed p-1" />
              <Button type="button" variant="destructive" onClick={confirmDeleteLogo} disabled={isLoading}>
                <AppIcon name="Trash2" className="w-4 h-4 mr-2" /> Hapus Logo
              </Button>
            </div>
          )}
          <Input label="Pilih File Logo Baru (PNG, JPG)" name="logoFile" type="file" accept=".png, .jpg, .jpeg" onChange={handleLogoFileChange} />
          {logoPreview && <img src={logoPreview} alt="Pratinjau Logo Baru" className="w-24 h-24 rounded-lg object-cover mx-auto border border-dashed p-1" />}
          <Button type="submit" className="w-full" disabled={isLoading || !logoFile}>{isLoading ? 'Mengunggah...' : 'Unggah dan Simpan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Atur Modal Awal" isOpen={activeModal === 'initialCapital'} onClose={handleModalClose}>
         <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/initial_capital', { value: initialCapital }, 'Modal awal berhasil diperbarui!')} className="space-y-4">
          <Input label="Jumlah Modal Awal (Rp)" name="initialCapital" type="number" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Ubah Deskripsi Web" isOpen={activeModal === 'webDescription'} onClose={handleModalClose}>
        <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/web_description', { value: webDescription }, 'Deskripsi web berhasil diperbarui!')} className="space-y-4">
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

      <SettingsModal title="Manajemen Pengguna" isOpen={activeModal === 'userManagement'} onClose={handleModalClose} size="3xl">
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">Daftar Pengguna</h4>
                <Button onClick={() => setActiveModal('createAdminUser')}><AppIcon name="UserPlus" className="w-4 h-4 mr-2"/>Tambah Admin Baru</Button>
            </div>
            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-left text-text-secondary"><tr><th className="p-3">ID</th><th className="p-3">Nama</th><th className="p-3">Peran</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-t border-border">
                                <td className="p-3">{user.id}</td>
                                <td className="p-3">{user.username}</td>
                                <td className="p-3">
                                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="bg-background border border-input rounded-md p-1" disabled={isLoading || user.id === 1}>
                                        <option value="user">Pengguna</option>
                                        <option value="kasir">Kasir</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="p-3">
                                    <Button variant="destructive" size="sm" onClick={() => confirmDeleteUser(user.id, user.username)} disabled={isLoading || user.id === 1 || (decodedToken && user.id === decodedToken.userId)}>Hapus</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </SettingsModal>

      <SettingsModal title="Buat Pengguna Admin Baru" isOpen={activeModal === 'createAdminUser'} onClose={handleModalClose}>
        <form onSubmit={handleCreateAdminUser} className="space-y-4">
          <Input label="Nama Pengguna" name="adminUsername" type="text" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} required />
          <Input
            label="Kata Sandi"
            name="adminPassword"
            type={showAdminPassword ? "text" : "password"}
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
            rightIcon={
              <span className="cursor-pointer" onClick={() => setShowAdminPassword(!showAdminPassword)}>
                <AppIcon name={showAdminPassword ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" />
              </span>
            }
          />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Membuat...' : 'Buat Admin'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Manajemen Karyawan" isOpen={activeModal === 'employeeManagement'} onClose={handleModalClose} size="3xl">
        <div className="space-y-4">
          <Button onClick={() => openEmployeeForm(null)} className="w-full md:w-auto"><AppIcon name="Plus" className="w-4 h-4 mr-2"/>Tambah Karyawan</Button>
          {message && <p className="text-sm text-center text-green-500 mt-2">{message}</p>}
          {error && <p className="text-sm text-center text-red-500 mt-2">{error}</p>}
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800 text-left text-text-secondary"><tr>
                <th className="px-2 py-1 min-w-max">Nama</th><th className="px-2 py-1 min-w-max">Posisi</th><th className="p-3">Kontak</th><th className="p-3">Aksi</th>
              </tr></thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-t border-border">
                    <td className="px-2 py-1 flex items-center gap-3 min-w-max"><img src={emp.avatar ? `${apiUrl}${emp.avatar}` : '/assets/images/no_image.png'} className="w-10 h-10 rounded-full object-cover"/>{emp.name}</td>
                    <td className="px-2 py-1 min-w-max">{emp.position}</td>
                    <td className="p-3">{emp.phone}<br/>{emp.email}</td>
                    <td className="p-3"><div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEmployeeForm(emp)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => confirmDeleteEmployee(emp.id)}>Hapus</Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SettingsModal>

      <SettingsModal title={editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'} isOpen={activeModal === 'employeeForm'} onClose={() => setActiveModal('employeeManagement')}>
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <Input label="Nama" name="name" defaultValue={editingEmployee?.name} required />
          <Input label="Posisi" name="position" defaultValue={editingEmployee?.position} required />
          <Input label="Telepon" name="phone" defaultValue={editingEmployee?.phone} />
          <Input label="Email" name="email" type="email" defaultValue={editingEmployee?.email} />
          <Input label="Avatar" name="avatar" type="file" accept="image/*" />
          {editingEmployee?.avatar && !editingEmployee?.avatar.startsWith('blob:') && <img src={`${apiUrl}${editingEmployee.avatar}`} className="w-20 h-20 rounded-full object-cover mt-2"/>}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setActiveModal('employeeManagement')}>Batal</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </SettingsModal>

      <SettingsModal title="Ubah Kata Sandi Master" isOpen={activeModal === 'masterPassword'} onClose={handleModalClose}>
        <form onSubmit={handleChangeMasterPassword} className="space-y-4">
          <p className="text-sm text-text-secondary">Kata sandi ini digunakan untuk mengotorisasi tindakan berbahaya seperti menghapus semua data.</p>
          <Input
            label="Kata Sandi Master Saat Ini"
            name="currentMasterPassword"
            type={showCurrentMasterPassword ? "text" : "password"}
            value={currentMasterPassword}
            onChange={(e) => setCurrentMasterPassword(e.target.value)}
            required
            rightIcon={
              <span className="cursor-pointer" onClick={() => setShowCurrentMasterPassword(!showCurrentMasterPassword)}>
                <AppIcon name={showCurrentMasterPassword ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" />
              </span>
            }
          />
          <Input
            label="Kata Sandi Master Baru"
            name="newMasterPassword"
            type={showNewMasterPassword ? "text" : "password"}
            value={newMasterPassword}
            onChange={(e) => setNewMasterPassword(e.target.value)}
            required
            rightIcon={
              <span className="cursor-pointer" onClick={() => setShowNewMasterPassword(!showNewMasterPassword)}>
                <AppIcon name={showNewMasterPassword ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" />
              </span>
            }
          />
          <Input
            label="Konfirmasi Kata Sandi Master Baru"
            name="confirmNewMasterPassword"
            type={showConfirmNewMasterPassword ? "text" : "password"}
            value={confirmNewMasterPassword}
            onChange={(e) => setConfirmNewMasterPassword(e.target.value)}
            required
            rightIcon={
              <span className="cursor-pointer" onClick={() => setShowConfirmNewMasterPassword(!showConfirmNewMasterPassword)}>
                <AppIcon name={showConfirmNewMasterPassword ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" />
              </span>
            }
          />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Hapus Semua Data" isOpen={activeModal === 'clearAllData'} onClose={handleModalClose}>
        <form onSubmit={handleClearAllData} className="space-y-4">
          <p className="text-sm text-text-secondary">Tindakan ini akan menghapus semua transaksi, pengeluaran, dan mengatur ulang stok item menu menjadi nol. Ini tidak dapat dibatalkan.</p>
          <Input
            label="Kata Sandi Master"
            name="masterPasswordForClear"
            type={showMasterPasswordForClear ? "text" : "password"}
            value={masterPasswordForClear}
            onChange={(e) => setMasterPasswordForClear(e.target.value)}
            required
            rightIcon={
              <span className="cursor-pointer" onClick={() => setShowMasterPasswordForClear(!showMasterPasswordForClear)}>
                <AppIcon name={showMasterPasswordForClear ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" />
              </span>
            }
          />
          <Button type="submit" variant="destructive" className="w-full" disabled={isLoading}>{isLoading ? 'Menghapus...' : 'Hapus Semua Data'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Pengaturan Tampilan Media Sosial" isOpen={activeModal === 'socialShare'} onClose={handleModalClose}>
        <SocialShareSettings onClose={handleModalClose} />
      </SettingsModal>

      <SettingsModal title="Kelola Kategori Menu" isOpen={activeModal === 'categoryManagement'} onClose={handleModalClose}>
        <CategorySettings onClose={handleModalClose} />
      </SettingsModal>

      <RestaurantSettingsModal
        isOpen={isRestaurantSettingsModalOpen}
        onClose={() => setIsRestaurantSettingsModalOpen(false)}
        onSave={handleSaveRestaurantSettings}
        initialSettings={restaurantSettings}
      />

      <ConfirmationModal
        isOpen={showDeleteUserConfirmation}
        onClose={() => setShowDeleteUserConfirmation(false)}
        onConfirm={handleDeleteUser}
        title="Konfirmasi Penghapusan Pengguna"
        message={`Apakah Anda yakin ingin menghapus pengguna "${userToDeleteUsername}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Pengguna"
        cancelText="Batal"
      />

      <ConfirmationModal
        isOpen={showDeleteEmployeeConfirmation}
        onClose={() => setShowDeleteEmployeeConfirmation(false)}
        onConfirm={handleDeleteEmployee}
        title="Konfirmasi Penghapusan Karyawan"
        message="Apakah Anda yakin ingin menghapus karyawan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Karyawan"
        cancelText="Batal"
      />

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleMarkDataAsUpdated}
        title="Konfirmasi Pembaruan Data"
        message="Apakah Anda yakin ingin menandai semua data sebagai telah diperbarui? Tindakan ini akan mencatat waktu saat ini sebagai waktu pembaruan terakhir."
        confirmText="Ya, Tandai Sudah Diperbarui"
        cancelText="Batal"
      />

      <ConfirmationModal
        isOpen={showDeleteLogoConfirmation}
        onClose={() => setShowDeleteLogoConfirmation(false)}
        onConfirm={handleDeleteLogo}
        title="Konfirmasi Penghapusan Logo"
        message="Apakah Anda yakin ingin menghapus logo? Ini akan membuat header tanpa gambar. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Logo"
        cancelText="Batal"
      />

      {message && <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{message}</div>}
      {error && <div className="fixed bottom-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{error}</div>}
    </div>
  );
};

export default Settings;
