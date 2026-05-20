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

// Reusable Card Component - Scaled Down
const ProfileCard = ({ icon, title, description, onClick, isDestructive = false }) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden bg-card p-5 rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-slate-800
      transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]
      ${isDestructive
        ? 'hover:border-destructive/30'
        : 'hover:border-blue-500/30'
      }
    `}
  >
    {/* Animated Background Accent */}
    <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${isDestructive ? 'bg-destructive' : 'bg-blue-600'}`}></div>

    <div className="flex items-center gap-4 mb-3 relative z-10">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 transform group-hover:rotate-6 ${isDestructive ? 'bg-rose-50 dark:bg-rose-900/20 text-destructive group-hover:bg-destructive group-hover:text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
        <AppIcon name={icon} size={20} />
      </div>
      <h3 className="text-sm font-black text-text-primary tracking-tight uppercase transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">{title}</h3>
    </div>
    <p className="text-[11px] font-bold text-text-secondary leading-relaxed pl-1 opacity-60 group-hover:opacity-100 transition-opacity relative z-10">{description}</p>
  </div>
);

const UserProfile = ({ headerTitle }) => {
  const { theme } = useTheme();
  const { toggleSidebar } = useAppSettings();
  // --- States ---
  const [user, setUser] = useState({ id: '', username: '', email: '', role: '', avatar_url: null, phone: '', address: '', points: 0 });
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
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
  const [notifSettings, setNotifSettings] = useState({ orders: true, chat: true, promo: false, stock_alert: true });
  const navigate = useNavigate();

  // --- Effects ---
  useEffect(() => {
    fetchUserProfile();
    fetchNotificationSettings();
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
        setNewEmail(data.data.email || '');
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

  const fetchNotificationSettings = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/user/notification-settings`);
      const data = await response.json();
      if (response.ok) {
        setNotifSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    }
  };

  const updateNotificationSettings = async (updated) => {
    try {
      const response = await authFetch(`${apiUrl}/api/user/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (response.ok) {
        setNotifSettings(updated);
        setMessage('Pengaturan notifikasi diperbarui!');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (err) {
      setError('Gagal memperbarui pengaturan notifikasi');
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
        body: JSON.stringify({ email: newEmail, phone: newPhone, address: newAddress }),
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
            {/* Ultra Premium Profile Header Card - Scaled Down */}
            <div className="md:col-span-3 relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white rounded-[2rem] p-6 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group border border-white/5">
              {/* Animated Mesh Gradients */}
              <div className="absolute -right-20 -top-20 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[80px] animate-pulse"></div>
              <div className="absolute -left-20 -bottom-20 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[80px] animate-pulse delay-700"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-8 lg:gap-12">
                {/* Left Side: Avatar & Identity - Compact */}
                <div className="relative shrink-0 flex flex-col items-center md:items-center text-center w-full md:w-auto md:border-r md:border-white/10 md:pr-10 lg:pr-14">
                  <div className="relative group/avatar mb-6">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-full blur-xl opacity-20 group-hover/avatar:opacity-40 transition-opacity duration-700 animate-spin-slow"></div>
                    <div className="absolute -inset-1 bg-gradient-to-tr from-white/20 to-transparent rounded-full border border-white/10"></div>

                    <div className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-full p-1.5 bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
                      <img
                        src={avatarSrc}
                        alt="Foto Profil"
                        className="w-full h-full rounded-full object-cover shadow-inner transition-transform duration-700 group-hover/avatar:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/images/no_image.png';
                        }}
                      />
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl border border-blue-400/50 whitespace-nowrap">
                        Verified Member
                      </div>
                    </div>
                  </div>

                  {/* Identity below Avatar */}
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest mb-3 mx-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
                      Status: Online
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black tracking-tight mb-1 bg-gradient-to-r from-white via-white to-blue-200 bg-clip-text text-transparent">
                      {user.username}
                    </h2>
                    <p className="text-white/40 font-bold uppercase tracking-[0.25em] text-[10px]">
                      {user.role} • ID: #{user.id}
                    </p>
                  </div>

                  {user.role === 'pelanggan' && (
                    <div className="px-5 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Loyalty Points</span>
                      <span className="text-lg font-black text-blue-400">{user.points || 0}</span>
                    </div>
                  )}
                </div>

                {/* Right Side: Information Tiles Container - No empty space */}
                <div className="flex-grow w-full flex flex-col justify-center">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                    {/* Compact Tile: Email */}
                    <div className="relative group/tile overflow-hidden p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300">
                      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover/tile:opacity-10 transition-opacity">
                        <AppIcon name="Mail" size={40} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <AppIcon name="Mail" size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Email Address</p>
                          <p className="font-bold text-xs text-white/90 truncate">{user.email || 'Not configured'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Compact Tile: Phone */}
                    <div className="relative group/tile overflow-hidden p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300">
                      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover/tile:opacity-10 transition-opacity">
                        <AppIcon name="Phone" size={40} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <AppIcon name="Phone" size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Contact Number</p>
                          <p className="font-bold text-xs text-white/90 truncate">{user.phone || 'No phone set'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Full Width Tile: Address */}
                    <div className="relative group/tile overflow-hidden p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 lg:col-span-2">
                      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover/tile:opacity-10 transition-opacity">
                        <AppIcon name="MapPin" size={40} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                          <AppIcon name="MapPin" size={14} />
                        </div>
                        <div className="flex-grow">
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Primary Address</p>
                          <p className="font-bold text-white/90 leading-relaxed text-[11px] lg:text-xs">
                            {user.address || 'No address configured in profile'}
                          </p>
                        </div>
                      </div>
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
              icon="Bell"
              title="Pengaturan Notifikasi"
              description="Atur notifikasi pesanan, chat, dan lainnya."
              onClick={() => setActiveModal('notifications')}
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
          <Input label="Alamat Email" name="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Contoh: user@example.com" />
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

      <ProfileModal title="Pengaturan Notifikasi" isOpen={activeModal === 'notifications'} onClose={handleModalClose}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary mb-4">Pilih notifikasi yang ingin Anda terima di perangkat ini dan email.</p>

          {[
            { id: 'orders', label: 'Notifikasi Pesanan', desc: 'Status pesanan & order baru', icon: 'ShoppingBag' },
            { id: 'chat', label: 'Pesan Chat', desc: 'Chat dari pelanggan & admin', icon: 'MessageCircle' },
            { id: 'promo', label: 'Promo & Voucher', desc: 'Info diskon menarik', icon: 'Ticket' },
            { id: 'stock_alert', label: 'Peringatan Stok', desc: 'Stok menipis / kritis', icon: 'AlertTriangle' }
          ].map(notif => (
            <div key={notif.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                  <AppIcon name={notif.icon} size={18} />
                </div>
                <div>
                  <p className="font-bold text-sm text-text-primary">{notif.label}</p>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tight opacity-60 group-hover:opacity-100 transition-opacity">{notif.desc}</p>
                </div>
              </div>
              <button
                onClick={() => updateNotificationSettings({ ...notifSettings, [notif.id]: !notifSettings[notif.id] })}
                className={`w-12 h-6 rounded-full transition-all relative ${notifSettings[notif.id] ? 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-gray-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${notifSettings[notif.id] ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          ))}

          {message && <p className="text-sm text-center text-green-500 mt-2">{message}</p>}
          {error && <p className="text-sm text-center text-red-500 mt-2">{error}</p>}
        </div>
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

