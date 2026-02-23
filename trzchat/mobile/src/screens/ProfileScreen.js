import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, InteractionManager } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, Mail, Phone, Calendar, Edit3, Camera, LogOut, Check, X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_URL, fixUrl } from '../config/api';
import { getToken, removeToken, setUser, getUser } from '../utils/auth';
import dayjs from 'dayjs';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);

    // Edit States
    const [editFullName, setEditFullName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            // 1. Load dari Cache Lokal dulu agar instan
            const cachedUser = await getUser();
            if (cachedUser) {
                const data = {
                    ...cachedUser,
                    full_name: cachedUser.fullName || cachedUser.full_name,
                    avatar: cachedUser.avatar ? fixUrl(cachedUser.avatar) : null
                };
                setProfile(data);
                setEditFullName(data.full_name || '');
                setEditPhone(data.phone || '');
                setEditUsername(data.username || '');
                setEditEmail(data.email || '');
                setLoading(false); // Matikan loading spinner lebih awal
            }

            // 2. Fetch dari Server di background untuk sinkronisasi
            const token = await getToken();
            const response = await axios.get(`${API_URL}/users/profile`);
            const serverData = response.data;

            if (serverData.avatar) {
                serverData.avatar = fixUrl(serverData.avatar);
            }

            // 3. Hanya update state & storage jika data berbeda (mencegah flickering)
            const isDifferent = JSON.stringify(serverData) !== JSON.stringify(cachedUser);
            if (isDifferent) {
                setProfile(serverData);
                setEditFullName(serverData.full_name);
                setEditPhone(serverData.phone || '');
                setEditUsername(serverData.username);
                setEditEmail(serverData.email || '');

                // Update Cache untuk penggunaan berikutnya
                await setUser({
                    ...serverData,
                    fullName: serverData.full_name // Samakan format field
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Hanya tampilkan alert jika belum ada data sama sekali (gagal total)
            if (!profile) {
                Alert.alert('Error', 'Gagal memuat data profil');
            }
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        // Gunakan InteractionManager agar fetching tidak mengganggu animasi navigasi yang sedang berjalan
        const task = InteractionManager.runAfterInteractions(() => {
            fetchProfile();
        });
        return () => task.cancel(); // Bersihkan jika user langsung back sebelum animasi selesai
    }, [fetchProfile]);

    const handleLogout = async () => {
        Alert.alert(
            'Keluar',
            'Apakah Anda yakin ingin keluar dari akun?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Keluar',
                    style: 'destructive',
                    onPress: async () => {
                        await removeToken();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Welcome' }],
                        });
                    }
                }
            ]
        );
    };

    const handleSaveProfile = useCallback(async () => {
        if (!editFullName.trim() || !editUsername.trim() || !editEmail.trim()) {
            Alert.alert('Error', 'Nama, Username, dan Email tidak boleh kosong');
            return;
        }

        setIsSaving(true);
        try {
            await getToken();
            await axios.post(`${API_URL}/users/profile`, {
                fullName: editFullName,
                phone: editPhone,
                username: editUsername,
                email: editEmail,
                avatar: profile?.avatar
            });

            Alert.alert('Sukses', 'Profil berhasil diperbarui');
            setEditModalVisible(false);
            fetchProfile();
        } catch (error) {
            console.error('Error saving profile:', error);
            const message = error.response?.data?.message || 'Gagal memperbarui profil';
            Alert.alert('Error', message);
        } finally {
            setIsSaving(false);
        }
    }, [editFullName, editUsername, editEmail, editPhone, profile?.avatar, fetchProfile]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Mohon izinkan akses galeri untuk mengganti foto profil.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadAvatar(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (uri) => {
        setIsUploadingAvatar(true);
        try {
            const token = await getToken();
            const formData = new FormData();

            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('avatar', blob, 'avatar.jpg');
            } else {
                const uriParts = uri.split('/');
                const fileName = uriParts[uriParts.length - 1];
                const fileType = fileName.split('.').pop();

                formData.append('avatar', {
                    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                    name: fileName,
                    type: `image/${fileType}`,
                });
            }


            const response = await axios.post(`${API_URL}/users/upload-avatar`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            // Tambahkan timestamp sebagai cache-buster agar Android langsung memuat ulang
            const avatarUrl = `${fixUrl(response.data.avatarUrl)}?t=${Date.now()}`;

            // Update local profile state immediately
            setProfile(prev => ({ ...prev, avatar: avatarUrl }));

            // Sync with AsyncStorage for other components (like Drawer)
            const currentUser = await getUser();
            if (currentUser) {
                await setUser({ ...currentUser, avatar: avatarUrl });
            }

            Alert.alert('Sukses', 'Foto profil berhasil diperbarui');
        } catch (error) {
            console.error('Upload error:', error);
            if (error.response) {
                console.error('Upload error server response:', error.response.data);
            }
            Alert.alert('Error', 'Gagal mengunggah foto profil');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar style="light" translucent />

            {/* Hero Header FIXED - di luar ScrollView */}
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroHeader}
            >
                {/* Dekoratif lingkaran */}
                <View style={styles.heroBubble1} />
                <View style={styles.heroBubble2} />

                {/* Tombol Kembali */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>

                {/* Tombol Edit - pojok kanan atas */}
                <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.editIconButton}>
                    <Edit3 size={20} color="#fff" />
                </TouchableOpacity>

                {/* Avatar */}
                <View style={styles.avatarArea}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{
                                uri: profile?.avatar || 'https://ui-avatars.com/api/?name=' + (profile?.full_name || 'User') + '&background=6366F1&color=fff',
                                cache: 'force-cache'
                            }}
                            style={styles.profileImage}
                            key={profile?.avatar}
                        />
                        <TouchableOpacity
                            style={styles.cameraIcon}
                            onPress={handlePickImage}
                            disabled={isUploadingAvatar}
                        >
                            {isUploadingAvatar ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Camera size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.heroName}>{profile?.full_name}</Text>
                    <Text style={styles.heroUsername}>@{profile?.username}</Text>
                </View>
            </LinearGradient>

            {/* Konten yang bisa di-scroll */}
            <ScrollView showsVerticalScrollIndicator={false} bounces={true} style={styles.scrollContent}>

                {/* Info Cards */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionLabel}>INFORMASI AKUN</Text>

                    <View style={styles.infoCard}>
                        <View style={[styles.infoIconBox, { backgroundColor: '#EEF2FF' }]}>
                            <User size={20} color="#6366F1" />
                        </View>
                        <View style={styles.infoTextBox}>
                            <Text style={styles.infoLabel}>Username</Text>
                            <Text style={styles.infoValue}>{profile?.username || '—'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={[styles.infoIconBox, { backgroundColor: '#FFF7ED' }]}>
                            <Mail size={20} color="#F97316" />
                        </View>
                        <View style={styles.infoTextBox}>
                            <Text style={styles.infoLabel}>Alamat Email</Text>
                            <Text style={styles.infoValue}>{profile?.email || 'Belum diatur'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={[styles.infoIconBox, { backgroundColor: '#F0FDF4' }]}>
                            <Phone size={20} color="#22C55E" />
                        </View>
                        <View style={styles.infoTextBox}>
                            <Text style={styles.infoLabel}>Nomor Telepon</Text>
                            <Text style={styles.infoValue}>{profile?.phone || 'Belum diatur'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={[styles.infoIconBox, { backgroundColor: '#FFF1F2' }]}>
                            <Calendar size={20} color="#F43F5E" />
                        </View>
                        <View style={styles.infoTextBox}>
                            <Text style={styles.infoLabel}>Bergabung Sejak</Text>
                            <Text style={styles.infoValue}>{dayjs(profile?.created_at).format('DD MMMM YYYY')}</Text>
                        </View>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                    <LogOut size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Keluar dari Akun</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Vira Chat v1.0.0</Text>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <X size={24} color="#000" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Edit Profil</Text>
                            <TouchableOpacity onPress={handleSaveProfile} disabled={isSaving}>
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#6366F1" />
                                ) : (
                                    <Check size={24} color="#6366F1" />
                                )}
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.modalLabel}>Nama Lengkap</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editFullName}
                                    onChangeText={setEditFullName}
                                    placeholder="Masukkan nama lengkap"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.modalLabel}>Username</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editUsername}
                                    onChangeText={setEditUsername}
                                    autoCapitalize="none"
                                    placeholder="Masukkan username baru"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.modalLabel}>Alamat Email</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editEmail}
                                    onChangeText={setEditEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholder="Masukkan email baru"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.modalLabel}>Nomor Telepon</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                    placeholder="Contoh: 0812345678"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const InfoItem = memo(({ icon, label, value }) => (
    <View style={styles.infoItem}>
        <View style={styles.infoIconWrapper}>
            {icon}
        </View>
        <View style={styles.infoTextWrapper}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    </View>
));

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // --- HERO HEADER ---
    heroHeader: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    heroBubble1: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(255,255,255,0.07)',
        top: -60,
        right: -50,
    },
    heroBubble2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.06)',
        bottom: -30,
        left: -20,
    },
    backButton: {
        position: 'absolute',
        top: 55,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconButton: {
        position: 'absolute',
        top: 55,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarArea: {
        alignItems: 'center',
    },
    imageWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#6366F1',
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    heroName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    heroUsername: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '700',
        marginTop: 5,
    },
    // --- EDIT BUTTON ---
    editBtnContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 5,
    },
    editProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingVertical: 14,
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    editProfileBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#6366F1',
    },
    // --- INFO CARDS ---
    infoSection: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1.5,
        marginBottom: 14,
        marginLeft: 4,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
    },
    infoIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoTextBox: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
        marginBottom: 3,
    },
    infoValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '700',
    },
    // --- LOGOUT ---
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 16,
        paddingVertical: 16,
        marginHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#FFF1F2',
        gap: 10,
        borderWidth: 1,
        borderColor: '#FFE4E6',
    },
    logoutText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '800',
    },
    versionText: {
        textAlign: 'center',
        color: '#D1D5DB',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 40,
    },
    // --- MODAL ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingBottom: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 22,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
    },
    modalBody: {
        padding: 20,
    },
    modalLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
        fontWeight: '700',
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 55,
        fontSize: 16,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginBottom: 20,
        color: '#111827',
        fontWeight: '600',
    },
    inputGroup: {},
});

export default ProfileScreen;
