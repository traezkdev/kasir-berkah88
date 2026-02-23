import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_URL } from '../config/api';
import { setToken } from '../utils/auth';

const LoginScreen = () => {
    const navigation = useNavigation();
    const [showPassword, setShowPassword] = useState(false);
    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!identity || !password) {
            Alert.alert('Error', 'Silakan isi semua kolom');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                identity: identity,
                password: password
            });
            const { token, user } = response.data;
            await setToken(token);
            if (user) {
                const { setUser } = require('../utils/auth');
                await setUser(user);
            }
            if (Platform.OS === 'android') {
                ToastAndroid.show('Berhasil masuk!', ToastAndroid.SHORT);
            }
            navigation.replace('Main');
        } catch (error) {
            console.log('Login Error Detail:', error.response?.data);
            const status = error.response?.status;
            const message = error.response?.data?.message || (status ? `Error ${status}: Gagal masuk` : 'Koneksi bermasalah');
            if (Platform.OS === 'android') {
                ToastAndroid.show(message, ToastAndroid.LONG);
            } else {
                Alert.alert('Gagal Masuk', message);
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

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                            <Text style={styles.title}>Selamat Datang!</Text>
                            <Text style={styles.subtitle}>Masuk untuk terhubung kembali dengan teman-teman Anda.</Text>
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
                                    <Text style={styles.label}>Username / Email</Text>
                                    <View style={styles.inputWrapper}>
                                        <Mail size={20} color="#6366F1" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Username atau Email"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="default"
                                            autoCapitalize="none"
                                            value={identity}
                                            onChangeText={setIdentity}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.label}>Kata Sandi</Text>
                                        <TouchableOpacity>
                                            <Text style={styles.forgotText}>Lupa?</Text>
                                        </TouchableOpacity>
                                    </View>
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
                            </View>
                        </ScrollView>

                        <View style={styles.actionFooter}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleLogin}
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
                                        <Text style={styles.submitButtonText}>MASUK SEKARANG</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Belum punya akun? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.registerText}>Daftar Disini</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>
                </KeyboardAvoidingView>
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
        paddingHorizontal: 25,
        paddingTop: Platform.OS === 'android' ? 20 : 0,
        height: '35%',
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    headerInfo: {
        marginTop: 10,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 12,
        lineHeight: 24,
    },
    bottomSheet: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        overflow: 'hidden',
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 35,
        paddingBottom: 20,
    },
    actionFooter: {
        paddingHorizontal: 25,
        paddingBottom: Platform.OS === 'ios' ? 35 : 25,
        paddingTop: 15,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
    },
    formCard: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },
    forgotText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingHorizontal: 16,
        height: 60,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    submitButton: {
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '500',
    },
    registerText: {
        color: '#6366F1',
        fontSize: 15,
        fontWeight: '800',
    }
});

export default LoginScreen;
