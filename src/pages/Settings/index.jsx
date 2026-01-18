import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { jwtDecode } from 'jwt-decode';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNavigate, useLocation } from 'react-router-dom';
import AppIcon from '../../components/AppIcon';
import RestaurantSettingsModal from './components/RestaurantSettingsModal';
import DataSyncModal from './DataSyncModal';
import ExpenseCategorySettings from './ExpenseCategorySettings';

import SocialShareSettings from './SocialShareSettings';
import CategorySettings from './CategorySettings';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';

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

const Settings = () => {
  const { theme, toggleTheme, appStyle, setAppStyle } = useTheme();
  const { appMode, toggleAppMode, toggleSidebar } = useAppSettings();

  // Reusable Card Component (Updated for DANA Style)
  const SettingsCard = ({ icon, title, description, onClick, disabled = false }) => (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`dana-card p-6 active:scale-[0.98] transition-all duration-200 border-none shadow-lg shadow-gray-200/50 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
          <AppIcon name={icon} size={24} />
        </div>
        <div>
          <h3 className="text-base font-black text-gray-900 tracking-tighter uppercase">{title}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
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
  const [webDescription, setWebDescription] = useState('');

  const [masterPasswordForClear, setMasterPasswordForClear] = useState('');
  const [showMasterPasswordForClear, setShowMasterPasswordForClear] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
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
  const [isDataSyncModalOpen, setIsDataSyncModalOpen] = useState(false);
  const [ppnRate, setPpnRate] = useState('');
  const [newPpnRate, setNewPpnRate] = useState('');
  const [receiptVersion, setReceiptVersion] = useState('1');
  const [newReceiptVersion, setNewReceiptVersion] = useState('1');
  const [authUiVersion, setAuthUiVersion] = useState('1');
  const [newAuthUiVersion, setNewAuthUiVersion] = useState('1');

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

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modalToOpen = params.get('modal');
    if (modalToOpen) {
      setActiveModal(modalToOpen);
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  }, [location]);

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
        setPpnRate(data.data.ppn || '0.12');
        setNewPpnRate(data.data.ppn || '0.12');
        setReceiptVersion(data.data.receipt_version || '1');
        setNewReceiptVersion(data.data.receipt_version || '1');
        setAuthUiVersion(data.data.auth_ui_version || '1');
        setNewAuthUiVersion(data.data.auth_ui_version || '1');

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

  const handleUpdateSetting = async (e, endpoint, body, successMessage, method = 'PUT') => {
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
        method: method,
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



  const confirmDeleteLogo = () => {
    setShowDeleteLogoConfirmation(true);
  };

  const breadcrumbs = [{ name: 'Beranda', path: '/main-dashboard' }, { name: 'Pengaturan', path: '/settings' }];
  const isAdmin = userRole === 'admin';

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50 lg:bg-background' : ''}`}>
      {theme === 'default' && (
        userRole === 'owner' ? (
          <OwnerNavigationHeader
            onToggleSidebar={toggleSidebar}
            headerTitle={websiteTitle || 'Kasir Berkah 88'}
          />
        ) : (
          <NavigationHeader
            onToggleSidebar={toggleSidebar}
            headerTitle={websiteTitle || 'Kasir Berkah 88'}
          />
        )
      )}

      <main className={`${theme === 'default' ? 'pt-20 lg:pt-16' : ''} pb-24 lg:pb-8`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 pt-8 space-y-6 lg:space-y-8" : "space-y-6"}>
          {/* Breadcrumb */}
          <div className="mb-6 hidden md:block">
            <BreadcrumbNavigation paths={breadcrumbs} />
          </div>

          <div className="mb-8 lg:mb-10">
            <h1 className="text-3xl lg:text-3xl font-black text-text-primary mt-4 tracking-tighter uppercase lg:normal-case">
              Pengaturan Sistem
            </h1>
            <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 lg:hidden"></div>
            <p className="text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
              Konfigurasi toko, pengguna, dan preferensi aplikasi Anda
            </p>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Store Configuration Section */}
            <SettingsCard icon="Store" title="Identitas Toko" description="Nama, logo, dan deskripsi website" onClick={() => setActiveModal('restaurantSettings')} disabled={!isAdmin} />
            <SettingsCard icon="Layout" title="Tampilan & Tema" description="Ubah tema warna dan gaya aplikasi" onClick={() => setActiveModal('appStyleSelection')} disabled={!isAdmin} />
            <SettingsCard icon="Zap" title="Mode Aplikasi" description="Beralih mode Sederhana/Lengkap" onClick={() => setActiveModal('appMode')} disabled={!isAdmin} />

            {/* General Settings */}
            <SettingsCard icon="FileText" title="PPN & Struk" description="Atur rate PPN dan versi struk" onClick={() => setActiveModal('receiptVersion')} disabled={!isAdmin} />
            <SettingsCard icon="LayoutList" title="Kategori Menu" description="Kelola kategori produk makanan/minuman" onClick={() => setActiveModal('categoryManagement')} disabled={!isAdmin} />
            <SettingsCard icon="Wallet" title="Kategori Biaya" description="Kelola kategori pengeluaran operasional" onClick={() => setActiveModal('expenseCategoryManagement')} disabled={!isAdmin} />

            {/* Security & Data */}
            <SettingsCard icon="Users" title="Manajemen Pengguna" description="Kelola akun admin dan kasir" onClick={() => setActiveModal('userManagement')} disabled={!isAdmin} />
            <SettingsCard icon="Contact" title="Data Karyawan" description="Kelola profil dan jabatan karyawan" onClick={() => setActiveModal('employeeManagement')} disabled={!isAdmin} />
            <SettingsCard icon="Lock" title="Sandi Master" description="Otoritas tindakan konfirmasi data" onClick={() => setActiveModal('masterPassword')} disabled={!isAdmin} />
            <SettingsCard icon="Monitor" title="UI Login & Daftar" description="Pilih tampilan halaman autentikasi" onClick={() => setActiveModal('authUiSelection')} disabled={!isAdmin} />
            <SettingsCard icon="Database" title="Manajemen Database" description="Backup dan restore data aplikasi" onClick={() => navigate('/settings/database')} disabled={!isAdmin} />

            {/* Advanced & Social */}
            <SettingsCard icon="PiggyBank" title="Modal Awal" description="Atur saldo awal kas operasional" onClick={() => setActiveModal('initialCapital')} disabled={!isAdmin} />
            <SettingsCard icon="Share2" title="Media Sosial" description="Atur link berbagi ke media sosial" onClick={() => setActiveModal('socialShare')} disabled={!isAdmin} />
            <SettingsCard icon="RefreshCw" title="Sinkronisasi Data" description="Sinkronkan data lokal ke cloud" onClick={() => setActiveModal('dataSync')} disabled={!isAdmin} />
            <SettingsCard icon="Trash2" title="Bersihkan Data" description="Hapus semua riwayat (Hati-hati!)" onClick={() => setActiveModal('clearAllData')} disabled={!isAdmin} />
          </div>
        </div>
      </main>

      {/* --- ALL MODALS --- */}
      <DataSyncModal isOpen={activeModal === 'dataSync'} onClose={handleModalClose} />

      <SettingsModal title="Ubah Judul Dasbor Kasir" isOpen={activeModal === 'cashierDashboardTitle'} onClose={handleModalClose}>
        <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/cashier_dashboard_title', { value: newCashierDashboardTitle }, 'Judul dasbor kasir berhasil diperbarui!')} className="space-y-4">
          <Input label="Judul Dasbor Kasir Baru" name="newCashierDashboardTitle" type="text" value={newCashierDashboardTitle} onChange={(e) => setNewCashierDashboardTitle(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Atur PPN Global" isOpen={activeModal === 'ppnRate'} onClose={handleModalClose}>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleUpdateSetting(e, '/api/settings', { ppn: newPpnRate }, 'PPN Global berhasil diperbarui!', 'POST');
        }} className="space-y-4">
          <p className="text-sm text-text-secondary mb-4">Nilai 0.12 berarti 12%. Gunakan titik (.) untuk desimal.</p>
          <Input
            label="Rate PPN (Contoh: 0.12 untuk 12%)"
            name="newPpnRate"
            type="number"
            step="0.01"
            value={newPpnRate}
            onChange={(e) => setNewPpnRate(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Pengaturan Struk" isOpen={activeModal === 'receiptVersion'} onClose={handleModalClose}>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleUpdateSetting(e, '/api/settings/receipt_version', { value: newReceiptVersion }, 'Pengaturan struk berhasil diperbarui!');
        }} className="space-y-6">
          <p className="text-sm text-text-secondary mb-4">Pilih versi tampilan struk transaksi yang akan dicetak atau ditampilkan kepada pelanggan.</p>
          <div className="grid grid-cols-1 gap-4">
            <div onClick={() => setNewReceiptVersion('1')} className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 flex items-center gap-4 ${newReceiptVersion === '1' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <AppIcon name="ReceiptText" className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-text-primary">Struk Versi 1 (Bawaan)</h4>
                <p className="text-sm text-text-secondary">Tampilan klasik yang bersih dan informatif.</p>
              </div>
              {newReceiptVersion === '1' && <AppIcon name="Check" className="ml-auto text-primary w-6 h-6" />}
            </div>
            <div onClick={() => setNewReceiptVersion('2')} className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 flex items-center gap-4 ${newReceiptVersion === '2' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <AppIcon name="FileText" className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-text-primary">Struk Versi 2 (Modern)</h4>
                <p className="text-sm text-text-secondary">Desain modern dengan tata letak yang lebih dinamis.</p>
              </div>
              {newReceiptVersion === '2' && <AppIcon name="Check" className="ml-auto text-primary w-6 h-6" />}
            </div>
          </div>
          <Button type="submit" className="w-full mt-4" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Tampilan Login & Daftar" isOpen={activeModal === 'authUiSelection'} onClose={handleModalClose}>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleUpdateSetting(e, '/api/settings/auth_ui_version', { value: newAuthUiVersion }, 'Tampilan autentikasi berhasil diperbarui!');
        }} className="space-y-6">
          <p className="text-sm text-text-secondary mb-4">Pilih gaya desain untuk halaman Login dan Register aplikasi Anda.</p>
          <div className="grid grid-cols-1 gap-4">
            {/* UI Version 1 Card */}
            <div
              onClick={() => setNewAuthUiVersion('1')}
              className={`cursor-pointer p-5 border-2 rounded-2xl transition-all duration-300 flex items-center gap-5 ${newAuthUiVersion === '1' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-border hover:border-blue-300'}`}
            >
              <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-border shadow-sm">
                <AppIcon name="Layout" className="w-7 h-7 text-gray-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-gray-900 tracking-tighter uppercase">UI Versi 1 (Klasik)</h4>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sederhana & Ringan</p>
              </div>
              {newAuthUiVersion === '1' && <AppIcon name="CheckCircle" className="text-blue-600 w-6 h-6" />}
            </div>

            {/* UI Version 2 Card */}
            <div
              onClick={() => setNewAuthUiVersion('2')}
              className={`cursor-pointer p-5 border-2 rounded-2xl transition-all duration-300 flex items-center gap-5 ${newAuthUiVersion === '2' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-border hover:border-blue-300'}`}
            >
              <div className="w-14 h-14 rounded-xl bg-[#0052CC] flex items-center justify-center shadow-lg shadow-blue-200">
                <AppIcon name="Zap" className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-gray-900 tracking-tighter uppercase">UI Versi 2 (Modern)</h4>
                <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mt-1">Vibrant, Biru, & WOW</p>
              </div>
              {newAuthUiVersion === '2' && <AppIcon name="CheckCircle" className="text-blue-600 w-6 h-6" />}
            </div>
          </div>
          <Button type="submit" className="w-full mt-6 py-4 rounded-2xl font-black uppercase tracking-widest" disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : 'Gunakan Tampilan Terpilih'}
          </Button>
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
            <Button onClick={() => setActiveModal('createAdminUser')}><AppIcon name="UserPlus" className="w-4 h-4 mr-2" />Tambah Admin Baru</Button>
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
          <Input label="Kata Sandi" name="adminPassword" type={showAdminPassword ? "text" : "password"} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required
            rightIcon={<span className="cursor-pointer" onClick={() => setShowAdminPassword(!showAdminPassword)}><AppIcon name={showAdminPassword ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" /></span>} />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Membuat...' : 'Buat Admin'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Manajemen Karyawan" isOpen={activeModal === 'employeeManagement'} onClose={handleModalClose} size="3xl">
        <div className="space-y-4">
          <Button onClick={() => openEmployeeForm(null)} className="w-full md:w-auto"><AppIcon name="Plus" className="w-4 h-4 mr-2" />Tambah Karyawan</Button>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800 text-left text-text-secondary"><tr><th className="px-2 py-1">Nama</th><th className="px-2 py-1">Posisi</th><th className="p-3">Kontak</th><th className="p-3">Aksi</th></tr></thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-t border-border">
                    <td className="px-2 py-1 flex items-center gap-3"><img src={emp.avatar ? `${apiUrl}${emp.avatar}` : '/assets/images/no_image.png'} className="w-10 h-10 rounded-full object-cover" />{emp.name}</td>
                    <td className="px-2 py-1">{emp.position}</td>
                    <td className="p-3">{emp.phone}<br />{emp.email}</td>
                    <td className="p-3"><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => openEmployeeForm(emp)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => confirmDeleteEmployee(emp.id)}>Hapus</Button></div></td>
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
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setActiveModal('employeeManagement')}>Batal</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </SettingsModal>

      <SettingsModal title="Ubah Kata Sandi Master" isOpen={activeModal === 'masterPassword'} onClose={handleModalClose}>
        <form onSubmit={handleChangeMasterPassword} className="space-y-4">
          <p className="text-sm text-text-secondary">Digunakan untuk otorisasi penghapusan data masal.</p>
          <Input label="Sandi Master Saat Ini" name="currentMasterPassword" type={showCurrentMasterPassword ? "text" : "password"} value={currentMasterPassword} onChange={(e) => setCurrentMasterPassword(e.target.value)} required
            rightIcon={<span className="cursor-pointer" onClick={() => setShowCurrentMasterPassword(!showCurrentMasterPassword)}><AppIcon name={showCurrentMasterPassword ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" /></span>} />
          <Input label="Sandi Master Baru" name="newMasterPassword" type={showNewMasterPassword ? "text" : "password"} value={newMasterPassword} onChange={(e) => setNewMasterPassword(e.target.value)} required
            rightIcon={<span className="cursor-pointer" onClick={() => setShowNewMasterPassword(!showNewMasterPassword)}><AppIcon name={showNewMasterPassword ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" /></span>} />
          <Input label="Konfirmasi Sandi Baru" name="confirmNewMasterPassword" type={showConfirmNewMasterPassword ? "text" : "password"} value={confirmNewMasterPassword} onChange={(e) => setConfirmNewMasterPassword(e.target.value)} required
            rightIcon={<span className="cursor-pointer" onClick={() => setShowConfirmNewMasterPassword(!showConfirmNewMasterPassword)}><AppIcon name={showConfirmNewMasterPassword ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" /></span>} />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Bersihkan Semua Data" isOpen={activeModal === 'clearAllData'} onClose={handleModalClose}>
        <form onSubmit={handleClearAllData} className="space-y-4">
          <p className="text-sm text-text-secondary">Tindakan permanen! Menghapus semua transaksi dan riwayat bisnis.</p>
          <Input label="Kata Sandi Master" name="masterPasswordForClear" type={showMasterPasswordForClear ? "text" : "password"} value={masterPasswordForClear} onChange={(e) => setMasterPasswordForClear(e.target.value)} required
            rightIcon={<span className="cursor-pointer" onClick={() => setShowMasterPasswordForClear(!showMasterPasswordForClear)}><AppIcon name={showMasterPasswordForClear ? "EyeOff" : "Eye"} className="h-5 w-5 text-gray-400" /></span>} />
          <Button type="submit" variant="destructive" className="w-full" disabled={isLoading}>{isLoading ? 'Menghapus...' : 'Hapus Semua Data'}</Button>
        </form>
      </SettingsModal>

      <SettingsModal title="Media Sosial" isOpen={activeModal === 'socialShare'} onClose={handleModalClose}>
        <SocialShareSettings onClose={handleModalClose} />
      </SettingsModal>

      <SettingsModal title="Kategori Menu" isOpen={activeModal === 'categoryManagement'} onClose={handleModalClose}>
        <CategorySettings onClose={handleModalClose} />
      </SettingsModal>

      <SettingsModal title="Kategori Pengeluaran" isOpen={activeModal === 'expenseCategoryManagement'} onClose={handleModalClose}>
        <ExpenseCategorySettings onClose={handleModalClose} />
      </SettingsModal>

      <RestaurantSettingsModal isOpen={activeModal === 'restaurantSettings'} onClose={handleModalClose} onSave={handleSaveRestaurantSettings} />

      {/* Modal App Mode selection */}
      <SettingsModal title="Pilih Gaya Aplikasi" isOpen={activeModal === 'appStyleSelection'} onClose={handleModalClose}>
        <div className="space-y-4">
          <div onClick={() => { setAppStyle('clean'); handleModalClose(); }}
            className={`cursor-pointer p-4 border-2 rounded-xl flex items-center gap-4 ${appStyle === 'clean' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <h4 className="font-bold flex-1">Clean White</h4>
            {appStyle === 'clean' && <AppIcon name="Check" className="text-primary" />}
          </div>
          <div onClick={() => { setAppStyle('elegant'); handleModalClose(); }}
            className={`cursor-pointer p-4 border-2 rounded-xl flex items-center gap-4 ${appStyle === 'elegant' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <h4 className="font-bold flex-1">Elegant Colorful</h4>
            {appStyle === 'elegant' && <AppIcon name="Check" className="text-primary" />}
          </div>
        </div>
      </SettingsModal>

      <SettingsModal title="Mode Aplikasi" isOpen={activeModal === 'appMode'} onClose={handleModalClose}>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm font-bold text-blue-900">Mode: {appMode === 'simple' ? 'Sederhana' : 'Lengkap'}</p></div>
          <Button className="w-full" onClick={async () => {
            const newMode = appMode === 'simple' ? 'full' : 'simple';
            const result = await toggleAppMode(newMode);
            if (result.success) { window.location.reload(); }
          }}>{`Beralih ke Mode ${appMode === 'simple' ? 'Lengkap' : 'Sederhana'}`}</Button>
        </div>
      </SettingsModal>

      <ConfirmationModal isOpen={showDeleteUserConfirmation} onClose={() => setShowDeleteUserConfirmation(false)} onConfirm={handleDeleteUser} title="Hapus Pengguna" message={`Hapus "${userToDeleteUsername}"?`} />
      <ConfirmationModal isOpen={showDeleteEmployeeConfirmation} onClose={() => setShowDeleteEmployeeConfirmation(false)} onConfirm={handleDeleteEmployee} title="Hapus Karyawan" message="Hapus karyawan ini?" />
      <ConfirmationModal isOpen={showDeleteLogoConfirmation} onClose={() => setShowDeleteLogoConfirmation(false)} onConfirm={handleDeleteLogo} title="Hapus Logo" message="Hapus logo header?" />

      {message && <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{message}</div>}
      {error && <div className="fixed bottom-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{error}</div>}
    </div>
  );
};

export default Settings;
