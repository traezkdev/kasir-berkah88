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
    Switch
} from 'react-native';
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
    X
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import apiService, { API_URL } from '../../api/apiService';
import { Check, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }) => {
    const { user, logout, refreshUser, updateUser } = useAuth();
    const { confirm } = useConfirm();
    const { showToast } = useToast();

    // Modal States
    const [activeModal, setActiveModal] = useState(null); // 'info', 'security', 'notif'
    const [isSaving, setIsSaving] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        username: user?.name || '',
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

    React.useEffect(() => {
        if (user) {
            setFormData({
                username: user.name || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }
    }, [user]);

    React.useEffect(() => {
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
            // Update Username
            if (formData.username !== user.name) {
                await apiService.put('/api/user/profile/username', { username: formData.username });
            }

            // Update Phone & Address
            await apiService.put('/api/user/profile', {
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

            const response = await apiService.post('/api/user/profile/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.data) {
                await refreshUser();
                showToast('Foto profil diperbarui', 'success');
            }
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
            <View style={styles.header}>
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
                            <Image source={{ uri: `${API_URL}${user.avatar_url}` }} style={styles.avatar} />
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
                        <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'SELLER'}</Text>
                    </View>
                    <Text style={styles.userEmail}>{user?.phone || 'Belum ada nomor telepon'}</Text>
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
                    {renderMenuItem(<User size={20} color="#138FEA" />, 'Informasi Pribadi', 'Nama, Email, dan Foto Profil', () => setActiveModal('info'), '#138FEA')}
                    {renderMenuItem(<Shield size={20} color="#10B981" />, 'Keamanan', 'Kata sandi dan Autentikasi', () => setActiveModal('security'), '#10B981')}
                    {renderMenuItem(<Bell size={20} color="#F59E0B" />, 'Notifikasi', 'Pengaturan pemberitahuan', () => setActiveModal('notif'), '#F59E0B')}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DUKUNGAN</Text>
                    {renderMenuItem(<HelpCircle size={20} color="#6366F1" />, 'Pusat Bantuan', 'FAQ dan Kontak Admin', () => { }, '#6366F1')}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Keluar dari Akun</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Versi 2.1.0 (Alpha)</Text>
                <Text style={styles.developerText}>Develop By traezkdev</Text>
                <View style={{ height: 50 }} />
            </ScrollView>

            {/* Modal Informasi Pribadi */}
            <Modal visible={activeModal === 'info'} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentExtended}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Informasi Pribadi</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
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
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Simpan Perubahan</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Keamanan */}
            <Modal visible={activeModal === 'security'} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentExtended}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Keamanan Akun</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
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
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Ganti Password</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Notifikasi */}
            <Modal visible={activeModal === 'notif'} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentExtended}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pengaturan Notifikasi</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
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
                            <View style={styles.notifRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.notifTitle}>Promo & Update</Text>
                                    <Text style={styles.notifSubtitle}>Info terbaru tentang fitur dan promo</Text>
                                </View>
                                <Switch
                                    value={notifSettings.promo}
                                    onValueChange={(val) => setNotifSettings({ ...notifSettings, promo: val })}
                                    trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                                    thumbColor={notifSettings.promo ? '#138FEA' : '#94A3B8'}
                                />
                            </View>
                        </View>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
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
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20,
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
        backgroundColor: '#FEF2F2',
        marginHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 18,
        gap: 10,
        marginTop: 10,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#EF4444',
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContentExtended: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalBody: {
        padding: 24,
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
    modalFooter: {
        padding: 24,
        paddingTop: 0,
    },
    saveBtn: {
        backgroundColor: '#1E293B',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
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
    }
});

export default ProfileScreen;
