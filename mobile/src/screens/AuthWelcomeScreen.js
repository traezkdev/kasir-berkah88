import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSettings } from '../context/AppSettingsContext';
import { API_URL } from '../api/apiService';

const { width } = Dimensions.get('window');

const AuthWelcomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { logoUrl, headerTitle } = useAppSettings();

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
                {/* Header Navigation */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                    <TouchableOpacity onPress={() => { }} style={styles.navBtn}>
                        <Text style={styles.navBtnText}>BERANDA</Text>
                    </TouchableOpacity>
                    {navigation.canGoBack() && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                            <Text style={styles.navBtnText}>KEMBALI</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Branding Section */}
                <View style={styles.brandingSection}>
                    <View style={styles.premiumLogoWrapper}>
                        {logoUrl ? (
                            <Image
                                source={getLogoSource()}
                                style={styles.premiumLogo}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.premiumPlaceholderLogo}>
                                <View style={styles.placeholderLogoBar1} />
                                <View style={styles.placeholderLogoBar2} />
                            </View>
                        )}
                    </View>
                    <View style={styles.premiumBrandingInfo}>
                        <Text style={styles.premiumBrandName}>
                            {headerTitle?.toUpperCase() || 'BERKAH 88'}
                        </Text>
                        <View style={styles.premiumBrandLine} />
                    </View>
                </View>

                {/* Footer Section */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.signInBtn}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.signInText}>Masuk Akun Member</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.guestBtn}
                            onPress={() => navigation.navigate('GuestCheckout')}
                        >
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.guestGradient}
                            >
                                <Text style={styles.guestText}>Pesan Tanpa Login (Delivery)</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.registerBtn}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.registerText}>Bismillah, Daftar Member</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Terms & Privacy */}
                    <View style={styles.termsContainer}>
                        <Text style={styles.termsText}>
                            Dengan melanjutkan, Anda menyetujui
                        </Text>
                        <View style={styles.linksRow}>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Ketentuan Layanan</Text>
                            </TouchableOpacity>
                            <Text style={styles.termsText}> dan </Text>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Kebijakan Privasi</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Home Indicator Placeholder */}
                    <View style={styles.homeIndicator} />
                </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
    },
    navBtn: {
        padding: 5,
    },
    navBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    brandingSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    premiumLogoWrapper: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    premiumLogo: {
        width: 130,
        height: 130,
    },
    premiumPlaceholderLogo: {
        width: 60,
        height: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    placeholderLogoBar1: {
        width: 20,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 4,
    },
    placeholderLogoBar2: {
        width: 20,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
    },
    premiumBrandingInfo: {
        alignItems: 'center',
    },
    premiumBrandName: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 12,
    },
    premiumBrandLine: {
        width: 40,
        height: 3,
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    footer: {
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
        marginBottom: 25,
    },
    signInBtn: {
        backgroundColor: '#FFFFFF',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' },
            android: { elevation: 5 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 }
        })
    },
    signInText: {
        color: '#059669',
        fontSize: 16,
        fontWeight: '900',
    },
    guestBtn: {
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        ...Platform.select({
            web: { boxShadow: '0px 10px 20px rgba(16,185,129,0.2)' },
            android: { elevation: 8 },
            ios: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 }
        })
    },
    guestGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guestText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    registerBtn: {
        backgroundColor: 'transparent',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    registerText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    termsContainer: {
        alignItems: 'center',
    },
    termsText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 10,
        fontWeight: '600',
    },
    linksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    linkText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    homeIndicator: {
        width: 130,
        height: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 10,
        marginTop: 30,
    }
});

export default AuthWelcomeScreen;
