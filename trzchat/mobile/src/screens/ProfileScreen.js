import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, Mail, Phone, Calendar, Edit3, Camera, LogOut, Check, X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { API_URL } from '../config/api';
import { getToken, removeToken } from '../utils/auth';
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
            await getToken();
            const response = await axios.get(`${API_URL}/users/profile`);
            setProfile(response.data);
            setEditFullName(response.data.full_name);
            setEditPhone(response.data.phone || '');
            setEditUsername(response.data.username);
            setEditEmail(response.data.email || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Gagal memuat data profil');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, []);

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

            const headers = {
                'Authorization': `Bearer ${token}`
            };

            if (Platform.OS !== 'web') {
                headers['Content-Type'] = 'multipart/form-data';
            }

            const response = await axios.post(`${API_URL}/users/upload-avatar`, formData, {
                headers: headers,
            });

            Alert.alert('Sukses', 'Foto profil berhasil diperbarui');
            fetchProfile(); // Refresh for new avatar URL
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Gagal mengunggah foto profil');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0088cc" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profil</Text>
                    <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
                        <Edit3 size={22} color="#0088cc" />
                    </TouchableOpacity>
                </View>

                {/* Profile Picture Section */}
                <View style={styles.profileSection}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{ uri: profile?.avatar || 'https://ui-avatars.com/api/?name=' + (profile?.full_name || 'User') }}
                            style={styles.profileImage}
                        />
                        <TouchableOpacity
                            style={styles.cameraIcon}
                            onPress={handlePickImage}
                            disabled={isUploadingAvatar}
                        >
                            {isUploadingAvatar ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Camera size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.fullName}>{profile?.full_name}</Text>
                    <Text style={styles.username}>@{profile?.username}</Text>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Informasi Akun</Text>

                    <InfoItem
                        icon={<User size={20} color="#555" />}
                        label="Username"
                        value={profile?.username}
                    />

                    <InfoItem
                        icon={<Mail size={20} color="#555" />}
                        label="Alamat Email"
                        value={profile?.email || 'Belum diatur'}
                    />

                    <InfoItem
                        icon={<Phone size={20} color="#555" />}
                        label="Nomor Telepon"
                        value={profile?.phone || 'Belum diatur'}
                    />

                    <InfoItem
                        icon={<Calendar size={20} color="#555" />}
                        label="Bergabung Sejak"
                        value={dayjs(profile?.created_at).format('DD MMMM YYYY')}
                    />
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={22} color="#FF3B30" />
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
                                    <ActivityIndicator size="small" color="#0088cc" />
                                ) : (
                                    <Check size={24} color="#0088cc" />
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
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        height: 60,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    editButton: {
        padding: 5,
    },
    profileSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    imageWrapper: {
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#f0f0f0',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0088cc',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    fullName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 15,
    },
    username: {
        fontSize: 16,
        color: '#777',
        marginTop: 5,
    },
    infoSection: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    infoIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    infoTextWrapper: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#888',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
        paddingVertical: 15,
        marginHorizontal: 20,
        borderRadius: 15,
        backgroundColor: '#FFF2F2',
    },
    logoutText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#FF3B30',
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        color: '#ccc',
        fontSize: 12,
        marginBottom: 40,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingBottom: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    modalBody: {
        padding: 20,
    },
    modalLabel: {
        fontSize: 14,
        color: '#777',
        marginBottom: 8,
        fontWeight: '600',
    },
    modalInput: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 20,
    },
});

export default ProfileScreen;
