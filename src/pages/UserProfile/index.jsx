import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import AppIcon from '../../components/AppIcon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useTheme } from '../../contexts/ThemeContext';
import AdminMobileHeader from '../../components/ui/AdminMobileHeader';

const apiUrl = import.meta.env.VITE_API_URL;

// Reusable Modal Component
const ProfileModal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
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
      bg-card p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800
      transition-all duration-300 ease-in-out cursor-pointer group hover:-translate-y-2
      ${isDestructive
        ? 'hover:border-destructive/30 hover:shadow-destructive/10'
        : 'hover:border-blue-500/30 hover:shadow-blue-500/10'
      }
    `}
  >
    <div className="flex items-center gap-4 mb-3">
      <div className={`p-3 rounded-2xl transition-all duration-300 ${isDestructive ? 'bg-rose-50 dark:bg-rose-900/20 text-destructive group-hover:bg-destructive group-hover:text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
        <AppIcon name={icon} className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-black text-text-primary tracking-tight uppercase transition-colors">{title}</h3>
    </div>
    <p className="text-xs font-bold text-text-secondary leading-relaxed pl-1 opacity-70 group-hover:opacity-100 transition-opacity">{description}</p>
  </div>
);

const UserProfile = ({ headerTitle }) => {
  const { theme } = useTheme();
  const { toggleSidebar } = useAppSettings();
  // --- States ---
  const [user, setUser] = useState({ id: '', username: '', role: '', avatar_url: null, phone: '', address: '' });
  const [newUsername, setNewUsername] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
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
        setNewPhone(data.data.phone || '');
        setNewAddress(data.data.address || '');
      } else {
        setError(data.error || 'Gagal memuat profil pengguna');
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

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone, address: newAddress }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Informasi kontak berhasil diperbarui!');
        fetchUserProfile();
        setTimeout(() => handleModalClose(), 2000);
      } else {
        setError(data.error || 'Gagal memperbarui kontak');
      }
    } catch (err) {
      setError('Kesalahan jaringan');
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

  const breadcrumbs = [{ name: 'Beranda', path: '/main-dashboard' }, { name: 'Profil', path: '/profile' }];

  const avatarSrc = user.avatar_url ? `${apiUrl}${user.avatar_url}` : '/assets/images/no_image.png';

  return (
    <div className="flex flex-col h-screen">
      {theme === 'default' && (
        user.role === 'owner' ? (
          <OwnerNavigationHeader
            onToggleSidebar={toggleSidebar}
            headerTitle={headerTitle || "Profil Pengguna"}
            hideMobileHeader={true}
          />
        ) : (
          <NavigationHeader
            onToggleSidebar={toggleSidebar}
            headerTitle={headerTitle || "Profil Pengguna"}
            hideMobileHeader={true}
          />
        )
      )}
      <AdminMobileHeader
        title="Profil"
        subtitle="Pengguna"
        badgeText="Identitas Akun"
        decorativeIcon="UserCircle"
        stickyTitle="Profil Pengguna"
        rightIcon="Home"
        onRightAction={() => navigate('/main-dashboard')}
      />
      <main className={`flex-grow ${theme === 'default' ? 'pt-20 lg:pt-16' : ''}`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-8 py-8" : ""}>
          <div className="hidden md:block">
            <BreadcrumbNavigation paths={breadcrumbs} />
          </div>
          <header className="mb-8 lg:mb-6 hidden lg:block">
            <h1 className="text-2xl lg:text-3xl font-black text-text-primary mt-4 tracking-tighter uppercase lg:normal-case flex items-center gap-3">
              <AppIcon name="UserCircle" className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
              Profil Pengguna
            </h1>
            <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 lg:hidden"></div>
            <p className="text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
              Kelola informasi akun, nama pengguna, dan kata sandi Anda.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-24 lg:mt-0 -mt-20 relative z-20">
            {/* Premium Info Card */}
            <div className="md:col-span-3 relative overflow-hidden bg-gradient-to-br from-[#138FEA] to-[#0A56B1] text-white rounded-[2rem] p-6 lg:p-10 shadow-2xl shadow-blue-500/20 group">
              {/* Decorative Background Elements */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-blob"></div>
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 lg:gap-12">
                {/* Avatar Section with Glow */}
                <div className="relative shrink-0 group/avatar">
                  <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl group-hover/avatar:bg-white/30 transition-all duration-500"></div>
                  <div className="relative">
                    <img
                      src={avatarSrc}
                      alt="Foto Profil"
                      className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-white/30 shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105"
                    />
                    {/* Active Status Badge */}
                    <div className="absolute bottom-2 right-2 w-6 h-6 lg:w-8 lg:h-8 bg-green-500 border-4 border-[#138FEA] rounded-full shadow-lg"></div>
                  </div>
                </div>

                {/* Info Side */}
                <div className="flex-grow w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-black tracking-tight uppercase">Informasi Akun</h3>
                      <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Data autentikasi & identitas</p>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-2 self-start sm:self-center">
                      <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></div>
                      <span className="text-xs font-black uppercase tracking-widest">{user.role}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                    {/* Info Items */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3 mb-1">
                        <AppIcon name="Fingerprint" className="w-4 h-4 text-blue-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-100/50">ID Pengguna</span>
                      </div>
                      <p className="font-bold tracking-tight text-lg">#{user.id}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3 mb-1">
                        <AppIcon name="User" className="w-4 h-4 text-blue-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-100/50">Username</span>
                      </div>
                      <p className="font-bold tracking-tight text-lg">{user.username}</p>
                    </div>

                    {user.phone && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-1">
                          <AppIcon name="Phone" className="w-4 h-4 text-blue-200" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-100/50">Nomor HP</span>
                        </div>
                        <p className="font-bold tracking-tight text-lg">{user.phone}</p>
                      </div>
                    )}

                    <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${user.phone ? 'sm:col-span-2' : ''}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <AppIcon name="MapPin" className="w-4 h-4 text-blue-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-100/50">Alamat Lengkap</span>
                      </div>
                      <p className="font-bold tracking-tight text-sm lg:text-base leading-relaxed">
                        {user.address || 'Alamat belum diatur'}
                      </p>
                    </div>
                  </div>
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
              icon="Contact"
              title="Informasi Kontak"
              description="Perbarui nomor HP dan alamat."
              onClick={() => setActiveModal('contact')}
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

      <ProfileModal title="Informasi Kontak & Alamat" isOpen={activeModal === 'contact'} onClose={handleModalClose}>
        <form onSubmit={handleUpdateContact} className="space-y-4">
          <Input label="Nomor WhatsApp / HP" name="newPhone" type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Contoh: 08123456789" />
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary pl-1">Alamat Lengkap</label>
            <textarea
              className="w-full bg-background border border-border rounded-lg p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] transition-all"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Masukkan alamat lengkap Anda"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
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

export default UserProfile;

