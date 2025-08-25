import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useNavigate } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_API_URL;

const Settings = () => {
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [newWebsiteTitle, setNewWebsiteTitle] = useState('');
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
        }
      } catch (e) {
        console.error("Error decoding token:", e);
        setUserRole('');
      }
    }
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/settings`);
      const data = await response.json();
      if (response.ok) {
        setWebsiteTitle(data.data.website_title || 'Kasir Berkah 88');
        setNewWebsiteTitle(data.data.website_title || 'Kasir Berkah 88');
        setRegistrationEnabled(data.data.registration_enabled === 'true');
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
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('All data cleared successfully!');
        setMasterPasswordForClear('');
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
              <NavigationHeader title="Pengaturan" />
      <BreadcrumbNavigation paths={breadcrumbs} />
      <div className="flex-grow pt-20 px-6 pb-20 overflow-auto">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 space-y-8">
          <h2 className="text-2xl font-bold text-text-primary text-center">Pengaturan Aplikasi</h2>

          {message && <p className="text-success text-center">{message}</p>}
          {error && <p className="text-destructive text-center">{error}</p>}

          {isLoading && <p className="text-center">Loading...</p>}

          {!isLoading && (
            <>
              {/* Website Title Setting */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary">Judul Situs Web</h3>
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
                  <Button type="submit" className="w-full" disabled={isLoading || userRole !== 'admin'}>
                    Perbarui Judul
                  </Button>
                </form>
              </div>

              {/* Registration Toggle Setting */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary">Pendaftaran Pengguna</h3>
                <div className="flex items-center justify-between">
                  <span>Izinkan pengguna baru mendaftar:</span>
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

              {/* Create Admin User Section (Admin Only) */}
              {userRole === 'admin' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary">Buat Pengguna Admin Baru</h3>
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
                  <h3 className="text-xl font-semibold text-text-primary">Kelola Peran Pengguna</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">ID</th>
                          <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Nama Pengguna</th>
                          <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Peran</th>
                          <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length > 0 ? (
                          users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="py-2 px-4 border-b text-sm text-gray-700">{user.id}</td>
                              <td className="py-2 px-4 border-b text-sm text-gray-700">{user.username}</td>
                              <td className="py-2 px-4 border-b text-sm text-gray-700">
                                <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
