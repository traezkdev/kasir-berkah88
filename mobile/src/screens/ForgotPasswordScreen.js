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
    StatusBar,
    ScrollView
} from 'react-native';
import { ChevronLeft, Mail, Send, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../api/apiService';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const insets = useSafeAreaInsets();

    const handleSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Eror', 'Masukkan alamat email terlebih dahulu.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                Alert.alert('Gagal', data.error || 'Terjadi kesalahan. Coba lagi nanti.');
            }
        } catch (err) {
            Alert.alert('Eror', 'Kesalahan jaringan. Periksa koneksi Anda.');
        } finally {
            setLoading(false);
        }
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
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Icon */}
                        <View style={styles.iconBox}>
                            <Mail size={40} color="#FFFFFF" strokeWidth={1.5} />
                        </View>

                        <Text style={styles.title}>Lupa Kata Sandi?</Text>
                        <Text style={styles.subtitle}>
                            Masukkan email yang terdaftar. Kami akan mengirimkan link untuk mereset kata sandi Anda.
                        </Text>

                        {success ? (
                            <View style={styles.successCard}>
                                <CheckCircle size={40} color="#059669" />
                                <Text style={styles.successTitle}>Email Terkirim!</Text>
                                <Text style={styles.successText}>
                                    Jika email terdaftar, link reset password telah dikirim. Periksa folder spam jika tidak menemukan email.
                                </Text>
                                <TouchableOpacity
                                    style={styles.backToLoginBtn}
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={styles.backToLoginText}>Kembali ke Login</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.formArea}>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Alamat Email</Text>
                                    <View style={styles.inputField}>
                                        <Mail size={18} color="rgba(255,255,255,0.7)" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="email@contoh.com"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.mainBtn, loading && styles.btnDisabled]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#059669" />
                                    ) : (
                                        <View style={styles.btnContent}>
                                            <Text style={styles.btnText}>Kirim Link Reset</Text>
                                            <View style={styles.btnIconBox}>
                                                <Send size={14} color="#059669" />
                                            </View>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.backLink}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Text style={styles.backLinkText}>← Kembali ke Login</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <Text style={styles.footerText}>© 2026 Kasir Berkah88. Aplikasi POS Premium.</Text>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    headerArea: { paddingHorizontal: 25 },
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
        paddingBottom: 40,
        alignItems: 'center',
    },
    iconBox: {
        width: 90,
        height: 90,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 36,
        paddingHorizontal: 10,
    },
    formArea: { width: '100%' },
    inputWrapper: { marginBottom: 20 },
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
    mainBtn: {
        backgroundColor: '#FFFFFF',
        height: 58,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        ...Platform.select({
            web: { boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' },
            android: { elevation: 5 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 }
        })
    },
    btnDisabled: { opacity: 0.7, backgroundColor: 'rgba(255,255,255,0.8)' },
    btnContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    btnText: { color: '#059669', fontSize: 16, fontWeight: '900' },
    btnIconBox: {
        width: 24,
        height: 24,
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backLink: { alignItems: 'center', marginTop: 20 },
    backLinkText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700' },
    successCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    successTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        marginTop: 16,
        marginBottom: 10,
    },
    successText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    backToLoginBtn: {
        backgroundColor: '#FFFFFF',
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backToLoginText: { color: '#059669', fontSize: 15, fontWeight: '900' },
    footer: { alignItems: 'center' },
    footerText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default ForgotPasswordScreen;
