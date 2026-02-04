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
    Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { User, Lock, LogIn } from 'lucide-react-native';
import { API_URL } from '../api/apiService';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { logoUrl } = useAppSettings();

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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.inner}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={[styles.logoPlaceholder, logoUrl && styles.logoPlaceholderImage]}>
                        {logoUrl ? (
                            <Image
                                source={getLogoSource()}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <LogIn size={40} color="#138FEA" />
                        )}
                    </View>
                    <Text style={styles.title}>Kasir Berkah88</Text>
                    <Text style={styles.subtitle}>Selamat datang kembali, silakan login ke akun Anda.</Text>
                </View>

                {/* Form Section */}
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <User size={20} color="#94A3B8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#94A3B8"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#94A3B8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Masuk Sekarang</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotPass}>
                        <Text style={styles.forgotPassText}>Lupa Password?</Text>
                    </TouchableOpacity>

                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Belum punya akun? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerBtn}>Daftar Disini</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2024 Kasir Berkah88. All Rights Reserved.</Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#E0F2FE',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoPlaceholderImage: {
        backgroundColor: 'transparent', // Or keep white
        padding: 0,
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    form: {
        width: '100%',
        maxWidth: 400,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#1E293B',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#138FEA',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        // Gunakan boxShadow untuk standar terbaru (terutama Web)
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 12px rgba(19, 143, 234, 0.3)',
            },
            android: {
                elevation: 5,
            },
            ios: {
                shadowColor: '#138FEA',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            }
        })
    },
    buttonDisabled: {
        backgroundColor: '#94A3B8',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    forgotPass: {
        marginTop: 20,
        alignItems: 'center',
    },
    forgotPassText: {
        color: '#138FEA',
        fontSize: 14,
        fontWeight: '500',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        alignItems: 'center',
    },
    registerText: {
        color: '#64748B',
        fontSize: 14,
    },
    registerBtn: {
        color: '#138FEA',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 12,
    }
});

export default LoginScreen;
