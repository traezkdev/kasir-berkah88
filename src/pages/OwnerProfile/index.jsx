import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import AppIcon from '../../components/AppIcon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useTheme } from '../../contexts/ThemeContext';

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

const OwnerProfile = ({ headerTitle }) => { // Component name changed to OwnerProfile
  const { theme } = useTheme();
  // --- States ---
  const [user, setUser] = useState({ id: '', username: '', role: '', avatar_url: null });
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] = useState(false);
  const navigate = useNavigate();

  // --- Effects ---
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // --- Handlers ---
  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/user/profile`);
      const data = await response.json();
      if (response.ok) {
        setUser(data.data);
        setNewUsername(data.data.username);
      } else {
        setError(data.error || 'Gagal memuat profil owner'); // Text changed
      }
    } catch (err) {
      setError('Kesalahan jaringan. Logout dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => { setMessage(''); setError(''); };
  const handleModalClose = () => { setActiveModal(null); clearMessages(); setAvatarFile(null); setAvatarPreview(null); };

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
        setMessage('Nama pengguna berhasil diperbarui! Anda mungkin perlu login ulang untuk melihat perubahan di semua tempat.');
        fetchUserProfile(); // Re-fetch profile to get latest data
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

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) { setError('Pilih file gambar untuk diunggah.'); return; }
    clearMessages();
    setIsLoading(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const response = await authFetch(`${apiUrl}/api/user/profile/avatar`, { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        setMessage('Foto profil berhasil diperbarui!');
        fetchUserProfile(); // Re-fetch to get new avatar URL
        setTimeout(() => handleModalClose(), 1500);
      } else {
        setError(data.error || 'Gagal mengunggah foto profil');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak dapat dijangkau');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutConfirmationOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const breadcrumbs = [
    { label: 'Beranda', path: '/owner-dashboard', isActive: false },
    { label: 'Profil Owner', path: '/owner-profile', isActive: true }
  ];

  const avatarSrc = user.avatar_url ? `${apiUrl}${user.avatar_url}` : '/assets/images/no_image.png';

  return (
    <div className={`flex flex-col h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {/* Changed to OwnerNavigationHeader and removed theme conditional */}
      {theme === 'default' && <OwnerNavigationHeader title="Profil Owner" headerTitle={headerTitle} />}
      <main className={`flex-grow ${theme === 'default' ? 'pt-16' : ''}`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-8 py-8" : "py-8"}>
          <BreadcrumbNavigation customPath={breadcrumbs} />
          <header className="mt-6 mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold tracking-tight text-text-primary flex items-center gap-3">
              <AppIcon name="UserCircle" className="w-10 h-10" />
              Profil Owner {/* Text changed */}
            </h1>
            <p className="mt-2 text-lg text-text-secondary">Kelola informasi akun, nama pengguna, dan kata sandi Owner Anda.</p> {/* Text changed */}
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
            {/* Info Card */}
            <div className="md:col-span-3 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-lg p-4 shadow-lg flex items-center gap-6">
              <img src={avatarSrc} alt="Foto Profil" className="w-24 h-24 rounded-full object-cover border-4 border-white/20" />
              <div className="flex-grow">
                <h3 className="text-xl font-bold mb-2">Informasi Akun</h3>
                <div className="space-y-2 text-sm">
                  <p><strong className="font-medium">ID Owner:</strong> {user.id}</p> {/* Text changed */}
                  <p><strong className="font-medium">Nama Owner:</strong> {user.username}</p> {/* Text changed */}
                  <p><strong className="font-medium">Peran:</strong> <span className="capitalize px-2 py-1 bg-white/20 rounded-full text-xs">{user.role}</span></p>
                </div>
              </div>
            </div>
            <ProfileCard
              icon="Camera"
              title="Ubah Foto Profil"
              description="Perbarui foto profil Anda."
              onClick={() => setActiveModal('avatar')}
            />
            <ProfileCard
              icon="UserCog"
              title="Ubah Nama Pengguna"
              description="Perbarui nama pengguna Anda."
              onClick={() => setActiveModal('username')}
            />
            <ProfileCard
              icon="KeyRound"
              title="Ubah Kata Sandi"
              description="Ganti kata sandi untuk keamanan."
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
      <ProfileModal title="Ubah Foto Profil" isOpen={activeModal === 'avatar'} onClose={handleModalClose}>
        <form onSubmit={handleAvatarUpload} className="space-y-6">
          <p className="text-sm text-text-secondary">Pilih gambar baru untuk dijadikan foto profil. Disarankan gambar persegi.</p>
          <Input label="Pilih File Gambar" name="avatarFile" type="file" accept="image/*" onChange={handleAvatarFileChange} />
          {avatarPreview && <img src={avatarPreview} alt="Pratinjau" className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-dashed p-1" />}
          <Button type="submit" className="w-full" disabled={isLoading || !avatarFile}>{isLoading ? 'Mengunggah...' : 'Unggah & Simpan'}</Button>
          {message && <p className="text-sm text-center text-green-500 mt-2">{message}</p>}
          {error && <p className="text-sm text-center text-red-500 mt-2">{error}</p>}
        </form>
      </ProfileModal>

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

      <ConfirmationModal
        isOpen={isLogoutConfirmationOpen}
        onClose={() => setIsLogoutConfirmationOpen(false)}
        onConfirm={confirmLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari sesi Anda saat ini?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
      />
    </div>
  );
};

export default OwnerProfile;
