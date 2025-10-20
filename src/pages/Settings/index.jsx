import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useNavigate } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_API_URL;

const Settings = ({ headerTitle }) => {
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [newWebsiteTitle, setNewWebsiteTitle] = useState('');
  const [newHeaderTitle, setNewHeaderTitle] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [users, setUsers] = useState([]); // New state for users
  const [decodedToken, setDecodedToken] = useState(null); // New state for decoded token
  const [currentMasterPassword, setCurrentMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [masterPasswordForClear, setMasterPasswordForClear] = useState('');
  const [webDescription, setWebDescription] = useState('');
  const [initialCapital, setInitialCapital] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [currentCoverImageUrl, setCurrentCoverImageUrl] = useState('');
  const [currentWebDescription, setCurrentWebDescription] = useState('');
  const [employees, setEmployees] = useState([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
    // Decode JWT to get user role
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setDecodedToken(decodedToken); // Store the whole decoded token
        setUserRole(decodedToken.role);
        if (decodedToken.role === 'admin') {
          fetchUsers(); // Fetch users if admin
          fetchEmployees(); // Fetch employees if admin
        }
      } catch (e) {
        console.error("Error decoding token:", e);
        setUserRole('');
      }
    }
  }, []);

  useEffect(() => {
    // Update Open Graph and Twitter meta tags
    const ogTitle = document.getElementById('og-title');
    if (ogTitle) ogTitle.content = websiteTitle;

    const ogDescription = document.getElementById('og-description');
    if (ogDescription) ogDescription.content = currentWebDescription;

    const ogImage = document.getElementById('og-image');
    if (ogImage) ogImage.content = currentCoverImageUrl || '/no_image.png'; // Fallback to default

    const twitterTitle = document.getElementById('twitter-title');
    if (twitterTitle) twitterTitle.content = websiteTitle;

    const twitterDescription = document.getElementById('twitter-description');
    if (twitterDescription) twitterDescription.content = currentWebDescription;

    const twitterImage = document.getElementById('twitter-image');
    if (twitterImage) twitterImage.content = currentCoverImageUrl || '/no_image.png'; // Fallback to default

  }, [currentWebDescription, currentCoverImageUrl, websiteTitle]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/all-settings`);
      const data = await response.json();
      if (response.ok) {
        setWebsiteTitle(data.data.website_title || 'Kasir Berkah 88');
        setNewWebsiteTitle(data.data.website_title || 'Kasir Berkah 88');
        setNewHeaderTitle(data.data.header_title || headerTitle || 'Kasir Berkah 88'); // Initialize newHeaderTitle with API data or prop
        setRegistrationEnabled(data.data.registration_enabled === 'true');
        setCurrentCoverImageUrl(data.data.cover_image_url || '');
        setCurrentWebDescription(data.data.web_description || '');
        setWebDescription(data.data.web_description || ''); // Initialize input field
        setInitialCapital(data.data.initial_capital || '');
      } else {
        setError(data.error || 'Failed to fetch settings');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Fetch settings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/admin/users`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data.data);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Fetch users error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/employees`);
      const data = await response.json();
      if (response.ok) {
        setEmployees(data.data);
      } else {
        setError(data.error || 'Failed to fetch employees');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Fetch employees error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEmployeeModal = (employee) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleCloseEmployeeModal = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(false);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.target);
    const employeeData = Object.fromEntries(formData.entries());

    const url = editingEmployee
      ? `${apiUrl}/api/employees/${editingEmployee.id}`
      : `${apiUrl}/api/employees`;
    const method = editingEmployee ? 'PUT' : 'POST';

    try {
      const response = await authFetch(url, {
        method,
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(editingEmployee ? 'Employee updated successfully!' : 'Employee added successfully!');
        fetchEmployees();
        handleCloseEmployeeModal();
      } else {
        setError(data.error || 'Failed to save employee');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Save employee error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete employee "${employeeName}"?`)) {
      setMessage('');
      setError('');
      setIsLoading(true);

      try {
        const response = await authFetch(`${apiUrl}/api/employees/${employeeId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (response.ok) {
          setMessage(`Employee "${employeeName}" deleted successfully!`);
          fetchEmployees();
        } else {
          setError(data.error || `Failed to delete employee "${employeeName}"`);
        }
      } catch (err) {
        setError('Network error or server unreachable');
        console.error('Delete employee error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };



  const handleUpdateWebsiteTitle = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/settings/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newWebsiteTitle }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Website title updated successfully!');
        setWebsiteTitle(newWebsiteTitle);
      } else {
        setError(data.error || 'Failed to update website title');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Update website title error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateHeaderTitle = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
        const response = await authFetch(`${apiUrl}/api/settings/header-title`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: newHeaderTitle }),
        });
        const data = await response.json();
        if (response.ok) {
            setMessage('Judul header berhasil diperbarui!');
        } else {
            setError(data.error || 'Gagal memperbarui judul header');
        }
    } catch (err) {
        setError('Kesalahan jaringan atau server tidak dapat dijangkau');
        console.error('Update header title error:', err);
    } finally {
        setIsLoading(false);
    }
};

  const handleUpdateInitialCapital = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
        const capitalValue = parseFloat(initialCapital);
        if (isNaN(capitalValue)) {
            setError("Modal awal harus berupa angka.");
            setIsLoading(false);
            return;
        }

        const settingsToUpdate = {
            initial_capital: capitalValue,
            initial_capital_date: new Date().toISOString(),
        };

        const response = await authFetch(`${apiUrl}/api/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settingsToUpdate),
        });

        const data = await response.json();
        if (response.ok) {
            setMessage('Modal awal berhasil diperbarui!');
            fetchSettings(); // Re-fetch to get the latest state
        } else {
            setError(data.error || 'Gagal memperbarui modal awal');
        }
    } catch (err) {
        setError('Kesalahan jaringan atau server tidak dapat dijangkau');
        console.error('Update initial capital error:', err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleToggleRegistration = async () => {
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/settings/registration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !registrationEnabled }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Registration setting updated successfully!');
        setRegistrationEnabled(!registrationEnabled);
      } else {
        setError(data.error || 'Failed to update registration setting');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Toggle registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdminUser = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
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

  const handleRoleChange = async (userId, newRole) => {
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`User role updated successfully for user ID ${userId}!`);
        fetchUsers(); // Refresh user list
      } else {
        setError(data.error || 'Failed to update user role');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Update user role error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeMasterPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/settings/master-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentMasterPassword, newMasterPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Master password updated successfully!');
        setCurrentMasterPassword('');
        setNewMasterPassword('');
      } else {
        setError(data.error || 'Failed to update master password');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Update master password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/admin/data/all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ masterPassword: masterPasswordForClear }),
        disableRedirectOnAuthError: true,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('All data cleared successfully!');
        setMasterPasswordForClear('');
      } else if (response.status === 401) {
        setError(data.error || 'Kata sandi master salah!');
      } else {
        setError(data.error || 'Failed to clear all data');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Clear all data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWebDescription = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/settings/description`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: webDescription }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Web description updated successfully!');
        setCurrentWebDescription(webDescription);
      } else {
        setError(data.error || 'Failed to update web description');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Update web description error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverImageUpload = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (!coverImageFile) {
      setError('Please select a cover image file to upload.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('coverImage', coverImageFile);

    try {
      const response = await authFetch(`${apiUrl}/api/settings/cover-image/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Cover image uploaded successfully!');
        setCurrentCoverImageUrl(data.data.cover_image_url); // Assuming backend returns the new URL
        setCoverImageFile(null); // Clear selected file
      } else {
        setError(data.error || 'Failed to upload cover image');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Cover image upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      setMessage('');
      setError('');
      setIsLoading(true);

      try {
        const response = await authFetch(`${apiUrl}/api/admin/users/${userId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (response.ok) {
          setMessage(`User "${username}" deleted successfully!`);
          fetchUsers(); // Refresh user list
        } else {
          setError(data.error || `Failed to delete user "${username}"`);
        }
      } catch (err) {
        setError('Network error or server unreachable');
        console.error('Delete user error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const breadcrumbs = [
    { name: 'Beranda', path: '/main-dashboard' },
    { name: 'Pengaturan', path: '/settings' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
              <NavigationHeader title="Pengaturan" headerTitle={headerTitle} />
      <BreadcrumbNavigation paths={breadcrumbs} />
      <div className="flex-grow pt-20 px-6 pb-20 overflow-auto">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-none p-8 space-y-8">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white text-center">Pengaturan Aplikasi</h2>

          {message && <p className="text-success text-center">{message}</p>}
          {error && <p className="text-destructive text-center">{error}</p>}

          {isLoading && <p className="text-center">Loading...</p>}

          {!isLoading && (
            <>
              {/* Website Title Setting */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary dark:text-white">Judul Situs Web</h3>
                <form onSubmit={handleUpdateWebsiteTitle} className="space-y-4">
                  <Input
                    label="Judul Saat Ini"
                    name="newWebsiteTitle"
                    type="text"
                    placeholder="Masukkan judul situs web baru"
                    value={newWebsiteTitle}
                    onChange={(e) => setNewWebsiteTitle(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isLoading || userRole !== 'admin' || userRole === 'guest'}>
                    Perbarui Judul
                  </Button>
                </form>
              </div>

              {/* Header Title Setting */}
              <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary dark:text-white">Judul Header Web</h3>
                  <form onSubmit={handleUpdateHeaderTitle} className="space-y-4">
                      <Input
                          label="Judul Header Saat Ini"
                          name="newHeaderTitle"
                          type="text"
                          placeholder="Masukkan judul header web baru"
                          value={newHeaderTitle}
                          onChange={(e) => setNewHeaderTitle(e.target.value)}
                          required
                      />
                      <Button type="submit" className="w-full" disabled={isLoading || userRole !== 'admin'}>
                          Perbarui Judul Header
                      </Button>
                  </form>
              </div>

              {/* Initial Capital Setting */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary dark:text-white">Modal Awal</h3>
                <form onSubmit={handleUpdateInitialCapital} className="space-y-4">
                  <Input
                    label="Jumlah Modal Awal (Rp)"
                    name="initialCapital"
                    type="number"
                    placeholder="Contoh: 5000000"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isLoading || userRole !== 'admin'}>
                    Simpan Modal Awal
                  </Button>
                </form>
              </div>

              {/* Registration Toggle Setting */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary dark:text-white">Pendaftaran Pengguna</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-200">Izinkan pengguna baru mendaftar:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value=""
                      className="sr-only peer"
                      checked={registrationEnabled}
                      onChange={handleToggleRegistration}
                      disabled={isLoading || userRole !== 'admin'}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                      {registrationEnabled ? 'Diaktifkan' : 'Dinonaktifkan'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Web Description Setting */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary dark:text-white">Deskripsi Web</h3>
                <form onSubmit={handleUpdateWebDescription} className="space-y-4">
                  <label htmlFor="webDescription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                    Deskripsi Saat Ini
                  </label>
                  <textarea
                    id="webDescription"
                    name="webDescription"
                    rows="4"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Masukkan deskripsi web untuk SEO dan berbagi media sosial"
                    value={webDescription}
                    onChange={(e) => setWebDescription(e.target.value)}
                    required
                  ></textarea>
                  <Button type="submit" className="w-full" disabled={isLoading || userRole !== 'admin'}>
                    Perbarui Deskripsi Web
                  </Button>
                </form>
              </div>

              {/* Favicon Setting */}
              {/* <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary">Favicon</h3>
                {currentFaviconUrl && (
                  <div className="flex items-center space-x-2">
                    <span>Favicon Saat Ini:</span>
                    <img src={currentFaviconUrl} alt="Current Favicon" className="w-8 h-8" />
                  </div>
                )}
                <form onSubmit={handleFaviconUpload} className="space-y-4">
                  <label htmlFor="faviconFile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                    Pilih File Favicon (PNG, ICO)
                  </label>
                  <input
                    id="faviconFile"
                    name="faviconFile"
                    type="file"
                    accept=".png, .ico"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setFaviconFile(e.target.files[0])}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading || userRole !== 'admin' || !faviconFile}>
                    Unggah Favicon
                  </Button>
                </form>
              </div> */}

              {/* Cover Image Setting */}
              {/* <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary">Gambar Sampul (untuk media sosial)</h3>
                {currentCoverImageUrl && (
                  <div className="flex items-center space-x-2">
                    <span>Gambar Sampul Saat Ini:</span>
                    <img src={currentCoverImageUrl} alt="Current Cover" className="w-32 h-auto" />
                  </div>
                )}
                <form onSubmit={handleCoverImageUpload} className="space-y-4">
                  <label htmlFor="coverImageFile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                    Pilih File Gambar Sampul (JPG, PNG)
                  </label>
                  <input
                    id="coverImageFile"
                    name="coverImageFile"
                    type="file"
                    accept=".jpg, .jpeg, .png"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setCoverImageFile(e.target.files[0])}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading || userRole !== 'admin' || !coverImageFile}>
                    Unggah Gambar Sampul
                  </Button>
                </form>
              </div> */}  

              {/* Create Admin User Section (Admin Only) */}
              {userRole === 'admin' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary dark:text-white">Buat Pengguna Admin Baru</h3>
                  <form onSubmit={handleCreateAdminUser} className="space-y-4">
                    <Input
                      label="Nama Pengguna"
                      name="adminUsername"
                      type="text"
                      placeholder="Masukkan nama pengguna untuk admin baru"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      required
                    />
                    <Input
                      label="Kata Sandi"
                      name="adminPassword"
                      type="password"
                      placeholder="Masukkan kata sandi untuk admin baru"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      Buat Admin
                    </Button>
                  </form>
                </div>
              )}

              {/* User List and Role Management (Admin Only) */}
              {userRole === 'admin' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary dark:text-white">Kelola Peran Pengguna</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm dark:shadow-none">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">ID</th>
                          <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Nama Pengguna</th>
                          <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Peran</th>
                          <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length > 0 ? (
                          users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="py-2 px-4 border-b text-sm text-gray-700 dark:text-gray-200">{user.id}</td>
                              <td className="py-2 px-4 border-b text-sm text-gray-700 dark:text-gray-200">{user.username}</td>
                              <td className="py-2 px-4 border-b text-sm text-gray-700 dark:text-gray-200">
                                <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                  disabled={isLoading || user.id === 1} // Disable changing role for default admin (ID 1)
                                >
                                  <option value="user">Pengguna</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="py-2 px-4 border-b text-sm text-gray-700">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  disabled={isLoading || user.id === 1 || (decodedToken && user.id === decodedToken.userId)} // Disable deleting default admin (ID 1) or self
                                  className="dark:bg-destructive dark:hover:bg-destructive/90 dark:text-destructive-foreground"
                                >
                                  Hapus
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-gray-500">Tidak ada pengguna ditemukan.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Employee Management Section (Admin Only) */}
              {userRole === 'admin' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary">Manajemen Karyawan</h3>
                  <Button onClick={() => handleOpenEmployeeModal(null)} className="w-full">Tambah Karyawan</Button>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Nama</th>
                          <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Posisi</th>
                          <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Telepon</th>
                          <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                          <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.length > 0 ? (
                          employees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="py-2 px-4 border-b text-sm text-gray-700 dark:text-gray-200">{employee.name}</td>
                              <td className="py-2 px-4 border-b text-sm text-gray-700 dark:text-gray-200">{employee.position}</td>
                              <td className="py-2 px-4 border-b text-sm text-gray-700 dark:text-gray-200">{employee.phone}</td>
                              <td className="py-2 px-4 border-b text-sm text-gray-700 dark:text-gray-200">{employee.email}</td>
                              <td className="py-2 px-4 border-b text-sm text-gray-700 dark:text-gray-200">
                                <Button variant="outline" size="sm" onClick={() => handleOpenEmployeeModal(employee)} className="mr-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteEmployee(employee.id, employee.name)} className="dark:bg-destructive dark:hover:bg-destructive/90 dark:text-destructive-foreground">Hapus</Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="py-4 text-center text-gray-500">Tidak ada karyawan ditemukan.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Master Password Management (Admin Only) */}
              {userRole === 'admin' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary">Ubah Kata Sandi Master</h3>
                  <form onSubmit={handleChangeMasterPassword} className="space-y-4">
                    <Input
                      label="Kata Sandi Master Saat Ini"
                      name="currentMasterPassword"
                      type="password"
                      placeholder="Masukkan kata sandi master saat ini"
                      value={currentMasterPassword}
                      onChange={(e) => setCurrentMasterPassword(e.target.value)}
                      required
                    />
                    <Input
                      label="Kata Sandi Master Baru"
                      name="newMasterPassword"
                      type="password"
                      placeholder="Masukkan kata sandi master baru"
                      value={newMasterPassword}
                      onChange={(e) => setNewMasterPassword(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      Perbarui Kata Sandi Master
                    </Button>
                  </form>
                </div>
              )}

              {/* Clear All Data (Admin Only) */}
              {userRole === 'admin' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary">Hapus Semua Data Aplikasi</h3>
                  <p className="text-sm text-text-secondary">
                    Tindakan ini akan menghapus semua transaksi, pengeluaran, dan mengatur ulang semua stok item menu menjadi nol secara permanen.
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <form onSubmit={handleClearAllData} className="space-y-4">
                    <Input
                      label="Kata Sandi Master"
                      name="masterPasswordForClear"
                      type="password"
                      placeholder="Masukkan kata sandi master untuk konfirmasi"
                      value={masterPasswordForClear}
                      onChange={(e) => setMasterPasswordForClear(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full bg-destructive hover:bg-red-700" disabled={isLoading}>
                      Hapus Semua Data
                    </Button>
                  </form>
                </div>
              )}

              {/* Credits Button */}
              <div className="space-y-4 pt-8">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/credits')}
                >
                  Lihat Credits
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}</h2>
            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <Input
                label="Nama"
                name="name"
                type="text"
                defaultValue={editingEmployee?.name}
                required
              />
              <Input
                label="Posisi"
                name="position"
                type="text"
                defaultValue={editingEmployee?.position}
                required
              />
              <Input
                label="Telepon"
                name="phone"
                type="text"
                defaultValue={editingEmployee?.phone}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                defaultValue={editingEmployee?.email}
              />
              <Input
                label="Avatar"
                name="avatar"
                type="file"
                accept="image/*"
              />
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCloseEmployeeModal}>Batal</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
