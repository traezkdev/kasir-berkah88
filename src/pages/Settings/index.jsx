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
import { useToast } from '../../components/ui/ToastNotification';
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
  const { showToast } = useToast();

  // Reusable Card Component (Updated for Ultra Premium Style)
  const SettingsCard = ({ icon, title, description, onClick, disabled = false }) => (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative overflow-hidden p-5 h-full rounded-[2rem] bg-card border border-gray-100/80 dark:border-slate-800/50
        transition-all duration-700 ease-out group gpu-acceleration
        ${disabled
          ? 'opacity-50 cursor-not-allowed grayscale'
          : 'cursor-pointer hover:shadow-[0_20px_50px_rgba(19,143,234,0.15)] hover:border-blue-500/50 hover:-translate-y-2 active:scale-[0.96] bg-gradient-to-br from-white to-gray-50/30 dark:from-slate-900 dark:to-slate-950/50'
        }
      `}
    >
      {/* Dynamic Background Elements (Visible but faint in idle) */}
      {!disabled && (
        <>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] rounded-full blur-xl group-hover:bg-blue-500/20 group-hover:scale-150 transition-all duration-1000 animate-blob" style={{ willChange: 'transform, opacity' }}></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04] rounded-full blur-xl group-hover:bg-indigo-500/10 group-hover:scale-150 transition-all duration-1000 animate-blob animation-delay-2000" style={{ willChange: 'transform, opacity' }}></div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none gpu-acceleration"
            style={{ backgroundImage: 'radial-gradient(circle, #138fea 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </>
      )}

      <div className="relative z-10 flex flex-col gap-6 h-full justify-between">
        <div>
          <div className={`
            w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all duration-700 transform
            ${disabled
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-slate-700 group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-gradient-to-br group-hover:from-[#138FEA] group-hover:to-[#0A56B1] group-hover:text-white group-hover:shadow-2xl group-hover:shadow-blue-500/40 group-hover:border-transparent'
            }
          `}>
            <AppIcon name={icon} size={22} />
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-text-primary tracking-tight uppercase leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {title}
              </h3>
              {!disabled && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-20 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500"></div>
              )}
            </div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] leading-relaxed opacity-40 group-hover:opacity-100 transition-opacity">
              {description}
            </p>
          </div>
        </div>

        {/* Small Action Indicator */}
        {!disabled && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-[-10px] group-hover:translate-x-0">
              <span>Konfigurasi</span>
              <AppIcon name="ArrowRight" size={14} />
            </div>

            {/* Visual Flair in Idle */}
            <div className="w-8 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden group-hover:w-0 transition-all duration-500">
              <div className="w-full h-full bg-blue-500/20 animate-pulse" style={{ willChange: 'opacity' }}></div>
            </div>
          </div>
        )}
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
  const [dailyWelcomeEnabled, setDailyWelcomeEnabled] = useState(true);
  const [newDailyWelcomeEnabled, setNewDailyWelcomeEnabled] = useState(true);

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
    setDailyWelcomeEnabled(localStorage.getItem('daily_welcome_enabled') !== 'false');
    setNewDailyWelcomeEnabled(localStorage.getItem('daily_welcome_enabled') !== 'false');
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
  const handleModalClose = () => { setActiveModal(null); setEditingEmployee(null); };

  const handleSaveRestaurantSettings = async (settings) => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/restaurant-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Pengaturan restoran berhasil diperbarui!', 'success');
        fetchSettings(); // Refresh settings to update displayed values
      } else {
        showToast(data.error || 'Gagal memperbarui pengaturan restoran', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan atau server tidak dapat dijangkau', 'error');
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
        showToast(data.error || 'Failed to fetch settings', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan atau server tidak dapat dijangkau', 'error');
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
    setIsLoading(true);

    // Validation for title-related settings to prevent empty values
    if (endpoint === '/api/settings/header_title' && (!body.value || body.value.trim() === '')) {
      showToast('Judul header tidak boleh kosong', 'error');
      setIsLoading(false);
      return;
    }
    if (endpoint === '/api/settings/website_title' && (!body.value || body.value.trim() === '')) {
      showToast('Judul situs web tidak boleh kosong', 'error');
      setIsLoading(false);
      return;
    }
    if (endpoint === '/api/settings/cashier_dashboard_title' && (!body.value || body.value.trim() === '')) {
      showToast('Judul dasbor kasir tidak boleh kosong', 'error');
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
        showToast(successMessage, 'success');
        fetchSettings();
        setTimeout(() => handleModalClose(), 1500);
      } else {
        showToast(data.error || 'Gagal melakukan pembaruan', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan atau server tidak dapat dijangkau', 'error');
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
    if (!logoFile) { showToast('Pilih file logo untuk diunggah.', 'error'); return; }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('logo', logoFile);
    try {
      const response = await authFetch(`${apiUrl}/api/settings/logo`, { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        showToast('Logo berhasil diunggah! Halaman akan dimuat ulang.', 'success');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showToast(data.error || 'Gagal mengunggah logo', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan atau server tidak dapat dijangkau', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    setIsLoading(true);
    setShowDeleteLogoConfirmation(false); // Close modal immediately
    try {
      const response = await authFetch(`${apiUrl}/api/settings/logo`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        showToast('Logo berhasil dihapus! Halaman akan dimuat ulang.', 'success');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showToast(data.error || 'Gagal menghapus logo', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan atau server tidak dapat dijangkau', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast(`Peran pengguna berhasil diperbarui!`, 'success');
        fetchUsers();
      } else {
        showToast(data.error || 'Gagal memperbarui peran', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan', 'error');
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
    setIsLoading(true);
    setShowDeleteUserConfirmation(false); // Close modal immediately
    try {
      const response = await authFetch(`${apiUrl}/api/admin/users/${userToDeleteId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        showToast(`Pengguna "${userToDeleteUsername}" berhasil dihapus!`, 'success');
        fetchUsers();
      } else {
        showToast(data.error || 'Gagal menghapus pengguna', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan', 'error');
    } finally {
      setIsLoading(false);
      setUserToDeleteId(null);
      setUserToDeleteUsername('');
    }
  };

  const handleCreateAdminUser = async (e) => {
    e.preventDefault();
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
        showToast('Admin user created successfully!', 'success');
        setAdminUsername('');
        setAdminPassword('');
        fetchUsers(); // Refresh user list
        setTimeout(() => handleModalClose(), 1500);
      } else {
        showToast(data.error || 'Failed to create admin user', 'error');
      }
    } catch (err) {
      showToast('Network error or server unreachable', 'error');
      console.error('Create admin user error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeMasterPassword = async (e) => {
    e.preventDefault();
    if (newMasterPassword !== confirmNewMasterPassword) {
      showToast('Kata sandi master baru dan konfirmasi tidak cocok.', 'error');
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
        showToast('Kata sandi master berhasil diperbarui!', 'success');
        setCurrentMasterPassword('');
        setNewMasterPassword('');
        setConfirmNewMasterPassword('');
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Gagal memperbarui kata sandi master.', 'error');
      }
    } catch (error) {
      console.error('Error updating master password:', error);
      showToast(error.message, 'error');
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const url = editingEmployee ? `${apiUrl}/api/employees/${editingEmployee.id}` : `${apiUrl}/api/employees`;
    const method = editingEmployee ? 'PUT' : 'POST';

    try {
      const response = await authFetch(url, { method, body: formData });
      const data = await response.json();
      if (response.ok) {
        showToast(editingEmployee ? 'Karyawan berhasil diperbarui!' : 'Karyawan berhasil ditambahkan!', 'success');
        fetchEmployees();
        setActiveModal('employeeManagement'); // Go back to list
        setEditingEmployee(null);
      } else {
        showToast(data.error || 'Gagal menyimpan data karyawan', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan atau server tidak dapat dijangkau', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteEmployee = (employeeId) => {
    setEmployeeToDeleteId(employeeId);
    setShowDeleteEmployeeConfirmation(true);
  };

  const handleDeleteEmployee = async () => {
    setIsLoading(true);
    setShowDeleteEmployeeConfirmation(false); // Close modal immediately
    try {
      const response = await authFetch(`${apiUrl}/api/employees/${employeeToDeleteId}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Karyawan berhasil dihapus.', 'success');
        fetchEmployees();
      } else {
        const data = await response.json();
        showToast(data.error || 'Gagal menghapus karyawan', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan', 'error');
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
        showToast('Semua data berhasil dihapus!', 'success');
        // Optionally clear masterPasswordForClear here if needed
      } else if (response.status === 401) {
        showToast(data.error || 'Kata sandi master salah!', 'error');
      } else {
        showToast(data.error || 'Gagal menghapus semua data', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan atau server tidak dapat dijangkau', 'error');
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
        <div className={theme === 'default' ? "w-full px-4 lg:px-8 pt-8 space-y-6 lg:space-y-8" : "space-y-6"}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch optimize-scroll">
            {/* Store Configuration Section */}
            <SettingsCard icon="Store" title="Identitas Toko" description="Nama, slogan, dan kontak resmi" onClick={() => setActiveModal('restaurantSettings')} disabled={!isAdmin} />
            <SettingsCard icon="Image" title="Logo & Branding" description="Ganti logo, judul aplikasi, dan SEO" onClick={() => setActiveModal('brandingSettings')} disabled={!isAdmin} />
            <SettingsCard icon="Layout" title="Tampilan & Tema" description="Ubah tema warna dan gaya aplikasi" onClick={() => setActiveModal('appStyleSelection')} disabled={!isAdmin} />
            <SettingsCard icon="Zap" title="Mode Aplikasi" description="Beralih mode Sederhana/Lengkap" onClick={() => setActiveModal('appMode')} disabled={!isAdmin} />
            <SettingsCard icon="Sunrise" title="Motivasi Harian" description="Aktifkan pesan penyemangat pagi" onClick={() => {
              setNewDailyWelcomeEnabled(dailyWelcomeEnabled);
              setActiveModal('dailyWelcome');
            }} />

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
            <SettingsCard icon="UserPlus" title="Registrasi User" description="Izinkan pendaftaran pengguna baru" onClick={() => setActiveModal('registration')} disabled={!isAdmin} />

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

      <SettingsModal title="Branding & Identitas Web" isOpen={activeModal === 'brandingSettings'} onClose={handleModalClose} size="xl">
        <div className="space-y-8">
          {/* Logo Section */}
          <div className="pb-6 border-b border-border">
            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4 opacity-70">Logo Aplikasi</h4>
            <form onSubmit={handleLogoUpload} className="space-y-4">
              {currentLogoUrl && (
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border group">
                  <div className="relative">
                    <img src={currentLogoUrl} alt="Current Logo" className="w-20 h-20 rounded-xl object-cover border bg-white shadow-sm" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <AppIcon name="Image" className="text-white w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-text-primary uppercase tracking-wider">Logo Aktif</p>
                    <p className="text-[9px] text-text-secondary mt-1">Logo ini tampil di header dan struk.</p>
                    <Button type="button" variant="destructive" size="sm" onClick={confirmDeleteLogo} className="mt-3 h-8 px-4 text-[10px] rounded-full font-black uppercase tracking-tighter">
                      Hapus Logo
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <div className="relative group">
                  <Input label="Pilih File Logo Baru" type="file" accept=".png, .jpg, .jpeg" onChange={handleLogoFileChange} className="cursor-pointer file:hidden" />
                  <div className="absolute right-4 top-[38px] pointer-events-none group-hover:scale-110 transition-transform">
                    <AppIcon name="UploadCloud" className="text-blue-500 w-5 h-5" />
                  </div>
                </div>

                {logoPreview && (
                  <div className="flex flex-col items-center p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800 animate-in fade-in zoom-in duration-300">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-3">Pratinjau Baru</p>
                    <img src={logoPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover shadow-2xl border-4 border-white dark:border-slate-800" />
                  </div>
                )}

                <Button type="submit" className="w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20" disabled={isLoading || !logoFile}>
                  {isLoading ? 'Mengunggah...' : 'Unggah & Simpan Logo'}
                </Button>
              </div>
            </form>
          </div>

          {/* Titles & SEO Section */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-70">Konfigurasi Teks & SEO</h4>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 bg-card rounded-2xl border border-border shadow-sm hover:border-blue-500/30 transition-colors">
                <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/website_title', { value: newWebsiteTitle }, 'Judul situs berhasil diperbarui!')} className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Judul Web (SEO)</span>
                  </div>
                  <Input placeholder="Contoh: Kasir Berkah 88 - Toko Online" value={newWebsiteTitle} onChange={(e) => setNewWebsiteTitle(e.target.value)} required />
                  <Button type="submit" size="sm" className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-lg" disabled={isLoading}>Update Judul Web</Button>
                </form>
              </div>

              <div className="p-5 bg-card rounded-2xl border border-border shadow-sm hover:border-indigo-500/30 transition-colors">
                <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/header_title', { value: newHeaderTitle }, 'Judul header berhasil diperbarui!')} className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Judul Header Sambutan</span>
                  </div>
                  <Input placeholder="Teks yang muncul di bagian atas halaman" value={newHeaderTitle} onChange={(e) => setNewHeaderTitle(e.target.value)} required />
                  <Button type="submit" size="sm" className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-lg bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>Update Judul Header</Button>
                </form>
              </div>

              <div className="p-5 bg-card rounded-2xl border border-border shadow-sm hover:border-emerald-500/30 transition-colors">
                <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/web_description', { value: webDescription }, 'Deskripsi web berhasil diperbarui!')} className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Deskripsi Web (Meta)</span>
                  </div>
                  <textarea
                    value={webDescription}
                    onChange={(e) => setWebDescription(e.target.value)}
                    rows="3"
                    className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Masukkan deskripsi untuk optimasi pencarian Google..."
                  />
                  <Button type="submit" size="sm" className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-lg bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>Update Deskripsi SEO</Button>
                </form>
              </div>

              <div className="p-5 bg-card rounded-2xl border border-border shadow-sm hover:border-amber-500/30 transition-colors">
                <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/cashier_dashboard_title', { value: newCashierDashboardTitle }, 'Judul dasbor kasir berhasil diperbarui!')} className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Judul Panel Kasir</span>
                  </div>
                  <Input placeholder="Judul khusus untuk halaman kasir" value={newCashierDashboardTitle} onChange={(e) => setNewCashierDashboardTitle(e.target.value)} required />
                  <Button type="submit" size="sm" className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-lg bg-amber-600 hover:bg-amber-700" disabled={isLoading}>Update Judul Kasir</Button>
                </form>
              </div>
            </div>
          </div>
        </div>
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

      <SettingsModal title="Pop-up Motivasi Harian" isOpen={activeModal === 'dailyWelcome'} onClose={handleModalClose}>
        <div className="space-y-6">
          <p className="text-sm text-text-secondary mb-4">
            Tampilkan pesan motivasi dan ayat penyemangat setiap pagi saat pertama kali membuka aplikasi.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {/* Enable Card */}
            <div onClick={() => setNewDailyWelcomeEnabled(true)} className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 flex items-center gap-4 ${newDailyWelcomeEnabled ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <AppIcon name="CheckCircle" className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-text-primary">Aktifkan</h4>
                <p className="text-sm text-text-secondary">Tampilkan pop-up setiap pagi.</p>
              </div>
              {newDailyWelcomeEnabled && <AppIcon name="Check" className="ml-auto text-primary w-6 h-6" />}
            </div>

            {/* Disable Card */}
            <div onClick={() => setNewDailyWelcomeEnabled(false)} className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 flex items-center gap-4 ${!newDailyWelcomeEnabled ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AppIcon name="XCircle" className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-text-primary">Nonaktifkan</h4>
                <p className="text-sm text-text-secondary">Jangan tampilkan pop-up ini lagi.</p>
              </div>
              {!newDailyWelcomeEnabled && <AppIcon name="Check" className="ml-auto text-primary w-6 h-6" />}
            </div>
          </div>
          <Button onClick={() => {
            localStorage.setItem('daily_welcome_enabled', newDailyWelcomeEnabled);
            setDailyWelcomeEnabled(newDailyWelcomeEnabled);
            showToast('Pengaturan berhasil disimpan!', 'success');
            setTimeout(() => handleModalClose(), 1000);
          }} className="w-full mt-4" disabled={isLoading}>Simpan Pengaturan</Button>
        </div>
      </SettingsModal>

      <SettingsModal title="Tampilan & Tema" isOpen={activeModal === 'appStyleSelection'} onClose={handleModalClose}>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Pilih Gaya Aplikasi</h4>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setAppStyle('clean')}
                className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 ${appStyle === 'clean' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <AppIcon name="Layout" className={`w-6 h-6 ${appStyle === 'clean' ? 'text-primary' : 'text-text-secondary'}`} />
                  </div>
                  <span className={`text-sm font-black uppercase tracking-tighter ${appStyle === 'clean' ? 'text-primary' : 'text-text-primary'}`}>Gaya Clean</span>
                </div>
              </div>
              <div
                onClick={() => setAppStyle('elegant')}
                className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 ${appStyle === 'elegant' ? 'border-indigo-600 bg-indigo-50/50' : 'border-border hover:border-indigo-300'}`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <AppIcon name="Sparkles" className={`w-6 h-6 ${appStyle === 'elegant' ? 'text-indigo-600' : 'text-text-secondary'}`} />
                  </div>
                  <span className={`text-sm font-black uppercase tracking-tighter ${appStyle === 'elegant' ? 'text-indigo-600' : 'text-text-primary'}`}>Gaya Elegant</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <h4 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Pilih Tema Panel</h4>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => theme !== 'default' && toggleTheme()}
                className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 ${theme === 'default' ? 'border-blue-600 bg-blue-50/50' : 'border-border hover:border-blue-300'}`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-200">
                    <AppIcon name="Monitor" className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-black uppercase tracking-tighter ${theme === 'default' ? 'text-blue-600' : 'text-text-primary'}`}>Tema Default</span>
                </div>
              </div>
              <div
                onClick={() => theme !== 'admin' && toggleTheme()}
                className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 ${theme === 'admin' ? 'border-gray-900 bg-gray-50' : 'border-border hover:border-gray-300'}`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gray-400">
                    <AppIcon name="Shield" className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-black uppercase tracking-tighter ${theme === 'admin' ? 'text-gray-900' : 'text-text-primary'}`}>Tema Admin</span>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={handleModalClose} className="w-full mt-4 py-4 rounded-2xl font-black uppercase tracking-widest">Selesai</Button>
        </div>
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
              <thead className="bg-gray-100 dark:bg-gray-800 text-left text-text-secondary"><tr><th className="p-3">ID</th><th className="p-3">Nama/Kontak</th><th className="p-3">Peran</th><th className="p-3">Aksi</th></tr></thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t border-border">
                    <td className="p-3">{user.id}</td>
                    <td className="p-3">
                      <div className="font-bold">{user.username}</div>
                      <div className="text-[10px] text-text-secondary">{user.phone || '-'}</div>
                      <div className="text-[10px] text-text-secondary truncate max-w-[150px]" title={user.address}>{user.address || '-'}</div>
                    </td>
                    <td className="p-3">
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="bg-background border border-input rounded-md p-1" disabled={isLoading || user.id === 1}>
                        <option value="user">Pengguna</option>
                        <option value="kasir">Kasir</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                        <option value="pelanggan">Pelanggan</option>
                        <option value="penjual">Penjual</option>
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

      <SettingsModal title="Atur Modal Awal" isOpen={activeModal === 'initialCapital'} onClose={handleModalClose}>
        <form onSubmit={(e) => handleUpdateSetting(e, '/api/settings/initial_capital', { value: initialCapital }, 'Modal awal berhasil diperbarui!')} className="space-y-4">
          <Input label="Jumlah Modal Awal (Rp)" name="initialCapital" type="number" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
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

      <RestaurantSettingsModal isOpen={activeModal === 'restaurantSettings'} onClose={handleModalClose} onSave={handleSaveRestaurantSettings} initialSettings={restaurantSettings} />

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
    </div>
  );
};

export default Settings;
