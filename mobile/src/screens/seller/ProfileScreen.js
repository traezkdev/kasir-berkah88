import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Platform
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
    UserCircle
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { confirm } = useConfirm();

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
                            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <UserCircle size={60} color="#FFFFFF" strokeWidth={1.5} />
                            </View>
                        )}
                        <TouchableOpacity style={styles.editBadge}>
                            <Settings size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <View style={styles.roleBadge}>
                        <Shield size={12} color="#138FEA" />
                        <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'SELLER'}</Text>
                    </View>
                    <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
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
                        <Text style={styles.statLabel}>Bergabung</Text>
                        <Text style={styles.statValue}>Feb 2024</Text>
                    </View>
                </View>

                {/* Menu Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PENGATURAN AKUN</Text>
                    {renderMenuItem(<User size={20} color="#138FEA" />, 'Informasi Pribadi', 'Nama, Email, dan Foto Profil', () => { }, '#138FEA')}
                    {renderMenuItem(<Shield size={20} color="#10B981" />, 'Keamanan', 'Kata sandi dan Autentikasi', () => { }, '#10B981')}
                    {renderMenuItem(<Bell size={20} color="#F59E0B" />, 'Notifikasi', 'Pengaturan pemberitahuan', () => { }, '#F59E0B')}
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
                <View style={{ height: 50 }} />
            </ScrollView>
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
    }
});

export default ProfileScreen;
