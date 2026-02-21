import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { getToken } from '../utils/auth';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
    const navigation = useNavigation();

    useEffect(() => {
        const checkAutoLogin = async () => {
            const token = await getToken();
            if (token) {
                navigation.replace('Main');
            }
        };
        checkAutoLogin();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                        <MessageCircle size={80} color="#fff" fill="#0088cc" />
                    </View>
                    <Text style={styles.title}>Vira Chat</Text>
                    <Text style={styles.subtitle}>Aplikasi chatting paling cepat, aman,{'\n'}dan gratis di dunia.</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginButtonText}>MASUK</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.registerButtonText}>DAFTAR SEKARANG</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>Versi 1.0.0 (Beta)</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 60,
        paddingHorizontal: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#0088cc',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#0088cc',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 25,
    },
    subtitle: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginTop: 15,
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    loginButton: {
        backgroundColor: '#0088cc',
        width: '100%',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    registerButton: {
        backgroundColor: '#f2f2f2',
        width: '100%',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#0088cc',
        fontSize: 14,
        fontWeight: '700',
    },
    footerText: {
        color: '#bbb',
        fontSize: 12,
    }
});

export default WelcomeScreen;
