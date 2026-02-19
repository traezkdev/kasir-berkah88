import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StatusBar,
    Image
} from 'react-native';
import { User, Lock, Phone, MapPin, Mail, ChevronLeft, ArrowRight } from 'lucide-react-native';
import apiService from '../api/apiService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSettings } from '../context/AppSettingsContext';
import { API_URL } from '../api/apiService';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();
    const { logoUrl } = useAppSettings();

    const handleRegister = async () => {
        const { username, email, phone, address, password, confirmPassword } = formData;

        if (!username || !phone || !address || !password || !confirmPassword) {
            Alert.alert('Eror', 'Harap isi semua kolom!');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Eror', 'Konfirmasi kata sandi tidak cocok.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Eror', 'Kata sandi minimal 6 karakter.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.post('/api/register', {
                username,
                password,
                phone,
                address,
                email: email || null
            });

            if (response.data.message === 'success' || response.status === 201 || response.status === 200) {
                Alert.alert('Sukses', 'Pendaftaran berhasil! Silakan login.', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                Alert.alert('Gagal', response.data.error || 'Pendaftaran gagal.');
            }
        } catch (error) {
            console.error('Register Error:', error);
            Alert.alert('Eror', error.response?.data?.error || 'Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    };

    const getLogoSource = () => {
        if (!logoUrl) return null;
        if (logoUrl.startsWith('http')) return { uri: logoUrl };
        return { uri: `${API_URL}${logoUrl}` };
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" transparent backgroundColor="transparent" />
            <LinearGradient
                colors={['#059669', '#065F46', '#064E3B']}
                style={styles.gradient}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={[styles.headerArea, { paddingTop: Math.max(insets.top, 20) }]}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backBtn}
                        >
                            <ChevronLeft size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.branding}>
                            <View style={styles.logoBox}>
                                {logoUrl ? (
                                    <Image
                                        source={getLogoSource()}
                                        style={styles.logoImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={styles.placeholderLogoIcon}>
                                        <View style={styles.placeholderLogoBar1} />
                                        <View style={styles.placeholderLogoBar2} />
                                    </View>
                                )}
                            </View>
                            <Text style={styles.welcomeTitle}>Jadi Member Berkah</Text>
                            <Text style={styles.welcomeSubtitle}>Yuk bikin akun biar jajan makin asik dan insyaAllah berkah</Text>
                        </View>

                        <View style={styles.formArea}>
                            <InputGroup
                                label="Nama Pengguna"
                                icon={User}
                                placeholder="Pilih nama pengguna"
                                value={formData.username}
                                onChangeText={(text) => setFormData({ ...formData, username: text })}
                                autoCapitalize="none"
                            />
                            <InputGroup
                                label="Email (Opsional)"
                                icon={Mail}
                                placeholder="email@contoh.com"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <InputGroup
                                label="Nomor Telepon"
                                icon={Phone}
                                placeholder="Nomor WhatsApp aktif"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                keyboardType="phone-pad"
                            />
                            <InputGroup
                                label="Alamat"
                                icon={MapPin}
                                placeholder="Alamat lengkap"
                                value={formData.address}
                                onChangeText={(text) => setFormData({ ...formData, address: text })}
                                multiline
                            />
                            <InputGroup
                                label="Kata Sandi"
                                icon={Lock}
                                placeholder="Minimal 6 karakter"
                                value={formData.password}
                                onChangeText={(text) => setFormData({ ...formData, password: text })}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                            <InputGroup
                                label="Konfirmasi Kata Sandi"
                                icon={Lock}
                                placeholder="Ketik ulang kata sandi"
                                value={formData.confirmPassword}
                                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                                secureTextEntry
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                style={[styles.mainBtn, loading && styles.btnDisabled]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#059669" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Text style={styles.btnText}>Bismillah, Daftar Sekarang</Text>
                                        <View style={styles.btnIconBox}>
                                            <ArrowRight size={16} color="#059669" />
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchText}>Sudah punya akun? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.switchLink}>Masuk Disini</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.footerSpacing} />
                    </ScrollView>

                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <Text style={styles.footerText}>© 2026 Kasir Berkah88. Mari Bergabung.</Text>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const InputGroup = ({ label, icon: Icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, multiline, autoCapitalize = 'sentences' }) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputField, multiline && styles.inputFieldMultiline]}>
            <Icon size={18} color="rgba(255,255,255,0.7)" style={multiline && { marginTop: 12 }} />
            <TextInput
                style={[styles.input, multiline && styles.inputMultiline]}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                selectionColor="#FFFFFF"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                autoCapitalize={autoCapitalize}
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    headerArea: {
        paddingHorizontal: 25,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 30,
        paddingTop: 20,
    },
    branding: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoBox: {
        width: 60,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    logoImage: {
        width: '60%',
        height: '60%',
    },
    placeholderLogoIcon: {
        width: 30,
        height: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 3,
    },
    placeholderLogoBar1: {
        width: 10,
        height: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        transform: [{ rotate: '45deg' }, { translateY: 3 }],
    },
    placeholderLogoBar2: {
        width: 10,
        height: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        transform: [{ rotate: '45deg' }, { translateY: -3 }],
    },
    welcomeTitle: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 5,
    },
    welcomeSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    formArea: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 18,
    },
    inputLabel: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 6,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    inputFieldMultiline: {
        height: 100,
        alignItems: 'flex-start',
    },
    input: {
        flex: 1,
        marginLeft: 10,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    inputMultiline: {
        paddingTop: 12,
        paddingBottom: 12,
    },
    mainBtn: {
        backgroundColor: '#FFFFFF',
        height: 58,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        ...Platform.select({
            web: { boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' },
            android: { elevation: 5 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 }
        })
    },
    btnDisabled: {
        opacity: 0.7,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    btnText: {
        color: '#059669',
        fontSize: 16,
        fontWeight: '900',
    },
    btnIconBox: {
        width: 24,
        height: 24,
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    switchText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    switchLink: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    footerSpacing: {
        height: 100,
    },
    footer: {
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'transparent',
    },
    footerText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    }
});

export default RegisterScreen;
