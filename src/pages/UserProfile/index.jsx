import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import AppIcon from '../../components/AppIcon';

const apiUrl = import.meta.env.VITE_API_URL;

// Reusable Modal Component
const ProfileModal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
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
const ProfileCard = ({ icon, title, description, onClick, isDestructive = false }) => (
  <div
    onClick={onClick}
    className={`
      bg-card p-6 rounded-xl shadow-lg border border-border
      transition-all duration-300 ease-in-out cursor-pointer group
      ${isDestructive
        ? 'hover:border-destructive/50 hover:shadow-destructive/20'
        : 'hover:border-primary/50 hover:shadow-primary/20'
      }
    `}
  >
    <div className="flex items-center gap-4 mb-2">
      <AppIcon name={icon} className={`w-8 h-8 ${isDestructive ? 'text-destructive' : 'text-primary'} transition-colors`} />
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
    </div>
    <p className="text-sm text-text-secondary">{description}</p>
  </div>
);

const UserProfile = ({ headerTitle }) => {
  // --- States ---
  const [user, setUser] = useState({ id: '', username: '', role: '' });
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();

  // --- Effects ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: decoded.userId, username: decoded.username, role: decoded.role });
        setNewUsername(decoded.username);
      } catch (e) {
        console.error("Failed to decode token:", e);
        handleLogout(); // Force logout on bad token
      }
    }
  }, []);

  // --- Handlers ---
  const clearMessages = () => { setMessage(''); setError(''); };
  const handleModalClose = () => { setActiveModal(null); clearMessages(); };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    clearMessages();
    if (newUsername === user.username) {
      setError('Nama pengguna baru sama dengan nama pengguna saat ini.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/user/profile/username`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Nama pengguna berhasil diperbarui! Anda mungkin perlu login ulang untuk melihat perubahan.');
        setTimeout(() => handleModalClose(), 2500);
      } else {
        setError(data.error || 'Gagal memperbarui nama pengguna');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (newPassword !== confirmNewPassword) {
      setError('Kata sandi baru dan konfirmasi tidak cocok.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/user/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Kata sandi berhasil diperbarui!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => handleModalClose(), 2000);
      } else {
        setError(data.error || 'Gagal mengubah kata sandi');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const breadcrumbs = [{ name: 'Beranda', path: '/main-dashboard' }, { name: 'Profil', path: '/profile' }];

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader title="Profil Pengguna" headerTitle={headerTitle} />
      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <BreadcrumbNavigation paths={breadcrumbs} />
          <header className="mt-6 mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-text-primary flex items-center gap-3">
              <AppIcon name="UserCircle" className="w-10 h-10" />
              Profil Pengguna
            </h1>
            <p className="mt-2 text-lg text-text-secondary">Kelola informasi akun, nama pengguna, dan kata sandi Anda.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Info Card */}
            <div className="md:col-span-2 lg:col-span-3 bg-card p-6 rounded-xl shadow-lg border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-4">Informasi Akun</h3>
                <div className="space-y-2 text-sm">
                    <p><strong className="font-medium">ID Pengguna:</strong> {user.id}</p>
                    <p><strong className="font-medium">Nama Pengguna:</strong> {user.username}</p>
                    <p><strong className="font-medium">Peran:</strong> <span className="capitalize px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">{user.role}</span></p>
                </div>
            </div>

            <ProfileCard 
              icon="UserCog" 
              title="Ubah Nama Pengguna" 
              description="Perbarui nama pengguna Anda." 
              onClick={() => setActiveModal('username')}
            />
            <ProfileCard 
              icon="KeyRound" 
              title="Ubah Kata Sandi" 
              description="Ganti kata sandi Anda secara berkala untuk keamanan."
              onClick={() => setActiveModal('password')}
            />
            <ProfileCard 
              icon="LogOut" 
              title="Keluar" 
              description="Keluar dari sesi Anda saat ini."
              onClick={handleLogout}
              isDestructive
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ProfileModal title="Ubah Nama Pengguna" isOpen={activeModal === 'username'} onClose={handleModalClose}>
        <form onSubmit={handleUpdateUsername} className="space-y-4">
          <p className="text-sm text-text-secondary">Nama pengguna Anda saat ini: <strong className="text-text-primary">{user.username}</strong></p>
          <Input label="Nama Pengguna Baru" name="newUsername" type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
          {message && <p className="text-sm text-center text-green-500 mt-2">{message}</p>}
          {error && <p className="text-sm text-center text-red-500 mt-2">{error}</p>}
        </form>
      </ProfileModal>

      <ProfileModal title="Ubah Kata Sandi" isOpen={activeModal === 'password'} onClose={handleModalClose}>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="Kata Sandi Saat Ini" name="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <Input label="Kata Sandi Baru" name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <Input label="Konfirmasi Kata Sandi Baru" name="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Ubah Kata Sandi'}</Button>
          {message && <p className="text-sm text-center text-green-500 mt-2">{message}</p>}
          {error && <p className="text-sm text-center text-red-500 mt-2">{error}</p>}
        </form>
      </ProfileModal>
    </div>
  );
};

export default UserProfile;