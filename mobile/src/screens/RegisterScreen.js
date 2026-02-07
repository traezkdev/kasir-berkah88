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
    ScrollView
} from 'react-native';
import { User, Lock, Phone, MapPin, ArrowRight, ArrowLeft } from 'lucide-react-native';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        username: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        const { username, phone, address, password, confirmPassword } = formData;

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
                address
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

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ArrowLeft size={24} color="#1E293B" />
                        </TouchableOpacity>
                        <View style={styles.headerTextWrap}>
                            <Text style={styles.title}>Buat Akun Baru</Text>
                            <Text style={styles.subtitle}>Lengkapi data diri Anda untuk bergabung</Text>
                        </View>
                    </View>

                    <View style={styles.form}>
                        <InputGroup
                            icon={User}
                            placeholder="Username"
                            value={formData.username}
                            onChangeText={(text) => setFormData({ ...formData, username: text })}
                        />
                        <InputGroup
                            icon={Phone}
                            placeholder="No. WhatsApp / HP"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            keyboardType="phone-pad"
                        />
                        <InputGroup
                            icon={MapPin}
                            placeholder="Alamat Lengkap"
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                            multiline
                        />
                        <InputGroup
                            icon={Lock}
                            placeholder="Kata Sandi"
                            value={formData.password}
                            onChangeText={(text) => setFormData({ ...formData, password: text })}
                            secureTextEntry
                        />
                        <InputGroup
                            icon={Lock}
                            placeholder="Konfirmasi Kata Sandi"
                            value={formData.confirmPassword}
                            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={styles.buttonText}>DAFTAR SEKARANG</Text>
                                    <ArrowRight size={20} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.loginLink}>
                            <Text style={styles.loginText}>Sudah punya akun? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginBtn}>MASUK DISINI</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer - Outside KeyboardAvoidingView to stay at bottom */}
            <View style={styles.footerOutside}>
                <Text style={styles.footerText}>© 2024 Kasir Berkah88. All Rights Reserved.</Text>
            </View>
        </View>
    );
};

const InputGroup = ({ icon: Icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, multiline }) => (
    <View style={[styles.inputContainer, multiline && styles.inputContainerMultiline]}>
        <Icon size={20} color="#94A3B8" style={[styles.inputIcon, multiline && { marginTop: 12 }]} />
        <TextInput
            style={[styles.input, multiline && styles.inputMultiline]}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 30,
        paddingTop: Platform.OS === 'android' ? 50 : 30,
    },
    header: {
        marginBottom: 30,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputContainerMultiline: {
        height: 100,
        alignItems: 'flex-start',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#1E293B',
        fontSize: 15,
        fontWeight: '600',
        height: '100%',
    },
    inputMultiline: {
        paddingTop: 12,
        paddingBottom: 12,
    },
    button: {
        backgroundColor: '#138FEA',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 24,
        ...Platform.select({
            web: { boxShadow: '0px 10px 20px rgba(19, 143, 234, 0.3)' },
            android: { elevation: 8 }
        })
    },
    buttonDisabled: {
        backgroundColor: '#94A3B8',
        elevation: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    loginLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#64748B',
        fontSize: 14,
    },
    loginBtn: {
        color: '#138FEA',
        fontWeight: '900',
        fontSize: 14,
    },
    footerOutside: {
        alignItems: 'center',
        paddingBottom: 20,
        backgroundColor: '#F8FAFC',
    },
    footerText: {
        color: '#CBD5E1',
        fontSize: 12,
        fontWeight: 'bold',
    }
});

export default RegisterScreen;
