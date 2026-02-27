import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle, Zap, Shield, Globe } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from '../utils/auth';

import { scale, verticalScale, moderateScale } from '../utils/responsive';

const WelcomeScreen = () => {
    const navigation = useNavigation();

    useEffect(() => {
        const checkAutoLogin = async () => {
            const token = await getToken();
            if (token) {
                navigation.replace('Main');
            }
        };

        const task = InteractionManager.runAfterInteractions(() => {
            checkAutoLogin();
        });

        return () => task.cancel();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" translucent />
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
            >
                {/* Decorative Circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <View style={styles.circle3} />

                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        {/* Logo Section */}
                        <View style={styles.logoSection}>
                            <View style={styles.iconWrapper}>
                                <MessageCircle size={68} color="#fff" />
                            </View>
                            <Text style={styles.appName}>Vira Chat</Text>
                            <Text style={styles.tagline}>Terhubung lebih cepat, lebih aman,{'\n'}lebih bebas.</Text>
                        </View>

                        {/* Feature Pills */}
                        <View style={styles.featuresRow}>
                            <View style={styles.featurePill}>
                                <Zap size={14} color="#fff" />
                                <Text style={styles.featureText}>Super Cepat</Text>
                            </View>
                            <View style={styles.featurePill}>
                                <Shield size={14} color="#fff" />
                                <Text style={styles.featureText}>Aman & Privat</Text>
                            </View>
                            <View style={styles.featurePill}>
                                <Globe size={14} color="#fff" />
                                <Text style={styles.featureText}>Gratis</Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={styles.bottomCard}>
                            <Text style={styles.getStartedText}>Mulai Perjalananmu</Text>
                            <Text style={styles.getStartedSub}>Buat akun baru atau masuk ke akunmu</Text>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={() => navigation.navigate('Login')}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.loginGradient}
                                >
                                    <Text style={styles.loginButtonText}>MASUK</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={() => navigation.navigate('Register')}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.registerButtonText}>DAFTAR SEKARANG</Text>
                            </TouchableOpacity>

                            <Text style={styles.footerText}>Versi 1.0.0 (Beta) · Vira Chat</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientBackground: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    circle1: {
        position: 'absolute',
        width: scale(300),
        height: scale(300),
        borderRadius: scale(150),
        backgroundColor: 'rgba(255,255,255,0.06)',
        top: verticalScale(-80),
        right: scale(-80),
    },
    circle2: {
        position: 'absolute',
        width: scale(200),
        height: scale(200),
        borderRadius: scale(100),
        backgroundColor: 'rgba(255,255,255,0.05)',
        top: verticalScale(150),
        left: scale(-60),
    },
    circle3: {
        position: 'absolute',
        width: scale(120),
        height: scale(120),
        borderRadius: scale(60),
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: verticalScale(300),
        right: scale(30),
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: verticalScale(60),
    },
    logoSection: {
        alignItems: 'center',
        paddingHorizontal: scale(30),
    },
    iconWrapper: {
        width: scale(130),
        height: scale(130),
        borderRadius: scale(40),
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    appName: {
        fontSize: moderateScale(42),
        fontWeight: '900',
        color: '#fff',
        marginTop: verticalScale(24),
        letterSpacing: -1,
    },
    tagline: {
        fontSize: moderateScale(17),
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: verticalScale(12),
        lineHeight: moderateScale(25),
        fontWeight: '500',
    },
    featuresRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: scale(10),
        paddingHorizontal: scale(20),
        marginTop: verticalScale(20),
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: verticalScale(7),
        paddingHorizontal: scale(12),
        borderRadius: scale(30),
        gap: scale(5),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    featureText: {
        color: '#fff',
        fontSize: moderateScale(12),
        fontWeight: '700',
    },
    bottomCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: scale(40),
        borderTopRightRadius: scale(40),
        paddingHorizontal: scale(30),
        paddingTop: verticalScale(35),
        paddingBottom: verticalScale(40),
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(-5) },
        shadowOpacity: 0.1,
        shadowRadius: scale(20),
    },
    getStartedText: {
        fontSize: moderateScale(24),
        fontWeight: '900',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    getStartedSub: {
        fontSize: moderateScale(14),
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: verticalScale(8),
        marginBottom: verticalScale(28),
        fontWeight: '500',
    },
    loginButton: {
        borderRadius: scale(18),
        overflow: 'hidden',
        marginBottom: verticalScale(14),
        elevation: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: verticalScale(8) },
        shadowOpacity: 0.4,
        shadowRadius: scale(12),
    },
    loginGradient: {
        height: verticalScale(60),
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: moderateScale(17),
        fontWeight: '900',
        letterSpacing: 2,
    },
    registerButton: {
        backgroundColor: '#F3F4F6',
        height: verticalScale(60),
        borderRadius: scale(18),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(25),
    },
    registerButtonText: {
        color: '#6366F1',
        fontSize: moderateScale(15),
        fontWeight: '900',
        letterSpacing: 1,
    },
    footerText: {
        textAlign: 'center',
        color: '#D1D5DB',
        fontSize: moderateScale(12),
        fontWeight: '600',
    },
});

export default WelcomeScreen;
