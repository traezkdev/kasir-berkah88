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
    FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSettings } from '../context/AppSettingsContext';
import { API_URL } from '../api/apiService';

const { width, height } = Dimensions.get('window');

const AuthWelcomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { logoUrl, headerTitle } = useAppSettings();
    const [activeSlide, setActiveSlide] = React.useState(0);

    const onboardingData = [
        {
            id: '1',
            title: 'Assalamu’alaikum',
            description: `Telah hadir ${headerTitle || 'Berkah 88'} buat nemenin hari kamu dengan menu-menu pilihan yang insyaAllah berkah.`,
            color: '#059669'
        },
        {
            id: '2',
            title: 'Menu Penuh Berkah',
            description: 'Banyak pilihan menu halal dan lezat yang siap bikin lidah kamu happy setiap hari.',
            color: '#10B981'
        },
        {
            id: '3',
            title: 'Layanan Amanah',
            description: 'Gak perlu antre lama, pesanan kamu langsung kami proses dengan cepat dan jujur.',
            color: '#10B981'
        }
    ];

    const getLogoSource = () => {
        if (!logoUrl) return null;
        if (logoUrl.startsWith('http')) return { uri: logoUrl };
        return { uri: `${API_URL}${logoUrl}` };
    };

    const renderSlide = ({ item }) => (
        <View style={styles.slide}>
            {/* Branding Section */}
            <View style={styles.premiumBranding}>
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

            {/* Content Section */}
            <View style={styles.premiumContentCard}>

                <Text style={styles.premiumGreeting}>{item.title}</Text>
                <View style={styles.premiumMessageWrapper}>
                    <Text style={styles.premiumMessage}>{item.description}</Text>
                </View>
            </View>
        </View>
    );

    const onScroll = (event) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        setActiveSlide(Math.round(index));
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

                {/* Onboarding Carousel */}
                <FlatList
                    data={onboardingData}
                    renderItem={renderSlide}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    style={styles.carousel}
                />

                {/* Footer Section */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                    {/* Pagination Dots */}
                    <View style={styles.dotsContainer}>
                        {onboardingData.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    activeSlide === index && styles.dotActive
                                ]}
                            />
                        ))}
                    </View>

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
    carousel: {
        flex: 1,
    },
    slide: {
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    premiumBranding: {
        alignItems: 'center',
        marginBottom: 50,
    },
    premiumLogoWrapper: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    premiumLogo: {
        width: 110,
        height: 110,
    },
    premiumPlaceholderLogo: {
        width: 60,
        height: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    premiumBrandingInfo: {
        alignItems: 'center',
    },
    premiumBrandName: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 10,
    },
    premiumBrandLine: {
        width: 40,
        height: 3,
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    premiumContentCard: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    premiumGreeting: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 15,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    premiumMessageWrapper: {
        paddingHorizontal: 20,
    },
    premiumMessage: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 26,
        fontWeight: '600',
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
