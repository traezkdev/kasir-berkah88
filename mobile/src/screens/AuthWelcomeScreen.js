import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
    StatusBar,
    Image,
    Modal,
    Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSettings } from '../context/AppSettingsContext';
import { API_URL } from '../api/apiService';
import { Info, X, ShoppingBag } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const AuthWelcomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { logoUrl, headerTitle } = useAppSettings();
    const [showInfo, setShowInfo] = React.useState(false);

    const getLogoSource = () => {
        if (!logoUrl) return null;
        if (logoUrl.startsWith('http')) return { uri: logoUrl };
        return { uri: `${API_URL}${logoUrl}` };
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" transparent backgroundColor="transparent" />
            <LinearGradient
                colors={['#3B82F6', '#60A5FA', '#DBEAFE']}
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

                {/* Central Logo Section */}
                <View style={styles.logoSection}>
                    <View style={styles.logoContainer}>
                        {logoUrl ? (
                            <Image
                                source={getLogoSource()}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.placeholderLogo}>
                                <View style={styles.placeholderLogoIcon}>
                                    <View style={styles.placeholderLogoBar1} />
                                    <View style={styles.placeholderLogoBar2} />
                                </View>
                            </View>
                        )}
                        <Text style={[
                            styles.placeholderLogoText,
                            headerTitle?.length > 10 && { fontSize: 16 }
                        ]}>
                            {headerTitle?.toUpperCase() || 'VISTA'}
                        </Text>
                    </View>
                </View>

                {/* Footer Section */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                    {/* Pagination Dots */}
                    <TouchableOpacity
                        style={styles.dotsContainer}
                        onPress={() => setShowInfo(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.dot} />
                        <View style={[styles.dot, styles.dotActive]} />
                        <View style={styles.dot} />
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.signInBtn}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.signInText}>Masuk Ke Akun</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.registerBtn}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.registerText}>Daftar Sekarang</Text>
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

                {/* Info Modal */}
                <Modal
                    visible={showInfo}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowInfo(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowInfo(false)}
                    >
                        <Pressable
                            style={styles.modalContent}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={styles.modalHeader}>
                                <View style={styles.infoIconContainer}>
                                    <Info size={24} color="#3B82F6" />
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowInfo(false)}
                                    style={styles.closeBtn}
                                >
                                    <X size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalBody}>
                                <Text style={styles.modalTitle}>Tentang Aplikasi</Text>
                                <Text style={styles.modalDescription}>
                                    Aplikasi <Text style={{ fontWeight: '900', color: '#1E40AF' }}>{headerTitle}</Text> ini ditujukan khusus bagi Anda yang ingin memesan berbagai pilihan kuliner lezat dengan cara yang lebih praktis, cepat, dan aman.
                                </Text>

                                <View style={styles.featureItem}>
                                    <View style={styles.featureIconBox}>
                                        <ShoppingBag size={18} color="#059669" />
                                    </View>
                                    <View style={styles.featureTextWrap}>
                                        <Text style={styles.featureTitle}>Pesan Instan</Text>
                                        <Text style={styles.featureDesc}>Pilih menu favorit Anda dan selesaikan pesanan dalam hitungan detik.</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.modalActionBtn}
                                    onPress={() => setShowInfo(false)}
                                >
                                    <Text style={styles.modalActionText}>Saya Mengerti</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
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
    logoSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 100,
        height: 100,
        marginBottom: 5,
    },
    placeholderLogo: {
        alignItems: 'center',
        height: 70,
    },
    placeholderLogoIcon: {
        width: 100,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 5,
    },
    placeholderLogoBar1: {
        width: 30,
        height: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        transform: [{ rotate: '45deg' }, { translateY: 10 }],
    },
    placeholderLogoBar2: {
        width: 30,
        height: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        transform: [{ rotate: '45deg' }, { translateY: -10 }],
    },
    placeholderLogoText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
    },
    brandName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        marginTop: 5,
        opacity: 0.9,
        letterSpacing: 3,
    },
    footer: {
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 35,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dotActive: {
        width: 16,
        backgroundColor: '#FFFFFF',
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
        color: '#3B82F6',
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
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        paddingBottom: 50,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 10 },
            android: { elevation: 20 }
        })
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    infoIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        width: '100%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 12,
    },
    modalDescription: {
        fontSize: 15,
        lineHeight: 22,
        color: '#64748B',
        marginBottom: 25,
    },
    featureItem: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 30,
        backgroundColor: '#F0FDF4',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    featureIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTextWrap: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#065F46',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 12,
        color: '#166534',
        lineHeight: 18,
    },
    modalActionBtn: {
        backgroundColor: '#3B82F6',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    modalActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    }
});

export default AuthWelcomeScreen;
