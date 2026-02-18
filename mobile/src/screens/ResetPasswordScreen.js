import React, { useState, useEffect } from 'react';
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
import { ChevronLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../api/apiService';

const ResetPasswordScreen = ({ navigation, route }) => {
    const token = route?.params?.token;
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!token) {
            Alert.alert(
                'Token Tidak Valid',
                'Link reset password tidak valid. Silakan minta link baru.',
                [{ text: 'OK', onPress: () => navigation.navigate('ForgotPassword') }]
            );
        }
    }, [token]);

    const getStrength = (pwd) => {
        if (pwd.length === 0) return null;
        if (pwd.length < 6) return { label: 'Terlalu Pendek', color: '#EF4444', pct: 0.25 };
        if (pwd.length < 8) return { label: 'Lemah', color: '#F97316', pct: 0.5 };
        if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) return { label: 'Kuat', color: '#10B981', pct: 1 };
        return { label: 'Sedang', color: '#EAB308', pct: 0.75 };
    };

    const strength = getStrength(newPassword);

    const handleSubmit = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Eror', 'Harap isi semua kolom.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Eror', 'Kata sandi tidak cocok. Periksa kembali.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Eror', 'Kata sandi minimal 6 karakter.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
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
                            <Lock size={40} color="#FFFFFF" strokeWidth={1.5} />
                        </View>

                        <Text style={styles.title}>Buat Kata Sandi Baru</Text>
                        <Text style={styles.subtitle}>
                            Masukkan kata sandi baru untuk akun Anda.
                        </Text>

                        {success ? (
                            <View style={styles.successCard}>
                                <CheckCircle size={48} color="#10B981" />
                                <Text style={styles.successTitle}>Berhasil!</Text>
                                <Text style={styles.successText}>
                                    Kata sandi berhasil diubah. Silakan login dengan kata sandi baru Anda.
                                </Text>
                                <TouchableOpacity
                                    style={styles.backToLoginBtn}
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={styles.backToLoginText}>Masuk Sekarang</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.formArea}>
                                {/* New Password */}
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Kata Sandi Baru</Text>
                                    <View style={styles.inputField}>
                                        <Lock size={18} color="rgba(255,255,255,0.7)" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Minimal 6 karakter"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            {showPassword
                                                ? <EyeOff size={18} color="rgba(255,255,255,0.6)" />
                                                : <Eye size={18} color="rgba(255,255,255,0.6)" />
                                            }
                                        </TouchableOpacity>
                                    </View>
                                    {/* Strength Bar */}
                                    {strength && (
                                        <View style={styles.strengthContainer}>
                                            <View style={styles.strengthBarBg}>
                                                <View style={[styles.strengthBarFill, {
                                                    width: `${strength.pct * 100}%`,
                                                    backgroundColor: strength.color
                                                }]} />
                                            </View>
                                            <Text style={[styles.strengthLabel, { color: strength.color }]}>
                                                {strength.label}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Confirm Password */}
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Konfirmasi Kata Sandi</Text>
                                    <View style={[
                                        styles.inputField,
                                        confirmPassword && confirmPassword !== newPassword && styles.inputFieldError,
                                        confirmPassword && confirmPassword === newPassword && styles.inputFieldSuccess,
                                    ]}>
                                        <Lock size={18} color="rgba(255,255,255,0.7)" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ketik ulang kata sandi"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showConfirm}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                            {showConfirm
                                                ? <EyeOff size={18} color="rgba(255,255,255,0.6)" />
                                                : <Eye size={18} color="rgba(255,255,255,0.6)" />
                                            }
                                        </TouchableOpacity>
                                    </View>
                                    {confirmPassword && confirmPassword === newPassword && (
                                        <Text style={styles.matchText}>✓ Kata sandi cocok</Text>
                                    )}
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
                                            <Text style={styles.btnText}>Simpan Kata Sandi Baru</Text>
                                        </View>
                                    )}
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
        fontSize: 26,
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
    inputFieldError: { borderColor: '#EF4444' },
    inputFieldSuccess: { borderColor: '#10B981' },
    input: {
        flex: 1,
        marginLeft: 12,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 10,
    },
    strengthBarBg: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthBarFill: {
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 11,
        fontWeight: '800',
    },
    matchText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 6,
        marginLeft: 4,
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
        fontSize: 24,
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

export default ResetPasswordScreen;
