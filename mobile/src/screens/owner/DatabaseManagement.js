import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Database,
    Download,
    Upload,
    ShieldCheck,
    ChevronLeft,
    FileJson,
    AlertTriangle
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const OwnerDatabaseManagement = ({ navigation }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleBackup = async () => {
        setIsLoading(true);
        try {
            // Get token for authentication
            const token = await AsyncStorage.getItem('userToken');

            // Use native fetch to handle large data streams more reliably
            const response = await fetch(`${API_URL}/api/database/backup`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => "Unknown error");
                let errorData = {};
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) { }

                const finalError = errorData.error || `Error ${response.status}: ${errorText.substring(0, 100)}`;
                throw new Error(finalError);
            }

            const data = await response.json();
            const dbName = 'kasir_berkah88';
            const fileName = `backup-${dbName}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

            if (Platform.OS === 'web') {
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showToast('Backup berhasil diunduh', 'success');
            } else {
                const fileUri = FileSystem.cacheDirectory + fileName;

                // Optimized JSON conversion (no spaces/indentation to save RAM and file size)
                const jsonContent = JSON.stringify(data);

                await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
                    encoding: 'utf8',
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                    showToast('Backup berhasil dibuat', 'success');
                } else {
                    showToast('Sharing tidak tersedia di perangkat ini', 'error');
                }
            }
        } catch (error) {
            console.error('Backup Error:', error);
            let errorMsg = error.message || 'Gagal membuat backup database';

            // Customize message for common production issues
            if (errorMsg.includes('504')) {
                errorMsg = 'Server Timeout (504): Data terlalu besar atau server sibuk.';
            } else if (errorMsg.includes('500')) {
                errorMsg = `Server Error (500): Terjadi kesalahan internal di server.`;
            } else if (errorMsg.includes('403')) {
                errorMsg = 'Akses Ditolak: Pastikan akun Anda adalah Admin/Owner.';
            } else if (errorMsg.includes('Network request failed')) {
                errorMsg = 'Kesalahan Jaringan: Periksa internet atau SSL server.';
            }

            showToast(errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];

            // Web-friendly confirmation
            const executeRestore = async () => {
                setIsLoading(true);
                try {
                    const formData = new FormData();
                    if (Platform.OS === 'web') {
                        // On web, assets[0].file is the raw File object
                        const fileObj = file.file || file;
                        formData.append('backupFile', fileObj);
                    } else {
                        formData.append('backupFile', {
                            uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
                            name: file.name || 'backup.json',
                            type: file.mimeType || 'application/json',
                        });
                    }

                    const token = await AsyncStorage.getItem('userToken');
                    const response = await fetch(`${API_URL}/api/database/restore`, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });

                    const resultData = await response.json();

                    if (!response.ok) {
                        throw new Error(resultData.error || 'Gagal memulihkan database');
                    }

                    if (Platform.OS === 'web') {
                        alert('Database berhasil dipulihkan!');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'MainTabs' }],
                        });
                    } else {
                        Alert.alert(
                            'Berhasil',
                            'Database berhasil dipulihkan!',
                            [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] }) }]
                        );
                    }
                } catch (error) {
                    console.error('Restore Error:', error);
                    showToast(error.message || 'Gagal memulihkan database', 'error');
                } finally {
                    setIsLoading(false);
                }
            };

            if (Platform.OS === 'web') {
                if (window.confirm('Apakah Anda yakin ingin melakukan restore database? PERINGATAN: Semua data saat ini akan terhapus.')) {
                    executeRestore();
                }
            } else {
                Alert.alert(
                    'Konfirmasi Restore',
                    'Apakah Anda yakin ingin melakukan restore database? PERINGATAN: Semua data saat ini akan terhapus.',
                    [
                        { text: 'Batal', style: 'cancel' },
                        { text: 'Ya, Pulihkan Sekarang', style: 'destructive', onPress: executeRestore }
                    ]
                );
            }
        } catch (error) {
            console.error('Picker error:', error);
            showToast('Gagal memilih file', 'error');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Database</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.descSection}>
                    <Database size={48} color="#D97706" style={styles.mainIcon} />
                    <Text style={styles.mainTitle}>Amankan Data Anda</Text>
                    <Text style={styles.mainDesc}>
                        Lakukan pencadangan berkala untuk menghindari kehilangan data transaksi dan inventaris Anda.
                    </Text>
                </View>

                <View style={styles.cardContainer}>
                    {/* Backup Section */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={handleBackup}
                        disabled={isLoading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#FFFBEB' }]}>
                            <Download size={24} color="#D97706" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Cadangkan Data (Backup)</Text>
                            <Text style={styles.cardDesc}>Unduh seluruh data database ke dalam file JSON.</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Restore Section */}
                    <TouchableOpacity
                        style={[styles.card, { marginTop: 16 }]}
                        onPress={handleRestore}
                        disabled={isLoading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#FFFBEB' }]}>
                            <Upload size={24} color="#D97706" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Pulihkan Data (Restore)</Text>
                            <Text style={styles.cardDesc}>Kembalikan data dari file backup sebelumnya.</Text>
                        </View>
                        <AlertTriangle size={18} color="#EF4444" style={styles.warningIcon} />
                    </TouchableOpacity>
                </View>

                {/* Security Tip */}
                <View style={[styles.tipContainer, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
                    <ShieldCheck size={24} color="#D97706" />
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>Tips Keamanan</Text>
                        <Text style={styles.tipDesc}>
                            Simpan file backup di layanan cloud (Google Drive/iCloud) atau kirim ke email pribadi Anda. Lakukan backup setiap hari sebelum menutup toko.
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {isLoading && (
                <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="large" color="#0F172A" />
                    <Text style={styles.loaderText}>Sedang Memproses...</Text>
                    <Text style={styles.loaderSubtext}>Mohon jangan tutup aplikasi</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' && StatusBar ? (StatusBar.currentHeight || 0) + 10 : 60,
        paddingBottom: 25,
        backgroundColor: '#0F172A', // Owner Dark Theme
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '900',
        color: '#F59E0B', // Owner Gold
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    descSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    mainIcon: {
        marginBottom: 16,
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    mainDesc: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    cardContainer: {
        marginBottom: 32,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            web: { boxShadow: '0px 4px 6px rgba(0,0,0,0.05)' },
            android: { elevation: 3 }
        })
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 12,
        color: '#64748B',
    },
    warningIcon: {
        marginLeft: 8,
    },
    tipContainer: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    tipContent: {
        flex: 1,
        marginLeft: 12,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#065F46',
        marginBottom: 4,
    },
    tipDesc: {
        fontSize: 12,
        color: '#047857',
        lineHeight: 18,
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    loaderText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    loaderSubtext: {
        marginTop: 4,
        fontSize: 12,
        color: '#64748B',
    }
});

export default OwnerDatabaseManagement;
