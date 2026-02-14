import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Platform,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Switch,
    Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '../../utils/safeArea';
import {
    User,
    ChevronLeft,
    LogOut,
    Settings,
    Shield,
    Bell,
    HelpCircle,
    Store,
    Clock,
    UserCircle,
    X,
    Check,
    Camera,
    PlayCircle,
    Ticket,
    Database
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';
import apiService, { API_URL } from '../../api/apiService';
import * as ImagePicker from 'expo-image-picker';
import BottomModalTemplate from '../../components/templates/BottomModalTemplate';

import AppImage from '../../components/AppImage';

const ProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user, logout, refreshUser } = useAuth();
    const { confirm } = useConfirm();
    const { showToast } = useToast();
    const {
        selectedSoundId,
        changeNotificationSound
    } = useOrderNotification();

    // Modal States
    const [activeModal, setActiveModal] = useState(null); // 'info', 'security', 'notif'
    const [isSaving, setIsSaving] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        username: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });

    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [notifSettings, setNotifSettings] = useState({
        orders: true,
        chat: true,
        promo: false
    });

    const NOTIFICATION_SOUNDS = [
        { id: 'default', name: 'Standard Chime' },
        { id: 'bell', name: 'Reception Bell' },
        { id: 'modern', name: 'Digital Alert' },
        { id: 'urgent', name: 'Triple Beep' },
        { id: 'zte', name: 'ZTE Alert' },
    ];

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }
    }, [user]);

    useEffect(() => {
        refreshUser();
        loadNotificationSettings();
    }, []);

    const loadNotificationSettings = async () => {
        try {
            const response = await apiService.get('/api/user/notification-settings');
            if (response.data && response.data.message === 'success') {
                setNotifSettings(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    };

    const handleUpdateProfile = async () => {
        if (!formData.username.trim()) {
            showToast('Username tidak boleh kosong', 'error');
            return;
        }

        setIsSaving(true);
        try {
            if (formData.username !== user.name) {
                await apiService.put('/api/user/profile/username', { username: formData.username });
            }

            await apiService.put('/api/user/profile', {
                email: formData.email,
                phone: formData.phone,
                address: formData.address
            });

            await refreshUser();
            showToast('Profil berhasil diperbaharui', 'success');
            setActiveModal(null);
        } catch (error) {
            console.error('Update profile error:', error);
            showToast(error.response?.data?.error || 'Gagal memperbaharui profil', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!securityData.currentPassword || !securityData.newPassword) {
            showToast('Semua kolom wajib diisi', 'error');
            return;
        }

        if (securityData.newPassword !== securityData.confirmPassword) {
            showToast('Konfirmasi password tidak cocok', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await apiService.put('/api/user/profile/password', {
                currentPassword: securityData.currentPassword,
                newPassword: securityData.newPassword
            });
            showToast('Password berhasil diganti', 'success');
            setActiveModal(null);
            setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showToast(error.response?.data?.error || 'Gagal mengganti password', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Izin akses galeri diperlukan', 'error');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadAvatar(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (uri) => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            const fileName = uri.split('/').pop();
            const fileType = fileName.split('.').pop();

            formData.append('avatar', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: fileName,
                type: `image/${fileType}`,
            });

            await apiService.post('/api/user/profile/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            await refreshUser();
            showToast('Foto profil diperbarui', 'success');
        } catch (error) {
            console.error('Upload avatar error:', error);
            showToast('Gagal mengunggah foto profil', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        const accepted = await confirm({
            title: 'Keluar Akun',
            message: 'Apakah Anda yakin ingin keluar dari aplikasi Kasir Berkah88?',
            confirmText: 'Ya, Keluar',
            cancelText: 'Tidak',
            type: 'danger'
        });
        if (accepted) {
            logout();
        }
    };

    const renderMenuItem = (icon, title, subtitle, onPress, color = '#64748B') => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
                {icon}
            </View>
            <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <ChevronLeft size={20} color="#CBD5E1" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, {
                paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : (insets.top > 0 ? insets.top + 10 : 25)
            }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil Saya</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {user?.avatar_url ? (
                            <AppImage uri={user.avatar_url} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <UserCircle size={60} color="#FFFFFF" strokeWidth={1.5} />
                            </View>
                        )}
                        <TouchableOpacity style={styles.editBadge} onPress={handlePickImage} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator size={14} color="#FFFFFF" /> : <Camera size={14} color="#FFFFFF" />}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <View style={styles.roleBadge}>
                        <Shield size={12} color="#138FEA" />
                        <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'GUEST'}</Text>
                    </View>
                    <Text style={styles.userId}>ID: #{user?.id || '0'}</Text>
                    <View style={styles.contactRow}>
                        <Text style={styles.userContactText}>{user?.email || 'Email belum diatur'}</Text>
                        <Text style={styles.userContactDivider}> • </Text>
                        <Text style={styles.userContactText}>{user?.phone || 'No. Telp belum ada'}</Text>
                    </View>
                    <Text style={[styles.userContactText, { marginTop: 4, fontStyle: 'italic', opacity: 0.8 }]}>
                        {user?.address || 'Alamat belum diatur'}
                    </Text>
                </View>

                {/* Stats / Info Summary */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Store size={20} color="#138FEA" />
                        <Text style={styles.statLabel}>Status Toko</Text>
                        <Text style={styles.statValue}>Aktif</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statBox}>
                        <Clock size={20} color="#138FEA" />
                        <Text style={styles.statLabel}>Beroperasi</Text>
                        <Text style={styles.statValue}>Sejak 2025</Text>
                    </View>
                </View>

                {/* Menu Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PENGATURAN AKUN</Text>
                    {renderMenuItem(<User size={20} color="#138FEA" />, 'Informasi Pribadi', 'Username, Email, No. Telp, & Alamat', () => setActiveModal('info'), '#138FEA')}
                    {renderMenuItem(<Shield size={20} color="#10B981" />, 'Keamanan', 'Kata sandi dan Autentikasi', () => setActiveModal('security'), '#10B981')}
                    {renderMenuItem(<Bell size={20} color="#F59E0B" />, 'Notifikasi', 'Pengaturan pemberitahuan', () => setActiveModal('notif'), '#F59E0B')}
                    {(user?.role === 'admin' || user?.role === 'owner') &&
                        renderMenuItem(<Ticket size={20} color="#059669" />, 'Manajemen Promo', 'Kelola Voucher & Diskon', () => navigation.navigate('PromoManagement'), '#059669')
                    }
                    {(user?.role === 'admin' || user?.role === 'owner') &&
                        renderMenuItem(<Database size={20} color="#138FEA" />, 'Manajemen Database', 'Backup & Restore Data JSON', () => navigation.navigate('DatabaseManagement'), '#138FEA')
                    }
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DUKUNGAN</Text>
                    {renderMenuItem(<HelpCircle size={20} color="#6366F1" />, 'Hubungi Developer', 'Tanya fitur atau laporkan bug', () => {
                        const phoneNumber = '6285864875536';
                        const message = 'Saya mau bertanya tentang aplikasi berkah 88';
                        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                        Linking.openURL(url).catch(() => {
                            showToast('Gagal membuka WhatsApp', 'error');
                        });
                    }, '#6366F1')}
                </View>

                <TouchableOpacity
                    style={{ alignItems: 'center', marginTop: 15, marginBottom: 30 }}
                    onPress={() => navigation.navigate('DeveloperCreditsScreen')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.versionText}>Versi 1.6.1 (Alpha)</Text>
                    <Text style={styles.developerText}>Develop By traezkdev</Text>
                </TouchableOpacity>
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Fixed Logout Button */}
            <View style={[styles.fixedFooter, { paddingBottom: getSafeBottomPadding(insets) }]}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Keluar dari Akun</Text>
                </TouchableOpacity>
            </View>

            {/* Modal Informasi Pribadi */}
            <BottomModalTemplate
                visible={activeModal === 'info'}
                onClose={() => setActiveModal(null)}
                title="Informasi Pribadi"
                footer={
                    <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateProfile} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Simpan Perubahan</Text>}
                    </TouchableOpacity>
                }
            >
                <View style={{ width: '100%', paddingBottom: 20 }}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>USERNAME</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.username}
                            onChangeText={(val) => setFormData({ ...formData, username: val })}
                            placeholder="Masukkan username"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>ALAMAT EMAIL</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(val) => setFormData({ ...formData, email: val })}
                            placeholder="Masukkan alamat email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>NOMOR TELEPON</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.phone}
                            onChangeText={(val) => setFormData({ ...formData, phone: val })}
                            placeholder="Contoh: 08123456789"
                            keyboardType="phone-pad"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>ALAMAT</Text>
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 15 }]}
                            value={formData.address}
                            onChangeText={(val) => setFormData({ ...formData, address: val })}
                            placeholder="Alamat lengkap Anda"
                            multiline={true}
                        />
                    </View>
                </View>
            </BottomModalTemplate>

            {/* Modal Keamanan */}
            <BottomModalTemplate
                visible={activeModal === 'security'}
                onClose={() => setActiveModal(null)}
                title="Keamanan Akun"
                footer={
                    <TouchableOpacity style={styles.modalSaveBtn} onPress={handleChangePassword} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Ganti Password</Text>}
                    </TouchableOpacity>
                }
            >
                <View style={{ width: '100%', paddingBottom: 20 }}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>PASSWORD SAAT INI</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry={true}
                            value={securityData.currentPassword}
                            onChangeText={(val) => setSecurityData({ ...securityData, currentPassword: val })}
                            placeholder="••••••••"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>PASSWORD BARU</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry={true}
                            value={securityData.newPassword}
                            onChangeText={(val) => setSecurityData({ ...securityData, newPassword: val })}
                            placeholder="Minimal 6 karakter"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>KONFIRMASI PASSWORD BARU</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry={true}
                            value={securityData.confirmPassword}
                            onChangeText={(val) => setSecurityData({ ...securityData, confirmPassword: val })}
                            placeholder="Masukkan ulang password baru"
                        />
                    </View>
                </View>
            </BottomModalTemplate>

            {/* Modal Notifikasi */}
            <BottomModalTemplate
                visible={activeModal === 'notif'}
                onClose={() => setActiveModal(null)}
                title="Pengaturan Notifikasi"
                footer={
                    <TouchableOpacity style={styles.modalSaveBtn} onPress={async () => {
                        setIsSaving(true);
                        try {
                            await apiService.put('/api/user/notification-settings', notifSettings);
                            showToast('Pengaturan notifikasi disimpan', 'success');
                            setActiveModal(null);
                        } catch (error) {
                            showToast('Gagal menyimpan pengaturan', 'error');
                        } finally {
                            setIsSaving(false);
                        }
                    }} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Simpan Pengaturan</Text>}
                    </TouchableOpacity>
                }
            >
                <View style={{ width: '100%', paddingBottom: 20 }}>
                    <View style={styles.notifRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.notifTitle}>Pesanan Baru</Text>
                            <Text style={styles.notifSubtitle}>Terima notifikasi saat ada pesanan masuk</Text>
                        </View>
                        <Switch
                            value={notifSettings.orders}
                            onValueChange={(val) => setNotifSettings({ ...notifSettings, orders: val })}
                            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                            thumbColor={notifSettings.orders ? '#138FEA' : '#94A3B8'}
                        />
                    </View>
                    <View style={styles.notifRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.notifTitle}>Pesan Chat</Text>
                            <Text style={styles.notifSubtitle}>Terima notifikasi saat ada chat dari pembeli</Text>
                        </View>
                        <Switch
                            value={notifSettings.chat}
                            onValueChange={(val) => setNotifSettings({ ...notifSettings, chat: val })}
                            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                            thumbColor={notifSettings.chat ? '#138FEA' : '#94A3B8'}
                        />
                    </View>

                    {/* Sound Selection */}
                    <View style={{ marginTop: 24 }}>
                        <Text style={styles.sectionTitle}>SUARA NOTIFIKASI</Text>
                        <View style={styles.soundGrid}>
                            {NOTIFICATION_SOUNDS.map((sound) => {
                                const isSelected = selectedSoundId === sound.id;
                                return (
                                    <TouchableOpacity
                                        key={sound.id}
                                        style={[styles.soundCard, isSelected && styles.soundCardSelected]}
                                        onPress={() => changeNotificationSound(sound.id)}
                                    >
                                        <View style={[styles.soundIcon, isSelected && styles.soundIconSelected]}>
                                            {isSelected ? <Check size={16} color="#FFFFFF" /> : <PlayCircle size={16} color="#64748B" />}
                                        </View>
                                        <Text style={[styles.soundName, isSelected && styles.soundNameSelected]}>{sound.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </BottomModalTemplate>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    profileCard: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 35,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 35,
        backgroundColor: '#138FEA',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#138FEA',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
            },
            android: { elevation: 10 },
            web: { boxShadow: '0px 10px 20px rgba(19, 143, 234, 0.3)' }
        })
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: -5,
        backgroundColor: '#1E293B',
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
        marginBottom: 8,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#138FEA',
        letterSpacing: 1,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    userId: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 8,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userContactText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    userContactDivider: {
        fontSize: 13,
        color: '#CBD5E1',
        marginHorizontal: 4,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        marginHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    divider: {
        width: 1,
        height: '60%',
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 15,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#EF4444',
    },
    fixedFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.08)',
            },
        }),
    },
    versionText: {
        textAlign: 'center',
        marginTop: 15,
        color: '#CBD5E1',
        fontSize: 11,
        fontWeight: 'bold',
    },
    developerText: {
        textAlign: 'center',
        marginTop: 5,
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    modalSaveBtn: {
        backgroundColor: '#1E293B',
        width: '100%',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    notifRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    notifSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    soundGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    soundCard: {
        width: '48%',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    soundCardSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },
    soundIcon: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soundIconSelected: {
        backgroundColor: '#3B82F6',
    },
    soundName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
        flex: 1,
    },
    soundNameSelected: {
        color: '#1E3A8A',
    }
});

export default ProfileScreen;
