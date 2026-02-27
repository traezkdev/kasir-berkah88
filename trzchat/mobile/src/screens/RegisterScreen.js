import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_URL } from '../config/api';
import { scale, verticalScale, moderateScale, hp } from '../utils/responsive';

const RegisterScreen = () => {
    const navigation = useNavigation();
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !username || !email || !password) {
            const errorMsg = 'Silakan isi kolom yang wajib (Nama, Username, Email, Kata Sandi)';
            if (Platform.OS === 'android') {
                ToastAndroid.show(errorMsg, ToastAndroid.SHORT);
            } else {
                Alert.alert('Error', errorMsg);
            }
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/register`, {
                username: username,
                email: email,
                password: password,
                fullName: fullName,
                phone: phone
            });

            const successMsg = 'Akun berhasil dibuat! Silakan masuk.';
            if (Platform.OS === 'android') {
                ToastAndroid.show(successMsg, ToastAndroid.SHORT);
            } else {
                Alert.alert('Sukses', successMsg);
            }
            navigation.navigate('Login');
        } catch (error) {
            console.log('Register Error Detail:', error.response?.data);
            const status = error.response?.status;
            const message = error.response?.data?.message || (status ? `Error ${status}: Gagal daftar` : 'Koneksi bermasalah');

            if (Platform.OS === 'android') {
                ToastAndroid.show(message, ToastAndroid.LONG);
            } else {
                Alert.alert('Gagal Daftar', message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light" translucent />

            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <View style={{ flex: 1 }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.topSection}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <ArrowLeft size={24} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.headerInfo}>
                                <Text style={styles.title}>Daftar Sekarang</Text>
                                <Text style={styles.subtitle}>Bergabunglah dengan komunitas kami dan mulai mengobrol.</Text>
                            </View>
                        </View>

                        <View style={styles.bottomSheet}>
                            <ScrollView
                                style={{ flex: 1 }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContent}
                            >
                                <View style={styles.formCard}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Nama Lengkap</Text>
                                        <View style={styles.inputWrapper}>
                                            <User size={20} color="#6366F1" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Nama Lengkap Anda"
                                                placeholderTextColor="#9CA3AF"
                                                value={fullName}
                                                onChangeText={setFullName}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Username</Text>
                                        <View style={styles.inputWrapper}>
                                            <User size={20} color="#6366F1" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Pilih username unik"
                                                placeholderTextColor="#9CA3AF"
                                                autoCapitalize="none"
                                                value={username}
                                                onChangeText={setUsername}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email</Text>
                                        <View style={styles.inputWrapper}>
                                            <Mail size={20} color="#6366F1" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="contoh@mail.com"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                value={email}
                                                onChangeText={setEmail}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Nomor Telepon</Text>
                                        <View style={styles.inputWrapper}>
                                            <Phone size={20} color="#6366F1" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="08xxxxxxxx"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="phone-pad"
                                                value={phone}
                                                onChangeText={setPhone}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Kata Sandi</Text>
                                        <View style={styles.inputWrapper}>
                                            <Lock size={20} color="#6366F1" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Minimal 6 karakter"
                                                placeholderTextColor="#9CA3AF"
                                                secureTextEntry={!showPassword}
                                                value={password}
                                                onChangeText={setPassword}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOff size={20} color="#6366F1" /> : <Eye size={20} color="#6366F1" />}
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <Text style={styles.termsText}>
                                        Dengan mendaftar, Anda menyetujui <Text style={styles.termsLink}>Syarat & Ketentuan</Text> kami.
                                    </Text>
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>

                    <View style={styles.actionFooter}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>DAFTAR SEKARANG</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Sudah punya akun? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.registerText}>Masuk Disini</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4F46E5',
    },
    topSection: {
        paddingHorizontal: scale(25),
        paddingTop: Platform.OS === 'android' ? verticalScale(20) : verticalScale(10),
        height: hp(25),
        justifyContent: 'space-between',
        paddingBottom: verticalScale(30),
    },
    backButton: {
        width: scale(44),
        height: scale(44),
        borderRadius: scale(22),
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: verticalScale(10),
    },
    headerInfo: {
        marginTop: verticalScale(5),
    },
    title: {
        fontSize: moderateScale(32),
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: moderateScale(15),
        color: 'rgba(255,255,255,0.8)',
        marginTop: verticalScale(8),
        lineHeight: moderateScale(22),
    },
    bottomSheet: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderTopLeftRadius: scale(35),
        borderTopRightRadius: scale(35),
        overflow: 'hidden',
    },
    scrollContent: {
        paddingHorizontal: scale(25),
        paddingTop: verticalScale(30),
        paddingBottom: verticalScale(20),
    },
    actionFooter: {
        paddingHorizontal: scale(25),
        paddingBottom: Platform.OS === 'ios' ? verticalScale(35) : verticalScale(25),
        paddingTop: verticalScale(15),
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
    },
    formCard: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: verticalScale(20),
    },
    label: {
        fontSize: moderateScale(14),
        fontWeight: '700',
        color: '#374151',
        marginBottom: verticalScale(12),
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: scale(18),
        paddingHorizontal: scale(16),
        height: verticalScale(60),
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    inputIcon: {
        marginRight: scale(12),
    },
    input: {
        flex: 1,
        fontSize: moderateScale(16),
        color: '#111827',
        fontWeight: '500',
    },
    termsText: {
        fontSize: moderateScale(12),
        color: '#6B7280',
        textAlign: 'center',
        marginVertical: verticalScale(20),
        lineHeight: moderateScale(18),
    },
    termsLink: {
        color: '#6366F1',
        fontWeight: 'bold',
    },
    submitButton: {
        height: verticalScale(60),
        borderRadius: scale(18),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: verticalScale(8) },
        shadowOpacity: 0.3,
        shadowRadius: scale(20),
        elevation: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: moderateScale(16),
        fontWeight: '800',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: verticalScale(20),
        alignItems: 'center',
    },
    footerText: {
        color: '#6B7280',
        fontSize: moderateScale(15),
        fontWeight: '500',
    },
    registerText: {
        color: '#6366F1',
        fontSize: moderateScale(15),
        fontWeight: '800',
    }
});

export default RegisterScreen;
