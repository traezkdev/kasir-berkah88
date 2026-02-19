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
    Image,
    StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { User, Lock, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { API_URL } from '../api/apiService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { logoUrl } = useAppSettings();
    const insets = useSafeAreaInsets();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Eror', 'Silakan isi username dan password.');
            return;
        }

        setLoading(true);
        const result = await login(username, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Gagal Login', result.message);
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

                    <View style={styles.content}>
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
                            <Text style={styles.welcomeTitle}>Bismillah, Masuk Yuk</Text>
                            <Text style={styles.welcomeSubtitle}>Ayo lanjutin pesanan kamu dengan masuk ke akun</Text>
                        </View>

                        <View style={styles.formArea}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Nama Pengguna</Text>
                                <View style={styles.inputField}>
                                    <User size={18} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Masukkan nama pengguna"
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        selectionColor="#FFFFFF"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Kata Sandi</Text>
                                <View style={styles.inputField}>
                                    <Lock size={18} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Masukkan kata sandi"
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        selectionColor="#FFFFFF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.forgotBtn}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={styles.forgotText}>Lupa Kata Sandi?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.mainBtn, loading && styles.btnDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#059669" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Text style={styles.btnText}>Bismillah, Masuk</Text>
                                        <View style={styles.btnIconBox}>
                                            <ArrowRight size={16} color="#059669" />
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchText}>Belum punya akun? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.switchLink}>Daftar Disini</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <Text style={styles.footerText}>© 2026 Kasir Berkah88. Aplikasi POS Premium.</Text>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

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
    content: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    branding: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoBox: {
        width: 70,
        height: 70,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoImage: {
        width: '60%',
        height: '60%',
    },
    placeholderLogoIcon: {
        width: 40,
        height: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    placeholderLogoBar1: {
        width: 12,
        height: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        transform: [{ rotate: '45deg' }, { translateY: 4 }],
    },
    placeholderLogoBar2: {
        width: 12,
        height: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        transform: [{ rotate: '45deg' }, { translateY: -4 }],
    },
    welcomeTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    formArea: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 58,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 18,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    mainBtn: {
        backgroundColor: '#FFFFFF',
        height: 58,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginTop: 25,
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
    footer: {
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    }
});

export default LoginScreen;
