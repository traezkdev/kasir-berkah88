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
    SafeAreaView,
    Image,
    TextInput,
    Modal
} from 'react-native';
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
    Bell
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const { width } = Dimensions.get('window');

const CustomerProfile = ({ navigation }) => {
    const { logout } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#059669" />

            {/* Header Premium */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profil Saya</Text>
                <Text style={styles.headerSubtitle}>INFORMASI & PENGATURAN AKUN</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* User Card */}
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
                        { icon: CreditCard, label: 'Metode Pembayaran', color: '#8B5CF6', bg: '#F5F3FF', desc: 'Dana, Tunai, BerkahPay' },
                        {
                            icon: HelpCircle,
                            label: 'Bantuan & Dukungan',
                            color: '#F59E0B',
                            bg: '#FFFBEB',
                            desc: 'Pusat bantuan 24/7',
                            onClick: () => navigation.navigate('ChatScreen')
                        },
                        { icon: Settings, label: 'Pengaturan Akun', color: '#10B981', bg: '#ECFDF5', desc: 'Keamanan & Notifikasi' }
                    ].map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            onPress={item.onClick}
                            style={styles.menuItem}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                                <item.icon size={22} color={item.color} />
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

                <View style={styles.footerInfo}>
                    <Text style={styles.versionText}>BERKAH88 • VERSI 2.0.4</Text>
                    <Text style={styles.developerText}>by traezkdev</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Profile Modal */}
            <Modal
                visible={isProfileModalOpen}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsProfileModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Atur Profil</Text>
                            <TouchableOpacity onPress={() => setIsProfileModalOpen(false)} style={styles.modalClose}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

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
                    </View>
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
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
        marginTop: -40,
        paddingHorizontal: 20,
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
        padding: 30,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
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
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 16,
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
    }
});

export default CustomerProfile;
