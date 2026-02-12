import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform,
    StatusBar,
    Image,
    TextInput,
    Modal,
    Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '../../utils/safeArea';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
    User,
    MapPin,
    ShoppingBag,
    CreditCard,
    HelpCircle,
    Settings,
    LogOut,
    ChevronRight,
    X,
    Phone,
    UserCircle,
    Shield,
    Bell,
    Banknote,
    Lock,
    Eye,
    EyeOff,
    Check,
    PlayCircle
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';


import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useOrderNotification, NOTIFICATION_SOUNDS } from '../../context/OrderNotificationContext';
import { useChat } from '../../context/ChatContext';
import useSwipeToClose from '../../hooks/useSwipeToClose';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CustomerProfile = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const { selectedSoundId, changeNotificationSound } = useOrderNotification();
    const { unreadCount } = useChat();

    const [userData, setUserData] = useState({
        username: 'Pelanggan',
        role: 'user',
        phone: '',
        address: '',
        avatar_url: null
    });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [tempAddress, setTempAddress] = useState('');
    const [tempPhone, setTempPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Account Settings States
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [notifSettings, setNotifSettings] = useState({
        orders: true,
        chat: true,
        promo: false
    });

    // Reusable Gesture for modals
    const profileSwipe = useSwipeToClose(() => setIsProfileModalOpen(false));
    const accountSwipe = useSwipeToClose(() => setIsAccountModalOpen(false));
    const notifSwipe = useSwipeToClose(() => setIsNotifModalOpen(false));

    // Reset pan positions when modals open/close
    useEffect(() => { if (!isProfileModalOpen) profileSwipe.resetPan(); }, [isProfileModalOpen]);
    useEffect(() => { if (!isAccountModalOpen) accountSwipe.resetPan(); }, [isAccountModalOpen]);
    useEffect(() => { if (!isNotifModalOpen) notifSwipe.resetPan(); }, [isNotifModalOpen]);

    const fetchNotificationSettings = async () => {
        try {
            const response = await apiService.get('/api/user/notification-settings');
            if (response.data && response.data.message === 'success') {
                setNotifSettings(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await apiService.get('/api/user/profile');
            const result = response.data;
            if (result.message === 'success') {
                setUserData(result.data);
                setTempAddress(result.data.address || '');
                setTempPhone(result.data.phone || '');
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchNotificationSettings();
    }, []);

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.put('/api/user/profile', {
                phone: tempPhone,
                address: tempAddress
            });
            if (response.data.message === 'success') {
                setUserData({ ...userData, address: tempAddress, phone: tempPhone });
                setIsProfileModalOpen(false);
                showToast('Profil berhasil diperbarui!', 'success');
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast('Gagal memperbarui profil', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!securityData.currentPassword || !securityData.newPassword) {
            showToast('Semua field password harus diisi', 'error');
            return;
        }
        if (securityData.newPassword !== securityData.confirmPassword) {
            showToast('Konfirmasi password tidak cocok', 'error');
            return;
        }
        if (securityData.newPassword.length < 6) {
            showToast('Password baru minimal 6 karakter', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiService.put('/api/user/profile/password', {
                currentPassword: securityData.currentPassword,
                newPassword: securityData.newPassword
            });

            if (response.data.message) {
                showToast('Password berhasil diubah!', 'success');
                setIsAccountModalOpen(false);
                setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            console.error("Error changing password:", error);
            const errMsg = error.response?.data?.error || 'Gagal mengubah password';
            showToast(errMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        const accepted = await confirm({
            title: 'Keluar Akun',
            message: 'Apakah Anda yakin ingin keluar dari aplikasi?',
            confirmText: 'Ya, Keluar',
            type: 'danger'
        });
        if (accepted) {
            logout();
        }
    };

    if (pageLoading) {
        return (
            <View style={styles.loadingArea}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Header Premium */}
            <View style={[styles.header, {
                paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : (insets.top > 0 ? insets.top + 10 : 25)
            }]}>
                <Text style={styles.headerTitle}>Profil Saya</Text>
                <Text style={styles.headerSubtitle}>INFORMASI & PENGATURAN AKUN</Text>
            </View>

            {/* Fixed Profile Card (Outside ScrollView) */}
            <View style={styles.fixedProfileContainer}>
                <View style={styles.profileCard}>
                    <View style={styles.avatarWrap}>
                        {userData.avatar_url ? (
                            <Image source={{ uri: `${API_URL}${userData.avatar_url}` }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <User size={40} color="#10B981" />
                            </View>
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.userName}>{userData.username || userData.name}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>{userData.role?.toUpperCase()}</Text>
                            </View>
                        </View>
                        <Text style={styles.userPhone}>{userData.phone || 'Belum ada nomor HP'}</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Points Card */}
                {userData.role !== 'admin' && (
                    <TouchableOpacity
                        style={styles.pointsCard}
                        onPress={() => navigation.navigate('PointsHistory')}
                    >
                        <View style={styles.pointsIconWrap}>
                            <Banknote size={24} color="#138FEA" />
                        </View>
                        <View style={styles.pointsContent}>
                            <Text style={styles.pointsLabel}>Poin Berkah88</Text>
                            <Text style={styles.pointsValue}>{Math.floor(userData.points || 0)} Poin</Text>
                        </View>
                        <ChevronRight size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                )}

                {/* Menu List */}
                <View style={styles.menuBox}>
                    {[
                        {
                            icon: MapPin,
                            label: 'Alamat Tersimpan',
                            color: '#3B82F6',
                            bg: '#EFF6FF',
                            desc: userData.address || 'Klik untuk atur alamat',
                            onClick: () => setIsProfileModalOpen(true)
                        },
                        {
                            icon: ShoppingBag,
                            label: 'Status Pesanan',
                            color: '#F97316',
                            bg: '#FFF7ED',
                            desc: 'Lacak pesanan aktif Anda',
                            onClick: () => navigation.navigate('Orders')
                        },
                        {
                            icon: HelpCircle,
                            label: 'Bantuan & Dukungan',
                            color: '#F59E0B',
                            bg: '#FFFBEB',
                            desc: 'Pusat bantuan 24/7',
                            onClick: () => navigation.navigate('ChatScreen')
                        },
                        {
                            icon: Shield,
                            label: 'Keamanan Akun',
                            color: '#059669',
                            bg: '#ECFDF5',
                            desc: 'Ubah password & keamanan',
                            onClick: () => setIsAccountModalOpen(true)
                        },
                        {
                            icon: Bell,
                            label: 'Pengaturan Notifikasi',
                            color: '#6366F1',
                            bg: '#EEF2FF',
                            desc: 'Suara & Pemberitahuan',
                            onClick: () => setIsNotifModalOpen(true)
                        }
                    ].map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            onPress={item.onClick}
                            style={styles.menuItem}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                                <item.icon size={22} color={item.color} />
                                {item.label === 'Bantuan & Dukungan' && unreadCount > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.menuLabelWrap}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Text style={styles.menuDesc}>{item.desc}</Text>
                            </View>
                            <ChevronRight size={18} color="#CBD5E1" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={handleLogout}
                    style={styles.logoutBtn}
                >
                    <View style={styles.logoutIconWrap}>
                        <LogOut size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.logoutText}>Keluar dari Aplikasi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.footerInfo}
                    onPress={() => navigation.navigate('DeveloperCreditsScreen')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.versionText}>BERKAH88 • VERSI 1.6.1</Text>
                    <Text style={styles.developerText}>by traezkdev</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Profile Modal */}
            <Modal
                visible={isProfileModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsProfileModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                paddingBottom: getSafeBottomPadding(insets),
                                transform: [{ translateY: profileSwipe.panY }]
                            }
                        ]}
                    >
                        {/* Drag Handle with Line */}
                        <View style={styles.modalDragHandle} {...profileSwipe.panResponder.panHandlers}>
                            <View style={styles.modalDragIndicator} />
                        </View>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Atur Profil</Text>
                            <TouchableOpacity onPress={() => setIsProfileModalOpen(false)} style={styles.modalClose}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAwareScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            enableOnAndroid={true}
                            extraScrollHeight={20}
                        >
                            <View style={styles.modalBody}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>NOMOR TELEPON</Text>
                                    <View style={styles.inputWrap}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Contoh: 08123456789"
                                            value={tempPhone}
                                            onChangeText={setTempPhone}
                                            keyboardType="phone-pad"
                                        />
                                        <Phone size={18} color="#94A3B8" />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>ALAMAT LENGKAP</Text>
                                    <View style={[styles.inputWrap, styles.textAreaWrap]}>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            placeholder="Masukkan alamat pengiriman..."
                                            value={tempAddress}
                                            onChangeText={setTempAddress}
                                            multiline
                                            numberOfLines={4}
                                        />
                                        <MapPin size={18} color="#94A3B8" style={{ marginTop: 12 }} />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleUpdateProfile}
                                    disabled={isLoading}
                                    style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAwareScrollView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Security Modal */}
            <Modal
                visible={isAccountModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsAccountModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                maxHeight: '90%',
                                paddingBottom: getSafeBottomPadding(insets),
                                transform: [{ translateY: accountSwipe.panY }]
                            }
                        ]}
                    >
                        {/* Drag Handle with Line */}
                        <View style={styles.modalDragHandle} {...accountSwipe.panResponder.panHandlers}>
                            <View style={styles.modalDragIndicator} />
                        </View>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Keamanan Akun</Text>
                            <TouchableOpacity onPress={() => setIsAccountModalOpen(false)} style={styles.modalClose}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAwareScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalBody}>
                                <View style={styles.sectionHeader}>
                                    <Shield size={18} color="#059669" />
                                    <Text style={styles.sectionTitle}>UBAH PASSWORD</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>PASSWORD SEKARANG</Text>
                                    <View style={styles.inputWrap}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Masukkan password saat ini"
                                            secureTextEntry={!showPasswords.current}
                                            value={securityData.currentPassword}
                                            onChangeText={(v) => setSecurityData({ ...securityData, currentPassword: v })}
                                        />
                                        <TouchableOpacity onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
                                            {showPasswords.current ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>PASSWORD BARU</Text>
                                    <View style={styles.inputWrap}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Minimal 6 karakter"
                                            secureTextEntry={!showPasswords.new}
                                            value={securityData.newPassword}
                                            onChangeText={(v) => setSecurityData({ ...securityData, newPassword: v })}
                                        />
                                        <TouchableOpacity onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                                            {showPasswords.new ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>KONFIRMASI PASSWORD BARU</Text>
                                    <View style={styles.inputWrap}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ulangi password baru"
                                            secureTextEntry={!showPasswords.confirm}
                                            value={securityData.confirmPassword}
                                            onChangeText={(v) => setSecurityData({ ...securityData, confirmPassword: v })}
                                        />
                                        <TouchableOpacity onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                                            {showPasswords.confirm ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleChangePassword}
                                    disabled={isLoading}
                                    style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Perbarui Password</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAwareScrollView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Notification Modal */}
            <Modal
                visible={isNotifModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsNotifModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                maxHeight: '90%',
                                paddingBottom: getSafeBottomPadding(insets),
                                transform: [{ translateY: notifSwipe.panY }]
                            }
                        ]}
                    >
                        {/* Drag Handle with Line */}
                        <View style={styles.modalDragHandle} {...notifSwipe.panResponder.panHandlers}>
                            <View style={styles.modalDragIndicator} />
                        </View>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pengaturan Notifikasi</Text>
                            <TouchableOpacity onPress={() => setIsNotifModalOpen(false)} style={styles.modalClose}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAwareScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalBody}>
                                <View style={styles.sectionHeader}>
                                    <Bell size={18} color="#6366F1" />
                                    <Text style={[styles.sectionTitle, { color: '#6366F1' }]}>TIPE PEMBERITAHUAN</Text>
                                </View>

                                <View style={styles.settingItem}>
                                    <View style={styles.settingTextWrap}>
                                        <Text style={styles.settingLabel}>Notifikasi Pesanan</Text>
                                        <Text style={styles.settingDesc}>Update status pesanan aktif</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            const newVal = !notifSettings.orders;
                                            const updated = { ...notifSettings, orders: newVal };
                                            setNotifSettings(updated);
                                            try { await apiService.put('/api/user/notification-settings', updated); } catch (e) { showToast('Gagal update', 'error'); }
                                        }}
                                        style={[styles.miniToggle, notifSettings.orders ? styles.toggleOn : styles.toggleOff]}
                                    >
                                        <View style={[styles.toggleCircle, notifSettings.orders ? styles.circleOn : styles.circleOff]} />
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.settingItem, { marginTop: 12 }]}>
                                    <View style={styles.settingTextWrap}>
                                        <Text style={styles.settingLabel}>Pesan Chat</Text>
                                        <Text style={styles.settingDesc}>Pemberitahuan chat dari toko</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            const newVal = !notifSettings.chat;
                                            const updated = { ...notifSettings, chat: newVal };
                                            setNotifSettings(updated);
                                            try { await apiService.put('/api/user/notification-settings', updated); } catch (e) { showToast('Gagal update', 'error'); }
                                        }}
                                        style={[styles.miniToggle, notifSettings.chat ? styles.toggleOn : styles.toggleOff]}
                                    >
                                        <View style={[styles.toggleCircle, notifSettings.chat ? styles.circleOn : styles.circleOff]} />
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.settingItem, { marginTop: 12 }]}>
                                    <View style={styles.settingTextWrap}>
                                        <Text style={styles.settingLabel}>Promo & Voucher</Text>
                                        <Text style={styles.settingDesc}>Informasi diskon menarik</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            const newVal = !notifSettings.promo;
                                            const updated = { ...notifSettings, promo: newVal };
                                            setNotifSettings(updated);
                                            try { await apiService.put('/api/user/notification-settings', updated); } catch (e) { showToast('Gagal update', 'error'); }
                                        }}
                                        style={[styles.miniToggle, notifSettings.promo ? styles.toggleOn : styles.toggleOff]}
                                    >
                                        <View style={[styles.toggleCircle, notifSettings.promo ? styles.circleOn : styles.circleOff]} />
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                                    <PlayCircle size={18} color="#6366F1" />
                                    <Text style={[styles.sectionTitle, { color: '#6366F1' }]}>SUARA NOTIFIKASI</Text>
                                </View>

                                <View style={styles.soundGrid}>
                                    {NOTIFICATION_SOUNDS.map((sound) => {
                                        const isSelected = selectedSoundId === sound.id;
                                        return (
                                            <TouchableOpacity
                                                key={sound.id}
                                                style={[styles.soundCard, isSelected && styles.soundCardSelected]}
                                                onPress={() => changeNotificationSound(sound.id)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.soundIcon, isSelected && styles.soundIconSelected]}>
                                                    {isSelected ? <Check size={16} color="#FFFFFF" /> : <PlayCircle size={16} color="#64748B" />}
                                                </View>
                                                <Text style={[styles.soundName, isSelected && styles.soundNameSelected]} numberOfLines={1}>
                                                    {sound.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#059669',
        paddingBottom: 70,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#D1FAE5',
        letterSpacing: 1.5,
        marginTop: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    fixedProfileContainer: {
        paddingHorizontal: 20,
        marginTop: -45, // Lowered from -60 to give space from title
        zIndex: 10,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.06)' },
            android: { elevation: 10 }
        }),
        marginBottom: 20,
    },
    avatarWrap: {
        width: 80,
        height: 80,
        borderRadius: 30,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        ...Platform.select({
            web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.1)' },
            android: { elevation: 5 }
        })
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 26,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    userName: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    roleBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    roleText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#059669',
    },
    userPhone: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
    menuBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.02)' },
            android: { elevation: 2 }
        })
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 22,
    },
    menuIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    unreadBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        zIndex: 10,
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
    },
    menuLabelWrap: {
        flex: 1,
        marginLeft: 16,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    menuDesc: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        marginTop: 24,
        paddingVertical: 18,
        borderRadius: 25,
        gap: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutIconWrap: {
        width: 32,
        height: 32,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#EF4444',
    },
    footerInfo: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    versionText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#CBD5E1',
        letterSpacing: 3,
    },
    developerText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 1,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 30,
        paddingBottom: 30,
        paddingTop: 10, // Reduced to give space for drag handle
    },
    modalDragHandle: {
        width: '100%',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalDragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalClose: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#059669',
        letterSpacing: 2,
        marginLeft: 4,
        marginBottom: 8,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    input: {
        flex: 1,
        height: 54,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: 'bold',
    },
    textAreaWrap: {
        alignItems: 'flex-start',
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
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    soundIcon: {
        width: 28,
        height: 28,
        borderRadius: 10,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soundIconSelected: {
        backgroundColor: '#10B981',
    },
    soundName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
        flex: 1,
    },
    soundNameSelected: {
        color: '#065F46',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    pointsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0F2FE',
        ...Platform.select({
            web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' },
            android: { elevation: 3 }
        })
    },
    pointsIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 18,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    pointsContent: {
        flex: 1,
    },
    pointsLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    pointsValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0284C7',
    },
    saveBtn: {
        backgroundColor: '#059669',
        height: 60,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        ...Platform.select({
            web: { boxShadow: '0px 10px 20px rgba(5, 150, 105, 0.2)' },
            android: { elevation: 8 }
        })
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1.5,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    settingTextWrap: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    settingDesc: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    miniToggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
        justifyContent: 'center',
    },
    toggleOn: {
        backgroundColor: '#D1FAE5',
    },
    toggleOff: {
        backgroundColor: '#F1F5F9',
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
            android: { elevation: 2 }
        })
    },
    circleOn: {
        alignSelf: 'flex-end',
        backgroundColor: '#059669',
    },
    circleOff: {
        alignSelf: 'flex-start',
        backgroundColor: '#94A3B8',
    }
});

export default CustomerProfile;
