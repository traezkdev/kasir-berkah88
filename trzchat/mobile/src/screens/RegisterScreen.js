import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { API_URL } from '../config/api';

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
            Alert.alert('Error', 'Silakan isi kolom yang wajib (Nama, Username, Email, Kata Sandi)');
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

            Alert.alert('Sukses', 'Akun berhasil dibuat! Silakan masuk.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
            // navigation.replace('Main'); // Jika ingin langsung masuk
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Gagal mendaftar. Coba lagi.';
            Alert.alert('Gagal Daftar', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Daftar Akun</Text>
                        <Text style={styles.subtitle}>Buat akun baru untuk mulai berkirim pesan dengan teman.</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nama Lengkap</Text>
                            <View style={styles.inputWrapper}>
                                <User size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan nama Anda"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputWrapper}>
                                <User size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Buat username unik"
                                    autoCapitalize="none"
                                    value={username}
                                    onChangeText={setUsername}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Mail size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="contoh@mail.com"
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
                                <Phone size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="+62 8xx xxxx xxxx"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Kata Sandi</Text>
                            <View style={styles.inputWrapper}>
                                <Lock size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Minimal 6 karakter"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={20} color="#888" /> : <Eye size={20} color="#888" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.termsText}>
                            Dengan mendaftar, Anda menyetujui <Text style={styles.termsLink}>Ketentuan Layanan</Text> dan <Text style={styles.termsLink}>Kebijakan Privasi</Text> kami.
                        </Text>

                        <TouchableOpacity
                            style={[styles.submitButton, loading && { opacity: 0.7 }]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>DAFTAR SEKARANG</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Sudah punya akun? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.registerText}>Masuk</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingBottom: 40,
    },
    backButton: {
        marginTop: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        color: '#777',
        marginTop: 10,
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#eee',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    termsText: {
        fontSize: 12,
        color: '#777',
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 18,
    },
    termsLink: {
        color: '#0088cc',
        fontWeight: '700',
    },
    submitButton: {
        backgroundColor: '#0088cc',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#0088cc',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#777',
        fontSize: 15,
    },
    registerText: {
        color: '#0088cc',
        fontSize: 15,
        fontWeight: 'bold',
    }
});

export default RegisterScreen;
